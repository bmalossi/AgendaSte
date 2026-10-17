import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "var(--color-canvas)",
          elevated: "var(--color-surface)",
          subtle: "var(--color-surface-subtle)",
          chassis: "var(--color-chassis)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          secondary: "var(--color-ink-secondary)",
          muted: "var(--color-ink-muted)",
          inverted: "var(--color-ink-inverted)",
        },
        line: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        brand: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          soft: "var(--color-primary-soft)",
        },
        status: {
          confirmed: {
            fg: "var(--color-status-confirmed-fg)",
            bg: "var(--color-status-confirmed-bg)",
            border: "var(--color-status-confirmed-border)",
          },
          pending: {
            fg: "var(--color-status-pending-fg)",
            bg: "var(--color-status-pending-bg)",
            border: "var(--color-status-pending-border)",
          },
          risk: {
            fg: "var(--color-status-risk-fg)",
            bg: "var(--color-status-risk-bg)",
            border: "var(--color-status-risk-border)",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-public-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-chivo-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        tactile: "0 2px 6px -1px rgba(18, 21, 20, 0.06), 0 1px 2px -1px rgba(18, 21, 20, 0.04)",
        "tactile-md": "0 8px 20px -4px rgba(18, 21, 20, 0.08), 0 2px 6px -1px rgba(18, 21, 20, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
