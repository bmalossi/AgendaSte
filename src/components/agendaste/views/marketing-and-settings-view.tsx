"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  Send,
  Mail,
  MessageSquare,
  Check,
  X,
  BarChart3,
  Package,
  ClipboardList,
  Gift,
  Copy,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  AlertTriangle,
  Calendar,
  ChevronDown,
  Info,
  ArrowUp,
  Banknote,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  FileText,
  Users,
  PieChart,
  Calculator,
  Clock,
} from "lucide-react";
import {
  StudioState,
  MarketingCampaignItem,
  formatBRL,
  generateMarketingDraftAI,
  sendMarketingCampaign,
  updateStudioSettings,
  filterClientsByRetention,
} from "@/lib/agendaste-store";

// =============================================================================
// 1. MARKETING VIEW (07-1-marketing.png & 07-1-1-marketing.png)
// =============================================================================

interface MarketingViewProps {
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
}

export function MarketingView({ state, onUpdateState }: MarketingViewProps) {
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [channel, setChannel] = useState<"email" | "text">("text");
  const [audienceSegment, setAudienceSegment] =
    useState<MarketingCampaignItem["audienceSegment"]>("absent_45d");
  const [subject, setSubject] = useState(
    "Sentimos sua falta no Aura Studio ✨ Seu horário especial te espera"
  );
  const [message, setMessage] = useState(
    `Olá! Aqui é ${state.settings.personal.firstName} ${state.settings.personal.lastName}. Notamos que já faz mais de 45 dias desde a sua última visita ao estúdio! Preparamos uma condição especial de retorno. Toque abaixo para agendar em 30 segundos!`
  );

  const openCampaignWithTemplate = (
    kind: "absent_45d" | "installments_pix" | "special_date"
  ) => {
    const providerFull = `${state.settings.personal.firstName} ${state.settings.personal.lastName}`;
    const draft = generateMarketingDraftAI(kind, providerFull);
    setSubject(draft.subject);
    setMessage(draft.message);
    setAudienceSegment(kind === "absent_45d" ? "absent_45d" : "all");
    setCampaignModalOpen(true);
  };

  const absentClientsCount = filterClientsByRetention(
    state,
    "absent_30_45",
    ""
  ).length;

  return (
    <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {/* Top Bar matching 07-1-marketing.png */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
            Marketing
          </h1>
          <p className="text-[13px] text-[#6E6E73]">
            {state.marketing.smsCreditsRemaining} mensagens de texto gratuitas
            restantes neste mês
          </p>
        </div>

        <button
          onClick={() => openCampaignWithTemplate("absent_45d")}
          className="px-6 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[13px] font-semibold transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova campanha (New campaign)</span>
        </button>
      </div>

      {/* Editorial Hero Card matching 07-1-marketing.png */}
      <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-gg-card">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-[42px] leading-[1.06] text-[#1C1C1E]">
            Alcance mais clientes com o Marketing AgendaSte
          </h2>
          <p className="text-[15px] text-[#6E6E73] max-w-xl">
            Lance campanhas de e-mail, SMS e WhatsApp redigidas por IA em segundos para preencher horários vagos e reativar clientes ausentes.
          </p>
          <button
            onClick={() => openCampaignWithTemplate("absent_45d")}
            className="px-6 py-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[14px] font-semibold transition"
          >
            Experimentar agora
          </button>
        </div>

        {/* Right Mockup Card */}
        <div className="lg:col-span-5 bg-white rounded-[20px] p-6 border border-[#E5E5EA] shadow-gg-card space-y-3">
          <span className="px-3 py-1 rounded-full bg-[#E11D8F] text-white text-[11px] font-bold shadow-sm inline-block">
            Campanha Automática · Alta Conversão
          </span>
          <p className="text-[16px] font-bold text-[#1C1C1E]">
            &ldquo;Temos poucos horários disponíveis para esta semana!&rdquo;
          </p>
          <p className="text-[12px] text-[#6E6E73]">
            Taxa média de abertura: 94% · Link direto para seu Site de Agendamento Online.
          </p>
        </div>
      </div>

      {/* Campaign Ideas Cards (07-1-marketing.png) */}
      <div className="space-y-4">
        <h3 className="text-[18px] font-bold text-[#1C1C1E]">
          Ideias de campanha (Campaign ideas)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              kind: "absent_45d" as const,
              badge: `Reativação (${absentClientsCount} ausentes 30/45+ dias)`,
              title: "Reconecte clientes ausentes",
              desc: "Envie um convite personalizado com 1 toque para clientes que não visitam o estúdio há mais de 30 ou 45 dias.",
            },
            {
              kind: "installments_pix" as const,
              badge: "Aumento de Ticket Médio",
              title: "Promova Reserva com Sinal Pix & Parcelamento",
              desc: "Avise seus clientes que eles podem reservar procedimentos premium online agora mesmo em 30 segundos.",
            },
            {
              kind: "special_date" as const,
              badge: "Datas Comemorativas",
              title: "Celebre Datas Especiais & Vale-Presentes",
              desc: "Impulsione vendas antecipadas promovendo cartões de presente e pacotes de autocuidado.",
            },
          ].map((idea) => (
            <div
              key={idea.kind}
              className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-[#E11D8F] text-white text-[11px] font-bold shadow-sm">
                  {idea.badge}
                </span>
                <h4 className="text-[16px] font-bold text-[#1C1C1E]">
                  {idea.title}
                </h4>
                <p className="text-[13px] text-[#6E6E73]">{idea.desc}</p>
              </div>
              <button
                onClick={() => openCampaignWithTemplate(idea.kind)}
                className="w-full py-2.5 rounded-full border border-[#E5E5EA] hover:bg-[#1C1C1E] hover:text-white text-[13px] font-semibold text-[#1C1C1E] transition"
              >
                Criar campanha
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sent Campaigns List */}
      <div className="bg-white rounded-[20px] border border-[#E5E5EA] shadow-gg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EFEFF4] flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#1C1C1E]">
            Campanhas Enviadas ({state.marketing.campaigns.length})
          </h3>
        </div>
        <div className="divide-y divide-[#EFEFF4]">
          {state.marketing.campaigns.map((cmp) => (
            <div
              key={cmp.id}
              className="p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#16A34A] text-white text-[11px] font-bold uppercase shadow-sm">
                    {cmp.channel === "text" ? "SMS / WhatsApp" : "E-mail"}
                  </span>
                  <p className="text-[15px] font-bold text-[#1C1C1E]">
                    {cmp.subject}
                  </p>
                </div>
                <p className="text-[12px] text-[#6E6E73] mt-1 max-w-2xl">
                  {cmp.message}
                </p>
              </div>
              <div className="text-right text-[12px] text-[#6E6E73]">
                <p className="font-bold text-[#1C1C1E]">
                  {cmp.recipientsCount} destinatário(s)
                </p>
                <p>{cmp.sentAtISO}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Split-Screen New Campaign Modal matching 07-1-1-marketing.png */}
      {campaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-[26px] max-w-[1040px] w-full max-h-[90vh] overflow-hidden border border-[#E5E5EA] shadow-gg-modal grid grid-cols-1 lg:grid-cols-12">
            {/* Left Builder Pane */}
            <div className="lg:col-span-7 p-6 lg:p-8 overflow-y-auto space-y-5 border-r border-[#EFEFF4]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[22px] font-bold text-[#1C1C1E]">
                    Nova campanha (New campaign)
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white">
                      1. Canal &amp; Segmento
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E11D8F] text-white">
                      2. Mensagem IA
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F5F5F7] text-[#6E6E73]">
                      3. Revisão &amp; Disparo
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setCampaignModalOpen(false)}
                  className="w-8 h-8 rounded-full border border-[#E5E5EA] flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-[#1C1C1E]" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                    Canal de Disparo
                  </label>
                  <select
                    value={channel}
                    onChange={(e) =>
                      setChannel(e.target.value as "email" | "text")
                    }
                    className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[13px] font-semibold bg-white"
                  >
                    <option value="text">Mensagem / WhatsApp</option>
                    <option value="email">E-mail Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                    Segmento de Clientes
                  </label>
                  <select
                    value={audienceSegment}
                    onChange={(e) =>
                      setAudienceSegment(
                        e.target.value as MarketingCampaignItem["audienceSegment"]
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[13px] font-semibold bg-white"
                  >
                    <option value="absent_45d">
                      Ausentes há 30/45+ dias ({absentClientsCount})
                    </option>
                    <option value="all">
                      Todos os clientes ({state.clients.length})
                    </option>
                    <option value="vip">Clientes VIP &amp; Assinantes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                  Título / Assunto
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[12px] font-semibold text-[#6E6E73]">
                    Mensagem da campanha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const draft = generateMarketingDraftAI(
                        "installments_pix",
                        `${state.settings.personal.firstName} ${state.settings.personal.lastName}`
                      );
                      setSubject(draft.subject);
                      setMessage(draft.message);
                    }}
                    className="text-[12px] font-semibold text-[#6E56CF] flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Reescrever com IA</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[13px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setCampaignModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-[#E5E5EA] text-[13px] font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onUpdateState((prev) =>
                      sendMarketingCampaign(prev, {
                        channel,
                        subject,
                        message,
                        audienceSegment,
                      })
                    );
                    setCampaignModalOpen(false);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[13px] font-semibold flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Disparar Campanha</span>
                </button>
              </div>
            </div>

            {/* Right Smartphone Live Preview Pane (07-1-1-marketing.png) */}
            <div className="lg:col-span-5 bg-[#F5F3FF] p-8 flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E56CF] mb-3">
                Pré-visualização em Tempo Real no Smartphone
              </span>
              <div className="w-[290px] rounded-[34px] bg-[#1C1C1E] p-3 shadow-2xl">
                <div className="bg-white rounded-[26px] p-5 space-y-4">
                  <div className="text-center border-b border-[#EFEFF4] pb-3">
                    <p className="text-[11px] uppercase tracking-widest text-[#8E8E93] font-bold">
                      AURA STUDIO
                    </p>
                    <p className="font-display text-[20px] text-[#1C1C1E] mt-1 leading-snug">
                      {subject}
                    </p>
                  </div>

                  <div className="h-28 rounded-[14px] bg-gg-hero-gradient border border-[#DDD6FE] flex items-center justify-center p-3 text-center">
                    <span className="font-display text-[18px] text-[#6E56CF]">
                      Horários Exclusivos · Reserva Online em 30s
                    </span>
                  </div>

                  <p className="text-[12px] text-[#1C1C1E] leading-relaxed">
                    {message}
                  </p>

                  <div className="py-2.5 rounded-full bg-[#1C1C1E] text-white text-center text-[12px] font-semibold">
                    Agendar agora (Book now)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 2. SETTINGS VIEW (08-1-settings.png, 08-2-settings-1.png, 08-3-settings-business.png)
// =============================================================================

interface SettingsViewProps {
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
}

export function SettingsView({ state, onUpdateState }: SettingsViewProps) {
  const [topTab, setTopTab] = useState<
    "personal" | "team" | "business" | "membership"
  >("personal");

  const [firstName, setFirstName] = useState(
    state.settings.personal.firstName
  );
  const [lastName, setLastName] = useState(state.settings.personal.lastName);
  const [email, setEmail] = useState(state.settings.personal.email);
  const [phone, setPhone] = useState(state.settings.personal.phone);
  const [licenseNumber, setLicenseNumber] = useState(
    state.settings.personal.licenseNumber
  );
  const [smsConsent, setSmsConsent] = useState(
    state.settings.personal.smsConsent
  );

  // Business state
  const [businessName, setBusinessName] = useState(
    state.settings.business.businessName
  );
  const [legalEntityType, setLegalEntityType] = useState(
    state.settings.business.legalEntityType
  );
  const [taxIdCnpjCpf, setTaxIdCnpjCpf] = useState(
    state.settings.business.taxIdCnpjCpf
  );
  const [pixKey, setPixKey] = useState(state.settings.business.pixKey);
  const [defaultDepositPercent, setDefaultDepositPercent] = useState(
    String(state.settings.business.defaultDepositPercent)
  );

  return (
    <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {/* Header + 4 Horizontal Top Tabs (08-1-settings.png) */}
      <div className="space-y-4 border-b border-[#E5E5EA] pb-4">
        <h1 className="text-[28px] font-bold text-[#1C1C1E]">
          Configurações (Settings)
        </h1>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: "personal" as const, label: "Pessoal (Personal)" },
            { id: "team" as const, label: "Equipe (Team)" },
            { id: "business" as const, label: "Negócio (Business)" },
            { id: "membership" as const, label: "Plano & Assinatura" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTopTab(t.id)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition ${
                topTab === t.id
                  ? "bg-[#1C1C1E] text-white shadow-sm"
                  : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1C1C1E]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: PERSONAL & PREFERENCES (08-1-settings.png & 08-2-settings-1.png) */}
      {topTab === "personal" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-1">
            <div className="px-4 py-2.5 rounded-[12px] bg-[#1C1C1E] text-white font-semibold text-[13px] shadow-sm">
              Detalhes pessoais
            </div>
            <div className="px-4 py-2.5 rounded-[12px] text-[#6E6E73] font-medium text-[13px]">
              Preferências &amp; Notificações
            </div>
            <div className="px-4 py-2.5 rounded-[12px] text-[#6E6E73] font-medium text-[13px]">
              Conta &amp; Segurança
            </div>
          </div>

          <div className="lg:col-span-9 space-y-6">
            {/* Personal Details Card (08-1-settings.png) */}
            <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-[#1C1C1E]">
                  Detalhes pessoais (Personal details)
                </h2>
                <div className="w-12 h-12 rounded-full bg-[#DDD6FE] flex items-center justify-center font-bold text-[#1C1C1E]">
                  BF
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                    Nome (First name)
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                    Sobrenome (Last name)
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-semibold text-[#6E6E73]">
                      Telefone
                    </label>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#16A34A] text-white text-[10px] font-bold shadow-sm">
                      Verificado ✓
                    </span>
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                  Registro Profissional / Licença (License number)
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="Opcional (Ex: CRBM / ANVISA / MEI)"
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                />
              </div>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <span className="text-[13px] text-[#6E6E73]">
                  Aceito receber alertas operacionais por SMS e WhatsApp
                </span>
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="w-5 h-5 accent-[#6E56CF]"
                />
              </label>

              <div className="pt-2">
                <button
                  onClick={() =>
                    onUpdateState((prev) =>
                      updateStudioSettings(prev, {
                        firstName,
                        lastName,
                        email,
                        phone,
                        licenseNumber,
                        smsConsent,
                      })
                    )
                  }
                  className="px-6 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[13px] font-semibold"
                >
                  Salvar alterações
                </button>
              </div>
            </div>

            {/* Preferences Card (08-2-settings-1.png) */}
            <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4">
              <h2 className="text-[18px] font-bold text-[#1C1C1E]">
                Preferências e Sincronização de Agenda (08-2)
              </h2>

              <div className="p-4 rounded-[14px] bg-[#FAFAFC] border border-[#EFEFF4] flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-[#1C1C1E]">
                    Sincronizar com Google / Apple Calendar
                  </p>
                  <p className="text-[12px] font-mono text-[#6E6E73]">
                    {state.settings.preferences.calendarSyncUrl}
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      lastToastMessage:
                        "Link de sincronização de calendário copiado!",
                    }))
                  }
                  className="px-4 py-2 rounded-full border border-[#E5E5EA] bg-white text-[12px] font-semibold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 & 3: BUSINESS SETTINGS (08-3-settings-business.png) */}
      {(topTab === "business" ||
        topTab === "team" ||
        topTab === "membership") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-1">
            {[
              "Detalhes do negócio",
              "Requisitos de agendamento",
              "Pagamentos & Sinal Pix",
              "Política de Cancelamento & No-Show",
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

          <div className="lg:col-span-9 bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-5">
            <h2 className="text-[18px] font-bold text-[#1C1C1E]">
              Detalhes do Negócio &amp; Regras Anti-No-Show (08-3)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                  Nome do Estúdio / Razão Social
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                  Estrutura Societária (Legal entity type)
                </label>
                <input
                  type="text"
                  value={legalEntityType}
                  onChange={(e) => setLegalEntityType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                  CNPJ / CPF
                </label>
                <input
                  type="text"
                  value={taxIdCnpjCpf}
                  onChange={(e) => setTaxIdCnpjCpf(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                  Chave Pix Oficial (Sinal &amp; PDV)
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                  % Sinal Padrão Anti-No-Show
                </label>
                <input
                  type="number"
                  value={defaultDepositPercent}
                  onChange={(e) => setDefaultDepositPercent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono font-bold"
                />
              </div>
            </div>

            <button
              onClick={() =>
                onUpdateState((prev) =>
                  updateStudioSettings(prev, {
                    businessName,
                    legalEntityType,
                    taxIdCnpjCpf,
                    pixKey,
                    defaultDepositPercent: Math.min(
                      100,
                      Math.max(0, parseInt(defaultDepositPercent || "30", 10))
                    ),
                  })
                )
              }
              className="px-6 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[13px] font-semibold"
            >
              Salvar Configurações do Negócio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 3. COMPLEMENTARY SIDEBAR VIEWS (Insights/Analytics, Reports, Inventory, Charts, Refer)
// =============================================================================

type AnalyticsPeriodId = "this_month" | "last_30_days" | "last_7_days" | "this_year";

const ANALYTICS_PERIOD_OPTIONS: Array<{
  id: AnalyticsPeriodId;
  label: string;
  multiplier: number;
}> = [
  { id: "this_month", label: "Este mês", multiplier: 1 },
  { id: "last_30_days", label: "Últimos 30 dias", multiplier: 1.15 },
  { id: "last_7_days", label: "Últimos 7 dias", multiplier: 0.35 },
  { id: "this_year", label: "Este ano", multiplier: 4.8 },
];

type ReportCardId =
  | "custom_report"
  | "sales"
  | "appointments"
  | "retail_sales"
  | "packages_activity"
  | "sales_tax"
  | "inventory"
  | "transaction_detail"
  | "most_valuable_clients"
  | "commission_earnings"
  | "expenses"
  | "timesheets";

interface ReportCardDefinition {
  id: ReportCardId;
  title: string;
  description: string;
  badge?: "Gold";
  isCustomAi?: boolean;
}

const REPORT_CARDS: ReportCardDefinition[] = [
  {
    id: "custom_report",
    title: "Criar relatório personalizado",
    description: "Peça ao seu Analista de Crescimento qualquer relatório personalizado",
    isCustomAi: true,
  },
  {
    id: "sales",
    title: "Vendas",
    description: "Detalhamento do histórico de transações brutas e líquidas",
  },
  {
    id: "appointments",
    title: "Agendamentos",
    description: "Inclui informações sobre o histórico de agendamentos",
  },
  {
    id: "retail_sales",
    title: "Vendas de produtos",
    description: "Inclui informações sobre o histórico de vendas de produtos",
  },
  {
    id: "packages_activity",
    title: "Atividade de pacotes",
    description: "Inclui relatório detalhado acompanhando todas as ações de créditos",
  },
  {
    id: "sales_tax",
    title: "Impostos sobre vendas",
    description: "Inclui informações sobre o histórico de impostos sobre vendas",
  },
  {
    id: "inventory",
    title: "Estoque",
    description: "Inclui informações sobre vendas e giro de estoque",
  },
  {
    id: "transaction_detail",
    title: "Detalhes de transações",
    description: "Inclui todos os itens discriminados de cada transação",
  },
  {
    id: "most_valuable_clients",
    title: "Clientes mais valiosos",
    description: "Inclui a lista dos 10 principais clientes",
  },
  {
    id: "commission_earnings",
    title: "Ganhos de comissão",
    description: "Detalhamento de ganhos para suporte ao cálculo de comissões",
    badge: "Gold",
  },
  {
    id: "expenses",
    title: "Despesas",
    description: "Detalhamento das despesas operacionais do negócio",
  },
  {
    id: "timesheets",
    title: "Folha de ponto",
    description: "Resumo de horas trabalhadas pela equipe remunerada por hora",
    badge: "Gold",
  },
];

function renderReportCardIcon(id: ReportCardId) {
  switch (id) {
    case "custom_report":
      return <Sparkles className="w-4 h-4 text-[#1C1C1E]" />;
    case "sales":
      return <Banknote className="w-4 h-4 text-[#1C1C1E]" />;
    case "appointments":
      return <Calendar className="w-4 h-4 text-[#1C1C1E]" />;
    case "retail_sales":
      return <ShoppingCart className="w-4 h-4 text-[#1C1C1E]" />;
    case "packages_activity":
      return <ShoppingBag className="w-4 h-4 text-[#1C1C1E]" />;
    case "sales_tax":
      return <Receipt className="w-4 h-4 text-[#1C1C1E]" />;
    case "inventory":
      return <Package className="w-4 h-4 text-[#1C1C1E]" />;
    case "transaction_detail":
      return <FileText className="w-4 h-4 text-[#1C1C1E]" />;
    case "most_valuable_clients":
      return <Users className="w-4 h-4 text-[#1C1C1E]" />;
    case "commission_earnings":
      return <PieChart className="w-4 h-4 text-[#1C1C1E]" />;
    case "expenses":
      return <Calculator className="w-4 h-4 text-[#1C1C1E]" />;
    case "timesheets":
      return <Clock className="w-4 h-4 text-[#1C1C1E]" />;
  }
}

function InsightsAnalyticsSection({ state }: { state: StudioState }) {
  const [periodId, setPeriodId] = useState<AnalyticsPeriodId>("this_month");
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const selectedPeriod =
    ANALYTICS_PERIOD_OPTIONS.find((p) => p.id === periodId) ??
    ANALYTICS_PERIOD_OPTIONS[0];

  const ownerFullName =
    `${state.settings.personal.firstName} ${state.settings.personal.lastName}`.trim() ||
    "Profissional Principal";
  const subtitleText = `${ownerFullName} (você), ${selectedPeriod.label}`;

  // Base calculations from studio state
  const paidSales = state.salesHistory.filter((s) => s.status !== "Reembolsado");
  const baseNetRevenueCents = paidSales.reduce(
    (sum, s) => sum + s.amountCents + s.tipCents,
    0
  );

  const appointmentEvents = state.calendarEvents.filter(
    (e) => e.eventType === "appointment" && e.status !== "canceled"
  );
  const baseAppointmentsRevenueCents = appointmentEvents.reduce(
    (sum, e) => sum + e.totalCents,
    0
  );

  const retailSalesCents = paidSales
    .filter((s) =>
      /produto|óleo|shampoo|máscara|kit|home care|revenda/i.test(s.itemsSummary)
    )
    .reduce((sum, s) => sum + s.amountCents, 0);

  const scaledNetRevenueCents = Math.round(
    baseNetRevenueCents * selectedPeriod.multiplier
  );
  const scaledRetailRevenueCents = Math.round(
    retailSalesCents * selectedPeriod.multiplier
  );
  const scaledServiceRevenueCents = Math.max(
    0,
    scaledNetRevenueCents - scaledRetailRevenueCents
  );
  const scaledProjectedRevenueCents = Math.round(
    (baseNetRevenueCents + baseAppointmentsRevenueCents) *
      selectedPeriod.multiplier
  );

  const totalBookingsCount = Math.max(
    0,
    Math.round(appointmentEvents.length * selectedPeriod.multiplier)
  );
  const totalTransactionsOrBookings = Math.max(
    paidSales.length,
    appointmentEvents.length
  );
  const averageTicketCents =
    totalTransactionsOrBookings > 0
      ? Math.round(baseNetRevenueCents / totalTransactionsOrBookings)
      : 0;

  const returningClientsCount = state.clients.filter(
    (c) => c.visitsCount > 1
  ).length;
  const clientRetentionPercent =
    state.clients.length > 0
      ? Math.round((returningClientsCount / state.clients.length) * 100)
      : 0;

  const totalBookedMinutes = appointmentEvents.reduce(
    (sum, e) =>
      sum +
      e.activeDurationMinutes +
      e.processingDurationMinutes +
      e.blockAfterMinutes,
    0
  );
  // Standard 8h/day (480 min) reference window
  const bookingUtilizationPercent = Math.min(
    100,
    Math.round((totalBookedMinutes / 480) * 100)
  );

  const handleAskDataQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    if (lower.includes("cliente") || lower.includes("valioso") || lower.includes("vip")) {
      const topClient = [...state.clients].sort(
        (a, b) => b.totalSpentCents - a.totalSpentCents
      )[0];
      setAiResponse(
        topClient
          ? `Sua cliente com maior faturamento acumulado é ${topClient.fullName} (${formatBRL(topClient.totalSpentCents)} em ${topClient.visitsCount} visitas). A taxa de retenção geral está em ${clientRetentionPercent}%.`
          : "Ainda não há clientes suficientes para ranquear."
      );
    } else if (lower.includes("serviço") || lower.includes("ticket")) {
      setAiResponse(
        `Em "${selectedPeriod.label}", sua receita de serviços é de ${formatBRL(scaledServiceRevenueCents)} com ticket médio de ${formatBRL(averageTicketCents)} em ${totalBookingsCount} agendamentos.`
      );
    } else {
      setAiResponse(
        `Resumo para "${selectedPeriod.label}": Receita líquida de ${formatBRL(scaledNetRevenueCents)}, receita projetada de ${formatBRL(scaledProjectedRevenueCents)}, retenção de clientes em ${clientRetentionPercent}% e taxa de ocupação da agenda em ${bookingUtilizationPercent}%.`
      );
    }
  };

  const secondaryMetrics = [
    {
      id: "projected_revenue",
      title: "Receita projetada",
      value: formatBRL(scaledProjectedRevenueCents),
      tooltip:
        "Soma da receita líquida já realizada com o valor previsto dos agendamentos confirmados no período.",
    },
    {
      id: "service_revenue",
      title: "Receita de serviços",
      value: formatBRL(scaledServiceRevenueCents),
      tooltip:
        "Total faturado exclusivamente com procedimentos e serviços do catálogo no período.",
    },
    {
      id: "retail_revenue",
      title: "Receita de produtos",
      value: formatBRL(scaledRetailRevenueCents),
      tooltip:
        "Total faturado com vendas de produtos de revenda (Home Care / Retail) no período.",
    },
    {
      id: "client_retention",
      title: "Retenção de clientes",
      value: `${clientRetentionPercent}%`,
      tooltip:
        "Percentual de clientes atendidas que retornaram para 2 ou mais visitas no estúdio.",
    },
    {
      id: "booking_utilization",
      title: "Taxa de ocupação",
      value: `${bookingUtilizationPercent}%`,
      tooltip:
        "Proporção de horas ocupadas com atendimentos em relação à carga horária disponível.",
    },
    {
      id: "average_ticket",
      title: "Ticket médio",
      value: formatBRL(averageTicketCents),
      tooltip:
        "Valor médio gasto por atendimento concluído no período selecionado.",
    },
    {
      id: "total_bookings",
      title: "Total de agendamentos",
      value: `${totalBookingsCount}`,
      tooltip:
        "Quantidade total de agendamentos confirmados e concluídos no período.",
    },
  ];

  return (
    <div className="w-full px-6 lg:px-10 xl:px-12 py-7 space-y-5">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[22px] font-semibold text-[#1C1C1E] tracking-tight">
          Análises
        </h1>

        <div className="relative">
          <button
            type="button"
            onClick={() => setPeriodMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-[#1C1C1E] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-[#1C1C1E]" />
            <span>{selectedPeriod.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#1C1C1E]" />
          </button>

          {periodMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-[12px] border border-[#E5E5EA] bg-white py-1.5 shadow-lg z-20">
              {ANALYTICS_PERIOD_OPTIONS.map((option) => {
                const active = option.id === periodId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setPeriodId(option.id);
                      setPeriodMenuOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left text-[13px] flex items-center justify-between transition-colors ${
                      active
                        ? "bg-[#F2F2F7] font-semibold text-[#1C1C1E]"
                        : "text-[#3A3A3C] hover:bg-[#F9F9FB]"
                    }`}
                  >
                    <span>{option.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-[#1C1C1E]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ask Anything AI Search Bar */}
      <form
        onSubmit={handleAskDataQuestion}
        className="flex items-center gap-3 w-full rounded-full border border-[#E5E5EA] bg-white px-4 py-2.5 focus-within:border-[#1C1C1E] transition-colors"
      >
        <Sparkles className="w-4 h-4 text-[#1C1C1E] shrink-0" />
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Pergunte qualquer coisa sobre seus dados..."
          className="flex-1 bg-transparent text-[13.5px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Enviar pergunta sobre dados"
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            question.trim()
              ? "bg-[#1C1C1E] text-white hover:bg-[#2C2C2E]"
              : "bg-[#F2F2F7] text-[#8E8E93]"
          }`}
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </form>

      {aiResponse && (
        <div className="rounded-[14px] border border-[#1C1C1E] bg-white p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#C5D82D] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1C1C1E]" />
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
                Analista de Crescimento AgendaSte
              </p>
              <p className="text-[13.5px] text-[#1C1C1E] mt-1 leading-relaxed">
                {aiResponse}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAiResponse(null)}
            className="text-[#8E8E93] hover:text-[#1C1C1E] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Full-Width Card: Net Revenue */}
      <div className="bg-white rounded-[14px] border border-[#E5E5EA] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[14px] font-semibold text-[#1C1C1E]">
              Receita líquida
            </h2>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">{subtitleText}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setActiveTooltipId(
                activeTooltipId === "net_revenue" ? null : "net_revenue"
              )
            }
            title="Receita total descontando reembolsos e cancelamentos no período."
            className="text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        {activeTooltipId === "net_revenue" && (
          <p className="mt-2 text-[12px] text-[#6E6E73] bg-[#F5F5F7] rounded-[8px] px-3 py-2">
            Receita total descontando reembolsos e cancelamentos no período selecionado.
          </p>
        )}
        <p className="font-serif text-[36px] leading-none text-[#1C1C1E] mt-8 tracking-tight">
          {formatBRL(scaledNetRevenueCents)}
        </p>
      </div>

      {/* 2-Column Grid for Remaining 7 Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {secondaryMetrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-white rounded-[14px] border border-[#E5E5EA] p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[14px] font-semibold text-[#1C1C1E]">
                    {metric.title}
                  </h2>
                  <p className="text-[12px] text-[#8E8E93] mt-0.5">
                    {subtitleText}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setActiveTooltipId(
                      activeTooltipId === metric.id ? null : metric.id
                    )
                  }
                  title={metric.tooltip}
                  className="text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              {activeTooltipId === metric.id && (
                <p className="mt-2 text-[12px] text-[#6E6E73] bg-[#F5F5F7] rounded-[8px] px-3 py-2">
                  {metric.tooltip}
                </p>
              )}
            </div>

            <p className="font-serif text-[36px] leading-none text-[#1C1C1E] mt-8 tracking-tight">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsReportsSection({ state }: { state: StudioState }) {
  const [selectedReportId, setSelectedReportId] = useState<ReportCardId | null>(
    "appointments"
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string>("owner");
  const [dateRangePreset, setDateRangePreset] = useState<string>("month_to_date");
  const [startDateISO, setStartDateISO] = useState<string>("2026-10-01");
  const [endDateISO, setEndDateISO] = useState<string>("2026-10-17");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const ownerFullName =
    `${state.settings.personal.firstName} ${state.settings.personal.lastName}`.trim() ||
    "Profissional Principal";

  const selectedReport = REPORT_CARDS.find((r) => r.id === selectedReportId) ?? null;

  const handleDatePresetChange = (preset: string) => {
    setDateRangePreset(preset);
    if (preset === "month_to_date") {
      setStartDateISO("2026-10-01");
      setEndDateISO("2026-10-17");
    } else if (preset === "last_month") {
      setStartDateISO("2026-09-01");
      setEndDateISO("2026-09-30");
    } else if (preset === "last_30_days") {
      setStartDateISO("2026-09-17");
      setEndDateISO("2026-10-17");
    } else if (preset === "this_year") {
      setStartDateISO("2026-01-01");
      setEndDateISO("2026-10-17");
    }
  };

  const buildReportCsvRows = (reportId: ReportCardId): string[][] => {
    switch (reportId) {
      case "sales":
        return [
          ["ID", "Data", "Horário", "Cliente", "Profissional", "Itens", "Método", "Status", "Valor", "Gorjeta"],
          ...state.salesHistory.map((s) => [
            s.id,
            s.dateISO,
            s.appointmentTimeLabel,
            s.clientName,
            s.providerName,
            s.itemsSummary,
            s.paymentMethod,
            s.status,
            formatBRL(s.amountCents),
            formatBRL(s.tipCents),
          ]),
        ];
      case "appointments":
        return [
          ["ID", "Data", "Início", "Fim", "Cliente", "Profissional", "Serviços", "Status", "Sinal Pago", "Valor Total"],
          ...state.calendarEvents
            .filter((e) => e.eventType === "appointment")
            .map((e) => [
              e.id,
              e.dateISO,
              e.startTime,
              e.endTime,
              e.clientName,
              e.providerName,
              e.serviceNames.join(" + "),
              e.status,
              e.depositPaid ? "Sim" : "Não",
              formatBRL(e.totalCents),
            ]),
        ];
      case "retail_sales":
        return [
          ["SKU", "Produto", "Categoria", "Estoque Atual", "Preço Venda", "Custo Unitário"],
          ...state.inventory
            .filter((item) => item.category === "Revenda (Retail)")
            .map((item) => [
              item.sku,
              item.name,
              item.category,
              String(item.stockQuantity),
              formatBRL(item.priceCents),
              formatBRL(item.costCents),
            ]),
        ];
      case "packages_activity":
        return [
          ["Cliente", "Pacote", "Sessões Restantes", "Total de Sessões", "Expira em"],
          ...state.clients.flatMap((c) =>
            c.packages.map((p) => [
              c.fullName,
              p.packageName,
              String(p.remainingSessions),
              String(p.totalSessions),
              p.expiresAtISO,
            ])
          ),
        ];
      case "sales_tax":
        return [
          ["Fatura", "Cliente", "Data Emissão", "Subtotal", "Impostos Retidos", "Total"],
          ...state.invoices.map((inv) => [
            inv.invoiceNumber,
            inv.clientName,
            inv.issuedAtISO,
            formatBRL(inv.subtotalCents),
            formatBRL(inv.taxCents),
            formatBRL(inv.totalCents),
          ]),
        ];
      case "inventory":
        return [
          ["SKU", "Produto", "Categoria", "Quantidade em Estoque", "Alerta Mínimo", "Preço", "Custo"],
          ...state.inventory.map((item) => [
            item.sku,
            item.name,
            item.category,
            String(item.stockQuantity),
            String(item.minStockAlert),
            formatBRL(item.priceCents),
            formatBRL(item.costCents),
          ]),
        ];
      case "transaction_detail":
        return [
          ["Transação", "Data", "Cliente", "Resumo de Itens", "Forma de Pagamento", "Status", "Total"],
          ...state.salesHistory.map((s) => [
            s.id,
            s.dateISO,
            s.clientName,
            s.itemsSummary,
            s.paymentMethod,
            s.status,
            formatBRL(s.amountCents + s.tipCents),
          ]),
        ];
      case "most_valuable_clients":
        return [
          ["Posição", "Cliente", "Telefone", "Visitas", "Faltas (No-Show)", "Total Gasto"],
          ...[...state.clients]
            .sort((a, b) => b.totalSpentCents - a.totalSpentCents)
            .slice(0, 10)
            .map((c, idx) => [
              `#${idx + 1}`,
              c.fullName,
              c.phone,
              String(c.visitsCount),
              String(c.noShowCount),
              formatBRL(c.totalSpentCents),
            ]),
        ];
      case "commission_earnings":
        return [
          ["Profissional", "Cargo", "% Comissão Serviços", "% Comissão Produtos", "Meta Semanal", "Faturado na Semana", "Comissão Estimada"],
          ...state.staff.map((m) => [
            m.fullName,
            m.role,
            `${m.serviceCommissionPercent}%`,
            `${m.productCommissionPercent}%`,
            formatBRL(m.weeklyGoalCents),
            formatBRL(m.bookedThisWeekCents),
            formatBRL(Math.round((m.bookedThisWeekCents * m.serviceCommissionPercent) / 100)),
          ]),
        ];
      case "expenses":
        return [
          ["Item / Insumo", "SKU", "Categoria", "Unidades", "Custo Unitário", "Custo Total em Estoque"],
          ...state.inventory.map((item) => [
            item.name,
            item.sku,
            item.category,
            String(item.stockQuantity),
            formatBRL(item.costCents),
            formatBRL(item.costCents * item.stockQuantity),
          ]),
        ];
      case "timesheets":
        return [
          ["Profissional", "Data", "Entrada", "Saída", "Pausa (min)", "Horas Trabalhadas", "Status"],
          ...state.timeTracking.logs.map((log) => [
            log.staffName,
            log.dateISO,
            log.checkInTime,
            log.checkOutTime ?? "Em andamento",
            String(log.breakMinutes),
            `${(log.totalWorkedSeconds / 3600).toFixed(2)}h`,
            log.status,
          ]),
        ];
      case "custom_report":
      default:
        return [
          ["Relatório Personalizado", "Filtro Solicitação", "Período", "Profissional"],
          [
            customPrompt.trim() || "Resumo Geral de Crescimento",
            `${startDateISO} a ${endDateISO}`,
            selectedStaffId === "owner" ? ownerFullName : "Toda a equipe",
            formatBRL(
              state.salesHistory.reduce((acc, s) => acc + s.amountCents, 0)
            ),
          ],
        ];
    }
  };

  const handleDownloadCsv = () => {
    if (!selectedReport) return;
    const rows = buildReportCsvRows(selectedReport.id);
    const csvContent =
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

    if (typeof window !== "undefined") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `agendaste-relatorio-${selectedReport.id}-${startDateISO}-a-${endDateISO}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setFeedbackBanner(
      `Download concluído: ${selectedReport.title} (${startDateISO} a ${endDateISO}).`
    );
  };

  const handleSendEmail = () => {
    if (!selectedReport) return;
    const recipient = state.settings.personal.email || "contato@agendaste.com.br";
    setFeedbackBanner(
      `Relatório "${selectedReport.title}" enviado por e-mail para ${recipient}.`
    );
  };

  const previewRows = selectedReport
    ? buildReportCsvRows(selectedReport.id)
    : [];
  const previewRecordCount = Math.max(0, previewRows.length - 1);

  return (
    <div className="w-full min-h-[calc(100vh-56px)] flex flex-col lg:flex-row">
      {/* Main Left/Center Report Cards Grid */}
      <div className="flex-1 px-6 lg:px-10 xl:px-12 py-7">
        <h1 className="text-[22px] font-semibold text-[#1C1C1E] tracking-tight mb-6">
          Relatórios
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {REPORT_CARDS.map((card) => {
            const isSelected = selectedReportId === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setSelectedReportId(card.id);
                  setFeedbackBanner(null);
                }}
                className={`w-full text-left rounded-[14px] p-4 flex items-center justify-between gap-4 transition-all ${
                  isSelected
                    ? "border-[1.5px] border-[#1C1C1E] bg-[#EFF3F0]"
                    : "border border-[#E5E5EA] bg-white hover:border-[#C7C7CC]"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      card.isCustomAi ? "bg-[#C5D82D]" : "bg-[#F2F4F2]"
                    }`}
                  >
                    {renderReportCardIcon(card.id)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1C1C1E] leading-snug">
                      {card.title}
                    </p>
                    <p className="text-[12.5px] text-[#6E6E73] mt-0.5 leading-snug">
                      {card.description}
                    </p>
                  </div>
                </div>

                {card.badge === "Gold" && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#B48327] text-white text-[10px] font-bold tracking-wide shrink-0">
                    Gold
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Docked Report Configuration Drawer */}
      {selectedReport && (
        <aside className="w-full lg:w-[350px] xl:w-[380px] bg-white border-t lg:border-t-0 lg:border-l border-[#E5E5EA] flex flex-col justify-between shrink-0">
          <div className="p-6 space-y-6">
            {/* Drawer Header */}
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[18px] font-semibold text-[#1C1C1E]">
                {selectedReport.title}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedReportId(null)}
                aria-label="Fechar painel de relatório"
                className="p-1 rounded-full text-[#1C1C1E] hover:bg-[#F2F2F7] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedReport.isCustomAi && (
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-[#1C1C1E]">
                  O que você gostaria de incluir?
                </label>
                <textarea
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ex.: Clientes que fizeram Mechas nos últimos 60 dias e ainda não agendaram retorno..."
                  className="w-full rounded-[10px] border border-[#D1D1D6] bg-white px-3.5 py-2.5 text-[13px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E]"
                />
              </div>
            )}

            {/* Staff Selector */}
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#1C1C1E]">
                Profissional
              </label>
              <div className="relative">
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full appearance-none rounded-[10px] border border-[#D1D1D6] bg-white px-3.5 py-2.5 pr-9 text-[13.5px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]"
                >
                  <option value="owner">{ownerFullName} (você)</option>
                  <option value="all">
                    Toda a equipe ({state.staff.length} profissionais)
                  </option>
                  {state.staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName} — {member.role}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#1C1C1E] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Dates Selector */}
            <div className="space-y-2.5">
              <label className="block text-[13px] font-semibold text-[#1C1C1E]">
                Datas
              </label>
              <div className="relative">
                <select
                  value={dateRangePreset}
                  onChange={(e) => handleDatePresetChange(e.target.value)}
                  className="w-full appearance-none rounded-[10px] border border-[#D1D1D6] bg-white px-3.5 py-2.5 pr-9 text-[13.5px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]"
                >
                  <option value="month_to_date">Mês até a data</option>
                  <option value="last_month">Mês passado</option>
                  <option value="last_30_days">Últimos 30 dias</option>
                  <option value="this_year">Este ano</option>
                  <option value="custom">Personalizado</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#1C1C1E] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-[10px] border border-[#D1D1D6] bg-white px-3 py-1.5">
                  <span className="block text-[11px] text-[#8E8E93]">
                    Data inicial
                  </span>
                  <input
                    type="date"
                    value={startDateISO}
                    onChange={(e) => {
                      setStartDateISO(e.target.value);
                      setDateRangePreset("custom");
                    }}
                    className="w-full bg-transparent text-[13px] font-medium text-[#1C1C1E] focus:outline-none mt-0.5"
                  />
                </div>

                <div className="rounded-[10px] border border-[#D1D1D6] bg-white px-3 py-1.5">
                  <span className="block text-[11px] text-[#8E8E93]">
                    Data final
                  </span>
                  <input
                    type="date"
                    value={endDateISO}
                    onChange={(e) => {
                      setEndDateISO(e.target.value);
                      setDateRangePreset("custom");
                    }}
                    className="w-full bg-transparent text-[13px] font-medium text-[#1C1C1E] focus:outline-none mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* Summary Preview Box */}
            <div className="rounded-[12px] border border-[#E5E5EA] bg-[#FAF9F6] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-[#1C1C1E]">
                  Registros encontrados
                </span>
                <span className="font-mono font-bold text-[#1C1C1E]">
                  {previewRecordCount}
                </span>
              </div>
              <p className="text-[11.5px] text-[#6E6E73]">
                Formato de exportação: planilha CSV compatível com Excel e Google Sheets.
              </p>
            </div>

            {feedbackBanner && (
              <div className="rounded-[10px] border border-[#1C1C1E] bg-[#EFF3F0] px-3.5 py-2.5 text-[12px] font-medium text-[#1C1C1E]">
                {feedbackBanner}
              </div>
            )}
          </div>

          {/* Bottom Action Buttons (Email / Download) */}
          <div className="p-5 border-t border-[#E5E5EA] bg-white">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSendEmail}
                className="w-full py-2.5 px-4 rounded-full border border-[#D1D1D6] bg-white hover:bg-[#F5F5F7] text-[#1C1C1E] text-[13.5px] font-semibold transition-colors"
              >
                E-mail
              </button>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="w-full py-2.5 px-4 rounded-full border border-[#D1D1D6] bg-white hover:bg-[#F5F5F7] text-[#1C1C1E] text-[13.5px] font-semibold transition-colors"
              >
                Baixar
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

export function ComplementarySectionView({
  section,
  state,
  onUpdateState,
}: {
  section:
    | "insights"
    | "insights_analytics"
    | "insights_reports"
    | "inventory"
    | "charts"
    | "refer";
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
}) {
  if (section === "insights" || section === "insights_analytics") {
    return <InsightsAnalyticsSection state={state} />;
  }

  if (section === "insights_reports") {
    return <InsightsReportsSection state={state} />;
  }

  if (section === "inventory") {
    return (
      <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        <h1 className="text-[28px] font-bold text-[#1C1C1E]">
          Estoque (Inventory — Retail &amp; Backbar)
        </h1>
        <div className="bg-white rounded-[20px] border border-[#E5E5EA] shadow-gg-card overflow-hidden">
          <div className="divide-y divide-[#EFEFF4]">
            {state.inventory.map((item) => (
              <div
                key={item.id}
                className="p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-[15px] font-bold text-[#1C1C1E]">
                    {item.name}
                  </p>
                  <p className="text-[12px] text-[#6E6E73]">
                    SKU: {item.sku} · {item.category}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[12px] font-bold text-white shadow-sm ${
                      item.stockQuantity <= item.minStockAlert
                        ? "bg-[#D97706]"
                        : "bg-[#16A34A]"
                    }`}
                  >
                    {item.stockQuantity} unid. em estoque
                  </span>
                  <span className="font-mono font-bold text-[#1C1C1E]">
                    {formatBRL(item.priceCents)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (section === "charts") {
    return (
      <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        <h1 className="text-[28px] font-bold text-[#1C1C1E]">
          Fichas Clínicas &amp; Anamnese (Charts)
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.clients.map((cli) => (
            <div
              key={cli.id}
              className="bg-white rounded-[20px] border border-[#E5E5EA] p-5 shadow-gg-card space-y-2"
            >
              <p className="text-[15px] font-bold text-[#1C1C1E]">
                {cli.fullName}
              </p>
              <p className="text-[12px] text-[#6E6E73]">
                <strong>Anamnese:</strong>{" "}
                {cli.notesAndForms.anamnesis || "Sem observações."}
              </p>
              <p className="text-[12px] text-[#6E6E73]">
                <strong>Fórmulas:</strong>{" "}
                {cli.notesAndForms.formulasAndPreferences || "Não informado."}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Refer & Earn
  return (
    <div className="w-full px-6 lg:px-8 xl:px-10 py-6">
      <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-10 space-y-4 shadow-gg-card">
        <span className="inline-block px-3 py-1 rounded-full bg-white/80 text-[12px] font-semibold text-[#6E56CF]">
          Indique e ganhe R$ 150
        </span>
        <h1 className="font-display text-[42px] leading-[1.06] text-[#1C1C1E]">
          Convide outros profissionais de beleza e ganhem créditos na assinatura
        </h1>
        <p className="text-[15px] text-[#6E6E73] max-w-xl">
          Compartilhe seu link exclusivo do AgendaSte com colegas de estética, salão e bem-estar.
        </p>
        <button
          onClick={() =>
            onUpdateState((prev) => ({
              ...prev,
              lastToastMessage:
                "Link de indicação copiado para a área de transferência!",
            }))
          }
          className="px-6 py-3 rounded-full bg-[#1C1C1E] text-white text-[14px] font-semibold"
        >
          Copiar link de indicação
        </button>
      </div>
    </div>
  );
}
