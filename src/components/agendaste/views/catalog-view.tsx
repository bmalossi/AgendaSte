"use client";

import React, { useState } from "react";
import {
  Plus,
  Sparkles,
  RefreshCw,
  Check,
  ArrowLeft,
  Clock,
  Scissors,
  DoorOpen,
  Layers,
  CreditCard,
  Package,
  Trash2,
  X,
} from "lucide-react";
import {
  StudioState,
  PriceType,
  ResourceCategory,
  ServiceOptionItem,
  ServiceAddOnItem,
  formatBRL,
  toggleSuggestedService,
  createSelectedSuggestedServices,
  regenerateSuggestedServices,
  generateServiceDescriptionAI,
  saveCatalogService,
  saveCatalogPackage,
  saveCatalogMembership,
  savePhysicalResource,
} from "@/lib/agendaste-store";

interface CatalogViewProps {
  section:
    | "catalog_services"
    | "catalog_packages"
    | "catalog_memberships"
    | "catalog_resources";
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
}

export function CatalogView({
  section,
  state,
  onUpdateState,
}: CatalogViewProps) {
  // ===========================================================================
  // SERVICE BUILDER STATE (06-2-services-add.png & 06-2-services-add-1.png)
  // ===========================================================================
  const [isAddingService, setIsAddingService] = useState(false);
  const [srvName, setSrvName] = useState("");
  const [srvCategory, setSrvCategory] = useState("Cabelo & Colorimetria");
  const [srvDescription, setSrvDescription] = useState("");
  const [srvColor, setSrvColor] = useState("#E11D8F");
  const [srvOnlineEnabled, setSrvOnlineEnabled] = useState(true);
  const [srvPriceType, setSrvPriceType] = useState<PriceType>("fixed");
  const [srvPriceBRL, setSrvPriceBRL] = useState("240");
  const [srvRequireDeposit, setSrvRequireDeposit] = useState(true);
  const [srvDepositBRL, setSrvDepositBRL] = useState("70");
  const [srvDurationMin, setSrvDurationMin] = useState("60");
  const [srvProcessingEnabled, setSrvProcessingEnabled] = useState(true);
  const [srvProcessingStartMin, setSrvProcessingStartMin] = useState("30");
  const [srvProcessingDurationMin, setSrvProcessingDurationMin] =
    useState("30");
  const [srvBlockEnabled, setSrvBlockEnabled] = useState(true);
  const [srvBlockAfterMin, setSrvBlockAfterMin] = useState("15");
  const [srvResourceIds, setSrvResourceIds] = useState<string[]>([]);
  const [srvOptions, setSrvOptions] = useState<ServiceOptionItem[]>([
    {
      id: "opt-1",
      name: "Fios Longos / Extra Densidade",
      priceDeltaCents: 6000,
      durationDeltaMinutes: 20,
    },
  ]);
  const [srvAddOns, setSrvAddOns] = useState<ServiceAddOnItem[]>([
    {
      id: "add-1",
      name: "Ampola Reconstrutora Kérastase",
      priceCents: 6500,
      durationMinutes: 15,
    },
  ]);

  // ===========================================================================
  // PACKAGE BUILDER STATE (06-3-packages.png)
  // ===========================================================================
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [pkgName, setPkgName] = useState("");
  const [pkgDescription, setPkgDescription] = useState("");
  const [pkgSellOnline, setPkgSellOnline] = useState(true);
  const [pkgServiceIds, setPkgServiceIds] = useState<string[]>(
    state.services[0] ? [state.services[0].id] : []
  );
  const [pkgSessionsCount, setPkgSessionsCount] = useState("4");
  const [pkgPriceBRL, setPkgPriceBRL] = useState("680");
  const [pkgExpirationDays, setPkgExpirationDays] = useState("180");
  const [pkgTerms, setPkgTerms] = useState(
    "Válido por 180 dias após a compra. Agendamento sujeito à disponibilidade."
  );

  // ===========================================================================
  // MEMBERSHIP MODAL STATE
  // ===========================================================================
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [memName, setMemName] = useState("");
  const [memDescription, setMemDescription] = useState("");
  const [memPriceBRL, setMemPriceBRL] = useState("299");
  const [memCredits, setMemCredits] = useState("2");
  const [memDiscount, setMemDiscount] = useState("15");

  // ===========================================================================
  // RESOURCE MODAL STATE (06-4-resources-add.png)
  // ===========================================================================
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resCategory, setResCategory] = useState<ResourceCategory>("equipment");
  const [resName, setResName] = useState("");
  const [resDescription, setResDescription] = useState("");
  const [resServiceIds, setResServiceIds] = useState<string[]>([]);

  // ---------------------------------------------------------------------------
  // SECTION 1: SERVICES (06-1, 06-2, 06-2-1)
  // ---------------------------------------------------------------------------
  if (section === "catalog_services") {
    if (isAddingService) {
      return (
        <div className="min-h-screen bg-[#FAFAFC] pb-24">
          {/* Top Bar (06-2-services-add.png) */}
          <div className="px-8 py-5 bg-white border-b border-[#E5E5EA] flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddingService(false)}
                className="w-9 h-9 rounded-full border border-[#E5E5EA] flex items-center justify-center hover:bg-[#F5F5F7]"
              >
                <ArrowLeft className="w-4 h-4 text-[#1C1C1E]" />
              </button>
              <h1 className="text-[22px] font-bold text-[#1C1C1E]">
                Novo serviço (New service)
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsAddingService(false)}
                className="px-5 py-2.5 rounded-full border border-[#E5E5EA] bg-white text-[13px] font-semibold text-[#1C1C1E]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!srvName.trim()) return;
                  onUpdateState((prev) =>
                    saveCatalogService(prev, {
                      name: srvName.trim(),
                      description:
                        srvDescription.trim() ||
                        generateServiceDescriptionAI(srvName, srvCategory),
                      category: srvCategory,
                      calendarColor: srvColor,
                      onlineBookingEnabled: srvOnlineEnabled,
                      priceType: srvPriceType,
                      priceCents:
                        Math.max(0, parseInt(srvPriceBRL || "150", 10)) * 100,
                      requireDeposit: srvRequireDeposit,
                      depositCents:
                        Math.max(0, parseInt(srvDepositBRL || "50", 10)) * 100,
                      durationMinutes: Math.max(
                        15,
                        parseInt(srvDurationMin || "60", 10)
                      ),
                      processingTimeEnabled: srvProcessingEnabled,
                      processingStartOffsetMinutes: Math.max(
                        5,
                        parseInt(srvProcessingStartMin || "20", 10)
                      ),
                      processingDurationMinutes: Math.max(
                        5,
                        parseInt(srvProcessingDurationMin || "25", 10)
                      ),
                      blockTimeEnabled: srvBlockEnabled,
                      blockAfterMinutes: Math.max(
                        5,
                        parseInt(srvBlockAfterMin || "10", 10)
                      ),
                      requiredResourceIds: srvResourceIds,
                      options: srvOptions,
                      addOns: srvAddOns,
                    })
                  );
                  setIsAddingService(false);
                  setSrvName("");
                }}
                className="px-6 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[13px] font-semibold transition"
              >
                Salvar serviço
              </button>
            </div>
          </div>

          {/* 2-Column Layout matching 06-2-services-add.png & 06-2-services-add-1.png */}
          <div className="w-full px-6 lg:px-8 xl:px-10 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3 space-y-1">
              {[
                "Detalhes básicos",
                "Configurações padrão",
                "Recursos",
                "Opções",
                "Adicionais (Add-ons)",
              ].map((item, idx) => (
                <div
                  key={item}
                  className={`px-4 py-2.5 rounded-[12px] text-[13px] ${
                    idx === 0
                      ? "bg-[#1C1C1E] text-white font-semibold shadow-sm"
                      : "text-[#6E6E73] font-medium"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="lg:col-span-9 space-y-6">
              {/* Card 1: Basic Details */}
              <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4">
                <h2 className="text-[18px] font-bold text-[#1C1C1E]">
                  Detalhes básicos
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                      Nome do serviço *
                    </label>
                    <input
                      type="text"
                      value={srvName}
                      onChange={(e) => setSrvName(e.target.value)}
                      placeholder="Ex: Loiro Iluminado & Glossing"
                      className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={srvCategory}
                      onChange={(e) => setSrvCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-semibold text-[#6E6E73]">
                      Descrição do serviço
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSrvDescription(
                          generateServiceDescriptionAI(
                            srvName || "Procedimento Exclusivo",
                            srvCategory
                          )
                        )
                      }
                      className="text-[12px] font-semibold text-[#6E56CF] flex items-center gap-1 hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gerar com IA</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={srvDescription}
                    onChange={(e) => setSrvDescription(e.target.value)}
                    placeholder="Descreva os benefícios e etapas do atendimento..."
                    className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[13px]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[#1C1C1E]">
                      Cor na agenda:
                    </span>
                    {["#E11D8F", "#6E56CF", "#16A34A", "#D97706", "#0284C7"].map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSrvColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-full ${
                            srvColor === c
                              ? "ring-2 ring-offset-2 ring-[#1C1C1E]"
                              : ""
                          }`}
                        />
                      )
                    )}
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srvOnlineEnabled}
                      onChange={(e) => setSrvOnlineEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#6E56CF]"
                    />
                    <span className="text-[13px] font-semibold text-[#1C1C1E]">
                      Disponível no Site de Agendamento Online
                    </span>
                  </label>
                </div>
              </div>

              {/* Card 2: Default Settings + Processing & Block Time (06-2-services-add-1.png) */}
              <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-5">
                <h2 className="text-[18px] font-bold text-[#1C1C1E]">
                  Configurações padrão (Preço, Sinal Pix e Tempos Segmentados)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                      Tipo de preço
                    </label>
                    <select
                      value={srvPriceType}
                      onChange={(e) =>
                        setSrvPriceType(e.target.value as PriceType)
                      }
                      className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] bg-white"
                    >
                      <option value="fixed">Preço Fixo (Fixed)</option>
                      <option value="starting_at">
                        A partir de (Starting at)
                      </option>
                      <option value="hidden">Ocultar preço</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                      Preço (R$)
                    </label>
                    <input
                      type="number"
                      value={srvPriceBRL}
                      onChange={(e) => setSrvPriceBRL(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                      Duração total (min)
                    </label>
                    <input
                      type="number"
                      value={srvDurationMin}
                      onChange={(e) => setSrvDurationMin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono"
                    />
                  </div>
                </div>

                {/* Deposit Requirement */}
                <div className="p-4 rounded-[16px] bg-[#FAFAFC] border border-[#E5E5EA] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-bold text-[#1C1C1E]">
                      Exigir Sinal / Taxa de Reserva (Pix Anti-No-Show)
                    </p>
                    <p className="text-[12px] text-[#6E6E73]">
                      Cobra automaticamente na reserva online para garantir o horário.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {srvRequireDeposit && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-[#6E6E73]">
                          Sinal R$
                        </span>
                        <input
                          type="number"
                          value={srvDepositBRL}
                          onChange={(e) => setSrvDepositBRL(e.target.value)}
                          className="w-20 px-2.5 py-1.5 rounded-lg border border-[#E5E5EA] text-[13px] font-mono font-bold bg-white"
                        />
                      </div>
                    )}
                    <input
                      type="checkbox"
                      checked={srvRequireDeposit}
                      onChange={(e) => setSrvRequireDeposit(e.target.checked)}
                      className="w-5 h-5 accent-[#6E56CF]"
                    />
                  </div>
                </div>

                {/* Processing Time Toggle (ADR-0002 / 06-2-services-add-1.png) */}
                <div className="p-4 rounded-[16px] bg-[#F5F3FF] border border-[#DDD6FE] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-bold text-[#1C1C1E]">
                        Tempo de processamento (Processing time)
                      </p>
                      <p className="text-[12px] text-[#6E6E73]">
                        Abre uma janela livre no meio do atendimento (ex: ação da química) permitindo encaixar outro cliente!
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={srvProcessingEnabled}
                      onChange={(e) =>
                        setSrvProcessingEnabled(e.target.checked)
                      }
                      className="w-5 h-5 accent-[#6E56CF]"
                    />
                  </div>

                  {srvProcessingEnabled && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#6E56CF] mb-1">
                          Iniciar pausa após (minutos de aplicação)
                        </label>
                        <input
                          type="number"
                          value={srvProcessingStartMin}
                          onChange={(e) =>
                            setSrvProcessingStartMin(e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#DDD6FE] bg-white text-[13px] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#6E56CF] mb-1">
                          Duração da pausa livre (minutos)
                        </label>
                        <input
                          type="number"
                          value={srvProcessingDurationMin}
                          onChange={(e) =>
                            setSrvProcessingDurationMin(e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#DDD6FE] bg-white text-[13px] font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Block Time Toggle */}
                <div className="p-4 rounded-[16px] bg-[#FAFAFC] border border-[#E5E5EA] flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-bold text-[#1C1C1E]">
                      Tempo de bloqueio pós-serviço (Block time)
                    </p>
                    <p className="text-[12px] text-[#6E6E73]">
                      Reserva minutos extras ao final para higienização de maca/cadeira.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {srvBlockEnabled && (
                      <input
                        type="number"
                        value={srvBlockAfterMin}
                        onChange={(e) => setSrvBlockAfterMin(e.target.value)}
                        className="w-16 px-2.5 py-1.5 rounded-lg border border-[#E5E5EA] text-[13px] font-mono bg-white"
                      />
                    )}
                    <input
                      type="checkbox"
                      checked={srvBlockEnabled}
                      onChange={(e) => setSrvBlockEnabled(e.target.checked)}
                      className="w-5 h-5 accent-[#6E56CF]"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Physical Resources Assignment */}
              <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-3">
                <h2 className="text-[18px] font-bold text-[#1C1C1E]">
                  Recursos físicos necessários (Salas e Equipamentos)
                </h2>
                <p className="text-[12px] text-[#6E6E73]">
                  Evite overbooking: a agenda bloqueará horários se a sala ou equipamento já estiver em uso.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {state.resources.map((res) => {
                    const checked = srvResourceIds.includes(res.id);
                    return (
                      <label
                        key={res.id}
                        className={`p-3.5 rounded-[14px] border flex items-center justify-between cursor-pointer ${
                          checked
                            ? "border-2 border-[#1C1C1E] bg-[#F5F5F7] shadow-sm"
                            : "border-[#E5E5EA] hover:bg-[#FAFAFC]"
                        }`}
                      >
                        <div>
                          <p className="text-[13px] font-bold text-[#1C1C1E]">
                            {res.name}
                          </p>
                          <p className="text-[11px] text-[#6E6E73]">
                            {res.category === "room" ? "Sala" : "Equipamento"}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSrvResourceIds((prev) =>
                              checked
                                ? prev.filter((id) => id !== res.id)
                                : [...prev, res.id]
                            )
                          }
                          className="w-4 h-4 accent-[#6E56CF]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Card 4: Options & Add-ons (06-2-services-add.png) */}
              <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[18px] font-bold text-[#1C1C1E]">
                      Opções &amp; Adicionais (Options &amp; Add-ons)
                    </h2>
                    <p className="text-[12px] text-[#6E6E73]">
                      Personalize variações de preço/duração e itens extras sugeridos no checkout online.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSrvOptions((prev) => [
                          ...prev,
                          {
                            id: `opt-${prev.length + 1}`,
                            name: `Opção Extra ${prev.length + 1}`,
                            priceDeltaCents: 4000,
                            durationDeltaMinutes: 15,
                          },
                        ])
                      }
                      className="px-3.5 py-1.5 rounded-full border border-[#E5E5EA] text-[12px] font-semibold text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    >
                      + Opção
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSrvAddOns((prev) => [
                          ...prev,
                          {
                            id: `add-${prev.length + 1}`,
                            name: `Adicional Premium ${prev.length + 1}`,
                            priceCents: 4500,
                            durationMinutes: 10,
                          },
                        ])
                      }
                      className="px-3.5 py-1.5 rounded-full border border-[#E5E5EA] text-[12px] font-semibold text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    >
                      + Adicional
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[12px] font-bold text-[#6E6E73] uppercase tracking-wider">
                      Opções ({srvOptions.length})
                    </p>
                    {srvOptions.map((opt) => (
                      <div
                        key={opt.id}
                        className="p-3 rounded-[12px] bg-[#FAFAFC] border border-[#EFEFF4] flex items-center justify-between text-[12px]"
                      >
                        <span className="font-semibold text-[#1C1C1E]">
                          {opt.name} (+{ opt.durationDeltaMinutes }m)
                        </span>
                        <span className="font-mono font-bold text-[#6E56CF]">
                          +{formatBRL(opt.priceDeltaCents)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[12px] font-bold text-[#6E6E73] uppercase tracking-wider">
                      Adicionais ({srvAddOns.length})
                    </p>
                    {srvAddOns.map((add) => (
                      <div
                        key={add.id}
                        className="p-3 rounded-[12px] bg-[#FAFAFC] border border-[#EFEFF4] flex items-center justify-between text-[12px]"
                      >
                        <span className="font-semibold text-[#1C1C1E]">
                          {add.name} (+{add.durationMinutes}m)
                        </span>
                        <span className="font-mono font-bold text-[#16A34A]">
                          +{formatBRL(add.priceCents)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default Services Landing + Suggested Services + Active List (06-1-services.png)
    return (
      <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        {/* Editorial Hero Card (06-1-services.png) */}
        <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-gg-card">
          <div className="lg:col-span-7 space-y-4">
            <h1 className="font-display text-[42px] leading-[1.06] text-[#1C1C1E]">
              Construa um menu de serviços que se vende sozinho
            </h1>
            <p className="text-[15px] text-[#6E6E73] max-w-xl">
              Configure durações segmentadas (tempo de pausa para encaixes e bloqueio de limpeza), exija sinal Pix anti-no-show e vincule equipamentos.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setIsAddingService(true)}
                className="px-6 py-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[14px] font-semibold transition"
              >
                + Adicionar serviço
              </button>
            </div>
          </div>

          {/* Right Mockup Card (Blowout $50.00 / 45m from 06-1-services.png) */}
          <div className="lg:col-span-5 bg-white rounded-[20px] p-5 border border-[#E5E5EA] shadow-gg-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[16px] font-bold text-[#1C1C1E]">
                  Escova Modelada &amp; Glossing
                </p>
                <p className="text-[12px] text-[#6E6E73]">
                  45 min · Sinal Pix R$ 45,00
                </p>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-mono font-bold">
                R$ 150,00
              </span>
            </div>
          </div>
        </div>

        {/* Suggested Services AI Card (06-1-services.png) */}
        <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E11D8F]" />
              <div>
                <h2 className="text-[17px] font-bold text-[#1C1C1E]">
                  Serviços sugeridos por IA (Suggested services)
                </h2>
                <p className="text-[12px] text-[#6E6E73]">
                  Selecione sugestões prontas para adicionar ao seu menu em 1 clique:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onUpdateState((prev) => regenerateSuggestedServices(prev))
                }
                className="px-4 py-2 rounded-full border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[12px] font-semibold text-[#1C1C1E] flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Gerar novamente</span>
              </button>
              <button
                onClick={() =>
                  onUpdateState((prev) => createSelectedSuggestedServices(prev))
                }
                className="px-5 py-2 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[12px] font-semibold"
              >
                Criar selecionados
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {state.suggestedServices.map((sug) => (
              <label
                key={sug.id}
                className={`p-4 rounded-[16px] border cursor-pointer transition flex items-start justify-between gap-3 ${
                  sug.selected
                    ? "border-2 border-[#1C1C1E] bg-[#F5F5F7] shadow-sm"
                    : "border-[#E5E5EA] bg-white hover:bg-[#FAFAFC]"
                }`}
              >
                <div>
                  <p className="text-[14px] font-bold text-[#1C1C1E]">
                    {sug.name}
                  </p>
                  <p className="text-[12px] text-[#6E6E73]">
                    {sug.category} · {sug.durationMinutes} min
                  </p>
                  <p className="text-[13px] font-mono font-bold text-[#E11D8F] mt-1">
                    {formatBRL(sug.priceCents)}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sug.selected}
                  onChange={() =>
                    onUpdateState((prev) =>
                      toggleSuggestedService(prev, sug.id)
                    )
                  }
                  className="w-4 h-4 accent-[#1C1C1E] mt-1"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Active Services Catalog List */}
        <div className="bg-white rounded-[20px] border border-[#E5E5EA] shadow-gg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EFEFF4] flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#1C1C1E]">
              Menu de Serviços Ativos ({state.services.length})
            </h2>
            <button
              onClick={() => setIsAddingService(true)}
              className="px-4 py-2 rounded-full bg-[#1C1C1E] text-white text-[12px] font-semibold"
            >
              + Novo serviço
            </button>
          </div>
          <div className="divide-y divide-[#EFEFF4]">
            {state.services.map((srv) => (
              <div
                key={srv.id}
                className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-[#FAFAFC]"
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className="w-3.5 h-10 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: srv.calendarColor }}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] font-bold text-[#1C1C1E]">
                        {srv.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-[11px] font-semibold text-white shadow-sm">
                        {srv.category}
                      </span>
                      {srv.processingTimeEnabled && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-[11px] font-medium inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6E56CF] ring-2 ring-[#6E56CF]/20" />
                          <span>Pausa de {srv.processingDurationMinutes}m p/ encaixe</span>
                        </span>
                      )}
                      {srv.blockTimeEnabled && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-[11px] font-medium inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8E8E93] ring-2 ring-[#8E8E93]/20" />
                          <span>+{srv.blockAfterMinutes}m bloqueio limpeza</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#6E6E73] max-w-2xl mt-0.5">
                      {srv.description}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[16px] font-mono font-bold text-[#1C1C1E]">
                    {formatBRL(srv.priceCents)}
                  </p>
                  <p className="text-[11px] text-[#6E6E73]">
                    {srv.durationMinutes} min · Sinal{" "}
                    {formatBRL(srv.depositCents)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 2: PACKAGES (06-3-packages.png)
  // ---------------------------------------------------------------------------
  if (section === "catalog_packages") {
    return (
      <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[#1C1C1E]">
              Pacotes de Sessões (Packages)
            </h1>
            <p className="text-[13px] text-[#6E6E73]">
              Fidelize clientes vendendo pacotes multi-sessões com controle automático de saldo.
            </p>
          </div>
          <button
            onClick={() => setIsAddingPackage((v) => !v)}
            className="px-5 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-semibold"
          >
            {isAddingPackage ? "Fechar construtor" : "+ Novo pacote"}
          </button>
        </div>

        {/* Full-Page Package Builder matching 06-3-packages.png */}
        {isAddingPackage && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-[24px] border border-[#E5E5EA] p-8 shadow-gg-card">
            <div className="lg:col-span-3 space-y-1">
              {["Detalhes básicos", "Serviços", "Preço", "Configurações"].map(
                (label, idx) => (
                  <div
                    key={label}
                    className={`px-4 py-2.5 rounded-[12px] text-[13px] ${
                      idx === 0
                        ? "bg-[#1C1C1E] text-white font-semibold shadow-sm"
                        : "text-[#6E6E73]"
                    }`}
                  >
                    {label}
                  </div>
                )
              )}
            </div>

            <div className="lg:col-span-9 space-y-4">
              <h2 className="text-[18px] font-bold text-[#1C1C1E]">
                Novo pacote (New package)
              </h2>
              <input
                type="text"
                placeholder="Nome do pacote (Ex: Cronograma Capilar 4 Sessões)"
                value={pkgName}
                onChange={(e) => setPkgName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
              />
              <textarea
                rows={2}
                placeholder="Descrição do pacote..."
                value={pkgDescription}
                onChange={(e) => setPkgDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[13px]"
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">
                    Nº de Sessões
                  </label>
                  <input
                    type="number"
                    value={pkgSessionsCount}
                    onChange={(e) => setPkgSessionsCount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">
                    Preço Total (R$)
                  </label>
                  <input
                    type="number"
                    value={pkgPriceBRL}
                    onChange={(e) => setPkgPriceBRL(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">
                    Validade (dias)
                  </label>
                  <input
                    type="number"
                    value={pkgExpirationDays}
                    onChange={(e) => setPkgExpirationDays(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  if (!pkgName.trim()) return;
                  onUpdateState((prev) =>
                    saveCatalogPackage(prev, {
                      name: pkgName.trim(),
                      description:
                        pkgDescription.trim() ||
                        "Pacote de sessões Luvea Studio.",
                      sellOnWebsite: pkgSellOnline,
                      includedServiceIds: pkgServiceIds,
                      sessionsCount: Math.max(
                        2,
                        parseInt(pkgSessionsCount || "4", 10)
                      ),
                      priceCents:
                        Math.max(50, parseInt(pkgPriceBRL || "680", 10)) * 100,
                      expirationDays: Math.max(
                        30,
                        parseInt(pkgExpirationDays || "180", 10)
                      ),
                      termsAndConditions: pkgTerms,
                    })
                  );
                  setIsAddingPackage(false);
                  setPkgName("");
                }}
                className="px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-semibold"
              >
                Salvar pacote
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-[#1C1C1E]">
                  {pkg.name}
                </h3>
                <span className="font-mono text-[16px] font-bold text-[#6E56CF]">
                  {formatBRL(pkg.priceCents)}
                </span>
              </div>
              <p className="text-[13px] text-[#6E6E73]">{pkg.description}</p>
              <p className="text-[12px] font-semibold text-[#1C1C1E]">
                {pkg.sessionsCount} sessões incluídas · Expira em{" "}
                {pkg.expirationDays} dias
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 3: MEMBERSHIPS (Assinaturas Recorrentes)
  // ---------------------------------------------------------------------------
  if (section === "catalog_memberships") {
    return (
      <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-12 flex flex-wrap items-center justify-between gap-6 shadow-gg-card">
          <div className="max-w-xl space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-white/80 text-[12px] font-semibold text-[#1C1C1E]">
              Receita Recorrente Garantida
            </span>
            <h1 className="font-display text-[40px] leading-[1.08] text-[#1C1C1E]">
              Crie clubes de assinatura mensal para seus clientes fiéis
            </h1>
            <p className="text-[14px] text-[#6E6E73]">
              Cobrança mensal automática com créditos de procedimentos e descontos exclusivos.
            </p>
          </div>
          <button
            onClick={() => setMembershipModalOpen(true)}
            className="px-6 py-3 rounded-full bg-[#1C1C1E] text-white text-[14px] font-semibold"
          >
            + Criar plano de assinatura
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.memberships.map((mem) => (
            <div
              key={mem.id}
              className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-bold text-[#1C1C1E]">
                  {mem.name}
                </h3>
                <span className="font-mono text-[16px] font-bold text-[#16A34A]">
                  {formatBRL(mem.monthlyPriceCents)}/mês
                </span>
              </div>
              <p className="text-[13px] text-[#6E6E73]">{mem.description}</p>
              <p className="text-[12px] font-semibold text-[#6E56CF]">
                {mem.includedCreditsPerMonth} créditos/mês ·{" "}
                {mem.discountPercentOnExtras}% OFF em extras ·{" "}
                {mem.activeSubscribersCount} assinante(s)
              </p>
            </div>
          ))}
        </div>

        {membershipModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-gg-modal">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-bold text-[#1C1C1E]">
                  Nova Assinatura Mensal
                </h3>
                <button onClick={() => setMembershipModalOpen(false)}>
                  <X className="w-4 h-4 text-[#6E6E73]" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Nome do clube (Ex: Clube Luvea Blowout)"
                value={memName}
                onChange={(e) => setMemName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
              />
              <input
                type="text"
                placeholder="Descrição dos benefícios"
                value={memDescription}
                onChange={(e) => setMemDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Mensalidade (R$)"
                  value={memPriceBRL}
                  onChange={(e) => setMemPriceBRL(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono"
                />
                <input
                  type="number"
                  placeholder="Créditos/mês"
                  value={memCredits}
                  onChange={(e) => setMemCredits(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono"
                />
              </div>
              <button
                onClick={() => {
                  onUpdateState((prev) =>
                    saveCatalogMembership(prev, {
                      name: memName || "Clube Luvea VIP",
                      description:
                        memDescription ||
                        "Assinatura mensal com sessões inclusas.",
                      monthlyPriceCents:
                        Math.max(50, parseInt(memPriceBRL || "299", 10)) * 100,
                      includedCreditsPerMonth: Math.max(
                        1,
                        parseInt(memCredits || "2", 10)
                      ),
                      discountPercentOnExtras: Math.max(
                        0,
                        parseInt(memDiscount || "15", 10)
                      ),
                    })
                  );
                  setMembershipModalOpen(false);
                }}
                className="w-full py-3 rounded-full bg-[#1C1C1E] text-white text-[14px] font-semibold"
              >
                Criar Plano
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 4: RESOURCES (06-4-resources.png & 06-4-resources-add.png)
  // ---------------------------------------------------------------------------
  const equipmentList = state.resources.filter(
    (r) => r.category === "equipment"
  );
  const roomsList = state.resources.filter((r) => r.category === "room");

  return (
    <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {/* Editorial Hero matching 06-4-resources.png */}
      <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-gg-card">
        <div className="lg:col-span-7 space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-white/80 border border-[#DDD6FE] text-[12px] font-semibold text-[#1C1C1E]">
            Apresentando Recursos
          </span>
          <h1 className="font-display text-[42px] leading-[1.06] text-[#1C1C1E]">
            Evite conflitos de salas ou equipamentos compartilhados
          </h1>
          <p className="text-[15px] text-[#6E6E73] max-w-xl">
            Atribua salas ou aparelhos aos seus serviços para impedir agendamentos duplicados quando o recurso físico estiver ocupado.
          </p>
          <button
            onClick={() => setResourceModalOpen(true)}
            className="px-6 py-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[14px] font-semibold transition"
          >
            Configurar recursos
          </button>
        </div>

        {/* Right Mockup Cards from 06-4-resources.png */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-[18px] p-4 border border-[#E5E5EA] shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FCE7F3] text-[#E11D8F] flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#1C1C1E]">
                Aparelho Laser / Lavatório Spa
              </p>
              <p className="text-[12px] text-[#6E6E73]">
                Equipamento compartilhado · Trava automática ativa
              </p>
            </div>
          </div>
          <div className="bg-white rounded-[18px] p-4 border border-[#E5E5EA] shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#F5F5F7] text-[#16A34A] flex items-center justify-center">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#1C1C1E]">
                Cabine Head Spa / Sala de Estética
              </p>
              <p className="text-[12px] text-[#6E6E73]">
                Sala exclusiva · Bloqueio inteligente por horário
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Category Cards matching 06-4-resources-add.png */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Equipment Card (Pink Scissors) */}
        <div className="bg-white rounded-[22px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FCE7F3] text-[#E11D8F] flex items-center justify-center">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-[#1C1C1E]">
                  Equipamentos ({equipmentList.length})
                </h2>
                <p className="text-[12px] text-[#6E6E73]">
                  Aparelhos de estética, lasers, vapor de ozônio
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setResCategory("equipment");
                setResourceModalOpen(true);
              }}
              className="px-4 py-2 rounded-full border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[12px] font-semibold text-[#1C1C1E]"
            >
              + Adicionar
            </button>
          </div>

          <div className="divide-y divide-[#EFEFF4]">
            {equipmentList.map((eq) => (
              <div key={eq.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold text-[#1C1C1E]">
                    {eq.name}
                  </p>
                  <p className="text-[12px] text-[#6E6E73]">{eq.description}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#E11D8F] text-white text-[11px] font-bold shadow-sm">
                  {eq.assignedServiceIds.length} serviço(s)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rooms Card (Green Door) */}
        <div className="bg-white rounded-[22px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#F5F5F7] text-[#16A34A] flex items-center justify-center">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-[#1C1C1E]">
                  Salas ({roomsList.length})
                </h2>
                <p className="text-[12px] text-[#6E6E73]">
                  Cabines de estética, salas de massagem, cadeiras VIP
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setResCategory("room");
                setResourceModalOpen(true);
              }}
              className="px-4 py-2 rounded-full border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[12px] font-semibold text-[#1C1C1E]"
            >
              + Adicionar
            </button>
          </div>

          <div className="divide-y divide-[#EFEFF4]">
            {roomsList.map((rm) => (
              <div key={rm.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold text-[#1C1C1E]">
                    {rm.name}
                  </p>
                  <p className="text-[12px] text-[#6E6E73]">{rm.description}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#16A34A] text-white text-[11px] font-bold shadow-sm">
                  {rm.assignedServiceIds.length} serviço(s)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {resourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-gg-modal">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#1C1C1E]">
                Adicionar Recurso Físico
              </h3>
              <button onClick={() => setResourceModalOpen(false)}>
                <X className="w-4 h-4 text-[#6E6E73]" />
              </button>
            </div>
            <select
              value={resCategory}
              onChange={(e) =>
                setResCategory(e.target.value as ResourceCategory)
              }
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] bg-white"
            >
              <option value="equipment">Equipamento (Aparelho / Laser)</option>
              <option value="room">Sala / Cabine Física</option>
            </select>
            <input
              type="text"
              placeholder="Nome (Ex: Cabine Head Spa 02)"
              value={resName}
              onChange={(e) => setResName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
            />
            <input
              type="text"
              placeholder="Descrição curta"
              value={resDescription}
              onChange={(e) => setResDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
            />
            <button
              onClick={() => {
                if (!resName.trim()) return;
                onUpdateState((prev) =>
                  savePhysicalResource(prev, {
                    name: resName.trim(),
                    category: resCategory,
                    description:
                      resDescription.trim() ||
                      "Recurso com trava anti-conflito na agenda.",
                    assignedServiceIds: resServiceIds,
                  })
                );
                setResourceModalOpen(false);
                setResName("");
              }}
              className="w-full py-3 rounded-full bg-[#1C1C1E] text-white text-[14px] font-semibold"
            >
              Salvar Recurso
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
