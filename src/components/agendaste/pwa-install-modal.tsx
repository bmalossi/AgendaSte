"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Share,
  PlusSquare,
  Smartphone,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Laptop,
  Compass,
  ExternalLink,
} from "lucide-react";

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop?: boolean;
  isChromeIOS?: boolean;
  isSafari?: boolean;
  isInAppBrowser?: boolean;
  hasNativePrompt?: boolean;
  onDirectInstall?: () => Promise<any>;
}

export function PWAInstallModal({
  isOpen,
  onClose,
  isIOS,
  isAndroid,
  isDesktop = false,
  isChromeIOS = false,
  isInAppBrowser = false,
  hasNativePrompt = false,
  onDirectInstall,
}: PWAInstallModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyAppUrl = async () => {
    try {
      const url = window.location.origin + "/app";
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleRetryDirectInstall = async () => {
    if (!onDirectInstall) return;
    try {
      setIsRetrying(true);
      await onDirectInstall();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-md bg-white dark:bg-[#18181b] rounded-t-3xl sm:rounded-3xl border border-[#E5E5EA] dark:border-[#27272a] shadow-2xl p-6 sm:p-7 space-y-6 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center font-bold text-lg shadow-sm border border-[#27272A] shrink-0">
              L
            </div>
            <div>
              <h3
                id="pwa-install-title"
                className="text-[17px] font-semibold text-[#1C1C1E] dark:text-white leading-tight"
              >
                {isIOS
                  ? "Adicionar à Tela de Início"
                  : isInAppBrowser
                  ? "Instalar Aplicativo LUVEA"
                  : isDesktop
                  ? "Instalar no Computador"
                  : "Instalação Manual do App"}
              </h3>
              <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                {isIOS
                  ? "Instalação rápida e oficial no seu iPhone"
                  : isInAppBrowser
                  ? "Navegador interno detectado"
                  : isDesktop
                  ? "Atalho em tela cheia na área de trabalho"
                  : "Adicione o app da LUVEA ao seu aparelho"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CENÁRIO 1: iOS (iPhone / iPad / Safari) */}
        {isIOS ? (
          <div className="space-y-4">
            {isChromeIOS && (
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] dark:bg-[#202023] border border-[#E5E5EA] dark:border-[#2e2e32] text-[12px] text-[#1C1C1E] dark:text-[#e4e4e7] space-y-2">
                <p>
                  No iPhone, a Apple permite instalação com tela cheia apenas através do <strong>Safari</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleCopyAppUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#27272a] border border-[#D4D4D8] dark:border-[#3f3f46] text-[#1C1C1E] dark:text-white font-medium text-[11.5px] hover:bg-[#F5F5F7] transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Link copiado!" : "Copiar link para abrir no Safari"}</span>
                </button>
              </div>
            )}

            <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
              Siga os 3 passos abaixo no Safari do seu iPhone:
            </p>

            <div className="space-y-2.5">
              {/* Passo 1 */}
              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#202023] border border-[#E5E5EA] dark:border-[#2e2e32] flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] flex items-center justify-center text-[#1C1C1E] dark:text-white shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div className="text-[12.5px] leading-snug">
                  <span className="font-semibold text-[#1C1C1E] dark:text-white">1. Toque em Compartilhar</span>
                  <p className="text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                    Botão quadrado com seta para cima na barra inferior do Safari.
                  </p>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#202023] border border-[#E5E5EA] dark:border-[#2e2e32] flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] flex items-center justify-center text-[#1C1C1E] dark:text-white shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-[12.5px] leading-snug">
                  <span className="font-semibold text-[#1C1C1E] dark:text-white">
                    2. Toque em &quot;Adicionar à Tela de Início&quot;
                  </span>
                  <p className="text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                    Role a lista de opções para encontrar o ícone quadrado com &quot;+&quot;.
                  </p>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#202023] border border-[#E5E5EA] dark:border-[#2e2e32] flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] flex items-center justify-center text-[#1C1C1E] dark:text-white shrink-0 font-bold text-xs">
                  OK
                </div>
                <div className="text-[12.5px] leading-snug">
                  <span className="font-semibold text-[#1C1C1E] dark:text-white">
                    3. Confirme em &quot;Adicionar&quot; no topo direito
                  </span>
                  <p className="text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                    O ícone da LUVEA será criado como um aplicativo nativo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : isInAppBrowser ? (
          /* CENÁRIO 2: Navegador Interno (WhatsApp, Instagram, etc) */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#202023] border border-[#E5E5EA] dark:border-[#2e2e32] space-y-2">
              <div className="flex items-center gap-2 text-[#1C1C1E] dark:text-white text-[13px] font-medium">
                <Compass className="w-4 h-4" />
                <span>Abra no seu navegador padrão</span>
              </div>
              <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                Navegadores internos de redes sociais não permitem a instalação de aplicativos. Para instalar com 1 clique, abra no <strong>Google Chrome</strong> (Android) ou <strong>Safari</strong> (iPhone).
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyAppUrl}
              className="w-full py-3 px-5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[13.5px] font-semibold shadow-sm hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? "Link copiado! Abra no navegador" : "Copiar Link para abrir no Chrome/Safari"}</span>
            </button>
          </div>
        ) : isDesktop ? (
          /* CENÁRIO 3: Desktop (Chrome / Edge / Computador) */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#202023] border border-[#E5E5EA] dark:border-[#2e2e32] space-y-3">
              <div className="flex items-center gap-2 text-[#1C1C1E] dark:text-white text-[13px] font-medium">
                <Laptop className="w-4 h-4" />
                <span>Instalação na barra do navegador</span>
              </div>
              <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                No computador, procure o ícone de instalação (um monitor com seta para baixo) localizado no lado direito da barra de endereços do seu navegador.
              </p>
            </div>

            {hasNativePrompt && (
              <button
                type="button"
                onClick={handleRetryDirectInstall}
                disabled={isRetrying}
                className="w-full py-3 px-5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[13.5px] font-semibold shadow-sm hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>{isRetrying ? "Abrindo confirmação..." : "Tentar Instalação Direta"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyAppUrl}
              className="w-full py-2.5 px-4 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[12.5px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#323238] transition-colors flex items-center justify-center gap-2"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? "Link copiado!" : "Copiar link do App"}</span>
            </button>
          </div>
        ) : (
          /* CENÁRIO 4: Android Fallback Manual */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#202023] border border-[#E5E5EA] dark:border-[#2e2e32] space-y-2">
              <p className="text-[13px] text-[#1C1C1E] dark:text-white font-medium">
                Se a confirmação automática não abriu:
              </p>
              <div className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] space-y-1.5 leading-relaxed">
                <p>1. Toque no menu de opções do navegador (três pontos no topo).</p>
                <p>2. Selecione <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.</p>
              </div>
            </div>

            {hasNativePrompt && (
              <button
                type="button"
                onClick={handleRetryDirectInstall}
                disabled={isRetrying}
                className="w-full py-3 px-5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[13.5px] font-semibold shadow-sm hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>{isRetrying ? "Abrindo confirmação..." : "Tentar Instalação Automática Novamente"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyAppUrl}
              className="w-full py-2.5 px-4 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[12.5px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#323238] transition-colors flex items-center justify-center gap-2"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? "Link copiado!" : "Copiar link do App"}</span>
            </button>
          </div>
        )}

        {/* Micro-garantias rodapé */}
        <div className="pt-2 border-t border-[#F2F2F7] dark:border-[#27272a] flex items-center justify-center gap-4 text-[11px] text-[#8E8E93] dark:text-[#71717a]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Seguro
          </span>
          <span>•</span>
          <span>Sem ocupar espaço</span>
          <span>•</span>
          <span>Acesso Rápido</span>
        </div>
      </div>
    </div>
  );
}
