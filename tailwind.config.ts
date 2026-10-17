import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "Cambria", "serif"],
        display: ["var(--font-serif)", "Georgia", "Cambria", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        "gg-hero-gradient":
          "linear-gradient(135deg, #F3F0FF 0%, #EDE7FE 55%, #FCE7F3 100%)",
      },
      colors: {
        gg: {
          black: "#1C1C1E",
          canvas: "#FFFFFF",
          subtle: "#F5F5F7",
          border: "#E5E7EB",
          lavender: "#ECE9FE",
          purple: "#6E56CF",
          magenta: "#E11D8F",
          gold: "#C69214",
        },
      },
      boxShadow: {
        gg: "0 4px 20px -2px rgba(24, 24, 27, 0.06), 0 1px 3px -1px rgba(24, 24, 27, 0.04)",
        "gg-card":
          "0 4px 20px -2px rgba(24, 24, 27, 0.06), 0 1px 3px -1px rgba(24, 24, 27, 0.04)",
        "gg-drawer": "-8px 0 32px -4px rgba(24, 24, 27, 0.08)",
        "gg-modal": "0 20px 50px -10px rgba(24, 24, 27, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
