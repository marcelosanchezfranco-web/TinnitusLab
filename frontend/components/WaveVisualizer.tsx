"use client";

import { useEffect, useRef } from "react";

interface Props {
  isPlaying: boolean;
  frequency: number;
}

export default function WaveVisualizer({ isPlaying, frequency }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      if (!isPlaying) {
        // Flat line when stopped
        ctx.beginPath();
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.strokeStyle = "#00ffcc40";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        return;
      }

      timeRef.current += 0.04;
      const t = timeRef.current;

      // Visual frequency: log scale mapping 20-20000 to 1-8 cycles visible
      const logF = Math.log10(frequency);
      const logMin = Math.log10(20);
      const logMax = Math.log10(20000);
      const norm = (logF - logMin) / (logMax - logMin);
      const cycles = 1 + norm * 7;

      const amp = H * 0.35;

      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const phase = (x / W) * cycles * Math.PI * 2 + t;
        const y = H / 2 + Math.sin(phase) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Neon glow effect: draw multiple times with decreasing alpha
      ctx.strokeStyle = "#00ffcc";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#00ffcc";
      ctx.shadowBlur = 12;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#00ffcc60";
      ctx.lineWidth = 6;
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, frequency]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={120}
      className="w-full rounded-xl"
      style={{ backgroundColor: "rgba(0, 255, 204, 0.03)", border: "1px solid #00ffcc20" }}
    />
  );
}
