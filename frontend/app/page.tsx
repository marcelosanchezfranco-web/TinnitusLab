"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import WaveVisualizer from "@/components/WaveVisualizer";

function fmtHz(f: number): string {
  if (f >= 10000) return `${Math.floor(f / 1000)}.${Math.floor((f % 1000) / 100)}k`;
  if (f >= 1000) return `${Math.floor(f / 1000)}.${String(Math.floor((f % 1000) / 100))}k`.replace(/\.0k$/, "k");
  return String(f);
}

function freqToLog(freq: number): number {
  const logMin = Math.log10(20);
  const logMax = Math.log10(20000);
  return ((Math.log10(freq) - logMin) / (logMax - logMin)) * 1000;
}

function logToFreq(val: number): number {
  const logMin = Math.log10(20);
  const logMax = Math.log10(20000);
  return Math.round(Math.pow(10, logMin + (val / 1000) * (logMax - logMin)));
}

export default function FrequencyDetector() {
  const router = useRouter();
  const [frequency, setFrequency] = useState(2700);
  const [sliderVal, setSliderVal] = useState(() => freqToLog(2700));
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  // Keep-alive: oscillator runs continuously; only gain is modulated
  const audioReadyRef = useRef(false);

  const initAudioGraph = useCallback((freq: number) => {
    if (audioReadyRef.current) return;
    const ctx = new AudioContext();

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-6, ctx.currentTime);
    compressor.knee.setValueAtTime(3, ctx.currentTime);
    compressor.ratio.setValueAtTime(4, ctx.currentTime);
    compressor.attack.setValueAtTime(0.002, ctx.currentTime);
    compressor.release.setValueAtTime(0.1, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    osc.connect(gain);
    gain.connect(compressor);
    compressor.connect(ctx.destination);
    osc.start();

    audioCtxRef.current = ctx;
    oscillatorRef.current = osc;
    gainRef.current = gain;
    audioReadyRef.current = true;
  }, []);

  const fadeIn = useCallback(() => {
    const ctx = audioCtxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain) return;
    if (ctx.state === "suspended") ctx.resume();
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.06);
  }, []);

  const fadeOut = useCallback(() => {
    const ctx = audioCtxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain) return;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      fadeOut();
      setIsPlaying(false);
    } else {
      initAudioGraph(frequency);
      fadeIn();
      setIsPlaying(true);
    }
  }, [isPlaying, frequency, initAudioGraph, fadeIn, fadeOut]);

  const handleSlider = useCallback(
    (val: number) => {
      const freq = logToFreq(val);
      setSliderVal(val);
      setFrequency(freq);
      if (oscillatorRef.current && audioCtxRef.current) {
        oscillatorRef.current.frequency.setTargetAtTime(
          freq,
          audioCtxRef.current.currentTime,
          0.008
        );
      }
    },
    []
  );

  const adjustByHz = useCallback(
    (delta: number) => {
      setFrequency((prev) => {
        const next = Math.max(20, Math.min(20000, prev + delta));
        setSliderVal(freqToLog(next));
        if (oscillatorRef.current && audioCtxRef.current) {
          oscillatorRef.current.frequency.setTargetAtTime(
            next,
            audioCtxRef.current.currentTime,
            0.005
          );
        }
        return next;
      });
    },
    []
  );

  const handleConfirm = () => {
    // Save history
    setHistory((prev) => {
      const next = [frequency, ...prev.filter((f) => f !== frequency)].slice(0, 5);
      return next;
    });
    // Save to localStorage and navigate
    if (typeof window !== "undefined") {
      localStorage.setItem("tinnitus_frequency", String(frequency));
    }
    fadeOut();
    setIsPlaying(false);
    router.push("/generator");
  };

  // Update history when frequency changes (only when playing)
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      setHistory((prev) => {
        if (prev[0] === frequency) return prev;
        return [frequency, ...prev.filter((f) => f !== frequency)].slice(0, 5);
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [frequency, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fadeOut();
      audioCtxRef.current?.close();
    };
  }, [fadeOut]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6"
          style={{
            backgroundColor: "#00ffcc10",
            border: "1px solid #00ffcc30",
            color: "#00ffcc",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" style={{ backgroundColor: "#00ff88" }}></span>
          Paso 1 de 3 — Detector de Frecuencia
        </div>
        <h1 className="text-4xl font-bold mb-4" style={{ color: "#e0e0ff" }}>
          Encuentra la frecuencia
          <br />
          <span className="neon-text-cyan">de tu tinnitus</span>
        </h1>
        <p className="text-lg" style={{ color: "#6060a0" }}>
          Ajusta el slider hasta que el tono suene <strong style={{ color: "#e0e0ff" }}>igual</strong> a tu pitido interno
        </p>
      </div>

      {/* Main card */}
      <div
        className="glass-card rounded-2xl p-8 mb-6"
        style={{ border: isPlaying ? "1px solid #00ffcc40" : "1px solid #1a1a2e" }}
      >
        {/* Frequency display */}
        <div className="text-center mb-8">
          <div
            className="font-mono font-bold mb-1"
            style={{
              fontSize: "clamp(3rem, 10vw, 6rem)",
              color: "#00ff88",
              textShadow: "0 0 20px #00ff88, 0 0 40px #00ff8860",
              lineHeight: 1,
            }}
          >
            {String(frequency)}
          </div>
          <div className="text-2xl font-mono" style={{ color: "#6060a0" }}>
            Hz
          </div>
          <div className="mt-2 text-sm" style={{ color: "#6060a0" }}>
            {frequency < 500
              ? "Grave"
              : frequency < 2000
              ? "Medio"
              : frequency < 8000
              ? "Agudo"
              : "Muy agudo"}
          </div>

          {/* Fine tune buttons */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <span className="text-xs mr-1" style={{ color: "#6060a0" }}>Ajuste fino:</span>
            {([-5, -1, 1, 5] as const).map((delta) => (
              <button
                key={delta}
                onClick={() => adjustByHz(delta)}
                className="font-mono text-sm px-3 py-1.5 rounded-lg transition-all duration-100 select-none"
                style={{
                  backgroundColor: "#00ffcc10",
                  border: "1px solid #00ffcc30",
                  color: "#00ffcc",
                  minWidth: "48px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#00ffcc20";
                  (e.currentTarget as HTMLElement).style.borderColor = "#00ffcc80";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#00ffcc10";
                  (e.currentTarget as HTMLElement).style.borderColor = "#00ffcc30";
                }}
              >
                {delta > 0 ? `+${delta}` : delta}
              </button>
            ))}
          </div>
        </div>

        {/* Wave visualizer */}
        <div className="mb-8">
          <WaveVisualizer isPlaying={isPlaying} frequency={frequency} />
        </div>

        {/* Slider */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-mono mb-3" style={{ color: "#6060a0" }}>
            <span>20 Hz</span>
            <span>Arrastra para ajustar</span>
            <span>20.000 Hz</span>
          </div>
          <input
            type="range"
            className="neon-slider w-full"
            min={0}
            max={1000}
            step={1}
            value={sliderVal}
            onChange={(e) => handleSlider(Number(e.target.value))}
          />
          {/* Frequency scale markers */}
          <div className="flex justify-between mt-1">
            {[100, 500, 1000, 4000, 8000, 20000].map((f) => (
              <button
                key={f}
                className="text-xs font-mono transition-colors"
                style={{ color: "#6060a0" }}
                onClick={() => {
                  const sv = freqToLog(f);
                  handleSlider(sv);
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#00ffcc")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#6060a0")}
              >
                {f >= 1000 ? `${f / 1000}k` : f}
              </button>
            ))}
          </div>
        </div>

        {/* Play button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-32 h-32 rounded-full font-bold text-lg transition-all duration-200"
            style={{
              backgroundColor: isPlaying ? "#00ffcc20" : "#00ffcc15",
              border: `3px solid ${isPlaying ? "#00ffcc" : "#00ffcc60"}`,
              color: isPlaying ? "#00ffcc" : "#00ffcc80",
              boxShadow: isPlaying
                ? "0 0 30px #00ffcc60, 0 0 60px #00ffcc30"
                : "none",
              transform: isPlaying ? "scale(1.05)" : "scale(1)",
            }}
          >
            {isPlaying ? (
              <>
                <div className="text-3xl mb-1">⏹</div>
                <div className="text-sm">STOP</div>
              </>
            ) : (
              <>
                <div className="text-3xl mb-1">▶</div>
                <div className="text-sm">PLAY</div>
              </>
            )}
          </button>

          <p className="text-sm text-center max-w-xs" style={{ color: "#6060a0" }}>
            {isPlaying
              ? "Mueve el slider lentamente hasta encontrar tu tono exacto"
              : "Pulsa PLAY para escuchar el tono y ajusta hasta que coincida con tu tinnitus"}
          </p>
        </div>
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        className="w-full py-5 rounded-2xl font-bold text-xl transition-all duration-200 mb-6"
        style={{
          backgroundColor: "#7b6ef615",
          border: "2px solid #7b6ef6",
          color: "#7b6ef6",
          boxShadow: "0 0 20px #7b6ef630",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "#7b6ef625";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px #7b6ef650";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "#7b6ef615";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px #7b6ef630";
        }}
      >
        Esta es mi frecuencia →
      </button>

      {/* History */}
      {history.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-medium mb-3" style={{ color: "#6060a0" }}>
            Frecuencias probadas recientemente
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.map((f) => (
              <button
                key={f}
                onClick={() => {
                  handleSlider(freqToLog(f));
                }}
                className="px-4 py-2 rounded-lg font-mono text-sm transition-all duration-150"
                style={{
                  backgroundColor: "#00ffcc10",
                  border: "1px solid #00ffcc30",
                  color: frequency === f ? "#00ffcc" : "#6060a0",
                }}
              >
                {String(f)} Hz
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tip */}
      <div
        className="mt-6 p-4 rounded-xl text-sm"
        style={{ backgroundColor: "#ff6b9d10", border: "1px solid #ff6b9d20", color: "#6060a0" }}
      >
        <strong style={{ color: "#ff6b9d" }}>Tip:</strong> La mayoría de tinnitus está entre 4.000 y 8.000 Hz.
        Empieza ahí y afina lentamente. Si no lo encuentras hoy, intenta en un lugar silencioso.
      </div>
    </div>
  );
}
