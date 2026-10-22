"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tv, ExternalLink, Check, RefreshCw, Smartphone } from "lucide-react";

interface TVDeviceItem {
  id: string;
  code: string;
  device_name: string;
  status: "PENDING" | "AUTHORIZED" | "EXPIRED" | "REVOKED";
  created_at: string;
  updated_at: string;
}

export function TvKioskSettingsSection({
  initialCode = "",
}: {
  initialCode?: string;
}) {
  const [code, setCode] = useState(initialCode);
  const [deviceName, setDeviceName] = useState("Smart TV Recepção");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [devices, setDevices] = useState<TVDeviceItem[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);

  // Edição inline de nome
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // 1. Busca dispositivos conectados
  const fetchDevices = useCallback(async () => {
    try {
      setIsLoadingDevices(true);
      const res = await fetch("/api/tv/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch (err) {
      console.warn("[TV Settings] Erro ao carregar dispositivos:", err);
    } finally {
      setIsLoadingDevices(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // 2. Submissão do código para autorizar TV
  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/\D/g, "").slice(0, 6);

    if (cleanCode.length !== 6) {
      setErrorMessage("O código precisa conter exatamente 6 dígitos numéricos.");
      setSuccessMessage(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await fetch("/api/tv/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          deviceName: deviceName.trim() || "Smart TV",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Não foi possível autorizar o dispositivo.");
      } else {
        setSuccessMessage("TV autorizada com sucesso! A tela atualizará automaticamente.");
        setCode("");
        fetchDevices();
      }
    } catch (err) {
      console.error("[TV Settings] Erro ao autorizar TV:", err);
      setErrorMessage("Erro de rede ao comunicar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Revogação de acesso
  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch("/api/tv/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setDevices((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: "REVOKED" } : d))
        );
      }
    } catch (err) {
      console.error("[TV Settings] Erro ao revogar:", err);
    }
  };

  // 4. Salvar nome renomeado
  const handleSaveName = async (id: string) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      setIsUpdatingName(true);
      const res = await fetch("/api/tv/devices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, device_name: editingName.trim() }),
      });

      if (res.ok) {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, device_name: editingName.trim() } : d
          )
        );
        setEditingId(null);
      }
    } catch (err) {
      console.error("[TV Settings] Erro ao salvar nome:", err);
    } finally {
      setIsUpdatingName(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Topo da Seção */}
      <div className="border-b border-[#E5E5EA] dark:border-[#27272a] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-serif font-normal text-[#1C1C1E] dark:text-white">
              LUVEA TV Kiosk
            </h2>
            <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
              Exibição passiva da agenda do dia em tempo real para Smart TVs e monitores de recepção.
            </p>
          </div>

          <a
            href="/tv"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white text-[12.5px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition-colors shrink-0"
          >
            <Tv className="w-3.5 h-3.5 text-[#71717A]" />
            <span>Abrir modo TV (`/tv`)</span>
            <ExternalLink className="w-3 h-3 text-[#A1A1AA]" />
          </a>
        </div>
      </div>

      {/* Card 1: Formulário de Pareamento de Novo Dispositivo */}
      <div className="bg-[#FBFBFC] dark:bg-[#1c1c20] border border-[#E5E5EA] dark:border-[#27272a] rounded-2xl p-6 space-y-6">
        <div>
          <h3 className="text-[15px] font-semibold text-[#1C1C1E] dark:text-white">
            Conectar Nova TV
          </h3>
          <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
            Abra a rota <code className="px-1.5 py-0.5 rounded bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] text-xs font-mono">/tv</code> no navegador da Smart TV e digite o código de 6 dígitos exibido na tela.
          </p>
        </div>

        <form onSubmit={handleAuthorize} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1.5">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Ex: 892437"
                maxLength={6}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white font-mono text-base tracking-wider focus:outline-none focus:ring-2 focus:ring-[#1C1C1E] dark:focus:ring-white/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1.5">
                Nome do Dispositivo
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Ex: TV Recepção"
                maxLength={50}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1C1C1E] dark:focus:ring-white/20 transition-all"
              />
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium hover:bg-[#2C2C2E] active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {isSubmitting ? "Autorizando..." : "Autorizar Dispositivo"}
            </button>
          </div>
        </form>
      </div>

      {/* Card 2: Lista de TVs Conectadas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#1C1C1E] dark:text-white">
            Dispositivos Pareados
          </h3>
          <button
            type="button"
            onClick={fetchDevices}
            disabled={isLoadingDevices}
            className="p-1.5 rounded-full text-[#71717A] hover:text-[#1C1C1E] dark:hover:text-white transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDevices ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isLoadingDevices ? (
          <div className="py-8 text-center text-xs font-mono text-[#71717A]">
            Carregando dispositivos...
          </div>
        ) : devices.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-[#D4D4D8] dark:border-[#3f3f46] text-center space-y-2 bg-[#FBFBFC] dark:bg-[#18181b]">
            <Tv className="w-8 h-8 text-[#A1A1AA] mx-auto" />
            <p className="text-[13px] font-medium text-[#1C1C1E] dark:text-white">
              Nenhuma Smart TV conectada
            </p>
            <p className="text-xs text-[#71717A] max-w-sm mx-auto">
              Abra a rota `/tv` em qualquer Smart TV ou monitor da recepção e digite o código de 6 dígitos acima.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5EA] dark:divide-[#27272a] border border-[#E5E5EA] dark:border-[#27272a] rounded-2xl overflow-hidden bg-white dark:bg-[#18181b]">
            {devices.map((device) => {
              const isRevoked = device.status === "REVOKED";
              const isEditing = editingId === device.id;

              return (
                <div
                  key={device.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] flex items-center justify-center shrink-0 text-[#1C1C1E] dark:text-white">
                      <Tv className="w-4 h-4" />
                    </div>

                    <div className="space-y-0.5">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveName(device.id)}
                            disabled={isUpdatingName}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1C1C1E] text-white hover:bg-[#2C2C2E]"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 rounded-lg text-xs text-[#71717A]"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[13.5px] font-medium text-[#1C1C1E] dark:text-white">
                            {device.device_name || "Smart TV"}
                          </span>
                          {!isRevoked && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(device.id);
                                setEditingName(device.device_name || "Smart TV");
                              }}
                              className="text-[11px] text-[#71717A] hover:text-[#1C1C1E] dark:hover:text-white transition-colors"
                            >
                              Renomear
                            </button>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-[#71717A] dark:text-[#a1a1aa] font-mono">
                        <span>LUV-{device.code}</span>
                        <span>·</span>
                        <span>
                          Pareado em{" "}
                          {new Date(device.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {/* Badge Sóbrio Anti-AI Slop */}
                    {isRevoked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] text-[#71717A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        Desconectado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] text-[#1C1C1E] dark:text-zinc-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                        Conectado
                      </span>
                    )}

                    {!isRevoked && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(device.id)}
                        className="px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-zinc-200 hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[12.5px] font-medium transition-colors"
                      >
                        Desconectar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
