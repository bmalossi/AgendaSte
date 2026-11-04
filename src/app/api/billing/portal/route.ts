import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createStripeBillingPortalSession } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin") || "https://app.luvea.app";
    const returnUrl = `${origin}/app?tab=subscription`;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        url: `${returnUrl}&stripe_portal_demo=true`,
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
        { ok: false, error: "Apenas administradores ou proprietários podem acessar o portal de faturamento." },
        { status: 403 }
      );
    }

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id, stripe_customer_id, payment_gateway")
      .eq("id", profile.organization_id)
      .single();

    if (!org) {
      return NextResponse.json({ ok: false, error: "Organização não encontrada." }, { status: 404 });
    }

    if (!org.stripe_customer_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nenhum cliente Stripe associado a esta organização. Se contratou via Pix, gerencie pelo painel Luvea.",
        },
        { status: 400 }
      );
    }

    const { url } = await createStripeBillingPortalSession({
      customerId: org.stripe_customer_id,
      returnUrl,
    });

    return NextResponse.json({
      ok: true,
      url,
    });
  } catch (err: any) {
    console.error("[Billing Portal API Exception]:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro ao gerar link do Stripe Customer Portal." },
      { status: 500 }
    );
  }
}
