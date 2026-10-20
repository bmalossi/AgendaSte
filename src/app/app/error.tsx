"use client";

import React, { useEffect } from "react";
import { RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LuveaWordmark } from "@/components/luvea-logo";

export default function AppErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    error.name === "ChunkLoadError" ||
    (error.message && error.message.toLowerCase().includes("chunk"));

  useEffect(() => {
    console.error("[LUVEA App Runtime Error]:", error);
  }, [error]);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#1C1C1E] flex flex-col justify-between selection:bg-[#1C1C1E] selection:text-white">
      <header className="w-full px-6 py-6 sm:px-10 flex items-center justify-between border-b border-[#E5E5EA] bg-white">
        <Link href="/" className="inline-flex items-center group py-1" aria-label="LUVEA - Início">
          <LuveaWordmark className="text-[20px] group-hover:opacity-80 transition-opacity" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao site</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E5EA] p-8 sm:p-10 shadow-xs text-center space-y-6">
          <div className="w-10 h-10 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] mx-auto flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-[22px] font-semibold text-[#1C1C1E] tracking-tight">
              {isChunkError
                ? "Nova versão do painel disponível"
                : "Não foi possível carregar o painel"}
            </h1>
            <p className="text-[13px] text-[#6E6E73] leading-relaxed">
              {isChunkError
                ? "Os arquivos do painel foram atualizados. Recarregue a página para sincronizar a versão mais recente do sistema."
                : "Ocorreu uma instabilidade transitória ao iniciar a aplicação. Tente recarregar os dados do seu estúdio."}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleReload}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium hover:bg-black transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recarregar painel</span>
            </button>

            <button
              type="button"
              onClick={() => reset()}
              className="w-full flex items-center justify-center gap-2 px-5 py-2 rounded-full border border-[#D4D4D8] bg-white text-[#1C1C1E] text-[12.5px] font-medium hover:bg-[#F5F5F7] transition"
            >
              <span>Tentar novamente sem recarregar</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-[#8E8E93] border-t border-[#E5E5EA] bg-white">
        Luvea Studio · Suporte e Infraestrutura
      </footer>
    </div>
  );
}
