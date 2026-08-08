"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AUDIO_TYPES = [
  {
    id: "pink_noise",
    name: "Pink Noise + Notch",
    icon: "🌊",
    color: "#00ffcc",
    use: "Fondo, trabajo, sesiones largas",
    description:
      "Ruido rosa con un hueco preciso en tu frecuencia. Suave y continuo, ideal para escuchar durante horas sin fatiga.",
    tier: 1,
    tierLabel: "Más evidencia",
    hasModulation: false,
    hasBandwidth: true,
  },
  {
    id: "am_tones",
    name: "AM Tones",
    icon: "🎵",
    color: "#7b6ef6",
    use: "Sesiones dedicadas de 20–30 min",
    description:
      "Banco de tonos puros modulados, con hueco en tu frecuencia. Más activo e intenso que el ruido rosa. Estimula la plasticidad auditiva.",
    tier: 1,
    tierLabel: "Más evidencia",
    hasModulation: true,
    hasBandwidth: true,
  },
  {
    id: "brown_noise",
    name: "Brown Noise + Notch",
    icon: "🌑",
    color: "#ff6b9d",
    use: "Noche, antes de dormir",
    description:
      "Ruido marrón: más grave y profundo que el rosa. Ideal para relajarse antes de dormir sin estimular demasiado.",
    tier: 2,
    tierLabel: "Complementario",
    hasModulation: false,
    hasBandwidth: true,
  },
  {
    id: "binaural_40hz",
    name: "Binaural 40 Hz + Pink",
    icon: "🧠",
    color: "#00ff88",
    use: "Sesión dedicada con audífonos",
    description:
      "Ruido rosa estéreo con frecuencia binaural gamma de 40 Hz (diferencia entre oídos). Respaldado por estudios 2024 sobre neuroplasticidad gamma.",
    tier: 2,
    tierLabel: "Complementario",
    hasModulation: false,
    hasBandwidth: true,
    requiresHeadphones: true,
  },
  {
    id: "chirp_sweep",
    name: "Chirp Sweep + Notch",
    icon: "📡",
    color: "#ffb347",
    use: "Variación, sesiones activas",
    description:
      "Barre frecuencias desde 200 Hz hasta tu límite auditivo y vuelve en ciclos de 30 s. Estimula más rango de la corteza auditiva.",
    tier: 3,
    tierLabel: "Variación",
    hasModulation: false,
    hasBandwidth: true,
  },
  {
    id: "binaural_10hz",
    name: "Pink Noise + Binaural 10 Hz",
    icon: "🌀",
    color: "#c084fc",
    use: "Relajación profunda con audífonos",
    description:
      "Igual que el binaural gamma pero con 10 Hz (frecuencia alpha). Más relajante, ideal para meditación o descanso.",
    tier: 3,
    tierLabel: "Variación",
    hasModulation: false,
    hasBandwidth: true,
    requiresHeadphones: true,
  },
];

const DURATIONS = [
  { value: 15, label: "15 min", tip: "Sesión corta" },
  { value: 30, label: "30 min", tip: "Sesión estándar", recommended: true },
  { value: 45, label: "45 min", tip: "Sesión larga" },
  { value: 60, label: "60 min", tip: "Sesión completa" },
];
const BANDWIDTHS = [
  { label: "Estrecho", value: 300, desc: "±300 Hz", tip: "Tono muy preciso y estable" },
  { label: "Medio",    value: 500, desc: "±500 Hz", tip: "Equilibrio efectividad/calidad", recommended: true },
  { label: "Ancho",    value: 800, desc: "±800 Hz", tip: "Tinnitus difuso o impreciso" },
];
const MODULATIONS = [
  { value: 8,  label: "8 Hz",  tip: "Theta/Alpha" },
  { value: 10, label: "10 Hz", tip: "Alpha — relajación", recommended: true },
  { value: 12, label: "12 Hz", tip: "Alpha alto" },
];

type GenerationStatus = "idle" | "generating" | "done" | "error";

export default function GeneratorPage() {
  const router = useRouter();
  const [savedFreq, setSavedFreq] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState(AUDIO_TYPES[0]);
  const [duration, setDuration] = useState(30);
  const [bandwidth, setBandwidth] = useState(500);
  const [modulation, setModulation] = useState(10);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const freq = localStorage.getItem("tinnitus_frequency");
    if (freq) {
      setSavedFreq(Number(freq));
    }
  }, []);

  const generate = async () => {
    if (!savedFreq) return;
    setStatus("generating");
    setProgress(0);
    setDownloadUrl(null);
    setError("");

    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 88) {
          clearInterval(interval);
          return 88;
        }
        return p + Math.random() * 4;
      });
    }, 400);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequency: savedFreq,
          type: selectedType.id,
          duration_minutes: duration,
          notch_bandwidth: bandwidth,
          modulation_freq: modulation,
        }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Error generando audio");
      }

      setProgress(100);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus("done");
    } catch (err) {
      clearInterval(interval);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const fileName = savedFreq
    ? `TinnitusLab_${selectedType.id}_${savedFreq}Hz_${duration}min.wav`
    : "TinnitusLab_audio.wav";

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6"
          style={{
            backgroundColor: "#7b6ef610",
            border: "1px solid #7b6ef630",
            color: "#7b6ef6",
          }}
        >
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#7b6ef6" }}></span>
          Paso 2 de 3 — Generador de Audio
        </div>
        <h1 className="text-4xl font-bold mb-4" style={{ color: "#e0e0ff" }}>
          Configura tu{" "}
          <span className="neon-text-violet">audio personalizado</span>
        </h1>

        {savedFreq ? (
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl mt-2"
            style={{ backgroundColor: "#00ffcc10", border: "1px solid #00ffcc30" }}
          >
            <span style={{ color: "#6060a0" }}>Tu frecuencia:</span>
            <span className="font-mono font-bold text-2xl neon-text-green">
              {String(savedFreq)} Hz
            </span>
            <button
              onClick={() => router.push("/")}
              className="text-xs px-2 py-1 rounded"
              style={{ color: "#6060a0", border: "1px solid #1a1a2e" }}
            >
              cambiar
            </button>
          </div>
        ) : (
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl mt-2 cursor-pointer"
            style={{ backgroundColor: "#ff6b9d10", border: "1px solid #ff6b9d30" }}
            onClick={() => router.push("/")}
          >
            <span style={{ color: "#ff6b9d" }}>⚠ No has detectado tu frecuencia todavía →</span>
          </div>
        )}
      </div>

      {/* Audio type selector */}
      <h2 className="text-lg font-semibold mb-4" style={{ color: "#e0e0ff" }}>
        Tipo de audio
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {AUDIO_TYPES.map((type) => {
          const active = selectedType.id === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type)}
              className="glass-card rounded-xl p-5 text-left transition-all duration-200"
              style={{
                border: active ? `1px solid ${type.color}60` : "1px solid #1a1a2e",
                backgroundColor: active ? `${type.color}08` : "rgba(15,15,26,0.8)",
                boxShadow: active ? `0 0 20px ${type.color}20` : "none",
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{type.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="font-semibold text-sm"
                      style={{ color: active ? type.color : "#e0e0ff" }}
                    >
                      {type.name}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={
                        type.tier === 1
                          ? { backgroundColor: "#00ffcc18", color: "#00ffcc", border: "1px solid #00ffcc40" }
                          : type.tier === 2
                          ? { backgroundColor: "#7b6ef618", color: "#7b6ef6", border: "1px solid #7b6ef640" }
                          : { backgroundColor: "#6060a018", color: "#9090c0", border: "1px solid #6060a030" }
                      }
                    >
                      {type.tier === 1 ? "★ Esencial" : type.tier === 2 ? "◆ Complementario" : "◇ Variación"}
                    </span>
                    {type.requiresHeadphones && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "#ff6b9d15",
                          color: "#ff6b9d",
                          border: "1px solid #ff6b9d30",
                        }}
                      >
                        🎧 audífonos
                      </span>
                    )}
                  </div>
                  <p className="text-xs mb-2" style={{ color: "#6060a0" }}>
                    {type.description}
                  </p>
                  <span
                    className="text-xs"
                    style={{ color: active ? type.color : "#6060a0" }}
                  >
                    📅 {type.use}
                  </span>
                </div>
                {active && (
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: type.color, boxShadow: `0 0 8px ${type.color}` }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Duration */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#e0e0ff" }}>
            ⏱ Duración
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className="flex flex-col items-center py-3 px-2 rounded-lg transition-all duration-150"
                style={{
                  backgroundColor: duration === d.value ? "#7b6ef620" : "#0f0f1a",
                  border: `1px solid ${duration === d.value ? "#7b6ef6" : "#1a1a2e"}`,
                  boxShadow: duration === d.value ? "0 0 10px #7b6ef630" : "none",
                }}
              >
                <span className="font-mono font-medium text-sm" style={{ color: duration === d.value ? "#7b6ef6" : "#e0e0ff" }}>
                  {d.label}
                </span>
                {d.recommended ? (
                  <span className="text-xs mt-0.5 px-1.5 py-0.5 rounded" style={{ backgroundColor: "#7b6ef620", color: "#7b6ef6" }}>
                    recomendado
                  </span>
                ) : (
                  <span className="text-xs mt-0.5" style={{ color: "#6060a0" }}>{d.tip}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notch bandwidth */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#e0e0ff" }}>
            🎯 Ancho de notch
          </h3>
          <div className="flex flex-col gap-2">
            {BANDWIDTHS.map((b) => (
              <button
                key={b.value}
                onClick={() => setBandwidth(b.value)}
                className="flex flex-col px-4 py-3 rounded-lg transition-all duration-150 text-left"
                style={{
                  backgroundColor: bandwidth === b.value ? "#00ffcc15" : "#0f0f1a",
                  border: `1px solid ${bandwidth === b.value ? "#00ffcc60" : "#1a1a2e"}`,
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: bandwidth === b.value ? "#00ffcc" : "#e0e0ff" }}>
                      {b.label}
                    </span>
                    {b.recommended && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#00ffcc20", color: "#00ffcc" }}>
                        recomendado
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs" style={{ color: "#6060a0" }}>{b.desc}</span>
                </div>
                <span className="text-xs mt-0.5" style={{ color: "#6060a0" }}>{b.tip}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modulation */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-1" style={{ color: "#e0e0ff" }}>
            〰 Modulación AM
          </h3>
          <p className="text-xs mb-4" style={{ color: "#6060a0" }}>
            {selectedType.hasModulation
              ? "Frecuencia del pulso rítmico"
              : "Se aplica internamente en la síntesis"}
          </p>
          <div className="flex flex-col gap-2">
            {MODULATIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => setModulation(m.value)}
                className="flex flex-col px-4 py-3 rounded-lg transition-all duration-150 text-left"
                style={{
                  backgroundColor: modulation === m.value ? "#ff6b9d15" : "#0f0f1a",
                  border: `1px solid ${modulation === m.value ? "#ff6b9d60" : "#1a1a2e"}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-sm" style={{ color: modulation === m.value ? "#ff6b9d" : "#e0e0ff" }}>
                    {m.label}
                  </span>
                  {m.recommended && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#ff6b9d20", color: "#ff6b9d" }}>
                      recomendado
                    </span>
                  )}
                </div>
                <span className="text-xs mt-0.5" style={{ color: "#6060a0" }}>{m.tip}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      {savedFreq && (
        <div
          className="glass-card rounded-xl p-5 mb-6 flex flex-wrap gap-4"
          style={{ border: "1px solid #7b6ef630" }}
        >
          <div className="text-sm" style={{ color: "#6060a0" }}>
            <span className="font-medium" style={{ color: "#e0e0ff" }}>Resumen:</span>{" "}
            <span style={{ color: selectedType.color }}>{selectedType.name}</span>
            {" · "}
            <span className="font-mono neon-text-green">{String(savedFreq)} Hz</span>
            {" · "}
            <span>{duration} min</span>
            {" · "}
            <span>Notch ±{bandwidth} Hz</span>
          </div>
        </div>
      )}

      {/* Generate button */}
      {status === "idle" || status === "error" ? (
        <button
          onClick={generate}
          disabled={!savedFreq}
          className="w-full py-6 rounded-2xl font-bold text-2xl transition-all duration-200"
          style={{
            backgroundColor: savedFreq ? "#00ffcc15" : "#1a1a2e",
            border: `2px solid ${savedFreq ? "#00ffcc" : "#1a1a2e"}`,
            color: savedFreq ? "#00ffcc" : "#6060a0",
            boxShadow: savedFreq ? "0 0 30px #00ffcc30" : "none",
            cursor: savedFreq ? "pointer" : "not-allowed",
          }}
          onMouseEnter={(e) => {
            if (!savedFreq) return;
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 50px #00ffcc50";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = savedFreq ? "0 0 30px #00ffcc30" : "none";
          }}
        >
          {status === "error" ? "⚠ Reintentar generación" : "⚡ GENERAR MI AUDIO"}
        </button>
      ) : null}

      {status === "error" && (
        <p className="text-center mt-3 text-sm" style={{ color: "#ff6b9d" }}>
          Error: {error}
        </p>
      )}

      {/* Progress bar */}
      {status === "generating" && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2" style={{ color: "#6060a0" }}>
            <span>Generando tu audio personalizado...</span>
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: "8px", backgroundColor: "#1a1a2e" }}
          >
            <div
              className="h-full rounded-full progress-bar-animated transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: "#6060a0" }}>
            {duration} minutos de audio · Procesando en servidor...
          </p>
        </div>
      )}

      {/* Download */}
      {status === "done" && downloadUrl && (
        <div
          className="mt-6 p-6 rounded-2xl text-center"
          style={{ backgroundColor: "#00ffcc10", border: "2px solid #00ffcc40" }}
        >
          <div className="text-4xl mb-3">✅</div>
          <h3 className="font-bold text-xl mb-2 neon-text-cyan">
            ¡Tu audio está listo!
          </h3>
          <p className="text-sm mb-5" style={{ color: "#6060a0" }}>
            {duration} minutos de terapia personalizada para {savedFreq} Hz
          </p>
          <a
            href={downloadUrl}
            download={fileName}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200"
            style={{
              backgroundColor: "#00ffcc20",
              border: "2px solid #00ffcc",
              color: "#00ffcc",
              boxShadow: "0 0 20px #00ffcc40",
              textDecoration: "none",
            }}
          >
            ⬇ Descargar WAV
          </a>
          <p className="text-xs mt-4" style={{ color: "#6060a0" }}>
            Archivo WAV 44.100 Hz, 16-bit · {(duration * 44100 * 2 * 2) / 1_000_000 | 0} MB aprox.
          </p>
          <button
            onClick={() => {
              setStatus("idle");
              setDownloadUrl(null);
            }}
            className="block mx-auto mt-4 text-sm"
            style={{ color: "#6060a0" }}
          >
            Generar otro →
          </button>
        </div>
      )}

      {/* Guide link */}
      <div
        className="mt-8 p-5 rounded-xl flex items-center justify-between"
        style={{ backgroundColor: "#7b6ef610", border: "1px solid #7b6ef630" }}
      >
        <div>
          <p className="font-medium" style={{ color: "#7b6ef6" }}>
            ¿Cómo usar el audio generado?
          </p>
          <p className="text-sm" style={{ color: "#6060a0" }}>
            Lee el protocolo de 12 semanas con horarios y seguimiento
          </p>
        </div>
        <a
          href="/guide"
          className="px-5 py-2 rounded-xl font-medium transition-all duration-150"
          style={{
            backgroundColor: "#7b6ef620",
            border: "1px solid #7b6ef660",
            color: "#7b6ef6",
            textDecoration: "none",
          }}
        >
          Ver guía →
        </a>
      </div>
    </div>
  );
}
