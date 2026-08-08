import type { Metadata } from "next";
import "./globals.css";
import ParticleBackground from "@/components/ParticleBackground";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "TinnitusLab — Terapia de Sonido Personalizada",
  description:
    "Detecta la frecuencia de tu tinnitus y genera audio terapéutico personalizado. Gratuito, sin registro.",
  keywords: ["tinnitus", "terapia de sonido", "notch therapy", "acúfenos"],
  robots: "index, follow",
  openGraph: {
    title: "TinnitusLab",
    description: "Terapia de sonido personalizada para tinnitus",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen" style={{ backgroundColor: "#080810" }}>
        <ParticleBackground />
        <Navbar />
        <main className="relative z-10">{children}</main>
        <footer className="relative z-10 border-t mt-20" style={{ borderColor: "#1a1a2e" }}>
          <div className="max-w-4xl mx-auto px-6 py-10 text-center">
            <p className="text-sm mb-3" style={{ color: "#6060a0" }}>
              <strong style={{ color: "#00ffcc" }}>TinnitusLab</strong> — Terapia de sonido basada en evidencia
            </p>
            <p className="text-xs mb-4" style={{ color: "#6060a0" }}>
              Basado en estudios de{" "}
              <em>notch sound therapy</em> (Okamoto et al. 2010), binaural beats gamma (Bhatt et al. 2024) y protocolos de neuroplasticidad auditiva.
            </p>
            <p className="text-xs p-4 rounded-lg border" style={{ color: "#6060a0", borderColor: "#1a1a2e", backgroundColor: "#0f0f1a" }}>
              ⚠️ <strong>Disclaimer médico:</strong> TinnitusLab es una herramienta de apoyo y no reemplaza el diagnóstico ni tratamiento médico profesional.
              Consulta a un audiólogo u otorrinolaringólogo antes de iniciar cualquier terapia sonora. No usar a volumen alto.
            </p>
            <p className="text-xs mt-4" style={{ color: "#6060a0" }}>
              Generador de tonos de referencia:{" "}
              <a
                href="https://www.szynalski.com/tone-generator/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "#7b6ef6" }}
              >
                szynalski.com
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
