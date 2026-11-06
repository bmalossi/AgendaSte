import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isEligibleForCdcRefund } from "@/lib/billing/pricing";
import { cancelStripeSubscription, refundLatestStripeInvoice } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action = "at_period_end", reason } = body as {
      action: "at_period_end" | "immediate_refund_cdc";
      reason?: string;
    };

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        mock: true,
        action,
        message:
          action === "immediate_refund_cdc"
            ? "Assinatura cancelada com estorno integral imediato (CDC Art. 49) em modo demonstração."
            : "Renovação automática desativada. Acesso garantido até o fim do ciclo em modo demonstração.",
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
        { ok: false, error: "Apenas administradores ou proprietários podem cancelar o plano." },
        { status: 403 }
      );
    }

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select(
        "id, name, subscription_status, current_period_end, first_paid_at, payment_gateway, stripe_subscription_id"
      )
      .eq("id", profile.organization_id)
      .single();

    if (!org) {
      return NextResponse.json({ ok: false, error: "Organização não encontrada." }, { status: 404 });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // 1. Cancelamento Imediato com Reembolso Integral (CDC Art. 49 nos primeiros 7 dias)
    if (action === "immediate_refund_cdc") {
      const eligible = isEligibleForCdcRefund(org.first_paid_at, now);
      if (!eligible) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "O prazo legal de 7 dias corridos para cancelamento com estorno imediato (Art. 49 do CDC) expirou. Você pode cancelar a renovação mantendo o acesso até o fim do ciclo pago.",
          },
          { status: 400 }
        );
      }

      // Estorna e cancela imediatamente no gateway se for Stripe
      let refundId: string | undefined;
      if (org.stripe_subscription_id) {
        try {
          const refundResult = await refundLatestStripeInvoice(org.stripe_subscription_id);
          refundId = refundResult.refundId;
          await cancelStripeSubscription(org.stripe_subscription_id, false);
        } catch (gateErr) {
          console.warn("[Cancel CDC Stripe Error]:", gateErr);
        }
      }

      // Atualiza organização para cancelada imediatamente
      await supabaseAdmin
        .from("organizations")
        .update({
          subscription_status: "canceled",
          canceled_at: nowIso,
          cancel_at_period_end: false,
          cancel_reason: reason || null,
          updated_at: nowIso,
        })
        .eq("id", org.id);

      // Atualiza a fatura mais recente para estornada (refunded)
      const { data: latestInvoice } = await supabaseAdmin
        .from("subscription_invoices")
        .select("id")
        .eq("organization_id", org.id)
        .eq("status", "paid")
        .order("paid_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestInvoice) {
        await supabaseAdmin
          .from("subscription_invoices")
          .update({
            status: "refunded",
            refunded_at: nowIso,
            updated_at: nowIso,
          })
          .eq("id", latestInvoice.id);
      }

      return NextResponse.json({
        ok: true,
        action: "immediate_refund_cdc_processed",
        refundId: refundId || null,
        message:
          "Sua assinatura foi cancelada e o reembolso integral de 100% foi solicitado ao gateway financeiro (Garantia legal Art. 49 do CDC).",
      });
    }

    // 2. Cancelamento da Renovação Automática ao fim do ciclo (cancel_at_period_end = true)
    if (org.stripe_subscription_id) {
      try {
        await cancelStripeSubscription(org.stripe_subscription_id, true);
      } catch (gateErr) {
        console.warn("[Cancel at Period End Stripe Error]:", gateErr);
      }
    }

    await supabaseAdmin
      .from("organizations")
      .update({
        cancel_at_period_end: true,
        canceled_at: nowIso,
        cancel_reason: reason || null,
        updated_at: nowIso,
      })
      .eq("id", org.id);

    return NextResponse.json({
      ok: true,
      action: "canceled_at_period_end",
      effectiveAt: org.current_period_end,
      message: `A renovação automática foi cancelada. Seu plano e todos os recursos permanecerão ativos até o final do período vigente (${new Date(org.current_period_end || now).toLocaleDateString("pt-BR")}).`,
    });
  } catch (err: any) {
    console.error("[Cancel Subscription API Exception]:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro ao processar cancelamento de assinatura." },
      { status: 500 }
    );
  }
}
