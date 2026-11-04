import { PlanTier, PLAN_STAFF_LIMITS } from "./pricing";

/**
 * Motor de Avaliação de Permissões e Entitlements SaaS LUVEA
 * Single Source of Truth para Período de Carência, Bloqueio Operacional e Limites de Plano
 */

export type AccessState =
  | "full_access"
  | "grace_period_warning"
  | "operational_soft_lock";

export interface OrganizationBillingContext {
  subscriptionStatus?: string | null;
  planTier?: string | null;
  trialEndsAt?: Date | string | null;
  gracePeriodEndsAt?: Date | string | null;
  currentPeriodEnd?: Date | string | null;
  now?: Date | string;
}

export interface OrganizationEntitlements {
  accessState: AccessState;
  isSoftLocked: boolean;
  isGracePeriod: boolean;
  graceDaysLeft: number;
  planTier: PlanTier;
  maxStaff: number;
  canCreateNewAppointments: boolean;
  canAcceptOnlineBookings: boolean;
  canSendMarketingCampaigns: boolean;
  canUseAiReception: boolean;
  canCompleteConfirmedAppointments: boolean; // Sempre true para honrar agendamentos com sinal pago
  canExportDataLgpd: boolean; // Sempre true para conformidade com a LGPD
  canUsePhysicalResources: boolean;
  canUsePayroll: boolean;
  marketingCredits: number;
}

/**
 * Avalia as permissões operacionais do estúdio com base no status do ciclo de faturamento
 */
export function evaluateOrganizationEntitlements(
  context: OrganizationBillingContext
): OrganizationEntitlements {
  const now = context.now ? new Date(context.now) : new Date();
  const subStatus = (context.subscriptionStatus || "trialing").toLowerCase();

  const rawTier = (context.planTier || "gold").toLowerCase();
  const planTier: PlanTier =
    rawTier.includes("platinum")
      ? "platinum"
      : rawTier.includes("essencial")
      ? "essencial"
      : "gold";

  let accessState: AccessState = "full_access";
  let graceDaysLeft = 0;

  // 1. Status 'active': Acesso total garantido
  if (subStatus === "active") {
    accessState = "full_access";
  }
  // 2. Status 'trialing': Verifica se o trial de 14 dias ainda é válido
  else if (subStatus === "trialing") {
    const trialEnd = context.trialEndsAt ? new Date(context.trialEndsAt) : null;
    if (trialEnd && trialEnd.getTime() < now.getTime()) {
      accessState = "operational_soft_lock";
    } else {
      accessState = "full_access";
    }
  }
  // 3. Status 'past_due': Verifica Período de Carência (Grace Period de 3 dias)
  else if (subStatus === "past_due") {
    const graceEnd = context.gracePeriodEndsAt
      ? new Date(context.gracePeriodEndsAt)
      : null;

    if (graceEnd && graceEnd.getTime() > now.getTime()) {
      accessState = "grace_period_warning";
      const diffMs = graceEnd.getTime() - now.getTime();
      graceDaysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      // Expirou o período de carência de 3 dias -> Bloqueio Operacional
      accessState = "operational_soft_lock";
    }
  }
  // 4. Status 'canceled': Se ainda houver período pago vigente, mantém full_access
  else if (subStatus === "canceled") {
    const periodEnd = context.currentPeriodEnd
      ? new Date(context.currentPeriodEnd)
      : null;

    if (periodEnd && periodEnd.getTime() > now.getTime()) {
      accessState = "full_access";
    } else {
      accessState = "operational_soft_lock";
    }
  }
  // 5. Qualquer outro status (ex: unpaid, incomplete, etc.)
  else {
    accessState = "operational_soft_lock";
  }

  const isSoftLocked = accessState === "operational_soft_lock";
  const isGracePeriod = accessState === "grace_period_warning";

  // Limites por Plano Canônico
  const maxStaff = PLAN_STAFF_LIMITS[planTier] ?? 1;
  const canUsePhysicalResources = planTier === "platinum";
  const canUsePayroll = planTier === "gold" || planTier === "platinum";
  const marketingCredits =
    planTier === "essencial" ? 100 : planTier === "gold" ? 500 : 2000;

  // Em Bloqueio Operacional (Soft-Lock):
  // - Novas reservas e novos agendamentos são suspensos
  // - Recepção IA e campanhas de marketing são suspensas
  // - MAS dar baixa em agendamentos já confirmados é 100% PERMITIDO (protege o cliente que pagou sinal)
  // - Exportação de dados e relatórios LGPD é 100% PERMITIDA
  const canCreateNewAppointments = !isSoftLocked;
  const canAcceptOnlineBookings = !isSoftLocked;
  const canSendMarketingCampaigns = !isSoftLocked;
  const canUseAiReception =
    !isSoftLocked && (planTier === "gold" || planTier === "platinum");

  return {
    accessState,
    isSoftLocked,
    isGracePeriod,
    graceDaysLeft,
    planTier,
    maxStaff,
    canCreateNewAppointments,
    canAcceptOnlineBookings,
    canSendMarketingCampaigns,
    canUseAiReception,
    canCompleteConfirmedAppointments: true, // Incondicional (LGPD e proteção ao consumidor)
    canExportDataLgpd: true, // Incondicional (Conformidade com a LGPD)
    canUsePhysicalResources,
    canUsePayroll,
    marketingCredits,
  };
}

/**
 * Validação de permissão para conclusão de agendamento em estúdio com Bloqueio Operacional.
 * Permite dar baixa apenas se o agendamento já estava previamente confirmado ('confirmed' ou '1_confirmed').
 */
export function canCompleteAppointmentInSoftLock(appointmentStatus?: string): boolean {
  if (!appointmentStatus) return false;
  const normalized = appointmentStatus.toLowerCase();
  return (
    normalized === "confirmed" ||
    normalized === "1_confirmed" ||
    normalized === "completed" ||
    normalized === "in_progress"
  );
}
