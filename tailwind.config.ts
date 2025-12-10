import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{css,scss}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      colors: {
        brandNavyDark: "#1a2942",
        entrepreneuriaBlue: "#4f7ca7",
        entrepreneuriaOrange: "#d27a2c",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #1a2942 0%, #4f7ca7 50%, #d27a2c 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

