import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { reactivateStripeSubscription } from "@/lib/billing/stripe";

export async function POST() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        mock: true,
        message: "Renovação automática reativada com sucesso em modo demonstração.",
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
        { ok: false, error: "Apenas administradores ou proprietários podem reativar a renovação." },
        { status: 403 }
      );
    }

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id, stripe_subscription_id")
      .eq("id", profile.organization_id)
      .single();

    if (!org) {
      return NextResponse.json({ ok: false, error: "Organização não encontrada." }, { status: 404 });
    }

    // Se tiver assinatura na Stripe, reativa no gateway
    if (org.stripe_subscription_id) {
      try {
        await reactivateStripeSubscription(org.stripe_subscription_id);
      } catch (stripeErr) {
        console.warn("[Reactivate Stripe Error]:", stripeErr);
      }
    }

    // Atualiza organização no Supabase
    await supabaseAdmin
      .from("organizations")
      .update({
        cancel_at_period_end: false,
        canceled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", org.id);

    return NextResponse.json({
      ok: true,
      message: "Renovação automática reativada com sucesso! Seu plano continuará sendo renovado normalmente.",
    });
  } catch (err: any) {
    console.error("[Reactivate Subscription API Exception]:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro ao reativar renovação automática." },
      { status: 500 }
    );
  }
}
