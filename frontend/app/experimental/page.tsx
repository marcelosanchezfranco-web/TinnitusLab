"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FT_MAX,
  FT_MIN,
  MmidstPlayer,
  ToneTester,
  mmidstFrequencies,
  type Track,
} from "@/lib/mmidst";

const GROUPS = [
  { id: "bach_goldberg", name: "Bach — Variaciones Goldberg", desc: "Piano solo, la opción más estable", color: "#00ffcc" },
  { id: "vivaldi_estaciones", name: "Vivaldi — Las cuatro estaciones", desc: "Orquesta de cámara", color: "#ffb347" },
  { id: "mozart_cuartetos", name: "Mozart — Cuartetos de cuerda", desc: "K. 421 y K. 465", color: "#7b6ef6" },
  { id: "schubert_d664", name: "Schubert — Sonata D. 664", desc: "Piano solo", color: "#ff6b9d" },
  { id: "none", name: "Solo tonos, sin música", desc: "Menos agradable; el estudio usó música para mejorar la tolerancia", color: "#9090c0" },
];

const DURATIONS = [15, 30, 60];

type Status = "idle" | "playing" | "paused" | "finished";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ExperimentalPage() {
  const router = useRouter();
  const [ft, setFt] = useState<number | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [group, setGroup] = useState("bach_goldberg");
  const [minutes, setMinutes] = useState(60);
  const [volume, setVolume] = useState(0.4);
  const [ratioDb, setRatioDb] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [current, setCurrent] = useState<Track | null>(null);
  const [error, setError] = useState("");
  const [testOpen, setTestOpen] = useState(false);
  const [heard, setHeard] = useState<Record<number, boolean>>({});
  const [testLevel, setTestLevel] = useState(0.5);
  const player = useRef<MmidstPlayer | null>(null);
  const tester = useRef<ToneTester | null>(null);

  useEffect(() => {
    const f = localStorage.getItem("tinnitus_frequency");
    if (f) setFt(Number(f));
    fetch("/music/tracks.json")
      .then((r) => r.json())
      .then(setTracks)
      .catch(() => setError("No se pudo cargar la lista de música"));
    return () => {
      player.current?.stop();
      tester.current?.close();
    };
  }, []);

  const playTestTone = (i: number) => {
    if (!tester.current) tester.current = new ToneTester();
    tester.current.play(freqs[i], testLevel).catch(() => setError("No se pudo reproducir el tono de prueba"));
  };

  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => {
      const p = player.current;
      if (!p) return;
      const e = p.getElapsed();
      setElapsed(e);
      if (e >= minutes * 60) {
        p.stop(3);
        setStatus("finished");
      }
    }, 500);
    return () => clearInterval(id);
  }, [status, minutes]);

  const inRange = ft !== null && ft >= FT_MIN && ft <= FT_MAX;
  const freqs = useMemo(() => (ft && inRange ? mmidstFrequencies(ft) : []), [ft, inRange]);
  const groupTracks = tracks.filter((t) => t.group === group);
  const groupInfo = GROUPS.find((g) => g.id === group)!;
  const running = status === "playing" || status === "paused";

  const start = async () => {
    if (!ft || !inRange) return;
    setError("");
    setElapsed(0);
    setCurrent(null);
    const p = new MmidstPlayer();
    player.current = p;
    try {
      await p.start({
        ft,
        playlist: group === "none" ? [] : groupTracks,
        volume,
        ratioDb,
        onTrackChange: setCurrent,
      });
      setStatus("playing");
    } catch (e) {
      p.stop();
      setError(e instanceof Error ? e.message : "No se pudo iniciar el audio");
    }
  };

  const togglePause = async () => {
    const p = player.current;
    if (!p) return;
    if (status === "playing") {
      await p.pause();
      setStatus("paused");
    } else if (status === "paused") {
      await p.resume();
      setStatus("playing");
    }
  };

  const stop = () => {
    player.current?.stop(1);
    setStatus("idle");
    setElapsed(0);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6"
          style={{ backgroundColor: "#ffb34712", border: "1px solid #ffb34740", color: "#ffb347" }}
        >
          ◇ Experimental
        </div>
        <h1 className="text-4xl font-bold mb-4" style={{ color: "#e0e0ff" }}>
          Tonos de desincronización <span className="neon-text-violet">sobre música</span>
        </h1>
        <p className="text-sm max-w-2xl mx-auto" style={{ color: "#6060a0" }}>
          Inspirado en un ensayo piloto de la Universidad de Chile (Henríquez, Délano, Herrada, Guevara y Breinbauer, 2026). Son 4 tonos alrededor de tu
          frecuencia, en orden aleatorio, mezclados con música clásica. No es el protocolo exacto del estudio.
        </p>
      </div>

      <div className="glass-card rounded-xl p-5 mb-6 text-sm" style={{ border: "1px solid #ffb34730", color: "#a0a0c0" }}>
        <p className="mb-2">
          <strong style={{ color: "#ffb347" }}>Qué se sabe y qué no.</strong> El estudio tuvo 25 personas, no ha pasado revisión por pares y comparó contra un control sonoro. El
          puntaje THI del grupo con la terapia bajó de 69 a 50 en 3 meses, mientras el control no cambió. No hubo mejoría en el primer mes. El protocolo fue de 60 minutos al día,
          5 días por semana, durante 12 semanas.{" "}
          <a href="https://doi.org/10.20944/preprints202602.0188.v1" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#7b6ef6" }}>
            Ver el preprint
          </a>
        </p>
        <p>
          <strong style={{ color: "#ff6b9d" }}>No lo uses si tienes</strong> acúfeno pulsátil o sin tono definido, enfermedad de Ménière, alucinaciones auditivas, pérdida
          auditiva severa o patología del oído medio. Consulta con un especialista antes de empezar. Usa audífonos y un volumen que nunca sea incómodo ni más fuerte que tu acúfeno.
        </p>
      </div>

      {ft === null && (
        <div
          className="inline-flex items-center gap-3 px-6 py-3 rounded-xl mb-6 cursor-pointer"
          style={{ backgroundColor: "#ff6b9d10", border: "1px solid #ff6b9d30" }}
          onClick={() => router.push("/")}
        >
          <span style={{ color: "#ff6b9d" }}>⚠ No has detectado tu frecuencia todavía →</span>
        </div>
      )}
      {ft !== null && !inRange && (
        <div className="px-6 py-3 rounded-xl mb-6" style={{ backgroundColor: "#ff6b9d10", border: "1px solid #ff6b9d30", color: "#ff6b9d" }}>
          Tu frecuencia ({ft} Hz) está fuera del rango del estudio ({FT_MIN} a {FT_MAX} Hz). Esta modalidad no está disponible para ella.
        </div>
      )}
      {inRange && (
        <div className="glass-card rounded-xl p-5 mb-6 flex flex-wrap items-center gap-4" style={{ border: "1px solid #00ffcc30" }}>
          <span style={{ color: "#6060a0" }}>Tu frecuencia:</span>
          <span className="font-mono font-bold text-xl neon-text-green">{ft} Hz</span>
          <span className="text-xs font-mono" style={{ color: "#6060a0" }}>
            Tonos: {freqs.map((f) => Math.round(f)).join(" · ")} Hz
          </span>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3" style={{ color: "#e0e0ff" }}>
        Música
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {GROUPS.map((g) => {
          const active = g.id === group;
          return (
            <button
              key={g.id}
              disabled={running}
              onClick={() => setGroup(g.id)}
              className="glass-card rounded-xl p-4 text-left transition-all duration-200"
              style={{
                border: active ? `1px solid ${g.color}60` : "1px solid #1a1a2e",
                backgroundColor: active ? `${g.color}08` : "rgba(15,15,26,0.8)",
                opacity: running && !active ? 0.5 : 1,
              }}
            >
              <div className="font-semibold text-sm" style={{ color: active ? g.color : "#e0e0ff" }}>
                {g.name}
              </div>
              <div className="text-xs mt-1" style={{ color: "#6060a0" }}>
                {g.desc}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#e0e0ff" }}>
            ⏱ Duración
          </h3>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                disabled={running}
                onClick={() => setMinutes(d)}
                className="flex-1 py-2 rounded-lg font-mono text-sm"
                style={{
                  backgroundColor: minutes === d ? "#7b6ef620" : "#0f0f1a",
                  border: `1px solid ${minutes === d ? "#7b6ef6" : "#1a1a2e"}`,
                  color: minutes === d ? "#7b6ef6" : "#e0e0ff",
                }}
              >
                {d} min
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "#6060a0" }}>
            El estudio usó 60 min
          </p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#e0e0ff" }}>
            🔈 Volumen
          </h3>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              player.current?.setVolume(v);
            }}
            className="w-full"
          />
          <p className="text-xs mt-2" style={{ color: "#6060a0" }}>
            Empieza bajo y sube despacio
          </p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#e0e0ff" }}>
            🎚 Tonos frente a música
          </h3>
          <input
            type="range"
            min={-12}
            max={6}
            step={1}
            value={ratioDb}
            onChange={(e) => {
              const v = Number(e.target.value);
              setRatioDb(v);
              player.current?.setRatioDb(v);
            }}
            className="w-full"
          />
          <p className="text-xs mt-2" style={{ color: "#6060a0" }}>
            {ratioDb > 0 ? "+" : ""}
            {ratioDb} dB (0 = mismo nivel medio)
          </p>
        </div>
      </div>

      {inRange && (
        <div className="glass-card rounded-xl p-5 mb-6" style={{ border: "1px solid #1a1a2e" }}>
          <button
            onClick={() => setTestOpen((o) => !o)}
            disabled={running}
            className="w-full flex justify-between items-center text-sm font-semibold"
            style={{ color: running ? "#6060a0" : "#e0e0ff" }}
          >
            <span>🔎 Prueba de audibilidad de los 4 tonos</span>
            <span>{testOpen && !running ? "▲" : "▼"}</span>
          </button>
          {running && (
            <p className="text-xs mt-2" style={{ color: "#6060a0" }}>
              Detén la sesión para hacer la prueba.
            </p>
          )}
          {testOpen && !running && (
            <div className="mt-4">
              <p className="text-xs mb-3" style={{ color: "#6060a0" }}>
                Cada tono suena 3 veces seguidas, sin música. Tiene su propio nivel, independiente del volumen de la sesión. Empieza con el volumen de tu equipo bajo y
                sube el nivel despacio, sin llegar a un nivel incómodo.
              </p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs" style={{ color: "#a0a0c0" }}>
                  Nivel de la prueba
                </span>
                <input type="range" min={0.1} max={1} step={0.05} value={testLevel} onChange={(e) => setTestLevel(Number(e.target.value))} className="flex-1" />
              </div>
              <div className="space-y-2">
                {freqs.map((f, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm w-24" style={{ color: "#e0e0ff" }}>
                      {Math.round(f)} Hz
                    </span>
                    <button
                      onClick={() => playTestTone(i)}
                      className="px-3 py-1.5 rounded-lg text-sm"
                      style={{ backgroundColor: "#7b6ef615", border: "1px solid #7b6ef660", color: "#7b6ef6" }}
                    >
                      ▶ Reproducir
                    </button>
                    <button
                      onClick={() => setHeard((h) => ({ ...h, [i]: true }))}
                      className="px-3 py-1.5 rounded-lg text-sm"
                      style={{
                        backgroundColor: heard[i] === true ? "#00ffcc20" : "#0f0f1a",
                        border: `1px solid ${heard[i] === true ? "#00ffcc" : "#1a1a2e"}`,
                        color: heard[i] === true ? "#00ffcc" : "#a0a0c0",
                      }}
                    >
                      Lo oigo
                    </button>
                    <button
                      onClick={() => setHeard((h) => ({ ...h, [i]: false }))}
                      className="px-3 py-1.5 rounded-lg text-sm"
                      style={{
                        backgroundColor: heard[i] === false ? "#ff6b9d20" : "#0f0f1a",
                        border: `1px solid ${heard[i] === false ? "#ff6b9d" : "#1a1a2e"}`,
                        color: heard[i] === false ? "#ff6b9d" : "#a0a0c0",
                      }}
                    >
                      No lo oigo
                    </button>
                  </div>
                ))}
              </div>
              {Object.keys(heard).length === freqs.length && (
                <div className="mt-4 text-sm p-3 rounded-lg" style={{ backgroundColor: "#0f0f1a", border: "1px solid #1a1a2e", color: "#a0a0c0" }}>
                  {freqs.every((_, i) => heard[i]) ? (
                    <>Oyes los 4 tonos con este nivel.</>
                  ) : (
                    <>
                      <strong style={{ color: "#ff6b9d" }}>
                        No oyes: {freqs.filter((_, i) => heard[i] === false).map((f) => `${Math.round(f)} Hz`).join(", ")}.
                      </strong>{" "}
                      Prueba subir un poco el nivel de la prueba y repite, sin llegar a un nivel incómodo. Si no se oye a un nivel cómodo, ese tono
                      probablemente cae en una zona con pérdida auditiva o fuera de la respuesta de tus audífonos. Prueba con otros audífonos y consulta con un audiólogo:
                      el estudio no indica qué hacer en este caso.
                    </>
                  )}
                </div>
              )}
              {Object.keys(heard).length > 0 && (
                <button onClick={() => setHeard({})} className="mt-3 text-xs underline" style={{ color: "#6060a0" }}>
                  Reiniciar prueba
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center mb-4">
        {status === "idle" || status === "finished" ? (
          <button
            onClick={start}
            disabled={!inRange || (group !== "none" && tracks.length === 0)}
            className="flex-1 py-5 rounded-2xl font-bold text-xl"
            style={{
              backgroundColor: inRange ? "#00ffcc15" : "#1a1a2e",
              border: `2px solid ${inRange ? "#00ffcc" : "#1a1a2e"}`,
              color: inRange ? "#00ffcc" : "#6060a0",
              cursor: inRange ? "pointer" : "not-allowed",
            }}
          >
            ▶ Iniciar sesión
          </button>
        ) : (
          <>
            <button
              onClick={togglePause}
              className="flex-1 py-5 rounded-2xl font-bold text-xl"
              style={{ backgroundColor: "#7b6ef615", border: "2px solid #7b6ef6", color: "#7b6ef6" }}
            >
              {status === "playing" ? "⏸ Pausar" : "▶ Continuar"}
            </button>
            <button
              onClick={stop}
              className="px-8 py-5 rounded-2xl font-bold text-xl"
              style={{ backgroundColor: "#ff6b9d10", border: "2px solid #ff6b9d60", color: "#ff6b9d" }}
            >
              ■ Detener
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="text-center text-sm mb-4" style={{ color: "#ff6b9d" }}>
          Error: {error}
        </p>
      )}

      {(running || status === "finished") && (
        <div className="glass-card rounded-xl p-5 mb-6" style={{ border: `1px solid ${groupInfo.color}40` }}>
          <div className="flex justify-between text-sm mb-2" style={{ color: "#6060a0" }}>
            <span>{status === "finished" ? "Sesión terminada" : status === "paused" ? "En pausa" : "Reproduciendo"}</span>
            <span className="font-mono">
              {fmt(Math.min(elapsed, minutes * 60))} / {fmt(minutes * 60)}
            </span>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: "8px", backgroundColor: "#1a1a2e" }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (elapsed / (minutes * 60)) * 100)}%`, backgroundColor: groupInfo.color }} />
          </div>
          {current && (
            <p className="text-xs mt-3" style={{ color: "#a0a0c0" }}>
              ♪ {current.composer} — {current.title}
            </p>
          )}
          <p className="text-xs mt-2" style={{ color: "#6060a0" }}>
            Mantén esta pestaña abierta durante la sesión.
          </p>
        </div>
      )}

      {group !== "none" && groupTracks.length > 0 && (
        <details className="mt-6 text-xs" style={{ color: "#6060a0" }}>
          <summary className="cursor-pointer" style={{ color: "#7b6ef6" }}>
            Créditos y licencias de esta selección
          </summary>
          <ul className="mt-3 space-y-2">
            {groupTracks.map((t) => (
              <li key={t.file}>
                {t.composer} — {t.title}. Intérprete: {t.performer}. Fuente: {t.source}.
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
