"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Detector" },
  { href: "/generator", label: "Generador" },
  { href: "/guide", label: "Guía" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="relative z-20 border-b"
      style={{ borderColor: "#1a1a2e", backgroundColor: "rgba(8,8,16,0.9)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold neon-text-cyan font-mono">
            TinnitusLab
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#00ffcc15", color: "#00ffcc", border: "1px solid #00ffcc40" }}
          >
            BETA
          </span>
        </Link>

        <div className="flex gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  color: active ? "#00ffcc" : "#6060a0",
                  backgroundColor: active ? "#00ffcc15" : "transparent",
                  border: active ? "1px solid #00ffcc40" : "1px solid transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
