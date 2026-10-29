"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Keyboard,
  AlertCircle,
  ScanLine,
} from "lucide-react";
import { playBarcodeSuccessFeedback } from "@/lib/barcode-feedback";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  subtitle?: string;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = "Leitura de código de barras",
  subtitle = "Aponte a câmera para o código do produto",
}: BarcodeScannerModalProps) {
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const html5QrCodeRef = useRef<any>(null);
  const isScannedRef = useRef(false);
  const scannerContainerId = "luvea-barcode-reader";

  useEffect(() => {
    if (!isOpen) {
      setPermissionError(null);
      setIsInitializing(true);
      setShowManualInput(false);
      setManualCode("");
      setIsTorchOn(false);
      return;
    }

    isScannedRef.current = false;
    let isCancelled = false;

    const startScanner = async () => {
      try {
        setIsInitializing(true);
        setPermissionError(null);

        // Importação dinâmica para evitar problemas de SSR no Next.js
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
          "html5-qrcode"
        );

        if (isCancelled) return;

        // Formatos suportados no varejo e cosméticos
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
        ];

        // Obtém dispositivos de câmera disponíveis
        const devices = await Html5Qrcode.getCameras().catch(() => []);
        if (isCancelled) return;

        setCameras(devices);

        const qrCodeInstance = new Html5Qrcode(scannerContainerId, {
          formatsToSupport,
          verbose: false,
        });
        html5QrCodeRef.current = qrCodeInstance;

        // Configuração de mira e resolução
        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.88),
              height: Math.floor(minEdge * 0.55),
            };
          },
          aspectRatio: 1.333333,
        };

        const cameraIdOrConfig =
          devices.length > 0
            ? { deviceId: { exact: devices[currentCameraIndex % devices.length].id } }
            : { facingMode: "environment" };

        await qrCodeInstance.start(
          cameraIdOrConfig,
          config,
          (decodedText: string) => {
            if (isScannedRef.current) return;
            isScannedRef.current = true;
            playBarcodeSuccessFeedback();
            onScan(decodedText.trim());
            onClose();
          },
          () => {
            // Callback contínuo de frame sem código (ignorado silenciosamente)
          }
        );

        if (isCancelled) {
          qrCodeInstance.stop().catch(() => {});
          return;
        }

        setIsInitializing(false);

        // Verifica suporte a lanterna (Torch)
        try {
          const track = qrCodeInstance.getRunningTrackCameraCapabilities();
          if (track && track.torchFeature().isSupported()) {
            setIsTorchSupported(true);
          }
        } catch {
          setIsTorchSupported(false);
        }
      } catch (err: any) {
        if (isCancelled) return;
        setIsInitializing(false);
        const errMessage = String(err?.message || err);
        if (
          errMessage.includes("NotAllowedError") ||
          errMessage.includes("Permission denied") ||
          errMessage.includes("PermissionDismissedError")
        ) {
          setPermissionError(
            "Permissão de câmera necessária. Por favor, permita o acesso à câmera nas configurações do navegador para escanear."
          );
        } else if (
          errMessage.includes("NotFoundError") ||
          errMessage.includes("No video device found")
        ) {
          setPermissionError(
            "Nenhuma câmera encontrada no dispositivo. Você pode digitar o código de barras manualmente abaixo ou conectar um leitor USB."
          );
        } else {
          setPermissionError(
            "Não foi possível acessar a câmera no momento. Verifique se outro aplicativo está utilizando-a ou digite o código manualmente."
          );
        }
      }
    };

    // Aguarda o container DOM estar montado antes de iniciar a câmera
    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current
            .stop()
            .catch(() => {})
            .then(() => {
              try {
                html5QrCodeRef.current.clear();
              } catch {}
            });
        }
      }
    };
  }, [isOpen, currentCameraIndex, onScan, onClose]);

  // Atalho de teclado Escape para fechar o modal com segurança
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Alterna lanterna
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !isTorchSupported) return;
    try {
      const nextState = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch {
      // Ignora silenciosamente se o hardware rejeitar
    }
  };

  // Alterna entre câmeras disponíveis
  const switchCamera = () => {
    if (cameras.length <= 1) return;
    setCurrentCameraIndex((prev) => (prev + 1) % cameras.length);
  };

  // Envio manual
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playBarcodeSuccessFeedback();
    onScan(manualCode.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EFEFF4] dark:border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white shrink-0">
              <ScanLine className="w-4 h-4 text-[#1C1C1E] dark:text-white" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white leading-tight">
                {title}
              </h2>
              <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa] leading-tight mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar leitor de código de barras"
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] dark:bg-[#27272a] dark:hover:bg-[#3f3f46] text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport da Câmera / Erro */}
        <div className="p-5 flex flex-col items-center">
          {permissionError ? (
            <div className="w-full py-8 px-4 flex flex-col items-center text-center space-y-3 bg-[#F5F5F7] dark:bg-[#27272a]/60 rounded-xl border border-[#E5E5EA] dark:border-[#27272a]">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-[13px] font-medium text-[#1C1C1E] dark:text-white max-w-xs">
                {permissionError}
              </p>
              <button
                type="button"
                onClick={() => {
                  setPermissionError(null);
                  setIsInitializing(true);
                  setCurrentCameraIndex((prev) => prev);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[12px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] transition shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar novamente</span>
              </button>
            </div>
          ) : (
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-inner">
              {/* Container interno do HTML5-QRCode */}
              <div id={scannerContainerId} className="w-full h-full" />

              {/* Mira visual de enquadramento (Overlay) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[84%] h-[55%] border-2 border-white/80 rounded-xl relative shadow-2xl">
                  {/* Cantos destacados */}
                  <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
                  <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />

                  {/* Linha guia de laser sutil */}
                  <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
                </div>
              </div>

              {/* Indicador de inicialização */}
              {isInitializing && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white">
                  <RefreshCw className="w-6 h-6 animate-spin text-white/80" />
                  <span className="text-[12px] text-white/70">
                    Iniciando câmera...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Controles de Câmera (Lanterna & Troca de Câmera) */}
          <div className="flex items-center justify-center gap-2.5 mt-3.5">
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={switchCamera}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[11.5px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Trocar câmera</span>
              </button>
            )}

            {isTorchSupported && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11.5px] font-medium transition ${
                  isTorchOn
                    ? "bg-[#1C1C1E] text-white border-[#1C1C1E] dark:bg-white dark:text-[#09090b]"
                    : "border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7]"
                }`}
              >
                {isTorchOn ? (
                  <>
                    <ZapOff className="w-3.5 h-3.5" />
                    <span>Desligar lanterna</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Ligar lanterna</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Rodapé: Entrada Manual Alternativa */}
        <div className="px-5 py-3.5 bg-[#F5F5F7] dark:bg-[#27272a]/40 border-t border-[#EFEFF4] dark:border-[#27272a]">
          {!showManualInput ? (
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="w-full flex items-center justify-center gap-1.5 text-[12px] font-medium text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white transition"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Não conseguiu ler? Digitar código manualmente</span>
            </button>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label className="block text-[11px] font-medium text-[#6E6E73] dark:text-[#a1a1aa]">
                Código de barras manual
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ex: 7891234567890"
                  className="flex-1 px-3.5 py-1.5 rounded-full border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[12.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition tabular-nums"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="px-4 py-1.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#f4f4f5] text-white dark:text-[#09090b] text-[12px] font-semibold transition disabled:opacity-50"
                >
                  OK
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
