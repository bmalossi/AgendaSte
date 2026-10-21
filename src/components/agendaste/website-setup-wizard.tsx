"use client";

import React, { useState } from "react";
import {
  X,
  ArrowRight,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Building,
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  QrCode,
  MapPin,
  Home,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  StudioState,
  BookingSiteThemeId,
  WebsiteBookingSetupConfig,
  normalizeSubdomainSlug,
  claimBookingSiteSubdomain,
  updateWebsiteSetupConfig,
  getDefaultWebsiteBookingConfig,
  getBookingSiteUrl,
} from "@/lib/agendaste-store";
import { LuveaWordmark } from "@/components/luvea-logo";

interface WebsiteSetupWizardProps {
  state: StudioState;
  setState: React.Dispatch<React.SetStateAction<StudioState>>;
  onClose: () => void;
  onOpenPublicSite?: (slug: string) => void;
  onNavigateToCatalog?: () => void;
  initialStep?: number;
}

export const THEME_DEFINITIONS: Record<
  BookingSiteThemeId,
  {
    name: string;
    description: string;
    bgStyle: string;
    textStyle: string;
    accentStyle: string;
    heroSampleUrl?: string;
  }
> = {
  classic: {
    name: "Classic",
    description: "Esmeralda escuro e textura orgânica refinada.",
    bgStyle: "bg-[#0A1A14]",
    textStyle: "text-white",
    accentStyle: "border-white/30 text-white",
  },
  billboard: {
    name: "Billboard",
    description: "Tipografia em caixa alta e contraste marcante.",
    bgStyle: "bg-[#18181B]",
    textStyle: "text-white font-mono",
    accentStyle: "border-zinc-500 text-white",
  },
  canvas: {
    name: "Canvas",
    description: "Minimalismo editorial preto e branco de alta costura.",
    bgStyle: "bg-white",
    textStyle: "text-[#18181B]",
    accentStyle: "border-zinc-900 text-zinc-900",
  },
  energy: {
    name: "Energy",
    description: "Rosa e coral vibrantes com energia contemporânea.",
    bgStyle: "bg-[#9E2A2B]",
    textStyle: "text-white",
    accentStyle: "border-white/40 text-white",
  },
  organic: {
    name: "Organic",
    description: "Tons botânicos, terrosos e atmosfera relaxante.",
    bgStyle: "bg-[#2D3B2D]",
    textStyle: "text-[#E8EFE8]",
    accentStyle: "border-[#E8EFE8]/30 text-[#E8EFE8]",
  },
  play: {
    name: "Play",
    description: "Design moderno, arrojado e criativo.",
    bgStyle: "bg-[#0F172A]",
    textStyle: "text-white",
    accentStyle: "border-white/30 text-white",
  },
};

export function WebsiteSetupWizard({
  state,
  setState,
  onClose,
  onOpenPublicSite,
  onNavigateToCatalog,
  initialStep = 1,
}: WebsiteSetupWizardProps) {
  const currentConfig =
    state.settings.website ??
    getDefaultWebsiteBookingConfig(state.settings.business.businessName);

  // Wizard Navigation Step:
  // 1: Business Name
  // 2: Customize Theme
  // 3: Choose Subdomain URL
  // 4: Website Created Celebration
  // 5: Service Location (Address / House Calls)
  // 6: Business Hours
  // 7: Online Booking Experience (Approval & Guarantee)
  // 8: Add Services & AI Suggestions
  // 9: Set up payments (Rates & Overview)
  // 10: Payout Account (Pix Key / Bank Account)
  // 11: Identity Verification
  const [step, setStep] = useState<number>(initialStep);

  // Phase 1 Local State
  const [businessName, setBusinessName] = useState(
    state.settings.business.businessName || "Bruno Fernandes Malossi Silva"
  );
  const [selectedTheme, setSelectedTheme] = useState<BookingSiteThemeId>(
    currentConfig.theme || "classic"
  );
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [subdomainInput, setSubdomainInput] = useState(
    currentConfig.subdomainSlug || normalizeSubdomainSlug(businessName)
  );
  const [showCelebrationToast, setShowCelebrationToast] = useState(true);

  // Phase 2 Local State
  const [hasFixedAddress, setHasFixedAddress] = useState(
    currentConfig.hasFixedAddress ?? true
  );
  const [doesHouseCalls, setDoesHouseCalls] = useState(
    currentConfig.doesHouseCalls ?? false
  );
  const [addressLine1, setAddressLine1] = useState(
    currentConfig.addressLine1 || "Rua Mateus Cipullo, 49 casa 7"
  );
  const [addressLine2, setAddressLine2] = useState(
    currentConfig.addressLine2 || ""
  );
  const [city, setCity] = useState(currentConfig.city || "Praia Grande");
  const [zipCode, setZipCode] = useState(currentConfig.zipCode || "11724-000");
  const [ufState, setUfState] = useState(currentConfig.state || "SP");

  const [businessHours, setBusinessHours] = useState(
    currentConfig.businessHours ?? [
      { dayOfWeek: 0, label: "Domingo", isOpen: false, startTime: "08:00", endTime: "14:00" },
      { dayOfWeek: 1, label: "Segunda-feira", isOpen: true, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 2, label: "Terça-feira", isOpen: true, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 3, label: "Quarta-feira", isOpen: true, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 4, label: "Quinta-feira", isOpen: true, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 5, label: "Sexta-feira", isOpen: true, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 6, label: "Sábado", isOpen: true, startTime: "08:00", endTime: "17:00" },
    ]
  );

  const [autoApprove, setAutoApprove] = useState<boolean>(
    currentConfig.autoApproveAppointments ?? true
  );
  const [bookingGuarantee, setBookingGuarantee] = useState<
    "pix_deposit" | "card_on_file" | "none"
  >(currentConfig.onlineBookingGuarantee ?? "pix_deposit");

  // AI Suggestions local state
  const [aiSuggestions, setAiSuggestions] = useState([
    { id: "ai-srv-1", name: "Consulta de Coloração Personalizada", durationMin: 30, priceCents: 12000 },
    { id: "ai-srv-2", name: "Tratamento de Hidratação Profunda", durationMin: 45, priceCents: 15000 },
    { id: "ai-srv-3", name: "Consulta de Mega Hair & Extensões", durationMin: 30, priceCents: 10000 },
    { id: "ai-srv-4", name: "Design de Sobrancelhas & Lash Lift", durationMin: 40, priceCents: 8500 },
  ]);
  const [addedAiIds, setAddedAiIds] = useState<string[]>([]);

  // Phase 3 Local State
  const [payoutMethod, setPayoutMethod] = useState<"pix_key" | "bank_account" | "debit_card">(
    currentConfig.paymentsSetup?.payoutMethod ?? "pix_key"
  );
  const [pixKeyType, setPixKeyType] = useState<"cpf_cnpj" | "email" | "phone" | "random">(
    currentConfig.paymentsSetup?.pixKeyType ?? "email"
  );
  const [pixKeyValue, setPixKeyValue] = useState(
    currentConfig.paymentsSetup?.pixKeyValue ?? "pix@luveastudio.app"
  );
  const [bankName, setBankName] = useState(
    currentConfig.paymentsSetup?.bankName ?? "Nu Pagamentos S.A. (Nubank)"
  );
  const [routingOrAgency, setRoutingOrAgency] = useState(
    currentConfig.paymentsSetup?.routingOrAgency ?? "0001"
  );
  const [accountNumber, setAccountNumber] = useState(
    currentConfig.paymentsSetup?.accountNumber ?? "1234567-8"
  );

  // Normalization
  const activeSlug = normalizeSubdomainSlug(subdomainInput || businessName);

  // Handlers for Phase 1
  const handleClaimSubdomain = () => {
    setState((prev) =>
      claimBookingSiteSubdomain(prev, activeSlug, selectedTheme, businessName)
    );
    setStep(4); // Advance to celebration screen
  };

  const handleUpdateWebsiteConfigOnly = () => {
    setState((prev) =>
      updateWebsiteSetupConfig(prev, {
        theme: selectedTheme,
        subdomainSlug: activeSlug,
      })
    );
  };

  // Handlers for Phase 2
  const handleSaveBookingSettings = () => {
    setState((prev) => {
      const next = updateWebsiteSetupConfig(prev, {
        hasFixedAddress,
        doesHouseCalls,
        addressLine1,
        addressLine2,
        city,
        zipCode,
        state: ufState,
        businessHours,
        autoApproveAppointments: autoApprove,
        onlineBookingGuarantee: bookingGuarantee,
      });
      // Mark step 2 as completed
      return {
        ...next,
        onboarding: {
          ...next.onboarding,
          steps: next.onboarding.steps.map((s) =>
            s.id === "add_services" ? { ...s, completed: true } : s
          ),
        },
        lastToastMessage: "Regras de agendamento salvas com sucesso!",
      };
    });
    setStep(9); // Advance to Phase 3 (Payments)
  };

  // Handlers for Phase 3
  const handleSavePayments = (verified: boolean) => {
    setState((prev) => {
      const current = prev.settings.website ?? getDefaultWebsiteBookingConfig(businessName);
      const next = {
        ...prev,
        settings: {
          ...prev.settings,
          website: {
            ...current,
            paymentsSetup: {
              payoutMethod,
              pixKeyType,
              pixKeyValue,
              bankName,
              routingOrAgency,
              accountNumber,
              debitCardLast4: "4678",
              identityVerified: verified,
              setupCompleted: true,
            },
          },
        },
        onboarding: {
          ...prev.onboarding,
          steps: prev.onboarding.steps.map((s) =>
            s.id === "start_getting_paid"
              ? { ...s, completed: verified }
              : s
          ),
        },
        lastToastMessage: verified
          ? "Configuração de pagamentos concluída!"
          : "Configuração bancária salva. Verificação pendente.",
      };
      return next;
    });
    onClose();
  };

  const handleAddAiService = (srv: typeof aiSuggestions[0]) => {
    setState((prev) => ({
      ...prev,
      services: [
        {
          id: `srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: srv.name,
          description: `Procedimento profissional especializado: ${srv.name}.`,
          category: "Estética & Beleza",
          calendarColor: "#6E56CF",
          onlineBookingEnabled: true,
          priceType: "fixed",
          priceCents: srv.priceCents,
          requireDeposit: true,
          depositCents: Math.round(srv.priceCents * 0.3),
          durationMinutes: srv.durationMin,
          processingTimeEnabled: false,
          processingStartOffsetMinutes: 0,
          processingDurationMinutes: 0,
          blockTimeEnabled: true,
          blockAfterMinutes: 10,
          requiredResourceIds: [],
          options: [],
          addOns: [],
        },
        ...prev.services,
      ],
      lastToastMessage: `Serviço "${srv.name}" adicionado!`,
    }));
    setAddedAiIds((prev) => [...prev, srv.id]);
  };

  const handleRegenerateAi = () => {
    setAiSuggestions([
      { id: `ai-${Date.now()}-1`, name: "Banho de Brilho & Glossing", durationMin: 35, priceCents: 9500 },
      { id: `ai-${Date.now()}-2`, name: "Protocolo Anti-Sensibilidade Capilar", durationMin: 50, priceCents: 18000 },
      { id: `ai-${Date.now()}-3`, name: "Corte Geométrico & Finalização", durationMin: 45, priceCents: 11000 },
      { id: `ai-${Date.now()}-4`, name: "Tratamento Reconstrutor de Pontes", durationMin: 60, priceCents: 22000 },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto animate-in fade-in duration-200">
      {/* Top Bar with Brand & Close Button */}
      <header className="w-full border-b border-zinc-200 px-6 sm:px-10 py-4 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <LuveaWordmark className="text-[17px]" />
          <span className="text-zinc-300">|</span>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            {step <= 4
              ? "Configurar Site (Fase 1/3)"
              : step <= 8
              ? "Configurar Agendamento & Serviços (Fase 2/3)"
              : "Configurar Pagamentos (Fase 3/3)"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col justify-between">
        {/* =====================================================================
            ETAPA 1: NOME DO NEGÓCIO
        ===================================================================== */}
        {step === 1 && (
          <div className="max-w-6xl w-full mx-auto px-6 py-8 sm:py-12 flex-1 flex flex-col lg:flex-row items-center gap-10">
            {/* Left Column: Form */}
            <div className="w-full lg:w-5/12 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                  Configurar site
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                  Qual é o nome do seu negócio?
                </h1>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Você pode fazer alterações depois acessando Configurações no app.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700">
                  Nome do negócio
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    setSubdomainInput(normalizeSubdomainSlug(e.target.value));
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900 bg-white"
                  placeholder="Ex: Studio Bella / Bruno Hair"
                />
              </div>
            </div>

            {/* Right Column: Browser Mockup Preview */}
            <div className="w-full lg:w-7/12 flex justify-center">
              <BrowserMockup
                url={`${normalizeSubdomainSlug(businessName)}.luvea.app`}
                device={previewDevice}
                theme={selectedTheme}
                businessName={businessName}
              />
            </div>
          </div>
        )}

        {/* =====================================================================
            ETAPA 2: PERSONALIZAR TEMA (6 TEMAS + DESKTOP/MOBILE)
        ===================================================================== */}
        {step === 2 && (
          <div className="max-w-6xl w-full mx-auto px-6 py-8 sm:py-12 flex-1 flex flex-col lg:flex-row items-start gap-10">
            {/* Left Column: Themes Accordion */}
            <div className="w-full lg:w-5/12 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                  Configurar site
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                  Personalize seu site de agendamento
                </h1>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Você pode trocar o tema visual a qualquer momento em Configurações.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider font-mono text-zinc-900">
                    Tema selecionado: {THEME_DEFINITIONS[selectedTheme].name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(THEME_DEFINITIONS) as BookingSiteThemeId[]).map(
                    (themeId) => {
                      const t = THEME_DEFINITIONS[themeId];
                      const isSelected = selectedTheme === themeId;
                      return (
                        <button
                          key={themeId}
                          type="button"
                          onClick={() => setSelectedTheme(themeId)}
                          className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between min-h-[96px] ${
                            isSelected
                              ? "border-zinc-900 ring-2 ring-zinc-900 shadow-xs bg-zinc-50"
                              : "border-zinc-200 hover:border-zinc-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold text-xs text-zinc-900">
                              {t.name}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-zinc-900" />
                            )}
                          </div>
                          <div
                            className={`w-full h-8 rounded-lg mt-2 flex items-center justify-center ${t.bgStyle}`}
                          >
                            <span className="text-[10px] uppercase font-mono tracking-wider font-bold opacity-80 text-white">
                              {t.name}
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Browser Mockup + Device Toggle */}
            <div className="w-full lg:w-7/12 flex flex-col items-center space-y-4">
              <div className="inline-flex items-center p-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`px-4 py-1.5 rounded-full transition-all ${
                    previewDevice === "desktop"
                      ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`px-4 py-1.5 rounded-full transition-all ${
                    previewDevice === "mobile"
                      ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Mobile
                </button>
              </div>

              <BrowserMockup
                url={`${activeSlug}.luvea.app`}
                device={previewDevice}
                theme={selectedTheme}
                businessName={businessName}
              />
            </div>
          </div>
        )}

        {/* =====================================================================
            ETAPA 3: ESCOLHER SUBDOMÍNIO (.luvea.app)
        ===================================================================== */}
        {step === 3 && (
          <div className="max-w-6xl w-full mx-auto px-6 py-8 sm:py-12 flex-1 flex flex-col lg:flex-row items-center gap-10">
            {/* Left Column: Form */}
            <div className="w-full lg:w-5/12 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                  Configurar site
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                  Escolha o endereço do seu site
                </h1>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Com uma URL própria, seus clientes poderão encontrar seu estúdio e agendar online com facilidade.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700">
                  Endereço web (URL)
                </label>
                <div className="flex items-center rounded-xl border border-zinc-300 bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-zinc-900 focus-within:border-transparent">
                  <input
                    type="text"
                    value={subdomainInput}
                    onChange={(e) => setSubdomainInput(e.target.value)}
                    className="flex-1 text-sm text-zinc-900 focus:outline-none bg-transparent font-mono"
                    placeholder="brunofernandesmalossi"
                  />
                  <span className="text-xs font-mono text-zinc-500 select-none pl-1">
                    .luvea.app
                  </span>
                </div>
                <p className="text-[11px] font-mono text-zinc-500 pt-1">
                  Link que os clientes acessarão:{" "}
                  <strong className="text-zinc-900 font-semibold">
                    https://{activeSlug}.luvea.app
                  </strong>
                </p>
              </div>
            </div>

            {/* Right Column: Live Mockup */}
            <div className="w-full lg:w-7/12 flex justify-center">
              <BrowserMockup
                url={`${activeSlug}.luvea.app`}
                device={previewDevice}
                theme={selectedTheme}
                businessName={businessName}
              />
            </div>
          </div>
        )}

        {/* =====================================================================
            ETAPA 4: CELEBRAÇÃO — SITE CRIADO (Editorial Clean)
        ===================================================================== */}
        {step === 4 && (
          <div className="w-full flex-1 bg-[#F5F5F7] flex flex-col items-center justify-center p-6 sm:p-12 text-center relative">
            <div className="max-w-2xl space-y-6 animate-in zoom-in-95 duration-200">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E5EA] text-[12.5px] font-medium text-[#1C1C1E] shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                  <span>Site publicado e ativo</span>
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#1C1C1E]">
                  Seu novo site está no ar
                </h1>
                <p className="text-[13px] sm:text-[14px] text-[#6E6E73] max-w-lg mx-auto leading-relaxed">
                  A identidade visual pode ser ajustada a qualquer momento em Configurações. A seguir, vamos definir os serviços e horários da sua agenda.
                </p>
              </div>

              {/* Centered Preview Mockup */}
              <div className="max-w-md mx-auto transform scale-95 sm:scale-100 shadow-sm rounded-2xl overflow-hidden border border-[#E5E5EA] bg-white">
                <BrowserMockup
                  url={`${activeSlug}.luvea.app`}
                  device="desktop"
                  theme={selectedTheme}
                  businessName={businessName}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenPublicSite) {
                      onOpenPublicSite(activeSlug);
                    } else {
                      window.open(getBookingSiteUrl(activeSlug), "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#D4D4D8] bg-white text-[#1C1C1E] text-[13px] font-medium hover:bg-[#F5F5F7] transition-colors shadow-2xs inline-flex items-center justify-center gap-1.5"
                >
                  <span>Visualizar site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)} // Go to Phase 2
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium hover:bg-black transition-colors shadow-xs"
                >
                  Configurar serviços e agendamento
                </button>
              </div>
            </div>

            {/* Bottom Toast Notification */}
            {showCelebrationToast && (
              <div className="absolute bottom-6 bg-[#1C1C1E] text-white px-4 py-2 rounded-full text-[12.5px] font-medium flex items-center gap-2 shadow-lg animate-in slide-in-from-bottom duration-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                <span>URL atualizada com sucesso</span>
                <button
                  type="button"
                  onClick={() => setShowCelebrationToast(false)}
                  className="ml-2 hover:opacity-70 text-zinc-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            ETAPA 5: ONDE VOCÊ ATENDE? (Endereço Fixo & Domicílio)
        ===================================================================== */}
        {step === 5 && (
          <div className="max-w-2xl w-full mx-auto px-6 py-8 sm:py-12 flex-1 space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                Configurar agendamento · Etapa 1 de 4
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                Onde você realiza seus atendimentos?
              </h1>
            </div>

            <div className="space-y-4 pt-2">
              {/* Toggle 1: Endereço Fixo */}
              <div className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-zinc-900">
                      Tenho um endereço fixo
                    </p>
                    <p className="text-xs text-zinc-500">
                      Informe o endereço que deseja exibir no seu site.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasFixedAddress}
                    onChange={(e) => setHasFixedAddress(e.target.checked)}
                    className="w-5 h-5 accent-zinc-900 rounded cursor-pointer"
                  />
                </div>

                {hasFixedAddress && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-100 animate-in fade-in">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-medium text-zinc-700">
                        Rua e Número (Obrigatório)
                      </label>
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
                        placeholder="Ex: Rua Mateus Cipullo, 49 casa 7"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-medium text-zinc-700">
                        Complemento (Opcional)
                      </label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
                        placeholder="Ex: Sala 804 / Bloco B"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-700">
                        Cidade (Obrigatório)
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
                        placeholder="Ex: Praia Grande / São Paulo"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-700">
                        CEP (Obrigatório)
                      </label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
                        placeholder="11724-000"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-700">
                        Estado (UF)
                      </label>
                      <select
                        value={ufState}
                        onChange={(e) => setUfState(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900 bg-white"
                      >
                        {["SP", "RJ", "MG", "RS", "PR", "SC", "BA", "PE", "CE", "DF", "GO", "ES"].map(
                          (uf) => (
                            <option key={uf} value={uf}>
                              {uf}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle 2: Domicílio */}
              <div className="p-5 rounded-2xl border border-zinc-200 bg-white flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-zinc-900">
                    Atendo a domicílio
                  </p>
                  <p className="text-xs text-zinc-500">
                    Exibe no site que você atende na residência do cliente.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={doesHouseCalls}
                  onChange={(e) => setDoesHouseCalls(e.target.checked)}
                  className="w-5 h-5 accent-zinc-900 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            ETAPA 6: HORÁRIOS DE ATENDIMENTO (7 DIAS DA SEMANA)
        ===================================================================== */}
        {step === 6 && (
          <div className="max-w-2xl w-full mx-auto px-6 py-8 sm:py-12 flex-1 space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                Configurar agendamento · Etapa 2 de 4
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                Qual é o seu horário de atendimento?
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Os clientes só poderão agendar dentro destes horários. Você pode editá-los depois em Configurações.
              </p>
            </div>

            <div className="divide-y divide-zinc-200 border-y border-zinc-200 py-1">
              {businessHours.map((bh, idx) => (
                <div
                  key={bh.dayOfWeek}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 w-36">
                    <input
                      type="checkbox"
                      checked={bh.isOpen}
                      onChange={(e) => {
                        const updated = [...businessHours];
                        updated[idx].isOpen = e.target.checked;
                        setBusinessHours(updated);
                      }}
                      className="w-4 h-4 accent-zinc-900 rounded"
                    />
                    <span
                      className={`font-medium ${
                        bh.isOpen ? "text-zinc-900" : "text-zinc-400 line-through"
                      }`}
                    >
                      {bh.label}
                    </span>
                  </div>

                  {bh.isOpen ? (
                    <div className="flex items-center gap-2 font-mono">
                      <input
                        type="time"
                        value={bh.startTime}
                        onChange={(e) => {
                          const updated = [...businessHours];
                          updated[idx].startTime = e.target.value;
                          setBusinessHours(updated);
                        }}
                        className="px-2 py-1 rounded border border-zinc-200 text-xs"
                      />
                      <span className="text-zinc-400">até</span>
                      <input
                        type="time"
                        value={bh.endTime}
                        onChange={(e) => {
                          const updated = [...businessHours];
                          updated[idx].endTime = e.target.value;
                          setBusinessHours(updated);
                        }}
                        className="px-2 py-1 rounded border border-zinc-200 text-xs"
                      />
                    </div>
                  ) : (
                    <span className="text-zinc-400 font-mono text-[11px] italic">
                      Fechado
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            ETAPA 7: EXPERIÊNCIA DE AGENDAMENTO (Aprovação & Garantia)
        ===================================================================== */}
        {step === 7 && (
          <div className="max-w-2xl w-full mx-auto px-6 py-8 sm:py-12 flex-1 space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                Configurar agendamento · Etapa 3 de 4
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                Experiência de agendamento online dos clientes
              </h1>
            </div>

            {/* Approval Setting */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider font-mono text-zinc-900">
                Deseja aprovar automaticamente os agendamentos online?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAutoApprove(true)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    autoApprove
                      ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <p className="font-bold text-xs text-zinc-900">Sempre aprovar</p>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    Todos os agendamentos serão confirmados automaticamente na agenda.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setAutoApprove(false)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    !autoApprove
                      ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <p className="font-bold text-xs text-zinc-900">Aprovação manual</p>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    Você aprova cada solicitação antes de fixar o horário na agenda.
                  </p>
                </button>
              </div>
            </div>

            {/* Booking Guarantee Setting */}
            <div className="space-y-3 pt-4 border-t border-zinc-200">
              <label className="block text-xs font-bold uppercase tracking-wider font-mono text-zinc-900">
                Exigir garantia ou cartão ao agendar online?
              </label>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setBookingGuarantee("pix_deposit")}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-start justify-between ${
                    bookingGuarantee === "pix_deposit"
                      ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs text-zinc-900">
                        Sinal Pix Obrigatório Anti-No-Show
                      </p>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                        <span>Recomendado</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-1">
                      O cliente paga uma taxa de sinal (30%) via Pix Dinâmico no ato para blindar o horário contra faltas.
                    </p>
                  </div>
                  {bookingGuarantee === "pix_deposit" && (
                    <Check className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setBookingGuarantee("card_on_file")}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-start justify-between ${
                    bookingGuarantee === "card_on_file"
                      ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div>
                    <p className="font-bold text-xs text-zinc-900">
                      Cartão obrigatório para todos os clientes
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-1">
                      O cliente cadastra o cartão para agendar. A cobrança é realizada apenas no checkout do atendimento.
                    </p>
                  </div>
                  {bookingGuarantee === "card_on_file" && (
                    <Check className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setBookingGuarantee("none")}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-start justify-between ${
                    bookingGuarantee === "none"
                      ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div>
                    <p className="font-bold text-xs text-zinc-900">
                      Sem exigência prévia (Agendamento livre)
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-1">
                      Qualquer cliente pode agendar sem fornecer cartão ou sinal.
                    </p>
                  </div>
                  {bookingGuarantee === "none" && (
                    <Check className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            ETAPA 8: ADICIONAR SERVIÇOS & SUGESTÕES IA
        ===================================================================== */}
        {step === 8 && (
          <div className="max-w-2xl w-full mx-auto px-6 py-8 sm:py-12 flex-1 space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                Configurar agendamento · Etapa 4 de 4
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                Quase lá, adicione seus serviços
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Assim que seus serviços forem salvos, eles aparecerão no menu do seu site para os clientes agendarem.
              </p>
            </div>

            {/* AI Suggested Services */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-900">
                    Serviços sugeridos por IA para você
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Adicione serviços personalizados para o seu perfil.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateAi}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-zinc-500" />
                  <span>Regenerar</span>
                </button>
              </div>

              <div className="space-y-2">
                {aiSuggestions.map((srv) => {
                  const isAdded = addedAiIds.includes(srv.id);
                  return (
                    <div
                      key={srv.id}
                      className="p-3.5 rounded-xl border border-zinc-200 bg-white flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-xs text-zinc-900">
                          {srv.name}
                        </p>
                        <p className="text-[11px] font-mono text-zinc-500">
                          {srv.durationMin} min • R$ {(srv.priceCents / 100).toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleAddAiService(srv)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isAdded
                            ? "bg-zinc-100 text-zinc-400 cursor-default"
                            : "bg-[#18181B] text-white hover:bg-black"
                        }`}
                      >
                        {isAdded ? (
                          <span className="inline-flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Adicionado
                          </span>
                        ) : (
                          "+ Adicionar"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Added Services List */}
            <div className="pt-4 border-t border-zinc-200 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-900">
                Serviços no catálogo ({state.services.length})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 divide-y divide-zinc-100">
                {state.services.slice(0, 4).map((s) => (
                  <div key={s.id} className="pt-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800">{s.name}</span>
                    <span className="font-mono text-zinc-500">
                      {s.durationMinutes} min • R$ {(s.priceCents / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* or Create my own services */}
            <div className="pt-3 border-t border-zinc-200 text-center space-y-1">
              <span className="text-xs text-zinc-400">ou</span>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToCatalog) {
                      onNavigateToCatalog();
                    } else {
                      onClose();
                    }
                  }}
                  className="text-xs font-semibold text-zinc-900 underline hover:text-black transition-colors"
                >
                  Criar meus próprios serviços
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                Você será direcionado à página de serviços para cadastrar itens e categorias personalizadas.
              </p>
            </div>
          </div>
        )}

        {/* =====================================================================
            ETAPA 9: CONFIGURAR PAGAMENTOS — TAXAS E VANTAGENS
        ===================================================================== */}
        {step === 9 && (
          <div className="max-w-6xl w-full mx-auto px-6 py-8 sm:py-12 flex-1 flex flex-col lg:flex-row items-center gap-10">
            {/* Left Column: Benefits */}
            <div className="w-full lg:w-6/12 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                  Configurar pagamentos
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                  Economize com as menores taxas do mercado
                </h1>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Receba via Pix Dinâmico e cartões com repasse ágil para sua conta. Aceite crédito, débito, pagamentos por aproximação e garanta seu faturamento com sinal anti-no-show.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-100 text-zinc-900 shrink-0 mt-0.5">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-zinc-900">
                      Processamento transparente e baixo custo
                    </p>
                    <p className="text-xs text-zinc-600">
                      Mais dinheiro no seu bolso a cada atendimento, em todos os planos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-100 text-zinc-900 shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-zinc-900">
                      Receba na sua conta com agilidade
                    </p>
                    <p className="text-xs text-zinc-600">
                      Pix instantâneo e repasses programados direto na sua conta bancária.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-100 text-zinc-900 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-zinc-900">
                      Proteção contra faltas (No-Show)
                    </p>
                    <p className="text-xs text-zinc-600">
                      Com sinal prévio obrigatório e taxas de cancelamento configuráveis.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Terminal Mockup */}
            <div className="w-full lg:w-6/12 flex justify-center">
              <div className="w-64 h-[380px] rounded-3xl bg-zinc-900 p-4 text-white shadow-2xl flex flex-col justify-between border-4 border-zinc-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>LUVEA POS</span>
                  <QrCode className="w-4 h-4 text-white" />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-[11px] font-mono text-zinc-400">Total a pagar</span>
                  <p className="text-3xl font-mono font-bold text-white">R$ 170,00</p>
                  <p className="text-[10px] text-zinc-400">Aproxime cartão ou leia o Pix</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Cartão</span>
                    <span>•••• 4678</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Sinal Pix</span>
                    <span className="text-emerald-500 font-medium text-xs inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Confirmado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            ETAPA 10: CONTA DE REPASSE (Chave Pix & Conta Bancária)
        ===================================================================== */}
        {step === 10 && (
          <div className="max-w-2xl w-full mx-auto px-6 py-8 sm:py-12 flex-1 space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                Configurar pagamentos · Etapa 2 de 3
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                Adicione sua conta de repasse
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Repassaremos todos os seus ganhos das cobranças online e da Venda Rápida para esta conta.
              </p>
            </div>

            {/* Toggle Method: Chave Pix vs Conta Bancária */}
            <div className="inline-flex items-center p-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setPayoutMethod("pix_key")}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  payoutMethod === "pix_key"
                    ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Chave Pix (Padrão Brasil)
              </button>
              <button
                type="button"
                onClick={() => setPayoutMethod("bank_account")}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  payoutMethod === "bank_account"
                    ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Conta bancária
              </button>
            </div>

            {payoutMethod === "pix_key" ? (
              <div className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-700">
                    Tipo de Chave Pix
                  </label>
                  <select
                    value={pixKeyType}
                    onChange={(e: any) => setPixKeyType(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900 bg-white"
                  >
                    <option value="email">E-mail</option>
                    <option value="cpf_cnpj">CPF / CNPJ</option>
                    <option value="phone">Celular</option>
                    <option value="random">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-700">
                    Chave Pix
                  </label>
                  <input
                    type="text"
                    value={pixKeyValue}
                    onChange={(e) => setPixKeyValue(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900"
                    placeholder="pix@luveastudio.app"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-700">
                    Banco de Destino
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
                    placeholder="Ex: Nubank, Itaú, Bradesco, Inter"
                  />
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-700">
                    Instituição Bancária
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
                    placeholder="Ex: Banco Itaú S.A."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-700">
                      Agência
                    </label>
                    <input
                      type="text"
                      value={routingOrAgency}
                      onChange={(e) => setRoutingOrAgency(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900"
                      placeholder="0001"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-700">
                      Conta Corrente com Dígito
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900"
                      placeholder="1234567-8"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            ETAPA 11: VERIFICAÇÃO DE IDENTIDADE
        ===================================================================== */}
        {step === 11 && (
          <div className="max-w-2xl w-full mx-auto px-6 py-8 sm:py-12 flex-1 space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                Configurar pagamentos · Etapa 3 de 3
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                Verifique sua identidade
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Para receber pagamentos e transferências pela LUVEA, você deve validar sua identidade para cumprir com as regulamentações financeiras do Banco Central e dos gateways parceiros (Mercado Pago / Stripe).
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-4">
              <div className="border-l-2 border-zinc-900 bg-zinc-50 pl-4 py-2.5 space-y-1.5 text-xs">
                <p className="font-semibold text-zinc-900">
                  Certifique-se de que seus dados correspondam à conta cadastrada:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-zinc-600">
                  <li>Seus dados devem corresponder exatamente à conta bancária para evitar atrasos em repasses.</li>
                  <li>Seus dados impactam a emissão e relatórios fiscais do seu estúdio.</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => handleSavePayments(true)}
                  className="px-6 py-2.5 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-black transition-colors"
                >
                  Concluir verificação agora
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePayments(false)}
                  className="px-6 py-2.5 rounded-full border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Verificar mais tarde
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      {step !== 4 && (
        <footer className="w-full border-t border-zinc-200 px-6 sm:px-10 py-4 bg-white flex flex-col gap-3">
          {/* Progress Indicators */}
          <div className="w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 sm:gap-1.5 flex-1 max-w-[200px] sm:max-w-[400px]">
              {[1, 2, 3, 5, 6, 7, 8, 9, 10, 11].map((st) => (
                <div
                  key={st}
                  className={`h-1 flex-1 min-w-[8px] rounded-full transition-colors ${
                    step >= st ? "bg-[#1C1C1E]" : "bg-[#E5E5EA]"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-[#6E6E73] shrink-0">
              Etapa {step > 4 ? step - 1 : step} de 10
            </span>
          </div>

          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className={`px-4 py-2 rounded-full border border-zinc-200 text-xs font-medium transition-colors ${
                step === 1
                  ? "opacity-40 cursor-not-allowed text-zinc-400"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              Voltar
            </button>

            {/* Right Buttons */}
            <div className="flex items-center gap-3">
              {step === 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 font-medium"
                  >
                    Alterar depois
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateWebsiteConfigOnly();
                      setStep(2);
                    }}
                    className="px-5 py-2 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-black transition-colors"
                  >
                    Avançar
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 font-medium"
                  >
                    Escolher depois
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateWebsiteConfigOnly();
                      setStep(3);
                    }}
                    className="px-5 py-2 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-black transition-colors"
                  >
                    Avançar
                  </button>
                </>
              )}

              {step === 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 font-medium"
                  >
                    Alterar depois
                  </button>
                  <button
                    type="button"
                    onClick={handleClaimSubdomain}
                    className="px-5 py-2 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-black transition-colors shadow-xs"
                  >
                    Reivindicar URL
                  </button>
                </>
              )}

              {step === 5 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(6)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 font-medium"
                  >
                    Pular esta etapa
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(6)}
                    className="px-5 py-2 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-black transition-colors"
                  >
                    Avançar
                  </button>
                </>
              )}

              {step === 6 && (
                <button
                  type="button"
                  onClick={() => setStep(7)}
                  className="px-5 py-2 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-black transition-colors"
                >
                  Avançar
                </button>
              )}

              {step === 7 && (
                <button
                  type="button"
                  onClick={() => setStep(8)}
                  className="px-5 py-2 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-black transition-colors"
                >
                  Avançar
                </button>
              )}

              {step === 8 && (
                <button
                  type="button"
                  onClick={handleSaveBookingSettings}
                  className="px-5 py-2 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-black transition-colors"
                >
                  Avançar para Pagamentos
                </button>
              )}

              {step === 9 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(10)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 font-medium"
                  >
                    Pular esta etapa
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(10)}
                    className="px-5 py-2 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-black transition-colors"
                  >
                    Avançar
                  </button>
                </>
              )}

              {step === 10 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(11)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 font-medium"
                  >
                    Pular esta etapa
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(11)}
                    className="px-5 py-2 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-black transition-colors"
                  >
                    Avançar
                  </button>
                </>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

// =============================================================================
// SUBCOMPONENTE: MOCKUP DE NAVEGADOR COM PREVIEW AO VIVO
// =============================================================================

function BrowserMockup({
  url,
  device = "desktop",
  theme = "classic",
  businessName,
}: {
  url: string;
  device?: "desktop" | "mobile";
  theme?: BookingSiteThemeId;
  businessName: string;
}) {
  const t = THEME_DEFINITIONS[theme] ?? THEME_DEFINITIONS.classic;

  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden flex flex-col transition-all duration-300 ${
        device === "mobile" ? "w-[280px] h-[480px]" : "w-full max-w-[540px] h-[340px]"
      }`}
    >
      {/* Browser Window Header */}
      <div className="bg-zinc-100 px-3.5 py-2 border-b border-zinc-200 flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
        </div>
        <div className="flex-1 max-w-[320px] mx-auto bg-white rounded-full px-3 py-0.5 text-[10px] font-mono text-zinc-600 text-center truncate border border-zinc-200">
          https://{url}/
        </div>
      </div>

      {/* Website Live Canvas */}
      <div
        className={`flex-1 flex flex-col justify-between p-6 transition-all ${t.bgStyle} ${t.textStyle}`}
      >
        {/* Navigation Mockup */}
        <div className="flex items-center justify-between text-[9px] uppercase tracking-wider font-mono opacity-80 border-b border-white/10 pb-2">
          <span>{businessName || "LUVEA STUDIO"}</span>
          <div className="hidden sm:flex items-center gap-2">
            <span>Serviços</span>
            <span>Sobre</span>
            <span>Contato</span>
          </div>
        </div>

        {/* Hero Section Banner */}
        <div className="text-center space-y-2 py-4">
          <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight">
            {businessName || "Luvea Studio"}
          </h2>
          <p className="text-[10px] font-mono opacity-70 uppercase tracking-widest">
            {t.name} Edition · Agendamento Online
          </p>
          <div className="pt-2">
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-[10px] uppercase font-mono font-semibold tracking-wider border ${t.accentStyle}`}
            >
              Agendar Horário
            </span>
          </div>
        </div>

        {/* Footer Mockup */}
        <div className="flex items-center justify-between text-[8px] font-mono opacity-60 pt-2 border-t border-white/10">
          <span>{url}</span>
          <span>Powered by LUVEA</span>
        </div>
      </div>
    </div>
  );
}
