"use client";

import React, { useEffect, useState } from "react";
import { Smartphone, RotateCw } from "lucide-react";

/**
 * TVOrientationAdvisory
 * Exibe um aviso elegante e discreto quando a TV Kiosk é aberta em celular ou tablet vertical.
 * Segue rigorosamente o padrão Editorial Clean & Luxury Salon OS (Anti-AI Slop).
 */
export function TVOrientationAdvisory() {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const evaluateOrientation = () => {
      if (typeof window === "undefined") return;
      // Celular ou tablet vertical: altura > largura E largura < 1024px
      const isPortrait =
        window.innerHeight > window.innerWidth && window.innerWidth < 1024;
      setIsPortraitMobile(isPortrait);

      // Ao girar para horizontal, restaura para reavisar se voltar para vertical
      if (!isPortrait) {
        setDismissed(false);
      }
    };

    evaluateOrientation();

    window.addEventListener("resize", evaluateOrientation);
    window.addEventListener("orientationchange", evaluateOrientation);

    return () => {
      window.removeEventListener("resize", evaluateOrientation);
      window.removeEventListener("orientationchange", evaluateOrientation);
    };
  }, []);

  if (!isPortraitMobile || dismissed) {
    return null;
  }

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Aviso de orientação de tela para TV Kiosk"
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md transition-opacity duration-300"
    >
      <div className="relative max-w-sm w-full bg-[#111113] border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col items-center text-center shadow-2xl">
        {/* Ícone com estética editorial Apple / Linear */}
        <div className="relative w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4 text-white">
          <Smartphone className="w-7 h-7 text-zinc-300 transform -rotate-12 transition-transform duration-500 motion-reduce:transform-none" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-800 border border-white/15 flex items-center justify-center text-zinc-300">
            <RotateCw className="w-3 h-3 animate-spin motion-reduce:animate-none" />
          </div>
        </div>

        {/* Micro-badge editorial */}
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-white/[0.06] text-zinc-400 border border-white/10 mb-2.5">
          LUVEA · MODO PAISAGEM
        </span>

        {/* Título & Descrição */}
        <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight leading-snug">
          Gire o aparelho para a horizontal
        </h3>
        <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed mt-2">
          O Painel TV Kiosk foi concebido para exibição widescreen (16:9). Gire seu dispositivo para acompanhar a escala completa de profissionais e atendimentos.
        </p>

        {/* Ação secundária elegante para dispensar caso o usuário queira navegar em vertical */}
        <div className="w-full mt-5">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-full py-2 px-4 rounded-full text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
          >
            Continuar em modo vertical
          </button>
        </div>
      </div>
    </aside>
  );
}
