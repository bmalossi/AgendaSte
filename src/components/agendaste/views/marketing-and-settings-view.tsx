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
  Search,
  Minus,
  Upload,
  ChevronRight,
} from "lucide-react";
import {
  StudioState,
  MarketingCampaignItem,
  ClinicalChartEntry,
  ClinicalChartPhotoItem,
  ClinicalChartProductUsage,
  ClinicalChartMarkupPin,
  InventoryProductItem,
  InventoryIntendedUse,
  formatBRL,
  formatBRLCurrencyString,
  parseCurrencyToCents,
  generateMarketingDraftAI,
  sendMarketingCampaign,
  updateStudioSettings,
  filterClientsByRetention,
  resolveProductIntendedUse,
  saveInventoryProduct,
  deleteInventoryProduct,
  adjustInventoryStock,
  importStarterInventoryProducts,
} from "@/lib/agendaste-store";
import { WhatsAppConfigCard } from "@/components/agendaste/whatsapp-config-card";
import { DropdownSelect } from "@/components/ui/dropdown-select";

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
          <h2 className="font-display text-[28px] sm:text-[36px] lg:text-[42px] leading-[1.12] sm:leading-[1.06] text-[#1C1C1E]">
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
          <div className="bg-white rounded-[26px] max-w-[1040px] w-full max-h-[90dvh] overflow-y-auto lg:overflow-hidden border border-[#E5E5EA] shadow-gg-modal grid grid-cols-1 lg:grid-cols-12">
            {/* Left Builder Pane */}
            <div className="lg:col-span-7 p-5 sm:p-6 lg:p-8 lg:overflow-y-auto space-y-5 border-b lg:border-b-0 lg:border-r border-[#EFEFF4]">
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-[20px] sm:text-[22px] font-bold text-[#1C1C1E]">
                    Nova campanha (New campaign)
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 text-[11px] font-bold">
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
                  className="w-8 h-8 rounded-full border border-[#E5E5EA] flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4 text-[#1C1C1E]" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                    Canal de Disparo
                  </label>
                  <DropdownSelect
                    value={channel}
                    onChange={(val) => setChannel(val as "email" | "text")}
                    options={[
                      { value: "text", label: "Mensagem / WhatsApp" },
                      { value: "email", label: "E-mail Marketing" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                    Segmento de Clientes
                  </label>
                  <DropdownSelect
                    value={audienceSegment}
                    onChange={(val) =>
                      setAudienceSegment(
                        val as MarketingCampaignItem["audienceSegment"]
                      )
                    }
                    options={[
                      {
                        value: "absent_45d",
                        label: `Ausentes há 30/45+ dias (${absentClientsCount})`,
                      },
                      {
                        value: "all",
                        label: `Todos os clientes (${state.clients.length})`,
                      },
                      {
                        value: "vip",
                        label: "Clientes VIP & Assinantes",
                      },
                    ]}
                  />
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

        <DropdownSelect
          variant="pill"
          align="right"
          icon={<Calendar className="w-3.5 h-3.5 text-[#1C1C1E]" />}
          value={periodId}
          onChange={(val) => setPeriodId(val as AnalyticsPeriodId)}
          options={ANALYTICS_PERIOD_OPTIONS.map((opt) => ({
            value: opt.id,
            label: opt.label,
          }))}
        />
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
          ["SKU / Código de Barras", "Produto", "Marca", "Categoria", "Estoque Atual", "Preço de Revenda", "Seu Custo"],
          ...state.inventory
            .filter((item) => resolveProductIntendedUse(item) !== "service")
            .map((item) => [
              item.barcode || item.sku,
              item.name,
              item.brand || "-",
              item.productCategory || item.category,
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
          [
            "Código de Barras / SKU",
            "Produto",
            "Marca",
            "Uso Pretendido",
            "Categoria",
            "Quantidade em Estoque",
            "Nível de Estoque Baixo",
            "Status de Reposição",
            "Preço de Revenda",
            "Seu Custo",
          ],
          ...state.inventory.map((item) => {
            const use = resolveProductIntendedUse(item);
            const useLabel =
              use === "both"
                ? "Ambos"
                : use === "service"
                ? "Para serviços"
                : "Para revenda";
            const isLow =
              item.minStockAlert > 0 && item.stockQuantity <= item.minStockAlert;
            return [
              item.barcode || item.sku,
              item.name,
              item.brand || "-",
              useLabel,
              item.productCategory || item.category,
              String(item.stockQuantity),
              String(item.minStockAlert),
              isLow ? "Estoque baixo (Repor)" : "Normal",
              use === "service" ? "Uso interno" : formatBRL(item.priceCents),
              formatBRL(item.costCents),
            ];
          }),
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
                  if (typeof window !== "undefined" && window.innerWidth < 1024) {
                    setTimeout(() => {
                      document.getElementById("report-config-aside")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 50);
                  }
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
        <aside id="report-config-aside" className="w-full lg:w-[350px] xl:w-[380px] bg-white dark:bg-[#18181b] border-t lg:border-t-0 lg:border-l border-[#E5E5EA] dark:border-[#27272a] flex flex-col justify-between shrink-0 scroll-mt-16">
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
              <DropdownSelect
                value={selectedStaffId}
                onChange={(val) => setSelectedStaffId(val)}
                options={[
                  { value: "owner", label: `${ownerFullName} (você)` },
                  {
                    value: "all",
                    label: `Toda a equipe (${state.staff.length} profissionais)`,
                  },
                  ...state.staff.map((member) => ({
                    value: member.id,
                    label: member.fullName,
                    sublabel: member.role,
                  })),
                ]}
              />
            </div>

            {/* Dates Selector */}
            <div className="space-y-2.5">
              <label className="block text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                Datas
              </label>
              <DropdownSelect
                value={dateRangePreset}
                onChange={(val) => handleDatePresetChange(val)}
                options={[
                  { value: "month_to_date", label: "Mês até a data" },
                  { value: "last_month", label: "Mês passado" },
                  { value: "last_30_days", label: "Últimos 30 dias" },
                  { value: "this_year", label: "Este ano" },
                  { value: "custom", label: "Personalizado" },
                ]}
              />

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
        <div className="w-full border-b border-[#EFEFF4] bg-white px-4 sm:px-6 lg:px-10 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
          <button
            type="button"
            onClick={() => setActiveChartId(null)}
            className="inline-flex items-center gap-2.5 text-[#1C1C1E] hover:opacity-75 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4 text-[#1C1C1E]" />
            <span className="text-[15px] sm:text-[16px] font-semibold tracking-tight">
              Entradas de prontuário
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
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
                  <h1 className="font-serif text-[28px] sm:text-[38px] leading-none text-[#1C1C1E] tracking-tight">
                    {activeChart.clientName}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#6E6E73]">
                  <span>
                    {activeChart.createdDateLabel} | Profissional:{" "}
                    {activeChart.providerName}
                  </span>
                  {activeChart.status === "completed" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-[11.5px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                      <span>Concluído</span>
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
                <div>
                  <DropdownSelect
                    label="Cliente"
                    value={activeChart.clientId}
                    onChange={(val) => {
                      const found = state.clients.find((c) => c.id === val);
                      if (found) {
                        updateChartById(activeChart.id, (c) => ({
                          ...c,
                          clientId: found.id,
                          clientName: found.fullName,
                        }));
                      }
                    }}
                    options={state.clients.map((cli) => ({
                      value: cli.id,
                      label: cli.fullName,
                      sublabel: cli.phone || undefined,
                    }))}
                  />
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
                    <span className="absolute -right-2 sm:-right-6 top-6 z-20 px-2.5 sm:px-3 py-1 rounded-full bg-[#F2F2F7] border border-[#E5E5EA] text-[10.5px] sm:text-[11px] font-medium text-[#1C1C1E] shadow-sm whitespace-nowrap">
                      + Organizando fotos...
                    </span>
                    {/* Floating Solid Pill Bottom-Left */}
                    <span className="absolute -left-2 sm:-left-10 bottom-3 z-20 px-2.5 sm:px-3 py-1 rounded-full bg-[#F2F2F7] border border-[#E5E5EA] text-[10.5px] sm:text-[11px] font-medium text-[#1C1C1E] shadow-sm whitespace-nowrap">
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
                              className="px-3 py-1 rounded-full border border-[#D4D4D8] bg-white hover:bg-[#F5F5F7] text-[11.5px] font-medium text-[#1C1C1E] hover:text-rose-600 inline-flex items-center gap-1 transition-colors shadow-2xs"
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
                      <DropdownSelect
                        value={selectedInventoryId}
                        onChange={(val) => setSelectedInventoryId(val)}
                        options={[
                          ...state.inventory.map((inv) => ({
                            value: inv.id,
                            label: inv.name,
                            sublabel: inv.sku,
                          })),
                          {
                            value: "custom",
                            label: "Outro produto / fórmula manual",
                          },
                        ]}
                      />
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
              <div>
                <DropdownSelect
                  label="Selecionar modelo"
                  value={activeChart.templateType}
                  onChange={(val) =>
                    updateChartById(activeChart.id, (c) => ({
                      ...c,
                      templateType: val as ClinicalChartEntry["templateType"],
                    }))
                  }
                  options={[
                    { value: "soap", label: "Nota SOAP" },
                    {
                      value: "aesthetic_anamnesis",
                      label: "Anamnese Estética & Capilar",
                    },
                    {
                      value: "injectables",
                      label: "Protocolo de Injetáveis & Harmonização",
                    },
                    { value: "free_note", label: "Nota Livre de Evolução" },
                  ]}
                />
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
        <DropdownSelect
          variant="inline"
          value={filterClientId}
          onChange={(val) => setFilterClientId(val)}
          placeholder="Cliente"
          options={[
            { value: "all", label: "Cliente" },
            ...state.clients.map((cli) => ({
              value: cli.id,
              label: cli.fullName,
            })),
          ]}
        />

        {/* Provider Filter Pill */}
        <DropdownSelect
          variant="inline"
          value={filterProviderId}
          onChange={(val) => setFilterProviderId(val)}
          placeholder="Profissional"
          options={[
            { value: "all", label: "Profissional" },
            ...state.staff.map((member) => ({
              value: member.id,
              label: member.fullName,
            })),
          ]}
        />

        {/* Status Filter Pill */}
        <DropdownSelect
          variant="inline"
          value={filterStatus}
          onChange={(val) =>
            setFilterStatus(val as "all" | "created" | "completed")
          }
          placeholder="Todos os status"
          options={[
            { value: "all", label: "Todos os status" },
            { value: "completed", label: "Concluído" },
            { value: "created", label: "Criado" },
          ]}
        />
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
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                        <span>Concluído</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-medium bg-[#F5F5F7] border border-[#E5E5EA] text-[#6E6E73]">
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

// =============================================================================
// ESTOQUE (INVENTORY — ESTADO VAZIO, TABELA, FILTROS & GAVETA LATERAL PT-BR)
// =============================================================================

function formatCentsToBRLInput(cents: number): string {
  if (!cents || cents <= 0) return "";
  return formatBRLCurrencyString(String(cents / 100));
}

const INVENTORY_CATEGORY_SUGGESTIONS = [
  "Cabelo",
  "Pele & Estética",
  "Unhas",
  "Barba",
  "Maquiagem",
  "Corporal",
  "Sobrancelhas & Cílios",
  "Insumos & Descartáveis",
];

function InventorySection({
  state,
  onUpdateState,
}: {
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState<
    "all" | "retail" | "service" | "low_stock"
  >("all");
  const [forceEmptyPreview, setForceEmptyPreview] = useState(false);

  // Right-side Drawer State (null = closed, "add" = Adicionar produto, "edit" = Editar produto)
  const [drawerMode, setDrawerMode] = useState<"add" | "edit" | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form Fields
  const [intendedUse, setIntendedUse] = useState<InventoryIntendedUse>("both");
  const [brandName, setBrandName] = useState("");
  const [productName, setProductName] = useState("");
  const [yourCostInput, setYourCostInput] = useState("");
  const [retailPriceInput, setRetailPriceInput] = useState("");
  const [inventoryQuantityInput, setInventoryQuantityInput] = useState("");
  const [lowQuantityLevelInput, setLowQuantityLevelInput] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [barcode, setBarcode] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const imageFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const openAddDrawer = () => {
    setDrawerMode("add");
    setEditingProductId(null);
    setIntendedUse("both");
    setBrandName("");
    setProductName("");
    setYourCostInput("");
    setRetailPriceInput("");
    setInventoryQuantityInput("");
    setLowQuantityLevelInput("");
    setProductCategory("");
    setBarcode("");
    setSize("");
    setColor("");
    setProductDescription("");
    setImageUrl("");
    setFormError(null);
  };

  const openEditDrawer = (item: InventoryProductItem) => {
    const resolvedUse = resolveProductIntendedUse(item);
    setDrawerMode("edit");
    setEditingProductId(item.id);
    setIntendedUse(resolvedUse);
    setBrandName(item.brand || "");
    setProductName(item.name || "");
    setYourCostInput(formatCentsToBRLInput(item.costCents));
    setRetailPriceInput(
      resolvedUse === "service" ? "" : formatCentsToBRLInput(item.priceCents)
    );
    setInventoryQuantityInput(String(item.stockQuantity ?? 0));
    setLowQuantityLevelInput(String(item.minStockAlert ?? 0));
    setProductCategory(item.productCategory || "Cabelo");
    setBarcode(item.barcode || item.sku || "");
    setSize(item.size || "");
    setColor(item.color || "");
    setProductDescription(item.description || "");
    setImageUrl(item.imageUrl || "");
    setFormError(null);
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setEditingProductId(null);
    setFormError(null);
  };

  const handleImageFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "estoque");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data?.url) {
        setImageUrl(data.url);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setImageUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setFormError("Informe o nome do produto para salvar.");
      return;
    }

    const costCents = parseCurrencyToCents(yourCostInput);
    const priceCents =
      intendedUse === "service" ? 0 : parseCurrencyToCents(retailPriceInput);
    const stockQuantity = Math.max(
      0,
      parseInt(inventoryQuantityInput || "0", 10) || 0
    );
    const minStockAlert = Math.max(
      0,
      parseInt(lowQuantityLevelInput || "0", 10) || 0
    );

    onUpdateState((prev) =>
      saveInventoryProduct(prev, {
        id: drawerMode === "edit" && editingProductId ? editingProductId : undefined,
        name: productName.trim(),
        brand: brandName.trim(),
        intendedUse,
        costCents,
        priceCents,
        stockQuantity,
        minStockAlert,
        productCategory: productCategory.trim() || "Cabelo",
        barcode: barcode.trim(),
        size: size.trim(),
        color: color.trim(),
        description: productDescription.trim(),
        imageUrl,
      })
    );

    setForceEmptyPreview(false);
    closeDrawer();
  };

  const handleDeleteCurrentProduct = () => {
    if (!editingProductId) return;
    onUpdateState((prev) => deleteInventoryProduct(prev, editingProductId));
    closeDrawer();
  };

  const items = forceEmptyPreview ? [] : state.inventory;
  const isEmptyState = items.length === 0;

  const lowStockCount = items.filter(
    (item) => item.minStockAlert > 0 && item.stockQuantity <= item.minStockAlert
  ).length;

  const filteredItems = items.filter((item) => {
    const use = resolveProductIntendedUse(item);
    if (activeFilterTab === "retail" && use === "service") return false;
    if (activeFilterTab === "service" && use === "retail") return false;
    if (
      activeFilterTab === "low_stock" &&
      !(item.minStockAlert > 0 && item.stockQuantity <= item.minStockAlert)
    ) {
      return false;
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.brand || "").toLowerCase().includes(q) ||
      (item.productCategory || item.category).toLowerCase().includes(q) ||
      (item.barcode || item.sku || "").toLowerCase().includes(q)
    );
  });

  const intendedUseHelperText =
    intendedUse === "both"
      ? "Disponível para clientes no checkout e uso interno em serviços."
      : intendedUse === "retail"
      ? "Disponível para clientes no checkout."
      : "Disponível para uso interno em serviços.";

  return (
    <div className="w-full min-h-[calc(100vh-56px)] bg-white dark:bg-[#09090b] flex flex-col lg:flex-row relative">
      {/* ===================================================================== */}
      {/* COLUNA PRINCIPAL (ESQUERDA / CENTRO): ESTADO VAZIO OU TABELA DE ESTOQUE */}
      {/* ===================================================================== */}
      <div className="flex-1 min-w-0 px-6 lg:px-10 xl:px-12 py-7 flex flex-col">
        {isEmptyState ? (
          /* ================================================================= */
          /* ESTADO 1: HERO DE ESTOQUE VAZIO (media_1793215310977_87210196.png) */
          /* ================================================================= */
          <>
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-[22px] font-semibold text-[#1C1C1E] dark:text-white tracking-tight">
                Estoque
              </h1>
              {forceEmptyPreview && state.inventory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setForceEmptyPreview(false)}
                  className="px-3.5 py-1.5 rounded-full border border-[#D4D4D8] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-[12px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] transition"
                >
                  Voltar para lista ({state.inventory.length})
                </button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center py-8 lg:py-12">
              <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Card Ilustrado Lavanda à Esquerda */}
                <div className="lg:col-span-6 flex justify-center">
                  <div className="w-full max-w-[390px] aspect-square rounded-[24px] bg-gradient-to-b from-[#9E94FF] via-[#B8B0FF] to-[#E2DFFF] p-6 sm:p-9 flex items-center justify-center shadow-sm">
                    {/* Mockup Escuro "Adicionar ao carrinho" */}
                    <div className="w-full rounded-[20px] bg-[#141416] text-white p-4 sm:p-5 shadow-2xl border border-white/10 space-y-3.5">
                      <p className="text-[14px] font-semibold text-white tracking-tight">
                        Adicionar ao carrinho
                      </p>

                      {/* Mini Abas */}
                      <div className="flex items-center gap-1.5 text-[10.5px] text-white/70 overflow-hidden">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0">
                          <Calendar className="w-3 h-3 opacity-70" />
                          <span>Serviços</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#141416] font-semibold shrink-0 shadow-2xs">
                          <Package className="w-3 h-3" />
                          <span>Produtos</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0">
                          <span>Pacotes</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0">
                          <span>Assinaturas</span>
                        </span>
                      </div>

                      {/* 3 Linhas de Produtos Ilustrativos */}
                      <div className="space-y-2">
                        <div className="rounded-[12px] bg-[#242428] px-3 py-2.5 flex items-center gap-3 border border-white/5">
                          <span className="w-0.5 h-7 rounded-full bg-[#F59E0B] shrink-0" />
                          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#D97706] to-[#FBBF24] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11.5px] font-semibold text-white truncate">
                              Pacote Facial Mensal
                            </p>
                            <p className="text-[10.5px] text-white/60">
                              R$ 120,00
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[12px] bg-[#242428] px-3 py-2.5 flex items-center gap-3 border border-white/5">
                          <span className="w-0.5 h-7 rounded-full bg-[#818CF8] shrink-0" />
                          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#CBD5E1] to-[#94A3B8] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11.5px] font-semibold text-white truncate">
                              Sérum Esfoliante
                            </p>
                            <p className="text-[10.5px] text-white/60">
                              R$ 85,00
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[12px] bg-[#242428] px-3 py-2.5 flex items-center gap-3 border border-white/5">
                          <span className="w-0.5 h-7 rounded-full bg-[#FBBF24] shrink-0" />
                          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#FDE68A] to-[#D97706] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11.5px] font-semibold text-white truncate">
                              Sérum Refinador Glass Skin
                            </p>
                            <p className="text-[10.5px] text-white/60">
                              R$ 49,00
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Copy Editorial & CTA à Direita */}
                <div className="lg:col-span-6 space-y-5">
                  <h2 className="font-serif text-[32px] sm:text-[40px] leading-[1.08] text-[#1C1C1E] dark:text-white tracking-tight">
                    Controle e gerencie seu estoque
                  </h2>

                  <div className="space-y-3 text-[14.5px] text-[#3A3A3C] dark:text-[#d4d4d8]">
                    <p>
                      Quantidades atualizadas automaticamente a cada venda
                    </p>
                    <p>
                      Nunca fique sem produtos com alertas de estoque baixo
                    </p>
                    <p>
                      Controle produtos de revenda no checkout e uso interno nos serviços
                    </p>
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={openAddDrawer}
                      className="px-7 py-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#f4f4f5] text-white dark:text-[#09090b] text-[14px] font-semibold transition"
                    >
                      Adicionar produtos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ================================================================= */
          /* ESTADO 2: LISTA DE ESTOQUE POPULADA (media_1793215622438_13d49ad3) */
          /* ================================================================= */
          <div className="space-y-5">
            {/* Top Bar: Título + Busca + Botão Adicionar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <h1 className="text-[22px] font-semibold text-[#1C1C1E] dark:text-white tracking-tight">
                Estoque
              </h1>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-[290px] md:w-[320px]">
                  <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nome do produto ou marca"
                    className="w-full pl-9 pr-4 py-2 rounded-full border border-[#D1D1D6] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition-colors"
                  />
                </div>

                <button
                  type="button"
                  onClick={openAddDrawer}
                  className="px-5 py-2 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#f4f4f5] text-white dark:text-[#09090b] text-[13px] font-semibold transition shrink-0"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Faixa Superior de 4 Cartões de Recursos (Idêntico ao print) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
              {/* Card 1: Sem controle manual */}
              <button
                type="button"
                onClick={openAddDrawer}
                className="text-left rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-[#F5F5F7] dark:bg-[#18181b] hover:border-[#C7C7CC] dark:hover:border-[#3f3f46] overflow-hidden flex items-stretch transition group"
              >
                <div className="w-16 sm:w-[70px] bg-gradient-to-b from-[#9E94FF] to-[#D6D1FF] flex items-center justify-center shrink-0">
                  <svg
                    className="w-7 h-7 text-white/90"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M8 3h8l-1 13a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2L8 3Z" />
                    <path d="M10 18v3h4v-3" />
                  </svg>
                </div>
                <div className="p-3 flex-1 flex items-center justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-[#1C1C1E] dark:text-white leading-snug">
                      Sem controle manual
                    </p>
                    <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa] leading-snug mt-0.5 line-clamp-2">
                      Venda e seu estoque atualiza automaticamente a cada pedido.
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#1C1C1E] dark:text-white shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Card 2: Adição em massa de produtos */}
              <button
                type="button"
                onClick={() =>
                  onUpdateState((prev) => importStarterInventoryProducts(prev))
                }
                className="text-left rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-[#F5F5F7] dark:bg-[#18181b] hover:border-[#C7C7CC] dark:hover:border-[#3f3f46] overflow-hidden flex items-stretch transition"
              >
                <div className="w-16 sm:w-[70px] bg-gradient-to-b from-[#D8B4E2] to-[#F3E8FF] flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 text-[#581C87]/80" />
                </div>
                <div className="p-3 flex-1 flex flex-col justify-center items-start gap-1.5 min-w-0">
                  <p className="text-[12.5px] font-semibold text-[#1C1C1E] dark:text-white leading-snug">
                    Adição em massa de produtos
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E5C158]/40 dark:bg-[#E5C158]/20 text-[#5C4408] dark:text-[#FDE68A] text-[10.5px] font-semibold">
                    Importar catálogo base
                  </span>
                </div>
              </button>

              {/* Card 3: Leitura de código de barras */}
              <button
                type="button"
                onClick={() => {
                  searchInputRef.current?.focus();
                }}
                className="text-left rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-[#F5F5F7] dark:bg-[#18181b] hover:border-[#C7C7CC] dark:hover:border-[#3f3f46] overflow-hidden flex items-stretch transition"
              >
                <div className="w-16 sm:w-[70px] bg-gradient-to-b from-[#F9A8D4] to-[#FCE7F3] flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6 text-[#831843]/80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14M21 5v14" />
                  </svg>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-center items-start gap-1.5 min-w-0">
                  <p className="text-[12.5px] font-semibold text-[#1C1C1E] dark:text-white leading-snug">
                    Leitura de código de barras
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E5C158]/40 dark:bg-[#E5C158]/20 text-[#5C4408] dark:text-[#FDE68A] text-[10.5px] font-semibold">
                    Disponível no celular
                  </span>
                </div>
              </button>

              {/* Card 4: Compare preços e economize / Alerta de estoque baixo */}
              <button
                type="button"
                onClick={() =>
                  setActiveFilterTab((prev) =>
                    prev === "low_stock" ? "all" : "low_stock"
                  )
                }
                className="text-left rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-[#F5F5F7] dark:bg-[#18181b] hover:border-[#C7C7CC] dark:hover:border-[#3f3f46] overflow-hidden flex items-stretch transition"
              >
                <div className="w-16 sm:w-[70px] bg-gradient-to-b from-[#EDE9FE] to-[#DDD6FE] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-[#4C1D95]/80" />
                </div>
                <div className="p-3 flex-1 flex flex-col justify-center items-start gap-1.5 min-w-0">
                  <p className="text-[12.5px] font-semibold text-[#1C1C1E] dark:text-white leading-snug truncate w-full">
                    Compare preços e economize
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E5C158]/40 dark:bg-[#E5C158]/20 text-[#5C4408] dark:text-[#FDE68A] text-[10.5px] font-semibold">
                    {lowStockCount > 0
                      ? `${lowStockCount} com estoque baixo`
                      : "Disponível no celular"}
                  </span>
                </div>
              </button>
            </div>

            {/* Abas de Filtro em Pílulas: Todos (N), Para revenda, Para serviços */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFilterTab("all")}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition ${
                    activeFilterTab === "all"
                      ? "bg-[#1C1C1E] text-white dark:bg-white dark:text-[#09090b] font-semibold"
                      : "bg-white dark:bg-[#18181b] border border-[#D1D1D6] dark:border-[#27272a] text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
                  }`}
                >
                  Todos ({items.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilterTab("retail")}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition ${
                    activeFilterTab === "retail"
                      ? "bg-[#1C1C1E] text-white dark:bg-white dark:text-[#09090b] font-semibold"
                      : "bg-white dark:bg-[#18181b] border border-[#D1D1D6] dark:border-[#27272a] text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
                  }`}
                >
                  Para revenda
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilterTab("service")}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition ${
                    activeFilterTab === "service"
                      ? "bg-[#1C1C1E] text-white dark:bg-white dark:text-[#09090b] font-semibold"
                      : "bg-white dark:bg-[#18181b] border border-[#D1D1D6] dark:border-[#27272a] text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
                  }`}
                >
                  Para serviços
                </button>

                {lowStockCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveFilterTab((prev) =>
                        prev === "low_stock" ? "all" : "low_stock"
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition ${
                      activeFilterTab === "low_stock"
                        ? "bg-[#1C1C1E] text-white dark:bg-white dark:text-[#09090b] font-semibold"
                        : "bg-[#F5F5F7] dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] text-[#1C1C1E] dark:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                    <span>Estoque baixo ({lowStockCount})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tabela de Produtos (Product, Brand, Category, Retail Price, Quantity) */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#E5E5EA] dark:border-[#27272a] text-[12px] font-medium text-[#6E6E73] dark:text-[#a1a1aa]">
                    <th className="py-3 px-3 font-medium w-[36%]">Produto</th>
                    <th className="py-3 px-3 font-medium">Marca</th>
                    <th className="py-3 px-3 font-medium">Categoria</th>
                    <th className="py-3 px-3 font-medium">Preço de revenda</th>
                    <th className="py-3 px-3 font-medium">Quantidade</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EFEFF4] dark:divide-[#27272a] text-[13.5px] text-[#1C1C1E] dark:text-white">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-10 text-center text-[13.5px] text-[#6E6E73] dark:text-[#a1a1aa]"
                      >
                        Nenhum produto encontrado para este filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isSelected =
                        drawerMode === "edit" && editingProductId === item.id;
                      const use = resolveProductIntendedUse(item);
                      const isLowStock =
                        item.minStockAlert > 0 &&
                        item.stockQuantity <= item.minStockAlert;

                      return (
                        <tr
                          key={item.id}
                          onClick={() => openEditDrawer(item)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#EFF3F0] dark:bg-[#27272a]/80"
                              : "hover:bg-[#F5F6F7] dark:hover:bg-[#18181b]"
                          }`}
                        >
                          {/* Coluna 1: Produto (Foto + Nome) */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-4 min-w-0">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-11 h-11 rounded-[10px] object-cover border border-[#E5E5EA] dark:border-[#3f3f46] shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-[10px] bg-gradient-to-br from-[#6D48C5] via-[#9B6EF3] to-[#C8A8F8] flex items-center justify-center shrink-0 shadow-2xs">
                                  <svg
                                    className="w-5 h-5 text-white"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                  >
                                    <rect
                                      x="9"
                                      y="2"
                                      width="6"
                                      height="3"
                                      rx="1"
                                    />
                                    <path d="M10 5v2h4V5" />
                                    <rect
                                      x="7"
                                      y="7"
                                      width="10"
                                      height="15"
                                      rx="2.5"
                                    />
                                  </svg>
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="font-semibold text-[#1C1C1E] dark:text-white truncate">
                                  {item.name}
                                </p>
                                {isLowStock && (
                                  <span className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] text-[11px] font-medium text-[#1C1C1E] dark:text-white">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                                    <span>Estoque baixo</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Coluna 2: Marca */}
                          <td className="py-3.5 px-3 text-[#1C1C1E] dark:text-[#d4d4d8]">
                            {item.brand || "—"}
                          </td>

                          {/* Coluna 3: Categoria */}
                          <td className="py-3.5 px-3 text-[#1C1C1E] dark:text-[#d4d4d8]">
                            {item.productCategory ||
                              (use === "service" ? "Uso interno" : "Cabelo")}
                          </td>

                          {/* Coluna 4: Preço de revenda */}
                          <td className="py-3.5 px-3 text-[#1C1C1E] dark:text-white tabular-nums">
                            {use === "service" ? (
                              <span className="text-[#6E6E73] dark:text-[#a1a1aa] text-[12.5px]">
                                Uso em serviços
                              </span>
                            ) : (
                              formatBRL(item.priceCents)
                            )}
                          </td>

                          {/* Coluna 5: Quantidade Stepper [-] [ N ] [+] */}
                          <td
                            className="py-3.5 px-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                aria-label={`Diminuir quantidade de ${item.name}`}
                                onClick={() => {
                                  onUpdateState((prev) =>
                                    adjustInventoryStock(prev, item.id, -1, "delta")
                                  );
                                  if (
                                    drawerMode === "edit" &&
                                    editingProductId === item.id
                                  ) {
                                    setInventoryQuantityInput(
                                      String(Math.max(0, item.stockQuantity - 1))
                                    );
                                  }
                                }}
                                className="w-6 h-6 rounded-full border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white transition"
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              <input
                                type="number"
                                min={0}
                                aria-label={`Quantidade em estoque de ${item.name}`}
                                value={item.stockQuantity}
                                onChange={(e) => {
                                  const nextVal = Math.max(
                                    0,
                                    parseInt(e.target.value || "0", 10) || 0
                                  );
                                  onUpdateState((prev) =>
                                    adjustInventoryStock(
                                      prev,
                                      item.id,
                                      nextVal,
                                      "exact"
                                    )
                                  );
                                  if (
                                    drawerMode === "edit" &&
                                    editingProductId === item.id
                                  ) {
                                    setInventoryQuantityInput(String(nextVal));
                                  }
                                }}
                                className="w-12 h-9 rounded-[8px] border border-[#E5E5EA] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-center text-[13px] font-medium text-[#1C1C1E] dark:text-white tabular-nums focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />

                              <button
                                type="button"
                                aria-label={`Aumentar quantidade de ${item.name}`}
                                onClick={() => {
                                  onUpdateState((prev) =>
                                    adjustInventoryStock(prev, item.id, 1, "delta")
                                  );
                                  if (
                                    drawerMode === "edit" &&
                                    editingProductId === item.id
                                  ) {
                                    setInventoryQuantityInput(
                                      String(item.stockQuantity + 1)
                                    );
                                  }
                                }}
                                className="w-6 h-6 rounded-full border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white transition"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* GAVETA LATERAL DIREITA: ADICIONAR PRODUTO / EDITAR PRODUTO            */}
      {/* ===================================================================== */}
      {drawerMode !== null && (
        <>
          {/* Backdrop apenas no mobile (< lg) */}
          <div
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[1px] lg:hidden"
            onClick={closeDrawer}
          />

          <aside className="fixed inset-y-0 right-0 z-[90] w-full max-w-[400px] lg:static lg:z-auto lg:w-[360px] xl:w-[390px] bg-white dark:bg-[#18181b] border-l border-[#E5E5EA] dark:border-[#27272a] flex flex-col justify-between shrink-0 lg:min-h-[calc(100vh-56px)] shadow-2xl lg:shadow-none">
            <form
              onSubmit={handleSaveProduct}
              className="flex flex-col h-full max-h-screen lg:max-h-[calc(100vh-56px)] justify-between"
            >
              {/* Cabeçalho Fixo da Gaveta */}
              <div className="px-6 pt-5 pb-4 flex items-center justify-between gap-3 border-b border-[#EFEFF4] dark:border-[#27272a] shrink-0">
                <h2 className="text-[17px] font-semibold text-[#1C1C1E] dark:text-white tracking-tight">
                  {drawerMode === "edit"
                    ? "Editar produto"
                    : "Adicionar produto"}
                </h2>

                <div className="flex items-center gap-2">
                  {drawerMode === "edit" && editingProductId && (
                    <button
                      type="button"
                      onClick={handleDeleteCurrentProduct}
                      aria-label="Excluir produto"
                      title="Excluir produto"
                      className="p-1.5 rounded-full text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={closeDrawer}
                    aria-label="Fechar painel de produto"
                    className="p-1.5 rounded-full text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Corpo Rolável do Formulário */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* 1. Upload de Imagem do Produto */}
                <div className="rounded-[14px] border border-dashed border-[#D1D1D6] dark:border-[#3f3f46] p-5 flex flex-col items-center justify-center gap-3.5 bg-[#FAFAFC]/60 dark:bg-[#121214]">
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileSelect}
                    className="hidden"
                  />

                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={productName || "Imagem do produto"}
                      className="w-[116px] h-[116px] rounded-[16px] object-cover shadow-xs border border-[#E5E5EA] dark:border-[#27272a]"
                    />
                  ) : (
                    /* Ilustração do Frasco Cosmético (idêntica ao print Add product) */
                    <div className="w-[116px] h-[116px] rounded-[16px] bg-gradient-to-br from-[#5B3E96] via-[#8B63DA] to-[#C8A8F8] flex items-center justify-center shadow-xs relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.28),transparent_55%)]" />
                      <svg
                        className="w-16 h-16 text-white/95 relative z-10"
                        viewBox="0 0 64 64"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="27" y="8" width="10" height="5" rx="1.5" />
                        <rect x="28.5" y="13" width="7" height="4" />
                        <path d="M23 21c0-2.2 1.8-4 4-4h10c2.2 0 4 1.8 4 4v31c0 2.2-1.8 4-4 4H27c-2.2 0-4-1.8-4-4V21Z" />
                        <path d="M23 24h18" />
                      </svg>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => imageFileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#f4f4f5] text-white dark:text-[#09090b] text-[12px] font-semibold inline-flex items-center gap-1.5 transition disabled:opacity-60"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isUploadingImage ? "Enviando..." : "Substituir imagem"}
                    </span>
                  </button>
                </div>

                {/* 2. Uso pretendido deste produto (3 Abas: Ambos, Para revenda, Para serviços) */}
                <div className="space-y-2.5">
                  <label className="block text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                    Uso pretendido deste produto
                  </label>

                  <div className="rounded-full bg-[#EFEFF4] dark:bg-[#27272a] p-1 grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setIntendedUse("both")}
                      className={`py-1.5 px-2 rounded-full text-[12px] transition ${
                        intendedUse === "both"
                          ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white font-semibold shadow-2xs"
                          : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white font-medium"
                      }`}
                    >
                      Ambos
                    </button>

                    <button
                      type="button"
                      onClick={() => setIntendedUse("retail")}
                      className={`py-1.5 px-2 rounded-full text-[12px] transition ${
                        intendedUse === "retail"
                          ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white font-semibold shadow-2xs"
                          : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white font-medium"
                      }`}
                    >
                      Para revenda
                    </button>

                    <button
                      type="button"
                      onClick={() => setIntendedUse("service")}
                      className={`py-1.5 px-2 rounded-full text-[12px] transition ${
                        intendedUse === "service"
                          ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white font-semibold shadow-2xs"
                          : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white font-medium"
                      }`}
                    >
                      Para serviços
                    </button>
                  </div>

                  <div className="flex items-start gap-1.5 text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa] pt-0.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#6E6E73] dark:text-[#a1a1aa]" />
                    <span>{intendedUseHelperText}</span>
                  </div>
                </div>

                {/* 3. Detalhes do produto (Product details) */}
                <div className="space-y-3">
                  <h3 className="text-[13.5px] font-semibold text-[#1C1C1E] dark:text-white">
                    Detalhes do produto
                  </h3>

                  {/* Nome da marca (Brand name) */}
                  <div className="rounded-[12px] border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] px-3.5 py-2 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition-colors">
                    <label className="block text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      Nome da marca
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Nome da marca"
                      className="w-full bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none mt-0.5"
                    />
                  </div>

                  {/* Nome do produto (Product name) */}
                  <div className="rounded-[12px] border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] px-3.5 py-2 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition-colors">
                    <label className="block text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      Nome do produto
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => {
                        setProductName(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="Nome do produto"
                      className="w-full bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none mt-0.5"
                    />
                  </div>

                  {/* Seu custo (Your cost) */}
                  <div className="rounded-[12px] border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] px-3.5 py-2 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition-colors">
                    <label className="block text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      Seu custo
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={yourCostInput}
                      onChange={(e) => setYourCostInput(e.target.value)}
                      onBlur={() => {
                        if (yourCostInput.trim()) {
                          setYourCostInput(formatBRLCurrencyString(yourCostInput));
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="R$ 0,00"
                      className="w-full bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none mt-0.5 tabular-nums"
                    />
                  </div>

                  {/* Preço de revenda (Retail price — oculto em "Para serviços") */}
                  {(intendedUse === "both" || intendedUse === "retail") && (
                    <div className="rounded-[12px] border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] px-3.5 py-2 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition-colors">
                      <label className="block text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                        Preço de revenda
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={retailPriceInput}
                        onChange={(e) => setRetailPriceInput(e.target.value)}
                        onBlur={() => {
                          if (retailPriceInput.trim()) {
                            setRetailPriceInput(formatBRLCurrencyString(retailPriceInput));
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                        placeholder="R$ 0,00"
                        className="w-full bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none mt-0.5 tabular-nums"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Quantidade (Quantity) */}
                <div className="space-y-3">
                  <h3 className="text-[13.5px] font-semibold text-[#1C1C1E] dark:text-white">
                    Quantidade
                  </h3>

                  {/* Quantidade em estoque (Inventory quantity) */}
                  <div className="rounded-[12px] border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] px-3.5 py-2 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition-colors">
                    <label className="block text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      Quantidade em estoque
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={inventoryQuantityInput}
                      onChange={(e) =>
                        setInventoryQuantityInput(e.target.value)
                      }
                      placeholder="0"
                      className="w-full bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none mt-0.5 tabular-nums"
                    />
                  </div>

                  {/* Nível de estoque baixo (Low quantity level) */}
                  <div className="rounded-[12px] border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] px-3.5 py-2 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition-colors">
                    <label className="block text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      Nível de estoque baixo
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={lowQuantityLevelInput}
                      onChange={(e) => setLowQuantityLevelInput(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none mt-0.5 tabular-nums"
                    />
                  </div>

                  <div className="space-y-2 text-[11.5px] leading-relaxed text-[#6E6E73] dark:text-[#a1a1aa] pt-0.5">
                    <p>
                      Rastrearemos automaticamente as alterações de quantidade
                      quando você vender produtos no checkout. Atualize este
                      campo ao receber novo estoque.
                    </p>
                    <p>
                      O nível de estoque baixo é a quantidade que você deseja
                      manter no seu estoque antes de fazer um novo pedido.
                      Adicionaremos isso aos seus relatórios.
                    </p>
                  </div>
                </div>

                {/* 5. Detalhes avançados (Advanced details) */}
                <div className="space-y-3">
                  <h3 className="text-[13.5px] font-semibold text-[#1C1C1E] dark:text-white">
                    Detalhes avançados
                  </h3>

                  {/* Categoria do produto (Product category) */}
                  <div className="rounded-[12px] border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] px-3.5 py-2 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition-colors">
                    <label className="block text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      Categoria do produto
                    </label>
                    <input
                      type="text"
                      list="luvea-inventory-categories"
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      placeholder="Ex.: Cabelo, Pele & Estética, Unhas"
                      className="w-full bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none mt-0.5"
                    />
                    <datalist id="luvea-inventory-categories">
                      {INVENTORY_CATEGORY_SUGGESTIONS.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  {/* Código de barras (Barcode) */}
                  <div className="rounded-[12px] border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] px-3.5 py-2 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition-colors">
                    <label className="block text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      Código de barras
                    </label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Código de barras (EAN / SKU)"
                      className="w-full bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none mt-0.5"
                    />
                  </div>

                  {/* Tamanho (Size) */}
                  <div className="rounded-[12px] border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] px-3.5 py-2 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition-colors">
                    <label className="block text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      Tamanho
                    </label>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="Ex.: 250ml, 50g, 1kg"
                      className="w-full bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none mt-0.5"
                    />
                  </div>

                  {/* Cor (Color) */}
                  <div className="rounded-[12px] border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] px-3.5 py-2 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition-colors">
                    <label className="block text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      Cor
                    </label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="Cor"
                      className="w-full bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none mt-0.5"
                    />
                  </div>

                  {/* Descrição do produto (Product description) */}
                  <div className="rounded-[12px] border border-[#D1D1D6] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] px-3.5 py-2 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition-colors">
                    <label className="block text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      Descrição do produto
                    </label>
                    <textarea
                      rows={3}
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder="Descrição do produto"
                      className="w-full bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none mt-0.5 resize-none"
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-[12px] font-medium text-rose-600 dark:text-rose-400">
                    {formError}
                  </p>
                )}
              </div>

              {/* Rodapé Fixo com Botão Salvar */}
              <div className="p-4 border-t border-[#EFEFF4] dark:border-[#27272a] bg-white dark:bg-[#18181b] shrink-0">
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#f4f4f5] text-white dark:text-[#09090b] text-[13.5px] font-semibold transition"
                >
                  Salvar
                </button>
              </div>
            </form>
          </aside>
        </>
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
      <InventorySection state={state} onUpdateState={onUpdateState} />
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
        <h1 className="font-display text-[28px] sm:text-[36px] lg:text-[42px] leading-[1.12] sm:leading-[1.06] text-[#1C1C1E]">
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
