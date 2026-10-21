"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import Script from "next/script";
import { getTurnstileSiteKey } from "@/lib/turnstile";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "flexible" | "compact";
          callback?: (token: string) => void;
          "error-callback"?: (errorCode: string) => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export interface TurnstileWidgetRef {
  reset: () => void;
}

export interface TurnstileWidgetProps {
  siteKey?: string;
  action?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "flexible" | "compact";
  onVerify: (token: string) => void;
  onError?: (errorCode: string) => void;
  onExpire?: () => void;
  className?: string;
}

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  function TurnstileWidget(
    {
      siteKey,
      action = "form_submit",
      theme = "light",
      size = "normal",
      onVerify,
      onError,
      onExpire,
      className = "",
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const activeSiteKey = siteKey || getTurnstileSiteKey();

    const renderWidget = () => {
      if (
        typeof window === "undefined" ||
        !window.turnstile ||
        !containerRef.current ||
        widgetIdRef.current !== null
      ) {
        return;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: activeSiteKey,
          action,
          theme,
          size,
          callback: (token: string) => {
            onVerify(token);
          },
          "error-callback": (code: string) => {
            console.warn("[Turnstile Error Callback]:", code);
            const isLocal =
              typeof window !== "undefined" &&
              (window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1" ||
                window.location.hostname.endsWith(".localhost"));
            if (isLocal) {
              onVerify("XXXX.DUMMY.TOKEN.XXXX");
            }
            onError?.(code);
          },
          "expired-callback": () => {
            onExpire?.();
          },
        });

        widgetIdRef.current = id;
      } catch (err) {
        console.error("[Turnstile render exception]:", err);
      }
    };

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (
          typeof window !== "undefined" &&
          window.turnstile &&
          widgetIdRef.current !== null
        ) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      if (scriptLoaded) {
        renderWidget();
      }
      return () => {
        if (
          typeof window !== "undefined" &&
          window.turnstile &&
          widgetIdRef.current !== null
        ) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // Ignora se o widget já foi desmontado
          }
          widgetIdRef.current = null;
        }
      };
    }, [scriptLoaded, activeSiteKey, action]);

    return (
      <div className={`turnstile-wrapper my-2 flex justify-center ${className}`}>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => {
            setScriptLoaded(true);
            renderWidget();
          }}
          onReady={() => {
            setScriptLoaded(true);
            renderWidget();
          }}
        />
        <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />
      </div>
    );
  }
);
