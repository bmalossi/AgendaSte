import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { pauseStripeSubscription } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { months = 1 } = body as { months?: number };
    const safeMonths = Math.min(3, Math.max(1, Number(months) || 1));

    const now = new Date();
    const resumeAt = new Date(now.getTime() + safeMonths * 30 * 24 * 60 * 60 * 1000);
    const resumeAtTimestamp = Math.floor(resumeAt.getTime() / 1000);
    const resumeAtIso = resumeAt.toISOString();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        mock: true,
        pausedUntil: resumeAtIso,
        message: `Assinatura pausada com sucesso por ${safeMonths} ${safeMonths === 1 ? "mês" : "meses"} em modo demonstração.`,
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
        { ok: false, error: "Apenas administradores ou proprietários podem pausar o plano." },
        { status: 403 }
      );
    }

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id, stripe_subscription_id, payment_gateway")
      .eq("id", profile.organization_id)
      .single();

    if (!org) {
      return NextResponse.json({ ok: false, error: "Organização não encontrada." }, { status: 404 });
    }

    // Se tiver assinatura na Stripe, aciona pause_collection
    if (org.stripe_subscription_id) {
      const stripeRes = await pauseStripeSubscription(org.stripe_subscription_id, resumeAtTimestamp);
      if (!stripeRes.success) {
        console.warn("[Pause Stripe Warning]:", stripeRes.error);
      }
    }

    // Atualiza a organização para 'paused' e armazena a data de retomada
    await supabaseAdmin
      .from("organizations")
      .update({
        subscription_status: "paused",
        paused_until: resumeAtIso,
        updated_at: new Date().toISOString(),
      })
      .eq("id", org.id);

    return NextResponse.json({
      ok: true,
      pausedUntil: resumeAtIso,
      months: safeMonths,
      message: `Assinatura pausada com sucesso até ${resumeAt.toLocaleDateString("pt-BR")}. Seu estúdio está no Modo Hibernação sem cobranças.`,
    });
  } catch (err: any) {
    console.error("[Pause Subscription API Exception]:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro ao pausar assinatura." },
      { status: 500 }
    );
  }
}
