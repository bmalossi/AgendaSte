"use client";

import React, { useEffect, useState } from "react";
import { UnpairedView } from "@/components/tv/unpaired-view";
import { LiveBoardView } from "@/components/tv/live-board-view";
import { TVOrientationAdvisory } from "@/components/tv/orientation-advisory";

export default function TVKioskPage() {
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tv_session_token");
      if (stored) {
        setToken(stored);
      }
    } catch (err) {
      console.warn("[TV Kiosk] Erro ao ler localStorage:", err);
    } finally {
      setInitialized(true);
    }
  }, []);

  const handleAuthorized = (newToken: string, deviceName?: string) => {
    try {
      localStorage.setItem("tv_session_token", newToken);
      if (deviceName) {
        localStorage.setItem("tv_device_name", deviceName);
      }
    } catch (err) {
      console.warn("[TV Kiosk] Erro ao salvar token:", err);
    }
    setToken(newToken);
  };

  const handleUnauthorized = () => {
    try {
      localStorage.removeItem("tv_session_token");
      localStorage.removeItem("tv_device_name");
    } catch (err) {
      console.warn("[TV Kiosk] Erro ao limpar token:", err);
    }
    setToken(null);
  };

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090B] text-zinc-500 font-mono text-sm">
        Iniciando LUVEA TV Kiosk...
      </div>
    );
  }

  return (
    <>
      <TVOrientationAdvisory />
      {!token ? (
        <UnpairedView onAuthorized={handleAuthorized} />
      ) : (
        <LiveBoardView token={token} onUnauthorized={handleUnauthorized} />
      )}
    </>
  );
}
