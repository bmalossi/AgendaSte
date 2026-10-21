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
  ArrowLeft,
  CheckCircle2,
  User,
  MoreVertical,
  ChevronsUpDown,
  Settings,
  Trash2,
  MapPin,
  Loader2,
  Download,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import {
  StudioState,
  MarketingCampaignItem,
  ClinicalChartEntry,
  ClinicalChartPhotoItem,
  ClinicalChartProductUsage,
  ClinicalChartMarkupPin,
  formatBRL,
  generateMarketingDraftAI,
  sendMarketingCampaign,
  updateStudioSettings,
  filterClientsByRetention,
} from "@/lib/agendaste-store";
import { WhatsAppConfigCard } from "@/components/agendaste/whatsapp-config-card";

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
    "Sentimos sua falta no Luvea Studio · Seu horário especial te espera"
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
            Alcance mais clientes com o Marketing LUVEA
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
                      LUVEA STUDIO
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

export { SettingsView } from "./settings-view";

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
                Analista de Crescimento LUVEA
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
        `luvea-relatorio-${selectedReport.id}-${startDateISO}-a-${endDateISO}.csv`
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
    const recipient = state.settings.personal.email || "contato@luvea.app";
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
                    ? "border-[1.5px] border-[#1C1C1E] bg-[#EFF3F0] dark:border-white dark:bg-[#27272a]"
                    : "border border-[#E5E5EA] bg-white hover:border-[#C7C7CC] dark:border-[#27272a] dark:bg-[#18181b] dark:hover:border-[#3f3f46]"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      card.isCustomAi
                        ? "bg-[#C5D82D] text-[#09090b]"
                        : "bg-[#F2F4F2] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white"
                    }`}
                  >
                    {renderReportCardIcon(card.id)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white leading-snug">
                      {card.title}
                    </p>
                    <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5 leading-snug">
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
        <aside className="w-full lg:w-[350px] xl:w-[380px] bg-white dark:bg-[#18181b] border-t lg:border-t-0 lg:border-l border-[#E5E5EA] dark:border-[#27272a] flex flex-col justify-between shrink-0">
          <div className="p-6 space-y-6">
            {/* Drawer Header */}
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[18px] font-semibold text-[#1C1C1E] dark:text-white">
                {selectedReport.title}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedReportId(null)}
                aria-label="Fechar painel de relatório"
                className="p-1 rounded-full text-[#1C1C1E] dark:text-white hover:bg-[#F2F2F7] dark:hover:bg-[#27272a] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedReport.isCustomAi && (
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                  O que você gostaria de incluir?
                </label>
                <textarea
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ex.: Clientes que fizeram Mechas nos últimos 60 dias e ainda não agendaram retorno..."
                  className="w-full rounded-[10px] border border-[#D1D1D6] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3.5 py-2.5 text-[13px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] dark:placeholder:text-[#71717a] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
                />
              </div>
            )}

            {/* Staff Selector */}
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                Profissional
              </label>
              <div className="relative">
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full appearance-none rounded-[10px] border border-[#D1D1D6] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3.5 py-2.5 pr-9 text-[13.5px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
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
                <ChevronDown className="w-4 h-4 text-[#1C1C1E] dark:text-[#a1a1aa] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Dates Selector */}
            <div className="space-y-2.5">
              <label className="block text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                Datas
              </label>
              <div className="relative">
                <select
                  value={dateRangePreset}
                  onChange={(e) => handleDatePresetChange(e.target.value)}
                  className="w-full appearance-none rounded-[10px] border border-[#D1D1D6] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3.5 py-2.5 pr-9 text-[13.5px] text-[#1C1C1E] dark:text-white focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white"
                >
                  <option value="month_to_date">Mês até a data</option>
                  <option value="last_month">Mês passado</option>
                  <option value="last_30_days">Últimos 30 dias</option>
                  <option value="this_year">Este ano</option>
                  <option value="custom">Personalizado</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#1C1C1E] dark:text-[#a1a1aa] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-[10px] border border-[#D1D1D6] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3 py-1.5">
                  <span className="block text-[11px] text-[#8E8E93] dark:text-[#71717a]">
                    Data inicial
                  </span>
                  <input
                    type="date"
                    value={startDateISO}
                    onChange={(e) => {
                      setStartDateISO(e.target.value);
                      setDateRangePreset("custom");
                    }}
                    className="w-full bg-transparent text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none mt-0.5"
                  />
                </div>

                <div className="rounded-[10px] border border-[#D1D1D6] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3 py-1.5">
                  <span className="block text-[11px] text-[#8E8E93] dark:text-[#71717a]">
                    Data final
                  </span>
                  <input
                    type="date"
                    value={endDateISO}
                    onChange={(e) => {
                      setEndDateISO(e.target.value);
                      setDateRangePreset("custom");
                    }}
                    className="w-full bg-transparent text-[13px] font-medium text-[#1C1C1E] dark:text-white focus:outline-none mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* Summary Preview Box */}
            <div className="rounded-[12px] border border-[#E5E5EA] dark:border-[#27272a] bg-[#FAF9F6] dark:bg-[#121214] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-[#1C1C1E] dark:text-white">
                  Registros encontrados
                </span>
                <span className="font-mono font-bold text-[#1C1C1E] dark:text-white">
                  {previewRecordCount}
                </span>
              </div>
              <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
                Formato de exportação: planilha CSV compatível com Excel e Google Sheets.
              </p>
            </div>

            {feedbackBanner && (
              <div className="rounded-[10px] border border-[#1C1C1E] dark:border-[#3f3f46] bg-[#EFF3F0] dark:bg-[#27272a] px-3.5 py-2.5 text-[12px] font-medium text-[#1C1C1E] dark:text-white">
                {feedbackBanner}
              </div>
            )}
          </div>

          {/* Bottom Action Buttons (Email / Download) */}
          <div className="p-5 border-t border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b]">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSendEmail}
                className="w-full py-2.5 px-4 rounded-full border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[13.5px] font-semibold transition-colors"
              >
                E-mail
              </button>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="w-full py-2.5 px-4 rounded-full bg-[#1C1C1E] dark:bg-white hover:bg-[#2C2C2E] dark:hover:bg-[#f4f4f5] text-white dark:text-[#09090b] text-[13.5px] font-semibold transition-colors"
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

type ChartSectionAnchorId =
  | "chart_details"
  | "photos_markup"
  | "product_details"
  | "treatment_note";

const DEFAULT_FALLBACK_CHARTS: ClinicalChartEntry[] = [
  {
    id: "chart-stefany-1",
    clientId: "cli-stefany",
    clientName: "Stefany",
    chartName: "17 de out. de 2026",
    serviceIds: [],
    serviceNames: [],
    providerId: "staff-bruno",
    providerName: "Bruno Fernandes Malossi Silva",
    status: "completed",
    version: 1,
    createdDateLabel: "17 de out. de 2026",
    lastModifiedLabel: "17 de out. de 2026 15:38",
    photos: [],
    productsUsed: [],
    templateType: "soap",
    soapNoteName: "Avaliação e Protocolo Inicial",
    subjective:
      "Cliente relata desejo de iluminação natural sem sensibilizar o couro cabeludo.",
    objective:
      "Fios com boa elasticidade, fundo natural 6.0 com 4cm de crescimento na raiz.",
    assessment:
      "Apta para protocolo de iluminação com proteção de pontes dissulfeto (Plex).",
    plan: "Realizar teste de mecha preventivo, aplicar proteção plex e agendar manutenção de gloss em 30 dias.",
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function ClinicalChartsSection({
  state,
  onUpdateState,
}: {
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
}) {
  const charts: ClinicalChartEntry[] =
    state.clinicalCharts && state.clinicalCharts.length > 0
      ? state.clinicalCharts
      : DEFAULT_FALLBACK_CHARTS;

  // Mode: null = List table view ("Prontuários"), string = active chart id in Editor ("Entradas de prontuário")
  const [activeChartId, setActiveChartId] = useState<string | null>(null);
  const [activeAnchor, setActiveAnchor] =
    useState<ChartSectionAnchorId>("chart_details");

  // List filters & menus
  const [filterClientId, setFilterClientId] = useState<string>("all");
  const [filterProviderId, setFilterProviderId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "created" | "completed"
  >("all");
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Editor helper states
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [addingProductOpen, setAddingProductOpen] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>(
    state.inventory[0]?.id ?? "custom"
  );
  const [customProductName, setCustomProductName] = useState("");
  const [productLotSku, setProductLotSku] = useState("");
  const [productQuantity, setProductQuantity] = useState("1 unid.");
  const [productNotes, setProductNotes] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<{ url: string; title: string } | null>(null);

  const ownerFullName =
    `${state.settings.personal.firstName} ${state.settings.personal.lastName}`.trim() ||
    "Bruno Fernandes Malossi Silva";

  const activeChart =
    charts.find((c) => c.id === activeChartId) ?? null;

  const updateChartById = (
    chartId: string,
    updater: (chart: ClinicalChartEntry) => ClinicalChartEntry
  ) => {
    onUpdateState((prev) => {
      const currentList =
        prev.clinicalCharts && prev.clinicalCharts.length > 0
          ? prev.clinicalCharts
          : DEFAULT_FALLBACK_CHARTS;
      const nowTime = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return {
        ...prev,
        clinicalCharts: currentList.map((item) =>
          item.id === chartId
            ? {
                ...updater(item),
                lastModifiedLabel: `17 de out. de 2026 ${nowTime}`,
              }
            : item
        ),
      };
    });
  };

  const handleCreateNewChart = () => {
    const defaultClient = state.clients[0] ?? {
      id: "cli-stefany",
      fullName: "Stefany",
    };
    const nowTime = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const newChart: ClinicalChartEntry = {
      id: `chart-${Date.now()}`,
      clientId: defaultClient.id,
      clientName: defaultClient.fullName,
      chartName: "17 de out. de 2026",
      serviceIds: [],
      serviceNames: [],
      providerId: state.staff[0]?.id ?? "staff-bruno",
      providerName: ownerFullName,
      status: "created",
      version: 1,
      createdDateLabel: "17 de out. de 2026",
      lastModifiedLabel: `17 de out. de 2026 ${nowTime}`,
      photos: [],
      productsUsed: [],
      templateType: "soap",
      soapNoteName: "",
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
    };

    onUpdateState((prev) => {
      const currentList =
        prev.clinicalCharts && prev.clinicalCharts.length > 0
          ? prev.clinicalCharts
          : DEFAULT_FALLBACK_CHARTS;
      return {
        ...prev,
        clinicalCharts: [newChart, ...currentList],
      };
    });

    setActiveChartId(newChart.id);
    setActiveAnchor("chart_details");
    setOpenRowMenuId(null);
  };

  const handleMarkAsComplete = (chartId: string) => {
    updateChartById(chartId, (c) => ({
      ...c,
      status: "completed",
    }));
    onUpdateState((prev) => ({
      ...prev,
      lastToastMessage: "Prontuário assinado e marcado como concluído!",
    }));
    setActiveChartId(null);
  };

  const handleAmendChart = (chartId: string) => {
    updateChartById(chartId, (c) => ({
      ...c,
      status: "created",
      version: c.version + 1,
    }));
    setActiveChartId(chartId);
    setActiveAnchor("chart_details");
    setOpenRowMenuId(null);
    onUpdateState((prev) => ({
      ...prev,
      lastToastMessage: "Modo de retificação ativado (nova versão criada).",
    }));
  };

  const handleDeleteChart = (chart: ClinicalChartEntry) => {
    if (chart.status === "completed") return; // Completed clinical charts cannot be deleted
    onUpdateState((prev) => {
      const currentList =
        prev.clinicalCharts && prev.clinicalCharts.length > 0
          ? prev.clinicalCharts
          : DEFAULT_FALLBACK_CHARTS;
      return {
        ...prev,
        clinicalCharts: currentList.filter((item) => item.id !== chart.id),
        lastToastMessage: "Rascunho de prontuário excluído.",
      };
    });
    setOpenRowMenuId(null);
  };

  const scrollToChartSection = (anchor: ChartSectionAnchorId) => {
    setActiveAnchor(anchor);
    if (typeof document !== "undefined") {
      const el = document.getElementById(`luvea-chart-${anchor}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleAddPhotoFromGallery = () => {
    if (!activeChart) return;
    const samplePhoto: ClinicalChartPhotoItem = {
      id: `ph-${Date.now()}`,
      url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
      caption: "Antes & Mapeamento Anatômico — Clique na imagem para marcar pontos",
      stage: "mapping",
      pins: [
        {
          id: `pin-${Date.now()}-1`,
          xPercent: 48,
          yPercent: 34,
          label: "Ponto 1 · Área Frontal / Glabela",
        },
      ],
    };
    updateChartById(activeChart.id, (c) => ({
      ...c,
      photos: [...c.photos, samplePhoto],
    }));
  };

  const handleUploadDevicePhoto = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!activeChart) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "prontuarios");

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (res.ok && data.success && data.url) {
            const uploadedPhoto: ClinicalChartPhotoItem = {
              id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              url: data.url,
              caption: file.name,
              stage: "before",
              pins: [],
            };
            updateChartById(activeChart.id, (c) => ({
              ...c,
              photos: [...c.photos, uploadedPhoto],
            }));
            onUpdateState((prev) => ({
              ...prev,
              lastToastMessage: `Foto "${file.name}" salva com sucesso!`,
            }));
          } else {
            // Fallback para visualização local imediata
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") {
                const uploadedPhoto: ClinicalChartPhotoItem = {
                  id: `ph-dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  url: reader.result,
                  caption: file.name,
                  stage: "before",
                  pins: [],
                };
                updateChartById(activeChart.id, (c) => ({
                  ...c,
                  photos: [...c.photos, uploadedPhoto],
                }));
              }
            };
            reader.readAsDataURL(file);
          }
        } catch (err) {
          console.warn("Erro ao enviar foto para /api/upload, aplicando fallback local:", err);
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              const uploadedPhoto: ClinicalChartPhotoItem = {
                id: `ph-dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                url: reader.result,
                caption: file.name,
                stage: "before",
                pins: [],
              };
              updateChartById(activeChart.id, (c) => ({
                ...c,
                photos: [...c.photos, uploadedPhoto],
              }));
            }
          };
          reader.readAsDataURL(file);
        }
      }
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handlePhotoCanvasClick = (
    photoId: string,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!activeChart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPercent = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    updateChartById(activeChart.id, (c) => ({
      ...c,
      photos: c.photos.map((ph) => {
        if (ph.id !== photoId) return ph;
        const nextNum = ph.pins.length + 1;
        const newPin: ClinicalChartMarkupPin = {
          id: `pin-${Date.now()}`,
          xPercent,
          yPercent,
          label: `Ponto ${nextNum} · Área de aplicação`,
        };
        return {
          ...ph,
          pins: [...ph.pins, newPin],
        };
      }),
    }));
  };

  const handleConfirmAddProduct = () => {
    if (!activeChart) return;
    const invItem = state.inventory.find((i) => i.id === selectedInventoryId);
    const productName =
      selectedInventoryId === "custom"
        ? customProductName.trim() || "Insumo Profissional"
        : invItem?.name || "Produto do Estoque";
    const skuOrLot =
      productLotSku.trim() || invItem?.sku || "LOTE-2026-BR";

    const newUsage: ClinicalChartProductUsage = {
      id: `prd-use-${Date.now()}`,
      inventoryProductId:
        selectedInventoryId === "custom" ? undefined : selectedInventoryId,
      productName,
      skuOrLot,
      quantity: productQuantity.trim() || "1 unid.",
      notes: productNotes.trim(),
    };

    updateChartById(activeChart.id, (c) => ({
      ...c,
      productsUsed: [...c.productsUsed, newUsage],
    }));

    setAddingProductOpen(false);
    setCustomProductName("");
    setProductLotSku("");
    setProductQuantity("1 unid.");
    setProductNotes("");
  };

  // ===========================================================================
  // VIEW A: CHART ENTRY EDITOR ("Entradas de prontuário" / "Chart entries")
  // ===========================================================================
  if (activeChart) {
    const anchorItems: Array<{ id: ChartSectionAnchorId; label: string }> = [
      { id: "chart_details", label: "Detalhes do prontuário" },
      { id: "photos_markup", label: "Fotos e marcações" },
      { id: "product_details", label: "Detalhes de produtos" },
      { id: "treatment_note", label: "Nota de evolução" },
    ];

    return (
      <div className="w-full min-h-[calc(100vh-56px)] bg-white flex flex-col">
        {/* Top Sticky Header Bar */}
        <div className="w-full border-b border-[#EFEFF4] bg-white px-6 lg:px-10 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-20">
          <button
            type="button"
            onClick={() => setActiveChartId(null)}
            className="inline-flex items-center gap-2.5 text-[#1C1C1E] hover:opacity-75 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4 text-[#1C1C1E]" />
            <span className="text-[16px] font-semibold tracking-tight">
              Entradas de prontuário
            </span>
          </button>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6E6E73]">
              <CheckCircle2 className="w-4 h-4 text-[#6E6E73]" />
              <span>Salvo</span>
            </span>

            {activeChart.status === "created" ? (
              <button
                type="button"
                onClick={() => handleMarkAsComplete(activeChart.id)}
                className="px-4 py-2 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[13px] font-semibold transition-colors"
              >
                Marcar como concluído
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleAmendChart(activeChart.id)}
                className="px-4 py-2 rounded-full border border-[#1C1C1E] bg-white hover:bg-[#F5F5F7] text-[#1C1C1E] text-[13px] font-semibold transition-colors"
              >
                Retificar prontuário (v{activeChart.version + 1})
              </button>
            )}
          </div>
        </div>

        {/* Main Two-Column Content */}
        <div className="w-full px-6 lg:px-10 py-8 flex flex-col lg:flex-row items-start gap-10 lg:gap-20">
          {/* Left Sticky Section Anchor Navigation */}
          <nav className="w-full lg:w-[190px] shrink-0 lg:sticky lg:top-20 flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
            {anchorItems.map((item) => {
              const isActive = activeAnchor === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToChartSection(item.id)}
                  className={`text-left px-3.5 py-2 rounded-[8px] text-[13px] whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#D1D1D6] text-[#1C1C1E] font-semibold"
                      : "text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#F5F5F7] font-medium"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Center Form Body */}
          <div className="flex-1 max-w-[660px] w-full space-y-10 pb-24">
            {/* 1. DETALHES DO PRONTUÁRIO */}
            <section
              id="luvea-chart-chart_details"
              onMouseEnter={() => setActiveAnchor("chart_details")}
              className="space-y-6 scroll-mt-24"
            >
              {/* Client Hero */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#F6C6EA] flex items-center justify-center text-[#9D174D] shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <h1 className="font-serif text-[38px] leading-none text-[#1C1C1E] tracking-tight">
                    {activeChart.clientName}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#6E6E73]">
                  <span>
                    {activeChart.createdDateLabel} | Profissional:{" "}
                    {activeChart.providerName}
                  </span>
                  {activeChart.status === "completed" ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#9EE37D] text-[#1C1C1E] text-[11.5px] font-semibold">
                      Concluído
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E5E5EA] text-[#1C1C1E] text-[11.5px] font-semibold">
                      Criado
                    </span>
                  )}
                  {activeChart.version > 1 && (
                    <span className="px-2 py-0.5 rounded-full border border-[#D1D1D6] text-[#1C1C1E] text-[11px] font-semibold">
                      v{activeChart.version}
                    </span>
                  )}
                </div>
              </div>

              {/* Stacked Form Controls */}
              <div className="space-y-3">
                {/* Client Field */}
                <div className="rounded-[12px] border border-[#D1D1D6] bg-white px-4 py-2.5 focus-within:border-[#1C1C1E] transition-colors">
                  <label className="block text-[11.5px] text-[#6E6E73]">
                    Cliente
                  </label>
                  <div className="relative flex items-center gap-2 mt-1">
                    <span className="w-5 h-5 rounded-full bg-[#ECEEF0] text-[#1C1C1E] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {getInitials(activeChart.clientName)}
                    </span>
                    <select
                      value={activeChart.clientId}
                      onChange={(e) => {
                        const found = state.clients.find(
                          (c) => c.id === e.target.value
                        );
                        if (found) {
                          updateChartById(activeChart.id, (c) => ({
                            ...c,
                            clientId: found.id,
                            clientName: found.fullName,
                          }));
                        }
                      }}
                      className="w-full appearance-none bg-transparent pr-6 text-[13.5px] font-medium text-[#1C1C1E] focus:outline-none"
                    >
                      {state.clients.map((cli) => (
                        <option key={cli.id} value={cli.id}>
                          {cli.fullName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#1C1C1E] pointer-events-none absolute right-0" />
                  </div>
                </div>

                {/* Chart Name Field */}
                <div className="rounded-[12px] border border-[#D1D1D6] bg-white px-4 py-2.5 focus-within:border-[#1C1C1E] transition-colors">
                  <label className="block text-[11.5px] text-[#6E6E73]">
                    Nome do prontuário
                  </label>
                  <input
                    type="text"
                    value={activeChart.chartName}
                    onChange={(e) =>
                      updateChartById(activeChart.id, (c) => ({
                        ...c,
                        chartName: e.target.value,
                      }))
                    }
                    placeholder="17 de out. de 2026"
                    className="w-full bg-transparent text-[13.5px] font-medium text-[#1C1C1E] focus:outline-none mt-0.5"
                  />
                </div>

                {/* Select Services Multi-select */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setServicesDropdownOpen((prev) => !prev)
                    }
                    className="w-full rounded-[12px] border border-[#D1D1D6] bg-white px-4 py-3.5 text-left flex items-center justify-between gap-3 hover:border-[#1C1C1E] transition-colors"
                  >
                    <span
                      className={`text-[13.5px] ${
                        activeChart.serviceNames.length > 0
                          ? "font-medium text-[#1C1C1E]"
                          : "text-[#6E6E73]"
                      }`}
                    >
                      {activeChart.serviceNames.length > 0
                        ? activeChart.serviceNames.join(", ")
                        : "Selecionar serviços"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#1C1C1E] shrink-0" />
                  </button>

                  {servicesDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 rounded-[12px] border border-[#E5E5EA] bg-white shadow-lg py-2 z-20 max-h-60 overflow-y-auto">
                      {state.services.map((srv) => {
                        const checked = activeChart.serviceIds.includes(srv.id);
                        return (
                          <button
                            key={srv.id}
                            type="button"
                            onClick={() => {
                              updateChartById(activeChart.id, (c) => {
                                const exists = c.serviceIds.includes(srv.id);
                                const nextIds = exists
                                  ? c.serviceIds.filter((id) => id !== srv.id)
                                  : [...c.serviceIds, srv.id];
                                const nextNames = state.services
                                  .filter((s) => nextIds.includes(s.id))
                                  .map((s) => s.name);
                                return {
                                  ...c,
                                  serviceIds: nextIds,
                                  serviceNames: nextNames,
                                };
                              });
                            }}
                            className="w-full px-4 py-2.5 text-left text-[13px] flex items-center justify-between hover:bg-[#F5F5F7]"
                          >
                            <span className="font-medium text-[#1C1C1E]">
                              {srv.name}
                            </span>
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center border ${
                                checked
                                  ? "bg-[#1C1C1E] border-[#1C1C1E] text-white"
                                  : "border-[#C7C7CC] bg-white"
                              }`}
                            >
                              {checked && <Check className="w-3 h-3" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 2. FOTOS E MARCAÇÕES */}
            <section
              id="luvea-chart-photos_markup"
              onMouseEnter={() => setActiveAnchor("photos_markup")}
              className="space-y-3 scroll-mt-24"
            >
              <div>
                <h2 className="text-[18px] font-semibold text-[#1C1C1E]">
                  Fotos e marcações
                </h2>
                <p className="text-[13px] text-[#6E6E73] mt-0.5">
                  Mapeie pontos de aplicação e áreas de tratamento
                </p>
              </div>

              <div className="rounded-[14px] border border-dashed border-[#D1D1D6] bg-white p-8">
                {/* Visual Collage Header */}
                <div className="flex flex-col items-center text-center max-w-md mx-auto">
                  <div className="relative w-56 h-36 flex items-center justify-center mb-4">
                    {/* Left Tilted Photo Card */}
                    <div className="w-24 h-28 rounded-[12px] overflow-hidden border-2 border-white shadow-md -rotate-6 -mr-4 bg-[#E5E5EA]">
                      <img
                        src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80"
                        alt="Antes"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Right Tilted Photo Card */}
                    <div className="w-28 h-32 rounded-[12px] overflow-hidden border-2 border-white shadow-md rotate-6 bg-[#E5E5EA] z-10">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                        alt="Depois"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Floating Solid Pill Top-Right */}
                    <span className="absolute -right-6 top-6 z-20 px-3 py-1 rounded-full bg-[#F2F2F7] border border-[#E5E5EA] text-[11px] font-medium text-[#1C1C1E] shadow-sm whitespace-nowrap">
                      + Organizando fotos...
                    </span>
                    {/* Floating Solid Pill Bottom-Left */}
                    <span className="absolute -left-10 bottom-3 z-20 px-3 py-1 rounded-full bg-[#F2F2F7] border border-[#E5E5EA] text-[11px] font-medium text-[#1C1C1E] shadow-sm whitespace-nowrap">
                      + Gerando documentação...
                    </span>
                  </div>

                  <p className="text-[14.5px] font-medium text-[#1C1C1E] leading-snug">
                    Adicione fotos de antes e depois.
                    <br />
                    Organizadas e rotuladas - prontas para marcação.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
                    <label
                      className={`cursor-pointer px-4 py-2 rounded-full border border-[#D1D1D6] bg-white hover:bg-[#F5F5F7] text-[12.5px] font-semibold text-[#1C1C1E] transition-colors inline-flex items-center gap-2 ${
                        isUploadingPhoto ? "opacity-60 pointer-events-none" : ""
                      }`}
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1C1C1E]" />
                          <span>Enviando foto...</span>
                        </>
                      ) : (
                        <span>Adicionar do dispositivo</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isUploadingPhoto}
                        onChange={handleUploadDevicePhoto}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={handleAddPhotoFromGallery}
                      className="px-4 py-2 rounded-full border border-[#D1D1D6] bg-white hover:bg-[#F5F5F7] text-[12.5px] font-semibold text-[#1C1C1E] transition-colors"
                    >
                      Adicionar da galeria da cliente
                    </button>
                  </div>

                  {isUploadingPhoto && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-[12px] font-medium text-[#1C1C1E] animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1C1C1E]" />
                      <span>Processando e enviando imagem...</span>
                    </div>
                  )}
                </div>

                {/* Interactive Photos & Markup Pins Canvas */}
                {activeChart.photos.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-[#EFEFF4] space-y-6">
                    {activeChart.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="rounded-[12px] border border-[#E5E5EA] bg-[#FAF9F6] p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[12.5px] font-semibold text-[#1C1C1E] truncate max-w-[200px] sm:max-w-md">
                            {photo.caption}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewPhotoUrl({
                                  url: photo.url,
                                  title: photo.caption,
                                })
                              }
                              className="px-2.5 py-1 rounded-[6px] border border-[#D1D1D6] bg-white hover:bg-[#F5F5F7] text-[11.5px] font-medium text-[#1C1C1E] inline-flex items-center gap-1 transition-colors"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              Ampliar
                            </button>
                            <a
                              href={photo.url}
                              download={`prontuario-${photo.id}.jpg`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-[6px] border border-[#D1D1D6] bg-white hover:bg-[#F5F5F7] text-[11.5px] font-medium text-[#1C1C1E] inline-flex items-center gap-1 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Baixar
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Deseja realmente remover esta foto do prontuário?"
                                  )
                                ) {
                                  updateChartById(activeChart.id, (c) => ({
                                    ...c,
                                    photos: c.photos.filter(
                                      (p) => p.id !== photo.id
                                    ),
                                  }));
                                }
                              }}
                              className="px-2.5 py-1 rounded-[6px] border border-[#FCA5A5] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[11.5px] font-medium text-[#B91C1C] inline-flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          </div>
                        </div>

                        <div
                          onClick={(e) => handlePhotoCanvasClick(photo.id, e)}
                          title="Clique em qualquer ponto da foto para adicionar uma marcação"
                          className="relative w-full max-h-[340px] overflow-hidden rounded-[10px] border border-[#D1D1D6] cursor-crosshair bg-[#1C1C1E]"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="w-full h-[300px] object-cover select-none"
                          />
                          {photo.pins.map((pin, idx) => (
                            <div
                              key={pin.id}
                              style={{
                                left: `${pin.xPercent}%`,
                                top: `${pin.yPercent}%`,
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1C1C1E] border-2 border-white text-white text-[11px] font-bold flex items-center justify-center shadow-md"
                            >
                              {idx + 1}
                            </div>
                          ))}
                        </div>

                        {photo.pins.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11.5px] font-semibold text-[#6E6E73]">
                              Pontos mapeados na imagem (clique na foto para adicionar mais):
                            </p>
                            {photo.pins.map((pin, idx) => (
                              <div
                                key={pin.id}
                                className="flex items-center gap-2"
                              >
                                <span className="w-5 h-5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={pin.label}
                                  onChange={(e) => {
                                    const nextVal = e.target.value;
                                    updateChartById(activeChart.id, (c) => ({
                                      ...c,
                                      photos: c.photos.map((ph) =>
                                        ph.id === photo.id
                                          ? {
                                              ...ph,
                                              pins: ph.pins.map((p) =>
                                                p.id === pin.id
                                                  ? { ...p, label: nextVal }
                                                  : p
                                              ),
                                            }
                                          : ph
                                      ),
                                    }));
                                  }}
                                  className="flex-1 rounded-[8px] border border-[#D1D1D6] bg-white px-3 py-1.5 text-[12.5px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateChartById(activeChart.id, (c) => ({
                                      ...c,
                                      photos: c.photos.map((ph) =>
                                        ph.id === photo.id
                                          ? {
                                              ...ph,
                                              pins: ph.pins.filter(
                                                (p) => p.id !== pin.id
                                              ),
                                            }
                                          : ph
                                      ),
                                    }))
                                  }
                                  className="p-1 text-[#8E8E93] hover:text-[#1C1C1E]"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* 3. DETALHES DE PRODUTOS */}
            <section
              id="luvea-chart-product_details"
              onMouseEnter={() => setActiveAnchor("product_details")}
              className="space-y-3 scroll-mt-24"
            >
              <div>
                <h2 className="text-[18px] font-semibold text-[#1C1C1E]">
                  Detalhes de produtos
                </h2>
                <p className="text-[13px] text-[#6E6E73] mt-0.5">
                  Registre os produtos utilizados durante o procedimento para conformidade e controle de estoque.
                </p>
              </div>

              {activeChart.productsUsed.length > 0 && (
                <div className="space-y-2">
                  {activeChart.productsUsed.map((prod) => (
                    <div
                      key={prod.id}
                      className="rounded-[12px] border border-[#E5E5EA] bg-white px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-[13.5px] font-semibold text-[#1C1C1E]">
                          {prod.productName}
                        </p>
                        <p className="text-[12px] text-[#6E6E73]">
                          Lote/SKU: {prod.skuOrLot} · Qtd.: {prod.quantity}
                          {prod.notes ? ` · ${prod.notes}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateChartById(activeChart.id, (c) => ({
                            ...c,
                            productsUsed: c.productsUsed.filter(
                              (item) => item.id !== prod.id
                            ),
                          }))
                        }
                        className="p-1.5 rounded-full text-[#8E8E93] hover:text-[#B91C1C] hover:bg-[#F5F5F7]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {addingProductOpen ? (
                <div className="rounded-[14px] border border-[#1C1C1E] bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#1C1C1E]">
                      Adicionar produto utilizado no atendimento
                    </span>
                    <button
                      type="button"
                      onClick={() => setAddingProductOpen(false)}
                      className="text-[#8E8E93] hover:text-[#1C1C1E]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11.5px] text-[#6E6E73] mb-1">
                        Selecionar do estoque
                      </label>
                      <select
                        value={selectedInventoryId}
                        onChange={(e) => setSelectedInventoryId(e.target.value)}
                        className="w-full rounded-[10px] border border-[#D1D1D6] bg-white px-3 py-2 text-[13px] text-[#1C1C1E]"
                      >
                        {state.inventory.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.sku})
                          </option>
                        ))}
                        <option value="custom">Outro produto / fórmula manual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11.5px] text-[#6E6E73] mb-1">
                        Quantidade / Dosagem
                      </label>
                      <input
                        type="text"
                        value={productQuantity}
                        onChange={(e) => setProductQuantity(e.target.value)}
                        placeholder="Ex.: 30ml, 2 ampolas, 50g"
                        className="w-full rounded-[10px] border border-[#D1D1D6] bg-white px-3 py-2 text-[13px] text-[#1C1C1E]"
                      />
                    </div>
                  </div>

                  {selectedInventoryId === "custom" && (
                    <div>
                      <label className="block text-[11.5px] text-[#6E6E73] mb-1">
                        Nome do produto / ativo
                      </label>
                      <input
                        type="text"
                        value={customProductName}
                        onChange={(e) => setCustomProductName(e.target.value)}
                        placeholder="Ex.: Toxina Botulínica / Coloração 8.31"
                        className="w-full rounded-[10px] border border-[#D1D1D6] bg-white px-3 py-2 text-[13px] text-[#1C1C1E]"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11.5px] text-[#6E6E73] mb-1">
                        Lote / Validade (Anvisa)
                      </label>
                      <input
                        type="text"
                        value={productLotSku}
                        onChange={(e) => setProductLotSku(e.target.value)}
                        placeholder="Ex.: LOTE-9942A"
                        className="w-full rounded-[10px] border border-[#D1D1D6] bg-white px-3 py-2 text-[13px] text-[#1C1C1E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] text-[#6E6E73] mb-1">
                        Observações de aplicação
                      </label>
                      <input
                        type="text"
                        value={productNotes}
                        onChange={(e) => setProductNotes(e.target.value)}
                        placeholder="Ex.: Diluição 1:1.5 com oxidante 20v"
                        className="w-full rounded-[10px] border border-[#D1D1D6] bg-white px-3 py-2 text-[13px] text-[#1C1C1E]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAddingProductOpen(false)}
                      className="px-4 py-2 rounded-full border border-[#D1D1D6] text-[12.5px] font-semibold text-[#1C1C1E]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAddProduct}
                      className="px-4 py-2 rounded-full bg-[#1C1C1E] text-white text-[12.5px] font-semibold"
                    >
                      Confirmar produto
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingProductOpen(true)}
                  className="w-full py-3 rounded-full border border-[#D1D1D6] bg-white hover:bg-[#F5F5F7] text-[13.5px] font-semibold text-[#1C1C1E] flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4 text-[#1C1C1E]" />
                  <span>Adicionar produto</span>
                </button>
              )}
            </section>

            {/* 4. NOTA DE EVOLUÇÃO (TREATMENT NOTE / SOAP NOTE) */}
            <section
              id="luvea-chart-treatment_note"
              onMouseEnter={() => setActiveAnchor("treatment_note")}
              className="space-y-5 scroll-mt-24"
            >
              <h2 className="text-[18px] font-semibold text-[#1C1C1E]">
                Nota de evolução
              </h2>

              {/* Select Template */}
              <div className="rounded-[12px] border border-[#D1D1D6] bg-white px-4 py-2.5 focus-within:border-[#1C1C1E] transition-colors">
                <label className="block text-[11.5px] text-[#6E6E73]">
                  Selecionar modelo
                </label>
                <div className="relative mt-0.5">
                  <select
                    value={activeChart.templateType}
                    onChange={(e) =>
                      updateChartById(activeChart.id, (c) => ({
                        ...c,
                        templateType: e.target
                          .value as ClinicalChartEntry["templateType"],
                      }))
                    }
                    className="w-full appearance-none bg-transparent pr-6 text-[13.5px] font-medium text-[#1C1C1E] focus:outline-none"
                  >
                    <option value="soap">Nota SOAP</option>
                    <option value="aesthetic_anamnesis">
                      Anamnese Estética &amp; Capilar
                    </option>
                    <option value="injectables">
                      Protocolo de Injetáveis &amp; Harmonização
                    </option>
                    <option value="free_note">Nota Livre de Evolução</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#1C1C1E] pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* SOAP note name */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#1C1C1E]">
                  Nome da nota SOAP
                </label>
                <input
                  type="text"
                  value={activeChart.soapNoteName}
                  onChange={(e) =>
                    updateChartById(activeChart.id, (c) => ({
                      ...c,
                      soapNoteName: e.target.value,
                    }))
                  }
                  placeholder="Nome da nota SOAP"
                  className="w-full rounded-[12px] border border-[#D1D1D6] bg-white px-4 py-3 text-[13.5px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E]"
                />
              </div>

              {/* Subjective */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#1C1C1E]">
                  Subjetivo
                </label>
                <p className="text-[12.5px] text-[#6E6E73]">
                  Insira os relatos da cliente sobre queixas, sintomas ou objetivos.
                </p>
                <textarea
                  rows={5}
                  value={activeChart.subjective}
                  onChange={(e) =>
                    updateChartById(activeChart.id, (c) => ({
                      ...c,
                      subjective: e.target.value,
                    }))
                  }
                  placeholder="Subjetivo"
                  className="w-full rounded-[12px] border border-[#D1D1D6] bg-white p-4 text-[13.5px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E]"
                />
              </div>

              {/* Objective */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#1C1C1E]">
                  Objetivo
                </label>
                <p className="text-[12.5px] text-[#6E6E73]">
                  Insira observações de sinais visíveis, medidas ou achados físicos.
                </p>
                <textarea
                  rows={5}
                  value={activeChart.objective}
                  onChange={(e) =>
                    updateChartById(activeChart.id, (c) => ({
                      ...c,
                      objective: e.target.value,
                    }))
                  }
                  placeholder="Objetivo"
                  className="w-full rounded-[12px] border border-[#D1D1D6] bg-white p-4 text-[13.5px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E]"
                />
              </div>

              {/* Assessment */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#1C1C1E]">
                  Avaliação
                </label>
                <p className="text-[12.5px] text-[#6E6E73]">
                  Insira sua avaliação profissional com base nos achados clínicos.
                </p>
                <textarea
                  rows={5}
                  value={activeChart.assessment}
                  onChange={(e) =>
                    updateChartById(activeChart.id, (c) => ({
                      ...c,
                      assessment: e.target.value,
                    }))
                  }
                  placeholder="Avaliação"
                  className="w-full rounded-[12px] border border-[#D1D1D6] bg-white p-4 text-[13.5px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E]"
                />
              </div>

              {/* Plan */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#1C1C1E]">
                  Plano
                </label>
                <p className="text-[12.5px] text-[#6E6E73]">
                  Insira o procedimento realizado e os próximos passos.
                </p>
                <textarea
                  rows={5}
                  value={activeChart.plan}
                  onChange={(e) =>
                    updateChartById(activeChart.id, (c) => ({
                      ...c,
                      plan: e.target.value,
                    }))
                  }
                  placeholder="Plano"
                  className="w-full rounded-[12px] border border-[#D1D1D6] bg-white p-4 text-[13.5px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E]"
                />
              </div>
            </section>
          </div>
        </div>

        {/* Modal Lightbox de Foto do Prontuário */}
        {previewPhotoUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm"
            onClick={() => setPreviewPhotoUrl(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] bg-[#1C1C1E] rounded-[16px] overflow-hidden flex flex-col shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#1C1C1E] text-white">
                <span className="text-[13.5px] font-semibold text-white/90 truncate max-w-[260px] sm:max-w-md">
                  {previewPhotoUrl.title || "Visualização da Foto do Prontuário"}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={previewPhotoUrl.url}
                    download="foto-prontuario.jpg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-[8px] bg-white/10 hover:bg-white/20 text-white text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar</span>
                  </a>
                  <a
                    href={previewPhotoUrl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-[8px] bg-white/10 hover:bg-white/20 text-white text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Original</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewPhotoUrl(null)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center bg-black/90 p-2 sm:p-6 min-h-[300px]">
                <img
                  src={previewPhotoUrl.url}
                  alt={previewPhotoUrl.title || "Foto do prontuário ampliada"}
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-[8px] select-none shadow-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // VIEW B: CHARTS TABLE LIST VIEW ("Prontuários" / "Charts")
  // ===========================================================================
  const filteredCharts = charts.filter((c) => {
    if (filterClientId !== "all" && c.clientId !== filterClientId) return false;
    if (filterProviderId !== "all" && c.providerId !== filterProviderId)
      return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="w-full min-h-[calc(100vh-56px)] bg-white px-6 lg:px-10 xl:px-12 py-7 space-y-5">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[22px] font-semibold text-[#1C1C1E] tracking-tight">
          Prontuários
        </h1>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSettingsModalOpen((prev) => !prev)}
            aria-label="Configurações de modelos de prontuário"
            className="w-9 h-9 rounded-full border border-[#D1D1D6] bg-white hover:bg-[#F5F5F7] flex items-center justify-center text-[#1C1C1E] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleCreateNewChart}
            className="px-4 py-2 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[13px] font-semibold transition-colors"
          >
            Criar prontuário
          </button>
        </div>
      </div>

      {settingsModalOpen && (
        <div className="rounded-[14px] border border-[#E5E5EA] bg-[#FAF9F6] p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-[#1C1C1E]">
              Modelos de Prontuário &amp; Conformidade Clínica
            </p>
            <p className="text-[12px] text-[#6E6E73]">
              Modelo padrão ativo: Nota SOAP (Subjetivo, Objetivo, Avaliação e Plano). Prontuários concluídos são bloqueados contra exclusão e exigem retificação versionada (v1, v2).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsModalOpen(false)}
            className="p-1 text-[#6E6E73] hover:text-[#1C1C1E]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Pills Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Client Filter Pill */}
        <div className="relative inline-flex items-center">
          <select
            value={filterClientId}
            onChange={(e) => setFilterClientId(e.target.value)}
            className="appearance-none rounded-full border border-[#D1D1D6] bg-white hover:bg-[#F5F5F7] pl-3.5 pr-8 py-1.5 text-[12.5px] font-medium text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] cursor-pointer"
          >
            <option value="all">Cliente</option>
            {state.clients.map((cli) => (
              <option key={cli.id} value={cli.id}>
                {cli.fullName}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#1C1C1E] pointer-events-none absolute right-3" />
        </div>

        {/* Provider Filter Pill */}
        <div className="relative inline-flex items-center">
          <select
            value={filterProviderId}
            onChange={(e) => setFilterProviderId(e.target.value)}
            className="appearance-none rounded-full border border-[#D1D1D6] bg-white hover:bg-[#F5F5F7] pl-3.5 pr-8 py-1.5 text-[12.5px] font-medium text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] cursor-pointer"
          >
            <option value="all">Profissional</option>
            {state.staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#1C1C1E] pointer-events-none absolute right-3" />
        </div>

        {/* Status Filter Pill */}
        <div className="relative inline-flex items-center">
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value as "all" | "created" | "completed"
              )
            }
            className="appearance-none rounded-full border border-[#D1D1D6] bg-white hover:bg-[#F5F5F7] pl-3.5 pr-8 py-1.5 text-[12.5px] font-medium text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] cursor-pointer"
          >
            <option value="all">Todos os status</option>
            <option value="completed">Concluído</option>
            <option value="created">Criado</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#1C1C1E] pointer-events-none absolute right-3" />
        </div>
      </div>

      {/* Charts Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E5E5EA] text-[12px] font-medium text-[#6E6E73]">
              <th className="py-3 px-3 font-medium">Cliente</th>
              <th className="py-3 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  Nome do prontuário
                  <ChevronsUpDown className="w-3 h-3 text-[#8E8E93]" />
                </span>
              </th>
              <th className="py-3 px-3 font-medium">Serviços</th>
              <th className="py-3 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  Status
                  <ChevronsUpDown className="w-3 h-3 text-[#8E8E93]" />
                </span>
              </th>
              <th className="py-3 px-3 font-medium">Enviado por</th>
              <th className="py-3 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  Versão
                  <ChevronsUpDown className="w-3 h-3 text-[#8E8E93]" />
                </span>
              </th>
              <th className="py-3 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  Última modificação
                  <ChevronsUpDown className="w-3 h-3 text-[#8E8E93]" />
                </span>
              </th>
              <th className="py-3 px-3 font-medium text-right">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#EFEFF4] text-[13px] text-[#1C1C1E]">
            {filteredCharts.map((chart) => {
              const menuOpen = openRowMenuId === chart.id;
              return (
                <tr
                  key={chart.id}
                  onClick={() => {
                    setActiveChartId(chart.id);
                    setActiveAnchor("chart_details");
                  }}
                  className="hover:bg-[#F5F6F7] transition-colors cursor-pointer"
                >
                  {/* Client */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#ECEEF0] text-[#1C1C1E] text-[10.5px] font-bold flex items-center justify-center shrink-0">
                        {getInitials(chart.clientName)}
                      </span>
                      <span className="font-medium text-[#1C1C1E]">
                        {chart.clientName}
                      </span>
                    </div>
                  </td>

                  {/* Chart Name */}
                  <td className="py-3.5 px-3 text-[#1C1C1E]">
                    {chart.chartName}
                  </td>

                  {/* Services */}
                  <td className="py-3.5 px-3 text-[#6E6E73]">
                    {chart.serviceNames.length > 0
                      ? chart.serviceNames.join(", ")
                      : ""}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    {chart.status === "completed" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#9EE37D] text-[#1C1C1E]">
                        Concluído
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#E5E5EA] text-[#1C1C1E]">
                        Criado
                      </span>
                    )}
                  </td>

                  {/* Submitted by */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#ECEEF0] text-[#1C1C1E] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {getInitials(chart.providerName)}
                      </span>
                      <span className="text-[#1C1C1E] leading-snug max-w-[180px]">
                        {chart.providerName}
                      </span>
                    </div>
                  </td>

                  {/* Version */}
                  <td className="py-3.5 px-3 text-[#1C1C1E]">
                    v{chart.version}
                  </td>

                  {/* Last modified */}
                  <td className="py-3.5 px-3 text-[#1C1C1E]">
                    {chart.lastModifiedLabel}
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3.5 px-3 text-right relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenRowMenuId(menuOpen ? null : chart.id)
                      }
                      aria-label="Ações do prontuário"
                      className={`w-8 h-8 rounded-full inline-flex items-center justify-center transition-colors ${
                        menuOpen
                          ? "border border-[#1C1C1E] bg-white"
                          : "border border-transparent hover:border-[#D1D1D6] hover:bg-white"
                      }`}
                    >
                      <MoreVertical className="w-4 h-4 text-[#1C1C1E]" />
                    </button>

                    {menuOpen && (
                      <div className="absolute right-3 mt-1.5 w-36 rounded-[12px] border border-[#E5E5EA] bg-white shadow-lg py-1.5 text-left z-30">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveChartId(chart.id);
                            setActiveAnchor("chart_details");
                            setOpenRowMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-[13px] text-[#1C1C1E] hover:bg-[#F5F5F7] block"
                        >
                          Visualizar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAmendChart(chart.id)}
                          className="w-full px-4 py-2 text-[13px] text-[#1C1C1E] hover:bg-[#F5F5F7] block"
                        >
                          Retificar
                        </button>
                        <button
                          type="button"
                          disabled={chart.status === "completed"}
                          onClick={() => handleDeleteChart(chart)}
                          className={`w-full px-4 py-2 text-[13px] block ${
                            chart.status === "completed"
                              ? "text-[#C7C7CC] cursor-not-allowed"
                              : "text-[#B91C1C] hover:bg-[#F5F5F7]"
                          }`}
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
      <ClinicalChartsSection state={state} onUpdateState={onUpdateState} />
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
          Compartilhe seu link exclusivo da LUVEA com colegas de estética, salão e bem-estar.
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
