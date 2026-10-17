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
    <div className="p-6 lg:p-10 max-w-[1360px] mx-auto space-y-8">
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
          <span className="px-2.5 py-0.5 rounded-full bg-[#ECE9FE] text-[#6E56CF] text-[11px] font-bold">
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
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#ECE9FE] text-[#6E56CF] text-[11px] font-bold">
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
                  <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold uppercase">
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
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ECE9FE] text-[#6E56CF]">
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
    <div className="p-6 lg:p-10 max-w-[1260px] mx-auto space-y-8">
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
                  ? "bg-[#1C1C1E] text-white"
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
            <div className="px-4 py-2.5 rounded-[12px] bg-[#ECE9FE] text-[#1C1C1E] font-semibold text-[13px]">
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
                    <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[10px] font-bold">
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
                    ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
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
// 3. COMPLEMENTARY SIDEBAR VIEWS (Insights, Inventory, Charts, Refer)
// =============================================================================

export function ComplementarySectionView({
  section,
  state,
  onUpdateState,
}: {
  section: "insights" | "inventory" | "charts" | "refer";
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
}) {
  if (section === "insights") {
    const totalSalesCents = state.salesHistory.reduce(
      (sum, s) => sum + s.amountCents + s.tipCents,
      0
    );
    return (
      <div className="p-6 lg:p-10 max-w-[1360px] mx-auto space-y-6">
        <h1 className="text-[28px] font-bold text-[#1C1C1E]">
          Relatórios &amp; Insights Financeiros
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card">
            <span className="text-[12px] text-[#6E6E73] font-semibold">
              Receita Consolidada
            </span>
            <p className="text-[30px] font-mono font-bold text-[#1C1C1E] mt-1">
              {formatBRL(totalSalesCents)}
            </p>
            <span className="text-[12px] text-[#16A34A] font-semibold">
              +24% vs. mês anterior
            </span>
          </div>
          <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card">
            <span className="text-[12px] text-[#6E6E73] font-semibold">
              Taxa de Retenção (Rebooking 1-Toque)
            </span>
            <p className="text-[30px] font-mono font-bold text-[#6E56CF] mt-1">
              88,4%
            </p>
            <span className="text-[12px] text-[#6E6E73]">
              Zero faltas (No-show) com Sinal Pix ativo
            </span>
          </div>
          <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card">
            <span className="text-[12px] text-[#6E6E73] font-semibold">
              Clientes Cadastrados
            </span>
            <p className="text-[30px] font-mono font-bold text-[#1C1C1E] mt-1">
              {state.clients.length}
            </p>
            <span className="text-[12px] text-[#E11D8F] font-semibold">
              WhatsApp 2-Way ativo 24/7
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (section === "inventory") {
    return (
      <div className="p-6 lg:p-10 max-w-[1360px] mx-auto space-y-6">
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
                    className={`px-3 py-1 rounded-full text-[12px] font-bold ${
                      item.stockQuantity <= item.minStockAlert
                        ? "bg-[#FEF3C7] text-[#D97706]"
                        : "bg-[#DCFCE7] text-[#16A34A]"
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
      <div className="p-6 lg:p-10 max-w-[1360px] mx-auto space-y-6">
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
    <div className="p-6 lg:p-10 max-w-[1360px] mx-auto">
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
