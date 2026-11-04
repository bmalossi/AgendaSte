import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cancelStripeSubscription } from "./stripe";
import { PlanTier, BillingCycle } from "./pricing";

/**
 * Módulo de Processamento de Webhooks de Billing e Sincronização Anti-Duplicidade
 * Orquestra as transições de estado de Ciclo de Plano, Período de Carência (Grace Period)
 * e anulação recíproca entre Stripe (Cartão) e Mercado Pago (Pix).
 */

export interface ProcessStripeWebhookResult {
  handled: boolean;
  action: string;
  organizationId?: string;
  status?: string;
  gracePeriodEndsAt?: string | null;
  voidedPixInvoicesCount?: number;
  error?: string;
}

export interface ProcessMercadoPagoPlanInvoiceInput {
  paymentId: string;
  remoteStatus: string;
  remoteAmountCents: number;
  externalReference?: string | null;
  cancelStripeSubFn?: typeof cancelStripeSubscription;
}

export interface ProcessMercadoPagoPlanInvoiceResult {
  handled: boolean;
  action: string;
  organizationId?: string;
  invoiceId?: string;
  error?: string;
  stripeSubscriptionCanceled?: boolean;
  newPeriodEnd?: string;
}

/**
 * Calcula o término do Período de Carência (3 dias corridos = 72 horas)
 */
export function calculateGracePeriodEndsAt(fromDate: Date = new Date()): Date {
  return new Date(fromDate.getTime() + 3 * 24 * 60 * 60 * 1000);
}

/**
 * Calcula o novo término de ciclo ao quitar fatura Pix:
 * - Se já houver período vigente no futuro, estende a partir dele;
 * - Caso contrário, estende a partir de agora;
 * - Adiciona bônus de trial se aplicável.
 */
export function calculateNewPeriodEndFromPixPayment(params: {
  currentPeriodEnd?: Date | null;
  billingCycle: BillingCycle;
  bonusDays?: number;
  now?: Date;
}): Date {
  const { currentPeriodEnd, billingCycle, bonusDays = 0, now = new Date() } = params;
  const baseDate =
    currentPeriodEnd && currentPeriodEnd.getTime() > now.getTime()
      ? currentPeriodEnd
      : now;

  const cycleDays = (billingCycle === "yearly" ? 365 : 30) + bonusDays;
  return new Date(baseDate.getTime() + cycleDays * 24 * 60 * 60 * 1000);
}

/**
 * Processa eventos de webhook da Stripe
 */
export async function processStripeWebhookEvent(
  event: any
): Promise<ProcessStripeWebhookResult> {
  const eventType = String(event.type || "");
  const eventData = event.data?.object || {};

  // 1. Checkout Finalizado (Nova Assinatura de Plano via Cartão)
  if (eventType === "checkout.session.completed") {
    const organizationId =
      eventData.client_reference_id || eventData.metadata?.organizationId;
    const subdomain = eventData.metadata?.subdomain;
    const customerId = eventData.customer;
    const subscriptionId = eventData.subscription;

    if (!isSupabaseConfigured()) {
      return {
        handled: true,
        action: "checkout.session.completed:mock",
        organizationId: organizationId || subdomain,
        status: "active",
      };
    }

    let orgId = organizationId;
    if (!orgId && subdomain) {
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("id, first_paid_at")
        .eq("slug", subdomain)
        .maybeSingle();
      if (org) orgId = org.id;
    }

    if (orgId) {
      const nowIso = new Date().toISOString();
      const { data: currentOrg } = await supabaseAdmin
        .from("organizations")
        .select("first_paid_at")
        .eq("id", orgId)
        .maybeSingle();

      await supabaseAdmin
        .from("organizations")
        .update({
          subscription_status: "active",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          payment_gateway: "stripe",
          cancel_at_period_end: false,
          grace_period_ends_at: null,
          first_paid_at: currentOrg?.first_paid_at || nowIso,
          updated_at: nowIso,
        })
        .eq("id", orgId);

      // Anula faturas Pix pendentes para evitar duplicidade
      const { count } = await supabaseAdmin
        .from("subscription_invoices")
        .update({ status: "void", updated_at: nowIso })
        .eq("organization_id", orgId)
        .eq("gateway", "mercadopago")
        .eq("status", "pending");

      return {
        handled: true,
        action: "checkout.session.completed:processed",
        organizationId: orgId,
        status: "active",
        voidedPixInvoicesCount: count || 0,
      };
    }

    return {
      handled: true,
      action: "checkout.session.completed:no_org_found",
    };
  }

  // 2. Fatura de Renovação Paga com Sucesso
  if (eventType === "invoice.payment_succeeded" || eventType === "invoice.paid") {
    const subscriptionId = eventData.subscription;
    const amountPaid = eventData.amount_paid || 0;
    const invoiceId = eventData.id;
    const hostedInvoiceUrl = eventData.hosted_invoice_url;

    if (!isSupabaseConfigured()) {
      return {
        handled: true,
        action: `${eventType}:mock`,
        status: "active",
      };
    }

    if (subscriptionId) {
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("id, plan_tier, billing_cycle, first_paid_at")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();

      if (org) {
        const nowIso = new Date().toISOString();

        await supabaseAdmin
          .from("organizations")
          .update({
            subscription_status: "active",
            grace_period_ends_at: null,
            cancel_at_period_end: false,
            first_paid_at: org.first_paid_at || nowIso,
            updated_at: nowIso,
          })
          .eq("id", org.id);

        // Registra ou atualiza fatura na tabela de Faturas do Plano
        await supabaseAdmin
          .from("subscription_invoices")
          .upsert(
            {
              organization_id: org.id,
              gateway: "stripe",
              external_invoice_id: invoiceId,
              plan_tier: org.plan_tier || "gold",
              billing_cycle: org.billing_cycle || "monthly",
              amount_cents: amountPaid,
              status: "paid",
              paid_at: nowIso,
              hosted_invoice_url: hostedInvoiceUrl,
            },
            { onConflict: "external_invoice_id" }
          );

        // Anula quaisquer faturas Pix pendentes concorrentes
        const { count } = await supabaseAdmin
          .from("subscription_invoices")
          .update({ status: "void", updated_at: nowIso })
          .eq("organization_id", org.id)
          .eq("gateway", "mercadopago")
          .eq("status", "pending");

        return {
          handled: true,
          action: "invoice.payment_succeeded:processed",
          organizationId: org.id,
          status: "active",
          voidedPixInvoicesCount: count || 0,
        };
      }
    }

    return {
      handled: true,
      action: `${eventType}:no_org_found`,
    };
  }

  // 3. Falha no Pagamento da Renovação (Transição para Período de Carência)
  if (
    eventType === "invoice.payment_failed" ||
    eventType === "customer.subscription.past_due"
  ) {
    const subscriptionId = eventData.subscription || eventData.id;
    const graceEndsAt = calculateGracePeriodEndsAt();

    if (!isSupabaseConfigured()) {
      return {
        handled: true,
        action: `${eventType}:mock`,
        status: "past_due",
        gracePeriodEndsAt: graceEndsAt.toISOString(),
      };
    }

    if (subscriptionId) {
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();

      if (org) {
        const nowIso = new Date().toISOString();

        await supabaseAdmin
          .from("organizations")
          .update({
            subscription_status: "past_due",
            grace_period_ends_at: graceEndsAt.toISOString(),
            updated_at: nowIso,
          })
          .eq("id", org.id);

        if (eventType === "invoice.payment_failed" && eventData.id) {
          await supabaseAdmin
            .from("subscription_invoices")
            .upsert(
              {
                organization_id: org.id,
                gateway: "stripe",
                external_invoice_id: eventData.id,
                plan_tier: "gold",
                billing_cycle: "monthly",
                amount_cents: eventData.amount_due || 0,
                status: "failed",
              },
              { onConflict: "external_invoice_id" }
            );
        }

        return {
          handled: true,
          action: `${eventType}:grace_period_started`,
          organizationId: org.id,
          status: "past_due",
          gracePeriodEndsAt: graceEndsAt.toISOString(),
        };
      }
    }

    return {
      handled: true,
      action: `${eventType}:no_org_found`,
    };
  }

  // 4. Assinatura Atualizada (customer.subscription.updated)
  if (eventType === "customer.subscription.updated") {
    const subscriptionId = eventData.id;
    const status = eventData.status;
    const cancelAtPeriodEnd = Boolean(eventData.cancel_at_period_end);

    if (!isSupabaseConfigured()) {
      return {
        handled: true,
        action: "customer.subscription.updated:mock",
        status,
      };
    }

    if (subscriptionId) {
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("id, grace_period_ends_at")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();

      if (org) {
        const updatePayload: Record<string, any> = {
          cancel_at_period_end: cancelAtPeriodEnd,
          updated_at: new Date().toISOString(),
        };

        if (status === "active") {
          updatePayload.subscription_status = "active";
          updatePayload.grace_period_ends_at = null;
        } else if (status === "past_due") {
          updatePayload.subscription_status = "past_due";
          if (!org.grace_period_ends_at) {
            updatePayload.grace_period_ends_at = calculateGracePeriodEndsAt().toISOString();
          }
        } else if (status === "canceled") {
          updatePayload.subscription_status = "canceled";
          updatePayload.canceled_at = new Date().toISOString();
        }

        if (eventData.current_period_start) {
          updatePayload.current_period_start = new Date(
            eventData.current_period_start * 1000
          ).toISOString();
        }
        if (eventData.current_period_end) {
          updatePayload.current_period_end = new Date(
            eventData.current_period_end * 1000
          ).toISOString();
        }

        await supabaseAdmin
          .from("organizations")
          .update(updatePayload)
          .eq("id", org.id);

        return {
          handled: true,
          action: "customer.subscription.updated:processed",
          organizationId: org.id,
          status,
          gracePeriodEndsAt: updatePayload.grace_period_ends_at,
        };
      }
    }

    return {
      handled: true,
      action: "customer.subscription.updated:no_org_found",
    };
  }

  // 5. Assinatura Excluída/Encerrada
  if (eventType === "customer.subscription.deleted") {
    const subscriptionId = eventData.id;

    if (!isSupabaseConfigured()) {
      return {
        handled: true,
        action: "customer.subscription.deleted:mock",
        status: "canceled",
      };
    }

    if (subscriptionId) {
      const nowIso = new Date().toISOString();
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();

      if (org) {
        await supabaseAdmin
          .from("organizations")
          .update({
            subscription_status: "canceled",
            canceled_at: nowIso,
            updated_at: nowIso,
          })
          .eq("id", org.id);

        return {
          handled: true,
          action: "customer.subscription.deleted:processed",
          organizationId: org.id,
          status: "canceled",
        };
      }
    }

    return {
      handled: true,
      action: "customer.subscription.deleted:no_org_found",
    };
  }

  return {
    handled: false,
    action: `unhandled_event:${eventType}`,
  };
}

/**
 * Processa a liquidação de fatura Pix (Mercado Pago) de Assinatura SaaS
 * - Confere valor pago exatamente igual ao amount_cents da fatura
 * - Ativa ciclo da organização e estende current_period_end
 * - Desativa renovação na Stripe se houver assinatura ativa para evitar cobrança dupla
 */
export async function processMercadoPagoPlanInvoicePayment(
  input: ProcessMercadoPagoPlanInvoiceInput
): Promise<ProcessMercadoPagoPlanInvoiceResult> {
  const {
    paymentId,
    remoteStatus,
    remoteAmountCents,
    externalReference,
    cancelStripeSubFn = cancelStripeSubscription,
  } = input;

  if (remoteStatus !== "approved") {
    return {
      handled: false,
      action: "payment_not_approved",
      error: `Status remoto (${remoteStatus}) não aprovado.`,
    };
  }

  if (!isSupabaseConfigured()) {
    // Modo teste/mock
    return {
      handled: true,
      action: "mercadopago_pix:mock_approved",
      stripeSubscriptionCanceled: true,
    };
  }

  // Localiza fatura correspondente na tabela subscription_invoices
  let invoiceQuery = supabaseAdmin
    .from("subscription_invoices")
    .select("id, organization_id, plan_tier, billing_cycle, amount_cents, bonus_trial_days_applied, status");

  if (externalReference) {
    invoiceQuery = invoiceQuery.or(
      `external_payment_id.eq.${paymentId},external_invoice_id.eq.${externalReference},id.eq.${externalReference}`
    );
  } else {
    invoiceQuery = invoiceQuery.eq("external_payment_id", paymentId);
  }

  const { data: invoice } = await invoiceQuery.maybeSingle();

  if (!invoice) {
    // Não é uma fatura de plano SaaS (pode ser agendamento de cliente B2C)
    return {
      handled: false,
      action: "not_a_plan_invoice",
    };
  }

  // Conferência estrita server-to-server de valor (Acceptance Criterion 3)
  if (remoteAmountCents !== invoice.amount_cents) {
    return {
      handled: true,
      action: "amount_mismatch",
      invoiceId: invoice.id,
      organizationId: invoice.organization_id,
      error: `Valor pago no gateway (${remoteAmountCents} centavos) difere do valor da fatura do plano (${invoice.amount_cents} centavos).`,
    };
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // Consulta organização vinculada
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id, stripe_subscription_id, current_period_end, first_paid_at")
    .eq("id", invoice.organization_id)
    .single();

  if (!org) {
    return {
      handled: true,
      action: "organization_not_found",
      invoiceId: invoice.id,
      error: "Organização vinculada à fatura não encontrada.",
    };
  }

  // Calcula novo current_period_end estendido
  const currentEnd = org.current_period_end ? new Date(org.current_period_end) : null;
  const newPeriodEnd = calculateNewPeriodEndFromPixPayment({
    currentPeriodEnd: currentEnd,
    billingCycle: invoice.billing_cycle as BillingCycle,
    bonusDays: invoice.bonus_trial_days_applied,
    now,
  });

  // Atualiza fatura para paga
  await supabaseAdmin
    .from("subscription_invoices")
    .update({
      status: "paid",
      paid_at: nowIso,
      external_payment_id: paymentId,
      updated_at: nowIso,
    })
    .eq("id", invoice.id);

  // Sincronização Anti-Duplicidade (Acceptance Criterion 5)
  // Se o estúdio possuía assinatura na Stripe, desativa a renovação automática na Stripe
  let stripeSubscriptionCanceled = false;
  if (org.stripe_subscription_id) {
    try {
      await cancelStripeSubFn(org.stripe_subscription_id, true);
      stripeSubscriptionCanceled = true;
    } catch (cancelErr) {
      console.warn("[Anti-Duplication Stripe Cancel Error]:", cancelErr);
    }
  }

  // Atualiza organização para plano ativo, com gateway mercadopago e renovação Stripe desativada
  await supabaseAdmin
    .from("organizations")
    .update({
      subscription_status: "active",
      plan_tier: invoice.plan_tier,
      billing_cycle: invoice.billing_cycle,
      payment_gateway: "mercadopago",
      cancel_at_period_end: Boolean(org.stripe_subscription_id),
      current_period_start: (currentEnd && currentEnd > now ? currentEnd : now).toISOString(),
      current_period_end: newPeriodEnd.toISOString(),
      grace_period_ends_at: null,
      first_paid_at: org.first_paid_at || nowIso,
      updated_at: nowIso,
    })
    .eq("id", org.id);

  return {
    handled: true,
    action: "mercadopago_plan_invoice:activated",
    organizationId: org.id,
    invoiceId: invoice.id,
    stripeSubscriptionCanceled,
    newPeriodEnd: newPeriodEnd.toISOString(),
  };
}
