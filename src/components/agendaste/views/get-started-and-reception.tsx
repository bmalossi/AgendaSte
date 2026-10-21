"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Sparkles,
  Phone,
  HelpCircle,
  QrCode,
  CheckCircle2,
  MessageSquare,
  Smartphone,
  Shield,
  Bell,
  X,
  Upload,
  Copy,
  Check,
} from "lucide-react";
import {
  type StudioState,
  type NavigationSectionId,
  completeOnboardingStep,
  importStudioMigrationData,
  bookFromPublicSite,
  processWhatsappInboundReply,
  formatBRL,
  getBookingSiteUrl,
  normalizeSubdomainSlug,
} from "@/lib/agendaste-store";

import { PublicBookingWebsite } from "@/components/agendaste/public-booking-website";
import { WhatsAppConfigCard } from "@/components/agendaste/whatsapp-config-card";

interface GetStartedProps {
  state: StudioState;
  setState: React.Dispatch<React.SetStateAction<StudioState>>;
  onNavigate: (section: NavigationSectionId) => void;
  onOpenBookingSite: () => void;
  onOpenWebsiteWizard?: (step?: number) => void;
}

export function GetStartedView({
  state,
  setState,
  onNavigate,
  onOpenBookingSite,
  onOpenWebsiteWizard,
}: GetStartedProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSource, setImportSource] = useState(
    "Agenda Física (Papel & Caneta) / Planilha"
  );

  const completedCount = state.onboarding.steps.filter((s) => s.completed).length;

  const handleStartStep = (
    stepId: "booking_site" | "add_services" | "start_getting_paid"
  ) => {
    if (onOpenWebsiteWizard) {
      if (stepId === "booking_site") {
        onOpenWebsiteWizard(1);
      } else if (stepId === "add_services") {
        onOpenWebsiteWizard(5);
      } else {
        onOpenWebsiteWizard(9);
      }
      return;
    }

    setState((prev) => completeOnboardingStep(prev, stepId));
    if (stepId === "booking_site") {
      if (isWebsitePublished) {
        window.open(bookingSiteUrl, "_blank", "noopener,noreferrer");
      } else {
        onOpenBookingSite();
      }
    } else if (stepId === "add_services") {
      onNavigate("catalog_services");
    } else {
      onNavigate("payments_invoices");
    }
  };

  const isWebsitePublished = Boolean(state.settings.website?.websitePublished);
  const activeSubdomain =
    state.settings.website?.subdomainSlug ||
    normalizeSubdomainSlug(state.settings.business.businessName);
  const bookingSiteUrl = getBookingSiteUrl(activeSubdomain);

  const handleOpenMyBookingSite = () => {
    if (isWebsitePublished) {
      window.open(bookingSiteUrl, "_blank", "noopener,noreferrer");
    } else if (onOpenWebsiteWizard) {
      onOpenWebsiteWizard(1);
    } else if (onOpenBookingSite) {
      onOpenBookingSite();
    } else {
      window.open(bookingSiteUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {/* Top header identical to 01-get-started.png */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight text-[#18181B] dark:text-white">
          Bem-vindo, {state.settings.personal.firstName}
        </h1>
        {isWebsitePublished ? (
          <a
            href={bookingSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[13px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition-colors shadow-2xs"
          >
            <span>Meu site de agendamento</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#6E6E73] dark:text-[#a1a1aa]" />
          </a>
        ) : (
          <button
            type="button"
            onClick={handleOpenMyBookingSite}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[13px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition-colors shadow-2xs"
          >
            <span>Meu site de agendamento</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#6E6E73] dark:text-[#a1a1aa]" />
          </button>
        )}
      </div>

      {/* Main Let's get started container (01-get-started.png) */}
      <div className="bg-[#F5F5F7] dark:bg-[#18181b] rounded-2xl p-6 space-y-5 border border-transparent dark:border-[#27272a]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-[20px] font-semibold text-[#18181B] dark:text-white">
              Vamos começar
            </h2>
            <p className="text-[14px] text-zinc-600 dark:text-[#a1a1aa]">
              Você está a apenas 3 passos de mais agendamentos, tickets maiores
              e clientes que sempre voltam.
            </p>
          </div>

          {/* 3-segment progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className={`h-0.5 w-12 rounded-full transition-colors ${
                    idx < completedCount ? "bg-[#18181B] dark:bg-white" : "bg-zinc-300 dark:bg-[#27272a]"
                  }`}
                />
              ))}
            </div>
            <span className="text-[13px] font-medium text-zinc-600 dark:text-[#a1a1aa]">
              {completedCount}/3 concluídos
            </span>
          </div>
        </div>

        {/* 3 Visual Onboarding Cards identical to 01-get-started.png */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: Purple Tablet */}
          <div className="bg-white dark:bg-[#18181b] rounded-xl overflow-hidden flex border border-zinc-200/70 dark:border-[#27272a] shadow-sm min-h-[196px]">
            <div className="w-[116px] shrink-0 bg-gradient-to-b from-[#7E69EB] to-[#A494F7] flex items-center justify-center p-3 relative overflow-hidden">
              <div className="w-20 h-14 rounded-lg bg-gradient-to-tr from-[#2A1F5D] via-[#8E7AE6] to-white shadow-xl transform -rotate-12 border border-white/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white/90" />
              </div>
            </div>
            <div className="p-4 flex flex-col justify-between flex-1">
              <div className="space-y-1.5">
                <h3 className="text-[14px] font-bold text-[#18181B] dark:text-white leading-snug">
                  Seja encontrado e agendado online
                </h3>
                <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
                  Garanta sua URL e lance um site de agendamento onde clientes
                  reservam em 30 segundos.
                </p>
              </div>
              <div className="pt-3 flex items-center justify-between">
                {isWebsitePublished ? (
                  <a
                    href={bookingSiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[13px] font-medium hover:bg-black dark:hover:bg-zinc-200 transition-colors"
                  >
                    <span>Acessar meu site</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400 dark:text-zinc-600" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartStep("booking_site")}
                    className="px-4 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[13px] font-semibold hover:bg-black dark:hover:bg-zinc-200 transition-colors"
                  >
                    {state.onboarding.steps[0].completed ? "Tudo pronto" : "Começar"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Coral Notebook */}
          <div className="bg-white dark:bg-[#18181b] rounded-xl overflow-hidden flex border border-zinc-200/70 dark:border-[#27272a] shadow-sm min-h-[196px]">
            <div className="w-[116px] shrink-0 bg-gradient-to-b from-[#F47B55] to-[#F7A389] flex items-center justify-center p-3 relative overflow-hidden">
              <div className="w-20 h-16 rounded-lg bg-gradient-to-tr from-[#B8336A] via-[#F2A6B8] to-[#D4F5E9] shadow-xl transform rotate-6 border border-white/50 flex items-center justify-center">
                <span className="text-[11px] font-serif italic text-white drop-shadow">
                  Menu
                </span>
              </div>
            </div>
            <div className="p-4 flex flex-col justify-between flex-1">
              <div className="space-y-1.5">
                <h3 className="text-[14px] font-bold text-[#18181B] dark:text-white leading-snug">
                  Adicione seus serviços
                </h3>
                <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
                  Defina seus preços, envie fotos e monte um catálogo de
                  serviços que se vende sozinho.
                </p>
              </div>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => handleStartStep("add_services")}
                  className="px-4 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[13px] font-semibold hover:bg-black dark:hover:bg-zinc-200 transition-colors"
                >
                  {state.onboarding.steps[1].completed ? "Tudo pronto" : "Começar"}
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Slate-Blue Cards */}
          <div className="bg-white dark:bg-[#18181b] rounded-xl overflow-hidden flex border border-zinc-200/70 dark:border-[#27272a] shadow-sm min-h-[196px]">
            <div className="w-[116px] shrink-0 bg-gradient-to-b from-[#6B7F94] to-[#94A5B8] flex items-center justify-center p-3 relative overflow-hidden">
              <div className="w-20 h-12 rounded-lg bg-gradient-to-r from-[#8E9EF5] via-[#E8B8F7] to-white shadow-xl transform -rotate-12 border border-white/50 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-[#1C1C1E]">
                  PIX · CARD
                </span>
              </div>
            </div>
            <div className="p-4 flex flex-col justify-between flex-1">
              <div className="space-y-1.5">
                <h3 className="text-[14px] font-bold text-[#18181B] dark:text-white leading-snug">
                  Comece a receber pagamentos
                </h3>
                <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
                  Aceite Pix Dinâmico e cartões, aumentando sua receita em 65%
                  em média.
                </p>
              </div>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => handleStartStep("start_getting_paid")}
                  className="px-4 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[13px] font-semibold hover:bg-black dark:hover:bg-zinc-200 transition-colors"
                >
                  {state.onboarding.steps[2].completed
                    ? "Tudo pronto"
                    : state.settings.website?.paymentsSetup.setupCompleted &&
                      !state.settings.website?.paymentsSetup.identityVerified
                    ? "Pendente verificação"
                    : "Começar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle 2-column row: Import your data for free + Your free trial Gold */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white dark:bg-[#18181b] border border-[#E5E7EB] dark:border-[#27272a] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-md">
            <h3 className="text-[16px] font-bold text-[#18181B] dark:text-white">
              Importe seus dados gratuitamente
            </h3>
            <p className="text-[13.5px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
              Transferimos seus agendamentos, dados de clientes, serviços,
              fichas de anamnese e muito mais para você. Mesmo se você ainda usa
              papel e caneta!
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="px-5 py-2.5 rounded-full border border-zinc-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[13px] font-semibold text-[#18181B] dark:text-white hover:bg-zinc-50 dark:hover:bg-[#27272a] transition-colors"
              >
                {state.onboarding.importedData
                  ? "Importar mais dados"
                  : "Importar meus dados"}
              </button>
            </div>
          </div>
          <div className="w-44 h-40 rounded-xl bg-gradient-to-br from-[#52438F] to-[#7D6BB8] shrink-0 overflow-hidden relative flex items-center justify-center shadow-inner">
            <img
              src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80"
              alt="Importação de dados de beleza"
              className="w-full h-full object-cover mix-blend-luminosity opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3F3175]/60 to-transparent" />
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#F5F5F7] dark:bg-[#18181b] rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-transparent dark:border-[#27272a]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#18181B] dark:text-white">
                Seu teste gratuito
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#C69214] text-white text-[11px] font-bold">
                {state.onboarding.planTier}
              </span>
            </div>
            <p className="text-[26px] font-bold text-[#18181B] dark:text-white tracking-tight">
              {state.onboarding.trialDaysLeft} dias restantes
            </p>
            <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
              Selecione o plano e adicione seu cartão ou conta Pix para salvar
              seu progresso e continuar usando a LUVEA.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onNavigate("settings")}
              className="px-5 py-2.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[13px] font-semibold hover:bg-black dark:hover:bg-zinc-200 transition-colors"
            >
              Adicionar cartão de pagamento
            </button>
          </div>
        </div>
      </div>

      {/* Bottom 2-column row identical to 01-1-get-started.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-3">
          <h2 className="text-[18px] font-semibold text-[#18181B] dark:text-white">
            Seus próximos passos para faturar mais
          </h2>

          <div className="border border-[#E5E7EB] dark:border-[#27272a] rounded-2xl divide-y divide-[#E5E7EB] dark:divide-[#27272a] bg-white dark:bg-[#18181b]">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] flex items-center justify-center font-bold text-sm shrink-0">
                  L
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-[#18181B] dark:text-white">
                    Baixe o App LUVEA Mobile (PWA)
                  </p>
                  <p className="text-[12.5px] text-zinc-500 dark:text-[#a1a1aa]">
                    Gerencie seu estúdio de qualquer lugar usando seu celular.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    lastToastMessage:
                      "Link do Web App Mobile (PWA) copiado para instalação no celular!",
                  }))
                }
                className="px-4 py-2 rounded-full border border-zinc-300 dark:border-[#27272a] text-[13px] font-semibold text-[#18181B] dark:text-white hover:bg-zinc-50 dark:hover:bg-[#27272a] shrink-0"
              >
                Baixar App
              </button>
            </div>

            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-[#27272a] text-zinc-700 dark:text-[#a1a1aa] flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-[#18181B] dark:text-white">
                    Configure notificações e lembretes de clientes
                  </p>
                  <p className="text-[12.5px] text-zinc-500 dark:text-[#a1a1aa]">
                    Mantenha clientes informados sobre seus agendamentos via
                    WhatsApp, SMS e e-mail.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("reception")}
                className="px-4 py-2 rounded-full border border-zinc-300 dark:border-[#27272a] text-[13px] font-semibold text-[#18181B] dark:text-white hover:bg-zinc-50 dark:hover:bg-[#27272a] shrink-0"
              >
                Configurar lembretes
              </button>
            </div>

            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-[#27272a] text-zinc-700 dark:text-[#a1a1aa] flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-[#18181B] dark:text-white">
                    Ative a proteção contra faltas (Sinal Pix Anti-No-Show)
                  </p>
                  <p className="text-[12.5px] text-zinc-500 dark:text-[#a1a1aa]">
                    Proteja sua agenda exigindo taxa de reserva antes de
                    confirmar o horário.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("settings")}
                className="px-4 py-2 rounded-full border border-zinc-300 dark:border-[#27272a] text-[13px] font-semibold text-[#18181B] dark:text-white hover:bg-zinc-50 dark:hover:bg-[#27272a] shrink-0"
              >
                Definir proteção
              </button>
            </div>
          </div>
        </div>

        {/* Right: LUVEA STUDIO Booking site card identical to 01-1-get-started.png */}
        <div className="lg:col-span-4 rounded-2xl overflow-hidden border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#18181b] shadow-sm">
          <div className="h-52 bg-gradient-to-br from-[#231F20] via-[#3A3542] to-[#C8B8FA] p-4 flex gap-3 relative overflow-hidden">
            <div className="bg-white/95 text-[#18181B] px-2.5 py-1 rounded-full text-[10px] font-semibold absolute top-3 left-3 shadow-2xs">
              Agendamento Online
            </div>
            <div className="mt-8 bg-[#111113] text-white p-4 rounded-xl flex-1 flex flex-col justify-between shadow-2xl border border-white/10">
              <div>
                <p className="text-[18px] font-extrabold tracking-wider uppercase leading-none">
                  LUVEA
                  <br />
                  STUDIO
                </p>
                <p className="text-[10px] text-zinc-400 mt-2">
                  Agendamento Online · Sinal Pix
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/10">
                <span className="text-zinc-300">Reservar agora</span>
                <span className="px-2 py-0.5 rounded bg-white text-black font-bold text-[10px]">
                  30s
                </span>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-3 bg-[#F5F5F7] dark:bg-[#18181b]">
            <h3 className="text-[15px] font-bold text-[#18181B] dark:text-white">
              Personalize seu site de agendamento
            </h3>
            <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa]">
              Adicione informações do estúdio, fotos de portfólio, políticas de
              Sinal Pix e muito mais.
            </p>
            <button
              type="button"
              onClick={onOpenBookingSite}
              className="px-4 py-2 rounded-full border border-zinc-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[13px] font-semibold text-[#18181B] dark:text-white hover:bg-zinc-50 dark:hover:bg-[#27272a]"
            >
              Editar site
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Importar meus dados */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-gg-modal">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#18181B]">
                Importar seus dados gratuitamente
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-full hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[13.5px] text-zinc-600">
              Envie fotos da sua agenda de papel, planilha CSV ou exportação de
              outro aplicativo. Nossa equipe e IA importam clientes, serviços e
              fórmulas automaticamente.
            </p>
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-zinc-700">
                Origem dos dados
              </label>
              <input
                type="text"
                value={importSource}
                onChange={(e) => setImportSource(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-[13.5px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-full border border-zinc-300 text-[13px] font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setState((prev) =>
                    importStudioMigrationData(prev, {
                      sourceName: importSource,
                      clientsCount: 2,
                      servicesCount: 1,
                    })
                  );
                  setShowImportModal(false);
                }}
                className="px-5 py-2 rounded-full bg-[#1C1C1E] text-white text-[13px] font-semibold"
              >
                Importar agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MODAL: SITE DE AGENDAMENTO ONLINE PÚBLICO (LUVEA STUDIO) COM SINAL PIX
// =============================================================================

export function PublicBookingSiteModal({
  state,
  setState,
  onClose,
}: {
  state: StudioState;
  setState: React.Dispatch<React.SetStateAction<StudioState>>;
  onClose: () => void;
}) {
  const onlineServices = state.services.filter((s) => s.onlineBookingEnabled);
  const [selectedServiceId, setSelectedServiceId] = useState(
    onlineServices[0]?.id ?? state.services[0]?.id ?? ""
  );
  const [selectedProviderId, setSelectedProviderId] = useState(
    state.staff[0]?.id ?? ""
  );
  const [dateISO, setDateISO] = useState(state.calendarView.selectedDateISO);
  const [startTime, setStartTime] = useState("15:00");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [pixPayload, setPixPayload] = useState<string | null>(null);
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);
  const [pixTicketUrl, setPixTicketUrl] = useState<string | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  const selectedService =
    state.services.find((s) => s.id === selectedServiceId) ?? state.services[0];

  const handleGeneratePix = async () => {
    setIsGeneratingPix(true);
    try {
      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: `luvea-${Date.now()}`,
          clientName: clientName || "Cliente Luvea Studio",
          clientEmail: clientEmail || "cliente@luvea.app",
          serviceId: selectedService?.id ?? "srv-luvea",
          serviceName: selectedService?.name ?? "Procedimento",
          depositCents: selectedService?.depositCents || 5000,
        }),
      });
      const data = await res.json();
      setPixPayload(
        data.qrCodePayload ??
          "00020126580014BR.GOV.BCB.PIX0136pix@luvea.app5204000053039865802BR5920LUVEA STUDIO6009SAO PAULO62070503***6304ABCD"
      );
      if (data.qrCodeBase64) setPixQrBase64(data.qrCodeBase64);
      if (data.ticketUrl) setPixTicketUrl(data.ticketUrl);
    } catch {
      setPixPayload(
        "00020126580014BR.GOV.BCB.PIX0136pix@luvea.app5204000053039865802BR5920LUVEA STUDIO6009SAO PAULO62070503***6304ABCD"
      );
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleConfirmOnlineBooking = () => {
    if (!selectedService) return;
    const result = bookFromPublicSite(state, {
      clientName: clientName.trim() || "Cliente Online Luvea",
      clientEmail: clientEmail.trim() || "cliente@luvea.app",
      clientPhone: clientPhone.trim() || "(11) 99876-5432",
      serviceId: selectedService.id,
      providerId: selectedProviderId,
      dateISO,
      startTime,
      selectedAddOnIds: selectedAddOns,
      depositPaidViaPix: true,
    });
    if (result.ok) {
      setState(result.state);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-gg-modal border border-zinc-200 my-8">
        {/* Luvea Studio Dark Header */}
        <div className="bg-[#141416] text-white p-6 flex items-center justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#6E56CF] text-[11px] font-semibold uppercase tracking-wider">
              Site de Agendamento Online · Link da Bio
            </span>
            <h2 className="text-2xl font-extrabold tracking-wider uppercase mt-2">
              LUVEA STUDIO · {state.settings.business.businessName}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              luveastudio.luvea.app/{state.settings.business.bookingSlug} ·{" "}
              {state.settings.business.address}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Service, Add-ons, Date & Time */}
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                1. Escolha o Serviço do Catálogo
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {onlineServices.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(srv.id);
                      setSelectedAddOns([]);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedService?.id === srv.id
                        ? "border-2 border-[#1C1C1E] bg-[#F5F5F7] shadow-sm"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] font-semibold text-[#18181B]">
                        {srv.name}
                      </span>
                      <span className="text-[13px] font-mono font-bold text-[#18181B]">
                        {srv.priceType === "starting_at" ? "A partir de " : ""}
                        {formatBRL(srv.priceCents)}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-zinc-500 mt-0.5">
                      {srv.durationMinutes} min ·{" "}
                      {srv.requireDeposit
                        ? `Exige Sinal Pix de ${formatBRL(srv.depositCents)}`
                        : "Confirmação imediata"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {selectedService && selectedService.addOns.length > 0 && (
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                  Adicionais (Add-ons)
                </label>
                <div className="space-y-1.5">
                  {selectedService.addOns.map((add) => {
                    const checked = selectedAddOns.includes(add.id);
                    return (
                      <label
                        key={add.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 text-[12.5px] cursor-pointer"
                      >
                        <span className="font-medium text-zinc-800">
                          {add.name} (+{add.durationMinutes} min)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">
                            +{formatBRL(add.priceCents)}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedAddOns((prev) =>
                                checked
                                  ? prev.filter((id) => id !== add.id)
                                  : [...prev, add.id]
                              )
                            }
                            className="rounded border-zinc-300"
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={dateISO}
                  onChange={(e) => setDateISO(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  Horário disponível
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-[13px]"
                >
                  <option value="09:00">09:00</option>
                  <option value="10:30">10:30 (Encaixe Pausa)</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:30">16:30</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right: Client details & Pix Deposit */}
          <div className="space-y-4 bg-[#F5F5F7] p-5 rounded-2xl flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-[14px] font-bold text-[#18181B]">
                2. Seus Dados & Garantia Anti-No-Show (Sinal Pix)
              </h3>
              <div>
                <label className="block text-[11.5px] font-medium text-zinc-600 mb-1">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Camila Vasconcelos"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-[13px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11.5px] font-medium text-zinc-600 mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99812-3344"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-zinc-600 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="camila@email.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-zinc-600 mb-1">
                  Profissional (Provider)
                </label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-[13px]"
                >
                  {state.staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedService?.requireDeposit && (
                <div className="p-3.5 rounded-xl bg-white border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-[#18181B]">
                      Sinal de Reserva (Pix · Mercado Pago)
                    </span>
                    <span className="text-[13px] font-mono font-bold text-[#6E56CF]">
                      {formatBRL(selectedService.depositCents)}
                    </span>
                  </div>
                  {!pixPayload ? (
                    <button
                      type="button"
                      disabled={isGeneratingPix}
                      onClick={handleGeneratePix}
                      className="w-full py-2 rounded-full border border-zinc-300 text-[12px] font-semibold hover:bg-zinc-50 disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>
                        {isGeneratingPix
                          ? "Gerando Pix no Mercado Pago..."
                          : "Gerar QR Code Pix do Sinal"}
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-2.5 pt-1">
                      {pixQrBase64 && (
                        <div className="flex justify-center p-2 bg-white rounded-xl border border-zinc-200">
                          <img
                            src={`data:image/png;base64,${pixQrBase64}`}
                            alt="QR Code Pix Mercado Pago"
                            className="w-36 h-36 object-contain"
                          />
                        </div>
                      )}
                      <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 font-mono text-[10px] break-all text-zinc-600">
                        {pixPayload}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(pixPayload);
                          setCopiedPix(true);
                        }}
                        className="w-full py-2.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        {copiedPix ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Pix Copia e Cola Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Código Pix</span>
                          </>
                        )}
                      </button>
                      {pixTicketUrl && (
                        <a
                          href={pixTicketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 w-full text-center text-[11px] font-medium text-[#6E56CF] hover:underline"
                        >
                          <span>Abrir comprovante / instruções Pix no Mercado Pago</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleConfirmOnlineBooking}
              className="w-full py-3 rounded-full bg-[#1C1C1E] text-white text-[13.5px] font-semibold hover:bg-black transition-colors"
            >
              Confirmar Agendamento Online
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SEÇÃO 02: RECEPÇÃO IA (02-reception-ia.png) + WHATSAPP QR CODE 2-WAY SYNC
// =============================================================================

export function ReceptionView({
  state,
  setState,
}: {
  state: StudioState;
  setState: React.Dispatch<React.SetStateAction<StudioState>>;
}) {
  const [demoPlaying, setDemoPlaying] = useState(false);
  const activeStep = state.reception.activeStep;

  const setStep = (step: "meet" | "setup" | "ready") => {
    setState((prev) => ({
      ...prev,
      reception: {
        ...prev.reception,
        activeStep: step,
      },
    }));
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white dark:bg-[#09090b]">
      {/* Top 3-step progress bar identical to 02-reception-ia.png */}
      <div className="w-full px-6 lg:px-8 xl:px-10 pt-6">
        <div className="flex items-start justify-between gap-6">
          <div className="grid grid-cols-3 gap-3 flex-1 max-w-[780px]">
            <button
              type="button"
              onClick={() => setStep("meet")}
              className="text-left group"
            >
              <div
                className={`h-[2px] w-full mb-2 transition-colors ${
                  activeStep === "meet" ||
                  activeStep === "setup" ||
                  activeStep === "ready"
                    ? "bg-[#18181B] dark:bg-white"
                    : "bg-zinc-200 dark:bg-[#27272a]"
                }`}
              />
              <span
                className={`text-[12.5px] ${
                  activeStep === "meet"
                    ? "font-semibold text-[#18181B] dark:text-white"
                    : "font-medium text-zinc-600 dark:text-[#a1a1aa]"
                }`}
              >
                Conheça a Recepção
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStep("setup")}
              className="text-left group"
            >
              <div
                className={`h-[2px] w-full mb-2 transition-colors ${
                  activeStep === "setup" || activeStep === "ready"
                    ? "bg-[#18181B] dark:bg-white"
                    : "bg-zinc-200 dark:bg-[#27272a]"
                }`}
              />
              <span
                className={`text-[12.5px] ${
                  activeStep === "setup"
                    ? "font-semibold text-[#18181B] dark:text-white"
                    : "font-medium text-zinc-600 dark:text-[#a1a1aa]"
                }`}
              >
                Configuração rápida
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStep("ready")}
              className="text-left group"
            >
              <div
                className={`h-[2px] w-full mb-2 transition-colors ${
                  activeStep === "ready" ? "bg-[#18181B] dark:bg-white" : "bg-zinc-200 dark:bg-[#27272a]"
                }`}
              />
              <span
                className={`text-[12.5px] ${
                  activeStep === "ready"
                    ? "font-semibold text-[#18181B] dark:text-white"
                    : "font-medium text-zinc-600 dark:text-[#a1a1aa]"
                }`}
              >
                Pronta
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                lastToastMessage:
                  "Central de Ajuda da Recepção IA: Suporte 24/7 para WhatsApp & Voz.",
              }))
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[12.5px] font-semibold hover:bg-black dark:hover:bg-zinc-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Precisa de ajuda?</span>
          </button>
        </div>
      </div>

      {/* STEP 1: MEET RECEPTION (100% identical to 02-reception-ia.png) */}
      {activeStep === "meet" && (
        <>
          <div className="max-w-[540px] mx-auto px-6 py-12 flex flex-col items-center text-center">
            {/* Glowing Waveform Pill */}
            <button
              type="button"
              onClick={() => setDemoPlaying(!demoPlaying)}
              className="gg-waveform-pill w-32 h-14 rounded-full shadow-lg flex items-center justify-center gap-1 px-4 transition-transform hover:scale-105 cursor-pointer"
            >
              {[10, 14, 18, 22, 16, 24, 20, 14, 18, 22, 16, 12, 18, 14, 10].map(
                (h, idx) => (
                  <span
                    key={idx}
                    style={{
                      height: demoPlaying
                        ? `${Math.max(8, ((h + idx * 5) % 24) + 6)}px`
                        : `${h * 0.55}px`,
                    }}
                    className="w-[2px] bg-white/90 rounded-full transition-all duration-300"
                  />
                )
              )}
            </button>
            <p className="text-[12.5px] text-zinc-600 dark:text-[#a1a1aa] mt-3">
              {demoPlaying
                ? "Reproduzindo demonstração de atendimento da Recepção IA..."
                : "Toque para testar a Recepção"}
            </p>

            {/* Editorial Serif Headline */}
            <h1 className="font-serif text-[44px] leading-tight text-[#18181B] dark:text-white mt-6 mb-8 tracking-tight">
              Apresentando a Recepção
            </h1>

            {/* 3 Feature Bullets with Luxury Editorial Dot Indicator */}
            <div className="space-y-6 text-left w-full">
              <div className="flex items-start gap-3.5">
                <span className="w-2 h-2 rounded-full bg-[#18181B] dark:bg-white mt-1.5 shrink-0" />
                <div>
                  <h3 className="text-[14px] font-bold text-[#18181B] dark:text-white">
                    Pare de perder agendamentos por chamadas ou mensagens não
                    respondidas
                  </h3>
                  <p className="text-[13.5px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed mt-0.5">
                    Atende WhatsApp, ligações, dúvidas de preços e faz
                    agendamentos 24/7 com base nas suas regras.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="w-2 h-2 rounded-full bg-[#18181B] dark:bg-white mt-1.5 shrink-0" />
                <div>
                  <h3 className="text-[14px] font-bold text-[#18181B] dark:text-white">
                    Mantenha o controle, sem mensagens acumuladas no WhatsApp
                  </h3>
                  <p className="text-[13.5px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed mt-0.5">
                    Mantenha seu número via QR Code ou use como linha principal.
                    Responda na hora ou apenas quando estiver em atendimento.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="w-2 h-2 rounded-full bg-[#18181B] dark:bg-white mt-1.5 shrink-0" />
                <div>
                  <h3 className="text-[14px] font-bold text-[#18181B] dark:text-white">
                    Teste grátis até 30/11
                  </h3>
                  <p className="text-[13.5px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed mt-0.5">
                    Paga-se sozinha cada vez que salva um agendamento ou evita
                    uma falta com confirmação 2-Way Sync. Desative quando quiser.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom cream footer bar identical to 02-reception-ia.png */}
          <div className="w-full bg-[#FAF9F2] dark:bg-[#18181b] border-t border-zinc-200/70 dark:border-[#27272a] py-6 px-6 flex flex-col items-center gap-3">
            <span className="text-[12px] text-zinc-600 dark:text-[#a1a1aa]">
              Experimente a Recepção em ação
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("setup")}
                className="px-6 py-3 rounded-full border border-zinc-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[13.5px] font-semibold text-[#18181B] dark:text-white hover:bg-zinc-50 dark:hover:bg-[#27272a] transition-colors"
              >
                Pular para configuração
              </button>
              <button
                type="button"
                onClick={() => {
                  setDemoPlaying(true);
                  setState((prev) => ({
                    ...prev,
                    lastToastMessage:
                      "Demo da Recepção IA: 'Olá! Aqui é a Recepção da Luvea Studio. Posso agendar seu horário hoje às 15h?'",
                  }));
                }}
                className="px-10 py-3 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[13.5px] font-semibold hover:bg-black dark:hover:bg-zinc-200 transition-colors inline-flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Testar demo da Recepção</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* STEP 2: QUICK SET UP (Configuração do WhatsApp do Usuário + Regras 24h/2h) */}
      {activeStep === "setup" && (
        <div className="max-w-[960px] w-full mx-auto px-6 py-10 space-y-8 flex-1">
          <div className="space-y-1">
            <h2 className="font-serif text-[36px] text-[#18181B] dark:text-white">
              Configuração Rápida · WhatsApp do Estúdio
            </h2>
            <p className="text-[14px] text-zinc-600 dark:text-[#a1a1aa]">
              Conecte o WhatsApp do seu estúdio escaneando o QR Code e personalize seus lembretes e mensagens automáticas.
            </p>
          </div>

          <WhatsAppConfigCard
            state={state}
            setState={setState}
            onAfterSave={() => setStep("ready")}
            showSaveAndContinue={false}
          />

          {/* Regras de Automação 2-Way Sync */}
          <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-zinc-200 dark:border-[#27272a] p-6 space-y-4 shadow-sm">
            <h3 className="text-[15px] font-bold text-[#18181B] dark:text-white">
              Regras de Disparo Automático (2-Way Sync)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start justify-between p-4 rounded-xl border border-zinc-200 dark:border-[#27272a] bg-[#FAF9F6] dark:bg-[#202023] cursor-pointer">
                <div className="pr-3">
                  <p className="text-[13px] font-semibold text-[#18181B] dark:text-white">
                    Disparo automático 24h antes
                  </p>
                  <p className="text-[12px] text-zinc-500 dark:text-[#a1a1aa] mt-0.5">
                    Envia confirmação interativa (1 = Confirmar, 2 = Reagendar)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={state.reception.send24hReminder}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      reception: {
                        ...prev.reception,
                        send24hReminder: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 mt-0.5 accent-[#6E56CF]"
                />
              </label>

              <label className="flex items-start justify-between p-4 rounded-xl border border-zinc-200 dark:border-[#27272a] bg-[#FAF9F6] dark:bg-[#202023] cursor-pointer">
                <div className="pr-3">
                  <p className="text-[13px] font-semibold text-[#18181B] dark:text-white">
                    Aviso de proximidade 2h antes
                  </p>
                  <p className="text-[12px] text-zinc-500 dark:text-[#a1a1aa] mt-0.5">
                    Envia endereço do estúdio e orientações de chegada
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={state.reception.send2hReminder}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      reception: {
                        ...prev.reception,
                        send2hReminder: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 mt-0.5 accent-[#6E56CF]"
                />
              </label>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setStep("ready")}
                className="px-8 py-3 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[13.5px] font-semibold hover:bg-black dark:hover:bg-zinc-200 transition-colors shadow-sm"
              >
                Salvar e abrir Painel ao Vivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: READY (Monitor em Tempo Real & Simulador 2-Way Sync) */}
      {activeStep === "ready" && (
        <div className="max-w-[980px] w-full mx-auto px-6 py-8 space-y-6 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-[34px] text-[#18181B] dark:text-white">
                Recepção IA · Operando em Tempo Real
              </h2>
              <p className="text-[13.5px] text-zinc-600 dark:text-[#a1a1aa]">
                Simule abaixo a resposta de um cliente no WhatsApp (&quot;1&quot;
                para Confirmar) e veja o status atualizar instantaneamente na
                Agenda.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setState((prev) =>
                    processWhatsappInboundReply(prev, "evt-1", "1_confirmed")
                  )
                }
                className="px-4 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[12.5px] font-semibold hover:bg-black dark:hover:bg-zinc-200"
              >
                Simular Resposta &quot;1&quot; (Stefany)
              </button>
              <button
                type="button"
                onClick={() =>
                  setState((prev) =>
                    processWhatsappInboundReply(prev, "evt-1", "2_reschedule")
                  )
                }
                className="px-4 py-2 rounded-full border border-zinc-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[12.5px] font-semibold text-[#18181B] dark:text-white hover:bg-zinc-50 dark:hover:bg-[#27272a]"
              >
                Simular &quot;2&quot; (Reagendar)
              </button>
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-[#27272a] rounded-2xl divide-y divide-zinc-200 dark:divide-[#27272a] bg-white dark:bg-[#18181b]">
            {state.reception.logs.map((log) => (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#18181B] dark:text-white">
                      {log.clientName}
                    </span>
                    <span className="text-[11.5px] text-zinc-500 dark:text-[#a1a1aa]">
                      {log.clientPhone} · {log.timestampLabel}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] dark:bg-[#27272a] text-white text-[10.5px] font-semibold">
                      {log.channel}
                    </span>
                  </div>
                  <p className="text-[13px] text-zinc-700 dark:text-[#a1a1aa]">{log.messageText}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#16A34A] text-white text-[11px] font-bold shadow-sm shrink-0">
                  {log.outcomeBadge}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
