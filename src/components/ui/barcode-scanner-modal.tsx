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
  Image as ImageIcon,
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
  subtitle = "Aponte a câmera para o código do produto ou QR Code",
}: BarcodeScannerModalProps) {
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const quaggaRef = useRef<any>(null);
  const qrReaderRef = useRef<any>(null);
  const nativeIntervalRef = useRef<any>(null);
  const handleDetectedRef = useRef<any>(null);
  const isScannedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerContainerId = "luvea-barcode-reader";

  // Desativa e libera todos os recursos de câmera e decodificadores
  const cleanupScanner = () => {
    if (nativeIntervalRef.current) {
      clearInterval(nativeIntervalRef.current);
      nativeIntervalRef.current = null;
    }
    if (qrReaderRef.current) {
      try {
        qrReaderRef.current.stopContinuousDecode();
        qrReaderRef.current.reset();
      } catch {}
      qrReaderRef.current = null;
    }
    if (quaggaRef.current) {
      try {
        if (handleDetectedRef.current) {
          quaggaRef.current.offDetected(handleDetectedRef.current);
        }
        quaggaRef.current.stop();
      } catch {}
      quaggaRef.current = null;
    }
    const container = document.getElementById(scannerContainerId);
    if (container) {
      container.innerHTML = "";
    }
  };

  const handleSuccess = (decodedValue: string) => {
    const clean = decodedValue.trim();
    if (!clean || isScannedRef.current) return;
    isScannedRef.current = true;
    cleanupScanner();
    playBarcodeSuccessFeedback();
    onScan(clean);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setPermissionError(null);
      setIsInitializing(true);
      setShowManualInput(false);
      setManualCode("");
      setIsTorchOn(false);
      setIsProcessingFile(false);
      cleanupScanner();
      return;
    }

    isScannedRef.current = false;
    let isCancelled = false;

    const startScanner = async () => {
      try {
        setIsInitializing(true);
        setPermissionError(null);

        // Importação dinâmica das engines híbridas:
        // 1. Quagga2: Especialista em códigos de barras 1D (EAN-13, EAN-8, UPC, Code 128) com localizador multi-ângulo.
        // 2. ZXing BrowserQRCodeReader: Especialista em QR Codes bidimensionais.
        const Quagga = (await import("@ericblade/quagga2")).default;
        const ZXingModule: any = await import("html5-qrcode/third_party/zxing-js.umd" as any);
        const ZXing: any = ZXingModule.default || ZXingModule;

        if (isCancelled) return;
        quaggaRef.current = Quagga;

        const targetContainer = document.getElementById(scannerContainerId);
        if (!targetContainer || isCancelled) return;
        targetContainer.innerHTML = "";

        // Enumera câmeras disponíveis
        try {
          const videoDevices = await Quagga.CameraAccess.enumerateVideoDevices();
          if (videoDevices && videoDevices.length > 0) {
            setCameras(
              videoDevices.map((d: any, idx: number) => ({
                id: d.deviceId,
                label: d.label || `Câmera ${idx + 1}`,
              }))
            );
          }
        } catch {
          // Continua com dispositivo padrão
        }

        const selectedDeviceId =
          cameras.length > 0
            ? cameras[currentCameraIndex % cameras.length]?.id
            : undefined;

        // Configuração Quagga2 para detecção de códigos lineares 1D em tempo real
        await new Promise<void>((resolve, reject) => {
          Quagga.init(
            {
              inputStream: {
                type: "LiveStream",
                target: targetContainer,
                constraints: {
                  width: { min: 640, ideal: 1280, max: 1920 },
                  height: { min: 480, ideal: 720, max: 1080 },
                  facingMode: "environment",
                  ...(selectedDeviceId
                    ? { deviceId: { exact: selectedDeviceId } }
                    : {}),
                },
                singleChannel: false,
              },
              locator: {
                patchSize: "medium",
                halfSample: true,
              },
              numOfWorkers: 0,
              decoder: {
                readers: [
                  "ean_reader",
                  "ean_8_reader",
                  "code_128_reader",
                  "code_39_reader",
                  "upc_reader",
                  "upc_e_reader",
                ],
              },
              locate: true,
            },
            (err: any) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        });

        if (isCancelled) {
          Quagga.stop();
          return;
        }

        Quagga.start();
        setIsInitializing(false);

        // Listener de códigos 1D via Quagga
        handleDetectedRef.current = (result: any) => {
          const code = result?.codeResult?.code;
          if (code && !isScannedRef.current) {
            handleSuccess(code);
          }
        };
        Quagga.onDetected(handleDetectedRef.current);

        // Conecta decodificador de QR Code no mesmo elemento <video> gerado pelo Quagga
        const videoElement = targetContainer.querySelector("video");
        if (videoElement) {
          const BrowserQRReader = (ZXing as any).BrowserQRCodeReader;
          const qrReader = new BrowserQRReader();
          qrReaderRef.current = qrReader;

          qrReader.decodeFromVideoElementContinuously(
            videoElement,
            (result: any) => {
              if (result && !isScannedRef.current) {
                const text = result.getText?.() || result.text;
                if (text) {
                  handleSuccess(text);
                }
              }
            }
          );

          // Engine 3: BarcodeDetector nativo de hardware (quando disponível no navegador)
          if (typeof window !== "undefined" && "BarcodeDetector" in window) {
            try {
              const supported = await (window as any).BarcodeDetector.getSupportedFormats().catch(
                () => []
              );
              const nativeDetector = new (window as any).BarcodeDetector(
                supported.length > 0 ? { formats: supported } : undefined
              );

              nativeIntervalRef.current = setInterval(async () => {
                if (isScannedRef.current) {
                  if (nativeIntervalRef.current) {
                    clearInterval(nativeIntervalRef.current);
                    nativeIntervalRef.current = null;
                  }
                  return;
                }
                if (videoElement.readyState >= 2 && !videoElement.paused) {
                  try {
                    const barcodes = await nativeDetector.detect(videoElement);
                    if (barcodes && barcodes.length > 0) {
                      const detected = barcodes[0]?.rawValue?.trim();
                      if (detected && !isScannedRef.current) {
                        handleSuccess(detected);
                      }
                    }
                  } catch {}
                }
              }, 100);
            } catch {}
          }
        }

        // Verifica suporte a lanterna (Torch)
        try {
          const track = Quagga.CameraAccess.getActiveTrack();
          if (track && track.getCapabilities) {
            const caps = track.getCapabilities();
            if (caps && "torch" in caps) {
              setIsTorchSupported(true);
            }
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
          errMessage.includes("No video device found") ||
          errMessage.includes("DevicesNotFoundError")
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

    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [isOpen, currentCameraIndex, onScan, onClose]);

  // Atalho de teclado Escape
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
    if (!quaggaRef.current || !isTorchSupported) return;
    try {
      const track = quaggaRef.current.CameraAccess.getActiveTrack();
      if (!track) return;
      const nextState = !isTorchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setIsTorchOn(nextState);
    } catch {
      // Hardware rejeitou lanterna silenciosamente
    }
  };

  // Alterna câmera
  const switchCamera = () => {
    if (cameras.length <= 1) return;
    cleanupScanner();
    setCurrentCameraIndex((prev) => (prev + 1) % cameras.length);
  };

  // Leitura a partir de foto ou imagem enviada
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setPermissionError(null);

    try {
      const fileUrl = URL.createObjectURL(file);

      // 1. Tenta decodificação nativa imediata via BarcodeDetector
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const supported = await (window as any).BarcodeDetector.getSupportedFormats().catch(
            () => []
          );
          const detector = new (window as any).BarcodeDetector(
            supported.length > 0 ? { formats: supported } : undefined
          );
          const bitmap = await createImageBitmap(file);
          const detectedBarcodes = await detector.detect(bitmap);
          if (detectedBarcodes && detectedBarcodes.length > 0) {
            const raw = detectedBarcodes[0]?.rawValue?.trim();
            if (raw) {
              URL.revokeObjectURL(fileUrl);
              handleSuccess(raw);
              return;
            }
          }
        } catch {}
      }

      // 2. Tenta decodificação 1D com Quagga2
      const Quagga = (await import("@ericblade/quagga2")).default;
      const quaggaResult = await new Promise<any>((resolve) => {
        Quagga.decodeSingle(
          {
            src: fileUrl,
            numOfWorkers: 0,
            inputStream: { size: 1280 },
            decoder: {
              readers: [
                "ean_reader",
                "ean_8_reader",
                "code_128_reader",
                "code_39_reader",
                "upc_reader",
                "upc_e_reader",
              ],
            },
            locate: true,
          },
          (res) => resolve(res)
        );
      });

      if (quaggaResult?.codeResult?.code) {
        URL.revokeObjectURL(fileUrl);
        handleSuccess(quaggaResult.codeResult.code.trim());
        return;
      }

      // 3. Tenta decodificação de QR Code com ZXing
      const ZXingModule: any = await import("html5-qrcode/third_party/zxing-js.umd" as any);
      const ZXing: any = ZXingModule.default || ZXingModule;
      const BrowserQRReader = ZXing.BrowserQRCodeReader;
      const qrReader = new BrowserQRReader();
      try {
        const qrRes = await qrReader.decodeFromImageUrl(fileUrl);
        if (qrRes && qrRes.getText()) {
          URL.revokeObjectURL(fileUrl);
          handleSuccess(qrRes.getText().trim());
          return;
        }
      } catch {}

      URL.revokeObjectURL(fileUrl);
      setPermissionError(
        "Não foi possível identificar o código nesta foto. Experimente aproximar o código de barras ou digite o número manualmente."
      );
    } catch {
      setPermissionError(
        "Não foi possível identificar o código nesta foto. Experimente aproximar o código de barras ou digite o número manualmente."
      );
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Envio manual
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccess(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 motion-reduce:animate-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EFEFF4] dark:border-[#27272a]">
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
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] dark:bg-[#27272a] dark:hover:bg-[#3f3f46] text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white flex items-center justify-center transition cursor-pointer"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[12px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] transition shadow-2xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar novamente</span>
              </button>
            </div>
          ) : (
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-inner">
              {/* Container interno da câmera (Quagga + ZXing) */}
              <div
                id={scannerContainerId}
                className="w-full h-full relative [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:hidden"
              />

              {/* Mira visual de enquadramento (Overlay) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[88%] h-[50%] border-2 border-white/80 rounded-xl relative shadow-2xl">
                  {/* Cantos destacados */}
                  <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
                  <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />

                  {/* Linha guia de laser sutil */}
                  <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse motion-reduce:animate-none" />
                </div>
              </div>

              {/* Indicador de inicialização ou processamento de arquivo */}
              {(isInitializing || isProcessingFile) && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white">
                  <RefreshCw className="w-6 h-6 animate-spin motion-reduce:animate-none text-white/80" />
                  <span className="text-[12px] text-white/70">
                    {isProcessingFile ? "Processando imagem..." : "Iniciando câmera..."}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Dica de enquadramento sutil */}
          <p className="text-[11px] text-[#8E8E93] dark:text-[#71717a] text-center mt-2.5">
            Aponte para o código mantendo uma distância de 10 a 20 cm
          </p>

          {/* Controles de Câmera, Lanterna e Upload de Foto */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={switchCamera}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[11.5px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Trocar câmera</span>
              </button>
            )}

            {isTorchSupported && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11.5px] font-medium transition cursor-pointer ${
                  isTorchOn
                    ? "bg-[#1C1C1E] text-white border-[#1C1C1E] dark:bg-white dark:text-[#09090b]"
                    : "border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]"
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

            {/* Escanear a partir de foto */}
            <label
              htmlFor="barcode-photo-upload"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[11.5px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Escanear foto</span>
              <input
                id="barcode-photo-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* Rodapé: Entrada Manual Alternativa */}
        <div className="px-5 py-3.5 bg-[#F5F5F7] dark:bg-[#27272a]/40 border-t border-[#EFEFF4] dark:border-[#27272a]">
          {!showManualInput ? (
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="w-full min-h-[44px] flex items-center justify-center gap-1.5 text-[12px] font-medium text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white transition cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Não conseguiu ler? Digitar código manualmente</span>
            </button>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label
                htmlFor="manual-barcode-input"
                className="block text-[11px] font-medium text-[#6E6E73] dark:text-[#a1a1aa]"
              >
                Código de barras manual
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="manual-barcode-input"
                  type="text"
                  autoFocus
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ex: 9786583195678"
                  className="flex-1 px-3.5 py-2 rounded-full border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[12.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition tabular-nums"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="min-h-[40px] px-4 py-2 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#f4f4f5] text-white dark:text-[#09090b] text-[12px] font-semibold transition disabled:opacity-50 cursor-pointer"
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
