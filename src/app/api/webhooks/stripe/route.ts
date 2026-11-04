import { NextResponse } from "next/server";
import { verifyStripeWebhookSignature } from "@/lib/billing/stripe";
import { recordWebhookEventIfNotProcessed } from "@/lib/billing/webhook-events";
import { processStripeWebhookEvent } from "@/lib/billing/webhook-processor";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    let event: any;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret) {
      const verification = verifyStripeWebhookSignature({
        payload: rawBody,
        signatureHeader: signature,
        secret: webhookSecret,
        toleranceSeconds: 300,
      });

      if (!verification.valid) {
        return NextResponse.json(
          { error: verification.error || "Assinatura do webhook Stripe inválida." },
          { status: 401 }
        );
      }
      event = verification.event;
    } else {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "STRIPE_WEBHOOK_SECRET ausente em produção." },
          { status: 401 }
        );
      }
      try {
        event = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: "Payload JSON inválido." }, { status: 400 });
      }
    }

    const eventId = String(event?.id || `evt_${Date.now()}`);
    const eventType = String(event?.type || "unknown");

    // Trava de Idempotência (Acceptance Criterion 1)
    const { isDuplicate } = await recordWebhookEventIfNotProcessed({
      gateway: "stripe",
      eventId,
      eventType,
      payload: event,
    });

    if (isDuplicate) {
      return NextResponse.json(
        { received: true, duplicate: true, event: eventType },
        { status: 200 }
      );
    }

    // Processa transições de domínio e reconciliação anti-duplicidade
    const result = await processStripeWebhookEvent(event);

    return NextResponse.json({
      received: true,
      duplicate: false,
      event: eventType,
      result,
    });
  } catch (err: any) {
    console.error("[Stripe Webhook Route Exception]:", err);
    return NextResponse.json(
      { error: err?.message || "Erro no processamento do webhook Stripe." },
      { status: 500 }
    );
  }
}
