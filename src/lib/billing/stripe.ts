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
  body.set("mode", "subscription");
  body.set("customer", params.customerId);
  body.set("success_url", params.successUrl);
  body.set("cancel_url", params.cancelUrl);
  body.set("payment_method_types[0]", "card");

  // Preço unitário e recorrência
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

  // Período de Teste Grátis (14 dias ou restante)
  if (params.trialEndTimestamp && params.trialEndTimestamp > Math.floor(Date.now() / 1000)) {
    body.set("subscription_data[trial_end]", String(params.trialEndTimestamp));
  } else if (params.bonusTrialDays && params.bonusTrialDays > 0) {
    const trialEnd = Math.floor(
      (Date.now() + params.bonusTrialDays * 86400000) / 1000
    );
    body.set("subscription_data[trial_end]", String(trialEnd));
  } else {
    // 14 dias padrão de teste grátis
    body.set("subscription_data[trial_period_days]", "14");
  }

  // Cupons / Códigos Promocionais
  if (params.couponId) {
    body.set("discounts[0][coupon]", params.couponId);
  } else if (params.promotionCodeId) {
    body.set("discounts[0][promotion_code]", params.promotionCodeId);
  } else if (params.customPriceCents !== undefined && params.customPriceCents < standardPriceCents) {
    // Desconto de cupom interno (PLATFORM_PROMO_COUPONS) já aplicado no unit_amount; não acumula
  } else {
    // Permite que o cliente também insira cupons diretamente na tela oficial da Stripe
    body.set("allow_promotion_codes", "true");
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
