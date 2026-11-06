import crypto from "node:crypto";
import { resolvePlanPriceCents, PlanTier, BillingCycle } from "./pricing";

/**
 * Módulo de Integração Oficial Stripe Billing (API v1)
 * Suporte a Customer, Subscription, Stripe Checkout Session, Payment Element e Webhook HMAC-SHA256
 */

export function isStripeConfigured(): boolean {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  return Boolean(
    key &&
      !key.includes("placeholder") &&
      (key.startsWith("sk_test_") || key.startsWith("sk_live_"))
  );
}

export function getStripePublishableKey(): string {
  return (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim();
}

/**
 * Cria ou recupera um Customer na Stripe buscando por e-mail
 */
export async function createOrRetrieveStripeCustomer(params: {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}): Promise<string> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return `cus_mock_${Math.random().toString(36).substring(2, 10)}`;
  }

  // 1. Busca por e-mail existente
  const searchRes = await fetch(
    `https://api.stripe.com/v1/customers?email=${encodeURIComponent(params.email)}&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    }
  );

  if (searchRes.ok) {
    const list = await searchRes.json();
    if (list.data && list.data.length > 0) {
      return list.data[0].id;
    }
  }

  // 2. Cria novo Customer
  const body = new URLSearchParams();
  body.set("email", params.email);
  body.set("name", params.name);
  if (params.metadata) {
    for (const [k, v] of Object.entries(params.metadata)) {
      body.set(`metadata[${k}]`, v);
    }
  }

  const createRes = await fetch("https://api.stripe.com/v1/customers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || "Erro ao criar Customer na Stripe");
  }

  const customer = await createRes.json();
  return customer.id;
}

/**
 * Tabela Oficial de Price IDs do Catálogo Stripe (BRL)
 */
export const STRIPE_PRICE_IDS: Record<PlanTier, Record<BillingCycle, string>> = {
  essencial: {
    monthly: process.env.STRIPE_PRICE_ESSENCIAL_MONTHLY || "price_1UYTjHREks0i7na06v3yplV2",
    yearly: process.env.STRIPE_PRICE_ESSENCIAL_YEARLY || "price_1UYTjHREks0i7na0sW59lEfc",
  },
  gold: {
    monthly: process.env.STRIPE_PRICE_GOLD_MONTHLY || "price_1UYTjIREks0i7na0V17H5v4p",
    yearly: process.env.STRIPE_PRICE_GOLD_YEARLY || "price_1UYTjIREks0i7na0JxwKSQzO",
  },
  platinum: {
    monthly: process.env.STRIPE_PRICE_PLATINUM_MONTHLY || "price_1UYTjIREks0i7na02c52d8HH",
    yearly: process.env.STRIPE_PRICE_PLATINUM_YEARLY || "price_1UYTjJREks0i7na0nEQ7QxWl",
  },
};

/**
 * Cria uma Stripe Checkout Session oficial (mode: subscription)
 * Redireciona o usuário para o ambiente seguro e criptografado da Stripe (PCI-DSS SAQ A)
 * Suporte nativo a 14 dias de teste grátis (R$ 0,00 hoje), 3DS2, Apple Pay, Google Pay e cupom de desconto.
 */
export async function createStripeCheckoutSession(params: {
  customerId: string;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  successUrl: string;
  cancelUrl: string;
  allowTrial?: boolean;
  bonusTrialDays?: number;
  trialEndTimestamp?: number;
  couponId?: string;
  promotionCodeId?: string;
  customPriceCents?: number;
  metadata?: Record<string, string>;
}): Promise<{
  sessionId: string;
  checkoutUrl: string;
}> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const standardPriceCents = resolvePlanPriceCents(params.planTier, params.billingCycle);
  const priceCents =
    params.customPriceCents !== undefined && params.customPriceCents >= 0
      ? params.customPriceCents
      : standardPriceCents;

  if (!secretKey || !isStripeConfigured()) {
    return {
      sessionId: `cs_mock_${Math.random().toString(36).substring(2, 10)}`,
      checkoutUrl: `${params.successUrl}&mock_checkout=true`,
    };
  }

  const body = new URLSearchParams();
  body.set("ui_mode", "hosted_page");
  body.set("mode", "subscription");
  body.set("billing_address_collection", "auto");
  body.set("phone_number_collection[enabled]", "true");
  body.set("automatic_tax[enabled]", "false");
  body.set("allow_promotion_codes", "true");
  body.set("payment_method_collection", "always");
  body.set("submit_type", "auto");
  body.set("name_collection[individual][enabled]", "true");
  body.set("integration_identifier", "hosted_web_0001");
  body.set("origin_context", "web");

  body.set("customer", params.customerId);
  body.set("success_url", params.successUrl);
  body.set("cancel_url", params.cancelUrl);

  // Preço unitário e recorrência (preferência por Price ID oficial do catálogo ou price_data dinâmico)
  const catalogPriceId = STRIPE_PRICE_IDS[params.planTier]?.[params.billingCycle];
  if (catalogPriceId && (!params.customPriceCents || params.customPriceCents === standardPriceCents)) {
    body.set("line_items[0][price]", catalogPriceId);
    body.set("line_items[0][quantity]", "1");
  } else {
    body.set("line_items[0][price_data][currency]", "brl");
    body.set(
      "line_items[0][price_data][product_data][name]",
      `Plano ${params.planTier.toUpperCase()} - LUVEA Studio`
    );
    body.set("line_items[0][price_data][unit_amount]", String(priceCents));
    body.set(
      "line_items[0][price_data][recurring][interval]",
      params.billingCycle === "yearly" ? "year" : "month"
    );
    body.set("line_items[0][quantity]", "1");
  }

  // Período de Teste Grátis (Free Trial da conta)
  // Regra Canônica: O trial de 14 dias pertence à CONTA (estúdio). Se allowTrial === false
  // (período de 14 dias da conta expirou ou já realizou pagamento anterior), a cobrança é
  // IMEDIATA e INTEGRAL na Stripe (R$ 149 para Gold), sem trial_period_days ou trial_end.
  if (params.allowTrial === false) {
    // Cobrança imediata: NÃO injeta nenhum período de trial
  } else if (params.trialEndTimestamp && params.trialEndTimestamp > Math.floor(Date.now() / 1000)) {
    body.set("subscription_data[trial_end]", String(params.trialEndTimestamp));
  } else if (params.bonusTrialDays && params.bonusTrialDays > 0) {
    const trialEnd = Math.floor(
      (Date.now() + params.bonusTrialDays * 86400000) / 1000
    );
    body.set("subscription_data[trial_end]", String(trialEnd));
  } else if (params.allowTrial === true) {
    // 14 dias padrão de teste grátis exclusivamente quando permitido para nova conta
    body.set("subscription_data[trial_period_days]", "14");
  }

  // Cupons / Códigos Promocionais
  if (params.couponId) {
    body.delete("allow_promotion_codes");
    body.set("discounts[0][coupon]", params.couponId);
  } else if (params.promotionCodeId) {
    body.delete("allow_promotion_codes");
    body.set("discounts[0][promotion_code]", params.promotionCodeId);
  }

  // Metadados para reconciliação via webhook (checkout.session.completed)
  if (params.metadata) {
    for (const [k, v] of Object.entries(params.metadata)) {
      body.set(`metadata[${k}]`, v);
      body.set(`subscription_data[metadata][${k}]`, v);
    }
    if (params.metadata.organizationId) {
      body.set("client_reference_id", params.metadata.organizationId);
    }
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const sessionData = await res.json();
  if (!res.ok) {
    throw new Error(
      sessionData.error?.message || "Erro ao criar sessão de checkout na Stripe"
    );
  }

  return {
    sessionId: sessionData.id,
    checkoutUrl: sessionData.url,
  };
}

/**
 * Recupera uma Checkout Session da Stripe (usado na confirmação pós-pagamento,
 * independente da chegada do webhook — essencial em ambiente local sem túnel).
 */
export async function retrieveStripeCheckoutSession(sessionId: string): Promise<{
  found: boolean;
  id?: string;
  status?: string;
  paymentStatus?: string;
  customerId?: string;
  subscriptionId?: string;
  clientReferenceId?: string;
  metadata?: Record<string, string>;
  error?: string;
}> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isStripeConfigured()) {
    return { found: false, error: "Stripe não configurada." };
  }

  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const data = await res.json();
    if (!res.ok) {
      return { found: false, error: data.error?.message || "Sessão de checkout não encontrada." };
    }
    return {
      found: true,
      id: data.id,
      status: data.status,
      paymentStatus: data.payment_status,
      customerId: typeof data.customer === "string" ? data.customer : data.customer?.id,
      subscriptionId:
        typeof data.subscription === "string" ? data.subscription : data.subscription?.id,
      clientReferenceId: data.client_reference_id || undefined,
      metadata: data.metadata || {},
    };
  } catch (err: any) {
    return { found: false, error: err?.message || "Erro de rede com a Stripe." };
  }
}

/**
 * Consulta e valida se um cupom ou promotion code existe e está ativo na Stripe
 */
export async function validateStripeCouponOrPromoCode(code: string): Promise<{
  valid: boolean;
  couponId?: string;
  promotionCodeId?: string;
  discountPercent?: number;
  discountAmountOffCents?: number;
  name?: string;
  error?: string;
}> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isStripeConfigured()) {
    return { valid: false, error: "Stripe não configurada" };
  }

  const normalized = code.trim();

  try {
    // 1. Busca em promotion_codes
    const promoRes = await fetch(
      `https://api.stripe.com/v1/promotion_codes?code=${encodeURIComponent(normalized)}&active=true&limit=1`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );

    if (promoRes.ok) {
      const promoData = await promoRes.json();
      if (promoData.data && promoData.data.length > 0) {
        const promo = promoData.data[0];
        const coupon = promo.coupon;
        return {
          valid: true,
          promotionCodeId: promo.id,
          couponId: coupon?.id,
          discountPercent: coupon?.percent_off || undefined,
          discountAmountOffCents: coupon?.amount_off || undefined,
          name: coupon?.name || promo.code,
        };
      }
    }

    // 2. Busca direta em coupons
    const couponRes = await fetch(
      `https://api.stripe.com/v1/coupons/${encodeURIComponent(normalized)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );

    if (couponRes.ok) {
      const coupon = await couponRes.json();
      if (coupon.valid) {
        return {
          valid: true,
          couponId: coupon.id,
          discountPercent: coupon.percent_off || undefined,
          discountAmountOffCents: coupon.amount_off || undefined,
          name: coupon.name || coupon.id,
        };
      }
    }

    return { valid: false, error: "Cupom não encontrado ou inativo na Stripe" };
  } catch (err: any) {
    return { valid: false, error: err?.message || "Erro ao consultar Stripe" };
  }
}

/**
 * Cria uma Stripe Subscription com payment_behavior: 'default_incomplete'
 * Retorna o clientSecret do PaymentIntent da fatura mais recente para o Payment Element
 */
export async function createStripeSubscription(params: {
  customerId: string;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  bonusTrialDays?: number;
  trialEndTimestamp?: number;
  metadata?: Record<string, string>;
}): Promise<{
  subscriptionId: string;
  clientSecret: string | null;
  status: string;
}> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceCents = resolvePlanPriceCents(params.planTier, params.billingCycle);

  if (!secretKey || !isStripeConfigured()) {
    // Mock seguro para testes locais quando chaves da Stripe não estiverem em .env.local
    return {
      subscriptionId: `sub_mock_${Math.random().toString(36).substring(2, 10)}`,
      clientSecret: `pi_mock_${Math.random().toString(36).substring(2, 15)}_secret_test`,
      status: "incomplete",
    };
  }

  // Monta a requisição oficial para criar a assinatura
  const body = new URLSearchParams();
  body.set("customer", params.customerId);
  body.set("payment_behavior", "default_incomplete");
  body.set("payment_settings[save_default_payment_method]", "on_subscription");
  body.append("expand[]", "latest_invoice.payment_intent");

  // Preço customizado por preço unitário em centavos (BRL)
  body.set("items[0][price_data][currency]", "brl");
  body.set(
    "items[0][price_data][product_data][name]",
    `Plano ${params.planTier.toUpperCase()} - LUVEA Studio`
  );
  body.set("items[0][price_data][unit_amount]", String(priceCents));
  body.set(
    "items[0][price_data][recurring][interval]",
    params.billingCycle === "yearly" ? "year" : "month"
  );

  // Se houver ancoragem direta de trial_end (ex: migração Pix -> Cartão com período vigente)
  if (params.trialEndTimestamp && params.trialEndTimestamp > Math.floor(Date.now() / 1000)) {
    body.set("trial_end", String(params.trialEndTimestamp));
  } else if (params.bonusTrialDays && params.bonusTrialDays > 0) {
    const trialEnd = Math.floor(
      (Date.now() + params.bonusTrialDays * 86400000) / 1000
    );
    body.set("trial_end", String(trialEnd));
  }

  if (params.metadata) {
    for (const [k, v] of Object.entries(params.metadata)) {
      body.set(`metadata[${k}]`, v);
    }
  }

  const subRes = await fetch("https://api.stripe.com/v1/subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const subData = await subRes.json();
  if (!subRes.ok) {
    throw new Error(subData.error?.message || "Erro ao criar assinatura na Stripe");
  }

  const clientSecret =
    subData.latest_invoice?.payment_intent?.client_secret ||
    subData.pending_setup_intent?.client_secret ||
    null;

  return {
    subscriptionId: subData.id,
    clientSecret,
    status: subData.status,
  };
}

/**
 * Cancela ou agenda o cancelamento de uma Stripe Subscription
 * atPeriodEnd: true desativa a renovação automática (cancel_at_period_end = true)
 * atPeriodEnd: false cancela imediatamente
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  atPeriodEnd: boolean = true
): Promise<{ success: boolean; status?: string; error?: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isStripeConfigured()) {
    return { success: true, status: atPeriodEnd ? "cancel_at_period_end" : "canceled" };
  }

  try {
    if (atPeriodEnd) {
      const body = new URLSearchParams();
      body.set("cancel_at_period_end", "true");
      const res = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error?.message || "Erro ao cancelar renovação na Stripe" };
      }
      return { success: true, status: data.status };
    } else {
      const res = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error?.message || "Erro ao cancelar imediatamente na Stripe" };
      }
      return { success: true, status: data.status };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro de rede com Stripe" };
  }
}

/**
 * Reativa a renovação automática da assinatura na Stripe (cancel_at_period_end = false)
 */
export async function reactivateStripeSubscription(
  subscriptionId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isStripeConfigured()) {
    return { success: true, status: "active" };
  }

  try {
    const body = new URLSearchParams();
    body.set("cancel_at_period_end", "false");
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || "Erro ao reativar assinatura na Stripe" };
    }
    return { success: true, status: data.status };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro de rede com Stripe" };
  }
}

/**
 * Pausa cobranças de uma assinatura na Stripe (pause_collection)
 * behavior: "void" (não emite nem tenta cobrar faturas durante a pausa)
 * resumeAtTimestamp?: Unix timestamp em segundos para reativação automática
 */
export async function pauseStripeSubscription(
  subscriptionId: string,
  resumeAtTimestamp?: number
): Promise<{ success: boolean; status?: string; error?: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isStripeConfigured()) {
    return { success: true, status: "paused" };
  }

  try {
    const body = new URLSearchParams();
    body.set("pause_collection[behavior]", "void");
    if (resumeAtTimestamp) {
      body.set("pause_collection[resumes_at]", String(resumeAtTimestamp));
    }

    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || "Erro ao pausar assinatura na Stripe" };
    }
    return { success: true, status: data.status };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro de rede com Stripe ao pausar" };
  }
}

/**
 * Reativa cobranças de uma assinatura pausada na Stripe
 */
export async function resumeStripeSubscription(
  subscriptionId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isStripeConfigured()) {
    return { success: true, status: "active" };
  }

  try {
    const body = new URLSearchParams();
    body.set("pause_collection", "");

    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || "Erro ao retomar assinatura na Stripe" };
    }
    return { success: true, status: data.status };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro de rede com Stripe ao retomar assinatura" };
  }
}

/**
 * Dispara estorno integral da última cobrança paga da assinatura na Stripe (CDC Art. 49)
 * - Suporta payment_intent ou charge id
 * - Localiza a última fatura paga (status=paid) caso latest_invoice não esteja com payment_intent
 * - Idempotente: se já estornada, retorna sucesso sem erro
 */
export async function refundLatestStripeInvoice(
  subscriptionId: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isStripeConfigured()) {
    return { success: true, refundId: `re_mock_${Date.now()}` };
  }

  try {
    // 1. Obtém a assinatura expandindo a última fatura e seu payment_intent e charge
    const subRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}?expand[]=latest_invoice.payment_intent&expand[]=latest_invoice.charge`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );
    const subData = await subRes.json();
    if (!subRes.ok) {
      return { success: false, error: subData.error?.message || "Erro ao consultar assinatura na Stripe" };
    }

    let paymentIntent = subData.latest_invoice?.payment_intent;
    let paymentIntentId = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
    let charge = subData.latest_invoice?.charge;
    let chargeId = typeof charge === "string" ? charge : charge?.id;

    // Se latest_invoice não tiver payment_intent direto, busca faturas com status=paid da assinatura
    if (!paymentIntentId && !chargeId) {
      const invRes = await fetch(
        `https://api.stripe.com/v1/invoices?subscription=${encodeURIComponent(subscriptionId)}&status=paid&limit=1`,
        {
          headers: { Authorization: `Bearer ${secretKey}` },
        }
      );
      if (invRes.ok) {
        const invData = await invRes.json();
        if (invData.data && invData.data.length > 0) {
          const paidInv = invData.data[0];
          paymentIntentId = typeof paidInv.payment_intent === "string" ? paidInv.payment_intent : paidInv.payment_intent?.id;
          chargeId = typeof paidInv.charge === "string" ? paidInv.charge : paidInv.charge?.id;
        }
      }
    }

    if (!paymentIntentId && !chargeId) {
      return { success: false, error: "Nenhum PaymentIntent ou Cobrança localizada para estorno na Stripe" };
    }

    // 2. Dispara o reembolso via POST /v1/refunds
    const refundBody = new URLSearchParams();
    if (paymentIntentId) {
      refundBody.set("payment_intent", paymentIntentId);
    } else if (chargeId) {
      refundBody.set("charge", chargeId);
    }
    refundBody.set("reason", "requested_by_customer");
    refundBody.set("metadata[subscription_id]", subscriptionId);
    refundBody.set("metadata[legal_basis]", "cdc_art49_7days");

    const refundRes = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: refundBody.toString(),
    });
    const refundData = await refundRes.json();
    if (!refundRes.ok) {
      // Se já foi estornado anteriormente, trata com idempotência
      const errMsg = refundData.error?.message || "";
      const errCode = refundData.error?.code || "";
      if (errCode === "charge_already_refunded" || errMsg.toLowerCase().includes("already been refunded")) {
        return { success: true, refundId: "already_refunded" };
      }
      return { success: false, error: errMsg || "Erro ao emitir reembolso na Stripe" };
    }

    return { success: true, refundId: refundData.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro de rede com Stripe ao estornar fatura" };
  }
}

/**
 * Atualiza o Price de uma Subscription existente na Stripe (Upgrades e Downgrades)
 * - Busca os items da subscription
 * - Localiza o item principal (items.data[0])
 * - Atualiza o price para o novo STRIPE_PRICE_IDS[targetPlanTier][targetBillingCycle]
 * - Controla proration_behavior ('always_invoice' para cobrança imediata da diferença no upgrade,
 *   ou 'create_prorations' / 'none' para downgrade)
 */
/**
 * Prévia oficial de Upgrade na Stripe usando a API Create Preview Invoice (/v1/invoices/create_preview)
 * Retorna o valor exato a ser cobrado hoje (com crédito proporcional abatido) ou R$ 0 se estiver em teste grátis.
 */
export async function previewStripeSubscriptionUpgrade(params: {
  subscriptionId: string;
  targetPlanTier: PlanTier;
  targetBillingCycle: BillingCycle;
}): Promise<{
  success: boolean;
  amountDueCents?: number;
  subtotalCents?: number;
  prorationCostCents?: number;
  prorationCreditCents?: number;
  isTrial?: boolean;
  trialEnd?: string | null;
  error?: string;
}> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isStripeConfigured()) {
    const standardPriceCents = resolvePlanPriceCents(params.targetPlanTier, params.targetBillingCycle);
    return {
      success: true,
      amountDueCents: standardPriceCents,
      subtotalCents: standardPriceCents,
      prorationCostCents: standardPriceCents,
      prorationCreditCents: 0,
      isTrial: false,
    };
  }

  try {
    const subRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(params.subscriptionId)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const subData = await subRes.json();
    if (!subRes.ok) {
      return { success: false, error: subData.error?.message || "Assinatura não encontrada na Stripe" };
    }

    const itemId = subData.items?.data?.[0]?.id;
    const customerId = typeof subData.customer === "string" ? subData.customer : subData.customer?.id;
    const nowSec = Math.floor(Date.now() / 1000);
    const isTrial = subData.status === "trialing" && Boolean(subData.trial_end && subData.trial_end > nowSec);
    const trialEnd = subData.trial_end ? new Date(subData.trial_end * 1000).toISOString() : null;

    if (!itemId || !customerId) {
      return { success: false, error: "Dados incompletos da assinatura na Stripe" };
    }

    const targetPriceId = STRIPE_PRICE_IDS[params.targetPlanTier]?.[params.targetBillingCycle];
    const body = new URLSearchParams();
    body.set("customer", customerId);
    body.set("subscription", params.subscriptionId);
    body.set("subscription_details[items][0][id]", itemId);
    if (targetPriceId) {
      body.set("subscription_details[items][0][price]", targetPriceId);
    } else {
      const standardPriceCents = resolvePlanPriceCents(params.targetPlanTier, params.targetBillingCycle);
      body.set("subscription_details[items][0][price_data][currency]", "brl");
      body.set("subscription_details[items][0][price_data][unit_amount]", String(standardPriceCents));
      body.set(
        "subscription_details[items][0][price_data][recurring][interval]",
        params.targetBillingCycle === "yearly" ? "year" : "month"
      );
    }
    // Importante: usa 'always_invoice' para simular exclusivamente a fatura avulsa imediata de prorrata
    // (evitando que 'create_prorations' some a renovação cheia do próximo mês ao valor de hoje)
    body.set(
      "subscription_details[proration_behavior]",
      isTrial ? "none" : "always_invoice"
    );

    const prevRes = await fetch("https://api.stripe.com/v1/invoices/create_preview", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const prevData = await prevRes.json();
    if (!prevRes.ok) {
      return { success: false, error: prevData.error?.message || "Erro ao gerar prévia na Stripe" };
    }

    const lines = prevData.lines?.data || [];
    let prorationCreditCents = 0;
    let prorationCostCents = 0;
    for (const l of lines) {
      const isProrationLine = Boolean(
        l.proration || l.parent?.subscription_item_details?.proration
      );
      if (l.amount < 0) {
        prorationCreditCents += Math.abs(l.amount);
      } else if (l.amount > 0 && isProrationLine) {
        prorationCostCents += l.amount;
      }
    }

    const netAmountDueCents = isTrial
      ? 0
      : prorationCostCents > 0
      ? Math.max(0, prorationCostCents - prorationCreditCents)
      : (prevData.amount_due ?? 0);

    return {
      success: true,
      amountDueCents: netAmountDueCents,
      subtotalCents: prorationCostCents > 0 ? prorationCostCents : (prevData.subtotal ?? 0),
      prorationCostCents,
      prorationCreditCents,
      isTrial,
      trialEnd,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro de rede com a Stripe" };
  }
}

export async function updateStripeSubscriptionPrice(params: {
  subscriptionId: string;
  targetPlanTier: PlanTier;
  targetBillingCycle: BillingCycle;
  prorationBehavior?: "always_invoice" | "create_prorations" | "none";
  customPriceCents?: number;
}): Promise<{
  success: boolean;
  subscriptionId?: string;
  status?: string;
  invoiceId?: string;
  amountPaidCents?: number;
  hostedInvoiceUrl?: string | null;
  isTrial?: boolean;
  error?: string;
}> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isStripeConfigured()) {
    return {
      success: true,
      subscriptionId: params.subscriptionId,
      status: "active",
      invoiceId: `in_mock_upg_${Date.now()}`,
    };
  }

  try {
    // 1. Obtém a assinatura para extrair o subscription item id e checar status atual
    const subRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(params.subscriptionId)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );
    const subData = await subRes.json();
    if (!subRes.ok) {
      return {
        success: false,
        error: subData.error?.message || "Erro ao consultar assinatura na Stripe",
      };
    }

    const itemId = subData.items?.data?.[0]?.id;
    if (!itemId) {
      return {
        success: false,
        error: "Item de assinatura principal não localizado na Stripe",
      };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const isTrial = subData.status === "trialing" && Boolean(subData.trial_end && subData.trial_end > nowSec);

    const standardPriceCents = resolvePlanPriceCents(params.targetPlanTier, params.targetBillingCycle);
    const priceCents =
      params.customPriceCents !== undefined && params.customPriceCents >= 0
        ? params.customPriceCents
        : standardPriceCents;

    const catalogPriceId = STRIPE_PRICE_IDS[params.targetPlanTier]?.[params.targetBillingCycle];

    // 2. Atualiza a assinatura com o novo preço
    const body = new URLSearchParams();
    body.set("items[0][id]", itemId);

    if (catalogPriceId && (!params.customPriceCents || params.customPriceCents === standardPriceCents)) {
      body.set("items[0][price]", catalogPriceId);
    } else {
      body.set("items[0][price_data][currency]", "brl");
      body.set(
        "items[0][price_data][product_data][name]",
        `Plano ${params.targetPlanTier.toUpperCase()} - LUVEA Studio`
      );
      body.set("items[0][price_data][unit_amount]", String(priceCents));
      body.set(
        "items[0][price_data][recurring][interval]",
        params.targetBillingCycle === "yearly" ? "year" : "month"
      );
    }

    // Se a assinatura estiver em período de teste gratuito (trialing), não cobramos prorrata imediata:
    // a alteração de plano é aplicada preservando o término do teste (trial_end)
    const effectiveProration = isTrial ? "none" : (params.prorationBehavior || "always_invoice");
    body.set("proration_behavior", effectiveProration);
    body.set("payment_behavior", isTrial ? "default_incomplete" : "pending_if_incomplete");
    body.set("metadata[plan_tier]", params.targetPlanTier);
    body.set("metadata[billing_cycle]", params.targetBillingCycle);
    body.set("expand[0]", "latest_invoice");

    const updateRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(params.subscriptionId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      return {
        success: false,
        error: updateData.error?.message || "Erro ao atualizar preço da assinatura na Stripe",
      };
    }

    const latestInvoiceObj =
      typeof updateData.latest_invoice === "object" && updateData.latest_invoice !== null
        ? updateData.latest_invoice
        : null;
    const invoiceId = typeof updateData.latest_invoice === "string"
      ? updateData.latest_invoice
      : latestInvoiceObj?.id;
    const amountPaidCents =
      latestInvoiceObj?.amount_paid ?? latestInvoiceObj?.amount_due ?? undefined;
    const hostedInvoiceUrl = latestInvoiceObj?.hosted_invoice_url ?? null;

    return {
      success: true,
      subscriptionId: updateData.id,
      status: updateData.status,
      invoiceId,
      amountPaidCents,
      hostedInvoiceUrl,
      isTrial,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Erro de rede com Stripe ao atualizar plano",
    };
  }
}

/**
 * Agenda ou cancela agendamento de Downgrade na Stripe.
 * Utiliza Subscription Schedules oficiais da Stripe para transição de fase sem interrupção e
 * sincroniza os metadados da Subscription.
 */
export async function scheduleStripeSubscriptionDowngrade(params: {
  subscriptionId: string;
  targetPlanTier: PlanTier | null;
  targetBillingCycle?: BillingCycle;
}): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isStripeConfigured()) {
    return { success: true };
  }

  try {
    const cycle = params.targetBillingCycle || "monthly";
    const body = new URLSearchParams();
    if (params.targetPlanTier) {
      body.set("metadata[scheduled_plan_tier]", params.targetPlanTier);
      body.set("metadata[scheduled_billing_cycle]", cycle);
    } else {
      // Limpa metadados de agendamento de downgrade
      body.set("metadata[scheduled_plan_tier]", "");
      body.set("metadata[scheduled_billing_cycle]", "");
    }

    const res = await fetch(
      `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(params.subscriptionId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error?.message || "Erro ao registrar metadados de agendamento na Stripe",
      };
    }

    // Gerenciamento de Stripe Subscription Schedule
    try {
      // 1. Verifica se já existe um schedule atrelado
      const schedListRes = await fetch(
        `https://api.stripe.com/v1/subscription_schedules?subscription=${encodeURIComponent(params.subscriptionId)}&limit=1`,
        { headers: { Authorization: `Bearer ${secretKey}` } }
      );
      const schedList = await schedListRes.json();
      const existingSched = schedList.data?.[0];

      if (params.targetPlanTier) {
        // Cria ou atualiza o schedule
        let schedId = existingSched?.id;
        let phase0 = existingSched?.phases?.[0];

        if (!schedId) {
          const createSchedRes = await fetch("https://api.stripe.com/v1/subscription_schedules", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${secretKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `from_subscription=${encodeURIComponent(params.subscriptionId)}`,
          });
          if (createSchedRes.ok) {
            const created = await createSchedRes.json();
            schedId = created.id;
            phase0 = created.phases?.[0];
          }
        }

        if (schedId && phase0) {
          const targetPriceId = STRIPE_PRICE_IDS[params.targetPlanTier]?.[cycle];
          const updateSchedBody = new URLSearchParams();
          updateSchedBody.set("phases[0][items][0][price]", phase0.items?.[0]?.price || phase0.items?.[0]?.plan?.id);
          updateSchedBody.set("phases[0][start_date]", String(phase0.start_date));
          updateSchedBody.set("phases[0][end_date]", String(phase0.end_date));

          if (targetPriceId) {
            updateSchedBody.set("phases[1][items][0][price]", targetPriceId);
          } else {
            const targetCents = resolvePlanPriceCents(params.targetPlanTier, cycle);
            updateSchedBody.set("phases[1][items][0][price_data][currency]", "brl");
            updateSchedBody.set("phases[1][items][0][price_data][product_data][name]", `Plano ${params.targetPlanTier.toUpperCase()} - LUVEA Studio`);
            updateSchedBody.set("phases[1][items][0][price_data][unit_amount]", String(targetCents));
            updateSchedBody.set("phases[1][items][0][price_data][recurring][interval]", cycle === "yearly" ? "year" : "month");
          }
          updateSchedBody.set("phases[1][proration_behavior]", "none");

          await fetch(`https://api.stripe.com/v1/subscription_schedules/${encodeURIComponent(schedId)}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${secretKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: updateSchedBody.toString(),
          });
        }
      } else if (existingSched?.id) {
        // Cancelou o agendamento de downgrade: libera o schedule para manter a assinatura renovando normalmente
        await fetch(`https://api.stripe.com/v1/subscription_schedules/${encodeURIComponent(existingSched.id)}/release`, {
          method: "POST",
          headers: { Authorization: `Bearer ${secretKey}` },
        });
      }
    } catch (schedErr) {
      console.warn("[Stripe Schedule API fallback]:", schedErr);
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Erro de rede ao registrar agendamento na Stripe",
    };
  }
}

/**
 * Cria uma sessão do Stripe Customer Portal para o cliente gerenciar faturas e cartão
 */
export async function createStripeBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isStripeConfigured()) {
    return { url: `${params.returnUrl}?billing_portal_mock=true` };
  }

  const body = new URLSearchParams();
  body.set("customer", params.customerId);
  body.set("return_url", params.returnUrl);

  const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Erro ao criar sessão no Stripe Customer Portal");
  }

  return { url: data.url };
}

/**
 * Validação Criptográfica RFC-Compliant do header `stripe-signature`
 * - Extrai timestamp t e assinatura v1
 * - Rejeita replay attacks com tolerância configurável (padrão: 300 segundos = 5 minutos)
 * - Compara HMAC-SHA256 via crypto.timingSafeEqual
 */
export function verifyStripeWebhookSignature(params: {
  payload: string;
  signatureHeader: string | null;
  secret: string;
  toleranceSeconds?: number;
}): { valid: boolean; event?: any; error?: string } {
  const { payload, signatureHeader, secret, toleranceSeconds = 300 } = params;

  if (!signatureHeader || !secret) {
    return { valid: false, error: "Assinatura ou secret ausente" };
  }

  const items = signatureHeader.split(",");
  let timestampStr = "";
  const signatures: string[] = [];

  for (const item of items) {
    const [key, val] = item.trim().split("=");
    if (key === "t") timestampStr = val;
    if (key === "v1" && val) signatures.push(val);
  }

  if (!timestampStr || signatures.length === 0) {
    return { valid: false, error: "Formato inválido de stripe-signature" };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false, error: "Timestamp inválido no webhook" };
  }

  // Verifica janela anti-replay
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
    return { valid: false, error: "Timestamp expirado (possível replay attack)" };
  }

  // Assinatura esperada: HMAC-SHA256(secret, `${timestamp}.${payload}`)
  const signedPayload = `${timestamp}.${payload}`;
  const computedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const computedBuffer = Buffer.from(computedSignature, "hex");

  let match = false;
  for (const sig of signatures) {
    try {
      const sigBuffer = Buffer.from(sig, "hex");
      if (
        computedBuffer.length === sigBuffer.length &&
        crypto.timingSafeEqual(computedBuffer, sigBuffer)
      ) {
        match = true;
        break;
      }
    } catch {
      // Ignora erro de comparação em bytes inválidos
    }
  }

  if (!match) {
    return { valid: false, error: "Assinatura criptográfica v1 não confere" };
  }

  try {
    const event = JSON.parse(payload);
    return { valid: true, event };
  } catch (err: any) {
    return { valid: false, error: "Payload JSON malformado" };
  }
}
