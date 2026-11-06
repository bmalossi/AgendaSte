import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isEligibleForCdcRefund, resolvePlanPriceCents, PlanTier, BillingCycle } from "@/lib/billing/pricing";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        subscription: {
          status: "active",
          planTier: "gold",
          billingCycle: "monthly",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 25 * 86400000).toISOString(),
          pausedUntil: null,
          cancelAtPeriodEnd: false,
          scheduledPlanTier: null,
          scheduledBillingCycle: null,
          paymentGateway: "stripe",
          firstPaidAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          canRefundCdc: true,
          activeStaffCount: 2,
          invoices: [
            {
              id: "inv_mock_1",
              gateway: "stripe",
              planTier: "gold",
              billingCycle: "monthly",
              amountCents: 14900,
              status: "paid",
              paidAt: new Date(Date.now() - 3 * 86400000).toISOString(),
              hostedInvoiceUrl: null,
            },
          ],
        },
      });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !profile.organization_id) {
      return NextResponse.json(
        { ok: false, error: "Perfil ou organização não encontrados." },
        { status: 404 }
      );
    }

    // select("*") evita falha total (42703) caso colunas opcionais (ex.: paused_until) ainda não tenham sido migradas
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .single();

    if (orgError) {
      console.warn("[Get Subscription API] Erro ao consultar organização:", orgError.message);
    }

    if (!org) {
      return NextResponse.json({ ok: false, error: "Organização não encontrada." }, { status: 404 });
    }

    // Conta profissionais ativos
    const { count: staffCount } = await supabaseAdmin
      .from("staff_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .eq("active", true);

    // Consulta histórico de faturas do plano
    const { data: invoices } = await supabaseAdmin
      .from("subscription_invoices")
      .select("id, gateway, external_invoice_id, plan_tier, billing_cycle, amount_cents, status, pix_qr_code, pix_qr_code_base64, pix_ticket_url, hosted_invoice_url, period_start, period_end, paid_at, refunded_at, created_at")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const canRefundCdc = isEligibleForCdcRefund(org.first_paid_at);

    return NextResponse.json({
      ok: true,
      // Dados cadastrais do estúdio logado (usados para pré-preencher o checkout sem pedir cadastro novamente)
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        whatsapp_number: org.whatsapp_number || null,
        phone: org.phone || null,
        cpf_cnpj: org.cpf_cnpj || null,
      },
      user: {
        id: user.id,
        email: user.email || "",
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || "",
      },
      subscription: {
        organizationId: org.id,
        hasStripeSubscription: Boolean(org.stripe_subscription_id),
        name: org.name,
        slug: org.slug,
        status: org.subscription_status || "trialing",
        planTier: org.plan_tier || "gold",
        billingCycle: org.billing_cycle || "monthly",
        currentPeriodStart: org.current_period_start,
        currentPeriodEnd: org.current_period_end,
        pausedUntil: org.paused_until || null,
        cancelAtPeriodEnd: Boolean(org.cancel_at_period_end),
        scheduledPlanTier: org.scheduled_plan_tier || null,
        scheduledBillingCycle: org.scheduled_billing_cycle || null,
        gracePeriodEndsAt: org.grace_period_ends_at || null,
        paymentGateway: org.payment_gateway || "stripe",
        firstPaidAt: org.first_paid_at || null,
        trialEndsAt: org.trial_ends_at || null,
        canRefundCdc,
        activeStaffCount: staffCount ?? 1,
        invoices: invoices || [],
      },
    });
  } catch (err: any) {
    console.error("[Get Subscription API Exception]:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro ao consultar assinatura." },
      { status: 500 }
    );
  }
}
