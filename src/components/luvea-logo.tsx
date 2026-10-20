import React from "react";

interface LuveaLogoProps {
  className?: string;
  variant?: "wordmark" | "icon" | "full";
  size?: number | string;
  dark?: boolean;
}

/**
 * LUVEA Wordmark — Pure typographic luxury wordmark with haute-couture editorial presence.
 * Features optically calibrated letter-spacing, negative right margin to eliminate tracking drift,
 * and high-contrast rendering inspired by Céline, Saint Laurent and GlossGenius.
 */
export function LuveaWordmark({
  className = "",
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center font-sans font-semibold tracking-[0.24em] uppercase select-none transition-colors duration-150 ${
        dark ? "text-white" : "text-[#1C1C1E]"
      } ${className}`}
      style={{ letterSpacing: "0.24em" }}
      aria-label="LUVEA"
    >
      <span className="-mr-[0.24em]">LUVEA</span>
    </span>
  );
}

/**
 * LUVEA Monogram Icon — Minimalist, chic squircle emblem for favicon, mobile app and social media.
 * Stylized geometric architectural "L" mark inside an ultra-subtle squircle container.
 */
export function LuveaIcon({
  size = 36,
  className = "",
  dark = false,
}: {
  size?: number | string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${className}`}
      aria-label="LUVEA Monogram"
    >
      <defs>
        <linearGradient id={dark ? "luveaBgDark" : "luveaBgLight"} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={dark ? "#27272A" : "#1C1C1E"} />
          <stop offset="100%" stopColor={dark ? "#18181B" : "#141416"} />
        </linearGradient>
      </defs>

      {/* Luxury Squircle Container with fine optical border */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="24"
        fill={`url(#${dark ? "luveaBgDark" : "luveaBgLight"})`}
        stroke={dark ? "#3F3F46" : "#2E2E32"}
        strokeWidth="1.5"
      />

      {/* Architectural "L" Monogram with balanced geometric proportions */}
      <path
        d="M 40 28 L 40 63 C 40 68 43.5 71 49 71 L 67 71"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Universal LuveaLogo component.
 */
export function LuveaLogo({
  className = "",
  variant = "wordmark",
  size = 36,
  dark = false,
}: LuveaLogoProps) {
  if (variant === "icon") {
    return <LuveaIcon size={size} dark={dark} className={className} />;
  }

  if (variant === "full") {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <LuveaIcon size={size} dark={dark} />
        <LuveaWordmark dark={dark} className="text-[20px]" />
      </div>
    );
  }

  return <LuveaWordmark dark={dark} className={className} />;
}
