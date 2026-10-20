"use client";

import React, { useState } from "react";
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
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Image as ImageIcon,
  Sliders,
  ChevronRight,
  Eye,
  Edit3,
  Smartphone,
  Mail,
  MessageSquare,
  X,
  User,
  Users,
  CreditCard as SubscriptionIcon,
  CheckCircle2,
  Info,
} from "lucide-react";
import type {
  StudioState,
  WebsiteBookingSetupConfig,
  WebsiteTrackingConfig,
  SocialAccountsConfig,
  WebsiteContentSettings,
  BookingControlsConfig,
  ClientNotificationItem,
  DayBusinessHours,
} from "@/lib/agendaste-store";
import {
  updateWebsiteSetupConfig,
  updateStudioSettings,
  getDefaultWebsiteBookingConfig,
  getDefaultBookingControls,
  getDefaultClientNotifications,
} from "@/lib/agendaste-store";
import { WhatsAppConfigCard } from "@/components/agendaste/whatsapp-config-card";

interface SettingsViewProps {
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
  initialTab?: string;
  initialSubTab?: string;
}

type TopTabId = "personal" | "staff" | "business" | "subscription" | "whatsapp";
type BusinessSubTabId =
  | "business_details"
  | "locations"
  | "website"
  | "booking_controls"
  | "client_notifications"
  | "card_reader"
  | "payout_account"
  | "hipaa"
  | "gift_cards";

export function SettingsView({
  state,
  onUpdateState,
  initialTab = "business",
  initialSubTab = "website",
}: SettingsViewProps) {
  // Top Tabs
  const [topTab, setTopTab] = useState<TopTabId>(() => {
    if (initialTab && ["personal", "staff", "business", "subscription", "whatsapp"].includes(initialTab)) {
      return initialTab as TopTabId;
    }
    return "business";
  });

  // Business Sub-tabs
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
        "gift_cards",
      ].includes(initialSubTab)
    ) {
      return initialSubTab as BusinessSubTabId;
    }
    return "website";
  });

  // Base Website Config from State or Defaults
  const initialWebsite =
    state.settings.website ?? getDefaultWebsiteBookingConfig(state.settings.business.businessName);

  // Form States - Website & Tracking
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

  // Form States - Booking Controls
  const [bookingControls, setBookingControls] = useState<BookingControlsConfig>(
    initialWebsite.bookingControls ?? getDefaultBookingControls()
  );

  // Form States - Client Notifications
  const [notificationsConfig, setNotificationsConfig] = useState(
    initialWebsite.clientNotifications ?? getDefaultClientNotifications()
  );

  // Form States - Locations & Business Details
  const [businessName, setBusinessName] = useState(state.settings.business.businessName || "Luvea Studio");
  const [legalEntityType, setLegalEntityType] = useState(state.settings.business.legalEntityType || "Sociedade Limitada (LTDA) / Salão Parceiro");
  const [taxIdCnpjCpf, setTaxIdCnpjCpf] = useState(state.settings.business.taxIdCnpjCpf || "48.192.301/0001-82");
  const [pixKey, setPixKey] = useState(state.settings.business.pixKey || "pix@luveastudio.app");
  const [defaultDepositPercent, setDefaultDepositPercent] = useState(
    String(state.settings.business.defaultDepositPercent ?? 30)
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

  // Personal Info Form State
  const [personalFirst, setPersonalFirst] = useState(state.settings.personal.firstName);
  const [personalLast, setPersonalLast] = useState(state.settings.personal.lastName);
  const [personalEmail, setPersonalEmail] = useState(state.settings.personal.email);
  const [personalPhone, setPersonalPhone] = useState(state.settings.personal.phone);

  // UI state for clipboard & preview modal
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewNotification, setPreviewNotification] = useState<ClientNotificationItem | null>(null);
  const [editNotification, setEditNotification] = useState<ClientNotificationItem | null>(null);
  const [notificationPreviewChannel, setNotificationPreviewChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Copy site URL helper
  const fullBookingUrl = `https://${subdomainSlug || "luveastudio"}.luvea.app`;
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullBookingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Save all current business / website configurations
  const handleSaveAll = () => {
    setIsSaving(true);
    onUpdateState((prev) => {
      // 1. Atualiza website config
      const updatedWeb = updateWebsiteSetupConfig(prev, {
        subdomainSlug,
        aboutYourBusiness,
        heroImageUrl,
        socialAccounts,
        contentSettings,
        tracking,
        bookingControls,
        clientNotifications: notificationsConfig,
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

      // 2. Atualiza settings do negócio e pessoais
      const updated = updateStudioSettings(updatedWeb, {
        firstName: personalFirst,
        lastName: personalLast,
        email: personalEmail,
        phone: personalPhone,
        businessName,
        legalEntityType,
        taxIdCnpjCpf,
        pixKey,
        defaultDepositPercent: Math.min(100, Math.max(0, parseInt(defaultDepositPercent || "30", 10))),
      });

      return {
        ...updated,
        lastToastMessage: "Configurações salvas com sucesso!",
      };
    });

    setTimeout(() => {
      setIsSaving(false);
      setSaveToast("Configurações atualizadas");
      setTimeout(() => setSaveToast(null), 3000);
    }, 400);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans antialiased text-[#1C1C1E]">
      {/* Toast de Feedback */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Header & Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5EA] pb-6">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-serif font-normal tracking-tight text-[#1C1C1E]">
            Configurações
          </h1>
          <p className="text-[13px] text-[#6E6E73] mt-1">
            Personalize seu estúdio, regras de agendamento online, rastreamento e notificações automáticas.
          </p>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium shadow-sm hover:bg-[#2C2C2E] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      {/* Top 5 Primary Tabs (Apple & Linear refined pill design) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#E5E5EA]/60">
        {[
          { id: "business" as const, label: "Negócio (Business)", icon: Building2 },
          { id: "personal" as const, label: "Pessoal (Personal)", icon: User },
          { id: "staff" as const, label: "Equipe (Staff)", icon: Users },
          { id: "whatsapp" as const, label: "WhatsApp & Mensagens", icon: MessageSquare },
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

      {/* TAB: NEGÓCIO (BUSINESS) - Two Column Layout */}
      {topTab === "business" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Vertical Sub-Navigation Sidebar */}
          <aside className="lg:col-span-3 space-y-1 bg-[#FAFAFA] p-2 rounded-2xl border border-[#E5E5EA]/80">
            {[
              { id: "business_details" as const, label: "Business Details", icon: Building2 },
              { id: "locations" as const, label: "Locations", icon: MapPin, count: 1 },
              { id: "website" as const, label: "Website", icon: Globe },
              { id: "booking_controls" as const, label: "Booking Controls", icon: Sliders },
              { id: "client_notifications" as const, label: "Client Notifications", icon: Bell },
              { id: "card_reader" as const, label: "Card reader & Checkout", icon: CreditCard },
              { id: "payout_account" as const, label: "Payout account & Verification", icon: Wallet },
              { id: "hipaa" as const, label: "HIPAA Compliance & Prontuários", icon: ShieldCheck, tag: "Prática" },
              { id: "gift_cards" as const, label: "Gift Cards", icon: Gift },
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
                      ? "bg-[#1C1C1E] text-white shadow-sm"
                      : "text-[#52525B] hover:text-[#18181B] hover:bg-white/80"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#71717A]"}`} />
                    <span className="truncate">{item.label}</span>
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {item.count !== undefined && (
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold ${
                          isActive ? "bg-white/20 text-white" : "bg-[#E4E4E7] text-[#3F3F46]"
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                    {item.tag && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${
                          isActive ? "bg-white/20 text-white" : "bg-[#E4E4E7] text-[#52525B]"
                        }`}
                      >
                        {item.tag}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Quick Helper Box (Desktop) */}
            <div className="pt-4 px-2 mt-4 border-t border-[#E5E5EA]">
              <div className="p-3.5 rounded-xl bg-white border border-[#E5E5EA] text-[11.5px] text-[#6E6E73] space-y-1.5">
                <p className="font-semibold text-[#1C1C1E] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#1C1C1E]" />
                  Suporte &amp; Ajuda
                </p>
                <p>
                  As alterações feitas nos controles de agendamento têm efeito imediato em seu site público{" "}
                  <code className="text-[#1C1C1E] bg-[#F5F5F7] px-1 py-0.5 rounded text-[10.5px]">.luvea.app</code>.
                </p>
              </div>
            </div>
          </aside>

          {/* Right Main Content Panel */}
          <main className="lg:col-span-9 bg-white rounded-3xl border border-[#E5E5EA] p-6 sm:p-8 space-y-8 shadow-sm">
            {/* ========================================================================= */}
            {/* SUB-TAB 1: WEBSITE & TRACKING                                             */}
            {/* ========================================================================= */}
            {subTab === "website" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Your website</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-0.5">
                    View and share your booking site. You can edit the URL in the section below.
                  </p>
                </div>

                {/* Hero Preview Card */}
                <div className="rounded-2xl border border-[#E5E5EA] overflow-hidden bg-[#FAFAFA]">
                  <div className="h-44 sm:h-56 relative w-full overflow-hidden bg-zinc-900">
                    <img
                      src={heroImageUrl}
                      alt="Capa do site de agendamento"
                      className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-[11px] font-mono tracking-widest uppercase opacity-80">Luvea Booking</p>
                      <h3 className="text-xl font-medium tracking-tight drop-shadow-sm">{businessName}</h3>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-[14px] text-[#1C1C1E]">{businessName}</p>
                      <a
                        href={fullBookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12.5px] text-[#6E6E73] hover:text-[#1C1C1E] font-mono underline decoration-zinc-300 underline-offset-2"
                      >
                        {fullBookingUrl}
                      </a>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={fullBookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] text-[12.5px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition"
                      >
                        Ver site
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] text-[12.5px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition inline-flex items-center gap-1.5"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? "Copiado!" : "Copiar link"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newUrl = window.prompt("Insira a URL da nova imagem de capa:", heroImageUrl);
                          if (newUrl) setHeroImageUrl(newUrl);
                        }}
                        className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] text-[12.5px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition"
                      >
                        Trocar imagem
                      </button>
                    </div>
                  </div>
                </div>

                {/* Booking URL Input */}
                <div className="space-y-2 pt-2 border-t border-[#E5E5EA]">
                  <label className="block text-[13px] font-semibold text-[#1C1C1E]">Booking URL</label>
                  <p className="text-[12px] text-[#6E6E73]">
                    O endereço onde seus clientes acessarão seu catálogo e agendarão horários.
                  </p>
                  <div className="flex items-center rounded-xl border border-[#E5E5EA] bg-white px-3 py-2 focus-within:border-[#1C1C1E] focus-within:ring-1 focus-within:ring-[#1C1C1E]">
                    <span className="text-[13px] text-[#8E8E93] select-none font-mono">https://</span>
                    <input
                      type="text"
                      value={subdomainSlug}
                      onChange={(e) => setSubdomainSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="flex-1 bg-transparent border-0 outline-none px-1 text-[13px] font-mono text-[#1C1C1E]"
                      placeholder="seu-estudio"
                    />
                    <span className="text-[13px] text-[#8E8E93] select-none font-mono">.luvea.app</span>
                  </div>
                </div>

                {/* Website content: About your business */}
                <div className="space-y-2 pt-2 border-t border-[#E5E5EA]">
                  <label className="block text-[13px] font-semibold text-[#1C1C1E]">Website content</label>
                  <p className="text-[12px] text-[#6E6E73]">
                    Conte aos seus clientes sobre a essência, diferenciais e valores do seu estúdio.
                  </p>
                  <textarea
                    rows={3}
                    value={aboutYourBusiness}
                    onChange={(e) => setAboutYourBusiness(e.target.value)}
                    placeholder="About your business"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] text-[13.5px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] focus:ring-1 focus:ring-[#1C1C1E] resize-none"
                  />
                </div>

                {/* Social Accounts Grid */}
                <div className="space-y-3 pt-2 border-t border-[#E5E5EA]">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Social accounts</h3>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      Conecte seus perfis sociais para exibir ícones elegantes no rodapé do seu site de agendamento.
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Facebook</label>
                      <input
                        type="text"
                        value={socialAccounts.facebook}
                        onChange={(e) => setSocialAccounts({ ...socialAccounts, facebook: e.target.value })}
                        placeholder="facebook.com/seuestudio"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">X / Twitter</label>
                      <input
                        type="text"
                        value={socialAccounts.twitter}
                        onChange={(e) => setSocialAccounts({ ...socialAccounts, twitter: e.target.value })}
                        placeholder="@seuestudio"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Pinterest</label>
                      <input
                        type="text"
                        value={socialAccounts.pinterest}
                        onChange={(e) => setSocialAccounts({ ...socialAccounts, pinterest: e.target.value })}
                        placeholder="pinterest.com/seuestudio"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Yelp / Google Maps</label>
                      <input
                        type="text"
                        value={socialAccounts.yelp}
                        onChange={(e) => setSocialAccounts({ ...socialAccounts, yelp: e.target.value })}
                        placeholder="Link do perfil"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Website institucional</label>
                      <input
                        type="text"
                        value={socialAccounts.website}
                        onChange={(e) => setSocialAccounts({ ...socialAccounts, website: e.target.value })}
                        placeholder="https://suaempresa.com.br"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Settings (Toggles) */}
                <div className="space-y-4 pt-2 border-t border-[#E5E5EA]">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Content settings</h3>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      Defina quais seções interativas estarão visíveis para seus clientes no site.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        key: "showReviews" as const,
                        label: "Show reviews",
                        desc: "Display client reviews on your booking site",
                      },
                      {
                        key: "showPortfolioGallery" as const,
                        label: "Show portfolio gallery",
                        desc: "Show your work photos on your booking site",
                      },
                      {
                        key: "displayServicesVisually" as const,
                        label: "Display services visually",
                        desc: "Show service images in your booking menu",
                      },
                      {
                        key: "showTeam" as const,
                        label: "Show team",
                        desc: "Let clients browse and book specific team members",
                      },
                    ].map((row) => (
                      <div
                        key={row.key}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA]/70"
                      >
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

                {/* Website Tracking (Platinum Badge) */}
                <div className="space-y-4 pt-4 border-t border-[#E5E5EA]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Website tracking</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#1C1C1E] text-white">
                        Platinum
                      </span>
                    </div>
                  </div>

                  {/* Banner Platinum */}
                  <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[13px] font-semibold text-[#1C1C1E]">
                        Website tracking is available only on Platinum
                      </p>
                      <p className="text-[12px] text-[#6E6E73]">
                        Unlock customer behavior, conversion analytics and marketing pixels perfect for growing studios.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTopTab("subscription")}
                      className="px-4 py-2 rounded-full bg-[#1C1C1E] text-white text-[12.5px] font-medium hover:bg-[#2C2C2E] transition shrink-0"
                    >
                      Upgrade
                    </button>
                  </div>

                  {/* Google Analytics & Meta Pixel Inputs */}
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-2xl border border-[#E5E5EA] space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-[13.5px] font-semibold text-[#1C1C1E]">Google Analytics</h4>
                          <p className="text-[12px] text-[#6E6E73] mt-0.5">
                            Add a Google Analytics tracking ID to track user visits, conversions, and other customer
                            behavior on your booking site.{" "}
                            <span className="text-[#1C1C1E] underline cursor-pointer">Saiba mais</span>
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">
                          Google Analytics tracking ID
                        </label>
                        <input
                          type="text"
                          value={tracking.googleAnalyticsId}
                          onChange={(e) => setTracking({ ...tracking, googleAnalyticsId: e.target.value })}
                          placeholder="G-XXXXXXXXXX ou UA-XXXXXXXX-X"
                          className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] font-mono text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-[#E5E5EA] space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-[13.5px] font-semibold text-[#1C1C1E]">Meta Pixel</h4>
                          <p className="text-[12px] text-[#6E6E73] mt-0.5">
                            Use a Meta Pixel ID to track and optimize the results of your Facebook &amp; Instagram
                            advertising on your booking site.{" "}
                            <span className="text-[#1C1C1E] underline cursor-pointer">Saiba mais</span>
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Meta Pixel ID</label>
                        <input
                          type="text"
                          value={tracking.metaPixelId}
                          onChange={(e) => setTracking({ ...tracking, metaPixelId: e.target.value })}
                          placeholder="123456789012345"
                          className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] font-mono text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-tab Footer Save Action */}
                <div className="pt-6 border-t border-[#E5E5EA] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium hover:bg-[#2C2C2E] transition shadow-sm"
                  >
                    Salvar alterações
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 2: BOOKING CONTROLS                                               */}
            {/* ========================================================================= */}
            {subTab === "booking_controls" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Booking Controls</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-0.5">
                    Configure aprovação automática, janelas de antecedência, minimização de vácuos na agenda e regras
                    contra faltas.
                  </p>
                </div>

                {/* Location Reference Banner */}
                <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA] flex items-center justify-between text-[12.5px] text-[#6E6E73]">
                  <span>Looking for online booking settings? Configure each location specifically.</span>
                  <button
                    type="button"
                    onClick={() => setSubTab("locations")}
                    className="text-[#1C1C1E] font-medium underline underline-offset-2 ml-2 shrink-0"
                  >
                    Ver locais
                  </button>
                </div>

                {/* Auto-approve appointments */}
                <div className="space-y-2 pt-2 border-t border-[#E5E5EA]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Auto-approve appointments</h3>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        {bookingControls.autoApproveMode === "always"
                          ? "Every appointment will be automatically approved."
                          : "You will manually review and confirm each booking request."}
                      </p>
                    </div>
                    <select
                      value={bookingControls.autoApproveMode}
                      onChange={(e) =>
                        setBookingControls({
                          ...bookingControls,
                          autoApproveMode: e.target.value as "always" | "manual",
                        })
                      }
                      className="px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] bg-white focus:border-[#1C1C1E] focus:outline-none shrink-0"
                    >
                      <option value="always">Sempre (Always)</option>
                      <option value="manual">Aprovação manual</option>
                    </select>
                  </div>
                </div>

                {/* Booking window (in hours) */}
                <div className="space-y-2 pt-2 border-t border-[#E5E5EA]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Booking window (in hours)</h3>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Enter the number of hours notice you require from clients to book an upcoming appointment.
                      </p>
                    </div>
                    <select
                      value={bookingControls.bookingWindowHours}
                      onChange={(e) =>
                        setBookingControls({
                          ...bookingControls,
                          bookingWindowHours: parseInt(e.target.value, 10),
                        })
                      }
                      className="px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] bg-white focus:border-[#1C1C1E] focus:outline-none w-36"
                    >
                      <option value={1}>1 hora</option>
                      <option value={2}>2 horas</option>
                      <option value={4}>4 horas</option>
                      <option value={12}>12 horas</option>
                      <option value={24}>24 horas</option>
                      <option value={48}>48 horas</option>
                    </select>
                  </div>
                </div>

                {/* Booking increments */}
                <div className="space-y-2 pt-2 border-t border-[#E5E5EA]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Booking increments</h3>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Controls the time increments clients can book at and how your calendar time slots are divided.
                      </p>
                    </div>
                    <select
                      value={bookingControls.bookingIncrementsMinutes}
                      onChange={(e) =>
                        setBookingControls({
                          ...bookingControls,
                          bookingIncrementsMinutes: parseInt(e.target.value, 10),
                        })
                      }
                      className="px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] bg-white focus:border-[#1C1C1E] focus:outline-none w-36"
                    >
                      <option value={15}>15 mins</option>
                      <option value={30}>30 mins</option>
                      <option value={45}>45 mins</option>
                      <option value={60}>60 mins</option>
                    </select>
                  </div>
                </div>

                {/* Minimize Scheduling Gaps (New Badge) */}
                <div className="space-y-3 pt-2 border-t border-[#E5E5EA]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Minimize Scheduling Gaps</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#ECE9FE] text-[#6D28D9]">
                          New
                        </span>
                      </div>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5 max-w-xl">
                        Show clients only the times next to your existing bookings. Works best if your calendar usually
                        fills up.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
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
                    <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA] grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">
                          Set your maximum gap
                        </label>
                        <select
                          value={bookingControls.maxGapMinutes}
                          onChange={(e) =>
                            setBookingControls({
                              ...bookingControls,
                              maxGapMinutes: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E5EA] text-[13px] bg-white"
                        >
                          <option value={15}>15 minutos</option>
                          <option value={30}>30 minutos</option>
                          <option value={45}>45 minutos</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Select providers</label>
                        <select
                          value={bookingControls.gapProviderScope}
                          onChange={(e) =>
                            setBookingControls({
                              ...bookingControls,
                              gapProviderScope: e.target.value as "all" | "selected",
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E5EA] text-[13px] bg-white"
                        >
                          <option value="all">Todos os profissionais (All)</option>
                          <option value="selected">Profissionais selecionados</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Require card / Pix guarantee on file */}
                <div className="space-y-2 pt-2 border-t border-[#E5E5EA]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Require card on file / Garantia Pix</h3>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        All clients must provide a guarantee to book online; they won't be charged until you check them
                        out.
                      </p>
                    </div>
                    <select
                      value={bookingControls.requireCardOnFile}
                      onChange={(e) =>
                        setBookingControls({
                          ...bookingControls,
                          requireCardOnFile: e.target.value as "all" | "new_clients" | "none",
                        })
                      }
                      className="px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] bg-white focus:border-[#1C1C1E] focus:outline-none w-48"
                    >
                      <option value="all">Para todos os clientes</option>
                      <option value="new_clients">Apenas novos clientes</option>
                      <option value="none">Desativado</option>
                    </select>
                  </div>
                </div>

                {/* Advance Booking */}
                <div className="space-y-2 pt-2 border-t border-[#E5E5EA]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Advance Booking</h3>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Limits how many months in advance clients can book appointments online starting from today.
                      </p>
                    </div>
                    <select
                      value={bookingControls.advanceBookingMonths}
                      onChange={(e) =>
                        setBookingControls({
                          ...bookingControls,
                          advanceBookingMonths: parseInt(e.target.value, 10),
                        })
                      }
                      className="px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] bg-white focus:border-[#1C1C1E] focus:outline-none w-36"
                    >
                      <option value={1}>1 mês</option>
                      <option value={2}>2 meses</option>
                      <option value={3}>3 meses</option>
                      <option value={6}>6 meses</option>
                      <option value={12}>12 meses</option>
                    </select>
                  </div>
                </div>

                {/* Processing Time Booking & Pronouns */}
                <div className="space-y-3 pt-2 border-t border-[#E5E5EA]">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA]/70">
                    <div>
                      <p className="text-[13px] font-medium text-[#1C1C1E]">Allow processing time booking</p>
                      <p className="text-[12px] text-[#6E6E73]">
                        Clients can book appointments during processing time (janela de pausa química ou anestésica).
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

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA]/70">
                    <div>
                      <p className="text-[13px] font-medium text-[#1C1C1E]">Ask clients for pronouns on booking form</p>
                      <p className="text-[12px] text-[#6E6E73]">The client pronouns will be added to the client profile.</p>
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
                </div>

                {/* Cancellations Section */}
                <div className="space-y-4 pt-4 border-t border-[#E5E5EA]">
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#1C1C1E]">Cancellations</h3>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      Defina as políticas de cancelamento, janela de tolerância e taxa de no-show para proteger seu
                      tempo.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA]/70">
                      <div>
                        <p className="text-[13px] font-medium text-[#1C1C1E]">Online cancellation</p>
                        <p className="text-[12px] text-[#6E6E73]">
                          Allow clients to cancel and reschedule their appointments online.
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

                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA]/70">
                      <div>
                        <p className="text-[13px] font-medium text-[#1C1C1E]">Cancellation policy required</p>
                        <p className="text-[12px] text-[#6E6E73]">
                          Clients will be required to acknowledge that they read your Cancellation policy at the
                          booking.
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

                  {/* Policy Details Textarea */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[12.5px] font-semibold text-[#1C1C1E]">
                      Cancellation policy details
                    </label>
                    <p className="text-[12px] text-[#6E6E73]">
                      Cancellation policy will be shown on the ‘About’ page and checkout modal of your website.
                    </p>
                    <textarea
                      rows={3}
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
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] resize-none"
                    />
                  </div>

                  {/* Fee & Window Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 rounded-2xl border border-[#E5E5EA] space-y-1.5">
                      <label className="block text-[13px] font-semibold text-[#1C1C1E]">Cancellation fee (%)</label>
                      <p className="text-[11.5px] text-[#6E6E73]">
                        Prevent no-shows and protect your time with a no-show fee. Members generally set between 20–30%.
                      </p>
                      <div className="flex items-center gap-2 pt-2">
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
                          className="w-28 px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[14px] font-mono font-bold text-[#1C1C1E]"
                        />
                        <span className="text-[13px] font-medium text-[#6E6E73]">% do valor total</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-[#E5E5EA] space-y-1.5">
                      <label className="block text-[13px] font-semibold text-[#1C1C1E]">
                        Cancellation window (in hours)
                      </label>
                      <p className="text-[11.5px] text-[#6E6E73]">
                        How far in advance your clients can cancel appointments online without contacting you.
                      </p>
                      <div className="pt-2">
                        <select
                          value={bookingControls.cancellations.windowHours}
                          onChange={(e) =>
                            setBookingControls({
                              ...bookingControls,
                              cancellations: {
                                ...bookingControls.cancellations,
                                windowHours: parseInt(e.target.value, 10),
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] bg-white"
                        >
                          <option value={12}>12 horas antes</option>
                          <option value={24}>24 horas antes</option>
                          <option value={48}>48 horas antes</option>
                          <option value={72}>72 horas antes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Waitlist Section (Gold Badge) */}
                <div className="space-y-3 pt-4 border-t border-[#E5E5EA]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Waitlist</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#FBF8EF] border border-[#F3E8C4] text-[#8C6D1F]">
                          Gold
                        </span>
                      </div>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Allow clients that are unable to find a preferable time for an appointment to add themselves to
                        your waitlist.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
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

                {/* Sub-tab Footer Save Action */}
                <div className="pt-6 border-t border-[#E5E5EA] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium hover:bg-[#2C2C2E] transition shadow-sm"
                  >
                    Salvar alterações
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 3: CLIENT NOTIFICATIONS                                           */}
            {/* ========================================================================= */}
            {subTab === "client_notifications" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Client Notifications</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-0.5">
                    Customize the automated email, WhatsApp and text alerts that get sent to your clients before and
                    after appointments.
                  </p>
                </div>

                {/* HIPAA Notice Banner */}
                <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA] text-[12.5px] text-[#6E6E73] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1C1C1E] shrink-0" />
                  <span>
                    Notifications look different for users with the HIPAA/LGPD add-on. Informações de anamnese são
                    protegidas.
                  </span>
                </div>

                {/* Pre-Appointment Notifications */}
                <div className="space-y-3 pt-2">
                  <div className="border-b border-[#E5E5EA] pb-2">
                    <h3 className="text-[15px] font-semibold text-[#1C1C1E]">Pre-appointment notifications</h3>
                    <p className="text-[12px] text-[#6E6E73]">
                      Lembretes e confirmações automáticos disparados antes da data do atendimento.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {notificationsConfig.items
                      .filter((item) => item.category === "pre_appointment")
                      .map((notif) => (
                        <div
                          key={notif.id}
                          className="p-4 rounded-2xl border border-[#E5E5EA] hover:border-[#D1D1D6] transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-[14px] font-semibold text-[#1C1C1E]">{notif.title}</h4>
                              {notif.badge === "novo" && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#ECE9FE] text-[#6D28D9]">
                                  Novo
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] text-[#6E6E73]">{notif.description}</p>
                            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#8E8E93]">
                              <span className="font-medium text-[#1C1C1E]">
                                Envio: {notif.channels.map((c) => (c === "whatsapp" ? "WhatsApp" : c.toUpperCase())).join(", ")}
                              </span>
                              {notif.timingLabel && <span>• {notif.timingLabel}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditNotification(notif)}
                              className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] text-[12px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition"
                            >
                              Customize
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewNotification(notif);
                                setNotificationPreviewChannel(notif.channels.includes("whatsapp") ? "whatsapp" : "email");
                              }}
                              className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] text-[12px] font-medium text-[#1C1C1E] hover:bg-[#E5E5EA] transition inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Post-Appointment Notifications */}
                <div className="space-y-4 pt-4 border-t border-[#E5E5EA]">
                  <div className="border-b border-[#E5E5EA] pb-2">
                    <h3 className="text-[15px] font-semibold text-[#1C1C1E]">Post-appointment notifications</h3>
                    <p className="text-[12px] text-[#6E6E73]">
                      Lembretes pós-serviço, solicitações de avaliação e mensagens de fidelização.
                    </p>
                  </div>

                  {/* Google Review Box */}
                  <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA] space-y-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[14px] font-semibold text-[#1C1C1E]">Review request</h4>
                      </div>
                      <p className="text-[12px] text-[#6E6E73]">
                        Adds a note for clients to review you inside their receipts &amp; WhatsApp follow ups.
                      </p>
                    </div>

                    <div className="pt-1">
                      <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">
                        Google review link (Compartilhe o perfil do Google Meu Negócio)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={notificationsConfig.googleReviewLink}
                          onChange={(e) =>
                            setNotificationsConfig({ ...notificationsConfig, googleReviewLink: e.target.value })
                          }
                          placeholder="https://g.page/r/seuestudio/review"
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] bg-white focus:border-[#1C1C1E] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            handleSaveAll();
                            setSaveToast("Link do Google Review salvo");
                          }}
                          className="px-4 py-2.5 rounded-xl bg-[#1C1C1E] text-white text-[12.5px] font-medium hover:bg-[#2C2C2E] transition"
                        >
                          Salvar link
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rest of Post-Appointment Cards */}
                  <div className="space-y-3">
                    {notificationsConfig.items
                      .filter((item) => item.category === "post_appointment" && item.id !== "post-review")
                      .map((notif) => (
                        <div
                          key={notif.id}
                          className="p-4 rounded-2xl border border-[#E5E5EA] hover:border-[#D1D1D6] transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-[14px] font-semibold text-[#1C1C1E]">{notif.title}</h4>
                              {notif.badge === "gold" && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#FBF8EF] border border-[#F3E8C4] text-[#8C6D1F]">
                                  Gold
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] text-[#6E6E73]">{notif.description}</p>
                            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#8E8E93]">
                              <span className="font-medium text-[#1C1C1E]">
                                Envio: {notif.channels.map((c) => (c === "whatsapp" ? "WhatsApp" : c.toUpperCase())).join(", ")}
                              </span>
                              {notif.timingLabel && <span>• {notif.timingLabel}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditNotification(notif)}
                              className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] text-[12px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition"
                            >
                              Customize
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewNotification(notif);
                                setNotificationPreviewChannel(notif.channels.includes("whatsapp") ? "whatsapp" : "email");
                              }}
                              className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] text-[12px] font-medium text-[#1C1C1E] hover:bg-[#E5E5EA] transition inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Sub-tab Footer Save Action */}
                <div className="pt-6 border-t border-[#E5E5EA] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium hover:bg-[#2C2C2E] transition shadow-sm"
                  >
                    Salvar alterações
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 4: LOCATIONS & BUSINESS HOURS                                     */}
            {/* ========================================================================= */}
            {subTab === "locations" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Locations</h2>
                    <p className="text-[13px] text-[#6E6E73] mt-0.5">
                      Configure o endereço físico do estúdio, atendimento a domicílio e horário de funcionamento.
                    </p>
                  </div>
                </div>

                {/* Fixed vs House Calls */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA]/70">
                    <div>
                      <p className="text-[13px] font-medium text-[#1C1C1E]">Accept booking at a fixed location</p>
                      <p className="text-[12px] text-[#6E6E73]">See clients at a fixed salon or studio location.</p>
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

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA]/70">
                    <div>
                      <p className="text-[13px] font-medium text-[#1C1C1E]">Accept house calls</p>
                      <p className="text-[12px] text-[#6E6E73]">
                        If a client's location is too far, you can decline the booking.
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

                {/* Address Details */}
                {hasFixedAddress && (
                  <div className="space-y-4 pt-2 border-t border-[#E5E5EA]">
                    <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Location details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">
                          Endereço (Rua, Av, etc)
                        </label>
                        <input
                          type="text"
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">
                          Complemento (Opcional)
                        </label>
                        <input
                          type="text"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Cidade</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">CEP</label>
                        <input
                          type="text"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Estado (UF)</label>
                        <input
                          type="text"
                          value={stateUF}
                          onChange={(e) => setStateUF(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Location Hours (Mon-Sun) */}
                <div className="space-y-3 pt-2 border-t border-[#E5E5EA]">
                  <h3 className="text-[14px] font-semibold text-[#1C1C1E]">Location hours</h3>
                  <div className="space-y-2">
                    {businessHours.map((h, idx) => (
                      <div
                        key={h.dayOfWeek}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5EA]/70 gap-3"
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
                          <div className="flex items-center gap-2 text-[12.5px]">
                            <input
                              type="time"
                              value={h.startTime}
                              onChange={(e) => {
                                const updated = [...businessHours];
                                updated[idx] = { ...updated[idx], startTime: e.target.value };
                                setBusinessHours(updated);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-[#E5E5EA] bg-white text-[12px] font-mono text-[#1C1C1E]"
                            />
                            <span className="text-[#8E8E93]">até</span>
                            <input
                              type="time"
                              value={h.endTime}
                              onChange={(e) => {
                                const updated = [...businessHours];
                                updated[idx] = { ...updated[idx], endTime: e.target.value };
                                setBusinessHours(updated);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-[#E5E5EA] bg-white text-[12px] font-mono text-[#1C1C1E]"
                            />
                          </div>
                        ) : (
                          <span className="text-[12px] text-[#8E8E93] italic">Fechado</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-tab Footer Save Action */}
                <div className="pt-6 border-t border-[#E5E5EA] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium hover:bg-[#2C2C2E] transition shadow-sm"
                  >
                    Salvar alterações
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 5: BUSINESS DETAILS                                               */}
            {/* ========================================================================= */}
            {subTab === "business_details" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Business Details</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-0.5">
                    Informações legais, cadastrais e fiscais do seu estabelecimento no Brasil.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                      Nome do Estúdio / Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] text-[13.5px] text-[#1C1C1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                      Tipo Societário / Estrutura
                    </label>
                    <input
                      type="text"
                      value={legalEntityType}
                      onChange={(e) => setLegalEntityType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] text-[13.5px] text-[#1C1C1E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">CNPJ ou CPF</label>
                    <input
                      type="text"
                      value={taxIdCnpjCpf}
                      onChange={(e) => setTaxIdCnpjCpf(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] text-[13.5px] font-mono text-[#1C1C1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">Chave Pix Principal</label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] text-[13.5px] font-mono text-[#1C1C1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">% Sinal Padrão</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={defaultDepositPercent}
                      onChange={(e) => setDefaultDepositPercent(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] text-[13.5px] font-mono font-bold text-[#1C1C1E]"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-[#E5E5EA] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium hover:bg-[#2C2C2E] transition shadow-sm"
                  >
                    Salvar alterações
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 6: CARD READER & CHECKOUT                                         */}
            {/* ========================================================================= */}
            {subTab === "card_reader" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Card reader &amp; Checkout</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-0.5">
                    Configuração de leitor de cartões, ponto de venda Pix Dinâmico e recibos digitais.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-[#E5E5EA] space-y-3 bg-[#FAFAFA]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-[#1C1C1E]">Pix Instantâneo no PDV &amp; Venda Rápida</p>
                      <p className="text-[12px] text-[#6E6E73]">
                        Geração automática de QR Code e código Copia e Cola para sinal e fechamento de atendimento.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E5EA] text-[12px] font-medium text-emerald-700">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                      <span>Ativo</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#E5E5EA] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium hover:bg-[#2C2C2E] transition shadow-sm"
                  >
                    Salvar alterações
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 7: PAYOUT ACCOUNT                                                 */}
            {/* ========================================================================= */}
            {subTab === "payout_account" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Payout account &amp; Verification</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-0.5">
                    Conta bancária de liquidação para recebimento automático de reservas e faturas pagas online.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-[#E5E5EA] space-y-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Instituição Bancária</label>
                      <input
                        type="text"
                        value="Nu Pagamentos S.A. (Nubank)"
                        disabled
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] text-[13px] text-[#1C1C1E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Chave Pix de Repasse</label>
                      <input
                        type="text"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] font-mono text-[#1C1C1E]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#E5E5EA] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium hover:bg-[#2C2C2E] transition shadow-sm"
                  >
                    Salvar alterações
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 8: HIPAA COMPLIANCE & PRONTUÁRIOS                                  */}
            {/* ========================================================================= */}
            {subTab === "hipaa" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Conformidade &amp; Prontuários (LGPD/Saúde)</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-0.5">
                    Armazenamento seguro de fichas de anamnese, registros fotográficos antes/depois e consentimento do cliente.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-[#E5E5EA] bg-[#FAFAFA] space-y-2">
                  <p className="text-[13px] font-semibold text-[#1C1C1E]">Proteção de Dados Médicos e Estéticos</p>
                  <p className="text-[12px] text-[#6E6E73]">
                    Os dados clínicos, notas SOAP e formulários preenchidos ficam criptografados e acessíveis exclusivamente aos profissionais autorizados do seu estúdio.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 9: GIFT CARDS                                                     */}
            {/* ========================================================================= */}
            {subTab === "gift_cards" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Vales-Presente (Gift Cards)</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-0.5">
                    Permita que seus clientes comprem vales-presente elegantes para presentear amigos e familiares.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-[#E5E5EA] space-y-3 bg-[#FAFAFA]">
                  <p className="text-[13px] font-medium text-[#1C1C1E]">Venda de Gift Cards Online Ativa</p>
                  <p className="text-[12px] text-[#6E6E73]">
                    Clientes podem adquirir vouchers com código de resgate único direto no seu site público de agendamento.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* TAB: PESSOAL (PERSONAL) */}
      {topTab === "personal" && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] p-6 sm:p-8 space-y-6 max-w-2xl">
          <div>
            <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Detalhes Pessoais</h2>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">
              Seu nome e informações de contato como proprietário da conta.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Primeiro Nome</label>
              <input
                type="text"
                value={personalFirst}
                onChange={(e) => setPersonalFirst(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Sobrenome</label>
              <input
                type="text"
                value={personalLast}
                onChange={(e) => setPersonalLast(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">E-mail</label>
              <input
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Telefone WhatsApp</label>
              <input
                type="text"
                value={personalPhone}
                onChange={(e) => setPersonalPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E5EA] flex justify-end">
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium hover:bg-[#2C2C2E]"
            >
              Salvar detalhes pessoais
            </button>
          </div>
        </div>
      )}

      {/* TAB: EQUIPE (STAFF) */}
      {topTab === "staff" && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Membros da Equipe (Staff)</h2>
              <p className="text-[13px] text-[#6E6E73] mt-0.5">
                Gerencie seus profissionais, comissões individuais e controle de metas semanais.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.staff.map((member) => (
              <div key={member.id} className="p-4 rounded-2xl border border-[#E5E5EA] bg-[#FAFAFA] space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-zinc-800"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-[13.5px] text-[#1C1C1E]">{member.fullName}</p>
                    <p className="text-[12px] text-[#6E6E73]">{member.role}</p>
                  </div>
                </div>
                <div className="text-[11.5px] text-[#71717A] pt-2 border-t border-[#E5E5EA]">
                  <span>Comissão: {member.serviceCommissionPercent}% serviços • {member.productCommissionPercent}% produtos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: WHATSAPP & MENSAGENS */}
      {topTab === "whatsapp" && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#1C1C1E]">WhatsApp &amp; Automações de Atendimento</h2>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">
              Conecte sua instância da Evolution API, configure templates interativos e ative confirmações 2-Way.
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

      {/* TAB: PLANO & ASSINATURA */}
      {topTab === "subscription" && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Plano &amp; Assinatura LUVEA</h2>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">
              Sua conta atual está no plano <strong className="text-[#1C1C1E]">Gold (Avaliação gratuita)</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl border border-[#E5E5EA] bg-white space-y-4">
              <h3 className="font-semibold text-lg text-[#1C1C1E]">Essencial</h3>
              <p className="text-[28px] font-normal font-serif text-[#1C1C1E]">R$ 97<span className="text-sm font-sans text-[#6E6E73]">/mês</span></p>
              <p className="text-xs text-[#6E6E73]">Perfeito para profissionais autônomos solo.</p>
            </div>

            <div className="p-6 rounded-3xl border-2 border-[#1C1C1E] bg-[#FAFAFA] space-y-4 relative">
              <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#1C1C1E] text-white">
                Mais Popular
              </span>
              <h3 className="font-semibold text-lg text-[#1C1C1E]">Gold</h3>
              <p className="text-[28px] font-normal font-serif text-[#1C1C1E]">R$ 197<span className="text-sm font-sans text-[#6E6E73]">/mês</span></p>
              <p className="text-xs text-[#6E6E73]">Recepção IA, lista de espera, lembretes de retorno e WhatsApp 2-Way.</p>
            </div>

            <div className="p-6 rounded-3xl border border-[#E5E5EA] bg-white space-y-4">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1C1C1E] text-white">
                Platinum
              </span>
              <h3 className="font-semibold text-lg text-[#1C1C1E]">Platinum</h3>
              <p className="text-[28px] font-normal font-serif text-[#1C1C1E]">R$ 347<span className="text-sm font-sans text-[#6E6E73]">/mês</span></p>
              <p className="text-xs text-[#6E6E73]">Website tracking completo (Google &amp; Meta Pixel), múltiplos locais e relatórios avançados.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PREVIEW NOTIFICATION (WhatsApp vs Email)                         */}
      {/* ========================================================================= */}
      {previewNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5EA] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-[16px] font-semibold text-[#1C1C1E]">{previewNotification.title}</h3>
                <p className="text-[12px] text-[#6E6E73]">Prévia de como seu cliente receberá o alerta</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewNotification(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Channel Switch */}
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

            {/* Live Visual Canvas */}
            {notificationPreviewChannel === "whatsapp" ? (
              <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-[#D1D1D6] space-y-2">
                <div className="bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-sm max-w-[88%] text-[13px] leading-relaxed text-[#1C1C1E] space-y-2">
                  <p className="whitespace-pre-wrap">
                    {previewNotification.templateBody
                      .replace("{nome}", "Stefany")
                      .replace("{estudio}", businessName)
                      .replace("{data}", "24/10/2026")
                      .replace("{horario}", "14:30")
                      .replace("{servicos}", "Coloração Personalizada & Iluminação")
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
                      {previewNotification.templateSubject?.replace("{estudio}", businessName) || previewNotification.title}
                    </strong>
                  </p>
                </div>
                <div className="text-[13px] leading-relaxed text-[#1C1C1E] whitespace-pre-wrap py-2">
                  {previewNotification.templateBody
                    .replace("{nome}", "Stefany")
                    .replace("{estudio}", businessName)
                    .replace("{data}", "24/10/2026")
                    .replace("{horario}", "14:30")
                    .replace("{servicos}", "Coloração Personalizada & Iluminação")
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
      {/* MODAL 2: CUSTOMIZE NOTIFICATION TEMPLATE                                  */}
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

            {/* Template Subject (for Email) */}
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

            {/* Template Body */}
            <div>
              <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Texto da Notificação</label>
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

            {/* Dynamic Variable Chips */}
            <div className="space-y-1.5">
              <p className="text-[11px] text-[#8E8E93]">Variáveis dinâmicas (clique para adicionar):</p>
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
    </div>
  );
}
