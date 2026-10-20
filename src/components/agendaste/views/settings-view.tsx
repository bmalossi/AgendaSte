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

type TopTabId = "business" | "personal" | "staff" | "whatsapp" | "subscription";
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
  initialSubTab = "client_notifications",
}: SettingsViewProps) {
  // Aba Superior
  const [topTab, setTopTab] = useState<TopTabId>(() => {
    if (initialTab && ["personal", "staff", "business", "subscription", "whatsapp"].includes(initialTab)) {
      return initialTab as TopTabId;
    }
    return "business";
  });

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
        "gift_cards",
      ].includes(initialSubTab)
    ) {
      return initialSubTab as BusinessSubTabId;
    }
    return "client_notifications";
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
        <div className="bg-white border border-[#E5E5EA] rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[700px]">
          {/* Menu Lateral Esquerdo Colado (Sem recuo) */}
          <aside className="w-full md:w-64 lg:w-72 border-b md:border-b-0 md:border-r border-[#E5E5EA] bg-[#FBFBFC] p-3 space-y-1 shrink-0">
            {[
              { id: "business_details" as const, label: "Dados do Negócio", icon: Building2 },
              { id: "locations" as const, label: "Unidades & Locais", icon: MapPin, count: 1 },
              { id: "website" as const, label: "Site de Agendamento", icon: Globe },
              { id: "booking_controls" as const, label: "Regras de Agendamento", icon: Sliders },
              { id: "client_notifications" as const, label: "Notificações de Clientes", icon: Bell },
              { id: "card_reader" as const, label: "Cobrança & Checkout", icon: CreditCard },
              { id: "payout_account" as const, label: "Conta de Repasse & Pix", icon: Wallet },
              { id: "hipaa" as const, label: "Conformidade & Prontuários", icon: ShieldCheck, tag: "LGPD" },
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
                      ? "bg-[#1C1C1E] text-white shadow-sm"
                      : "text-[#52525B] hover:text-[#18181B] hover:bg-white"
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
          </aside>

          {/* Painel de Conteúdo Principal (Diretamente adjacente, sem caixas aninhadas) */}
          <main className="flex-1 p-6 lg:p-8 bg-white">
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
                            className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#FAFAFA] transition-colors px-2 rounded-xl"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">{ptTitle}</h4>
                                {notif.badge === "novo" && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#ECE9FE] text-[#6D28D9]">
                                    Novo
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-[#6E6E73]">{ptDesc}</p>
                              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#8E8E93]">
                                <span>
                                  Envio via:{" "}
                                  <strong className="font-medium text-[#1C1C1E]">
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
                                className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] text-[12px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition"
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
                                className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] text-[12px] font-medium text-[#1C1C1E] hover:bg-[#E5E5EA] transition inline-flex items-center gap-1.5"
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
                            className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#FAFAFA] transition-colors px-2 rounded-xl"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">{ptTitle}</h4>
                                {notif.badge === "gold" && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#FBF8EF] border border-[#F3E8C4] text-[#8C6D1F]">
                                    Gold
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-[#6E6E73]">{ptDesc}</p>
                              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#8E8E93]">
                                <span>
                                  Envio via:{" "}
                                  <strong className="font-medium text-[#1C1C1E]">
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
                                className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] text-[12px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition"
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
                                className="px-3.5 py-1.5 rounded-full bg-[#F5F5F7] text-[12px] font-medium text-[#1C1C1E] hover:bg-[#E5E5EA] transition inline-flex items-center gap-1.5"
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
                    <select
                      value={bookingControls.autoApproveMode}
                      onChange={(e) =>
                        setBookingControls({
                          ...bookingControls,
                          autoApproveMode: e.target.value as "always" | "manual",
                        })
                      }
                      className="px-3 py-1.5 rounded-xl border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] bg-white w-48 shrink-0"
                    >
                      <option value="always">Sempre automática</option>
                      <option value="manual">Aprovação manual</option>
                    </select>
                  </div>

                  {/* Antecedência Mínima */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Antecedência Mínima para Agendar</h4>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Tempo mínimo de aviso prévio que o cliente precisa cumprir para marcar um horário.
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
                      className="px-3 py-1.5 rounded-xl border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] bg-white w-36 shrink-0"
                    >
                      <option value={1}>1 hora</option>
                      <option value={2}>2 horas</option>
                      <option value={4}>4 horas</option>
                      <option value={12}>12 horas</option>
                      <option value={24}>24 horas</option>
                      <option value={48}>48 horas</option>
                    </select>
                  </div>

                  {/* Incrementos de Horário */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Divisão dos Intervalos de Horário</h4>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Controla os blocos de horário disponíveis para seleção na agenda e no site.
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
                      className="px-3 py-1.5 rounded-xl border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] bg-white w-36 shrink-0"
                    >
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos</option>
                    </select>
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
                          <select
                            value={bookingControls.maxGapMinutes}
                            onChange={(e) =>
                              setBookingControls({
                                ...bookingControls,
                                maxGapMinutes: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5EA] text-[13px] bg-white"
                          >
                            <option value={15}>Até 15 minutos</option>
                            <option value={30}>Até 30 minutos</option>
                            <option value={45}>Até 45 minutos</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">
                            Escopo de Profissionais
                          </label>
                          <select
                            value={bookingControls.gapProviderScope}
                            onChange={(e) =>
                              setBookingControls({
                                ...bookingControls,
                                gapProviderScope: e.target.value as "all" | "selected",
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5EA] text-[13px] bg-white"
                          >
                            <option value="all">Todos os profissionais</option>
                            <option value="selected">Profissionais selecionados</option>
                          </select>
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
                    <select
                      value={bookingControls.requireCardOnFile}
                      onChange={(e) =>
                        setBookingControls({
                          ...bookingControls,
                          requireCardOnFile: e.target.value as "all" | "new_clients" | "none",
                        })
                      }
                      className="px-3 py-1.5 rounded-xl border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] bg-white w-48 shrink-0"
                    >
                      <option value="all">Todos os clientes</option>
                      <option value="new_clients">Apenas novos clientes</option>
                      <option value="none">Desativado</option>
                    </select>
                  </div>

                  {/* Agendamento Futuro Máximo */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Prazo Futuro Máximo de Agendamento</h4>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        Limita a quantidade de meses futuros em que os clientes podem marcar horários a partir de hoje.
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
                      className="px-3 py-1.5 rounded-xl border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] bg-white w-36 shrink-0"
                    >
                      <option value={1}>1 mês</option>
                      <option value={2}>2 meses</option>
                      <option value={3}>3 meses</option>
                      <option value={6}>6 meses</option>
                      <option value={12}>12 meses</option>
                    </select>
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
                        <label className="block text-[12px] font-medium text-[#1C1C1E]">
                          Prazo Limite para Cancelar sem Taxa
                        </label>
                        <div className="pt-1">
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
                            className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] bg-white"
                          >
                            <option value={12}>Até 12 horas antes</option>
                            <option value={24}>Até 24 horas antes</option>
                            <option value={48}>Até 48 horas antes</option>
                            <option value={72}>Até 72 horas antes</option>
                          </select>
                        </div>
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
            {/* 6. DEMAIS SUB-ABAS (Cobrança, Repasse, Conformidade, Vales)                 */}
            {/* ========================================================================= */}
            {subTab === "card_reader" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Cobrança &amp; Checkout</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Geração de Pix dinâmico no PDV e opções de recebimento presencial.
                  </p>
                </div>
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-[13.5px] font-medium text-[#1C1C1E]">Pix Dinâmico Instantâneo</h4>
                    <p className="text-[12px] text-[#6E6E73]">
                      Gera QR Code e código Copia e Cola diretamente no checkout da comanda.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F5F7] text-[12px] font-medium text-emerald-700">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                    <span>Ativo</span>
                  </div>
                </div>
              </div>
            )}

            {subTab === "payout_account" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Conta de Repasse &amp; Pix</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Destino para recebimento de sinais, reservas online e faturas liquidadas.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Instituição de Destino</label>
                    <input
                      type="text"
                      value="Nu Pagamentos S.A. (Nubank)"
                      disabled
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] text-[13px] text-[#1C1C1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[#71717A] mb-1">Chave Pix de Repasse</label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-mono text-[#1C1C1E]"
                    />
                  </div>
                </div>
              </div>
            )}

            {subTab === "hipaa" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Conformidade &amp; Prontuários (LGPD)</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Políticas de privacidade de dados sensíveis, prontuários estéticos e fichas de anamnese.
                  </p>
                </div>
                <div className="py-2 space-y-1">
                  <p className="text-[13px] font-medium text-[#1C1C1E]">Criptografia e Sigilo Profissional</p>
                  <p className="text-[12px] text-[#6E6E73]">
                    Fórmulas cosméticas, fotos antes/depois e notas SOAP dos clientes são encriptadas e restritas aos
                    profissionais autorizados do estúdio.
                  </p>
                </div>
              </div>
            )}

            {subTab === "gift_cards" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-[#E5E5EA] pb-5">
                  <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Vales-Presente</h2>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Permita a compra de vales-presente com resgate automático de saldo no atendimento.
                  </p>
                </div>
                <div className="py-2 space-y-1">
                  <p className="text-[13px] font-medium text-[#1C1C1E]">Venda de Vouchers Ativa</p>
                  <p className="text-[12px] text-[#6E6E73]">
                    Os clientes podem adquirir créditos de presente diretamente pelo site público de agendamento.
                  </p>
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

      {topTab === "subscription" && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] p-6 lg:p-8 space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#1C1C1E]">Plano &amp; Assinatura LUVEA</h2>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">
              Sua conta está no plano <strong className="text-[#1C1C1E]">Gold (Avaliação ativa)</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-[#E5E5EA] bg-white space-y-2">
              <h3 className="font-semibold text-base text-[#1C1C1E]">Essencial</h3>
              <p className="text-[26px] font-serif text-[#1C1C1E]">R$ 97<span className="text-xs font-sans text-[#6E6E73]">/mês</span></p>
              <p className="text-xs text-[#6E6E73]">Para profissionais autônomos.</p>
            </div>

            <div className="p-6 rounded-2xl border-2 border-[#1C1C1E] bg-[#FAFAFA] space-y-2 relative">
              <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#1C1C1E] text-white">
                Mais Popular
              </span>
              <h3 className="font-semibold text-base text-[#1C1C1E]">Gold</h3>
              <p className="text-[26px] font-serif text-[#1C1C1E]">R$ 197<span className="text-xs font-sans text-[#6E6E73]">/mês</span></p>
              <p className="text-xs text-[#6E6E73]">Recepção IA, lista de espera e WhatsApp 2-Way.</p>
            </div>

            <div className="p-6 rounded-2xl border border-[#E5E5EA] bg-white space-y-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#1C1C1E] text-white">
                Platinum
              </span>
              <h3 className="font-semibold text-base text-[#1C1C1E]">Platinum</h3>
              <p className="text-[26px] font-serif text-[#1C1C1E]">R$ 347<span className="text-xs font-sans text-[#6E6E73]">/mês</span></p>
              <p className="text-xs text-[#6E6E73]">Rastreamento web com Google &amp; Meta Pixel e multi-unidades.</p>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
