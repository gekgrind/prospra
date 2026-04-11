import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{css,scss}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      colors: {
        brandNavyDark: "#031329",
        brandNavy: "#05224c",
        brandBlue: "#087eff",
        brandBlueLight: "#00d4ff",
        brandYellow: "#ffe521",
        brandYellowLight: "#fff06a",
        brandGray: "#bcc0d8",

        /* Backwards compatibility */
        entrepreneuriaBlue: "#087eff",
        entrepreneuriaOrange: "#ffe521",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #05224c 0%, #087eff 52%, #00d4ff 100%)",
        "brand-gradient-subtle":
          "linear-gradient(180deg, rgba(8, 126, 255, 0.16) 0%, rgba(0, 212, 255, 0.04) 100%)",
        blueprint:
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
      },
      boxShadow: {
        "prospra-soft": "0 10px 30px rgba(0,0,0,0.24)",
        "prospra-blue": "0 0 24px rgba(8,126,255,0.18)",
        "prospra-cyan": "0 0 28px rgba(0,212,255,0.16)",
        "prospra-yellow": "0 0 24px rgba(255,229,33,0.14)",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      keyframes: {
        gateSpinCW: {
          "0%": { transform: "translate(-50%, -50%) rotate(0deg)" },
          "100%": { transform: "translate(-50%, -50%) rotate(360deg)" },
        },
        gateSpinCCW: {
          "0%": { transform: "translate(-50%, -50%) rotate(0deg)" },
          "100%": { transform: "translate(-50%, -50%) rotate(-360deg)" },
        },
        gatePulse: {
          "0%, 100%": {
            opacity: "0.3",
            transform: "translate(-50%, -50%) scale(1)",
          },
          "50%": {
            opacity: "0.6",
            transform: "translate(-50%, -50%) scale(1.1)",
          },
        },
      },
      animation: {
        gateSpinCW: "gateSpinCW 14s linear infinite",
        gateSpinCCW: "gateSpinCCW 22s linear infinite",
        gatePulse: "gatePulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;