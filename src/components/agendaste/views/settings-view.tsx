"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { SubscriptionSettingsSection } from "@/components/agendaste/subscription-settings-section";
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

  // Campos temporários para Conta de Repasse & Motor Pix Multi-Tenant
  const [bankNameInput, setBankNameInput] = useState(paymentsSetup.bankName || "Nu Pagamentos S.A. (Nubank)");
  const [bankAgencyInput, setBankAgencyInput] = useState(paymentsSetup.routingOrAgency || "0001");
  const [bankAccountInput, setBankAccountInput] = useState(paymentsSetup.accountNumber || "1234567-8");
  const [pixKeyValueInput, setPixKeyValueInput] = useState(paymentsSetup.pixKeyValue || state.settings.business.pixKey || "pix@luveastudio.app");
  const [pixKeyTypeInput, setPixKeyTypeInput] = useState<"cpf_cnpj" | "email" | "phone" | "random">(
    paymentsSetup.pixKeyType || "email"
  );
  const [pixProviderModeInput, setPixProviderModeInput] = useState<"direct_pix_key" | "mercadopago_api">(
    paymentsSetup.pixProviderMode || state.settings.business.pixProviderMode || "direct_pix_key"
  );
  const [mpAccessTokenInput, setMpAccessTokenInput] = useState(
    paymentsSetup.mercadopagoAccessToken || state.settings.business.mercadopagoAccessToken || ""
  );
  const [mpPublicKeyInput, setMpPublicKeyInput] = useState(
    paymentsSetup.mercadopagoPublicKey || state.settings.business.mercadopagoPublicKey || ""
  );
  const [payoutMethodInput, setPayoutMethodInput] = useState<"pix_key" | "bank_account">(
    paymentsSetup.payoutMethod === "bank_account" ? "bank_account" : "pix_key"
  );
  const [isTestingPix, setIsTestingPix] = useState(false);
  const [pixTestResult, setPixTestResult] = useState<{
    ok: boolean;
    mode: string;
    payload: string;
    merchantName: string;
    pixKeyUsed?: string;
    fallbackReason?: string;
  } | null>(null);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

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

  const handleToggleNotification = (id: string) => {
    setNotificationsConfig((prev) => {
      const updatedItems = prev.items.map((it) =>
        it.id === id ? { ...it, enabled: !it.enabled } : it
      );
      const updated = { ...prev, items: updatedItems };
      onUpdateState((st) =>
        updateWebsiteSetupConfig(st, { clientNotifications: updated })
      );
      return updated;
    });
  };

  const handleToggleChannel = (id: string, channel: "email" | "whatsapp") => {
    setNotificationsConfig((prev) => {
      const updatedItems = prev.items.map((it) => {
        if (it.id !== id) return it;
        const exists = it.channels.includes(channel);
        const newChannels = exists
          ? it.channels.filter((c) => c !== channel)
          : [...it.channels, channel];
        return {
          ...it,
          channels: newChannels,
          enabled: newChannels.length > 0 ? it.enabled : false,
        };
      });
      const updated = { ...prev, items: updatedItems };
      onUpdateState((st) =>
        updateWebsiteSetupConfig(st, { clientNotifications: updated })
      );
      return updated;
    });
  };

  // =========================================================================
  // GERENCIAMENTO ACESSÍVEL DE MODAIS (Escape, Foco Inicial, Trap & Scroll Lock)
  // =========================================================================
  const isAnyModalOpen = Boolean(
    previewNotification || editNotification || activeTaxModal || activePayoutModal
  );

  const closeCurrentModal = () => {
    if (previewNotification) setPreviewNotification(null);
    else if (editNotification) setEditNotification(null);
    else if (activeTaxModal) setActiveTaxModal(null);
    else if (activePayoutModal) setActivePayoutModal(null);
  };

  const activeDialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const editTemplateTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = (tag: string) => {
    if (!editNotification) return;
    const textarea = editTemplateTextareaRef.current;
    if (!textarea) {
      setEditNotification({
        ...editNotification,
        templateBody: editNotification.templateBody ? `${editNotification.templateBody} ${tag}` : tag,
      });
      return;
    }

    const start = textarea.selectionStart ?? editNotification.templateBody.length;
    const end = textarea.selectionEnd ?? editNotification.templateBody.length;
    const currentText = editNotification.templateBody || "";
    const newText = currentText.substring(0, start) + tag + currentText.substring(end);

    setEditNotification({
      ...editNotification,
      templateBody: newText,
    });

    setTimeout(() => {
      textarea.focus();
      const nextPos = start + tag.length;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  useEffect(() => {
    if (!isAnyModalOpen) return;

    // Salva o elemento previamente ativo para devolver o foco ao fechar
    previousActiveElementRef.current = document.activeElement as HTMLElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Mover foco inicial para o diálogo ou primeiro elemento interativo
    const timer = setTimeout(() => {
      if (activeDialogRef.current) {
        const focusable = activeDialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          activeDialogRef.current.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Fecha o diálogo com a tecla Escape
      if (e.key === "Escape") {
        e.preventDefault();
        closeCurrentModal();
        return;
      }

      // Armadilha de Foco (Focus Trap)
      if (e.key === "Tab" && activeDialogRef.current) {
        const focusable = activeDialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === "function") {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isAnyModalOpen, previewNotification, editNotification, activeTaxModal, activePayoutModal]);

  const handleTestStudioPix = async () => {
    setIsTestingPix(true);
    setPixTestResult(null);
    const activeKey = pixKeyValueInput.trim() || pixKey.trim() || "pix@luveastudio.app";
    try {
      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: `teste-${Date.now()}`,
          clientName: "Teste Configuração Estúdio",
          serviceName: "Validação Sinal Pix Anti-No-Show",
          depositCents: 100,
          subdomain: subdomainSlug,
          pixProviderMode: pixProviderModeInput,
          pixKey: activeKey,
          pixKeyType: pixKeyTypeInput,
          merchantName: businessName,
          merchantCity: city || "SAO PAULO",
          mercadopagoAccessToken: mpAccessTokenInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        setPixTestResult({
          ok: true,
          mode: data.mode || pixProviderModeInput,
          payload: data.pixCopiaECola || data.qrCodePayload || "",
          merchantName: data.merchantNameUsed || businessName,
          pixKeyUsed: data.pixKeyUsed || activeKey,
          fallbackReason: data.fallbackReason,
        });
      }
    } catch {
      // Fallback silencioso
    } finally {
      setIsTestingPix(false);
    }
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    const syncedPaymentsSetup = {
      ...paymentsSetup,
      payoutMethod: payoutMethodInput,
      pixKeyType: pixKeyTypeInput,
      pixKeyValue: pixKeyValueInput || pixKey,
      pixProviderMode: pixProviderModeInput,
      mercadopagoAccessToken: mpAccessTokenInput.trim(),
      mercadopagoPublicKey: mpPublicKeyInput.trim(),
      bankName: bankNameInput,
      routingOrAgency: bankAgencyInput,
      accountNumber: bankAccountInput,
      setupCompleted: true,
    };
    setPaymentsSetup(syncedPaymentsSetup);
    setPixKey(syncedPaymentsSetup.pixKeyValue);

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
        paymentsSetup: syncedPaymentsSetup,
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
        pixKey: syncedPaymentsSetup.pixKeyValue,
        pixProviderMode: pixProviderModeInput,
        mercadopagoAccessToken: mpAccessTokenInput.trim(),
        mercadopagoPublicKey: mpPublicKeyInput.trim(),
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans text-[#1C1C1E] dark:text-white">
      {/* Toast de Confirmação Flutuante */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-600 ring-2 ring-emerald-400/20 dark:ring-emerald-600/20" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5EA] dark:border-[#27272a] pb-5">
        <div>
          <h1 className="text-[26px] sm:text-[30px] font-serif font-normal tracking-tight text-[#1C1C1E] dark:text-white">
            Configurações
          </h1>
          <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
            Gerenciamento geral do estúdio, regras de agendamento online, rastreamento e notificações.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[13px] font-medium shadow-sm hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 shrink-0"
        >
          {isSaving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      {/* Abas Superiores Principais */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#E5E5EA] dark:border-[#27272a]">
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
                  ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] shadow-sm"
                  : "bg-transparent text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]"
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
                  <p className="text-[11.5px] text-[#6E6E73] mt-2">
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
                            className={`py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors px-3 rounded-2xl ${
                              notif.enabled
                                ? "hover:bg-[#FAFAFA] dark:hover:bg-[#27272a]/60"
                                : "opacity-75 bg-[#FAFAFC]/60 dark:bg-[#18181b]/40 hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]/40"
                            }`}
                          >
                            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                              {/* Interruptor Liga / Desliga (Accessible Switch) */}
                              <button
                                type="button"
                                role="switch"
                                aria-checked={notif.enabled}
                                aria-label={`Ativar ou pausar ${ptTitle}`}
                                onClick={() => handleToggleNotification(notif.id)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1C1C1E] dark:focus:ring-white focus:ring-offset-2 mt-0.5 ${
                                  notif.enabled
                                    ? "bg-[#1C1C1E] dark:bg-white"
                                    : "bg-[#E5E5EA] dark:bg-[#3f3f46]"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#18181b] shadow ring-0 transition duration-200 ease-in-out ${
                                    notif.enabled ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>

                              <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-[13.5px] font-semibold text-[#1C1C1E] dark:text-white">
                                    {ptTitle}
                                  </h4>
                                  {notif.badge === "novo" && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#ECE9FE] text-[#6D28D9]">
                                      Novo
                                    </span>
                                  )}
                                  {/* Micro-indicador de Status */}
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] text-[11px] font-medium text-[#1C1C1E] dark:text-white">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        notif.enabled
                                          ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                                          : "bg-[#6E6E73] dark:bg-[#a1a1aa]"
                                      }`}
                                    />
                                    <span>{notif.enabled ? "Ativo" : "Pausado"}</span>
                                  </span>
                                </div>

                                <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                                  {ptDesc}
                                </p>

                                {ptTiming && (
                                  <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa] pt-0.5">
                                    Disparo programado: <span className="font-medium text-[#1C1C1E] dark:text-white">{ptTiming}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Controles: Seleção Dinâmica de Canais & Ações */}
                            <div className="flex flex-wrap items-center gap-2.5 shrink-0 pl-14 lg:pl-0">
                              {/* Canais Interativos */}
                              <div className="flex items-center gap-1 p-1 bg-[#F5F5F7] dark:bg-[#27272a] rounded-full border border-[#E5E5EA] dark:border-[#3f3f46]">
                                <button
                                  type="button"
                                  onClick={() => handleToggleChannel(notif.id, "whatsapp")}
                                  className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition ${
                                    notif.channels.includes("whatsapp")
                                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] shadow-2xs"
                                      : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
                                  }`}
                                  title="Ativar/desativar envio via WhatsApp"
                                >
                                  WhatsApp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleChannel(notif.id, "email")}
                                  className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition ${
                                    notif.channels.includes("email")
                                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] shadow-2xs"
                                      : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
                                  }`}
                                  title="Ativar/desativar envio via E-mail"
                                >
                                  E-mail
                                </button>
                              </div>

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
                            className={`py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors px-3 rounded-2xl ${
                              notif.enabled
                                ? "hover:bg-[#FAFAFA] dark:hover:bg-[#27272a]/60"
                                : "opacity-75 bg-[#FAFAFC]/60 dark:bg-[#18181b]/40 hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]/40"
                            }`}
                          >
                            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                              {/* Interruptor Liga / Desliga (Accessible Switch) */}
                              <button
                                type="button"
                                role="switch"
                                aria-checked={notif.enabled}
                                aria-label={`Ativar ou pausar ${ptTitle}`}
                                onClick={() => handleToggleNotification(notif.id)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1C1C1E] dark:focus:ring-white focus:ring-offset-2 mt-0.5 ${
                                  notif.enabled
                                    ? "bg-[#1C1C1E] dark:bg-white"
                                    : "bg-[#E5E5EA] dark:bg-[#3f3f46]"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#18181b] shadow ring-0 transition duration-200 ease-in-out ${
                                    notif.enabled ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>

                              <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-[13.5px] font-semibold text-[#1C1C1E] dark:text-white">
                                    {ptTitle}
                                  </h4>
                                  {notif.badge === "gold" && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#FBF8EF] dark:bg-[#27272a] border border-[#F3E8C4] dark:border-[#3f3f46] text-[#8C6D1F] dark:text-[#f4f4f5]">
                                      Gold
                                    </span>
                                  )}
                                  {/* Micro-indicador de Status */}
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] text-[11px] font-medium text-[#1C1C1E] dark:text-white">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        notif.enabled
                                          ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                                          : "bg-[#6E6E73] dark:bg-[#a1a1aa]"
                                      }`}
                                    />
                                    <span>{notif.enabled ? "Ativo" : "Pausado"}</span>
                                  </span>
                                </div>

                                <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                                  {ptDesc}
                                </p>

                                {notif.timingLabel && (
                                  <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa] pt-0.5">
                                    Disparo programado: <span className="font-medium text-[#1C1C1E] dark:text-white">{notif.timingLabel}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Controles: Seleção Dinâmica de Canais & Ações */}
                            <div className="flex flex-wrap items-center gap-2.5 shrink-0 pl-14 lg:pl-0">
                              {/* Canais Interativos */}
                              <div className="flex items-center gap-1 p-1 bg-[#F5F5F7] dark:bg-[#27272a] rounded-full border border-[#E5E5EA] dark:border-[#3f3f46]">
                                <button
                                  type="button"
                                  onClick={() => handleToggleChannel(notif.id, "whatsapp")}
                                  className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition ${
                                    notif.channels.includes("whatsapp")
                                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] shadow-2xs"
                                      : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
                                  }`}
                                  title="Ativar/desativar envio via WhatsApp"
                                >
                                  WhatsApp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleChannel(notif.id, "email")}
                                  className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition ${
                                    notif.channels.includes("email")
                                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] shadow-2xs"
                                      : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
                                  }`}
                                  title="Ativar/desativar envio via E-mail"
                                >
                                  E-mail
                                </button>
                              </div>

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
                    <span className="text-[13px] text-[#6E6E73] font-mono select-none">https://</span>
                    <input
                      type="text"
                      value={subdomainSlug}
                      onChange={(e) => setSubdomainSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="flex-1 bg-transparent border-0 outline-none px-1 text-[13px] font-mono text-[#1C1C1E]"
                      placeholder="seuestudio"
                    />
                    <span className="text-[13px] text-[#6E6E73] font-mono select-none">.luvea.app</span>
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
                          <span className={`text-[13px] font-medium ${h.isOpen ? "text-[#1C1C1E]" : "text-[#6E6E73]"}`}>
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
                            <span className="text-[#6E6E73]">às</span>
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
                          <span className="text-[12px] text-[#6E6E73] italic">Fechado</span>
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
                <div className="border-b border-[#E5E5EA] dark:border-[#27272a] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E] dark:text-white">Cobrança &amp; Checkout</h2>
                  <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] mt-1">
                    Configurações de recebimento presencial, pagamentos por aproximação, parcelamento e tributação.
                  </p>
                </div>

                {/* Hero Editorial de Luxo - Maquininha Luvea Pro & Tap to Pay */}
                <div className="bg-[#F8F8FA] dark:bg-[#202023] border border-[#E5E5EA] dark:border-[#27272a] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2.5 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#3f3f46] text-[11.5px] font-medium text-[#1C1C1E] dark:text-white">
                      <Smartphone className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
                      <span>Tap to Pay no iPhone &amp; Maquininha Pro</span>
                    </div>
                    <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#1C1C1E] dark:text-white tracking-tight">
                      Pagamentos por aproximação sem aluguel
                    </h3>
                    <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                      Nossa solução integrada permite aceitar pagamentos por aproximação (contactless) diretamente no seu smartphone ou pela Maquininha Luvea Pro. Receba pagamentos no débito, crédito à vista ou parcelado com liquidação rápida.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#3f3f46] font-medium text-[#1C1C1E] dark:text-white">Visa</span>
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#3f3f46] font-medium text-[#1C1C1E] dark:text-white">Mastercard</span>
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#3f3f46] font-medium text-[#1C1C1E] dark:text-white">Elo</span>
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#3f3f46] font-medium text-[#1C1C1E] dark:text-white">Apple Pay</span>
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#3f3f46] font-medium text-[#1C1C1E] dark:text-white">Google Pay</span>
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#3f3f46] font-medium text-[#1C1C1E] dark:text-white">Pix Instantâneo</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => setActivePayoutModal("processing_info")}
                      className="px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[12.5px] font-medium transition-colors text-center"
                    >
                      Ver taxas e prazos
                    </button>
                  </div>
                </div>

                {/* Seção 1: Parcelamento sem Juros & BNPL */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">Parcelamento sem Juros &amp; BNPL</h3>
                    <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      Permita que seus clientes parcelem atendimentos e pacotes no cartão de crédito ou Pix parcelado.
                    </p>
                  </div>

                  {!paymentsSetup.identityVerified && (
                    <div className="bg-[#FFFBEB] dark:bg-amber-950/20 border border-[#FDE68A] dark:border-amber-900/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20 shrink-0" />
                        <p className="text-[12.5px] text-[#92400E] dark:text-amber-200">
                          Verifique sua identidade para configurar pagamentos e aceitar recebimentos parcelados (BNPL).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSubTab("payout_account");
                          setActivePayoutModal("identity_verification");
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#18181b] border border-[#FCD34D] dark:border-amber-700 text-[12px] font-medium text-[#78350F] dark:text-amber-200 hover:bg-[#FEF3C7] dark:hover:bg-amber-900/30 shrink-0 transition"
                      >
                        Verificar identidade
                      </button>
                    </div>
                  )}

                  <div className="divide-y divide-[#F2F2F7] dark:divide-[#27272a] border-y border-[#F2F2F7] dark:border-[#27272a]">
                    <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-0.5 max-w-xl">
                        <h4 className="text-[13.5px] font-medium text-[#1C1C1E] dark:text-white">Aceitar Parcelamento sem Juros (BNPL &amp; Pix Parcelado)</h4>
                        <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
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
                        <div className="w-11 h-6 bg-[#E5E5EA] dark:bg-[#3f3f46] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E] dark:peer-checked:bg-white"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Seção 2: Taxa de Tecnologia da Plataforma & Tributos */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">Taxa de Tecnologia da Plataforma &amp; Tributos</h3>
                    <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                      Reduza seus custos operacionais escolhendo quem assume a taxa de tecnologia da plataforma. Mantenha as alíquotas fiscais de serviços e varejo configuradas de acordo com seu regime tributário e município.
                    </p>
                  </div>

                  <div className="divide-y divide-[#F2F2F7] dark:divide-[#27272a] border-y border-[#F2F2F7] dark:border-[#27272a]">
                    {/* Taxa de Tecnologia */}
                    <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-0.5 max-w-xl">
                        <h4 className="text-[13.5px] font-medium text-[#1C1C1E] dark:text-white">Taxa de tecnologia da plataforma</h4>
                        <p className="text-[12.5px] font-medium text-[#1C1C1E] dark:text-white pt-0.5">
                          {checkoutSettings.technologyFeePayer === "studio" ? "Você paga" : "Cliente paga no checkout"}
                        </p>
                        <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
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
                        className="px-4 py-1.5 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[12.5px] font-medium transition-colors shrink-0"
                      >
                        Editar
                      </button>
                    </div>

                    {/* Imposto sobre Serviços */}
                    <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-0.5 max-w-xl">
                        <h4 className="text-[13.5px] font-medium text-[#1C1C1E] dark:text-white">Imposto sobre Serviços (ISS / Simples Nacional)</h4>
                        <p className="text-[12.5px] font-medium text-[#1C1C1E] dark:text-white pt-0.5">
                          {checkoutSettings.serviceSalesTaxPercent}%
                        </p>
                        <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
                          Alíquota estimada de imposto incidente sobre serviços de corte, coloração, estética e tratamentos para detalhamento em comandas e notas.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTempServiceTax(String(checkoutSettings.serviceSalesTaxPercent));
                          setActiveTaxModal("service_tax");
                        }}
                        className="px-4 py-1.5 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[12.5px] font-medium transition-colors shrink-0"
                      >
                        Editar
                      </button>
                    </div>

                    {/* Imposto sobre Venda de Produtos */}
                    <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-0.5 max-w-xl">
                        <h4 className="text-[13.5px] font-medium text-[#1C1C1E] dark:text-white">Imposto sobre Venda de Produtos (ICMS / Varejo)</h4>
                        <p className="text-[12.5px] font-medium text-[#1C1C1E] dark:text-white pt-0.5">
                          {checkoutSettings.retailSalesTaxPercent}%
                        </p>
                        <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
                          Alíquota estimada de tributos incidentes sobre a venda de cosméticos, produtos capilares e home care no salão.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTempRetailTax(String(checkoutSettings.retailSalesTaxPercent));
                          setActiveTaxModal("retail_tax");
                        }}
                        className="px-4 py-1.5 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[12.5px] font-medium transition-colors shrink-0"
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
                <div className="border-b border-[#E5E5EA] dark:border-[#27272a] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E] dark:text-white">Conta de Repasse &amp; Verificação</h2>
                  <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] mt-1 leading-relaxed max-w-2xl">
                    Para receber repasses automáticos de clientes pela LUVEA, é necessário verificar sua identidade e os dados cadastrais da sua empresa conforme as normas regulatórias do Banco Central do Brasil. Dúvidas? Fale com nosso suporte.
                  </p>
                </div>

                {/* Banner de Ação Necessária */}
                {!paymentsSetup.identityVerified ? (
                  <div className="bg-[#FFFBEB] dark:bg-amber-950/20 border border-[#FDE68A] dark:border-amber-900/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20 shrink-0" />
                      <p className="text-[12.5px] font-medium text-[#92400E] dark:text-amber-200">
                        Ação necessária! Atualize suas informações cadastrais para continuar recebendo pagamentos e repasses.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePayoutModal("identity_verification")}
                      className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#18181b] border border-[#FCD34D] dark:border-amber-700 text-[12px] font-medium text-[#78350F] dark:text-amber-200 hover:bg-[#FEF3C7] dark:hover:bg-amber-900/30 shrink-0 transition"
                    >
                      Completar dados
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#F6FDF9] dark:bg-emerald-950/20 border border-[#D1F2DF] dark:border-emerald-900/40 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
                      <p className="text-[12.5px] font-medium text-emerald-900 dark:text-emerald-200">
                        Identidade verificada com sucesso. Os repasses de vendas e sinais Pix são efetuados diariamente na sua conta.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      Em dia
                    </span>
                  </div>
                )}

                <div className="divide-y divide-[#F2F2F7] dark:divide-[#27272a] border-y border-[#F2F2F7] dark:border-[#27272a]">
                  {/* Item 1: Processamento de Pagamentos */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-[13.5px] font-medium text-[#1C1C1E] dark:text-white">Processamento de Pagamentos</h4>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          paymentsSetup.identityVerified ? "bg-[#F5F5F7] dark:bg-[#27272a] text-emerald-700 dark:text-emerald-400 border border-[#E5E5EA] dark:border-[#3f3f46]" : "bg-[#F5F5F7] dark:bg-[#27272a] text-[#71717A] dark:text-[#a1a1aa] border border-[#E5E5EA] dark:border-[#3f3f46]"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${paymentsSetup.identityVerified ? "bg-emerald-500 ring-2 ring-emerald-500/20" : "bg-[#A1A1AA]"}`} />
                          <span>{paymentsSetup.identityVerified ? "Ativo" : "Inativo"}</span>
                        </span>
                      </div>
                      <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
                        Liquidação de vendas, taxas de no-show via Pix e cobranças presenciais na comanda.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePayoutModal("processing_info")}
                      className="px-4 py-1.5 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[12.5px] font-medium transition-colors shrink-0"
                    >
                      Saiba mais
                    </button>
                  </div>

                  {/* Item 2: Verificação de Identidade */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-[13.5px] font-medium text-[#1C1C1E] dark:text-white">Verificação de Identidade</h4>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          paymentsSetup.identityVerified ? "bg-[#F5F5F7] dark:bg-[#27272a] text-emerald-700 dark:text-emerald-400 border border-[#E5E5EA] dark:border-[#3f3f46]" : "bg-[#FFFBEB] dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-[#FDE68A] dark:border-amber-800/40"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${paymentsSetup.identityVerified ? "bg-emerald-500 ring-2 ring-emerald-500/20" : "bg-amber-500 ring-2 ring-amber-500/20"}`} />
                          <span>{paymentsSetup.identityVerified ? "Verificado" : "Informações pendentes"}</span>
                        </span>
                      </div>
                      <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
                        Validação de conformidade legal perante o Banco Central do Brasil para liberação de repasses.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePayoutModal("identity_verification")}
                      className="px-4 py-1.5 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[12.5px] font-medium transition-colors shrink-0"
                    >
                      {paymentsSetup.identityVerified ? "Editar" : "Completar"}
                    </button>
                  </div>

                  {/* Item 3: Conta de Repasse */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E] dark:text-white">Conta de Repasse</h4>
                      <p className="text-[12px] text-[#1C1C1E] dark:text-white font-medium pt-0.5">
                        {paymentsSetup.payoutMethod === "pix_key"
                          ? `Chave Pix: ${paymentsSetup.pixKeyValue || pixKey}`
                          : `${paymentsSetup.bankName || "Nu Pagamentos S.A."} · Agência ${paymentsSetup.routingOrAgency || "0001"} · C/C ${paymentsSetup.accountNumber || "1234567-8"}`}
                      </p>
                      <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
                        Conta bancária ou chave Pix de titularidade da empresa para onde os valores são transferidos.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePayoutModal("payout_account")}
                      className="px-4 py-1.5 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[12.5px] font-medium transition-colors shrink-0"
                    >
                      {paymentsSetup.setupCompleted ? "Editar" : "Adicionar"}
                    </button>
                  </div>
                </div>

                {/* Motor Multi-Tenant Pix Anti-No-Show & Mercado Pago Exclusivo do Estúdio */}
                <div className="p-6 rounded-2xl bg-[#F5F5F7] dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5EA] dark:border-[#27272a] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white">
                          Motor Pix Anti-No-Show do Estúdio
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white border border-[#E5E5EA] dark:border-[#3f3f46]">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              pixProviderModeInput === "mercadopago_api" && !mpAccessTokenInput.trim()
                                ? "bg-amber-500 ring-2 ring-amber-500/20"
                                : "bg-emerald-500 ring-2 ring-emerald-500/20"
                            }`}
                          />
                          <span>
                            {pixProviderModeInput === "mercadopago_api"
                              ? mpAccessTokenInput.trim()
                                ? "Mercado Pago Conectado"
                                : "Token Pendente"
                              : "Chave Pix Direta Ativa"}
                          </span>
                        </span>
                      </div>
                      <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
                        Todo sinal pago pelos seus clientes na vitrine online ou no PDV vai 100% direto para a conta do seu estúdio.
                      </p>
                    </div>
                  </div>

                  {/* Seletor de Modo: Chave Pix Direta vs Mercado Pago Automático */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      aria-pressed={pixProviderModeInput === "direct_pix_key"}
                      onClick={() => setPixProviderModeInput("direct_pix_key")}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        pixProviderModeInput === "direct_pix_key"
                          ? "bg-white dark:bg-[#27272a] border-[#1C1C1E] dark:border-white shadow-xs"
                          : "bg-white/60 dark:bg-[#1f1f23] border-[#E5E5EA] dark:border-[#3f3f46] hover:border-[#D4D4D8]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                          Chave Pix Direta (Sem Taxa)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#F5F5F7] dark:bg-[#18181b] text-[#1C1C1E] dark:text-zinc-300 border border-[#E5E5EA] dark:border-[#3f3f46]">
                          Padrão BACEN
                        </span>
                      </div>
                      <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                        Gera QR Code oficial do Banco Central direto para a chave Pix do seu salão. Zero taxa de gateway e ativação imediata.
                      </p>
                    </button>

                    <button
                      type="button"
                      aria-pressed={pixProviderModeInput === "mercadopago_api"}
                      onClick={() => setPixProviderModeInput("mercadopago_api")}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        pixProviderModeInput === "mercadopago_api"
                          ? "bg-white dark:bg-[#27272a] border-[#1C1C1E] dark:border-white shadow-xs"
                          : "bg-white/60 dark:bg-[#1f1f23] border-[#E5E5EA] dark:border-[#3f3f46] hover:border-[#D4D4D8]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                          Mercado Pago do Estúdio
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#F5F5F7] dark:bg-[#18181b] text-[#1C1C1E] dark:text-zinc-300 border border-[#E5E5EA] dark:border-[#3f3f46]">
                          Baixa Automática
                        </span>
                      </div>
                      <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                        Usa o Access Token da conta Mercado Pago do seu salão. Confirma o agendamento sozinho assim que o cliente paga.
                      </p>
                    </button>
                  </div>

                  {pixProviderModeInput === "direct_pix_key" ? (
                    <div className="p-5 rounded-xl bg-white dark:bg-[#27272a]/60 border border-[#E5E5EA] dark:border-[#3f3f46] space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="studio-pix-key-type" className="block text-[12px] font-medium text-[#1C1C1E] dark:text-zinc-200 mb-1.5">
                            Tipo da Chave Pix
                          </label>
                          <select
                            id="studio-pix-key-type"
                            value={pixKeyTypeInput}
                            onChange={(e) =>
                              setPixKeyTypeInput(
                                e.target.value as "cpf_cnpj" | "email" | "phone" | "random"
                              )
                            }
                            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E]"
                          >
                            <option value="cpf_cnpj">CPF / CNPJ</option>
                            <option value="email">E-mail</option>
                            <option value="phone">Celular</option>
                            <option value="random">Chave Aleatória (EVP)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor="studio-direct-pix-key" className="block text-[12px] font-medium text-[#1C1C1E] dark:text-zinc-200 mb-1.5">
                            Chave Pix Oficial do Estúdio
                          </label>
                          <input
                            id="studio-direct-pix-key"
                            type="text"
                            value={pixKeyValueInput}
                            onChange={(e) => {
                              setPixKeyValueInput(e.target.value);
                              setPixKey(e.target.value);
                            }}
                            placeholder="Ex: 48.192.301/0001-82 ou financeiro@seu-estudio.com.br"
                            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] font-mono text-[#1C1C1E] dark:text-white placeholder:text-[#71717A] focus:outline-none focus:border-[#1C1C1E]"
                          />
                        </div>
                      </div>
                      <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
                        O QR Code gerado na sua vitrine (<span className="font-mono text-[#1C1C1E] dark:text-white">{subdomainSlug || "estudio"}.luvea.app</span>) usará o padrão EMV® QRCPS-MPM do Banco Central com o valor exato do sinal e nome <strong>{businessName}</strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl bg-white dark:bg-[#27272a]/60 border border-[#E5E5EA] dark:border-[#3f3f46] space-y-5">
                      {/* Guia Passo a Passo para o Dono do Salão */}
                      <div className="p-4 rounded-xl bg-[#F5F5F7] dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#3f3f46] space-y-2.5">
                        <h4 className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                          Como conectar a conta Mercado Pago do seu salão (2 minutos)
                        </h4>
                        <ol className="list-decimal pl-4 space-y-1.5 text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                          <li>
                            Acesse{" "}
                            <a
                              href="https://www.mercadopago.com.br/developers/panel/app"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-[#1C1C1E] dark:text-white underline underline-offset-2"
                            >
                              mercadopago.com.br/developers/panel/app
                            </a>{" "}
                            com a conta Mercado Pago da sua empresa e clique em <strong>Criar aplicação</strong>.
                          </li>
                          <li>
                            Informe o nome do seu salão, escolha <strong>Pagamentos online</strong> → <strong>Checkout Transparente</strong> → <strong>Pix</strong>.
                          </li>
                          <li>
                            No menu lateral esquerdo da aplicação, clique em <strong>Credenciais de produção</strong>, escolha a categoria do seu negócio e copie o <strong>Access Token</strong> (iniciado por <code className="font-mono text-[#1C1C1E] dark:text-zinc-200">APP_USR-...</code>).
                          </li>
                          <li>
                            Cole o token no campo abaixo e clique em <strong>Salvar alterações</strong>. Caso não preencha o token, o sistema usará automaticamente sua Chave Pix Direta como contingência.
                          </li>
                        </ol>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label htmlFor="studio-mp-access-token" className="block text-[12px] font-medium text-[#1C1C1E] dark:text-zinc-200 mb-1.5">
                            Access Token de Produção do Mercado Pago (Exclusivo do Estúdio)
                          </label>
                          <input
                            id="studio-mp-access-token"
                            type="password"
                            value={mpAccessTokenInput}
                            onChange={(e) => setMpAccessTokenInput(e.target.value)}
                            placeholder="APP_USR-0000000000000000-000000-00000000000000000000000000000000-000000000"
                            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] font-mono text-[#1C1C1E] dark:text-white placeholder:text-[#71717A] focus:outline-none focus:border-[#1C1C1E]"
                          />
                        </div>

                        <div>
                          <label htmlFor="studio-mp-fallback-pix" className="block text-[12px] font-medium text-[#1C1C1E] dark:text-zinc-200 mb-1.5">
                            Chave Pix de Contingência do Estúdio
                          </label>
                          <input
                            id="studio-mp-fallback-pix"
                            type="text"
                            value={pixKeyValueInput}
                            onChange={(e) => {
                              setPixKeyValueInput(e.target.value);
                              setPixKey(e.target.value);
                            }}
                            placeholder="Ex: financeiro@seu-estudio.com.br"
                            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] font-mono text-[#1C1C1E] dark:text-white placeholder:text-[#71717A] focus:outline-none focus:border-[#1C1C1E]"
                          />
                        </div>

                        <div>
                          <label htmlFor="studio-mp-webhook-url" className="block text-[12px] font-medium text-[#1C1C1E] dark:text-zinc-200 mb-1.5">
                            URL de Webhook do Estúdio (Opcional no Mercado Pago)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              id="studio-mp-webhook-url"
                              type="text"
                              readOnly
                              value={`https://luvea.app/api/webhooks/mercadopago?subdomain=${subdomainSlug || "estudio"}`}
                              className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-[#F5F5F7] dark:bg-[#18181b] text-[12px] font-mono text-[#6E6E73] dark:text-[#a1a1aa] select-all"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(
                                  `https://luvea.app/api/webhooks/mercadopago?subdomain=${subdomainSlug || "estudio"}`
                                );
                                setCopiedWebhookUrl(true);
                                setTimeout(() => setCopiedWebhookUrl(false), 2000);
                              }}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[12px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] transition shrink-0"
                            >
                              {copiedWebhookUrl ? "Copiado" : "Copiar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Barra de Teste Ao Vivo da Geração de Pix do Estúdio */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      Valide se o QR Code do seu estúdio está gerando o payload correto antes de publicar.
                    </p>
                    <button
                      type="button"
                      onClick={handleTestStudioPix}
                      disabled={isTestingPix}
                      className="min-h-[44px] px-4 py-2.5 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white hover:bg-[#E5E5EA]/50 text-[12.5px] font-medium transition-colors shrink-0 disabled:opacity-50 inline-flex items-center justify-center"
                    >
                      {isTestingPix ? "Gerando Pix de teste..." : "Testar geração de Pix (R$ 1,00)"}
                    </button>
                  </div>

                  {pixTestResult && (
                    <div className="p-4 rounded-xl bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                          <span className="text-[12.5px] font-semibold text-[#1C1C1E] dark:text-white">
                            {pixTestResult.mode === "mercadopago_orders_api"
                              ? "Pix Dinâmico Mercado Pago gerado na conta do estúdio"
                              : "BRCode Oficial Banco Central gerado para a chave do estúdio"}
                          </span>
                        </div>
                        <span className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
                          Recebedor: <strong className="text-[#1C1C1E] dark:text-white">{pixTestResult.merchantName}</strong>
                          {pixTestResult.pixKeyUsed ? ` · Chave: ${pixTestResult.pixKeyUsed}` : ""}
                        </span>
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={pixTestResult.payload}
                        aria-label="Payload Pix Copia e Cola de teste"
                        className="w-full px-3 py-2 rounded-lg bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] text-[11.5px] font-mono text-[#1C1C1E] dark:text-zinc-200 select-all"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 8. CONFORMIDADE & LGPD                                                     */}
            {/* ========================================================================= */}
            {subTab === "hipaa" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] dark:border-[#27272a] pb-5">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[20px] font-semibold text-[#1C1C1E] dark:text-white">Conformidade LGPD &amp; Privacidade</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] text-[#52525B] dark:text-[#a1a1aa]">
                      LGPD
                    </span>
                  </div>
                  <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] mt-1">
                    Políticas de privacidade de dados sensíveis, prontuários estéticos e fichas de anamnese.
                  </p>
                </div>
                <div className="divide-y divide-[#F2F2F7] dark:divide-[#27272a] border-y border-[#F2F2F7] dark:border-[#27272a]">
                  <div className="py-4 space-y-1">
                    <h4 className="text-[13.5px] font-medium text-[#1C1C1E] dark:text-white">Criptografia e Sigilo Profissional</h4>
                    <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                      Fórmulas cosméticas, fotos antes/depois e notas SOAP dos clientes são encriptadas de ponta a ponta e restritas exclusivamente aos profissionais autorizados do estúdio.
                    </p>
                  </div>
                  <div className="py-4 space-y-1">
                    <h4 className="text-[13.5px] font-medium text-[#1C1C1E] dark:text-white">Termo de Consentimento Livre e Esclarecido (TCLE)</h4>
                    <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
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
                      className="px-4 py-1.5 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[12.5px] font-medium transition-colors shrink-0"
                    >
                      Página da Equipe
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
                <div className="border-b border-[#E5E5EA] dark:border-[#27272a] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E] dark:text-white">Vales-Presente</h2>
                  <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] mt-1">
                    Permita a compra de vales-presente com resgate automático de saldo no atendimento.
                  </p>
                </div>
                <div className="divide-y divide-[#F2F2F7] dark:divide-[#27272a] border-y border-[#F2F2F7] dark:border-[#27272a]">
                  <div className="py-4 space-y-1">
                    <h4 className="text-[13.5px] font-medium text-[#1C1C1E] dark:text-white">Venda de Vouchers Ativa</h4>
                    <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
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
        <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#E5E5EA] dark:border-[#27272a] p-6 lg:p-8 space-y-6 max-w-2xl text-[#1C1C1E] dark:text-white">
          <div>
            <h2 className="text-[20px] font-semibold text-[#1C1C1E] dark:text-white">Dados Pessoais</h2>
            <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">Seu nome e contatos como responsável pela conta.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1">Primeiro Nome</label>
              <input
                type="text"
                value={personalFirst}
                onChange={(e) => setPersonalFirst(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1">Sobrenome</label>
              <input
                type="text"
                value={personalLast}
                onChange={(e) => setPersonalLast(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1">E-mail</label>
              <input
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1">Telefone WhatsApp</label>
              <input
                type="text"
                value={personalPhone}
                onChange={(e) => setPersonalPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
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
          <div className="pt-6 border-t border-[#E5E5EA] dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">Sessão da Conta</h3>
              <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
                Conectado atualmente como <span className="font-medium text-[#1C1C1E] dark:text-white">{personalEmail || state.settings.personal.email}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOutUser()}
              className="px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[12.5px] font-medium transition shadow-2xs self-start sm:self-auto flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <span>Sair da conta</span>
            </button>
          </div>
        </div>
      )}

      {topTab === "staff" && (
        <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#E5E5EA] dark:border-[#27272a] p-6 lg:p-8 space-y-6 text-[#1C1C1E] dark:text-white">
          <div>
            <h2 className="text-[20px] font-semibold text-[#1C1C1E] dark:text-white">Equipe de Especialistas</h2>
            <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
              Profissionais cadastrados, comissões de serviço e metas de faturamento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.staff.map((member) => (
              <div key={member.id} className="p-4 rounded-2xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-[#FAFAFA] dark:bg-[#27272a] space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-zinc-800"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-[13.5px] text-[#1C1C1E] dark:text-white">{member.fullName}</p>
                    <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">{member.role}</p>
                  </div>
                </div>
                <p className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa] pt-2 border-t border-[#E5E5EA] dark:border-[#3f3f46]">
                  Comissão: {member.serviceCommissionPercent}% serviços • {member.productCommissionPercent}% produtos
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {topTab === "whatsapp" && (
        <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#E5E5EA] dark:border-[#27272a] p-6 lg:p-8 space-y-6 text-[#1C1C1E] dark:text-white">
          <div>
            <h2 className="text-[20px] font-semibold text-[#1C1C1E] dark:text-white">WhatsApp &amp; Automação de Atendimento</h2>
            <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
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

      {topTab === "subscription" && (
        <SubscriptionSettingsSection
          state={state}
          onUpdateState={onUpdateState}
          selectedCycle={selectedCycle}
          onSelectCycle={setSelectedCycle}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PRÉVIA DA NOTIFICAÇÃO (WhatsApp vs E-mail)                       */}
      {/* ========================================================================= */}
      {previewNotification && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-preview-title"
          aria-describedby="modal-preview-desc"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCurrentModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            ref={activeDialogRef}
            tabIndex={-1}
            className="bg-white dark:bg-[#18181b] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#E5E5EA] dark:border-[#27272a] space-y-4 animate-in zoom-in-95 duration-200 text-[#1C1C1E] dark:text-white outline-none max-h-[90vh] flex flex-col"
          >
            {/* Header do Diálogo */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#27272a] shrink-0">
              <div>
                <h3 id="modal-preview-title" className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white">
                  Prévia da Notificação
                </h3>
                <p id="modal-preview-desc" className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">{previewNotification.title}</p>
              </div>
              <button
                type="button"
                aria-label="Fechar prévia da notificação"
                onClick={() => setPreviewNotification(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition focus-visible:ring-2 focus-visible:ring-[#1C1C1E] dark:focus-visible:ring-white focus-visible:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador de Canal */}
            <div className="flex items-center gap-2 p-1 bg-[#F5F5F7] dark:bg-[#27272a] rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] shrink-0">
              <button
                type="button"
                onClick={() => setNotificationPreviewChannel("whatsapp")}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition ${
                  notificationPreviewChannel === "whatsapp"
                    ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white shadow-sm"
                    : "text-[#6E6E73] dark:text-[#a1a1aa]"
                }`}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setNotificationPreviewChannel("email")}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition ${
                  notificationPreviewChannel === "email"
                    ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white shadow-sm"
                    : "text-[#6E6E73] dark:text-[#a1a1aa]"
                }`}
              >
                Layout HTML de E-mail
              </button>
            </div>

            {/* Prévia Visual com Rolagem Suave */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {notificationPreviewChannel === "whatsapp" ? (
                /* Prévia Fiel do WhatsApp */
                <div className="bg-[#EFEAE2] dark:bg-[#242628] p-4 sm:p-5 rounded-2xl border border-[#D1D1D6] dark:border-[#3a3c3e] space-y-2">
                  <div className="bg-white dark:bg-[#1f2c34] rounded-2xl rounded-tl-sm p-4 shadow-sm max-w-[90%] text-[13px] leading-relaxed text-[#1C1C1E] dark:text-[#e9edef] space-y-2">
                    <p className="whitespace-pre-wrap">
                      {previewNotification.templateBody
                        .replace(/{nome}/g, "Stefany")
                        .replace(/{estudio}/g, businessName)
                        .replace(/{data}/g, "24/10/2026")
                        .replace(/{horario}/g, "14:30")
                        .replace(/{servicos}/g, "Coloração & Iluminação")
                        .replace(/{google_review_link}/g, notificationsConfig.googleReviewLink || fullBookingUrl)}
                    </p>
                    <p className="text-[10px] text-right text-[#6E6E73] dark:text-[#a1a1aa]">14:31</p>
                  </div>
                </div>
              ) : (
                /* Prévia Fiel do Layout HTML de E-mail (Editorial Clean & Luxury Salon OS) */
                <div className="space-y-3">
                  {/* Cabeçalho do Cliente de E-mail */}
                  <div className="p-3.5 rounded-xl bg-[#F5F5F7] dark:bg-[#27272a]/60 border border-[#E5E5EA] dark:border-[#3f3f46] text-[12px] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center font-bold text-[11px]">
                          {(businessName || "L").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1C1C1E] dark:text-white leading-tight">
                            {businessName}
                          </p>
                          <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                            &lt;notificacoes@luvea.app&gt;
                          </p>
                        </div>
                      </div>
                      <span className="text-[10.5px] text-[#6E6E73] dark:text-[#a1a1aa]">Hoje, 14:30</span>
                    </div>

                    <div className="pt-2 border-t border-[#E5E5EA]/70 dark:border-[#3f3f46] flex flex-col gap-0.5">
                      <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                        Para: <span className="text-[#1C1C1E] dark:text-white font-medium">Stefany &lt;stefany@exemplo.com&gt;</span>
                      </p>
                      <p className="text-[12px] text-[#1C1C1E] dark:text-white font-semibold">
                        {previewNotification.templateSubject
                          ?.replace(/{estudio}/g, businessName)
                          .replace(/{nome}/g, "Stefany") || previewNotification.title}
                      </p>
                    </div>
                  </div>

                  {/* Canvas do Email HTML (Padrão Dark Luxury Studio) */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-[#09090b] border border-[#27272a]">
                    <div className="bg-[#18181b] rounded-[12px] border border-[#27272a] p-6 sm:p-8 space-y-6 max-w-[480px] mx-auto text-center font-sans">
                      {/* Top Brand Header */}
                      <div className="space-y-1">
                        <span className="text-[22px] font-bold tracking-[3px] text-white uppercase block">
                          LUVEA
                        </span>
                        <span className="text-[11px] font-medium tracking-[1.5px] text-[#a1a1aa] uppercase block">
                          {businessName || "Studio"}
                        </span>
                      </div>

                      {/* Divisor */}
                      <div className="h-px bg-[#27272a] w-full" />

                      {/* Título Principal */}
                      <div>
                        <h4 className="text-[19px] font-semibold text-white tracking-tight">
                          {previewNotification.id === "birthday"
                            ? "Parabéns, Stefany!"
                            : previewNotification.id === "post_service_review"
                            ? "Como foi sua experiência, Stefany?"
                            : previewNotification.id.includes("reminder")
                            ? "Lembrete de Horário"
                            : "Agendamento Confirmado"}
                        </h4>
                      </div>

                      {/* Corpo do Texto Personalizado */}
                      <div className="text-[13px] leading-relaxed text-[#a1a1aa] whitespace-pre-wrap text-center">
                        {previewNotification.templateBody
                          .replace(/{nome}/g, "Stefany")
                          .replace(/{estudio}/g, businessName)
                          .replace(/{data}/g, "24/10/2026")
                          .replace(/{horario}/g, "14:30")
                          .replace(/{servicos}/g, "Coloração & Iluminação")
                          .replace(/{google_review_link}/g, notificationsConfig.googleReviewLink || fullBookingUrl)}
                      </div>

                      {/* Card de Detalhes em #121214 */}
                      <div className="bg-[#121214] rounded-lg p-4 border border-[#27272a] space-y-2.5 text-left text-[12px]">
                        <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-[#27272a]">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[#71717a] block font-semibold">
                              SERVIÇO
                            </span>
                            <span className="font-medium text-white">
                              Coloração &amp; Iluminação
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[#71717a] block font-semibold">
                              PROFISSIONAL
                            </span>
                            <span className="font-medium text-white">
                              Bruno Fernandes
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-[#27272a]">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[#71717a] block font-semibold">
                              DATA
                            </span>
                            <span className="font-medium text-white">
                              24/10/2026
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[#71717a] block font-semibold">
                              HORÁRIO
                            </span>
                            <span className="font-medium text-white">
                              14:30
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#71717a] block font-semibold">
                            LOCAL
                          </span>
                          <span className="text-[#a1a1aa] block text-[11.5px]">
                            {addressLine1 || "Atendimento presencial no estúdio"}
                          </span>
                        </div>
                      </div>

                      {/* Botão de Ação CTA Branco */}
                      <div className="pt-2">
                        <span className="inline-block px-7 py-3 rounded-lg bg-white text-[#09090b] text-[13px] font-semibold tracking-wide shadow-sm">
                          {previewNotification.id === "post_service_review"
                            ? "Avaliar no Google Reviews"
                            : "Gerenciar Agendamento"}
                        </span>
                      </div>

                      {/* Link alternativo */}
                      <div className="text-[11px] text-[#71717a] leading-relaxed text-center">
                        Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:<br />
                        <span className="text-[#a1a1aa] underline break-all">
                          {notificationsConfig.googleReviewLink || fullBookingUrl}
                        </span>
                      </div>

                      {/* Divisor Footer */}
                      <div className="h-px bg-[#27272a] w-full" />

                      {/* Rodapé Editorial do E-mail */}
                      <div className="text-[11px] text-[#52525b] leading-relaxed text-center space-y-1">
                        <p>Notificação gerada automaticamente por {businessName}.</p>
                        <p>&copy; Luvea Studio &bull; luvea.app</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ação de Fechamento */}
            <div className="flex justify-end pt-2 border-t border-[#E5E5EA] dark:border-[#27272a] shrink-0">
              <button
                type="button"
                onClick={() => setPreviewNotification(null)}
                className="px-5 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition"
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-notif-title"
          aria-describedby="modal-edit-notif-desc"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCurrentModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            ref={activeDialogRef}
            tabIndex={-1}
            className="bg-white dark:bg-[#18181b] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5EA] dark:border-[#27272a] space-y-5 animate-in zoom-in-95 duration-200 text-[#1C1C1E] dark:text-white outline-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#27272a]">
              <div>
                <h3 id="modal-edit-notif-title" className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white">
                  Personalizar Notificação
                </h3>
                <p id="modal-edit-notif-desc" className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">{editNotification.title}</p>
              </div>
              <button
                type="button"
                aria-label="Fechar personalização da notificação"
                onClick={() => setEditNotification(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition focus-visible:ring-2 focus-visible:ring-[#1C1C1E] dark:focus-visible:ring-white focus-visible:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status e Canais de Envio */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#27272a]/50 border border-[#E5E5EA] dark:border-[#3f3f46]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={editNotification.enabled}
                  aria-label={`Ativar ou pausar ${editNotification.title}`}
                  onClick={() =>
                    setEditNotification({
                      ...editNotification,
                      enabled: !editNotification.enabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1C1C1E] dark:focus:ring-white focus:ring-offset-2 ${
                    editNotification.enabled
                      ? "bg-[#1C1C1E] dark:bg-white"
                      : "bg-[#E5E5EA] dark:bg-[#3f3f46]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#18181b] shadow ring-0 transition duration-200 ease-in-out ${
                      editNotification.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-[12.5px] font-medium text-[#1C1C1E] dark:text-white">
                  {editNotification.enabled ? "Notificação ativa" : "Notificação pausada"}
                </span>
              </div>

              {/* Seletor de Canais */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const hasWpp = editNotification.channels.includes("whatsapp");
                    const newChannels: ("email" | "whatsapp" | "sms")[] = hasWpp
                      ? editNotification.channels.filter((c) => c !== "whatsapp")
                      : [...editNotification.channels, "whatsapp"];
                    setEditNotification({
                      ...editNotification,
                      channels: newChannels,
                      enabled: newChannels.length > 0 ? editNotification.enabled : false,
                    });
                  }}
                  className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition ${
                    editNotification.channels.includes("whatsapp")
                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] shadow-2xs"
                      : "border border-[#D4D4D8] dark:border-[#3f3f46] text-[#6E6E73] dark:text-[#a1a1aa]"
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const hasEmail = editNotification.channels.includes("email");
                    const newChannels: ("email" | "whatsapp" | "sms")[] = hasEmail
                      ? editNotification.channels.filter((c) => c !== "email")
                      : [...editNotification.channels, "email"];
                    setEditNotification({
                      ...editNotification,
                      channels: newChannels,
                      enabled: newChannels.length > 0 ? editNotification.enabled : false,
                    });
                  }}
                  className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition ${
                    editNotification.channels.includes("email")
                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] shadow-2xs"
                      : "border border-[#D4D4D8] dark:border-[#3f3f46] text-[#6E6E73] dark:text-[#a1a1aa]"
                  }`}
                >
                  E-mail
                </button>
              </div>
            </div>

            {editNotification.channels.includes("email") && (
              <div>
                <label htmlFor="edit-notif-subject" className="block text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1">
                  Assunto do E-mail
                </label>
                <input
                  id="edit-notif-subject"
                  type="text"
                  value={editNotification.templateSubject || ""}
                  onChange={(e) =>
                    setEditNotification({
                      ...editNotification,
                      templateSubject: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E]"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="edit-notif-body" className="text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa]">
                  Texto da Mensagem
                </label>
                <span className="text-[10.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
                  {editNotification.templateBody.length} caracteres
                </span>
              </div>
              <textarea
                ref={editTemplateTextareaRef}
                id="edit-notif-body"
                rows={5}
                value={editNotification.templateBody}
                onChange={(e) =>
                  setEditNotification({
                    ...editNotification,
                    templateBody: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-[#6E6E73] dark:text-[#a1a1aa]">
                  Variáveis disponíveis (toque para inserir na posição do cursor):
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: "{nome}", label: "Nome do cliente" },
                  { tag: "{estudio}", label: "Nome do estúdio" },
                  { tag: "{data}", label: "Data do serviço" },
                  { tag: "{horario}", label: "Horário" },
                  { tag: "{servicos}", label: "Serviços agendados" },
                  { tag: "{google_review_link}", label: "Link de avaliação Google" },
                ].map(({ tag, label }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertVariable(tag)}
                    title={`Inserir ${label} no cursor`}
                    className="px-2.5 py-1 rounded-md bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] text-[11px] font-mono text-[#1C1C1E] dark:text-white hover:bg-[#E5E5EA] dark:hover:bg-[#3f3f46] transition cursor-pointer active:scale-95"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setEditNotification(null)}
                className="px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] text-[12.5px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]"
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
                className="px-5 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium hover:bg-[#2C2C2E] dark:hover:bg-zinc-200"
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-platform-fee-title"
          aria-describedby="modal-platform-fee-desc"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCurrentModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            ref={activeDialogRef}
            tabIndex={-1}
            className="bg-white dark:bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5EA] dark:border-[#27272a] space-y-5 animate-in zoom-in-95 duration-200 text-[#1C1C1E] dark:text-white outline-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#27272a]">
              <div>
                <h3 id="modal-platform-fee-title" className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white">Taxa de Tecnologia da Plataforma</h3>
                <p id="modal-platform-fee-desc" className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">Escolha quem assume a taxa operacional</p>
              </div>
              <button
                type="button"
                aria-label="Fechar taxa de tecnologia"
                onClick={() => setActiveTaxModal(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition focus-visible:ring-2 focus-visible:ring-[#1C1C1E] dark:focus-visible:ring-white focus-visible:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label
                onClick={() => setTempFeePayer("studio")}
                className={`p-4 rounded-2xl border cursor-pointer block transition-all ${
                  tempFeePayer === "studio"
                    ? "border-[#1C1C1E] dark:border-white bg-[#FAFAFA] dark:bg-[#27272a]"
                    : "border-[#E5E5EA] dark:border-[#3f3f46] hover:border-[#D4D4D8] dark:hover:border-[#52525b] bg-white dark:bg-[#18181b]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-semibold text-[#1C1C1E] dark:text-white">Você paga (Estúdio absorve)</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      tempFeePayer === "studio" ? "border-[#1C1C1E] dark:border-white bg-[#1C1C1E] dark:bg-white" : "border-[#D4D4D8] dark:border-[#52525b]"
                    }`}
                  >
                    {tempFeePayer === "studio" && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#18181b]" />}
                  </div>
                </div>
                <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] mt-1 leading-relaxed">
                  O estúdio assume integralmente os custos operacionais da plataforma. O cliente visualiza e paga exatamente o valor anunciado do serviço.
                </p>
              </label>

              <label
                onClick={() => setTempFeePayer("client")}
                className={`p-4 rounded-2xl border cursor-pointer block transition-all ${
                  tempFeePayer === "client"
                    ? "border-[#1C1C1E] dark:border-white bg-[#FAFAFA] dark:bg-[#27272a]"
                    : "border-[#E5E5EA] dark:border-[#3f3f46] hover:border-[#D4D4D8] dark:hover:border-[#52525b] bg-white dark:bg-[#18181b]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-semibold text-[#1C1C1E] dark:text-white">Cliente paga no checkout</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      tempFeePayer === "client" ? "border-[#1C1C1E] dark:border-white bg-[#1C1C1E] dark:bg-white" : "border-[#D4D4D8] dark:border-[#52525b]"
                    }`}
                  >
                    {tempFeePayer === "client" && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#18181b]" />}
                  </div>
                </div>
                <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] mt-1 leading-relaxed">
                  A taxa de tecnologia é discriminada no subtotal e cobrada do cliente no ato do checkout com transparência total.
                </p>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setActiveTaxModal(null)}
                className="px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] text-[12.5px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
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
                className="px-5 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition"
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-service-tax-title"
          aria-describedby="modal-service-tax-desc"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCurrentModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            ref={activeDialogRef}
            tabIndex={-1}
            className="bg-white dark:bg-[#18181b] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E5E5EA] dark:border-[#27272a] space-y-5 animate-in zoom-in-95 duration-200 text-[#1C1C1E] dark:text-white outline-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#27272a]">
              <div>
                <h3 id="modal-service-tax-title" className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white">Imposto sobre Serviços</h3>
                <p id="modal-service-tax-desc" className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">ISS / Simples Nacional</p>
              </div>
              <button
                type="button"
                aria-label="Fechar imposto sobre serviços"
                onClick={() => setActiveTaxModal(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition focus-visible:ring-2 focus-visible:ring-[#1C1C1E] dark:focus-visible:ring-white focus-visible:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="modal-service-tax-input" className="block text-[12px] font-medium text-[#71717A] dark:text-[#a1a1aa]">
                Alíquota estimada de imposto (%)
              </label>
              <div className="relative">
                <input
                  id="modal-service-tax-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={tempServiceTax}
                  onChange={(e) => setTempServiceTax(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[15px] font-medium font-mono text-[#1C1C1E] dark:text-white pr-8 focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
                />
                <span className="absolute right-3.5 top-2.5 text-[14px] text-[#71717A] dark:text-[#a1a1aa] pointer-events-none">%</span>
              </div>
              <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                Utilizada para discriminar encargos tributários nas comandas e faturas de serviços emitidas aos clientes.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setActiveTaxModal(null)}
                className="px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] text-[12.5px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
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
                className="px-5 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition"
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-retail-tax-title"
          aria-describedby="modal-retail-tax-desc"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCurrentModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            ref={activeDialogRef}
            tabIndex={-1}
            className="bg-white dark:bg-[#18181b] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E5E5EA] dark:border-[#27272a] space-y-5 animate-in zoom-in-95 duration-200 text-[#1C1C1E] dark:text-white outline-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#27272a]">
              <div>
                <h3 id="modal-retail-tax-title" className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white">Imposto sobre Produtos</h3>
                <p id="modal-retail-tax-desc" className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">ICMS / Varejo Home Care</p>
              </div>
              <button
                type="button"
                aria-label="Fechar imposto sobre produtos"
                onClick={() => setActiveTaxModal(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition focus-visible:ring-2 focus-visible:ring-[#1C1C1E] dark:focus-visible:ring-white focus-visible:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="modal-retail-tax-input" className="block text-[12px] font-medium text-[#71717A] dark:text-[#a1a1aa]">
                Alíquota estimada sobre produtos (%)
              </label>
              <div className="relative">
                <input
                  id="modal-retail-tax-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={tempRetailTax}
                  onChange={(e) => setTempRetailTax(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[15px] font-medium font-mono text-[#1C1C1E] dark:text-white pr-8 focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
                />
                <span className="absolute right-3.5 top-2.5 text-[14px] text-[#71717A] dark:text-[#a1a1aa] pointer-events-none">%</span>
              </div>
              <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                Incidente sobre cosméticos, shampoos, óleos e tratamentos capilares vendidos presencialmente no salão.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setActiveTaxModal(null)}
                className="px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] text-[12.5px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
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
                className="px-5 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition"
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-identity-title"
          aria-describedby="modal-identity-desc"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCurrentModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            ref={activeDialogRef}
            tabIndex={-1}
            className="bg-white dark:bg-[#18181b] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5EA] dark:border-[#27272a] space-y-5 animate-in zoom-in-95 duration-200 text-[#1C1C1E] dark:text-white outline-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#27272a]">
              <div>
                <h3 id="modal-identity-title" className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white">Verificação de Identidade (KYC)</h3>
                <p id="modal-identity-desc" className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">Conformidade regulatória Banco Central do Brasil</p>
              </div>
              <button
                type="button"
                aria-label="Fechar verificação de identidade"
                onClick={() => setActivePayoutModal(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition focus-visible:ring-2 focus-visible:ring-[#1C1C1E] dark:focus-visible:ring-white focus-visible:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="modal-id-legalname" className="block text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1">Razão Social ou Nome Fantasia</label>
                <input
                  id="modal-id-legalname"
                  type="text"
                  value={idLegalName}
                  onChange={(e) => setIdLegalName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-id-cnpjcpf" className="block text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1">CNPJ ou CPF do Negócio</label>
                  <input
                    id="modal-id-cnpjcpf"
                    type="text"
                    value={idCnpjCpf}
                    onChange={(e) => setIdCnpjCpf(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] font-mono text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
                  />
                </div>
                <div>
                  <label htmlFor="modal-id-repcpf" className="block text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1">CPF do Titular Administrador</label>
                  <input
                    id="modal-id-repcpf"
                    type="text"
                    value={idRepCpf}
                    onChange={(e) => setIdRepCpf(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] font-mono text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-id-repname" className="block text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1">Nome Completo do Responsável</label>
                <input
                  id="modal-id-repname"
                  type="text"
                  value={idRepName}
                  onChange={(e) => setIdRepName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-[11.5px] text-[#52525B] dark:text-[#d4d4d8] leading-relaxed">
                  Seus dados e documentos são criptografados com certificado TLS 1.3 de nível bancário e validados com as bases oficiais da Receita Federal.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setActivePayoutModal(null)}
                className="px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] text-[12.5px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
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
                className="px-5 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition"
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-payout-account-title"
          aria-describedby="modal-payout-account-desc"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCurrentModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            ref={activeDialogRef}
            tabIndex={-1}
            className="bg-white dark:bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5EA] dark:border-[#27272a] space-y-5 animate-in zoom-in-95 duration-200 text-[#1C1C1E] dark:text-white outline-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#27272a]">
              <div>
                <h3 id="modal-payout-account-title" className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white">Conta de Repasse</h3>
                <p id="modal-payout-account-desc" className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">Destino dos repasses e liquidações financeiras</p>
              </div>
              <button
                type="button"
                aria-label="Fechar conta de repasse"
                onClick={() => setActivePayoutModal(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition focus-visible:ring-2 focus-visible:ring-[#1C1C1E] dark:focus-visible:ring-white focus-visible:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador de Método */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F5F5F7] dark:bg-[#27272a] rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46]">
              <button
                type="button"
                onClick={() => setPayoutMethodInput("pix_key")}
                className={`py-1.5 text-[12.5px] font-medium rounded-lg transition-all ${
                  payoutMethodInput === "pix_key"
                    ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white shadow-xs"
                    : "text-[#71717A] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
                }`}
              >
                Chave Pix
              </button>
              <button
                type="button"
                onClick={() => setPayoutMethodInput("bank_account")}
                className={`py-1.5 text-[12.5px] font-medium rounded-lg transition-all ${
                  payoutMethodInput === "bank_account"
                    ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white shadow-xs"
                    : "text-[#71717A] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
                }`}
              >
                Conta Bancária
              </button>
            </div>

            {payoutMethodInput === "pix_key" ? (
              <div className="space-y-3">
                <div>
                  <label htmlFor="modal-payout-pix-input" className="block text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1">
                    Chave Pix (E-mail, CPF/CNPJ, Telefone ou Aleatória)
                  </label>
                  <input
                    id="modal-payout-pix-input"
                    type="text"
                    value={pixKeyValueInput}
                    onChange={(e) => setPixKeyValueInput(e.target.value)}
                    placeholder="ex: contato@luveastudio.app"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] font-mono text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717a]"
                  />
                </div>
                <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
                  Repasses automáticos via Pix são efetuados sem tarifa bancária para o titular da conta.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label htmlFor="modal-payout-bank-name" className="block text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1">Banco / Instituição</label>
                  <input
                    id="modal-payout-bank-name"
                    type="text"
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-payout-bank-agency" className="block text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1">Agência</label>
                    <input
                      id="modal-payout-bank-agency"
                      type="text"
                      value={bankAgencyInput}
                      onChange={(e) => setBankAgencyInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] font-mono text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-payout-bank-account" className="block text-[11.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] mb-1">Conta Corrente</label>
                    <input
                      id="modal-payout-bank-account"
                      type="text"
                      value={bankAccountInput}
                      onChange={(e) => setBankAccountInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[13px] font-mono text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setActivePayoutModal(null)}
                className="px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] text-[12.5px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
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
                className="px-5 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition"
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-processing-info-title"
          aria-describedby="modal-processing-info-desc"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCurrentModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            ref={activeDialogRef}
            tabIndex={-1}
            className="bg-white dark:bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5EA] dark:border-[#27272a] space-y-5 animate-in zoom-in-95 duration-200 text-[#1C1C1E] dark:text-white outline-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#27272a]">
              <div>
                <h3 id="modal-processing-info-title" className="text-[16px] font-semibold text-[#1C1C1E] dark:text-white">Taxas & Prazos de Liquidação</h3>
                <p id="modal-processing-info-desc" className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">Condições transparentes integradas à LUVEA</p>
              </div>
              <button
                type="button"
                aria-label="Fechar informações de processamento"
                onClick={() => setActivePayoutModal(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition focus-visible:ring-2 focus-visible:ring-[#1C1C1E] dark:focus-visible:ring-white focus-visible:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] space-y-1">
                <div className="flex items-center justify-between font-medium text-[#1C1C1E] dark:text-white">
                  <span>Pix Instantâneo & Sinais</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">0% · Imediato (D+0)</span>
                </div>
                <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
                  Sem taxas de intermediação bancária. O valor cai direto na sua conta cadastrada.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] space-y-1">
                <div className="flex items-center justify-between font-medium text-[#1C1C1E] dark:text-white">
                  <span>Cartão Débito & Crédito à Vista</span>
                  <span className="text-[#1C1C1E] dark:text-white font-semibold">1,99% a 3,19% · 1 dia útil (D+1)</span>
                </div>
                <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
                  Liquidação automática na sua conta sem necessidade de solicitar resgate manual.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] space-y-1">
                <div className="flex items-center justify-between font-medium text-[#1C1C1E] dark:text-white">
                  <span>Parcelamento sem Juros (BNPL)</span>
                  <span className="text-[#1C1C1E] dark:text-white font-semibold">6% + R$ 0,30 · D+1 integral</span>
                </div>
                <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
                  O estúdio recebe o valor total antecipado em 1 dia útil, enquanto o cliente parcela em até 12x.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] space-y-1">
                <div className="flex items-center justify-between font-medium text-[#1C1C1E] dark:text-white">
                  <span>Maquininha Luvea Pro</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">R$ 0 aluguel / mês</span>
                </div>
                <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
                  Sem metas mínimas de faturamento ou aluguel mensal de equipamento.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E5E5EA] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setActivePayoutModal(null)}
                className="px-5 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition"
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
