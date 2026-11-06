import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  PlanTier,
  BillingCycle,
  isPlanUpgrade,
  calculateProrationDifference,
  validateDowngradeStaffLimit,
  resolvePlanPriceCents,
} from "@/lib/billing/pricing";
import {
  updateStripeSubscriptionPrice,
  scheduleStripeSubscriptionDowngrade,
  previewStripeSubscriptionUpgrade,
} from "@/lib/billing/stripe";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetPlanTier = searchParams.get("targetPlanTier") as PlanTier;
    const targetBillingCycle = (searchParams.get("targetBillingCycle") || "monthly") as BillingCycle;

    if (!targetPlanTier) {
      return NextResponse.json({ ok: false, error: "Plano de destino não informado." }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        preview: {
          amountDueCents: 0,
          subtotalCents: 0,
          prorationCreditCents: 0,
          isTrial: true,
          netProrationCents: 0,
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

    if (!profile?.organization_id) {
      return NextResponse.json({ ok: false, error: "Organização não encontrada." }, { status: 404 });
    }

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select(
        "id, plan_tier, billing_cycle, subscription_status, current_period_start, current_period_end, stripe_subscription_id, payment_gateway, trial_ends_at, first_paid_at"
      )
      .eq("id", profile.organization_id)
      .single();

    if (!org) {
      return NextResponse.json({ ok: false, error: "Organização não encontrada." }, { status: 404 });
    }

    const currentTier = (org.plan_tier || "gold") as PlanTier;
    const currentCycle = (org.billing_cycle || "monthly") as BillingCycle;

    // Se possui assinatura na Stripe, consulta prévia oficial na API Stripe
    if (org.stripe_subscription_id) {
      const stripePreview = await previewStripeSubscriptionUpgrade({
        subscriptionId: org.stripe_subscription_id,
        targetPlanTier,
        targetBillingCycle,
      });

      if (stripePreview.success) {
        return NextResponse.json({
          ok: true,
          preview: {
            amountDueCents: stripePreview.amountDueCents ?? 0,
            subtotalCents: stripePreview.subtotalCents ?? 0,
            prorationCostCents: stripePreview.prorationCostCents ?? stripePreview.subtotalCents ?? 0,
            prorationCreditCents: stripePreview.prorationCreditCents ?? 0,
            isTrial: Boolean(stripePreview.isTrial),
            trialEnd: stripePreview.trialEnd || null,
            currentPeriodEnd: org.current_period_end,
          },
        });
      }
    }

    // Fallback: cálculo matemático local de prorrata
    const now = new Date();
    const periodStart = org.current_period_start ? new Date(org.current_period_start) : now;
    const periodEnd = org.current_period_end
      ? new Date(org.current_period_end)
      : new Date(now.getTime() + 30 * 86400000);

    const proration = calculateProrationDifference({
      currentPlanTier: currentTier,
      currentBillingCycle: currentCycle,
      targetPlanTier,
      targetBillingCycle,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      now,
    });

    const isTrial =
      org.subscription_status === "trialing" &&
      Boolean(
        org.trial_ends_at &&
          new Date(org.trial_ends_at).getTime() > now.getTime() &&
          !org.first_paid_at
      );

    return NextResponse.json({
      ok: true,
      preview: {
        amountDueCents: isTrial ? 0 : proration.netProrationCents,
        subtotalCents: proration.costTargetPlanRemainingCents,
        prorationCostCents: isTrial ? 0 : proration.costTargetPlanRemainingCents,
        prorationCreditCents: isTrial ? 0 : proration.unusedCurrentPlanCents,
        isTrial,
        currentPeriodEnd: org.current_period_end,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Erro ao consultar prévia." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { targetPlanTier, targetBillingCycle = "monthly" } = body as {
      targetPlanTier: PlanTier | null;
      targetBillingCycle?: BillingCycle;
    };

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        mock: true,
        message: targetPlanTier
          ? `Plano alterado para ${targetPlanTier} (${targetBillingCycle}) em modo demonstração.`
          : "Agendamento de downgrade cancelado com sucesso.",
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

    if (!profile || !profile.organization_id || !["owner", "admin"].includes(profile.role)) {
      return NextResponse.json(
        { ok: false, error: "Apenas administradores ou proprietários podem alterar o plano." },
        { status: 403 }
      );
    }

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select(
        "id, plan_tier, billing_cycle, subscription_status, current_period_start, current_period_end, scheduled_plan_tier, scheduled_billing_cycle, payment_gateway, stripe_subscription_id, trial_ends_at, first_paid_at"
      )
      .eq("id", profile.organization_id)
      .single();

    if (!org) {
      return NextResponse.json({ ok: false, error: "Organização não encontrada." }, { status: 404 });
    }

    // Caso 1: Cancelar agendamento de downgrade existente
    if (targetPlanTier === null) {
      if (org.stripe_subscription_id) {
        try {
          await scheduleStripeSubscriptionDowngrade({
            subscriptionId: org.stripe_subscription_id,
            targetPlanTier: null,
          });
        } catch (gateErr) {
          console.warn("[Cancel Downgrade Stripe Error]:", gateErr);
        }
      }

      await supabaseAdmin
        .from("organizations")
        .update({
          scheduled_plan_tier: null,
          scheduled_billing_cycle: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", org.id);

      return NextResponse.json({
        ok: true,
        action: "downgrade_scheduled_canceled",
        message: "O agendamento de downgrade foi cancelado. Seu plano atual permanecerá ativo.",
      });
    }

    const currentTier = (org.plan_tier || "gold") as PlanTier;
    const currentCycle = (org.billing_cycle || "monthly") as BillingCycle;

    // Caso 2: Upgrade Imediato com Prorrata
    const isUpgrade = isPlanUpgrade(
      currentTier,
      currentCycle,
      targetPlanTier,
      targetBillingCycle
    );

    if (isUpgrade) {
      const now = new Date();
      const periodStart = org.current_period_start ? new Date(org.current_period_start) : now;
      const periodEnd = org.current_period_end
        ? new Date(org.current_period_end)
        : new Date(now.getTime() + 30 * 86400000);

      const proration = calculateProrationDifference({
        currentPlanTier: currentTier,
        currentBillingCycle: currentCycle,
        targetPlanTier,
        targetBillingCycle,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        now,
      });

      let externalInvoiceId = `inv_upg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      let stripeAmountPaidCents: number | undefined;
      let stripeHostedInvoiceUrl: string | null = null;
      const isTrial =
        org.subscription_status === "trialing" &&
        Boolean(
          org.trial_ends_at &&
            new Date(org.trial_ends_at).getTime() > now.getTime() &&
            !org.first_paid_at
        );

      // 1. Sincroniza preço na Stripe e cobra diferença (ou atualiza o plano do teste gratuito)
      if (org.stripe_subscription_id) {
        const stripeUpdate = await updateStripeSubscriptionPrice({
          subscriptionId: org.stripe_subscription_id,
          targetPlanTier,
          targetBillingCycle,
          prorationBehavior: isTrial ? "none" : "always_invoice",
        });

        if (!stripeUpdate.success) {
          return NextResponse.json(
            {
              ok: false,
              error: stripeUpdate.error || "Não foi possível processar a cobrança do upgrade na operadora do cartão.",
            },
            { status: 400 }
          );
        }

        if (stripeUpdate.invoiceId) {
          externalInvoiceId = stripeUpdate.invoiceId;
        }
        if (typeof stripeUpdate.amountPaidCents === "number") {
          stripeAmountPaidCents = stripeUpdate.amountPaidCents;
        }
        if (stripeUpdate.hostedInvoiceUrl) {
          stripeHostedInvoiceUrl = stripeUpdate.hostedInvoiceUrl;
        }
      } else if (isSupabaseConfigured() && (!org.payment_gateway || org.payment_gateway === "stripe")) {
        // Estúdio ainda sem assinatura ativa na Stripe (ex: trial sem cartão cadastrado)
        return NextResponse.json(
          {
            ok: false,
            code: "REQUIRES_CHECKOUT",
            error: "Para ativar o novo plano, é necessário cadastrar o método de pagamento no checkout.",
          },
          { status: 400 }
        );
      }

      // 2. Aplica upgrade imediato na organização
      const nextStatus = isTrial ? "trialing" : "active";
      await supabaseAdmin
        .from("organizations")
        .update({
          plan_tier: targetPlanTier,
          billing_cycle: targetBillingCycle,
          scheduled_plan_tier: null,
          scheduled_billing_cycle: null,
          subscription_status: nextStatus,
          updated_at: now.toISOString(),
        })
        .eq("id", org.id);

      // 3. Registra fatura da diferença proporcional se houver cobrança e não estiver em degustação
      const effectiveChargedCents = stripeAmountPaidCents ?? proration.netProrationCents;
      if (!isTrial && effectiveChargedCents > 0) {
        await supabaseAdmin.from("subscription_invoices").upsert(
          {
            organization_id: org.id,
            gateway: org.payment_gateway || "stripe",
            external_invoice_id: externalInvoiceId,
            plan_tier: targetPlanTier,
            billing_cycle: targetBillingCycle,
            amount_cents: effectiveChargedCents,
            proration_credit_cents: proration.unusedCurrentPlanCents,
            status: "paid",
            paid_at: now.toISOString(),
            period_start: now.toISOString(),
            period_end: periodEnd.toISOString(),
            ...(stripeHostedInvoiceUrl ? { hosted_invoice_url: stripeHostedInvoiceUrl } : {}),
          },
          { onConflict: "external_invoice_id" }
        );
      }

      return NextResponse.json({
        ok: true,
        action: "upgrade_applied",
        newPlanTier: targetPlanTier,
        newBillingCycle: targetBillingCycle,
        proration: isTrial
          ? { ...proration, netProrationCents: 0 }
          : { ...proration, netProrationCents: effectiveChargedCents },
        isTrial,
        message: isTrial
          ? `Parabéns! Seu estúdio foi atualizado para o Plano ${targetPlanTier.toUpperCase()}. Seus novos recursos já estão liberados sem custos adicionais durante o teste gratuito.`
          : `Parabéns! Seu estúdio foi atualizado para o Plano ${targetPlanTier.toUpperCase()}. Seus novos recursos já estão liberados.`,
      });
    }

    // Caso 3: Downgrade Agendado para o fim do ciclo (com trava de maxStaff)
    const { count: staffCount } = await supabaseAdmin
      .from("staff_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .eq("active", true);

    const activeCount = staffCount ?? 1;
    const staffCheck = validateDowngradeStaffLimit({
      activeStaffCount: activeCount,
      targetPlanTier,
    });

    if (!staffCheck.valid) {
      return NextResponse.json(
        {
          ok: false,
          error: staffCheck.error,
          maxAllowed: staffCheck.maxAllowed,
          currentCount: staffCheck.currentCount,
        },
        { status: 400 }
      );
    }

    // Sincroniza metadados na Stripe para o agendamento de downgrade
    if (org.stripe_subscription_id) {
      try {
        await scheduleStripeSubscriptionDowngrade({
          subscriptionId: org.stripe_subscription_id,
          targetPlanTier,
          targetBillingCycle,
        });
      } catch (gateErr) {
        console.warn("[Downgrade Stripe Schedule Error]:", gateErr);
      }
    }

    // Agenda o downgrade para o término do ciclo vigente
    await supabaseAdmin
      .from("organizations")
      .update({
        scheduled_plan_tier: targetPlanTier,
        scheduled_billing_cycle: targetBillingCycle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", org.id);

    return NextResponse.json({
      ok: true,
      action: "downgrade_scheduled",
      scheduledPlanTier: targetPlanTier,
      scheduledBillingCycle: targetBillingCycle,
      effectiveAt: org.current_period_end,
      message: `Downgrade agendado com sucesso para o final do ciclo atual (${new Date(org.current_period_end || Date.now()).toLocaleDateString("pt-BR")}). Seu plano atual permanecerá ativo até lá.`,
    });
  } catch (err: any) {
    console.error("[Change Plan API Exception]:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro ao processar alteração de plano." },
      { status: 500 }
    );
  }
}
