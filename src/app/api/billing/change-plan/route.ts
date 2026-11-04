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
        "id, plan_tier, billing_cycle, subscription_status, current_period_start, current_period_end, scheduled_plan_tier, scheduled_billing_cycle, payment_gateway, stripe_subscription_id"
      )
      .eq("id", profile.organization_id)
      .single();

    if (!org) {
      return NextResponse.json({ ok: false, error: "Organização não encontrada." }, { status: 404 });
    }

    // Caso 1: Cancelar agendamento de downgrade existente
    if (targetPlanTier === null) {
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

      // Aplica upgrade imediato na organização
      await supabaseAdmin
        .from("organizations")
        .update({
          plan_tier: targetPlanTier,
          billing_cycle: targetBillingCycle,
          scheduled_plan_tier: null,
          scheduled_billing_cycle: null,
          subscription_status: "active",
          updated_at: now.toISOString(),
        })
        .eq("id", org.id);

      // Registra fatura da diferença proporcional se houver valor líquido
      if (proration.netProrationCents > 0) {
        await supabaseAdmin.from("subscription_invoices").insert({
          organization_id: org.id,
          gateway: org.payment_gateway || "stripe",
          external_invoice_id: `inv_upg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          plan_tier: targetPlanTier,
          billing_cycle: targetBillingCycle,
          amount_cents: proration.netProrationCents,
          proration_credit_cents: proration.unusedCurrentPlanCents,
          status: "paid",
          paid_at: now.toISOString(),
          period_start: now.toISOString(),
          period_end: periodEnd.toISOString(),
        });
      }

      return NextResponse.json({
        ok: true,
        action: "upgrade_applied",
        newPlanTier: targetPlanTier,
        newBillingCycle: targetBillingCycle,
        proration,
        message: `Parabéns! Seu estúdio foi atualizado para o Plano ${targetPlanTier.toUpperCase()}. Seus novos recursos já estão liberados.`,
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
