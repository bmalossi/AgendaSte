import {
  isMercadoPagoConfigured,
  verifyMercadoPagoWebhookSignature,
} from "@/lib/mercadopago";

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

    // Se a chave secreta oficial do webhook estiver configurada e o header x-signature vier presente, valida o HMAC
    if (webhookSecret && xSignature) {
      const valid = verifyMercadoPagoWebhookSignature({
        xSignature,
        xRequestId,
        dataId,
        secret: webhookSecret,
      });

      if (!valid) {
        return Response.json(
          {
            ok: false,
            error: "Assinatura x-signature inválida para o Webhook do Mercado Pago.",
          },
          { status: 401 }
        );
      }
    }

    let remoteStatus = "received";
    let externalReference: string | null = null;

    if (isMercadoPagoConfigured()) {
      const accessToken = (process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();
      const endpoint =
        topic === "payment"
          ? `https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`
          : `https://api.mercadopago.com/v1/orders/${encodeURIComponent(dataId)}`;

      try {
        const res = await fetch(endpoint, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (res.ok) {
          const detail = (await res.json()) as {
            status?: string;
            external_reference?: string;
          };
          remoteStatus = detail.status || "processed";
          externalReference = detail.external_reference || null;
        }
      } catch {
        // Mantém confirmação 200 OK para evitar retentativas desnecessárias em ambiente local
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
  } catch {
    return Response.json(
      {
        ok: false,
        error: "Erro ao processar notificação de Webhook do Mercado Pago.",
      },
      { status: 500 }
    );
  }
}
