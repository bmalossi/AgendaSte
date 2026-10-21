"use client";

import { useEffect, useState, useCallback } from "react";

export type AppTheme = "light" | "dark";

const STORAGE_KEY = "luvea_theme";

export function getStoredTheme(): AppTheme {
  if (typeof window === "undefined") return "light";
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === "light" || val === "dark") return val;
    // Padrão: sempre claro
    return "light";
  } catch {
    return "light";
  }
}

export function applyThemeToDOM(theme: AppTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function setAppTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  applyThemeToDOM(theme);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("luvea_theme_change", { detail: theme }));
  }
}

export function toggleAppTheme(): AppTheme {
  const current = getStoredTheme();
  const next: AppTheme = current === "dark" ? "light" : "dark";
  setAppTheme(next);
  return next;
}

export function useAppTheme(): {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  toggleTheme: () => void;
  isDark: boolean;
} {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window === "undefined") return "light";
    return getStoredTheme();
  });

  useEffect(() => {
    const initial = getStoredTheme();
    setThemeState(initial);
    applyThemeToDOM(initial);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<AppTheme>;
      if (customEvent.detail) {
        setThemeState(customEvent.detail);
      }
    };

    window.addEventListener("luvea_theme_change", handleThemeChange);
    return () => {
      window.removeEventListener("luvea_theme_change", handleThemeChange);
    };
  }, []);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    setAppTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: AppTheme = prev === "dark" ? "light" : "dark";
      setAppTheme(next);
      return next;
    });
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === "dark",
  };
}
