/**
 * Módulo de Domínio: Resolução de Preços, Prorrata e Governança de Ciclo SaaS LUVEA
 * Single Source of Truth para faturamento de planos Essencial, Gold e Platinum.
 */

export type PlanTier = "essencial" | "gold" | "platinum";
export type BillingCycle = "monthly" | "yearly";

export interface PlanPricingDetail {
  id: PlanTier;
  monthlyCents: number;
  yearlyCents: number; // Valor integral cobrado no ciclo anual
  annualMonthlyEquivalentCents: number;
}

export const PLAN_PRICES_CENTS: Record<PlanTier, PlanPricingDetail> = {
  essencial: {
    id: "essencial",
    monthlyCents: 6900, // R$ 69,00
    yearlyCents: 70800, // R$ 708,00 (12 x R$ 59,00)
    annualMonthlyEquivalentCents: 5900,
  },
  gold: {
    id: "gold",
    monthlyCents: 14900, // R$ 149,00
    yearlyCents: 154800, // R$ 1.548,00 (12 x R$ 129,00)
    annualMonthlyEquivalentCents: 12900,
  },
  platinum: {
    id: "platinum",
    monthlyCents: 39900, // R$ 399,00
    yearlyCents: 418800, // R$ 4.188,00 (12 x R$ 349,00)
    annualMonthlyEquivalentCents: 34900,
  },
};

/**
 * Retorna o valor oficial do plano em centavos resolvido exclusivamente no servidor.
 */
export function resolvePlanPriceCents(
  planTier: PlanTier,
  billingCycle: BillingCycle
): number {
  const plan = PLAN_PRICES_CENTS[planTier];
  if (!plan) {
    throw new Error(`Plano desconhecido: ${planTier}`);
  }
  return billingCycle === "yearly" ? plan.yearlyCents : plan.monthlyCents;
}

/**
 * Calcula a data de término do primeiro período pago adicionando os dias
 * restantes do Teste Grátis (Free Trial) para não penalizar quem contrata antecipadamente.
 */
export function calculateBonusTrialPeriodEnd(params: {
  trialEndsAt: Date | string | null | undefined;
  billingCycle: BillingCycle;
  now?: Date;
}): {
  bonusDaysApplied: number;
  periodStart: Date;
  periodEnd: Date;
} {
  const now = params.now ? new Date(params.now) : new Date();
  const trialEnd = params.trialEndsAt ? new Date(params.trialEndsAt) : null;

  let bonusDays = 0;
  if (trialEnd && trialEnd.getTime() > now.getTime()) {
    const diffMs = trialEnd.getTime() - now.getTime();
    bonusDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  const baseCycleDays = params.billingCycle === "yearly" ? 365 : 30;
  const totalDays = baseCycleDays + bonusDays;

  const periodEnd = new Date(now.getTime() + totalDays * 24 * 60 * 60 * 1000);

  return {
    bonusDaysApplied: bonusDays,
    periodStart: now,
    periodEnd,
  };
}

/**
 * Validação Anti-Overwrite de Subdomínio Multi-Tenant:
 * Impede que requisições não autenticadas ou de usuários de outros estúdios
 * sobrescrevam os dados ou plano de uma organização já cadastrada.
 * Se a organização existente for órfã (sem perfis vinculados e sem assinatura ativa),
 * permite a reivindicação segura para que subdomínios não fiquem travados.
 */
export function validateSubdomainOwnership(params: {
  existingOrg: { id: string; slug: string; name: string } | null;
  requesterUserId: string | null;
  requesterOrgId?: string | null;
  requesterRole?: string | null;
  isOrphan?: boolean;
}): {
  canProceed: boolean;
  isUpdate?: boolean;
  isReclaim?: boolean;
  status?: number;
  error?: string;
} {
  const { existingOrg, requesterUserId, requesterOrgId, requesterRole, isOrphan } = params;

  if (!existingOrg) {
    // Organização inédita -> pode criar livremente
    return { canProceed: true, isUpdate: false };
  }

  // Se a organização existente for órfã (tentativa interrompida sem perfil vinculado)
  if (isOrphan) {
    return { canProceed: true, isUpdate: true, isReclaim: true };
  }

  // Se já existe com membros, exige que o requisitante seja membro autenticado com papel de owner ou admin
  const isAuthorized =
    Boolean(requesterUserId) &&
    requesterOrgId === existingOrg.id &&
    (requesterRole === "owner" || requesterRole === "admin");

  if (isAuthorized) {
    return { canProceed: true, isUpdate: true };
  }

  return {
    canProceed: false,
    status: 409,
    error: `O subdomínio "${existingOrg.slug}" já está em uso por outro estúdio. Se esta é a sua conta, faça login antes de concluir a assinatura.`,
  };
}

export interface PromoCoupon {
  code: string;
  discountPercent?: number;
  discountAmountOffCents?: number;
  description: string;
}

export const PLATFORM_PROMO_COUPONS: Record<string, PromoCoupon> = {
  LUVEA10: {
    code: "LUVEA10",
    discountPercent: 10,
    description: "10% de desconto",
  },
  LUVEA20: {
    code: "LUVEA20",
    discountPercent: 20,
    description: "20% de desconto especial",
  },
  INAUGURA15: {
    code: "INAUGURA15",
    discountPercent: 15,
    description: "15% de desconto de lançamento",
  },
  VIP30: {
    code: "VIP30",
    discountPercent: 30,
    description: "30% de desconto VIP",
  },
  BETA100: {
    code: "BETA100",
    discountPercent: 100,
    description: "100% de desconto de testes",
  },
};

export function calculateDiscountedPrice(
  originalCents: number,
  coupon?: { discountPercent?: number; discountAmountOffCents?: number } | null
): {
  discountCents: number;
  finalCents: number;
} {
  if (!coupon) {
    return { discountCents: 0, finalCents: originalCents };
  }

  let discountCents = 0;
  if (coupon.discountPercent && coupon.discountPercent > 0) {
    discountCents = Math.round((originalCents * coupon.discountPercent) / 100);
  } else if (coupon.discountAmountOffCents && coupon.discountAmountOffCents > 0) {
    discountCents = Math.min(originalCents, coupon.discountAmountOffCents);
  }

  const finalCents = Math.max(0, originalCents - discountCents);
  return { discountCents, finalCents };
}

const TIER_RANKS: Record<PlanTier, number> = {
  essencial: 1,
  gold: 2,
  platinum: 3,
};

const CYCLE_RANKS: Record<BillingCycle, number> = {
  monthly: 1,
  yearly: 2,
};

export const PLAN_STAFF_LIMITS: Record<PlanTier, number> = {
  essencial: 1,
  gold: 9,
  platinum: 9999, // Ilimitado
};

/**
 * Determina se a mudança solicitada configura um Upgrade (para plano maior ou mensal -> anual)
 */
export function isPlanUpgrade(
  currentPlanTier: PlanTier,
  currentCycle: BillingCycle,
  targetPlanTier: PlanTier,
  targetCycle: BillingCycle
): boolean {
  const currentRank = TIER_RANKS[currentPlanTier] || 1;
  const targetRank = TIER_RANKS[targetPlanTier] || 1;

  if (targetRank > currentRank) return true;
  if (targetRank === currentRank) {
    const currentCycleRank = CYCLE_RANKS[currentCycle] || 1;
    const targetCycleRank = CYCLE_RANKS[targetCycle] || 1;
    return targetCycleRank > currentCycleRank;
  }
  return false;
}

/**
 * Calcula a prorrata proporcional dos dias restantes para Upgrade imediato
 */
export function calculateProrationDifference(params: {
  currentPlanTier: PlanTier;
  currentBillingCycle: BillingCycle;
  targetPlanTier: PlanTier;
  targetBillingCycle: BillingCycle;
  currentPeriodStart: Date | string;
  currentPeriodEnd: Date | string;
  now?: Date | string;
}): {
  isUpgrade: boolean;
  totalDaysInCycle: number;
  remainingDays: number;
  unusedCurrentPlanCents: number;
  costTargetPlanRemainingCents: number;
  netProrationCents: number;
} {
  const {
    currentPlanTier,
    currentBillingCycle,
    targetPlanTier,
    targetBillingCycle,
    currentPeriodStart,
    currentPeriodEnd,
    now = new Date(),
  } = params;

  const isUpgrade = isPlanUpgrade(
    currentPlanTier,
    currentBillingCycle,
    targetPlanTier,
    targetBillingCycle
  );

  const startDate = new Date(currentPeriodStart);
  const endDate = new Date(currentPeriodEnd);
  const nowDate = new Date(now);

  const totalCycleMs = Math.max(86400000, endDate.getTime() - startDate.getTime());
  const totalDaysInCycle = Math.max(1, Math.round(totalCycleMs / 86400000));

  const remainingMs = Math.max(0, endDate.getTime() - nowDate.getTime());
  const remainingDays = Math.max(0, Math.ceil(remainingMs / 86400000));

  const currentPrice = resolvePlanPriceCents(currentPlanTier, currentBillingCycle);
  const targetPrice = resolvePlanPriceCents(targetPlanTier, targetBillingCycle);

  // Crédito do plano atual não utilizado nos dias restantes
  const unusedCurrentPlanCents = Math.round((currentPrice * remainingDays) / totalDaysInCycle);

  // Custo do novo plano para o período restante proporcional
  // Se for upgrade de ciclo mensal para anual, o target é cobrado por ano menos o crédito
  const costTargetPlanRemainingCents =
    targetBillingCycle === "yearly" && currentBillingCycle === "monthly"
      ? targetPrice // Cobra o valor anual abatendo o crédito dos dias restantes
      : Math.round((targetPrice * remainingDays) / totalDaysInCycle);

  const netProrationCents = Math.max(
    0,
    costTargetPlanRemainingCents - unusedCurrentPlanCents
  );

  return {
    isUpgrade,
    totalDaysInCycle,
    remainingDays,
    unusedCurrentPlanCents,
    costTargetPlanRemainingCents,
    netProrationCents,
  };
}

/**
 * Validação de Downgrade por Limite de Profissionais (maxStaff)
 * Impede agendamento de downgrade caso a equipe atual exceda a capacidade do plano de destino
 */
export function validateDowngradeStaffLimit(params: {
  activeStaffCount: number;
  targetPlanTier: PlanTier;
}): {
  valid: boolean;
  maxAllowed: number;
  currentCount: number;
  error?: string;
} {
  const { activeStaffCount, targetPlanTier } = params;
  const maxAllowed = PLAN_STAFF_LIMITS[targetPlanTier] ?? 1;

  if (activeStaffCount > maxAllowed) {
    const planName =
      targetPlanTier === "essencial" ? "Essencial" :
      targetPlanTier === "gold" ? "Gold" : "Platinum";

    return {
      valid: false,
      maxAllowed,
      currentCount: activeStaffCount,
      error: `Sua equipe possui ${activeStaffCount} profissionais ativos, mas o Plano ${planName} permite no máximo ${maxAllowed} profissional${maxAllowed > 1 ? "s" : ""}. Desative ou remova profissionais antes de agendar o downgrade.`,
    };
  }

  return {
    valid: true,
    maxAllowed,
    currentCount: activeStaffCount,
  };
}

/**
 * Verifica elegibilidade ao direito de arrependimento e reembolso integral (CDC Art. 49)
 * Válido exclusivamente nos primeiros 7 dias corridos após o 1º pagamento histórico (first_paid_at)
 */
export function isEligibleForCdcRefund(
  firstPaidAt?: Date | string | null,
  now: Date | string = new Date()
): boolean {
  if (!firstPaidAt) return false;

  const firstPaidDate = new Date(firstPaidAt);
  if (isNaN(firstPaidDate.getTime())) return false;

  const nowDate = new Date(now);
  const diffMs = nowDate.getTime() - firstPaidDate.getTime();

  // 7 dias corridos = 7 * 24 * 60 * 60 * 1000 = 604.800.000 ms
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return diffMs >= 0 && diffMs <= sevenDaysMs;
}
