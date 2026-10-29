"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { LuveaWordmark, LuveaIcon } from "@/components/luvea-logo";

interface UnpairedViewProps {
  onAuthorized: (token: string, deviceName?: string) => void;
}

export function UnpairedView({ onAuthorized }: UnpairedViewProps) {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originUrl, setOriginUrl] = useState("");
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<any>(null);

  // 1. Wake Lock API (Impede Smart TVs de entrarem em tela de descanso)
  useEffect(() => {
    let released = false;

    async function requestWakeLock() {
      if ("wakeLock" in navigator && !released) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        } catch {
          // Ignora silenciosamente em navegadores sem suporte
        }
      }
    }

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch {
          // Ignora
        }
      }
    };
  }, []);

  // 2. Determina a URL base para o QR Code (redireciona para o painel de configurações)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  // 3. Função para gerar um novo código de pareamento
  const fetchNewCode = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/tv/pair", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Falha ao comunicar com o servidor.");
      }
      if (data.code) {
        setCode(data.code);
        setExpiresAt(data.expiresAt);
      } else {
        throw new Error("Código não retornado.");
      }
    } catch (err: any) {
      console.error("[TV UnpairedView] Erro ao gerar código:", err);
      setError(err?.message || "Não foi possível gerar o código. Verifique a conexão Wi-Fi da TV.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewCode();
  }, [fetchNewCode]);

  // 4. Polling rápido a cada 3 segundos para escutar autorização da gestora
  useEffect(() => {
    if (!code) return;

    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/tv/pair?code=${encodeURIComponent(code)}`);
        if (res.status === 410) {
          // Código expirou: gera um novo automaticamente sem precisar de F5
          console.log("[TV UnpairedView] Código expirou. Gerando novo...");
          fetchNewCode();
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.status === "AUTHORIZED" && data.token) {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
            }
            // Transita suavemente para o estado pareado
            onAuthorized(data.token, data.deviceName);
          }
        }
      } catch (pollErr) {
        // Falhas transitórias de rede não devem quebrar o loop
        console.warn("[TV Polling error]:", pollErr);
      }
    }, 3000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [code, fetchNewCode, onAuthorized]);

  // Formatação visual refinada do código (LUV-892 437)
  const formattedCode = code
    ? `LUV-${code.slice(0, 3)} ${code.slice(3, 6)}`
    : "LUV-000 000";

  const qrUrl = code
    ? `${originUrl || "https://app.luvea.app"}/app?action=pair-tv&code=${code}`
    : "";

  return (
    <div className="relative flex flex-col justify-between items-center min-h-screen w-full p-8 md:p-14 bg-[#09090B] text-white">
      {/* Vídeo invisível de 1x1 pixel em loop como fallback de Wake Lock para Smart TVs */}
      <video
        aria-hidden="true"
        className="fixed top-0 left-0 w-[1px] h-[1px] opacity-[0.001] pointer-events-none"
        autoPlay
        loop
        muted
        playsInline
      >
        <source
          src="data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAAAhmcmVlAAAABG1kYXQ="
          type="video/mp4"
        />
      </video>

      {/* Marca d'água sutil de fundo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none overflow-hidden select-none">
        <LuveaIcon size={800} dark />
      </div>

      {/* Cabeçalho */}
      <header className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <LuveaWordmark dark className="text-xl tracking-[0.24em]" />
          <span className="text-[11px] uppercase tracking-widest px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-400 font-medium">
            Modo Recepção
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-zinc-300 ring-2 ring-white/20 animate-pulse" />
          <span>Pronto para parear</span>
        </div>
      </header>

      {/* Corpo Central */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl z-10 my-8">
        {loading ? (
          <div className="flex flex-col items-center gap-4 text-zinc-400">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
            <span className="text-sm font-light tracking-wide text-zinc-300">
              Gerando código de conexão seguro...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-center max-w-md p-8 rounded-2xl bg-[#141418] border border-white/[0.08]">
            <p className="text-sm text-zinc-300">{error}</p>
            <button
              onClick={fetchNewCode}
              className="px-6 py-2.5 rounded-full text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="w-full bg-[#101013]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 md:p-12 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center justify-between gap-12">
            {/* Instruções e Código */}
            <div className="flex-1 flex flex-col items-start gap-6">
              <div>
                <span className="text-xs uppercase tracking-widest font-medium text-zinc-400">
                  Pareamento de Dispositivo
                </span>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mt-1">
                  Conecte esta TV ao estúdio
                </h1>
              </div>

              <div className="space-y-3.5 text-sm text-zinc-400">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Acesse o app LUVEA no celular ou computador da gestora.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Vá em <strong>Configurações · LUVEA TV</strong>.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Digite os 6 dígitos abaixo ou aponte a câmera para o QR Code.</span>
                </div>
              </div>

              {/* Segmentos Táteis de Dígitos Legíveis a Distância */}
              <div className="w-full pt-3">
                <div className="flex items-center justify-start gap-2.5 md:gap-3.5 select-all">
                  <div className="flex items-center gap-2">
                    {code ? (
                      code.slice(0, 3).split("").map((digit, i) => (
                        <span
                          key={i}
                          className="w-11 h-14 sm:w-14 sm:h-18 md:w-16 md:h-20 rounded-xl sm:rounded-2xl bg-[#09090C] border border-white/[0.12] flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-light tabular-nums text-white shadow-inner"
                        >
                          {digit}
                        </span>
                      ))
                    ) : (
                      [0, 1, 2].map((i) => (
                        <span key={i} className="w-11 h-14 sm:w-14 sm:h-18 md:w-16 md:h-20 rounded-xl sm:rounded-2xl bg-[#09090C] border border-white/[0.06] animate-pulse" />
                      ))
                    )}
                  </div>
                  <span className="text-zinc-600 text-xl font-light px-1">–</span>
                  <div className="flex items-center gap-2">
                    {code ? (
                      code.slice(3, 6).split("").map((digit, i) => (
                        <span
                          key={i + 3}
                          className="w-11 h-14 sm:w-14 sm:h-18 md:w-16 md:h-20 rounded-xl sm:rounded-2xl bg-[#09090C] border border-white/[0.12] flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-light tabular-nums text-white shadow-inner"
                        >
                          {digit}
                        </span>
                      ))
                    ) : (
                      [3, 4, 5].map((i) => (
                        <span key={i} className="w-11 h-14 sm:w-14 sm:h-18 md:w-16 md:h-20 rounded-xl sm:rounded-2xl bg-[#09090C] border border-white/[0.06] animate-pulse" />
                      ))
                    )}
                  </div>
                </div>
                <p className="text-[12px] text-zinc-500 font-normal mt-3">
                  Código de acesso temporário · Válido por 10 minutos
                </p>
              </div>
            </div>

            {/* QR Code Container em Estética Cerâmica Pura */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="p-5 rounded-2xl bg-white shadow-[0_16px_36px_-8px_rgba(0,0,0,0.6)] flex items-center justify-center">
                {qrUrl ? (
                  <QRCodeSVG
                    value={qrUrl}
                    size={200}
                    level="M"
                    fgColor="#09090B"
                    bgColor="#FFFFFF"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] bg-zinc-200 animate-pulse rounded-xl" />
                )}
              </div>
              <span className="text-xs text-zinc-400 font-normal mt-3 tracking-wide">
                Aponte a câmera para autorizar
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Rodapé Fixo */}
      <footer className="w-full flex items-center justify-between text-xs text-zinc-500 z-10 border-t border-white/[0.06] pt-5">
        <div className="flex items-center gap-3">
          <span className="tracking-widest uppercase text-[11px] font-medium text-zinc-400">LUVEA</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-500 text-[12px]">Salon OS</span>
        </div>
        <span className="text-[12px] text-zinc-500 font-normal">Modo de Exibição Pública para Recepção</span>
      </footer>
    </div>
  );
}
