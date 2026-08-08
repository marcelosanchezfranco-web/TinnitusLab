import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#080810",
        surface: "#0f0f1a",
        border: "#1a1a2e",
        "text-primary": "#e0e0ff",
        "text-secondary": "#6060a0",
        cyan: "#00ffcc",
        violet: "#7b6ef6",
        pink: "#ff6b9d",
        green: "#00ff88",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "neon-cyan": "0 0 10px #00ffcc, 0 0 20px #00ffcc40",
        "neon-violet": "0 0 10px #7b6ef6, 0 0 20px #7b6ef640",
        "neon-pink": "0 0 10px #ff6b9d, 0 0 20px #ff6b9d40",
        "neon-green": "0 0 10px #00ff88, 0 0 20px #00ff8840",
      },
      backgroundImage: {
        "gradient-neon":
          "linear-gradient(135deg, #00ffcc22, #7b6ef622)",
      },
    },
  },
  plugins: [],
};

export default config;
