import React from "react";

interface LuveaLogoProps {
  className?: string;
  variant?: "wordmark" | "icon" | "full";
  size?: number | string;
  dark?: boolean;
}

/**
 * LUVEA Wordmark — Pure typographic luxury wordmark matching the GlossGenius aesthetic.
 * All-caps with wide tracking for haute-couture editorial presence.
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
      className={`font-sans font-semibold tracking-[0.28em] uppercase select-none transition-colors ${
        dark ? "text-white" : "text-[#1C1C1E]"
      } ${className}`}
    >
      LUVEA
    </span>
  );
}

/**
 * LUVEA Monogram Icon — Minimalist, chic squircle emblem for favicon, mobile app and social media.
 * Stylized geometric "L" line mark inside an architectural squircle.
 */
export function LuveaIcon({
  size = 36,
  className = "",
}: {
  size?: number | string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="LUVEA Monogram"
    >
      <defs>
        <linearGradient id="luveaBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E1E22" />
          <stop offset="100%" stopColor="#121214" />
        </linearGradient>
        <linearGradient id="luveaStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#ECECEF" />
        </linearGradient>
      </defs>

      {/* Luxury Squircle Container */}
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="22"
        fill="url(#luveaBgGrad)"
        stroke="#27272A"
        strokeWidth="1.5"
      />

      {/* Minimalist Architectural "L" Monogram */}
      <path
        d="M 38 28 L 38 64 C 38 69.5 42.5 73 48 73 L 68 73"
        stroke="url(#luveaStrokeGrad)"
        strokeWidth="6.5"
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
    return <LuveaIcon size={size} className={className} />;
  }

  if (variant === "full") {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <LuveaIcon size={size} />
        <LuveaWordmark dark={dark} className="text-[20px]" />
      </div>
    );
  }

  // Default: wordmark only (as requested for header)
  return <LuveaWordmark dark={dark} className={className} />;
}
