export type Track = {
  file: string;
  group: string;
  composer: string;
  title: string;
  performer: string;
  source: string;
  duration_s: number;
  rms_db: number;
  peak_db: number;
};

export const FT_MIN = 2000;
export const FT_MAX = 8000;

const TONE_S = 0.165;
const RAMP_S = 0.01;
const SEQ_S = 4 * TONE_S;
const ON_SEQUENCES = 3;
const OFF_SEQUENCES = 2;
const CYCLE_S = (ON_SEQUENCES + OFF_SEQUENCES) * SEQ_S;
const REF_RMS_DB = -26;
const LOOKAHEAD_S = 4;

export function mmidstFrequencies(ft: number): number[] {
  const r = 2 ** (2 / 3);
  return [0, 1, 2, 3].map((k) => ft * 0.5 * r ** k);
}

function shuffled4(): number[] {
  const a = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rampCurve(rising: boolean): Float32Array {
  const n = 32;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = 0.5 * (1 - Math.cos((Math.PI * i) / (n - 1)));
    c[i] = rising ? v : 1 - v;
  }
  return c;
}

function toneAmplitude(ratioDb: number): number {
  return Math.SQRT2 * 10 ** ((REF_RMS_DB + ratioDb) / 20);
}

function newContext(): AudioContext {
  try {
    return new AudioContext({ sampleRate: 48000 });
  } catch {
    return new AudioContext();
  }
}

function scheduleToneNode(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  t: number,
  rise: Float32Array,
  fall: Float32Array
) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  const env = ctx.createGain();
  env.gain.value = 0;
  env.gain.setValueCurveAtTime(rise, t, RAMP_S);
  env.gain.setValueCurveAtTime(fall, t + TONE_S - RAMP_S, RAMP_S);
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(t + TONE_S + 0.02);
}

export class ToneTester {
  private ctx: AudioContext | null = null;
  private rise = rampCurve(true);
  private fall = rampCurve(false);

  async play(freq: number, volume: number, ratioDb: number) {
    if (!this.ctx) this.ctx = newContext();
    const ctx = this.ctx;
    await ctx.resume();
    const master = ctx.createGain();
    master.gain.value = volume * volume;
    master.connect(ctx.destination);
    const bus = ctx.createGain();
    bus.gain.value = toneAmplitude(ratioDb);
    bus.connect(master);
    const t0 = ctx.currentTime + 0.05;
    for (let i = 0; i < 3; i++) {
      scheduleToneNode(ctx, bus, freq, t0 + i * 0.5, this.rise, this.fall);
    }
  }

  close() {
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}

export type StartOptions = {
  ft: number;
  playlist: Track[];
  volume: number;
  ratioDb: number;
  onTrackChange?: (t: Track | null) => void;
};

export class MmidstPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private toneBus: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private audio: HTMLAudioElement | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextCycle = 0;
  private freqs: number[] = [];
  private playlist: Track[] = [];
  private idx = 0;
  private onTrackChange?: (t: Track | null) => void;
  private rise = rampCurve(true);
  private fall = rampCurve(false);

  async start(o: StartOptions) {
    this.stop();
    const ctx = newContext();
    this.ctx = ctx;
    this.freqs = mmidstFrequencies(o.ft);
    this.playlist = o.playlist;
    this.onTrackChange = o.onTrackChange;
    this.idx = 0;

    this.master = ctx.createGain();
    this.master.gain.value = o.volume * o.volume;
    this.master.connect(ctx.destination);

    this.toneBus = ctx.createGain();
    this.toneBus.connect(this.master);
    this.setRatioDb(o.ratioDb);

    this.musicGain = ctx.createGain();
    this.musicGain.connect(this.master);

    if (this.playlist.length > 0) {
      const audio = new Audio();
      audio.preload = "auto";
      audio.addEventListener("ended", () => this.nextTrack());
      this.audio = audio;
      ctx.createMediaElementSource(audio).connect(this.musicGain);
      this.loadTrack();
      await audio.play();
    } else {
      this.onTrackChange?.(null);
    }

    this.nextCycle = ctx.currentTime + 0.3;
    this.tick();
    this.timer = setInterval(() => this.tick(), 500);
  }

  private loadTrack() {
    if (!this.audio || !this.musicGain || !this.ctx) return;
    const t = this.playlist[this.idx];
    const gainDb = Math.min(REF_RMS_DB - t.rms_db, -1 - t.peak_db);
    this.musicGain.gain.value = 10 ** (gainDb / 20);
    this.audio.src = `/music/${t.file}`;
    this.onTrackChange?.(t);
  }

  private nextTrack() {
    if (!this.audio) return;
    this.idx = (this.idx + 1) % this.playlist.length;
    this.loadTrack();
    this.audio.play().catch(() => {});
  }

  private tick() {
    const ctx = this.ctx;
    if (!ctx || !this.toneBus) return;
    while (this.nextCycle < ctx.currentTime + LOOKAHEAD_S) {
      let t = this.nextCycle;
      for (let s = 0; s < ON_SEQUENCES; s++) {
        for (const k of shuffled4()) {
          this.scheduleTone(this.freqs[k], t);
          t += TONE_S;
        }
      }
      this.nextCycle += CYCLE_S;
    }
  }

  private scheduleTone(freq: number, t: number) {
    scheduleToneNode(this.ctx!, this.toneBus!, freq, t, this.rise, this.fall);
  }

  setVolume(v: number) {
    this.master?.gain.setTargetAtTime(v * v, this.ctx!.currentTime, 0.05);
  }

  setRatioDb(db: number) {
    if (!this.toneBus || !this.ctx) return;
    this.toneBus.gain.setTargetAtTime(toneAmplitude(db), this.ctx.currentTime, 0.05);
  }

  getElapsed(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  async pause() {
    this.audio?.pause();
    await this.ctx?.suspend();
  }

  async resume() {
    await this.ctx?.resume();
    await this.audio?.play();
  }

  stop(fadeS = 0) {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const ctx = this.ctx;
    const audio = this.audio;
    const master = this.master;
    this.ctx = null;
    this.audio = null;
    if (!ctx) return;
    const close = () => {
      audio?.pause();
      ctx.close().catch(() => {});
    };
    if (fadeS > 0 && ctx.state === "running" && master) {
      master.gain.setTargetAtTime(0, ctx.currentTime, fadeS / 3);
      setTimeout(close, fadeS * 1000);
    } else {
      close();
    }
  }
}
