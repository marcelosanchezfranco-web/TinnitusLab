"""
TinnitusLab Audio Generator v2
"""

import numpy as np
import soundfile as sf
import io
from scipy import signal as sig

SAMPLE_RATE = 44100
CHUNK = 262_144   # ~6 seconds per processing chunk


# ─── Output ──────────────────────────────────────────────────────────────────

def to_wav_bytes(audio: np.ndarray, samplerate: int = SAMPLE_RATE) -> bytes:
    # Triangular dither reduces quantization noise before 16-bit conversion
    dither = (np.random.triangular(-1, 0, 1, audio.shape) / 32768.0).astype(np.float32)
    clipped = np.clip(audio + dither, -1.0, 1.0)
    buf = io.BytesIO()
    sf.write(buf, clipped, samplerate, format="WAV", subtype="PCM_16")
    return buf.getvalue()


def normalize(audio: np.ndarray, headroom: float = 0.88) -> np.ndarray:
    peak = np.max(np.abs(audio))
    if peak > 1e-8:
        audio = (audio / peak * headroom).astype(np.float32)
    return audio.astype(np.float32)


def apply_fade(audio: np.ndarray, fade_sec: float = 5.0, sr: int = SAMPLE_RATE) -> np.ndarray:
    """Raised-cosine (Hann) fade — smoother onset/offset than linear."""
    n = min(int(fade_sec * sr), len(audio) // 4)
    ramp = np.linspace(0, np.pi / 2, n, dtype=np.float32)
    fade_in  = np.sin(ramp) ** 2
    fade_out = np.cos(ramp) ** 2
    if audio.ndim == 2:
        fade_in  = fade_in[:, np.newaxis]
        fade_out = fade_out[:, np.newaxis]
    audio[:n]  *= fade_in
    audio[-n:] *= fade_out
    return audio


# ─── Noise generators ────────────────────────────────────────────────────────

def generate_pink_noise(n_samples: int) -> np.ndarray:
    """
    IIR-filtered white noise (Paul Kellet coefficients).
    Processed in chunks with continuous filter state — no inter-chunk artifacts.
    """
    b = np.array([0.049922035, -0.095993537, 0.050612699, -0.004408786])
    a = np.array([1.0, -2.494956002,  2.017265875, -0.522189400])
    zi = sig.lfilter_zi(b, a)
    out = np.empty(n_samples, dtype=np.float32)
    pos = 0
    while pos < n_samples:
        size = min(CHUNK, n_samples - pos)
        white = np.random.randn(size)
        chunk, zi = sig.lfilter(b, a, white, zi=zi)
        out[pos:pos + size] = chunk.astype(np.float32)
        pos += size
    return out


def generate_brown_noise(n_samples: int) -> np.ndarray:
    """
    Chunked cumulative sum maintains running total — continuous, no restarts.
    DC drift is removed at the end.
    """
    out = np.empty(n_samples, dtype=np.float32)
    running = 0.0
    pos = 0
    while pos < n_samples:
        size = min(CHUNK, n_samples - pos)
        white = np.random.randn(size)
        chunk = np.cumsum(white) + running
        running = float(chunk[-1])
        out[pos:pos + size] = chunk.astype(np.float32)
        pos += size
    out -= np.mean(out)   # remove DC drift from cumsum
    return out


# ─── Notch filter ────────────────────────────────────────────────────────────

def apply_notch(audio: np.ndarray, notch_freq: float, bandwidth: float,
                sr: int = SAMPLE_RATE) -> np.ndarray:
    """
    2nd-order Butterworth bandstop. Lower order = less ringing than order 4.
    """
    low  = max(notch_freq - bandwidth / 2, 20.0)
    high = min(notch_freq + bandwidth / 2, sr / 2 - 1)
    if low >= high or notch_freq <= 0:
        return audio
    sos = sig.butter(2, [low / (sr / 2), high / (sr / 2)],
                     btype="bandstop", output="sos")
    return sig.sosfilt(sos, audio).astype(np.float32)


# ─── AM envelope ─────────────────────────────────────────────────────────────

def am_envelope(n_samples: int, mod_freq: float, sr: int = SAMPLE_RATE) -> np.ndarray:
    t = np.arange(n_samples, dtype=np.float32) / sr
    return (0.5 + 0.5 * np.sin(2 * np.pi * mod_freq * t)).astype(np.float32)


# ─── Public entry point ───────────────────────────────────────────────────────

def generate_audio(frequency: float, audio_type: str, duration_minutes: int,
                   notch_bandwidth: int, modulation_freq: float) -> bytes:
    n = duration_minutes * 60 * SAMPLE_RATE
    dispatch = {
        "pink_noise":   lambda: _pink_noise(n, frequency, notch_bandwidth, modulation_freq),
        "am_tones":     lambda: _am_tones(n, frequency, notch_bandwidth, modulation_freq),
        "brown_noise":  lambda: _brown_noise(n, frequency, notch_bandwidth),
        "binaural_40hz": lambda: _binaural(n, frequency, notch_bandwidth, 40.0),
        "binaural_10hz": lambda: _binaural(n, frequency, notch_bandwidth, 10.0),
        "chirp_sweep":  lambda: _chirp(n, frequency, notch_bandwidth),
    }
    fn = dispatch.get(audio_type)
    if fn is None:
        raise ValueError(f"Unknown audio type: {audio_type}")
    return fn()


# ─── Individual generators ───────────────────────────────────────────────────

def _pink_noise(n: int, freq: float, bw: int, mod_freq: float) -> bytes:
    audio = generate_pink_noise(n)
    audio = apply_notch(audio, freq, bw)
    audio *= am_envelope(n, mod_freq)
    return to_wav_bytes(apply_fade(normalize(audio)))


def _am_tones(n: int, freq: float, bw: int, mod_freq: float) -> bytes:
    """
    FFT synthesis of tone bank: build exactly 1 second at 44100 Hz → 1 Hz bins.
    Integer-Hz tones are phase-periodic over 1 s → seamless tiling, zero artifacts.
    Random initial phases per tone → low crest factor (avoids additive peaks).
    """
    N = SAMPLE_RATE  # 1-second FFT: bin k = k Hz
    spectrum = np.zeros(N // 2 + 1, dtype=np.complex64)

    active_bins = [
        k for k in range(200, N // 2, 100)
        if not (freq - bw <= k <= freq + bw)
    ]
    rng_phases = np.random.uniform(0, 2 * np.pi, len(active_bins))
    for k, ph in zip(active_bins, rng_phases):
        spectrum[k] = np.exp(1j * ph)

    n_tones = len(active_bins)
    if n_tones > 0:
        # RMS of sum of N random-phase unit sines ≈ sqrt(N/2); scale to RMS ~0.5
        spectrum /= np.sqrt(n_tones / 2)

    tile = np.fft.irfft(spectrum, n=N).astype(np.float32)

    repeats = int(np.ceil(n / N))
    audio = np.tile(tile, repeats)[:n]
    audio *= am_envelope(n, mod_freq)
    return to_wav_bytes(apply_fade(normalize(audio)))


def _brown_noise(n: int, freq: float, bw: int) -> bytes:
    audio = generate_brown_noise(n)
    audio = apply_notch(audio, freq, bw)
    return to_wav_bytes(apply_fade(normalize(audio)))


def _binaural(n: int, freq: float, bw: int, beat_freq: float) -> bytes:
    """
    Stereo binaural: pink noise base (with notch) + carrier tone.
    Left: carrier Hz  |  Right: carrier + beat_freq Hz
    Carrier sits at 200 Hz, well away from tinnitus range.
    """
    carrier = 200.0
    pink = generate_pink_noise(n)
    pink = apply_notch(pink, freq, bw)
    pink = normalize(pink, headroom=0.55)

    stereo = np.empty((n, 2), dtype=np.float32)
    pos = 0
    while pos < n:
        size = min(CHUNK, n - pos)
        t_chunk = (pos + np.arange(size, dtype=np.float64)) / SAMPLE_RATE
        stereo[pos:pos + size, 0] = (
            pink[pos:pos + size]
            + (0.2 * np.sin(2 * np.pi * carrier * t_chunk)).astype(np.float32)
        )
        stereo[pos:pos + size, 1] = (
            pink[pos:pos + size]
            + (0.2 * np.sin(2 * np.pi * (carrier + beat_freq) * t_chunk)).astype(np.float32)
        )
        pos += size

    return to_wav_bytes(apply_fade(normalize(stereo)))


def _chirp(n: int, freq: float, bw: int) -> bytes:
    """
    Phase-continuous logarithmic sweep via instantaneous frequency integration.
    No tiling → no phase resets → no clicks at cycle boundaries.
    """
    cycle_dur = 30.0
    f_start   = 200.0
    f_end     = min(freq * 2, 16000.0)
    dt        = 1.0 / SAMPLE_RATE
    log_ratio = np.log(f_end / f_start)

    audio  = np.empty(n, dtype=np.float32)
    phase  = 0.0
    offset = 0
    pos    = 0

    while pos < n:
        size    = min(CHUNK, n - pos)
        t_chunk = (offset + np.arange(size, dtype=np.float64)) * dt
        # Triangle envelope: 0 → 1 → 0 over cycle_dur seconds
        cycle_pos = (t_chunk / cycle_dur) % 1.0
        tri       = np.where(cycle_pos < 0.5, cycle_pos * 2.0, 2.0 - cycle_pos * 2.0)
        inst_freq = f_start * np.exp(tri * log_ratio)
        # Integrate phase from last known value
        phases = phase + np.cumsum(2 * np.pi * inst_freq * dt)
        phase  = float(phases[-1])
        audio[pos:pos + size] = np.sin(phases).astype(np.float32)
        offset += size
        pos    += size

    audio = apply_notch(audio, freq, bw)
    return to_wav_bytes(apply_fade(normalize(audio)))
