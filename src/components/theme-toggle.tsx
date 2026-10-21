"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useAppTheme } from "@/lib/theme";

interface ThemeToggleProps {
  variant?: "icon" | "row" | "pill";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useAppTheme();

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
          isDark
            ? "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]"
            : "text-[#27272a] hover:text-[#18181b] hover:bg-zinc-100"
        } ${className}`}
      >
        <span className="flex items-center gap-2.5">
          {isDark ? (
            <Sun className="w-4 h-4 text-zinc-300" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-600" />
          )}
          <span>{isDark ? "Modo Claro" : "Modo Escuro"}</span>
        </span>
        <span
          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
            isDark
              ? "bg-[#27272a] text-[#a1a1aa] border-[#3f3f46]"
              : "bg-zinc-100 text-zinc-600 border-zinc-200"
          }`}
        >
          {isDark ? "Escuro" : "Claro"}
        </span>
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-medium transition-all active:scale-95 shadow-2xs ${
          isDark
            ? "border-[#27272a] bg-[#18181b] text-[#f4f4f5] hover:bg-[#27272a]"
            : "border-zinc-200 bg-white text-[#18181b] hover:bg-zinc-50"
        } ${className}`}
      >
        {isDark ? (
          <Sun className="w-3.5 h-3.5 text-zinc-300" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-zinc-600" />
        )}
        <span>{isDark ? "Claro" : "Escuro"}</span>
      </button>
    );
  }

  // variant === "icon" (padrão)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-90 shadow-2xs ${
        isDark
          ? "border-[#27272a] bg-[#18181b] text-[#f4f4f5] hover:bg-[#27272a]"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-black"
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-zinc-300" />
      ) : (
        <Moon className="w-4 h-4 text-zinc-600" />
      )}
    </button>
  );
}
