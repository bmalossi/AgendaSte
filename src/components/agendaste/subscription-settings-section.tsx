"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  CreditCard,
  Check,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Copy,
  QrCode,
  FileText,
  X,
  RefreshCw,
} from "lucide-react";
import { PLANS_CATALOG } from "@/lib/marketing-content";
import { QRCodeSVG } from "qrcode.react";
import {
  PlanTier,
  BillingCycle,
  isPlanUpgrade,
  calculateProrationDifference,
  validateDowngradeStaffLimit,
  resolvePlanPriceCents,
} from "@/lib/billing/pricing";
import type { StudioState } from "@/lib/agendaste-store";

interface SubscriptionInvoiceItem {
  id: string;
  gateway: string;
  plan_tier: string;
  billing_cycle: string;
  amount_cents: number;
  status: string;
  pix_qr_code?: string;
  pix_qr_code_base64?: string;
  pix_ticket_url?: string;
  hosted_invoice_url?: string;
  period_start?: string;
  period_end?: string;
  paid_at?: string;
  refunded_at?: string;
  created_at: string;
}

interface SubscriptionData {
  organizationId?: string;
  name?: string;
  slug?: string;
  status: string;
  planTier: string;
  billingCycle: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  scheduledPlanTier: string | null;
  scheduledBillingCycle: string | null;
  gracePeriodEndsAt: string | null;
  paymentGateway: string;
  firstPaidAt: string | null;
  canRefundCdc: boolean;
  activeStaffCount: number;
  invoices: SubscriptionInvoiceItem[];
}

interface SubscriptionSettingsSectionProps {
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
  selectedCycle: "monthly" | "yearly";
  onSelectCycle: (cycle: "monthly" | "yearly") => void;
}

export function SubscriptionSettingsSection({
  state,
  onUpdateState,
  selectedCycle,
  onSelectCycle,
}: SubscriptionSettingsSectionProps) {
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modais de ação
  const [upgradeTarget, setUpgradeTarget] = useState<PlanTier | null>(null);
  const [downgradeTarget, setDowngradeTarget] = useState<PlanTier | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelChoice, setCancelChoice] = useState<"at_period_end" | "immediate_refund_cdc">("at_period_end");
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Carrega status da assinatura da API
  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing/subscription");
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.subscription) {
          setSubData(json.subscription);
          if (json.subscription.billingCycle) {
            onSelectCycle(json.subscription.billingCycle as "monthly" | "yearly");
          }
        }
      }
    } catch (err) {
      console.warn("[Subscription Section Fetch Error]:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  // Fechamento acessível de modais via tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setUpgradeTarget(null);
        setDowngradeTarget(null);
        setShowCancelModal(false);
      }
    };
    if (upgradeTarget || downgradeTarget || showCancelModal) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [upgradeTarget, downgradeTarget, showCancelModal]);

  // Foco programático no modal aberto (WCAG 2.1 - 2.4.3 Focus Order)
  useEffect(() => {
    if (upgradeTarget || downgradeTarget || showCancelModal) {
      const timer = setTimeout(() => {
        modalContainerRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [upgradeTarget, downgradeTarget, showCancelModal]);

  // Dados consolidados (API ou fallback do estado do estúdio)
  const currentTier = (subData?.planTier || state.onboarding?.planTier || "gold").toLowerCase() as PlanTier;
  const currentCycle = (subData?.billingCycle || state.onboarding?.billingCycle || selectedCycle) as BillingCycle;
  const subStatus = subData?.status || state.onboarding?.subscriptionStatus || "trialing";
  const trialDays = state.onboarding?.trialDaysLeft ?? 14;
  const isTrialActive = subStatus === "trialing" && trialDays > 0;
  const isTrialExpired = subStatus === "trialing" && trialDays <= 0;
  const isSubActive = subStatus === "active";
  const isPastDue = subStatus === "past_due";
  const cancelAtPeriodEnd = Boolean(subData?.cancelAtPeriodEnd);
  const scheduledTier = subData?.scheduledPlanTier;
  const activeStaffCount = subData?.activeStaffCount ?? (state.staff?.length || 1);

  // Verifica se faltam 5 dias ou menos para o vencimento do Pix
  const periodEndDate = subData?.currentPeriodEnd ? new Date(subData.currentPeriodEnd) : null;
  const daysUntilRenewal = periodEndDate
    ? Math.ceil((periodEndDate.getTime() - Date.now()) / 86400000)
    : null;
  const showPixRenewal =
    subData?.paymentGateway === "mercadopago" &&
    periodEndDate &&
    (daysUntilRenewal === null || daysUntilRenewal <= 5);

  const latestPixInvoice = subData?.invoices?.find(
    (inv) => inv.gateway === "mercadopago" && inv.pix_qr_code
  );

  // Executa Upgrade Imediato
  const handleConfirmUpgrade = async () => {
    if (!upgradeTarget) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPlanTier: upgradeTarget,
          targetBillingCycle: selectedCycle,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedbackMessage({ type: "success", text: data.message });
        setUpgradeTarget(null);
        await fetchSubscription();
        onUpdateState((prev) => ({
          ...prev,
          onboarding: {
            ...prev.onboarding,
            planTier:
              upgradeTarget === "essencial"
                ? "Essencial"
                : upgradeTarget === "gold"
                ? "Gold"
                : "Platinum",
            subscriptionStatus: "active",
          },
        }));
      } else {
        setFeedbackMessage({ type: "error", text: data.error || "Erro ao processar upgrade." });
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Erro de comunicação ao realizar upgrade." });
    } finally {
      setActionLoading(false);
    }
  };

  // Executa Agendamento de Downgrade
  const handleConfirmDowngrade = async () => {
    if (!downgradeTarget) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPlanTier: downgradeTarget,
          targetBillingCycle: selectedCycle,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedbackMessage({ type: "success", text: data.message });
        setDowngradeTarget(null);
        await fetchSubscription();
      } else {
        setFeedbackMessage({ type: "error", text: data.error || "Erro ao agendar downgrade." });
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Erro de comunicação ao agendar downgrade." });
    } finally {
      setActionLoading(false);
    }
  };

  // Cancela agendamento de downgrade
  const handleCancelScheduledDowngrade = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlanTier: null }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedbackMessage({ type: "success", text: data.message });
        await fetchSubscription();
      } else {
        setFeedbackMessage({ type: "error", text: data.error || "Erro ao cancelar agendamento." });
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Erro ao cancelar agendamento." });
    } finally {
      setActionLoading(false);
    }
  };

  // Reativa renovação automática
  const handleReactivateSubscription = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/billing/reactivate", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedbackMessage({ type: "success", text: data.message });
        await fetchSubscription();
      } else {
        setFeedbackMessage({ type: "error", text: data.error || "Erro ao reativar renovação." });
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Erro ao reativar renovação." });
    } finally {
      setActionLoading(false);
    }
  };

  // Executa cancelamento (CDC ou ao fim do ciclo)
  const handleConfirmCancel = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: cancelChoice }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedbackMessage({ type: "success", text: data.message });
        setShowCancelModal(false);
        await fetchSubscription();
      } else {
        setFeedbackMessage({ type: "error", text: data.error || "Erro ao cancelar assinatura." });
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Erro de rede ao cancelar assinatura." });
    } finally {
      setActionLoading(false);
    }
  };

  // Abre Stripe Customer Portal
  const handleOpenStripePortal = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setFeedbackMessage({
          type: "error",
          text: data.error || "Portal de faturamento disponível apenas para clientes com cartão Stripe.",
        });
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Erro ao abrir portal de faturamento." });
    } finally {
      setActionLoading(false);
    }
  };

  // Copia código Pix
  const handleCopyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const currentPlanFormatted =
    currentTier === "platinum" ? "Platinum" : currentTier === "essencial" ? "Essencial" : "Gold";

  return (
    <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#E5E5EA] dark:border-[#27272a] p-6 lg:p-8 space-y-8">
      {/* Header com Título e Alternador de Ciclo */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-serif font-normal text-[#1C1C1E] dark:text-white">
              Plano &amp; Assinatura LUVEA
            </h2>
            <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
              Gerencie a potência da sua recepção, limites de equipe e faturamento oficial.
            </p>
          </div>

          {/* Alternador de Ciclo Mensal / Anual */}
          <div className="inline-flex items-center p-1 bg-[#F5F5F7] dark:bg-[#27272a] rounded-full border border-[#E5E5EA] dark:border-[#27272a] shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onSelectCycle("monthly")}
              className={`min-h-[44px] px-4 py-2 rounded-full text-[12.5px] font-medium transition-all ${
                selectedCycle === "monthly"
                  ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white shadow-sm"
                  : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => onSelectCycle("yearly")}
              className={`min-h-[44px] px-4 py-2 rounded-full text-[12.5px] font-medium transition-all flex items-center gap-1.5 ${
                selectedCycle === "yearly"
                  ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white shadow-sm"
                  : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
              }`}
            >
              <span>Anual</span>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                -15%
              </span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`p-3.5 rounded-2xl text-[12.5px] flex items-center justify-between border ${
              feedbackMessage.type === "success"
                ? "bg-[#F5F5F7] border-[#E5E5EA] text-[#1C1C1E] dark:bg-[#27272a] dark:border-[#27272a] dark:text-white"
                : "bg-rose-50/50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  feedbackMessage.type === "success" ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              aria-label="Fechar mensagem"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Card de Status da Assinatura Atual (Anti-AI Slop) */}
        <div className="p-5 rounded-2xl bg-[#F5F5F7] dark:bg-[#27272a]/60 border border-[#E5E5EA] dark:border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#27272a] text-[#1C1C1E] dark:text-white shadow-xs">
              {isSubActive ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                  <span>Assinatura Ativa • Plano {currentPlanFormatted}</span>
                </>
              ) : isPastDue ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                  <span>Período de Carência • Plano {currentPlanFormatted}</span>
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
                ? `Assinatura ativa no ciclo ${currentCycle === "yearly" ? "anual" : "mensal"}${
                    periodEndDate
                      ? ` com próxima renovação em ${periodEndDate.toLocaleDateString("pt-BR")}`
                      : ""
                  }. Equipe atual: ${activeStaffCount} profissional${activeStaffCount > 1 ? "is" : ""}.`
                : isPastDue
                ? "Identificamos uma pendência na última cobrança. Seu estúdio está no período de carência de 3 dias para regularização."
                : isTrialExpired
                ? "O período de 14 dias de teste gratuito foi concluído. Selecione um plano abaixo para manter seu estúdio operando."
                : "Durante a avaliação gratuita de 14 dias, todos os recursos avançados estão disponíveis sem compromisso."}
            </p>

            {/* Aviso de Downgrade Agendado */}
            {scheduledTier && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[12px] text-[#1C1C1E] dark:text-zinc-200">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6E6E73] dark:bg-[#a1a1aa]" />
                <span>
                  Downgrade agendado para o Plano {scheduledTier.toUpperCase()} no término do ciclo atual.
                </span>
                <button
                  type="button"
                  onClick={handleCancelScheduledDowngrade}
                  disabled={actionLoading}
                  className="min-h-[44px] px-2.5 py-1 rounded-lg underline text-[#1C1C1E] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 font-medium inline-flex items-center"
                >
                  Cancelar agendamento
                </button>
              </div>
            )}

            {/* Aviso de Cancelamento ao Fim do Ciclo */}
            {cancelAtPeriodEnd && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[12px] text-[#1C1C1E] dark:text-zinc-200">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>
                  Renovação automática desativada. O acesso permanecerá liberado até{" "}
                  {periodEndDate ? periodEndDate.toLocaleDateString("pt-BR") : "o final do período"}.
                </span>
                <button
                  type="button"
                  onClick={handleReactivateSubscription}
                  disabled={actionLoading}
                  className="min-h-[44px] px-2.5 py-1 rounded-lg underline text-[#1C1C1E] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 font-medium inline-flex items-center"
                >
                  Reativar renovação
                </button>
              </div>
            )}
          </div>

          {/* Ações Primárias / Secundárias */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            {subData?.paymentGateway === "stripe" && (
              <button
                type="button"
                onClick={handleOpenStripePortal}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[12.5px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#3f3f46] transition-all"
              >
                <span>Portal Stripe</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {isSubActive && !cancelAtPeriodEnd && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[12.5px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#3f3f46] transition-all"
              >
                Cancelar renovação
              </button>
            )}

            {!isSubActive && (
              <Link
                href={`/checkout?plan=${currentTier}&cycle=${selectedCycle}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium shadow-sm hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition-all shrink-0 active:scale-[0.98]"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isTrialExpired ? "Reativar Assinatura" : "Efetivar Assinatura"}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Seção Pix: Renovação com QR Code Dinâmico (quando faltarem 5 dias ou menos) */}
      {showPixRenewal && latestPixInvoice && latestPixInvoice.pix_qr_code && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#F5F5F7] dark:bg-[#27272a]/60 border border-[#E5E5EA] dark:border-[#27272a] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#6E6E73] dark:text-[#a1a1aa]">
                <QrCode className="w-3.5 h-3.5" />
                <span>Renovação Pix Disponível</span>
              </div>
              <h3 className="text-[16px] font-medium text-[#1C1C1E] dark:text-white mt-0.5">
                Próximo ciclo do Plano {currentPlanFormatted} (R${" "}
                {(latestPixInvoice.amount_cents / 100).toFixed(2)})
              </h3>
            </div>
            {periodEndDate && (
              <span className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
                Vencimento em {periodEndDate.toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
            <div className="w-32 h-32 p-2 bg-white rounded-xl border border-[#E5E5EA] shadow-xs flex items-center justify-center shrink-0">
              {latestPixInvoice.pix_qr_code_base64 ? (
                <img
                  src={
                    latestPixInvoice.pix_qr_code_base64.startsWith("data:")
                      ? latestPixInvoice.pix_qr_code_base64
                      : `data:image/png;base64,${latestPixInvoice.pix_qr_code_base64}`
                  }
                  alt="QR Code Pix Oficial para renovação do plano"
                  className="w-28 h-28 object-contain"
                />
              ) : latestPixInvoice.pix_qr_code ? (
                <QRCodeSVG
                  value={latestPixInvoice.pix_qr_code}
                  size={112}
                  level="M"
                  className="w-28 h-28"
                  aria-label="QR Code Pix para renovação"
                />
              ) : (
                <div className="w-28 h-28 flex items-center justify-center text-[11px] text-[#6E6E73] font-mono text-center">
                  QR Code indisponível
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 w-full">
              <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                Escaneie o QR Code no app do seu banco ou use a chave Copia e Cola. O pagamento é
                identificado automaticamente em segundos e estende o término do ciclo sem perda de dias.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPix(latestPixInvoice.pix_qr_code || "")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[12px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#3f3f46] transition-all"
                >
                  {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPix ? "Código Pix Copiado" : "Copiar Código Pix"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid dos 3 Planos Canônicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {PLANS_CATALOG.map((plan) => {
          const isCurrentPlan = currentTier === plan.id;
          const price = selectedCycle === "yearly" ? plan.annualMonthlyPriceReais : plan.monthlyPriceReais;
          const isUpgrade = isPlanUpgrade(currentTier, currentCycle, plan.id as PlanTier, selectedCycle);

          return (
            <div
              key={plan.id}
              className={`relative p-6 sm:p-7 rounded-2xl flex flex-col justify-between transition-all ${
                plan.isPopular
                  ? "border-2 border-[#1C1C1E] dark:border-white bg-[#FAFAFA] dark:bg-[#27272a]/60 shadow-sm"
                  : "border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b]"
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
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] text-[#1C1C1E] dark:text-zinc-200 border border-[#E5E5EA] dark:border-[#27272a]">
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
                  <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                    {plan.maxStaffLabel} • {plan.aiReceptionLimit}
                  </p>
                </div>

                <div className="pt-3 space-y-2 border-t border-[#F2F2F7] dark:border-[#27272a]">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#6E6E73] dark:text-[#a1a1aa]">
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
                  <div className="w-full py-2.5 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] text-[#6E6E73] dark:text-[#a1a1aa] text-[12.5px] font-medium text-center border border-[#E5E5EA] dark:border-[#27272a]">
                    Plano Ativo
                  </div>
                ) : isSubActive ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (isUpgrade) {
                        setUpgradeTarget(plan.id as PlanTier);
                      } else {
                        // Verifica se equipe excede antes de abrir modal
                        const check = validateDowngradeStaffLimit({
                          activeStaffCount,
                          targetPlanTier: plan.id as PlanTier,
                        });
                        if (!check.valid) {
                          setFeedbackMessage({ type: "error", text: check.error || "Limite excedido." });
                        } else {
                          setDowngradeTarget(plan.id as PlanTier);
                        }
                      }
                    }}
                    disabled={actionLoading}
                    className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[12.5px] font-medium transition-all ${
                      isUpgrade
                        ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 shadow-sm"
                        : "border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#3f3f46]"
                    }`}
                  >
                    <span>{isUpgrade ? `Fazer Upgrade para ${plan.name}` : `Agendar Downgrade`}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Link
                    href={`/checkout?plan=${plan.id}&cycle=${selectedCycle}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium shadow-sm hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition-all"
                  >
                    <span>Assinar {plan.name}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Histórico de Faturas do Plano (Subscription Invoices) */}
      <div className="space-y-4 pt-4 border-t border-[#E5E5EA] dark:border-[#27272a]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[17px] font-medium text-[#1C1C1E] dark:text-white">
              Histórico de Faturas do Plano
            </h3>
            <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
              Registro contábil de todas as cobranças e renovações da sua assinatura SaaS.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchSubscription}
            disabled={loading}
            aria-label="Atualizar histórico de faturas"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition-colors"
            title="Atualizar faturas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {subData?.invoices && subData.invoices.length > 0 ? (
          <div className="border border-[#E5E5EA] dark:border-[#27272a] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead className="bg-[#F5F5F7] dark:bg-[#27272a]/60 border-b border-[#E5E5EA] dark:border-[#27272a] text-[#6E6E73] dark:text-[#a1a1aa]">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Data</th>
                    <th className="py-2.5 px-4 font-medium">Plano</th>
                    <th className="py-2.5 px-4 font-medium">Método</th>
                    <th className="py-2.5 px-4 font-medium">Valor</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium text-right">Comprovante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2F7] dark:divide-[#27272a] text-[#1C1C1E] dark:text-zinc-200">
                  {subData.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#27272a]/40">
                      <td className="py-3 px-4">
                        {new Date(inv.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4 font-medium capitalize">
                        {inv.plan_tier} ({inv.billing_cycle === "yearly" ? "Anual" : "Mensal"})
                      </td>
                      <td className="py-3 px-4">
                        {inv.gateway === "stripe" ? "Cartão (Stripe)" : "Pix (Mercado Pago)"}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        R$ {(inv.amount_cents / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#27272a]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              inv.status === "paid"
                                ? "bg-emerald-500"
                                : inv.status === "pending"
                                ? "bg-amber-500"
                                : inv.status === "refunded"
                                ? "bg-blue-500"
                                : "bg-rose-500"
                            }`}
                          />
                          <span>
                            {inv.status === "paid"
                              ? "Paga"
                              : inv.status === "pending"
                              ? "Pendente"
                              : inv.status === "refunded"
                              ? "Reembolsada"
                              : "Falha"}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {inv.hosted_invoice_url ? (
                          <a
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11.5px] text-[#6E6E73] hover:text-[#1C1C1E] dark:text-[#a1a1aa] dark:hover:text-white"
                          >
                            <span>Fatura</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : inv.pix_ticket_url ? (
                          <a
                            href={inv.pix_ticket_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11.5px] text-[#6E6E73] hover:text-[#1C1C1E] dark:text-[#a1a1aa] dark:hover:text-white"
                          >
                            <span>Comprovante</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[#6E6E73] dark:text-[#a1a1aa] text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#F5F5F7] dark:bg-[#27272a]/60 border border-[#E5E5EA] dark:border-[#27272a] text-center text-[#6E6E73] dark:text-[#a1a1aa] text-[12.5px]">
            Nenhuma fatura registrada até o momento.
          </div>
        )}
      </div>

      {/* Micro-garantias e Segurança */}
      <div className="pt-4 border-t border-[#E5E5EA] dark:border-[#27272a] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
          <span>Processamento criptografado de ponta a ponta</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
          <span>Garantia legal de 7 dias com estorno integral (Art. 49 CDC)</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white" />
          <span>Dados e agenda 100% preservados em conformidade LGPD</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIRMAÇÃO DE UPGRADE COM PRORRATA                               */}
      {/* ========================================================================= */}
      {upgradeTarget && (() => {
        const proration = calculateProrationDifference({
          currentPlanTier: currentTier,
          currentBillingCycle: currentCycle,
          targetPlanTier: upgradeTarget,
          targetBillingCycle: selectedCycle,
          currentPeriodStart: subData?.currentPeriodStart || new Date(),
          currentPeriodEnd: subData?.currentPeriodEnd || new Date(Date.now() + 30 * 86400000),
        });

        const targetPlan = PLANS_CATALOG.find((p) => p.id === upgradeTarget);

        return (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setUpgradeTarget(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          >
            <div
              ref={modalContainerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-upgrade-title"
              aria-describedby="modal-upgrade-description"
              tabIndex={-1}
              className="bg-white dark:bg-[#18181b] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5EA] dark:border-[#27272a] space-y-5 animate-in zoom-in-95 duration-200 text-[#1C1C1E] dark:text-white outline-none focus:outline-none"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#27272a]">
                <h3 id="modal-upgrade-title" className="text-[17px] font-medium">Confirmar Upgrade de Plano</h3>
                <button
                  type="button"
                  onClick={() => setUpgradeTarget(null)}
                  aria-label="Fechar modal de upgrade"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div id="modal-upgrade-description" className="space-y-3 text-[13px] text-[#6E6E73] dark:text-[#a1a1aa]">
                <p>
                  Você está migrando do Plano <strong className="text-[#1C1C1E] dark:text-white">{currentPlanFormatted}</strong> para o Plano{" "}
                  <strong className="text-[#1C1C1E] dark:text-white">{targetPlan?.name}</strong> no ciclo{" "}
                  {selectedCycle === "yearly" ? "anual" : "mensal"}.
                </p>

                <div className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#27272a]/60 border border-[#E5E5EA] dark:border-[#27272a] space-y-2">
                  <div className="flex justify-between">
                    <span>Dias restantes no ciclo:</span>
                    <span className="font-medium text-[#1C1C1E] dark:text-white">{proration.remainingDays} dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Crédito do plano atual:</span>
                    <span className="font-medium text-[#1C1C1E] dark:text-white">
                      R$ {(proration.unusedCurrentPlanCents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#E5E5EA] dark:border-[#27272a] text-[14px]">
                    <span className="font-medium text-[#1C1C1E] dark:text-white">Diferença proporcional:</span>
                    <span className="font-serif text-[18px] font-medium text-[#1C1C1E] dark:text-white">
                      R$ {(proration.netProrationCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-[12px] leading-relaxed">
                  Os novos recursos do Plano {targetPlan?.name} serão liberados imediatamente.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setUpgradeTarget(null)}
                  className="min-h-[44px] px-5 py-2.5 rounded-full border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[12.5px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#3f3f46]"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUpgrade}
                  disabled={actionLoading}
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 shadow-sm"
                >
                  {actionLoading ? "Processando..." : "Confirmar Upgrade Imediato"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRMAÇÃO DE DOWNGRADE AGENDADO                                */}
      {/* ========================================================================= */}
      {downgradeTarget && (() => {
        const targetPlan = PLANS_CATALOG.find((p) => p.id === downgradeTarget);

        return (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setDowngradeTarget(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          >
            <div
              ref={modalContainerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-downgrade-title"
              aria-describedby="modal-downgrade-description"
              tabIndex={-1}
              className="bg-white dark:bg-[#18181b] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5EA] dark:border-[#27272a] space-y-5 animate-in zoom-in-95 duration-200 text-[#1C1C1E] dark:text-white outline-none focus:outline-none"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#27272a]">
                <h3 id="modal-downgrade-title" className="text-[17px] font-medium">Agendar Downgrade de Plano</h3>
                <button
                  type="button"
                  onClick={() => setDowngradeTarget(null)}
                  aria-label="Fechar modal de downgrade"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div id="modal-downgrade-description" className="space-y-3 text-[13px] text-[#6E6E73] dark:text-[#a1a1aa]">
                <p>
                  Você solicitou a mudança para o Plano{" "}
                  <strong className="text-[#1C1C1E] dark:text-white">{targetPlan?.name}</strong>.
                </p>

                <div className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#27272a]/60 border border-[#E5E5EA] dark:border-[#27272a] space-y-2 text-[12.5px]">
                  <p>
                    • Seu plano atual (<strong className="text-[#1C1C1E] dark:text-white">{currentPlanFormatted}</strong>) continuará ativo com todos os recursos até{" "}
                    <strong>{periodEndDate ? periodEndDate.toLocaleDateString("pt-BR") : "o fim do ciclo"}</strong>.
                  </p>
                  <p>
                    • A partir do próximo ciclo, a cobrança será de{" "}
                    <strong className="text-[#1C1C1E] dark:text-white">
                      R$ {selectedCycle === "yearly" ? targetPlan?.annualMonthlyPriceReais : targetPlan?.monthlyPriceReais}/mês
                    </strong>.
                  </p>
                  <p>
                    • Sua equipe atual possui{" "}
                    <strong className="text-[#1C1C1E] dark:text-white">{activeStaffCount} profissional{activeStaffCount > 1 ? "is" : ""}</strong> (limite do Plano {targetPlan?.name}: {targetPlan?.maxStaffLabel}).
                  </p>
                </div>

                <p className="text-[12px] leading-relaxed">
                  Você poderá cancelar este agendamento com 1 clique a qualquer momento antes do término do ciclo.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDowngradeTarget(null)}
                  className="min-h-[44px] px-5 py-2.5 rounded-full border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[12.5px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#3f3f46]"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDowngrade}
                  disabled={actionLoading}
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-medium hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 shadow-sm"
                >
                  {actionLoading ? "Agendando..." : "Confirmar Agendamento"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 3: CANCELAMENTO (CDC ART. 49 vs AO FIM DO CICLO)                     */}
      {/* ========================================================================= */}
      {showCancelModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCancelModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            ref={modalContainerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-cancel-title"
            aria-describedby="modal-cancel-description"
            tabIndex={-1}
            className="bg-white dark:bg-[#18181b] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5EA] dark:border-[#27272a] space-y-5 animate-in zoom-in-95 duration-200 text-[#1C1C1E] dark:text-white outline-none focus:outline-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#27272a]">
              <h3 id="modal-cancel-title" className="text-[17px] font-medium">Cancelamento de Assinatura</h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                aria-label="Fechar modal de cancelamento"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div id="modal-cancel-description" className="space-y-3 text-[13px] text-[#6E6E73] dark:text-[#a1a1aa]">
              {subData?.canRefundCdc ? (
                <>
                  <p>
                    Seu estúdio está no período de garantia legal de 7 dias corridos (Art. 49 do Código de
                    Defesa do Consumidor). Escolha como deseja proceder:
                  </p>

                  <div className="space-y-2 pt-1">
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        cancelChoice === "immediate_refund_cdc"
                          ? "border-[#1C1C1E] dark:border-white bg-[#F5F5F7] dark:bg-[#27272a]/60"
                          : "border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancel_option"
                        checked={cancelChoice === "immediate_refund_cdc"}
                        onChange={() => setCancelChoice("immediate_refund_cdc")}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-medium text-[#1C1C1E] dark:text-white text-[13px]">
                          Estorno integral imediato (Garantia CDC 7 dias)
                        </p>
                        <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                          Cancela o acesso imediatamente e solicita 100% de reembolso ao meio de pagamento.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        cancelChoice === "at_period_end"
                          ? "border-[#1C1C1E] dark:border-white bg-[#F5F5F7] dark:bg-[#27272a]/60"
                          : "border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancel_option"
                        checked={cancelChoice === "at_period_end"}
                        onChange={() => setCancelChoice("at_period_end")}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-medium text-[#1C1C1E] dark:text-white text-[13px]">
                          Manter acesso até o final do ciclo pago
                        </p>
                        <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                          Desativa a renovação automática e preserva o estúdio ativo até{" "}
                          {periodEndDate ? periodEndDate.toLocaleDateString("pt-BR") : "o fim do ciclo"}.
                        </p>
                      </div>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    Ao cancelar, a renovação automática da sua assinatura será desativada.
                  </p>
                  <div className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#27272a]/60 border border-[#E5E5EA] dark:border-[#27272a] text-[12.5px] space-y-1.5">
                    <p>
                      • Seu estúdio e todos os recursos permanecerão 100% disponíveis até{" "}
                      <strong className="text-[#1C1C1E] dark:text-white">
                        {periodEndDate ? periodEndDate.toLocaleDateString("pt-BR") : "o final do ciclo pago"}
                      </strong>.
                    </p>
                    <p>• Nenhuma cobrança futura será realizada.</p>
                    <p>• Seus dados de clientes e histórico continuam salvos e seguros.</p>
                  </div>
                </>
              )}
            </div>

            {/* Botões do Modal: Anti-AI Slop (pílula secundária sóbria, zero bordas vermelhas estridentes) */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="min-h-[44px] px-5 py-2.5 rounded-full border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[12.5px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#3f3f46]"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={actionLoading}
                className="min-h-[44px] px-5 py-2.5 rounded-full border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[12.5px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#3f3f46] transition-all"
              >
                {actionLoading ? "Processando..." : "Confirmar Cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
