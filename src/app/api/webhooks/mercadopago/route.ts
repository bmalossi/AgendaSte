import {
  isMercadoPagoConfigured,
  isValidMercadoPagoToken,
  verifyMercadoPagoWebhookSignature,
} from "@/lib/mercadopago";
import { recordWebhookEventIfNotProcessed } from "@/lib/billing/webhook-events";
import { processMercadoPagoPlanInvoicePayment } from "@/lib/billing/webhook-processor";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";

interface MercadoPagoWebhookBody {
  id?: string | number;
  type?: string;
  topic?: string;
  action?: string;
  data?: {
    id?: string | number;
  };
}

export async function GET() {
  return Response.json({
    ok: true,
    service: "mercadopago-webhook",
    configured: isMercadoPagoConfigured(),
  });
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const body = (await request.json().catch(() => ({}))) as MercadoPagoWebhookBody;

    const dataId = String(
      url.searchParams.get("data.id") ||
        body?.data?.id ||
        url.searchParams.get("id") ||
        body?.id ||
        ""
    ).trim();

    const topic = String(
      body?.type ||
        body?.topic ||
        url.searchParams.get("type") ||
        url.searchParams.get("topic") ||
        "order"
    ).toLowerCase();

    if (!dataId) {
      return Response.json(
        {
          ok: false,
          error: "Webhook sem identificador de recurso (data.id ausente).",
        },
        { status: 400 }
      );
    }

    const webhookSecret = (
      process.env.MERCADOPAGO_WEBHOOK_SECRET || ""
    ).trim();
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    // Validação criptográfica com Anti-Replay (tolerância máxima de 300 segundos)
    if (webhookSecret) {
      const valid = verifyMercadoPagoWebhookSignature({
        xSignature,
        xRequestId,
        dataId,
        secret: webhookSecret,
        toleranceSeconds: 300,
      });

      if (!valid) {
        return Response.json(
          {
            ok: false,
            error: "Assinatura x-signature inválida ou expirada (>300s) para o Webhook do Mercado Pago.",
          },
          { status: 401 }
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      return Response.json(
        {
          ok: false,
          error: "MERCADOPAGO_WEBHOOK_SECRET ausente em produção.",
        },
        { status: 401 }
      );
    }

    // Trava de Idempotência (Acceptance Criterion 1)
    const { isDuplicate } = await recordWebhookEventIfNotProcessed({
      gateway: "mercadopago",
      eventId: dataId,
      eventType: topic,
      payload: body,
    });

    if (isDuplicate) {
      return Response.json({
        ok: true,
        duplicate: true,
        resourceId: dataId,
        message: "Evento já processado anteriormente (idempotência garantida).",
      });
    }

    let remoteStatus = "received";
    let remoteAmountCents = 0;
    let externalReference: string | null = null;

    // Suporte Multi-Tenant: permite ?subdomain=meu-estudio ou ?orgId=uuid na URL do Webhook do estúdio
    const tenantSubdomain = url.searchParams.get("subdomain")?.trim().toLowerCase();
    const tenantOrgId = url.searchParams.get("orgId")?.trim();
    let tenantAccessToken = "";

    if ((tenantSubdomain || tenantOrgId) && isSupabaseConfigured()) {
      try {
        let orgQuery = supabaseAdmin.from("organizations").select("settings");
        if (tenantOrgId) {
          orgQuery = orgQuery.eq("id", tenantOrgId);
        } else if (tenantSubdomain) {
          orgQuery = orgQuery.eq("slug", tenantSubdomain);
        }
        const { data: org } = await orgQuery.maybeSingle();
        const settings = (org?.settings || {}) as Record<string, any>;
        const candidateToken = (
          settings?.website?.paymentsSetup?.mercadopagoAccessToken ||
          settings?.paymentsSetup?.mercadopagoAccessToken ||
          settings?.business?.mercadopagoAccessToken ||
          ""
        ).trim();
        if (isValidMercadoPagoToken(candidateToken)) {
          tenantAccessToken = candidateToken;
        }
      } catch {
        // Fallback silencioso
      }
    }

    const effectiveAccessToken =
      tenantAccessToken || (process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();

    if (isValidMercadoPagoToken(effectiveAccessToken)) {
      const endpoint =
        topic === "payment"
          ? `https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`
          : `https://api.mercadopago.com/v1/orders/${encodeURIComponent(dataId)}`;

      try {
        const res = await fetch(endpoint, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${effectiveAccessToken}`,
          },
        });
        if (res.ok) {
          const detail = (await res.json()) as {
            status?: string;
            transaction_amount?: number;
            total_amount?: number;
            external_reference?: string;
          };
          remoteStatus = detail.status || "processed";
          const rawAmount = detail.transaction_amount ?? detail.total_amount ?? 0;
          remoteAmountCents = Math.round(Number(rawAmount) * 100);
          externalReference = detail.external_reference || null;
        }
      } catch (fetchErr) {
        console.warn("[Mercado Pago Fetch Details Exception]:", fetchErr);
      }
    }

    // Se for um pagamento aprovado, verifica se pertence a uma Fatura do Plano SaaS
    if (remoteStatus === "approved") {
      const planResult = await processMercadoPagoPlanInvoicePayment({
        paymentId: dataId,
        remoteStatus,
        remoteAmountCents,
        externalReference,
      });

      if (planResult.handled) {
        if (planResult.action === "amount_mismatch") {
          return Response.json(
            {
              ok: false,
              error: planResult.error,
              resourceId: dataId,
            },
            { status: 400 }
          );
        }

        return Response.json({
          ok: true,
          topic,
          resourceId: dataId,
          externalReference,
          planActivation: planResult,
        });
      }

      // Caso não seja fatura do plano SaaS, atualiza o depósito do agendamento de cliente do estúdio (Multi-Tenant B2C)
      if (isSupabaseConfigured() && externalReference) {
        try {
          await supabaseAdmin
            .from("appointments")
            .update({
              deposit_paid: true,
              status: "confirmed",
            })
            .eq("id", externalReference);
        } catch (appErr) {
          console.warn("[Appointment Deposit Status Update Error]:", appErr);
        }
      }
    }

    return Response.json({
      ok: true,
      topic,
      action: body.action || `${topic}.notification`,
      resourceId: dataId,
      externalReference,
      status: remoteStatus,
      receivedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Mercado Pago Webhook Exception]:", err);
    return Response.json(
      {
        ok: false,
        error: err?.message || "Erro ao processar notificação de Webhook do Mercado Pago.",
      },
      { status: 500 }
    );
  }
}
