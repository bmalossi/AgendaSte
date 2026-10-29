"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Clock,
  Bell,
  CreditCard,
  Wallet,
  ShieldCheck,
  Gift,
  MapPin,
  Building2,
  Copy,
  Check,
  Sliders,
  Eye,
  Edit3,
  X,
  User,
  Users,
  CreditCard as SubscriptionIcon,
  MessageSquare,
  Sparkles,
  FileText,
  Smartphone,
  ExternalLink,
  Percent,
  CheckCircle2,
  Info,
  ChevronRight,
  AlertCircle,
  LogOut,
  Sun,
  Moon,
  Lock,
  Tv,
} from "lucide-react";
import { useAppTheme } from "@/lib/theme";
import { PLANS_CATALOG } from "@/lib/marketing-content";
import { TvKioskSettingsSection } from "@/components/agendaste/tv-kiosk-settings-section";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import type {
  StudioState,
  WebsiteBookingSetupConfig,
  WebsiteTrackingConfig,
  SocialAccountsConfig,
  WebsiteContentSettings,
  BookingControlsConfig,
  ClientNotificationItem,
  DayBusinessHours,
  CheckoutSettingsConfig,
  ChartingSettingsConfig,
} from "@/lib/agendaste-store";
import {
  updateWebsiteSetupConfig,
  updateStudioSettings,
  getDefaultWebsiteBookingConfig,
  getDefaultBookingControls,
  getDefaultClientNotifications,
  getDefaultCheckoutSettings,
  getDefaultChartingSettings,
  getBookingSiteUrl,
} from "@/lib/agendaste-store";
import { WhatsAppConfigCard } from "@/components/agendaste/whatsapp-config-card";
import { signOutUser } from "@/lib/supabase/client";

interface SettingsViewProps {
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
  initialTab?: string;
  initialSubTab?: string;
}

type TopTabId = "business" | "personal" | "staff" | "whatsapp" | "subscription" | "tv_kiosk";
type BusinessSubTabId =
  | "business_details"
  | "locations"
  | "website"
  | "booking_controls"
  | "client_notifications"
  | "card_reader"
  | "payout_account"
  | "hipaa"
  | "charting"
  | "gift_cards";

export function SettingsView({
  state,
  onUpdateState,
  initialTab = "business",
  initialSubTab = "client_notifications",
}: SettingsViewProps) {
  const { theme, setTheme } = useAppTheme();
  const [initialTvCode, setInitialTvCode] = useState("");

  // Aba Superior
  const [topTab, setTopTab] = useState<TopTabId>(() => {
    if (initialTab && ["personal", "staff", "business", "subscription", "whatsapp", "tv_kiosk"].includes(initialTab)) {
      return initialTab as TopTabId;
    }
    return "business";
  });

  // Deep-link para pareamento de TV via URL (?action=pair-tv&code=892437)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const action = searchParams.get("action");
        const codeParam = searchParams.get("code");
        if (action === "pair-tv") {
          setTopTab("tv_kiosk");
          if (codeParam) {
            setInitialTvCode(codeParam);
          }
        }
      } catch (err) {
        console.warn("[Settings Deep-link]", err);
      }
    }
  }, []);

  // Sub-aba lateral de Negócio
  const [subTab, setSubTab] = useState<BusinessSubTabId>(() => {
    if (
      initialSubTab &&
      [
        "business_details",
        "locations",
        "website",
        "booking_controls",
        "client_notifications",
        "card_reader",
        "payout_account",
        "hipaa",
        "charting",
        "gift_cards",
      ].includes(initialSubTab)
    ) {
      return initialSubTab as BusinessSubTabId;
    }
    return "client_notifications";
  });

  // Sincroniza aba quando fornecida externamente via navegação
  useEffect(() => {
    if (initialTab && ["personal", "staff", "business", "subscription", "whatsapp", "tv_kiosk"].includes(initialTab)) {
      setTopTab(initialTab as TopTabId);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab as BusinessSubTabId);
    }
  }, [initialSubTab]);

  // Ciclo selecionado para visualização de planos (mensal vs anual)
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "yearly">(() => {
    return state.onboarding?.billingCycle === "yearly" ? "yearly" : "monthly";
  });

  // Configuração Base
  const initialWebsite =
    state.settings.website ?? getDefaultWebsiteBookingConfig(state.settings.business.businessName);

  // Estados - Site & Rastreamento
  const [subdomainSlug, setSubdomainSlug] = useState(initialWebsite.subdomainSlug);
  const [aboutYourBusiness, setAboutYourBusiness] = useState(
    initialWebsite.aboutYourBusiness ??
      "Espaço de beleza e bem-estar especializado em tratamentos personalizados, estética avançada e cuidados com a saúde capilar."
  );
  const [heroImageUrl, setHeroImageUrl] = useState(
    initialWebsite.heroImageUrl ??
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"
  );
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountsConfig>(
    initialWebsite.socialAccounts ?? {
      instagram: "@luveastudio",
      facebook: "",
      twitter: "",
      pinterest: "",
      yelp: "",
      website: "https://luvea.app",
    }
  );
  const [contentSettings, setContentSettings] = useState<WebsiteContentSettings>(
    initialWebsite.contentSettings ?? {
      showReviews: true,
      showPortfolioGallery: true,
      displayServicesVisually: true,
      showTeam: true,
    }
  );
  const [tracking, setTracking] = useState<WebsiteTrackingConfig>(
    initialWebsite.tracking ?? {
      googleAnalyticsId: "",
      metaPixelId: "",
      enabled: false,
    }
  );

  // Estados - Controles de Agendamento
  const [bookingControls, setBookingControls] = useState<BookingControlsConfig>(
    initialWebsite.bookingControls ?? getDefaultBookingControls()
  );

  // Estados - Notificações de Clientes
  const [notificationsConfig, setNotificationsConfig] = useState(
    initialWebsite.clientNotifications ?? getDefaultClientNotifications()
  );

  // Estados - Cobrança & Checkout (Card Reader, BNPL, Taxas & Impostos)
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSettingsConfig>(
    initialWebsite.checkoutSettings ?? getDefaultCheckoutSettings()
  );

  // Estados - Prontuários (Charting & Assinaturas)
  const [chartingSettings, setChartingSettings] = useState<ChartingSettingsConfig>(
    initialWebsite.chartingSettings ?? getDefaultChartingSettings()
  );

  // Estados - Conta de Repasse & Verificação (Payout & Identity Verification)
  const [paymentsSetup, setPaymentsSetup] = useState(
    initialWebsite.paymentsSetup ?? {
      payoutMethod: "pix_key" as const,
      pixKeyType: "email" as const,
      pixKeyValue: "pix@luveastudio.app",
      bankName: "Nu Pagamentos S.A. (Nubank)",
      routingOrAgency: "0001",
      accountNumber: "1234567-8",
      debitCardLast4: "4678",
      identityVerified: false,
      setupCompleted: false,
    }
  );

  // Modais de Edição para Checkout e Payout
  const [activeTaxModal, setActiveTaxModal] = useState<"platform_fee" | "service_tax" | "retail_tax" | null>(null);
  const [activePayoutModal, setActivePayoutModal] = useState<"payout_account" | "identity_verification" | "processing_info" | null>(null);

  // Valores temporários dos modais de taxas
  const [tempFeePayer, setTempFeePayer] = useState<"studio" | "client">(
    initialWebsite.checkoutSettings?.technologyFeePayer ?? "studio"
  );
  const [tempServiceTax, setTempServiceTax] = useState<string>(
    String(initialWebsite.checkoutSettings?.serviceSalesTaxPercent ?? 0)
  );
  const [tempRetailTax, setTempRetailTax] = useState<string>(
    String(initialWebsite.checkoutSettings?.retailSalesTaxPercent ?? 0)
  );

  // Estados - Negócio & Localização
  const [businessName, setBusinessName] = useState(state.settings.business.businessName || "Luvea Studio");
  const [legalEntityType, setLegalEntityType] = useState(
    state.settings.business.legalEntityType || "Sociedade Limitada (LTDA) / Salão Parceiro"
  );
  const [taxIdCnpjCpf, setTaxIdCnpjCpf] = useState(state.settings.business.taxIdCnpjCpf || "48.192.301/0001-82");
  const [pixKey, setPixKey] = useState(state.settings.business.pixKey || "pix@luveastudio.app");
  const [defaultDepositPercent, setDefaultDepositPercent] = useState(
    String(state.settings.business.defaultDepositPercent ?? 30)
  );

  // Campos temporários para Verificação de Identidade (KYC)
  const [idLegalName, setIdLegalName] = useState(state.settings.business.businessName || "Luvea Studio");
  const [idCnpjCpf, setIdCnpjCpf] = useState(state.settings.business.taxIdCnpjCpf || "48.192.301/0001-82");
  const [idRepName, setIdRepName] = useState(
    `${state.settings.personal.firstName} ${state.settings.personal.lastName}`.trim() || "Bruno Fernandes Malossi"
  );
  const [idRepCpf, setIdRepCpf] = useState("389.201.948-12");

  // Campos temporários para Conta de Repasse
  const [bankNameInput, setBankNameInput] = useState(paymentsSetup.bankName || "Nu Pagamentos S.A. (Nubank)");
  const [bankAgencyInput, setBankAgencyInput] = useState(paymentsSetup.routingOrAgency || "0001");
  const [bankAccountInput, setBankAccountInput] = useState(paymentsSetup.accountNumber || "1234567-8");
  const [pixKeyValueInput, setPixKeyValueInput] = useState(paymentsSetup.pixKeyValue || state.settings.business.pixKey || "pix@luveastudio.app");
  const [payoutMethodInput, setPayoutMethodInput] = useState<"pix_key" | "bank_account">(
    paymentsSetup.payoutMethod === "bank_account" ? "bank_account" : "pix_key"
  );

  const [hasFixedAddress, setHasFixedAddress] = useState(initialWebsite.hasFixedAddress ?? true);
  const [doesHouseCalls, setDoesHouseCalls] = useState(initialWebsite.doesHouseCalls ?? false);
  const [addressLine1, setAddressLine1] = useState(initialWebsite.addressLine1 ?? "Rua Mateus Cipullo, 49 casa 7");
  const [addressLine2, setAddressLine2] = useState(initialWebsite.addressLine2 ?? "");
  const [city, setCity] = useState(initialWebsite.city ?? "Praia Grande");
  const [stateUF, setStateUF] = useState(initialWebsite.state ?? "SP");
  const [zipCode, setZipCode] = useState(initialWebsite.zipCode ?? "11724-000");
  const [businessHours, setBusinessHours] = useState<DayBusinessHours[]>(
    initialWebsite.businessHours ?? getDefaultWebsiteBookingConfig().businessHours
  );

  // Dados Pessoais
  const [personalFirst, setPersonalFirst] = useState(state.settings.personal.firstName);
  const [personalLast, setPersonalLast] = useState(state.settings.personal.lastName);
  const [personalEmail, setPersonalEmail] = useState(state.settings.personal.email);
  const [personalPhone, setPersonalPhone] = useState(state.settings.personal.phone);

  // Estados de Interface
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewNotification, setPreviewNotification] = useState<ClientNotificationItem | null>(null);
  const [editNotification, setEditNotification] = useState<ClientNotificationItem | null>(null);
  const [notificationPreviewChannel, setNotificationPreviewChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const fullBookingUrl = `https://${subdomainSlug || "luveastudio"}.luvea.app`;
  const bookingSiteOpenUrl = getBookingSiteUrl(subdomainSlug);
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullBookingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    onUpdateState((prev) => {
      const updatedWeb = updateWebsiteSetupConfig(prev, {
        subdomainSlug,
        aboutYourBusiness,
        heroImageUrl,
        socialAccounts,
        contentSettings,
        tracking,
        bookingControls,
        clientNotifications: notificationsConfig,
        checkoutSettings,
        chartingSettings,
        paymentsSetup,
        hasFixedAddress,
        doesHouseCalls,
        addressLine1,
        addressLine2,
        city,
        state: stateUF,
        zipCode,
        businessHours,
        autoApproveAppointments: bookingControls.autoApproveMode === "always",
        onlineBookingGuarantee:
          bookingControls.requireCardOnFile === "none"
            ? "none"
            : bookingControls.requireCardOnFile === "new_clients"
            ? "pix_deposit"
            : "pix_deposit",
      });

      const updated = updateStudioSettings(updatedWeb, {
        firstName: personalFirst,
        lastName: personalLast,
        email: personalEmail,
        phone: personalPhone,
        businessName,
        legalEntityType,
        taxIdCnpjCpf,
        pixKey: paymentsSetup.pixKeyValue || pixKey,
        defaultDepositPercent: Math.min(100, Math.max(0, parseInt(defaultDepositPercent || "30", 10))),
      });

      return {
        ...updated,
        lastToastMessage: "Configurações salvas com sucesso!",
      };
    });

    setTimeout(() => {
      setIsSaving(false);
      setSaveToast("Configurações salvas");
      setTimeout(() => setSaveToast(null), 2500);
    }, 350);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans text-[#1C1C1E]">
      {/* Toast de Confirmação Flutuante */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[12.5px] font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5EA] pb-5">
        <div>
          <h1 className="text-[26px] sm:text-[30px] font-serif font-normal tracking-tight text-[#1C1C1E]">
            Configurações
          </h1>
          <p className="text-[13px] text-[#6E6E73] mt-0.5">
            Gerenciamento geral do estúdio, regras de agendamento online, rastreamento e notificações.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium shadow-sm hover:bg-[#2C2C2E] active:scale-[0.98] transition-all disabled:opacity-50 shrink-0"
        >
          {isSaving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      {/* Abas Superiores Principais */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#E5E5EA]">
        {[
          { id: "business" as const, label: "Negócio", icon: Building2 },
          { id: "personal" as const, label: "Pessoal", icon: User },
          { id: "staff" as const, label: "Equipe", icon: Users },
          { id: "whatsapp" as const, label: "WhatsApp & Automação", icon: MessageSquare },
          { id: "tv_kiosk" as const, label: "LUVEA TV", icon: Tv },
          { id: "subscription" as const, label: "Plano & Assinatura", icon: SubscriptionIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = topTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTopTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-colors shrink-0 ${
                isActive
                  ? "bg-[#1C1C1E] text-white shadow-sm"
                  : "bg-transparent text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: NEGÓCIO (Painel colado à esquerda, sem recuo / sem gap, zero caixas aninhadas) */}
      {topTab === "business" && (
        <div className="bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[700px]">
          {/* Menu Lateral Esquerdo Colado (Sem recuo) */}
          <aside className="w-full md:w-64 lg:w-72 border-b md:border-b-0 md:border-r border-[#E5E5EA] dark:border-[#27272a] bg-[#FBFBFC] dark:bg-[#18181b] p-3 space-y-1 shrink-0">
            {[
              { id: "business_details" as const, label: "Dados do Negócio", icon: Building2 },
              { id: "locations" as const, label: "Unidades & Locais", icon: MapPin, count: 1 },
              { id: "website" as const, label: "Site de Agendamento", icon: Globe },
              { id: "booking_controls" as const, label: "Regras de Agendamento", icon: Sliders },
              { id: "client_notifications" as const, label: "Notificações de Clientes", icon: Bell },
              { id: "card_reader" as const, label: "Cobrança & Checkout", icon: CreditCard },
              { id: "payout_account" as const, label: "Conta de Repasse & Verificação", icon: Wallet },
              { id: "hipaa" as const, label: "Conformidade LGPD", icon: ShieldCheck, tag: "LGPD" },
              { id: "charting" as const, label: "Prontuários & Fichas", icon: FileText, tag: "Avançado" },
              { id: "gift_cards" as const, label: "Vales-Presente", icon: Gift },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = subTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSubTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors text-left ${
                    isActive
                      ? "bg-[#1C1C1E] dark:bg-[#27272a] text-white shadow-sm"
                      : "text-[#52525B] dark:text-[#a1a1aa] hover:text-[#18181B] dark:hover:text-white hover:bg-white dark:hover:bg-[#27272a]"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#71717A] dark:text-[#a1a1aa]"}`} />
                    <span className="truncate">{item.label}</span>
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {item.count !== undefined && (
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[#E4E4E7] dark:bg-[#27272a] text-[#3F3F46] dark:text-[#a1a1aa]"
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                    {item.tag && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[#E4E4E7] dark:bg-[#27272a] text-[#52525B] dark:text-[#a1a1aa]"
                        }`}
                      >
                        {item.tag}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Painel de Conteúdo Principal (Diretamente adjacente, sem caixas aninhadas) */}
          <main className="flex-1 p-6 lg:p-8 bg-white dark:bg-[#18181b]">
            {/* ========================================================================= */}
            {/* 1. NOTIFICAÇÕES DE CLIENTES (Sem caixas aninhadas, lista editorial)        */}
            {/* ========================================================================= */}
            {subTab === "client_notifications" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Notificações de Clientes</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Personalize as confirmações, lembretes e avisos automáticos enviados aos clientes antes e depois de
                    cada atendimento.
                  </p>
                  <p className="text-[11.5px] text-[#8E8E93] mt-2">
                    Os dados clínicos e prontuários permanecem sigilosos e protegidos pela LGPD.
                  </p>
                </div>

                {/* Notificações Pré-Atendimento */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Notificações Pré-Atendimento</h3>
                    <p className="text-[12px] text-[#6E6E73]">
                      Lembretes e confirmações automáticos disparados antes da data marcada.
                    </p>
                  </div>

                  <div className="divide-y divide-[#F2F2F7] border-y border-[#F2F2F7]">
                    {notificationsConfig.items
                      .filter((item) => item.category === "pre_appointment")
                      .map((notif) => {
                        // Tradução de títulos e descrições para PT-BR limpo
                        const titleMap: Record<string, string> = {
                          "Confirmation notification": "Confirmação de Agendamento",
                          "Reminder notification": "Lembrete de Horário",
                          "New booking alert": "Aviso de Nova Reserva",
                          "Cancellation alert": "Aviso de Cancelamento",
                          "Declined alert": "Aviso de Solicitação Recusada",
                          "Reschedule alert": "Aviso de Reagendamento",
                          "Waitlist entry alert": "Confirmação de Lista de Espera",
                          "Waitlist cancellation alert": "Cancelamento de Lista de Espera",
                        };

                        const descMap: Record<string, string> = {
                          "Prompt clients before their appointment to confirm.":
                            "Solicita confirmação ativa do cliente para liberação da agenda.",
                          "Send clients a reminder before their appointment.":
                            "Envia um lembrete com orientações de chegada e tolerância.",
                          "Alert clients if their appointment has been booked.":
                            "Notifica o cliente imediatamente assim que o horário é reservado.",
                          "Alert clients if their appointment needs to be canceled.":
                            "Avisa o cliente caso o agendamento precise ser cancelado.",
                          "Alert clients if their appointment has been declined.":
                            "Comunica com delicadeza quando o horário solicitado não puder ser atendido.",
                          "Alert clients if their appointment has been rescheduled.":
                            "Informa a nova data e horário remarcados com confirmação imediata.",
                          "Alert clients when they enter the waitlist.":
                            "Avisa o cliente que seu pedido de vaga foi registrado na lista de espera.",
                          "Alert clients when they are removed from the waitlist.":
                            "Confirma a remoção do cliente da lista de espera conforme solicitado.",
                        };

                        const timingMap: Record<string, string> = {
                          "72 hours before": "72h antes",
                          "24 hours before": "24h antes",
                          Imediato: "Imediato",
                        };

                        const ptTitle = titleMap[notif.title] || notif.title;
                        const ptDesc = descMap[notif.description] || notif.description;
                        const ptTiming = notif.timingLabel ? timingMap[notif.timingLabel] || notif.timingLabel : "";

                        return (
                          <div
                            key={notif.id}
                            className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#FAFAFA] dark:hover:bg-[#27272a] transition-colors px-2 rounded-xl"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[13.5px] font-medium text-[#1C1C1E] dark:text-white">{ptTitle}</h4>
                                {notif.badge === "novo" && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#ECE9FE] text-[#6D28D9]">
                                    Novo
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">{ptDesc}</p>
                              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#8E8E93] dark:text-[#71717a]">
                                <span>
                                  Envio via:{" "}
                                  <strong className="font-medium text-[#1C1C1E] dark:text-white">
                                    {notif.channels
                                      .map((c) => (c === "whatsapp" ? "WhatsApp" : c === "email" ? "E-mail" : "SMS"))
                                      .join(" e ")}
                                  </strong>
                                </span>
                                {ptTiming && <span>• {ptTiming}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditNotification(notif)}
                                className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] text-[12px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
                              >
                                Personalizar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewNotification(notif);
                                  setNotificationPreviewChannel(
                                    notif.channels.includes("whatsapp") ? "whatsapp" : "email"
                                  );
                                }}
                                className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] text-[12px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#E5E5EA] dark:hover:bg-[#3f3f46] transition inline-flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Prévia</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Notificações Pós-Atendimento */}
                <div className="space-y-4 pt-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Notificações Pós-Atendimento</h3>
                    <p className="text-[12px] text-[#6E6E73]">
                      Lembretes pós-serviço, solicitações de avaliação e mensagens de fidelização.
                    </p>
                  </div>

                  {/* Avaliação Google Reviews - Linha Limpa sem banner */}
                  <div className="py-4 border-t border-[#F2F2F7] space-y-2">
                    <div>
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Pedido de Avaliação no Google</h4>
                      <p className="text-[12px] text-[#6E6E73]">
                        Insere automaticamente o link do seu Google Meu Negócio nos comprovantes e mensagens pós-atendimento.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 max-w-xl">
                      <input
                        type="text"
                        value={notificationsConfig.googleReviewLink}
                        onChange={(e) =>
                          setNotificationsConfig({ ...notificationsConfig, googleReviewLink: e.target.value })
                        }
                        placeholder="https://g.page/r/seuestudio/review"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleSaveAll();
                          setSaveToast("Link do Google salvo");
                        }}
                        className="px-4 py-2 rounded-xl bg-[#1C1C1E] text-white text-[12.5px] font-medium hover:bg-[#2C2C2E] transition shrink-0"
                      >
                        Salvar link
                      </button>
                    </div>
                  </div>

                  {/* Demais Notificações Pós-Atendimento */}
                  <div className="divide-y divide-[#F2F2F7] border-y border-[#F2F2F7]">
                    {notificationsConfig.items
                      .filter((item) => item.category === "post_appointment" && item.id !== "post-review")
                      .map((notif) => {
                        const titleMap: Record<string, string> = {
                          "Thank you note": "Mensagem de Agradecimento",
                          "Rebooking notification": "Lembrete de Retorno & Fidelização",
                          "Birthday message": "Felicitações de Aniversário",
                        };
                        const descMap: Record<string, string> = {
                          "Send a thank you note automatically after an appointment.":
                            "Envia uma mensagem acolhedora após o fechamento da comanda.",
                          "Remind clients to book future appointments.":
                            "Convida o cliente a renovar seu procedimento para manter os resultados impecáveis.",
                          "Send clients a thoughtful message on their birthday.":
                            "Dispara uma mensagem carinhosa e cortesia especial no dia do aniversário do cliente.",
                        };
                        const ptTitle = titleMap[notif.title] || notif.title;
                        const ptDesc = descMap[notif.description] || notif.description;

                        return (
                          <div
                            key={notif.id}
                            className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#FAFAFA] dark:hover:bg-[#27272a] transition-colors px-2 rounded-xl"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[13.5px] font-medium text-[#1C1C1E] dark:text-white">{ptTitle}</h4>
                                {notif.badge === "gold" && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#FBF8EF] dark:bg-[#27272a] border border-[#F3E8C4] dark:border-[#3f3f46] text-[#8C6D1F] dark:text-[#f4f4f5]">
                                    Gold
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">{ptDesc}</p>
                              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#8E8E93] dark:text-[#71717a]">
                                <span>
                                  Envio via:{" "}
                                  <strong className="font-medium text-[#1C1C1E] dark:text-white">
                                    {notif.channels
                                      .map((c) => (c === "whatsapp" ? "WhatsApp" : c === "email" ? "E-mail" : "SMS"))
                                      .join(" e ")}
                                  </strong>
                                </span>
                                {notif.timingLabel && <span>• {notif.timingLabel}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditNotification(notif)}
                                className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] text-[12px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
                              >
                                Personalizar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewNotification(notif);
                                  setNotificationPreviewChannel(
                                    notif.channels.includes("whatsapp") ? "whatsapp" : "email"
                                  );
                                }}
                                className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] text-[12px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#E5E5EA] dark:hover:bg-[#3f3f46] transition inline-flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Prévia</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. SITE DE AGENDAMENTO (Website & Rastreamento)                            */}
            {/* ========================================================================= */}
            {subTab === "website" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Site de Agendamento</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Visualize e configure a apresentação do seu site público onde seus clientes marcam horários.
                  </p>
                </div>

                {/* Hero Preview */}
                <div className="rounded-2xl border border-[#E5E5EA] overflow-hidden bg-white">
                  <div className="h-44 sm:h-52 relative w-full overflow-hidden bg-zinc-900">
                    <img
                      src={heroImageUrl}
                      alt="Capa do estúdio"
                      className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-[11px] font-mono tracking-widest uppercase opacity-80">Luvea Booking</p>
                      <h3 className="text-xl font-medium tracking-tight">{businessName}</h3>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-[13.5px] text-[#1C1C1E]">{businessName}</p>
                      <a
                        href={bookingSiteOpenUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12.5px] text-[#6E6E73] hover:text-[#1C1C1E] font-mono underline decoration-zinc-300 underline-offset-2"
                      >
                        {fullBookingUrl}
                      </a>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={bookingSiteOpenUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] text-[12px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition"
                      >
                        Abrir site
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] text-[12px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition inline-flex items-center gap-1.5"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? "Copiado!" : "Copiar link"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newUrl = window.prompt("Insira a URL da imagem de capa:", heroImageUrl);
                          if (newUrl) setHeroImageUrl(newUrl);
                        }}
                        className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] text-[12px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition"
                      >
                        Trocar imagem
                      </button>
                    </div>
                  </div>
                </div>

                {/* Link do Agendamento */}
                <div className="space-y-2 pt-2 border-t border-[#F2F2F7]">
                  <label className="block text-[13px] font-semibold text-[#1C1C1E]">Endereço do Site (URL)</label>
                  <p className="text-[12px] text-[#6E6E73]">
                    O identificador exclusivo do seu estúdio dentro do domínio oficial Luvea.
                  </p>
                  <div className="flex items-center rounded-xl border border-[#E5E5EA] bg-white px-3 py-2 max-w-lg focus-within:border-[#1C1C1E] focus-within:ring-1 focus-within:ring-[#1C1C1E]">
                    <span className="text-[13px] text-[#8E8E93] font-mono select-none">https://</span>
                    <input
                      type="text"
                      value={subdomainSlug}
                      onChange={(e) => setSubdomainSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="flex-1 bg-transparent border-0 outline-none px-1 text-[13px] font-mono text-[#1C1C1E]"
                      placeholder="seuestudio"
                    />
                    <span className="text-[13px] text-[#8E8E93] font-mono select-none">.luvea.app</span>
                  </div>
                </div>

                {/* Sobre o Estúdio */}
                <div className="space-y-2 pt-2 border-t border-[#F2F2F7]">
                  <label className="block text-[13px] font-semibold text-[#1C1C1E]">Sobre o seu negócio</label>
                  <p className="text-[12px] text-[#6E6E73]">
                    Apresente seus diferenciais e especialidades para os clientes que acessam seu site.
                  </p>
                  <textarea
                    rows={3}
                    value={aboutYourBusiness}
                    onChange={(e) => setAboutYourBusiness(e.target.value)}
                    placeholder="Descreva seu espaço, filosofia de trabalho e diferenciais..."
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] resize-none"
                  />
                </div>

                {/* Redes Sociais */}
                <div className="space-y-3 pt-2 border-t border-[#F2F2F7]">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Redes Sociais</h3>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      Conecte seus perfis para exibir ícones de contato no rodapé do seu site.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Instagram</label>
                      <input
                        type="text"
                        value={socialAccounts.instagram}
                        onChange={(e) => setSocialAccounts({ ...socialAccounts, instagram: e.target.value })}
                        placeholder="@luveastudio"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Facebook</label>
                      <input
                        type="text"
                        value={socialAccounts.facebook}
                        onChange={(e) => setSocialAccounts({ ...socialAccounts, facebook: e.target.value })}
                        placeholder="facebook.com/seuestudio"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">X / Twitter</label>
                      <input
                        type="text"
                        value={socialAccounts.twitter}
                        onChange={(e) => setSocialAccounts({ ...socialAccounts, twitter: e.target.value })}
                        placeholder="@seuestudio"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Website institucional</label>
                      <input
                        type="text"
                        value={socialAccounts.website}
                        onChange={(e) => setSocialAccounts({ ...socialAccounts, website: e.target.value })}
                        placeholder="https://suaempresa.com.br"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Exibição de Conteúdo */}
                <div className="space-y-4 pt-2 border-t border-[#F2F2F7]">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Exibição de Conteúdo no Site</h3>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      Controle as seções ativas no menu e navegação dos clientes.
                    </p>
                  </div>

                  <div className="divide-y divide-[#F2F2F7]">
                    {[
                      {
                        key: "showReviews" as const,
                        label: "Exibir avaliações de clientes",
                        desc: "Mostra notas e depoimentos no site de agendamento",
                      },
                      {
                        key: "showPortfolioGallery" as const,
                        label: "Exibir galeria de fotos",
                        desc: "Apresenta fotos de trabalhos e antes/depois no site",
                      },
                      {
                        key: "displayServicesVisually" as const,
                        label: "Exibir imagens dos serviços",
                        desc: "Mostra fotos ilustrativas no catálogo de procedimentos",
                      },
                      {
                        key: "showTeam" as const,
                        label: "Exibir equipe de especialistas",
                        desc: "Permite aos clientes escolher e agendar com profissionais específicos",
                      },
                    ].map((row) => (
                      <div key={row.key} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-medium text-[#1C1C1E]">{row.label}</p>
                          <p className="text-[12px] text-[#6E6E73]">{row.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                          <input
                            type="checkbox"
                            checked={contentSettings[row.key]}
                            onChange={(e) =>
                              setContentSettings({ ...contentSettings, [row.key]: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rastreamento & Conversão (Sem banners dentro de banners) */}
                <div className="space-y-4 pt-4 border-t border-[#F2F2F7]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Rastreamento &amp; Métricas</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#1C1C1E] text-white">
                          Platinum
                        </span>
                      </div>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Acompanhe conversões de anúncios e tráfego diretamente no seu site de agendamento.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-medium text-[#1C1C1E]">
                        ID do Google Analytics
                      </label>
                      <p className="text-[11.5px] text-[#6E6E73]">
                        Mapeia visitas e conclusões de agendamento no Google Analytics 4.
                      </p>
                      <input
                        type="text"
                        value={tracking.googleAnalyticsId}
                        onChange={(e) => setTracking({ ...tracking, googleAnalyticsId: e.target.value })}
                        placeholder="G-XXXXXXXXXX"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-mono text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-medium text-[#1C1C1E]">ID do Meta Pixel</label>
                      <p className="text-[11.5px] text-[#6E6E73]">
                        Otimiza campanhas pagas no Instagram e Facebook Ads.
                      </p>
                      <input
                        type="text"
                        value={tracking.metaPixelId}
                        onChange={(e) => setTracking({ ...tracking, metaPixelId: e.target.value })}
                        placeholder="123456789012345"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-mono text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 3. REGRAS DE AGENDAMENTO (Booking Controls)                                */}
            {/* ========================================================================= */}
            {subTab === "booking_controls" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Regras de Agendamento</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Defina o comportamento da agenda online, aprovação de horários, janela de cancelamento e taxas
                    anti-falta.
                  </p>
                </div>

                <div className="divide-y divide-[#F2F2F7]">
                  {/* Aprovação Automática */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Aprovação de Agendamentos</h4>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        {bookingControls.autoApproveMode === "always"
                          ? "Todos os horários escolhidos são confirmados imediatamente na agenda."
                          : "Você recebe cada pedido para aprovar manualmente antes de confirmar."}
                      </p>
                    </div>
                    <div className="w-52 shrink-0">
                      <DropdownSelect
                        value={bookingControls.autoApproveMode}
                        onChange={(val) =>
                          setBookingControls({
                            ...bookingControls,
                            autoApproveMode: val as "always" | "manual",
                          })
                        }
                        options={[
                          { value: "always", label: "Sempre automática" },
                          { value: "manual", label: "Aprovação manual" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Antecedência Mínima */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Antecedência Mínima para Agendar</h4>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Tempo mínimo de aviso prévio que o cliente precisa cumprir para marcar um horário.
                      </p>
                    </div>
                    <div className="w-40 shrink-0">
                      <DropdownSelect
                        value={bookingControls.bookingWindowHours}
                        onChange={(val) =>
                          setBookingControls({
                            ...bookingControls,
                            bookingWindowHours: Number(val),
                          })
                        }
                        options={[
                          { value: 1, label: "1 hora" },
                          { value: 2, label: "2 horas" },
                          { value: 4, label: "4 horas" },
                          { value: 12, label: "12 horas" },
                          { value: 24, label: "24 horas" },
                          { value: 48, label: "48 horas" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Incrementos de Horário */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Divisão dos Intervalos de Horário</h4>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Controla os blocos de horário disponíveis para seleção na agenda e no site.
                      </p>
                    </div>
                    <div className="w-40 shrink-0">
                      <DropdownSelect
                        value={bookingControls.bookingIncrementsMinutes}
                        onChange={(val) =>
                          setBookingControls({
                            ...bookingControls,
                            bookingIncrementsMinutes: Number(val),
                          })
                        }
                        options={[
                          { value: 15, label: "15 minutos" },
                          { value: 30, label: "30 minutos" },
                          { value: 45, label: "45 minutos" },
                          { value: 60, label: "60 minutos" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Preenchimento Inteligente de Lacunas */}
                  <div className="py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">
                            Preenchimento Inteligente de Lacunas
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#ECE9FE] text-[#6D28D9]">
                            Novo
                          </span>
                        </div>
                        <p className="text-[12px] text-[#6E6E73] mt-0.5">
                          Mostra aos clientes apenas horários colados aos agendamentos existentes, evitando janelas
                          ociosas.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input
                          type="checkbox"
                          checked={bookingControls.minimizeSchedulingGaps}
                          onChange={(e) =>
                            setBookingControls({
                              ...bookingControls,
                              minimizeSchedulingGaps: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]" />
                      </label>
                    </div>

                    {bookingControls.minimizeSchedulingGaps && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">
                            Tolerância de Janela
                          </label>
                          <DropdownSelect
                            value={bookingControls.maxGapMinutes}
                            onChange={(val) =>
                              setBookingControls({
                                ...bookingControls,
                                maxGapMinutes: Number(val),
                              })
                            }
                            options={[
                              { value: 15, label: "Até 15 minutos" },
                              { value: 30, label: "Até 30 minutos" },
                              { value: 45, label: "Até 45 minutos" },
                            ]}
                          />
                        </div>
                        <div>
                          <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">
                            Escopo de Profissionais
                          </label>
                          <DropdownSelect
                            value={bookingControls.gapProviderScope}
                            onChange={(val) =>
                              setBookingControls({
                                ...bookingControls,
                                gapProviderScope: val as "all" | "selected",
                              })
                            }
                            options={[
                              { value: "all", label: "Todos os profissionais" },
                              { value: "selected", label: "Profissionais selecionados" },
                            ]}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Garantia de Reserva */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Garantia Obrigatória de Reserva</h4>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Exige sinal via Pix ou pré-autorização de cartão para confirmar o horário do cliente.
                      </p>
                    </div>
                    <div className="w-52 shrink-0">
                      <DropdownSelect
                        value={bookingControls.requireCardOnFile}
                        onChange={(val) =>
                          setBookingControls({
                            ...bookingControls,
                            requireCardOnFile: val as "all" | "new_clients" | "none",
                          })
                        }
                        options={[
                          { value: "all", label: "Todos os clientes" },
                          { value: "new_clients", label: "Apenas novos clientes" },
                          { value: "none", label: "Desativado" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Agendamento Futuro Máximo */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Prazo Futuro Máximo de Agendamento</h4>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Limita a quantidade de meses futuros em que os clientes podem marcar horários a partir de hoje.
                      </p>
                    </div>
                    <div className="w-40 shrink-0">
                      <DropdownSelect
                        value={bookingControls.advanceBookingMonths}
                        onChange={(val) =>
                          setBookingControls({
                            ...bookingControls,
                            advanceBookingMonths: Number(val),
                          })
                        }
                        options={[
                          { value: 1, label: "1 mês" },
                          { value: 2, label: "2 meses" },
                          { value: 3, label: "3 meses" },
                          { value: 6, label: "6 meses" },
                          { value: 12, label: "12 meses" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Tempo de Processamento */}
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">
                        Encaixe Durante Pausa Química / Processamento
                      </h4>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Permite que clientes agendem procedimentos rápidos enquanto o especialista aguarda o tempo de
                        ação.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={bookingControls.allowProcessingTimeBooking}
                        onChange={(e) =>
                          setBookingControls({
                            ...bookingControls,
                            allowProcessingTimeBooking: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]" />
                    </label>
                  </div>

                  {/* Pronomes */}
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Coleta de Pronomes no Formulário</h4>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Adiciona a preferência de tratamento na ficha de atendimento do cliente.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={bookingControls.askClientsForPronouns}
                        onChange={(e) =>
                          setBookingControls({
                            ...bookingControls,
                            askClientsForPronouns: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]" />
                    </label>
                  </div>

                  {/* Cancelamentos e No-Show */}
                  <div className="py-5 space-y-4">
                    <div>
                      <h4 className="text-[14px] font-semibold text-[#1C1C1E]">Política de Cancelamento &amp; Faltas</h4>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Regras claras de remarcação e proteção contra horários perdidos.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-medium text-[#1C1C1E]">Cancelamento online pelo cliente</p>
                          <p className="text-[11.5px] text-[#6E6E73]">
                            Permite ao cliente remarcar ou cancelar direto pelo link da reserva.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                          <input
                            type="checkbox"
                            checked={bookingControls.cancellations.allowOnlineCancellation}
                            onChange={(e) =>
                              setBookingControls({
                                ...bookingControls,
                                cancellations: {
                                  ...bookingControls.cancellations,
                                  allowOnlineCancellation: e.target.checked,
                                },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]" />
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-medium text-[#1C1C1E]">Ciência da política obrigatória</p>
                          <p className="text-[11.5px] text-[#6E6E73]">
                            Exige que o cliente marque que leu e aceita as condições no ato da reserva.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                          <input
                            type="checkbox"
                            checked={bookingControls.cancellations.policyRequired}
                            onChange={(e) =>
                              setBookingControls({
                                ...bookingControls,
                                cancellations: {
                                  ...bookingControls.cancellations,
                                  policyRequired: e.target.checked,
                                },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]" />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[12px] font-medium text-[#1C1C1E]">
                        Texto da Política de Cancelamento
                      </label>
                      <textarea
                        rows={2}
                        value={bookingControls.cancellations.policyDetails}
                        onChange={(e) =>
                          setBookingControls({
                            ...bookingControls,
                            cancellations: {
                              ...bookingControls.cancellations,
                              policyDetails: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-[12px] font-medium text-[#1C1C1E]">
                          Taxa de Cancelamento / No-Show (%)
                        </label>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={bookingControls.cancellations.feePercent}
                            onChange={(e) =>
                              setBookingControls({
                                ...bookingControls,
                                cancellations: {
                                  ...bookingControls.cancellations,
                                  feePercent: Math.min(100, Math.max(0, parseInt(e.target.value || "0", 10))),
                                },
                              })
                            }
                            className="w-24 px-3 py-1.5 rounded-xl border border-[#E5E5EA] text-[13px] font-mono font-bold text-[#1C1C1E]"
                          />
                          <span className="text-[12px] text-[#6E6E73]">% do total do serviço</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[12px] font-medium text-[#1C1C1E] mb-1">
                          Prazo Limite para Cancelar sem Taxa
                        </label>
                        <DropdownSelect
                          value={bookingControls.cancellations.windowHours}
                          onChange={(val) =>
                            setBookingControls({
                              ...bookingControls,
                              cancellations: {
                                ...bookingControls.cancellations,
                                windowHours: Number(val),
                              },
                            })
                          }
                          options={[
                            { value: 12, label: "Até 12 horas antes" },
                            { value: 24, label: "Até 24 horas antes" },
                            { value: 48, label: "Até 48 horas antes" },
                            { value: 72, label: "Até 72 horas antes" },
                          ]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lista de Espera */}
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Lista de Espera Online</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#FBF8EF] border border-[#F3E8C4] text-[#8C6D1F]">
                          Gold
                        </span>
                      </div>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Permite que clientes se inscrevam para vagas em horários já preenchidos.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={bookingControls.waitlistOnlineEnabled}
                        onChange={(e) =>
                          setBookingControls({
                            ...bookingControls,
                            waitlistOnlineEnabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 4. UNIDADES & LOCAIS (Locations)                                          */}
            {/* ========================================================================= */}
            {subTab === "locations" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Unidades &amp; Locais</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Endereço de atendimento, disponibilidade para atendimento a domicílio e horários de funcionamento.
                  </p>
                </div>

                <div className="divide-y divide-[#F2F2F7]">
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-[#1C1C1E]">Atendimento em endereço fixo</p>
                      <p className="text-[12px] text-[#6E6E73]">Recebe clientes no salão, estúdio ou consultório.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={hasFixedAddress}
                        onChange={(e) => setHasFixedAddress(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]" />
                    </label>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-[#1C1C1E]">Atendimento a domicílio (Home care)</p>
                      <p className="text-[12px] text-[#6E6E73]">
                        Permite que clientes solicitem atendimento em suas residências.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={doesHouseCalls}
                        onChange={(e) => setDoesHouseCalls(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]" />
                    </label>
                  </div>
                </div>

                {hasFixedAddress && (
                  <div className="space-y-4 pt-2 border-t border-[#F2F2F7]">
                    <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Endereço da Unidade</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Logradouro e Número</label>
                        <input
                          type="text"
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Complemento</label>
                        <input
                          type="text"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Cidade</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">CEP</label>
                        <input
                          type="text"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">UF</label>
                        <input
                          type="text"
                          value={stateUF}
                          onChange={(e) => setStateUF(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Horários da Semana */}
                <div className="space-y-3 pt-2 border-t border-[#F2F2F7]">
                  <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Horário de Atendimento Semanal</h3>
                  <div className="divide-y divide-[#F2F2F7]">
                    {businessHours.map((h, idx) => (
                      <div
                        key={h.dayOfWeek}
                        className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-3 w-40">
                          <input
                            type="checkbox"
                            checked={h.isOpen}
                            onChange={(e) => {
                              const updated = [...businessHours];
                              updated[idx] = { ...updated[idx], isOpen: e.target.checked };
                              setBusinessHours(updated);
                            }}
                            className="w-4 h-4 rounded text-[#1C1C1E] focus:ring-0"
                          />
                          <span className={`text-[13px] font-medium ${h.isOpen ? "text-[#1C1C1E]" : "text-[#8E8E93]"}`}>
                            {h.label}
                          </span>
                        </div>

                        {h.isOpen ? (
                          <div className="flex items-center gap-2 text-[12px]">
                            <input
                              type="time"
                              value={h.startTime}
                              onChange={(e) => {
                                const updated = [...businessHours];
                                updated[idx] = { ...updated[idx], startTime: e.target.value };
                                setBusinessHours(updated);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-[#E5E5EA] bg-white text-[12px] font-mono text-[#1C1C1E]"
                            />
                            <span className="text-[#8E8E93]">às</span>
                            <input
                              type="time"
                              value={h.endTime}
                              onChange={(e) => {
                                const updated = [...businessHours];
                                updated[idx] = { ...updated[idx], endTime: e.target.value };
                                setBusinessHours(updated);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-[#E5E5EA] bg-white text-[12px] font-mono text-[#1C1C1E]"
                            />
                          </div>
                        ) : (
                          <span className="text-[12px] text-[#8E8E93] italic">Fechado</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5. DADOS DO NEGÓCIO (Business Details)                                     */}
            {/* ========================================================================= */}
            {subTab === "business_details" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Dados do Negócio</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Informações cadastrais e fiscais do seu estúdio ou salão.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#71717A] mb-1">Nome Fantasia do Estúdio</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#71717A] mb-1">Tipo de Estrutura Societária</label>
                    <input
                      type="text"
                      value={legalEntityType}
                      onChange={(e) => setLegalEntityType(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#71717A] mb-1">CNPJ ou CPF</label>
                    <input
                      type="text"
                      value={taxIdCnpjCpf}
                      onChange={(e) => setTaxIdCnpjCpf(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-mono text-[#1C1C1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#71717A] mb-1">Chave Pix Principal</label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-mono text-[#1C1C1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#71717A] mb-1">% Sinal Padrão Anti-No-Show</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={defaultDepositPercent}
                      onChange={(e) => setDefaultDepositPercent(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-mono font-bold text-[#1C1C1E]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 6. COBRANÇA & CHECKOUT (Card Reader, BNPL, Taxas & Impostos)               */}
            {/* ========================================================================= */}
            {subTab === "card_reader" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Cobrança &amp; Checkout</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Configurações de recebimento presencial, pagamentos por aproximação, parcelamento e tributação.
                  </p>
                </div>

                {/* Hero Editorial de Luxo - Maquininha Luvea Pro & Tap to Pay */}
                <div className="bg-[#F8F8FA] border border-[#E5E5EA] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2.5 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E5EA] text-[11.5px] font-medium text-[#1C1C1E]">
                      <Smartphone className="w-3.5 h-3.5 text-[#1C1C1E]" />
                      <span>Tap to Pay no iPhone &amp; Maquininha Pro</span>
                    </div>
                    <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#1C1C1E] tracking-tight">
                      Pagamentos por aproximação sem aluguel
                    </h3>
                    <p className="text-[13px] text-[#6E6E73] leading-relaxed">
                      Nossa solução integrada permite aceitar pagamentos por aproximação (contactless) diretamente no seu smartphone ou pela Maquininha Luvea Pro. Receba pagamentos no débito, crédito à vista ou parcelado com liquidação rápida.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#8E8E93]">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5EA] font-medium text-[#1C1C1E]">Visa</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5EA] font-medium text-[#1C1C1E]">Mastercard</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5EA] font-medium text-[#1C1C1E]">Elo</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5EA] font-medium text-[#1C1C1E]">Apple Pay</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5EA] font-medium text-[#1C1C1E]">Google Pay</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5EA] font-medium text-[#1C1C1E]">Pix Instantâneo</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => setActivePayoutModal("processing_info")}
                      className="px-4 py-2 rounded-full border border-[#D4D4D8] bg-white text-[#1C1C1E] hover:bg-[#F5F5F7] text-[12.5px] font-medium transition-colors text-center"
                    >
                      Ver taxas e prazos
                    </button>
                  </div>
                </div>

                {/* Seção 1: Parcelamento sem Juros & BNPL */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Parcelamento sem Juros &amp; BNPL</h3>
                    <p className="text-[12px] text-[#6E6E73]">
                      Permita que seus clientes parcelem atendimentos e pacotes no cartão de crédito ou Pix parcelado.
                    </p>
                  </div>

                  {!paymentsSetup.identityVerified && (
                    <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20 shrink-0" />
                        <p className="text-[12.5px] text-[#92400E]">
                          Verifique sua identidade para configurar pagamentos e aceitar recebimentos parcelados (BNPL).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSubTab("payout_account");
                          setActivePayoutModal("identity_verification");
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-white border border-[#FCD34D] text-[12px] font-medium text-[#78350F] hover:bg-[#FEF3C7] shrink-0 transition"
                      >
                        Verificar identidade
                      </button>
                    </div>
                  )}

                  <div className="divide-y divide-[#F2F2F7] border-y border-[#F2F2F7]">
                    <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-0.5 max-w-xl">
                        <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Aceitar Parcelamento sem Juros (BNPL &amp; Pix Parcelado)</h4>
                        <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                          Permita que clientes parcelem em até 12x. Taxa do intermediador de {checkoutSettings.bnplFeePercent}% + R$ {(checkoutSettings.bnplFixedFeeCents / 100).toFixed(2).replace(".", ",")} por transação parcelada.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={checkoutSettings.acceptBnpl}
                          onChange={(e) => {
                            const updated = { ...checkoutSettings, acceptBnpl: e.target.checked };
                            setCheckoutSettings(updated);
                            onUpdateState((prev) =>
                              updateWebsiteSetupConfig(prev, { checkoutSettings: updated })
                            );
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Seção 2: Taxa de Tecnologia da Plataforma & Tributos */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Taxa de Tecnologia da Plataforma &amp; Tributos</h3>
                    <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                      Reduza seus custos operacionais escolhendo quem assume a taxa de tecnologia da plataforma. Mantenha as alíquotas fiscais de serviços e varejo configuradas de acordo com seu regime tributário e município.
                    </p>
                  </div>

                  <div className="divide-y divide-[#F2F2F7] border-y border-[#F2F2F7]">
                    {/* Taxa de Tecnologia */}
                    <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-0.5 max-w-xl">
                        <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Taxa de tecnologia da plataforma</h4>
                        <p className="text-[12.5px] font-medium text-[#1C1C1E] pt-0.5">
                          {checkoutSettings.technologyFeePayer === "studio" ? "Você paga" : "Cliente paga no checkout"}
                        </p>
                        <p className="text-[12px] text-[#6E6E73]">
                          {checkoutSettings.technologyFeePayer === "studio"
                            ? "O estúdio absorve integralmente os custos operacionais da plataforma."
                            : "O encargo de processamento é repassado ao cliente e exibido de forma transparente no checkout."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTempFeePayer(checkoutSettings.technologyFeePayer);
                          setActiveTaxModal("platform_fee");
                        }}
                        className="px-4 py-1.5 rounded-full border border-[#D4D4D8] bg-white text-[#1C1C1E] hover:bg-[#F5F5F7] text-[12.5px] font-medium transition-colors shrink-0"
                      >
                        Editar
                      </button>
                    </div>

                    {/* Imposto sobre Serviços */}
                    <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-0.5 max-w-xl">
                        <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Imposto sobre Serviços (ISS / Simples Nacional)</h4>
                        <p className="text-[12.5px] font-medium text-[#1C1C1E] pt-0.5">
                          {checkoutSettings.serviceSalesTaxPercent}%
                        </p>
                        <p className="text-[12px] text-[#6E6E73]">
                          Alíquota estimada de imposto incidente sobre serviços de corte, coloração, estética e tratamentos para detalhamento em comandas e notas.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTempServiceTax(String(checkoutSettings.serviceSalesTaxPercent));
                          setActiveTaxModal("service_tax");
                        }}
                        className="px-4 py-1.5 rounded-full border border-[#D4D4D8] bg-white text-[#1C1C1E] hover:bg-[#F5F5F7] text-[12.5px] font-medium transition-colors shrink-0"
                      >
                        Editar
                      </button>
                    </div>

                    {/* Imposto sobre Venda de Produtos */}
                    <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-0.5 max-w-xl">
                        <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Imposto sobre Venda de Produtos (ICMS / Varejo)</h4>
                        <p className="text-[12.5px] font-medium text-[#1C1C1E] pt-0.5">
                          {checkoutSettings.retailSalesTaxPercent}%
                        </p>
                        <p className="text-[12px] text-[#6E6E73]">
                          Alíquota estimada de tributos incidentes sobre a venda de cosméticos, produtos capilares e home care no salão.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTempRetailTax(String(checkoutSettings.retailSalesTaxPercent));
                          setActiveTaxModal("retail_tax");
                        }}
                        className="px-4 py-1.5 rounded-full border border-[#D4D4D8] bg-white text-[#1C1C1E] hover:bg-[#F5F5F7] text-[12.5px] font-medium transition-colors shrink-0"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 7. CONTA DE REPASSE & VERIFICAÇÃO                                          */}
            {/* ========================================================================= */}
            {subTab === "payout_account" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Conta de Repasse &amp; Verificação</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-1 leading-relaxed max-w-2xl">
                    Para receber repasses automáticos de clientes pela LUVEA, é necessário verificar sua identidade e os dados cadastrais da sua empresa conforme as normas regulatórias do Banco Central do Brasil. Dúvidas? Fale com nosso suporte.
                  </p>
                </div>

                {/* Banner de Ação Necessária */}
                {!paymentsSetup.identityVerified ? (
                  <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20 shrink-0" />
                      <p className="text-[12.5px] font-medium text-[#92400E]">
                        Ação necessária! Atualize suas informações cadastrais para continuar recebendo pagamentos e repasses.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePayoutModal("identity_verification")}
                      className="px-3.5 py-1.5 rounded-full bg-white border border-[#FCD34D] text-[12px] font-medium text-[#78350F] hover:bg-[#FEF3C7] shrink-0 transition"
                    >
                      Completar dados
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#F6FDF9] border border-[#D1F2DF] rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
                      <p className="text-[12.5px] font-medium text-emerald-900">
                        Identidade verificada com sucesso. Os repasses de vendas e sinais Pix são efetuados diariamente na sua conta.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                      Em dia
                    </span>
                  </div>
                )}

                <div className="divide-y divide-[#F2F2F7] border-y border-[#F2F2F7]">
                  {/* Item 1: Processamento de Pagamentos */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Processamento de Pagamentos</h4>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          paymentsSetup.identityVerified ? "bg-[#F5F5F7] text-emerald-700" : "bg-[#F5F5F7] text-[#71717A]"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${paymentsSetup.identityVerified ? "bg-emerald-500 ring-2 ring-emerald-500/20" : "bg-[#A1A1AA]"}`} />
                          <span>{paymentsSetup.identityVerified ? "Ativo" : "Inativo"}</span>
                        </span>
                      </div>
                      <p className="text-[12px] text-[#6E6E73]">
                        Liquidação de vendas, taxas de no-show via Pix e cobranças presenciais na comanda.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePayoutModal("processing_info")}
                      className="px-4 py-1.5 rounded-full border border-[#D4D4D8] bg-white text-[#1C1C1E] hover:bg-[#F5F5F7] text-[12.5px] font-medium transition-colors shrink-0"
                    >
                      Saiba mais
                    </button>
                  </div>

                  {/* Item 2: Verificação de Identidade */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Verificação de Identidade</h4>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          paymentsSetup.identityVerified ? "bg-[#F5F5F7] text-emerald-700" : "bg-[#FFFBEB] text-amber-800 border border-[#FDE68A]"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${paymentsSetup.identityVerified ? "bg-emerald-500 ring-2 ring-emerald-500/20" : "bg-amber-500 ring-2 ring-amber-500/20"}`} />
                          <span>{paymentsSetup.identityVerified ? "Verificado" : "Informações pendentes"}</span>
                        </span>
                      </div>
                      <p className="text-[12px] text-[#6E6E73]">
                        Validação de conformidade legal perante o Banco Central do Brasil para liberação de repasses.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePayoutModal("identity_verification")}
                      className="px-4 py-1.5 rounded-full border border-[#D4D4D8] bg-white text-[#1C1C1E] hover:bg-[#F5F5F7] text-[12.5px] font-medium transition-colors shrink-0"
                    >
                      {paymentsSetup.identityVerified ? "Editar ↗" : "Completar ↗"}
                    </button>
                  </div>

                  {/* Item 3: Conta de Repasse */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Conta de Repasse</h4>
                      <p className="text-[12px] text-[#1C1C1E] font-medium pt-0.5">
                        {paymentsSetup.payoutMethod === "pix_key"
                          ? `Chave Pix: ${paymentsSetup.pixKeyValue || pixKey}`
                          : `${paymentsSetup.bankName || "Nu Pagamentos S.A."} · Agência ${paymentsSetup.routingOrAgency || "0001"} · C/C ${paymentsSetup.accountNumber || "1234567-8"}`}
                      </p>
                      <p className="text-[12px] text-[#6E6E73]">
                        Conta bancária ou chave Pix de titularidade da empresa para onde os valores são transferidos.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePayoutModal("payout_account")}
                      className="px-4 py-1.5 rounded-full border border-[#D4D4D8] bg-white text-[#1C1C1E] hover:bg-[#F5F5F7] text-[12.5px] font-medium transition-colors shrink-0"
                    >
                      {paymentsSetup.setupCompleted ? "Editar" : "Adicionar"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 8. CONFORMIDADE & LGPD                                                     */}
            {/* ========================================================================= */}
            {subTab === "hipaa" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Conformidade LGPD &amp; Privacidade</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase bg-[#F5F5F7] border border-[#E5E5EA] text-[#52525B]">
                      LGPD
                    </span>
                  </div>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Políticas de privacidade de dados sensíveis, prontuários estéticos e fichas de anamnese.
                  </p>
                </div>
                <div className="divide-y divide-[#F2F2F7] border-y border-[#F2F2F7]">
                  <div className="py-4 space-y-1">
                    <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Criptografia e Sigilo Profissional</h4>
                    <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                      Fórmulas cosméticas, fotos antes/depois e notas SOAP dos clientes são encriptadas de ponta a ponta e restritas exclusivamente aos profissionais autorizados do estúdio.
                    </p>
                  </div>
                  <div className="py-4 space-y-1">
                    <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Termo de Consentimento Livre e Esclarecido (TCLE)</h4>
                    <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                      Assinatura digital dos termos de consentimento para tratamentos invasivos e químicos integrada diretamente na ficha de atendimento.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 9. PRONTUÁRIOS & FICHAS CLÍNICAS (CHARTING)                                */}
            {/* ========================================================================= */}
            {subTab === "charting" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Prontuários &amp; Fichas Clínicas</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase bg-[#F5F5F7] border border-[#E5E5EA] text-[#52525B]">
                      Avançado
                    </span>
                  </div>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Governança clínica, assinaturas eletrônicas obrigatórias e validação técnica de prontuários.
                  </p>
                </div>

                <div className="divide-y divide-[#F2F2F7] border-y border-[#F2F2F7]">
                  {/* Exigir assinatura do profissional */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-0.5 max-w-xl">
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Exigir assinatura do profissional</h4>
                      <p className="text-[12px] text-[#6E6E73]">
                        Quando ativado, os profissionais devem assinar digitalmente seus próprios prontuários e notas de evolução antes do envio final.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={chartingSettings.requireProviderSignature}
                        onChange={(e) => {
                          const updated = { ...chartingSettings, requireProviderSignature: e.target.checked };
                          setChartingSettings(updated);
                          onUpdateState((prev) =>
                            updateWebsiteSetupConfig(prev, { chartingSettings: updated })
                          );
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
                    </label>
                  </div>

                  {/* Exigir aprovação do Responsável Técnico */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-0.5 max-w-xl">
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Exigir aprovação do Responsável Técnico</h4>
                      <p className="text-[12px] text-[#6E6E73]">
                        Quando ativado, os prontuários e procedimentos com substâncias químicas exigem visto e liberação de um Responsável Técnico (RT) ou Diretor Clínico antes de serem finalizados.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={chartingSettings.requireMedicalDirectorSignOff}
                        onChange={(e) => {
                          const updated = { ...chartingSettings, requireMedicalDirectorSignOff: e.target.checked };
                          setChartingSettings(updated);
                          onUpdateState((prev) =>
                            updateWebsiteSetupConfig(prev, { chartingSettings: updated })
                          );
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
                    </label>
                  </div>

                  {/* Editar permissões e papéis da equipe */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-0.5 max-w-xl">
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Editar funções e permissões da equipe</h4>
                      <p className="text-[12px] text-[#6E6E73]">
                        Defina permissões para que membros específicos da equipe possam visualizar, preencher, emitir e assinar prontuários e fichas de clientes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTopTab("staff")}
                      className="px-4 py-1.5 rounded-full border border-[#D4D4D8] bg-white text-[#1C1C1E] hover:bg-[#F5F5F7] text-[12.5px] font-medium transition-colors shrink-0"
                    >
                      Página da Equipe ↗
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 10. VALES-PRESENTE                                                        */}
            {/* ========================================================================= */}
            {subTab === "gift_cards" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Vales-Presente</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Permita a compra de vales-presente com resgate automático de saldo no atendimento.
                  </p>
                </div>
                <div className="divide-y divide-[#F2F2F7] border-y border-[#F2F2F7]">
                  <div className="py-4 space-y-1">
                    <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Venda de Vouchers Ativa</h4>
                    <p className="text-[12px] text-[#6E6E73]">
                      Os clientes podem adquirir créditos de presente diretamente pelo site público de agendamento e aplicar o código na comanda.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* DEMAIS ABAS SUPERIORES (Pessoal, Equipe, WhatsApp, Plano) */}
      {topTab === "personal" && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] p-6 lg:p-8 space-y-6 max-w-2xl">
          <div>
            <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Dados Pessoais</h2>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">Seu nome e contatos como responsável pela conta.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Primeiro Nome</label>
              <input
                type="text"
                value={personalFirst}
                onChange={(e) => setPersonalFirst(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Sobrenome</label>
              <input
                type="text"
                value={personalLast}
                onChange={(e) => setPersonalLast(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">E-mail</label>
              <input
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Telefone WhatsApp</label>
              <input
                type="text"
                value={personalPhone}
                onChange={(e) => setPersonalPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
              />
            </div>
          </div>

          {/* Aparência do Studio */}
          <div className="pt-6 border-t border-[#E5E5EA] dark:border-[#27272a] space-y-3">
            <div>
              <h3 className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">Aparência do Studio</h3>
              <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                Escolha o tema do seu painel operacional. Alterne entre os modos claro e escuro a qualquer momento.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                  theme === "light"
                    ? "border-[#1C1C1E] dark:border-white bg-[#F5F5F7] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white shadow-sm ring-2 ring-[#E5E5EA] dark:ring-[#3f3f46]"
                    : "border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    theme === "light" ? "bg-white text-amber-500 shadow-2xs" : "bg-[#F5F5F7] dark:bg-[#27272a] text-[#71717A]"
                  }`}>
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold block leading-tight">Modo Claro</span>
                    <span className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">Padrão Luvea</span>
                  </div>
                </div>
                {theme === "light" && (
                  <div className="w-5 h-5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                  theme === "dark"
                    ? "border-[#1C1C1E] dark:border-white bg-[#18181b] text-white shadow-sm ring-2 ring-[#27272a]"
                    : "border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    theme === "dark" ? "bg-[#27272a] text-amber-400" : "bg-[#F5F5F7] dark:bg-[#27272a] text-[#71717A]"
                  }`}>
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold block leading-tight">Modo Escuro</span>
                    <span className={`text-[11px] ${theme === "dark" ? "text-[#a1a1aa]" : "text-[#71717A]"}`}>Luvea Dark</span>
                  </div>
                </div>
                {theme === "dark" && (
                  <div className="w-5 h-5 rounded-full bg-white text-[#09090b] flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Sessão & Acesso */}
          <div className="pt-6 border-t border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Sessão da Conta</h3>
              <p className="text-[12px] text-[#6E6E73]">
                Conectado atualmente como <span className="font-medium text-[#1C1C1E]">{personalEmail || state.settings.personal.email}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOutUser()}
              className="px-4 py-2 rounded-full border border-[#D4D4D8] bg-white hover:bg-[#F5F5F7] text-[#1C1C1E] text-[12.5px] font-medium transition shadow-2xs self-start sm:self-auto flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-600" />
              <span>Sair da conta</span>
            </button>
          </div>
        </div>
      )}

      {topTab === "staff" && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] p-6 lg:p-8 space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Equipe de Especialistas</h2>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">
              Profissionais cadastrados, comissões de serviço e metas de faturamento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.staff.map((member) => (
              <div key={member.id} className="p-4 rounded-2xl border border-[#E5E5EA] bg-[#FAFAFA] space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-zinc-800"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-[13.5px] text-[#1C1C1E]">{member.fullName}</p>
                    <p className="text-[12px] text-[#6E6E73]">{member.role}</p>
                  </div>
                </div>
                <p className="text-[11.5px] text-[#71717A] pt-2 border-t border-[#E5E5EA]">
                  Comissão: {member.serviceCommissionPercent}% serviços • {member.productCommissionPercent}% produtos
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {topTab === "whatsapp" && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] p-6 lg:p-8 space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#1C1C1E]">WhatsApp &amp; Automação de Atendimento</h2>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">
              Conexão com a Evolution API, sincronização 2-Way e disparos automáticos de confirmação.
            </p>
          </div>
          <WhatsAppConfigCard
            state={state}
            setState={(updater) => {
              if (typeof updater === "function") {
                onUpdateState(updater);
              } else {
                onUpdateState(() => updater);
              }
            }}
            showSaveAndContinue={true}
          />
        </div>
      )}

      {topTab === "tv_kiosk" && (
        <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#E5E5EA] dark:border-[#27272a] p-6 lg:p-8 space-y-6 shadow-sm">
          <TvKioskSettingsSection
            initialCode={initialTvCode}
            availableStaff={state.staff}
          />
        </div>
      )}

      {topTab === "subscription" && (() => {
        const currentTier = (state.onboarding?.planTier || "Gold").toLowerCase();
        const subStatus = state.onboarding?.subscriptionStatus || "trialing";
        const trialDays = state.onboarding?.trialDaysLeft ?? 14;
        const isTrialActive = subStatus === "trialing" && trialDays > 0;
        const isTrialExpired = subStatus === "trialing" && trialDays <= 0;
        const isSubActive = subStatus === "active";
        const isPastDue = subStatus === "past_due";

        // Nome formatado do plano atual
        const currentPlanFormatted =
          currentTier.includes("platinum") ? "Platinum" :
          currentTier.includes("essencial") ? "Essencial" : "Gold";

        return (
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#E5E5EA] dark:border-[#27272a] p-6 lg:p-8 space-y-8">
            {/* Header com Status Atual */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-[22px] font-serif font-normal text-[#1C1C1E] dark:text-white">
                    Plano &amp; Assinatura LUVEA
                  </h2>
                  <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                    Gerencie a potência da sua recepção, limites de equipe e integrações oficiais.
                  </p>
                </div>

                {/* Alternador de Ciclo Mensal / Anual */}
                <div className="inline-flex items-center p-1 bg-[#F5F5F7] dark:bg-[#27272a] rounded-full border border-[#E5E5EA] dark:border-[#3f3f46] shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedCycle("monthly")}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                      selectedCycle === "monthly"
                        ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white shadow-sm"
                        : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCycle("yearly")}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                      selectedCycle === "yearly"
                        ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white shadow-sm"
                        : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
                    }`}
                  >
                    <span>Anual</span>
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      -15%
                    </span>
                  </button>
                </div>
              </div>

              {/* Card de Status da Assinatura Atual */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F5F7] dark:bg-[#202023] border border-[#E5E5EA] dark:border-[#2e2e32] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] text-[#1C1C1E] dark:text-white shadow-xs">
                    {isSubActive ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                        <span>Assinatura Ativa • Plano {currentPlanFormatted}</span>
                      </>
                    ) : isPastDue ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                        <span>Pagamento Pendente • Plano {currentPlanFormatted}</span>
                      </>
                    ) : isTrialExpired ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
                        <span>Avaliação Expirada • Plano {currentPlanFormatted}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                        <span>
                          Avaliação Ativa • {trialDays} {trialDays === 1 ? "dia restante" : "dias restantes"} (Plano {currentPlanFormatted})
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] max-w-2xl leading-relaxed">
                    {isSubActive
                      ? `Sua assinatura está ativa e sendo renovada automaticamente no ciclo ${selectedCycle === "yearly" ? "anual" : "mensal"}. Seus recursos estão liberados.`
                      : isPastDue
                      ? "Identificamos uma pendência na última renovação. Atualize sua forma de pagamento para evitar bloqueio da agenda."
                      : isTrialExpired
                      ? "O período de 14 dias de teste gratuito foi concluído. Selecione um plano abaixo para manter seu link da bio e atendimentos online operando."
                      : "Durante o período de testes, todos os recursos avançados estão disponíveis. Adicione sua forma de pagamento para manter seu estúdio 100% ativo ao fim da avaliação."}
                  </p>
                </div>

                {!isSubActive && (
                  <Link
                    href={`/checkout?plan=${currentTier}&cycle=${selectedCycle}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium shadow-sm hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition-all shrink-0 active:scale-[0.98]"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isTrialExpired ? "Reativar com Cartão" : "Efetivar Assinatura"}</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Grid dos 3 Planos Canônicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {PLANS_CATALOG.map((plan) => {
                const isCurrentPlan = currentTier.includes(plan.id);
                const price = selectedCycle === "yearly" ? plan.annualMonthlyPriceReais : plan.monthlyPriceReais;

                return (
                  <div
                    key={plan.id}
                    className={`relative p-6 sm:p-7 rounded-2xl flex flex-col justify-between transition-all ${
                      plan.isPopular
                        ? "border-2 border-[#1C1C1E] dark:border-white bg-[#FAFAFA] dark:bg-[#202023] shadow-sm"
                        : "border border-[#E5E5EA] dark:border-[#2e2e32] bg-white dark:bg-[#18181b]"
                    }`}
                  >
                    {plan.isPopular && (
                      <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] shadow-xs">
                        Mais Popular
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-[17px] text-[#1C1C1E] dark:text-white">
                            {plan.name}
                          </h3>
                          {isCurrentPlan && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] text-[#1C1C1E] dark:text-zinc-200 border border-[#E5E5EA] dark:border-[#3f3f46]">
                              Plano Atual
                            </span>
                          )}
                        </div>
                        <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] mt-1 leading-snug min-h-[36px]">
                          {plan.tagline}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#F2F2F7] dark:border-[#27272a]">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[28px] sm:text-[32px] font-serif font-normal text-[#1C1C1E] dark:text-white">
                            R$ {price}
                          </span>
                          <span className="text-[12px] font-sans text-[#6E6E73] dark:text-[#a1a1aa]">
                            /mês {selectedCycle === "yearly" && "no anual"}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-[#8E8E93] dark:text-[#71717a] mt-0.5">
                          {plan.maxStaffLabel} • {plan.aiReceptionLimit}
                        </p>
                      </div>

                      <div className="pt-3 space-y-2 border-t border-[#F2F2F7] dark:border-[#27272a]">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] dark:text-[#71717a]">
                          Incluso no plano:
                        </p>
                        <ul className="space-y-1.5">
                          {plan.highlights.slice(0, 5).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[12px] text-[#1C1C1E] dark:text-zinc-300">
                              <Check className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white shrink-0 mt-0.5" />
                              <span className="leading-tight">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-6">
                      {isCurrentPlan && isSubActive ? (
                        <div className="w-full py-2.5 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] text-[#8E8E93] dark:text-zinc-400 text-[12.5px] font-medium text-center border border-[#E5E5EA] dark:border-[#3f3f46]">
                          Plano Ativo
                        </div>
                      ) : (
                        <Link
                          href={`/checkout?plan=${plan.id}&cycle=${selectedCycle}`}
                          className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[12.5px] font-medium transition-all ${
                            plan.isPopular || isCurrentPlan
                              ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 shadow-sm"
                              : "border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#323238]"
                          }`}
                        >
                          <span>{isCurrentPlan ? "Continuar com " + plan.name : "Assinar " + plan.name}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Micro-garantias e Segurança */}
            <div className="pt-4 border-t border-[#E5E5EA] dark:border-[#27272a] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
                <span>Processamento criptografado de ponta a ponta</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
                <span>Cancele a qualquer momento sem burocracia</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
                <span>Dados de clientes e agenda 100% seguros</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 1: PRÉVIA DA NOTIFICAÇÃO (WhatsApp vs E-mail)                       */}
      {/* ========================================================================= */}
      {previewNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5EA] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-[16px] font-semibold text-[#1C1C1E]">Prévia da Notificação</h3>
                <p className="text-[12px] text-[#6E6E73]">Como seu cliente receberá o comunicado</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewNotification(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador de Canal */}
            <div className="flex items-center gap-2 p-1 bg-[#F5F5F7] rounded-xl">
              <button
                type="button"
                onClick={() => setNotificationPreviewChannel("whatsapp")}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition ${
                  notificationPreviewChannel === "whatsapp" ? "bg-white text-[#1C1C1E] shadow-sm" : "text-[#6E6E73]"
                }`}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setNotificationPreviewChannel("email")}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition ${
                  notificationPreviewChannel === "email" ? "bg-white text-[#1C1C1E] shadow-sm" : "text-[#6E6E73]"
                }`}
              >
                E-mail
              </button>
            </div>

            {/* Prévia Visual */}
            {notificationPreviewChannel === "whatsapp" ? (
              <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-[#D1D1D6] space-y-2">
                <div className="bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-sm max-w-[88%] text-[13px] leading-relaxed text-[#1C1C1E] space-y-2">
                  <p className="whitespace-pre-wrap">
                    {previewNotification.templateBody
                      .replace("{nome}", "Stefany")
                      .replace("{estudio}", businessName)
                      .replace("{data}", "24/10/2026")
                      .replace("{horario}", "14:30")
                      .replace("{servicos}", "Coloração & Iluminação")
                      .replace("{google_review_link}", notificationsConfig.googleReviewLink || fullBookingUrl)}
                  </p>
                  <p className="text-[10px] text-right text-[#8E8E93]">14:31</p>
                </div>
              </div>
            ) : (
              <div className="border border-[#E5E5EA] rounded-2xl p-4 bg-white space-y-3">
                <div className="border-b border-[#F2F2F7] pb-2 text-[12px] space-y-1">
                  <p className="text-[#8E8E93]">
                    De: <strong className="text-[#1C1C1E]">{businessName}</strong> &lt;notificacoes@luvea.app&gt;
                  </p>
                  <p className="text-[#8E8E93]">
                    Assunto:{" "}
                    <strong className="text-[#1C1C1E]">
                      {previewNotification.templateSubject?.replace("{estudio}", businessName) ||
                        previewNotification.title}
                    </strong>
                  </p>
                </div>
                <div className="text-[13px] leading-relaxed text-[#1C1C1E] whitespace-pre-wrap py-2">
                  {previewNotification.templateBody
                    .replace("{nome}", "Stefany")
                    .replace("{estudio}", businessName)
                    .replace("{data}", "24/10/2026")
                    .replace("{horario}", "14:30")
                    .replace("{servicos}", "Coloração & Iluminação")
                    .replace("{google_review_link}", notificationsConfig.googleReviewLink || fullBookingUrl)}
                </div>
                <div className="pt-2 border-t border-[#F2F2F7] text-[10.5px] text-[#8E8E93] text-center">
                  Enviado com carinho por {businessName} via LUVEA
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewNotification(null)}
                className="px-5 py-2 rounded-full bg-[#1C1C1E] text-white text-[12.5px] font-medium"
              >
                Fechar prévia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PERSONALIZAR MODELO                                              */}
      {/* ========================================================================= */}
      {editNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5EA] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-[16px] font-semibold text-[#1C1C1E]">Personalizar Mensagem</h3>
                <p className="text-[12px] text-[#6E6E73]">{editNotification.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditNotification(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Assunto do E-mail</label>
              <input
                type="text"
                value={editNotification.templateSubject || ""}
                onChange={(e) =>
                  setEditNotification({
                    ...editNotification,
                    templateSubject: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Texto da Mensagem</label>
              <textarea
                rows={5}
                value={editNotification.templateBody}
                onChange={(e) =>
                  setEditNotification({
                    ...editNotification,
                    templateBody: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] text-[#8E8E93]">Variáveis disponíveis (toque para inserir):</p>
              <div className="flex flex-wrap gap-1.5">
                {["{nome}", "{estudio}", "{data}", "{horario}", "{servicos}", "{google_review_link}"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setEditNotification({
                        ...editNotification,
                        templateBody: `${editNotification.templateBody} ${tag}`,
                      });
                    }}
                    className="px-2 py-0.5 rounded-md bg-[#F5F5F7] border border-[#E5E5EA] text-[11px] font-mono text-[#1C1C1E] hover:bg-[#E5E5EA] transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => setEditNotification(null)}
                className="px-4 py-2 rounded-full border border-[#D4D4D8] text-[12.5px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const updatedItems = notificationsConfig.items.map((it) =>
                    it.id === editNotification.id ? editNotification : it
                  );
                  setNotificationsConfig({ ...notificationsConfig, items: updatedItems });
                  setEditNotification(null);
                  handleSaveAll();
                }}
                className="px-5 py-2 rounded-full bg-[#1C1C1E] text-white text-[12.5px] font-medium hover:bg-[#2C2C2E]"
              >
                Salvar modelo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TAXA DE TECNOLOGIA DA PLATAFORMA                                 */}
      {/* ========================================================================= */}
      {activeTaxModal === "platform_fee" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5EA] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-[16px] font-semibold text-[#1C1C1E]">Taxa de Tecnologia da Plataforma</h3>
                <p className="text-[12px] text-[#6E6E73]">Escolha quem assume a taxa operacional</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTaxModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label
                onClick={() => setTempFeePayer("studio")}
                className={`p-4 rounded-2xl border cursor-pointer block transition-all ${
                  tempFeePayer === "studio"
                    ? "border-[#1C1C1E] bg-[#FAFAFA]"
                    : "border-[#E5E5EA] hover:border-[#D4D4D8] bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-semibold text-[#1C1C1E]">Você paga (Estúdio absorve)</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      tempFeePayer === "studio" ? "border-[#1C1C1E] bg-[#1C1C1E]" : "border-[#D4D4D8]"
                    }`}
                  >
                    {tempFeePayer === "studio" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[12px] text-[#6E6E73] mt-1 leading-relaxed">
                  O estúdio assume integralmente os custos operacionais da plataforma. O cliente visualiza e paga exatamente o valor anunciado do serviço.
                </p>
              </label>

              <label
                onClick={() => setTempFeePayer("client")}
                className={`p-4 rounded-2xl border cursor-pointer block transition-all ${
                  tempFeePayer === "client"
                    ? "border-[#1C1C1E] bg-[#FAFAFA]"
                    : "border-[#E5E5EA] hover:border-[#D4D4D8] bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-semibold text-[#1C1C1E]">Cliente paga no checkout</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      tempFeePayer === "client" ? "border-[#1C1C1E] bg-[#1C1C1E]" : "border-[#D4D4D8]"
                    }`}
                  >
                    {tempFeePayer === "client" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[12px] text-[#6E6E73] mt-1 leading-relaxed">
                  A taxa de tecnologia é discriminada no subtotal e cobrada do cliente no ato do checkout com transparência total.
                </p>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => setActiveTaxModal(null)}
                className="px-4 py-2 rounded-full border border-[#D4D4D8] text-[12.5px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...checkoutSettings, technologyFeePayer: tempFeePayer };
                  setCheckoutSettings(updated);
                  setActiveTaxModal(null);
                  onUpdateState((prev) =>
                    updateWebsiteSetupConfig(prev, { checkoutSettings: updated })
                  );
                }}
                className="px-5 py-2 rounded-full bg-[#1C1C1E] text-white text-[12.5px] font-medium hover:bg-[#2C2C2E]"
              >
                Salvar Opção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ALÍQUOTA DE SERVIÇOS (ISS)                                       */}
      {/* ========================================================================= */}
      {activeTaxModal === "service_tax" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E5E5EA] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-[16px] font-semibold text-[#1C1C1E]">Imposto sobre Serviços</h3>
                <p className="text-[12px] text-[#6E6E73]">ISS / Simples Nacional</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTaxModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[12px] font-medium text-[#71717A]">
                Alíquota estimada de imposto (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={tempServiceTax}
                  onChange={(e) => setTempServiceTax(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[15px] font-medium font-mono text-[#1C1C1E] pr-8 focus:outline-none focus:border-[#1C1C1E]"
                />
                <span className="absolute right-3.5 top-2.5 text-[14px] text-[#71717A] pointer-events-none">%</span>
              </div>
              <p className="text-[11.5px] text-[#8E8E93] leading-relaxed">
                Utilizada para discriminar encargos tributários nas comandas e faturas de serviços emitidas aos clientes.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => setActiveTaxModal(null)}
                className="px-4 py-2 rounded-full border border-[#D4D4D8] text-[12.5px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = Math.min(100, Math.max(0, parseFloat(tempServiceTax) || 0));
                  const updated = { ...checkoutSettings, serviceSalesTaxPercent: val };
                  setCheckoutSettings(updated);
                  setActiveTaxModal(null);
                  onUpdateState((prev) =>
                    updateWebsiteSetupConfig(prev, { checkoutSettings: updated })
                  );
                }}
                className="px-5 py-2 rounded-full bg-[#1C1C1E] text-white text-[12.5px] font-medium hover:bg-[#2C2C2E]"
              >
                Salvar Alíquota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ALÍQUOTA DE VAREJO / PRODUTOS (ICMS)                              */}
      {/* ========================================================================= */}
      {activeTaxModal === "retail_tax" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E5E5EA] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-[16px] font-semibold text-[#1C1C1E]">Imposto sobre Produtos</h3>
                <p className="text-[12px] text-[#6E6E73]">ICMS / Varejo Home Care</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTaxModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[12px] font-medium text-[#71717A]">
                Alíquota estimada sobre produtos (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={tempRetailTax}
                  onChange={(e) => setTempRetailTax(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[15px] font-medium font-mono text-[#1C1C1E] pr-8 focus:outline-none focus:border-[#1C1C1E]"
                />
                <span className="absolute right-3.5 top-2.5 text-[14px] text-[#71717A] pointer-events-none">%</span>
              </div>
              <p className="text-[11.5px] text-[#8E8E93] leading-relaxed">
                Incidente sobre cosméticos, shampoos, óleos e tratamentos capilares vendidos presencialmente no salão.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => setActiveTaxModal(null)}
                className="px-4 py-2 rounded-full border border-[#D4D4D8] text-[12.5px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = Math.min(100, Math.max(0, parseFloat(tempRetailTax) || 0));
                  const updated = { ...checkoutSettings, retailSalesTaxPercent: val };
                  setCheckoutSettings(updated);
                  setActiveTaxModal(null);
                  onUpdateState((prev) =>
                    updateWebsiteSetupConfig(prev, { checkoutSettings: updated })
                  );
                }}
                className="px-5 py-2 rounded-full bg-[#1C1C1E] text-white text-[12.5px] font-medium hover:bg-[#2C2C2E]"
              >
                Salvar Alíquota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: VERIFICAÇÃO DE IDENTIDADE & KYC                                  */}
      {/* ========================================================================= */}
      {activePayoutModal === "identity_verification" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5EA] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-[16px] font-semibold text-[#1C1C1E]">Verificação de Identidade (KYC)</h3>
                <p className="text-[12px] text-[#6E6E73]">Conformidade regulatória Banco Central do Brasil</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePayoutModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Razão Social ou Nome Fantasia</label>
                <input
                  type="text"
                  value={idLegalName}
                  onChange={(e) => setIdLegalName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">CNPJ ou CPF do Negócio</label>
                  <input
                    type="text"
                    value={idCnpjCpf}
                    onChange={(e) => setIdCnpjCpf(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-mono text-[#1C1C1E]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">CPF do Titular Administrador</label>
                  <input
                    type="text"
                    value={idRepCpf}
                    onChange={(e) => setIdRepCpf(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-mono text-[#1C1C1E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Nome Completo do Responsável</label>
                <input
                  type="text"
                  value={idRepName}
                  onChange={(e) => setIdRepName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-[11.5px] text-[#52525B] leading-relaxed">
                  Seus dados e documentos são criptografados com certificado TLS 1.3 de nível bancário e validados com as bases oficiais da Receita Federal.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => setActivePayoutModal(null)}
                className="px-4 py-2 rounded-full border border-[#D4D4D8] text-[12.5px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const updatedPayments = {
                    ...paymentsSetup,
                    identityVerified: true,
                  };
                  setPaymentsSetup(updatedPayments);
                  setActivePayoutModal(null);
                  onUpdateState((prev) =>
                    updateWebsiteSetupConfig(prev, { paymentsSetup: updatedPayments })
                  );
                }}
                className="px-5 py-2 rounded-full bg-[#1C1C1E] text-white text-[12.5px] font-medium hover:bg-[#2C2C2E]"
              >
                Confirmar e Validar Identidade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: CONTA DE REPASSE (PIX OU BANCÁRIA)                               */}
      {/* ========================================================================= */}
      {activePayoutModal === "payout_account" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5EA] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-[16px] font-semibold text-[#1C1C1E]">Conta de Repasse</h3>
                <p className="text-[12px] text-[#6E6E73]">Destino dos repasses e liquidações financeiras</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePayoutModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador de Método */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F5F5F7] rounded-xl">
              <button
                type="button"
                onClick={() => setPayoutMethodInput("pix_key")}
                className={`py-1.5 text-[12.5px] font-medium rounded-lg transition-all ${
                  payoutMethodInput === "pix_key"
                    ? "bg-white text-[#1C1C1E] shadow-xs"
                    : "text-[#71717A] hover:text-[#1C1C1E]"
                }`}
              >
                Chave Pix
              </button>
              <button
                type="button"
                onClick={() => setPayoutMethodInput("bank_account")}
                className={`py-1.5 text-[12.5px] font-medium rounded-lg transition-all ${
                  payoutMethodInput === "bank_account"
                    ? "bg-white text-[#1C1C1E] shadow-xs"
                    : "text-[#71717A] hover:text-[#1C1C1E]"
                }`}
              >
                Conta Bancária
              </button>
            </div>

            {payoutMethodInput === "pix_key" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">
                    Chave Pix (E-mail, CPF/CNPJ, Telefone ou Aleatória)
                  </label>
                  <input
                    type="text"
                    value={pixKeyValueInput}
                    onChange={(e) => setPixKeyValueInput(e.target.value)}
                    placeholder="ex: contato@luveastudio.app"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] font-mono text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]"
                  />
                </div>
                <p className="text-[11.5px] text-[#8E8E93]">
                  Repasses automáticos via Pix são efetuados sem tarifa bancária para o titular da conta.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Banco / Instituição</label>
                  <input
                    type="text"
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Agência</label>
                    <input
                      type="text"
                      value={bankAgencyInput}
                      onChange={(e) => setBankAgencyInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-mono text-[#1C1C1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Conta Corrente</label>
                    <input
                      type="text"
                      value={bankAccountInput}
                      onChange={(e) => setBankAccountInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-mono text-[#1C1C1E]"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => setActivePayoutModal(null)}
                className="px-4 py-2 rounded-full border border-[#D4D4D8] text-[12.5px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const updatedPayments = {
                    ...paymentsSetup,
                    payoutMethod: payoutMethodInput,
                    pixKeyValue: pixKeyValueInput,
                    bankName: bankNameInput,
                    routingOrAgency: bankAgencyInput,
                    accountNumber: bankAccountInput,
                    setupCompleted: true,
                  };
                  setPaymentsSetup(updatedPayments);
                  setPixKey(pixKeyValueInput);
                  setActivePayoutModal(null);
                  onUpdateState((prev) =>
                    updateWebsiteSetupConfig(prev, { paymentsSetup: updatedPayments })
                  );
                }}
                className="px-5 py-2 rounded-full bg-[#1C1C1E] text-white text-[12.5px] font-medium hover:bg-[#2C2C2E]"
              >
                Salvar Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: INFORMAÇÕES DE PROCESSAMENTO E TAXAS                             */}
      {/* ========================================================================= */}
      {activePayoutModal === "processing_info" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5EA] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-[16px] font-semibold text-[#1C1C1E]">Taxas &amp; Prazos de Liquidação</h3>
                <p className="text-[12px] text-[#6E6E73]">Condições transparentes integradas à LUVEA</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePayoutModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] space-y-1">
                <div className="flex items-center justify-between font-medium text-[#1C1C1E]">
                  <span>Pix Instantâneo &amp; Sinais</span>
                  <span className="text-emerald-700 font-semibold">0% · Imediato (D+0)</span>
                </div>
                <p className="text-[11.5px] text-[#6E6E73]">
                  Sem taxas de intermediação bancária. O valor cai direto na sua conta cadastrada.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] space-y-1">
                <div className="flex items-center justify-between font-medium text-[#1C1C1E]">
                  <span>Cartão Débito &amp; Crédito à Vista</span>
                  <span className="text-[#1C1C1E] font-semibold">1,99% a 3,19% · 1 dia útil (D+1)</span>
                </div>
                <p className="text-[11.5px] text-[#6E6E73]">
                  Liquidação automática na sua conta sem necessidade de solicitar resgate manual.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] space-y-1">
                <div className="flex items-center justify-between font-medium text-[#1C1C1E]">
                  <span>Parcelamento sem Juros (BNPL)</span>
                  <span className="text-[#1C1C1E] font-semibold">6% + R$ 0,30 · D+1 integral</span>
                </div>
                <p className="text-[11.5px] text-[#6E6E73]">
                  O estúdio recebe o valor total antecipado em 1 dia útil, enquanto o cliente parcela em até 12x.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] space-y-1">
                <div className="flex items-center justify-between font-medium text-[#1C1C1E]">
                  <span>Maquininha Luvea Pro</span>
                  <span className="text-emerald-700 font-semibold">R$ 0 aluguel / mês</span>
                </div>
                <p className="text-[11.5px] text-[#6E6E73]">
                  Sem metas mínimas de faturamento ou aluguel mensal de equipamento.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => setActivePayoutModal(null)}
                className="px-5 py-2 rounded-full bg-[#1C1C1E] text-white text-[12.5px] font-medium hover:bg-[#2C2C2E]"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
