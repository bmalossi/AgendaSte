"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Tv,
  ExternalLink,
  Check,
  RefreshCw,
  Palette,
  Users,
} from "lucide-react";
import { TVThemeMode, TVScreenSize } from "@/lib/tv-kiosk";

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
  availableStaff = [],
}: {
  initialCode?: string;
  availableStaff?: Array<{
    id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
  }>;
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

  // Configurações de exibição da TV
  const [tvTheme, setTvTheme] = useState<TVThemeMode>("dark");
  const [tvScreenSize, setTvScreenSize] = useState<TVScreenSize>("32");
  const [showSyncBadge, setShowSyncBadge] = useState<boolean>(true);
  const [allProfessionals, setAllProfessionals] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [visibleProfessionalIds, setVisibleProfessionalIds] = useState<string[]>(
    []
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveFeedback, setSettingsSaveFeedback] = useState<string | null>(
    null
  );

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

  // 2. Busca configurações da TV
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/tv/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.theme) setTvTheme(data.theme);
        if (data.screenSize) setTvScreenSize(data.screenSize);
        if (typeof data.showSyncBadge === "boolean")
          setShowSyncBadge(data.showSyncBadge);
        if (Array.isArray(data.allProfessionals) && data.allProfessionals.length > 0) {
          setAllProfessionals(data.allProfessionals);
        }
        if (Array.isArray(data.visibleProfessionalIds)) {
          setVisibleProfessionalIds(data.visibleProfessionalIds);
        }
      }
    } catch (err) {
      console.warn("[TV Settings] Erro ao carregar configurações:", err);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    fetchSettings();
  }, [fetchDevices, fetchSettings]);

  // Mescla profissionais passados por prop (do state.staff) com os do backend
  useEffect(() => {
    if (availableStaff && availableStaff.length > 0) {
      setAllProfessionals((prev) => {
        const map = new Map<string, string>();
        prev.forEach((p) => map.set(p.id, p.name));
        availableStaff.forEach((s) => {
          const name =
            s.fullName ||
            [s.firstName, s.lastName].filter(Boolean).join(" ").trim() ||
            "Profissional";
          map.set(s.id, name);
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
      });
    }
  }, [availableStaff]);

  // Atualização persistente de configurações de TV
  const handleUpdateSettings = async (
    newTheme?: TVThemeMode,
    newSize?: TVScreenSize,
    newBadge?: boolean,
    newVisibleIds?: string[]
  ) => {
    const nextTheme = newTheme ?? tvTheme;
    const nextSize = newSize ?? tvScreenSize;
    const nextBadge = newBadge !== undefined ? newBadge : showSyncBadge;
    const nextVisible = newVisibleIds ?? visibleProfessionalIds;

    if (newTheme) setTvTheme(newTheme);
    if (newSize) setTvScreenSize(newSize);
    if (newBadge !== undefined) setShowSyncBadge(newBadge);
    if (newVisibleIds) setVisibleProfessionalIds(newVisibleIds);

    try {
      setIsSavingSettings(true);
      const res = await fetch("/api/tv/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: nextTheme,
          screenSize: nextSize,
          showSyncBadge: nextBadge,
          visibleProfessionalIds: nextVisible,
        }),
      });

      if (res.ok) {
        setSettingsSaveFeedback("Alteração salva na TV");
        setTimeout(() => setSettingsSaveFeedback(null), 2500);
      }
    } catch (err) {
      console.error("[TV Settings] Erro ao salvar configurações:", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Alterna visibilidade de um profissional específico na TV
  const handleToggleProfessional = (profId: string) => {
    const isCurrentlyVisible =
      visibleProfessionalIds.includes(profId) ||
      visibleProfessionalIds.length === 0;

    let nextList: string[];

    if (isCurrentlyVisible) {
      // Se era visível e vai ocultar
      const currentEffectiveList =
        visibleProfessionalIds.length === 0
          ? allProfessionals.map((p) => p.id)
          : visibleProfessionalIds;

      if (currentEffectiveList.length <= 1) {
        setSettingsSaveFeedback("Ao menos 1 profissional deve ficar ativo na TV");
        setTimeout(() => setSettingsSaveFeedback(null), 3000);
        return;
      }
      nextList = currentEffectiveList.filter((id) => id !== profId);
    } else {
      nextList = [...visibleProfessionalIds, profId];
    }

    setVisibleProfessionalIds(nextList);
    handleUpdateSettings(undefined, undefined, undefined, nextList);
  };

  // Selecionar todos os profissionais para exibição
  const handleSelectAllProfessionals = () => {
    const allIds = allProfessionals.map((p) => p.id);
    setVisibleProfessionalIds(allIds);
    handleUpdateSettings(undefined, undefined, undefined, allIds);
  };

  // 3. Submissão do código para autorizar TV
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

  // 4. Revogação de acesso
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

  // 5. Salvar nome renomeado
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

      {/* Card 1: Configurações de Exibição, Temas & Escala da TV */}
      <div className="bg-[#FBFBFC] dark:bg-[#1c1c20] border border-[#E5E5EA] dark:border-[#27272a] rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5E5EA] dark:border-[#27272a] pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#1C1C1E] dark:text-white" />
              <h3 className="text-[15px] font-semibold text-[#1C1C1E] dark:text-white">
                Modo de Exibição & Estilo da TV
              </h3>
            </div>
            <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa]">
              Personalize o tema visual, o tamanho da tela e as informações exibidas na recepção.
            </p>
          </div>

          {settingsSaveFeedback && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium animate-in fade-in duration-200">
              <Check className="w-3.5 h-3.5" />
              <span>{settingsSaveFeedback}</span>
            </div>
          )}
        </div>

        {/* 1.1 Modos Visuais (Temas) */}
        <div className="space-y-2.5">
          <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-[#71717A] dark:text-[#a1a1aa]">
            Tema Visual
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Tema 1: Escuro (Obsidian) */}
            <button
              type="button"
              onClick={() => handleUpdateSettings("dark", undefined, undefined)}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                tvTheme === "dark"
                  ? "border-[#1C1C1E] dark:border-white ring-2 ring-[#1C1C1E]/10 dark:ring-white/20 bg-white dark:bg-[#27272a]"
                  : "border-[#E5E5EA] dark:border-[#3f3f46] bg-white/60 dark:bg-[#18181b] hover:border-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-[#09090B] border border-white/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                    Escuro
                  </span>
                </div>
                {tvTheme === "dark" && (
                  <Check className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
                )}
              </div>
              <p className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa] leading-snug">
                Fundo preto clássico com destaques verde esmeralda.
              </p>
            </button>

            {/* Tema 2: Claro (Editorial) */}
            <button
              type="button"
              onClick={() => handleUpdateSettings("light", undefined, undefined)}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                tvTheme === "light"
                  ? "border-[#1C1C1E] dark:border-white ring-2 ring-[#1C1C1E]/10 dark:ring-white/20 bg-white dark:bg-[#27272a]"
                  : "border-[#E5E5EA] dark:border-[#3f3f46] bg-white/60 dark:bg-[#18181b] hover:border-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-[#F5F6F8] border border-black/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  </div>
                  <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                    Claro
                  </span>
                </div>
                {tvTheme === "light" && (
                  <Check className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
                )}
              </div>
              <p className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa] leading-snug">
                Fundo branco minimalista de alto contraste editorial.
              </p>
            </button>

            {/* Tema 3: Marrom (Cacau & Âmbar) */}
            <button
              type="button"
              onClick={() => handleUpdateSettings("warm_brown", undefined, undefined)}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                tvTheme === "warm_brown"
                  ? "border-[#1C1C1E] dark:border-white ring-2 ring-[#1C1C1E]/10 dark:ring-white/20 bg-white dark:bg-[#27272a]"
                  : "border-[#E5E5EA] dark:border-[#3f3f46] bg-white/60 dark:bg-[#18181b] hover:border-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-[#181311] border border-[#E5A96A]/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E5A96A]" />
                  </div>
                  <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                    Marrom
                  </span>
                </div>
                {tvTheme === "warm_brown" && (
                  <Check className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
                )}
              </div>
              <p className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa] leading-snug">
                Fundo cacau sofisticado com acentos em âmbar dourado.
              </p>
            </button>

            {/* Tema 4: Preto com Dourado (Noir Imperial & Gold) */}
            <button
              type="button"
              onClick={() => handleUpdateSettings("noir_gold", undefined, undefined)}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                tvTheme === "noir_gold"
                  ? "border-[#1C1C1E] dark:border-white ring-2 ring-[#1C1C1E]/10 dark:ring-white/20 bg-white dark:bg-[#27272a]"
                  : "border-[#E5E5EA] dark:border-[#3f3f46] bg-white/60 dark:bg-[#18181b] hover:border-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-[#050506] border border-[#D4AF37]/50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  </div>
                  <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                    Noir Gold
                  </span>
                </div>
                {tvTheme === "noir_gold" && (
                  <Check className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
                )}
              </div>
              <p className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa] leading-snug">
                Preto ônix profundo com acentos ouro imperial luxuoso.
              </p>
            </button>
          </div>
        </div>

        {/* 1.2 Tamanho Padrão da Tela (32", 43", 55") */}
        <div className="space-y-2.5 pt-2">
          <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-[#71717A] dark:text-[#a1a1aa]">
            Tamanho Padrão da Tela
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleUpdateSettings(undefined, "32", undefined)}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                tvScreenSize === "32"
                  ? "border-[#1C1C1E] dark:border-white ring-2 ring-[#1C1C1E]/10 dark:ring-white/20 bg-white dark:bg-[#27272a]"
                  : "border-[#E5E5EA] dark:border-[#3f3f46] bg-white/60 dark:bg-[#18181b] hover:border-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13.5px] font-bold text-[#1C1C1E] dark:text-white">
                  32 Polegadas (HD)
                </span>
                {tvScreenSize === "32" && (
                  <Check className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
                )}
              </div>
              <p className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa]">
                Densidade compacta e margens de segurança para TVs de 32&quot;.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateSettings(undefined, "43", undefined)}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                tvScreenSize === "43"
                  ? "border-[#1C1C1E] dark:border-white ring-2 ring-[#1C1C1E]/10 dark:ring-white/20 bg-white dark:bg-[#27272a]"
                  : "border-[#E5E5EA] dark:border-[#3f3f46] bg-white/60 dark:bg-[#18181b] hover:border-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13.5px] font-bold text-[#1C1C1E] dark:text-white">
                  43 Polegadas (Full HD)
                </span>
                {tvScreenSize === "43" && (
                  <Check className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
                )}
              </div>
              <p className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa]">
                Equilíbrio e proporção ideal para telas de 40 a 50 polegadas.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateSettings(undefined, "55", undefined)}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                tvScreenSize === "55"
                  ? "border-[#1C1C1E] dark:border-white ring-2 ring-[#1C1C1E]/10 dark:ring-white/20 bg-white dark:bg-[#27272a]"
                  : "border-[#E5E5EA] dark:border-[#3f3f46] bg-white/60 dark:bg-[#18181b] hover:border-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13.5px] font-bold text-[#1C1C1E] dark:text-white">
                  55+ Polegadas (4K)
                </span>
                {tvScreenSize === "55" && (
                  <Check className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
                )}
              </div>
              <p className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa]">
                Tipografia ampla para visualização a distância em telas grandes.
              </p>
            </button>
          </div>
        </div>

        {/* 1.3 Indicador SINCRONIZADO */}
        <div className="pt-3 border-t border-[#E5E5EA] dark:border-[#27272a]">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[13px] font-medium text-[#1C1C1E] dark:text-white block">
                Exibir indicador SINCRONIZADO na TV
              </span>
              <p className="text-[12px] text-[#71717A] dark:text-[#a1a1aa]">
                Mostra o micro-indicador pulsante de status em tempo real no cabeçalho da Smart TV.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={showSyncBadge}
              onClick={() =>
                handleUpdateSettings(undefined, undefined, !showSyncBadge)
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showSyncBadge
                  ? "bg-[#1C1C1E] dark:bg-white"
                  : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-black shadow-sm ring-0 transition duration-200 ease-in-out ${
                  showSyncBadge ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: Profissionais Exibidos na TV (Seleção / Ocultação) */}
      <div className="bg-[#FBFBFC] dark:bg-[#1c1c20] border border-[#E5E5EA] dark:border-[#27272a] rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E5EA] dark:border-[#27272a] pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1C1C1E] dark:text-white" />
              <h3 className="text-[15px] font-semibold text-[#1C1C1E] dark:text-white">
                Profissionais Exibidos na TV
              </h3>
            </div>
            <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa]">
              Selecione quais profissionais devem ter suas colunas de atendimento visíveis na TV da recepção.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleSelectAllProfessionals}
              className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-zinc-200 hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[12px] font-medium transition-colors"
            >
              Exibir Todos ({allProfessionals.length})
            </button>
          </div>
        </div>

        {allProfessionals.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#71717A]">
            Nenhum profissional cadastrado encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allProfessionals.map((prof) => {
              const isVisible =
                visibleProfessionalIds.includes(prof.id) ||
                visibleProfessionalIds.length === 0;
              const initial = prof.name.trim().charAt(0).toUpperCase() || "P";

              return (
                <div
                  key={prof.id}
                  onClick={() => handleToggleProfessional(prof.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                    isVisible
                      ? "border-[#1C1C1E] dark:border-white ring-1 ring-[#1C1C1E]/15 dark:ring-white/20 bg-white dark:bg-[#27272a] shadow-xs"
                      : "border-[#E5E5EA] dark:border-[#3f3f46] bg-zinc-50/70 dark:bg-[#18181b]/50 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={`w-8 h-8 rounded-full border flex items-center justify-center font-semibold text-xs shrink-0 ${
                        isVisible
                          ? "bg-[#1C1C1E] text-white border-black dark:bg-white dark:text-black dark:border-white"
                          : "bg-zinc-200 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                      }`}
                    >
                      {initial}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-[13.5px] font-semibold text-[#1C1C1E] dark:text-white truncate">
                        {prof.name}
                      </span>
                      <span className="text-[11px] text-[#71717A] dark:text-[#a1a1aa] mt-0.5">
                        {isVisible ? "Ativo no Kiosk TV" : "Oculto na TV"}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isVisible
                          ? "bg-[#1C1C1E] border-[#1C1C1E] text-white dark:bg-white dark:border-white dark:text-black"
                          : "border-[#D4D4D8] dark:border-zinc-600 bg-white dark:bg-zinc-800"
                      }`}
                    >
                      {isVisible && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card 3: Formulário de Pareamento de Novo Dispositivo */}
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

      {/* Card 4: Lista de TVs Conectadas */}
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
