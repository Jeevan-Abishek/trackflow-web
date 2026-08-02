import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand tokens: bright premium light theme, blue + green accents
        ink: "#0F172A",
        paper: "#FFFFFF",
        mist: "#F6F8FA",
        cloud: "#EEF1F5",
        line: "#E4E8EE",
        brand: {
          50: "#EEF5FF",
          100: "#DCEBFF",
          400: "#4B8CFF",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        live: {
          50: "#ECFDF5",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
        warn: {
          500: "#F59E0B",
        },
        danger: {
          500: "#EF4444",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.08)",
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
        pop: "0 12px 40px -12px rgba(37, 99, 235, 0.25)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
