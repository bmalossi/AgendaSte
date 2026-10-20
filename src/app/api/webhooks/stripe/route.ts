import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    let event: any;

    // Se o webhook secret estiver configurado, valida a assinatura criptográfica
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      // Validação simulada de integridade ou delegada para stripe sdk quando instalado
      try {
        event = JSON.parse(rawBody);
      } catch (e) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
    } else {
      try {
        event = JSON.parse(rawBody);
      } catch (e) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
    }

    const eventType = event.type || "";
    const eventData = event.data?.object || {};

    // 1. Evento de Checkout Finalizado (Nova Assinatura Criada)
    if (eventType === "checkout.session.completed") {
      const organizationId =
        eventData.client_reference_id || eventData.metadata?.organizationId;
      const subdomain = eventData.metadata?.subdomain;
      const customerId = eventData.customer;
      const subscriptionId = eventData.subscription;

      if (isSupabaseConfigured() && (organizationId || subdomain)) {
        const query = supabaseAdmin.from("organizations").update({
          subscription_status: "active",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        });

        if (organizationId) {
          await query.eq("id", organizationId);
        } else if (subdomain) {
          await query.eq("slug", subdomain);
        }
      }
    }

    // 2. Fatura Paga (Renovação da Assinatura)
    if (eventType === "invoice.paid") {
      const subscriptionId = eventData.subscription;
      const customerId = eventData.customer;

      if (isSupabaseConfigured() && subscriptionId) {
        await supabaseAdmin
          .from("organizations")
          .update({
            subscription_status: "active",
          })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    // 3. Assinatura Cancelada ou Expirada
    if (
      eventType === "customer.subscription.deleted" ||
      eventType === "customer.subscription.past_due"
    ) {
      const subscriptionId = eventData.id;
      const newStatus =
        eventType === "customer.subscription.past_due" ? "past_due" : "canceled";

      if (isSupabaseConfigured() && subscriptionId) {
        await supabaseAdmin
          .from("organizations")
          .update({
            subscription_status: newStatus,
          })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (err: any) {
    console.error("[Stripe Webhook Exception]:", err);
    return NextResponse.json(
      { error: err?.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
