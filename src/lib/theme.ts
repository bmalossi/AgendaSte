"use client";

import { useSyncExternalStore, useCallback } from "react";

export type AppTheme = "light" | "dark";

const STORAGE_KEY = "luvea_theme";

// Estado em memória (Single Source of Truth)
let memoryTheme: AppTheme = "light";

export function getStoredTheme(): AppTheme {
  if (typeof window === "undefined") return "light";
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === "light" || val === "dark") return val;
    // Padrão sempre claro
    return "light";
  } catch {
    return "light";
  }
}

// Inicializa no cliente
if (typeof window !== "undefined") {
  memoryTheme = getStoredTheme();
}

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    try {
      listener();
    } catch (e) {
      console.warn("Erro no listener de tema:", e);
    }
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
  memoryTheme = theme;
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  } catch {}
  applyThemeToDOM(theme);
  emitChange();
}

export function toggleAppTheme(): AppTheme {
  const current = memoryTheme;
  const next: AppTheme = current === "dark" ? "light" : "dark";
  setAppTheme(next);
  return next;
}

function subscribe(callback: () => void) {
  listeners.add(callback);

  // Sincroniza abas do navegador
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && (e.newValue === "light" || e.newValue === "dark")) {
      memoryTheme = e.newValue as AppTheme;
      applyThemeToDOM(memoryTheme);
      callback();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getSnapshot(): AppTheme {
  return memoryTheme;
}

function getServerSnapshot(): AppTheme {
  return "light";
}

export function useAppTheme(): {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  toggleTheme: () => void;
  isDark: boolean;
} {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    setAppTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    toggleAppTheme();
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === "dark",
  };
}
