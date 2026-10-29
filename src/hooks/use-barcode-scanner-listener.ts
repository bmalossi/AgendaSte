"use client";

import { useEffect, useRef } from "react";

interface UseBarcodeScannerListenerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minChars?: number;
  maxIntervalMs?: number;
}

/**
 * Hook global para detectar leitores físicos de código de barras USB/Bluetooth (teclado HID).
 * Identifica rajadas rápidas de caracteres numéricos (< 60ms) seguidas de 'Enter'.
 */
export function useBarcodeScannerListener({
  onScan,
  enabled = true,
  minChars = 4,
  maxIntervalMs = 60,
}: UseBarcodeScannerListenerOptions) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora atalhos de sistema com Ctrl, Alt, Meta
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Proteção de digitação em campos de texto multilinhas:
      // Nunca intercepta o Enter se o foco estiver dentro de um <textarea>
      const activeEl = typeof document !== "undefined" ? document.activeElement : null;
      if (activeEl && activeEl.tagName === "TEXTAREA") {
        bufferRef.current = "";
        return;
      }

      const now = performance.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const scanned = bufferRef.current.trim();
        bufferRef.current = "";

        // Se tiver o tamanho mínimo e os caracteres foram recebidos em rajada de leitor
        if (scanned.length >= minChars) {
          e.preventDefault();
          e.stopPropagation();
          onScanRef.current(scanned);
        }
        return;
      }

      // Se passou mais de maxIntervalMs entre teclas, trata como digitação humana e reseta o buffer
      if (timeDiff > maxIntervalMs) {
        bufferRef.current = "";
      }

      // Aceita caracteres alfanuméricos padrão de códigos de barras
      if (e.key.length === 1 && /^[\w\-]$/i.test(e.key)) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [enabled, minChars, maxIntervalMs]);
}
