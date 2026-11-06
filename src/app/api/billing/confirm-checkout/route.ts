import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isStripeConfigured, retrieveStripeCheckoutSession } from "@/lib/billing/stripe";
import { processStripeWebhookEvent } from "@/lib/billing/webhook-processor";

/**
 * Confirmação síncrona do retorno do Stripe Checkout.
 *
 * O webhook `checkout.session.completed` continua sendo a fonte de verdade, mas ele pode
 * atrasar (ou nunca chegar em ambiente local sem túnel). Esta rota consulta a sessão
 * diretamente na Stripe, valida que ela pertence à organização do usuário autenticado e
 * aplica a mesma transição de estado do webhook (idempotente).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = String((body as { sessionId?: string }).sessionId || "").trim();

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "Sessão de checkout não informada." }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, mock: true, status: "active" });
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
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { ok: false, error: "Organização do usuário não encontrada." },
        { status: 404 }
      );
    }

    const organizationId: string = profile.organization_id;

    // Modo mock (Stripe não configurada): apenas fora de produção
    const isMockSession = sessionId.startsWith("cs_mock_");
    if (isMockSession) {
      if (isStripeConfigured() || process.env.NODE_ENV === "production") {
        return NextResponse.json({ ok: false, error: "Sessão de checkout inválida." }, { status: 400 });
      }
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("plan_tier, billing_cycle")
        .eq("id", organizationId)
        .maybeSingle();

      const result = await processStripeWebhookEvent({
        type: "checkout.session.completed",
        data: {
          object: {
            client_reference_id: organizationId,
            metadata: {
              organizationId,
              planTier: org?.plan_tier || undefined,
              billingCycle: org?.billing_cycle || undefined,
            },
          },
        },
      });
      return NextResponse.json({ ok: true, mock: true, status: result.status || "active" });
    }

    const session = await retrieveStripeCheckoutSession(sessionId);
    if (!session.found) {
      return NextResponse.json(
        { ok: false, error: session.error || "Sessão de checkout não encontrada." },
        { status: 404 }
      );
    }

    // A sessão precisa pertencer à organização do usuário autenticado
    const sessionOrgId = session.clientReferenceId || session.metadata?.organizationId;
    if (sessionOrgId !== organizationId) {
      return NextResponse.json(
        { ok: false, error: "Esta sessão de checkout não pertence à sua conta." },
        { status: 403 }
      );
    }

    if (session.status !== "complete") {
      return NextResponse.json({
        ok: true,
        confirmed: false,
        status: session.status,
        message: "Pagamento ainda não concluído.",
      });
    }

    const result = await processStripeWebhookEvent({
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: organizationId,
          metadata: session.metadata || {},
          customer: session.customerId,
          subscription: session.subscriptionId,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      confirmed: true,
      status: result.status || "active",
      planTier: session.metadata?.planTier || null,
      billingCycle: session.metadata?.billingCycle || null,
    });
  } catch (err: any) {
    console.error("[Confirm Checkout API Exception]:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro ao confirmar checkout." },
      { status: 500 }
    );
  }
}
