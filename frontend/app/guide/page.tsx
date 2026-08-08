"use client";

import { useState } from "react";

const PROTOCOL_WEEKS = [
  {
    weeks: "1–2",
    label: "Inicio",
    color: "#00ffcc",
    desc: "15 min/día, Pink Noise + Notch. Acostumbrar el oído. Volumen bajo.",
  },
  {
    weeks: "3–4",
    label: "Adaptación",
    color: "#7b6ef6",
    desc: "20–30 min/día. Agrega AM Tones en sesiones dedicadas.",
  },
  {
    weeks: "5–6",
    label: "Intensificación",
    color: "#00ff88",
    desc: "30–45 min/día. Incorpora Binaural 40 Hz con audífonos.",
  },
  {
    weeks: "7–8",
    label: "Mantenimiento",
    color: "#ffb347",
    desc: "45 min/día. Alterna tipos según el momento del día.",
  },
  {
    weeks: "9–10",
    label: "Evaluación",
    color: "#ff6b9d",
    desc: "Mide escala 0–100. Reduce si notas mejoría sostenida.",
  },
  {
    weeks: "11–12",
    label: "Consolidación",
    color: "#c084fc",
    desc: "30 min/día de mantenimiento. Evalúa continuar o pausar.",
  },
];

const SCHEDULE = [
  {
    time: "Mañana (levantarse)",
    audio: "Pink Noise + Notch",
    duration: "15–20 min",
    notes: "Volumen bajo, como fondo al desayunar",
  },
  {
    time: "Tarde (trabajo/estudio)",
    audio: "AM Tones o Pink Noise",
    duration: "20–30 min",
    notes: "Sesión activa con audífonos o como fondo",
  },
  {
    time: "Noche (antes de dormir)",
    audio: "Brown Noise + Notch",
    duration: "20–30 min",
    notes: "Muy bajo, calmante, puede continuar mientras duermes",
  },
  {
    time: "Sesión intensiva (opc.)",
    audio: "Binaural 40 Hz + Pink",
    duration: "20 min",
    notes: "Obligatorio audífonos. 1 vez por día, no al acostarse",
  },
];

const FAQS = [
  {
    q: "¿Por qué funciona la terapia notch?",
    a: "La terapia de sonido con muesca (notch) utiliza plasticidad auditiva lateral: al escuchar sonido enriquecido sin la frecuencia del tinnitus, el sistema auditivo reduce gradualmente la sobrerepresentación de esa frecuencia en la corteza, disminuyendo la percepción del pitido. (Okamoto et al., PNAS 2010).",
  },
  {
    q: "¿Qué tan alto debe estar el volumen?",
    a: "El volumen debe ser apenas audible, cómodo y nunca molesto. Si tienes que alzar la voz para hablar mientras escuchas, es demasiado alto. El objetivo no es 'tapar' el tinnitus sino estimular el sistema auditivo sutilmente.",
  },
  {
    q: "¿Cuándo voy a notar mejoría?",
    a: "Los estudios muestran reducciones significativas entre 3 y 12 meses de uso constante. No es una cura inmediata: es una terapia de neuroplasticidad que requiere tiempo. Algunos usuarios notan mejoría en 4–6 semanas.",
  },
  {
    q: "¿Puedo usarlo si tengo pérdida auditiva?",
    a: "Sí, pero es importante que encuentres la frecuencia correcta de tu tinnitus. Con pérdida auditiva a ciertas frecuencias, el tinnitus suele aparecer justamente en esa zona. Consulta a un audiólogo para confirmar la frecuencia si tienes dudas.",
  },
  {
    q: "¿Los binaurales 40 Hz realmente funcionan?",
    a: "Hay evidencia emergente (Bhatt et al., 2024; Bao et al., J Neurosci 2019) de que los ritmos gamma de 40 Hz estimulan oscilaciones en la corteza auditiva y pueden reducir la actividad neuronal anormal del tinnitus. Se usa como complemento, no remplazo, de la terapia notch.",
  },
  {
    q: "¿Puedo usar el audio mientras duermo?",
    a: "Solo el Brown Noise + Notch a volumen muy bajo es seguro para dormir. Evita los AM Tones y Binaurales durante el sueño, ya que la modulación puede interferir con las fases del sueño.",
  },
  {
    q: "¿Qué pasa si el audio me genera más tinnitus?",
    a: "Detén inmediatamente la sesión. Algunas personas experimentan un aumento temporal (reactive tinnitus). Baja el volumen significativamente y prueba sesiones más cortas (5–10 min). Si persiste, consulta a un especialista.",
  },
];

export default function GuidePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scale, setScale] = useState(50);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6"
          style={{
            backgroundColor: "#ff6b9d10",
            border: "1px solid #ff6b9d30",
            color: "#ff6b9d",
          }}
        >
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#ff6b9d" }}></span>
          Paso 3 de 3 — Guía de Uso
        </div>
        <h1 className="text-4xl font-bold mb-4" style={{ color: "#e0e0ff" }}>
          Protocolo de{" "}
          <span className="neon-text-pink">12 semanas</span>
        </h1>
        <p className="text-lg" style={{ color: "#6060a0" }}>
          Guía completa para maximizar los beneficios de la terapia sonora
        </p>
      </div>

      {/* Timeline horizontal */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-6" style={{ color: "#e0e0ff" }}>
          Protocolo progresivo
        </h2>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PROTOCOL_WEEKS.map((w, i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-5 w-44 flex-shrink-0"
                style={{ border: `1px solid ${w.color}40` }}
              >
                <div
                  className="font-mono font-bold text-lg mb-1"
                  style={{ color: w.color }}
                >
                  Sem {w.weeks}
                </div>
                <div
                  className="font-semibold text-sm mb-2"
                  style={{ color: "#e0e0ff" }}
                >
                  {w.label}
                </div>
                <p className="text-xs" style={{ color: "#6060a0" }}>
                  {w.desc}
                </p>
              </div>
            ))}
          </div>
          <div
            className="h-1 mt-4 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #00ffcc, #7b6ef6, #00ff88, #ffb347, #ff6b9d, #c084fc)",
            }}
          />
        </div>
      </section>

      {/* Schedule */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-6" style={{ color: "#e0e0ff" }}>
          Qué audio usar en cada momento
        </h2>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1a1a2e" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#0f0f1a" }}>
                {["Momento", "Audio recomendado", "Duración", "Notas"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#6060a0" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCHEDULE.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    backgroundColor: i % 2 === 0 ? "rgba(15,15,26,0.6)" : "rgba(8,8,16,0.6)",
                    borderTop: "1px solid #1a1a2e",
                  }}
                >
                  <td className="px-5 py-4 text-sm font-medium" style={{ color: "#00ffcc" }}>
                    {row.time}
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: "#e0e0ff" }}>
                    {row.audio}
                  </td>
                  <td className="px-5 py-4 text-sm font-mono" style={{ color: "#7b6ef6" }}>
                    {row.duration}
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: "#6060a0" }}>
                    {row.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Scale tracker */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-2" style={{ color: "#e0e0ff" }}>
          Escala de seguimiento (0–100)
        </h2>
        <p className="text-sm mb-6" style={{ color: "#6060a0" }}>
          Evalúate una vez por semana, siempre en el mismo momento del día y en silencio.
          Registra el número en papel o en tu app de notas.
        </p>
        <div className="glass-card rounded-xl p-6">
          <div className="flex justify-between text-xs font-mono mb-2" style={{ color: "#6060a0" }}>
            <span>0 — No lo escucho</span>
            <span>100 — Insoportable</span>
          </div>
          <input
            type="range"
            className="neon-slider-violet neon-slider w-full mb-4"
            min={0}
            max={100}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
          />
          <div className="flex items-center justify-between">
            <div>
              <span
                className="font-mono font-bold text-5xl"
                style={{
                  color:
                    scale < 30 ? "#00ff88" : scale < 60 ? "#ffb347" : "#ff6b9d",
                  textShadow: `0 0 15px ${scale < 30 ? "#00ff88" : scale < 60 ? "#ffb347" : "#ff6b9d"}`,
                }}
              >
                {scale}
              </span>
              <span className="text-lg ml-1" style={{ color: "#6060a0" }}>
                /100
              </span>
            </div>
            <div className="text-right">
              <p
                className="font-medium"
                style={{
                  color:
                    scale < 30 ? "#00ff88" : scale < 60 ? "#ffb347" : "#ff6b9d",
                }}
              >
                {scale < 20
                  ? "Excelente — Tinnitus leve"
                  : scale < 40
                  ? "Bueno — Manejable"
                  : scale < 60
                  ? "Moderado — Persistente"
                  : scale < 80
                  ? "Significativo — Afecta calidad de vida"
                  : "Severo — Consulta urgente a especialista"}
              </p>
              <p className="text-xs mt-1" style={{ color: "#6060a0" }}>
                {scale < 40
                  ? "Continúa el protocolo. Vas bien."
                  : scale < 70
                  ? "Sé constante. Los resultados llegan gradualmente."
                  : ""}
              </p>
            </div>
          </div>
        </div>
        <div
          className="mt-4 p-4 rounded-lg text-sm"
          style={{ backgroundColor: "#7b6ef610", border: "1px solid #7b6ef630", color: "#6060a0" }}
        >
          <strong style={{ color: "#7b6ef6" }}>Cómo medir:</strong> Siéntate en silencio 2 minutos.
          Luego puntúa qué tan fuerte e intrusivo percibes el tinnitus del 0 al 100.
          Si tu puntaje baja 15+ puntos en 8 semanas, la terapia está funcionando.
        </div>
      </section>

      {/* Scientific basis */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-6" style={{ color: "#e0e0ff" }}>
          Base científica
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              year: "2010",
              title: "Notch Sound Therapy",
              authors: "Okamoto et al. PNAS",
              color: "#00ffcc",
              desc: "Primer estudio controlado que demuestra reducción de tinnitus con ruido con muesca. 12 semanas de uso diario.",
            },
            {
              year: "2019",
              title: "Gamma 40 Hz y tinnitus",
              authors: "Bao et al. J Neuroscience",
              color: "#7b6ef6",
              desc: "Estimulación gamma reduce hiperactividad neuronal en corteza auditiva en modelos animales.",
            },
            {
              year: "2023",
              title: "AM Tones protocol",
              authors: "Shore & Wu, Science Translational Medicine",
              color: "#00ff88",
              desc: "Tonos modulados en amplitud a 10–40 Hz producen plasticidad en núcleo coclear dorsal, reduciendo tinnitus.",
            },
            {
              year: "2024",
              title: "Binaural beats review",
              authors: "Bhatt et al. Frontiers in Neuroscience",
              color: "#ff6b9d",
              desc: "Revisión sistemática: frecuencias gamma (40 Hz) y alpha (10 Hz) muestran efectos moduladores en percepción auditiva.",
            },
          ].map((study) => (
            <div
              key={study.year}
              className="glass-card rounded-xl p-5"
              style={{ border: `1px solid ${study.color}30` }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="font-mono font-bold text-sm px-2 py-1 rounded flex-shrink-0"
                  style={{ backgroundColor: `${study.color}15`, color: study.color }}
                >
                  {study.year}
                </span>
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: "#e0e0ff" }}>
                    {study.title}
                  </p>
                  <p className="text-xs mb-2" style={{ color: study.color }}>
                    {study.authors}
                  </p>
                  <p className="text-xs" style={{ color: "#6060a0" }}>
                    {study.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-6" style={{ color: "#e0e0ff" }}>
          Preguntas frecuentes
        </h2>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="glass-card rounded-xl overflow-hidden"
              style={{
                border: openFaq === i ? "1px solid #00ffcc40" : "1px solid #1a1a2e",
              }}
            >
              <button
                className="w-full px-5 py-4 text-left flex items-center justify-between transition-all duration-150"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium text-sm pr-4" style={{ color: "#e0e0ff" }}>
                  {faq.q}
                </span>
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-transform duration-200"
                  style={{
                    backgroundColor: openFaq === i ? "#00ffcc20" : "#1a1a2e",
                    color: openFaq === i ? "#00ffcc" : "#6060a0",
                    transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  +
                </span>
              </button>
              {openFaq === i && (
                <div
                  className="px-5 pb-5 text-sm"
                  style={{ color: "#6060a0", borderTop: "1px solid #1a1a2e" }}
                >
                  <p className="pt-4">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div
        className="text-center p-8 rounded-2xl"
        style={{ backgroundColor: "#00ffcc08", border: "1px solid #00ffcc30" }}
      >
        <h3 className="text-2xl font-bold mb-2 neon-text-cyan">
          ¿Listo para empezar?
        </h3>
        <p className="mb-6" style={{ color: "#6060a0" }}>
          Detecta tu frecuencia y genera tu primer audio terapéutico gratis
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg"
          style={{
            backgroundColor: "#00ffcc20",
            border: "2px solid #00ffcc",
            color: "#00ffcc",
            boxShadow: "0 0 20px #00ffcc40",
            textDecoration: "none",
          }}
        >
          Empezar →
        </a>
      </div>
    </div>
  );
}
