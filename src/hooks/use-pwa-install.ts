"use client";

import { useState, useEffect, useCallback } from "react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type PWAPlatform = "ios" | "android" | "desktop" | "other";

export interface PWAInstallState {
  isInstalled: boolean;
  isInstallable: boolean;
  hasNativePrompt: boolean;
  platform: PWAPlatform;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isSafari: boolean;
  isChromeIOS: boolean;
  isInAppBrowser: boolean;
  showInstallModal: boolean;
  install: () => Promise<"accepted" | "dismissed" | "modal_opened">;
  openInstallModal: () => void;
  closeInstallModal: () => void;
}

// Cache em nível de módulo para garantir integridade singleton entre componentes
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalShowInstallModal = false;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();
const installListeners = new Set<() => void>();
const modalListeners = new Set<(show: boolean) => void>();

function setGlobalShowModal(show: boolean) {
  globalShowInstallModal = show;
  modalListeners.forEach((listener) => listener(show));
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((listener) => listener(globalDeferredPrompt));
  });

  window.addEventListener("appinstalled", () => {
    globalDeferredPrompt = null;
    promptListeners.forEach((listener) => listener(null));
    installListeners.forEach((listener) => listener());
    setGlobalShowModal(false);
  });
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => globalDeferredPrompt
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [hasNativePrompt, setHasNativePrompt] = useState<boolean>(
    () => Boolean(globalDeferredPrompt)
  );
  const [platform, setPlatform] = useState<PWAPlatform>("other");
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [isSafari, setIsSafari] = useState<boolean>(false);
  const [isChromeIOS, setIsChromeIOS] = useState<boolean>(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(
    () => globalShowInstallModal
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Detecta se já está rodando em modo Standalone (PWA instalado)
    const checkStandalone = (): boolean => {
      const isStandaloneMQ = window.matchMedia("(display-mode: standalone)").matches;
      const isIOSStandalone =
        "standalone" in window.navigator &&
        Boolean((window.navigator as unknown as { standalone: boolean }).standalone);
      const isAndroidApp = document.referrer.includes("android-app://");
      return isStandaloneMQ || isIOSStandalone || isAndroidApp;
    };

    setIsInstalled(checkStandalone());

    // 2. Detecção precisa de Plataforma & Navegador
    const ua = window.navigator.userAgent || "";
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    const isAndroidDevice = /Android/i.test(ua);
    const isChromeOnIOS = /CriOS/i.test(ua);
    const isSafariBrowser =
      /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
    const inApp = /FBAN|FBAV|Instagram|WhatsApp|BytedanceWebview|Line/i.test(ua);
    const isDesktopDevice = !isIOSDevice && !isAndroidDevice;

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsDesktop(isDesktopDevice);
    setIsChromeIOS(isChromeOnIOS);
    setIsSafari(isSafariBrowser);
    setIsInAppBrowser(inApp);

    if (isIOSDevice) {
      setPlatform("ios");
    } else if (isAndroidDevice) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // 3. Listener para mudança dinâmica de display-mode
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleMQChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener("change", handleMQChange);

    // 4. Conecta aos listeners do cache global
    const handlePromptUpdate = (p: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(p);
      setHasNativePrompt(Boolean(p));
    };
    promptListeners.add(handlePromptUpdate);

    const handleInstalledUpdate = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setHasNativePrompt(false);
      setGlobalShowModal(false);
    };
    installListeners.add(handleInstalledUpdate);

    const handleModalUpdate = (show: boolean) => {
      setShowInstallModal(show);
    };
    modalListeners.add(handleModalUpdate);

    // Se já havia prompt capturado globalmente, sincroniza imediatamente
    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
      setHasNativePrompt(true);
    }

    return () => {
      mediaQuery.removeEventListener("change", handleMQChange);
      promptListeners.delete(handlePromptUpdate);
      installListeners.delete(handleInstalledUpdate);
      modalListeners.delete(handleModalUpdate);
    };
  }, []);

  const openInstallModal = useCallback(() => {
    setGlobalShowModal(true);
  }, []);

  const closeInstallModal = useCallback(() => {
    setGlobalShowModal(false);
  }, []);

  const install = useCallback(async (): Promise<"accepted" | "dismissed" | "modal_opened"> => {
    // 1. Tenta obter o prompt nativo imediato
    let activePrompt = deferredPrompt || globalDeferredPrompt;

    // Se ainda não estiver pronto e não for iOS, aguarda brevemente (até 400ms)
    // caso o evento beforeinstallprompt esteja sendo disparado logo após o carregamento inicial da página
    if (!activePrompt && typeof window !== "undefined" && !isIOS) {
      activePrompt = await new Promise<BeforeInstallPromptEvent | null>((resolve) => {
        if (globalDeferredPrompt) return resolve(globalDeferredPrompt);
        let timer: ReturnType<typeof setTimeout>;
        const listener = (p: BeforeInstallPromptEvent | null) => {
          if (p) {
            clearTimeout(timer);
            promptListeners.delete(listener);
            resolve(p);
          }
        };
        promptListeners.add(listener);
        timer = setTimeout(() => {
          promptListeners.delete(listener);
          resolve(globalDeferredPrompt);
        }, 400);
      });
    }

    // 2. Se temos o prompt nativo (Android ou Desktop Chromium), aciona DIRETO sem modal intermediário!
    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          setHasNativePrompt(false);
          setGlobalShowModal(false);
        }
        return choice.outcome;
      } catch (err) {
        console.error("Erro ao invocar prompt nativo de instalação:", err);
        // Em caso de exceção/falha no prompt nativo, abre o fallback manual
        setGlobalShowModal(true);
        return "modal_opened";
      }
    }

    // 3. No iOS ou quando o prompt nativo não estiver pronto (fallback manual guiado)
    setGlobalShowModal(true);
    return "modal_opened";
  }, [deferredPrompt, isIOS]);

  return {
    isInstalled,
    isInstallable: !isInstalled,
    hasNativePrompt,
    platform,
    isIOS,
    isAndroid,
    isDesktop,
    isSafari,
    isChromeIOS,
    isInAppBrowser,
    showInstallModal,
    install,
    openInstallModal,
    closeInstallModal,
  };
}
