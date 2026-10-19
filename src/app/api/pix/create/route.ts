import {
  isMercadoPagoConfigured,
  createMercadoPagoPixOrder,
} from "../../../../lib/mercadopago.ts";

interface CreatePixPayload {
  appointmentId: string;
  clientName: string;
  clientEmail?: string;
  serviceId?: string;
  serviceName?: string;
  serviceDescription?: string;
  totalCents?: number;
  depositCents?: number;
  depositPercent?: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePixPayload;

    const effectiveTotalCents = body.totalCents ?? body.depositCents ?? 0;
    if (!body.appointmentId || !body.clientName || effectiveTotalCents <= 0) {
      return Response.json(
        {
          ok: false,
          error:
            "Dados incompletos para gerar Pix dinâmico: informe appointmentId, clientName e totalCents (ou depositCents).",
        },
        { status: 400 }
      );
    }

    // Se depositCents for fornecido expressamente, respeitamos o valor exato.
    // Se depositPercent for fornecido, calculamos proporcionalmente a partir de effectiveTotalCents.
    // Se nenhum for fornecido, o padrão é 100% (pagamento integral).
    const depositCents =
      body.depositCents !== undefined
        ? body.depositCents
        : body.depositPercent !== undefined
        ? Math.round((effectiveTotalCents * body.depositPercent) / 100)
        : effectiveTotalCents;

    const percent =
      body.depositPercent !== undefined
        ? body.depositPercent
        : effectiveTotalCents > 0
        ? Math.round((depositCents / effectiveTotalCents) * 100)
        : 100;

    const amountBRL = (depositCents / 100).toFixed(2);
    const txId = `AURA${body.appointmentId
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()}99A`;

    let fallbackReason: string | undefined;

    // Tenta criar a Order Pix real na API v1/orders do Mercado Pago quando configurado
    if (isMercadoPagoConfigured()) {
      try {
        const mpOrder = await createMercadoPagoPixOrder({
          appointmentId: body.appointmentId,
          clientName: body.clientName,
          clientEmail: body.clientEmail,
          serviceId: body.serviceId,
          serviceName: body.serviceName,
          serviceDescription: body.serviceDescription,
          amountCents: depositCents,
        });

        return Response.json({
          ok: true,
          provider: "mercadopago",
          mode: "mercadopago_orders_api",
          orderId: mpOrder.orderId,
          paymentId: mpOrder.paymentId,
          txId: mpOrder.orderId,
          appointmentId: body.appointmentId,
          depositPercent: percent,
          depositCents,
          totalCents: effectiveTotalCents,
          expiresInMinutes: 30,
          pixCopiaECola: mpOrder.qrCode,
          qrCodePayload: mpOrder.qrCode,
          qrCodeBase64: mpOrder.qrCodeBase64,
          ticketUrl: mpOrder.ticketUrl,
          status: mpOrder.status,
          statusDetail: mpOrder.statusDetail,
        });
      } catch (mpError) {
        fallbackReason =
          mpError instanceof Error ? mpError.message : String(mpError);
        console.warn(
          "[Mercado Pago Orders API] Fallback local acionado:",
          fallbackReason
        );
      }
    }

    const brCode = `00020126580014BR.GOV.BCB.PIX0136pix@aurastudio.com.br520400005303986540${amountBRL.length}${amountBRL}5802BR5920AURA STUDIO GLOSS6009SAO PAULO62190515${txId}6304D1F8`;

    return Response.json({
      ok: true,
      provider: process.env.PIX_PROVIDER || "mercadopago",
      mode: "sandbox_fallback",
      fallbackReason,
      txId,
      appointmentId: body.appointmentId,
      depositPercent: percent,
      depositCents,
      totalCents: effectiveTotalCents,
      expiresInMinutes: 30,
      pixCopiaECola: brCode,
      qrCodePayload: brCode,
      status: "pending_payment",
    });
  } catch (err) {
    console.error("Error in POST /api/pix/create:", err);
    return Response.json(
      {
        ok: false,
        error:
          "Falha ao gerar cobrança Pix de reserva. Confira os parâmetros enviados.",
      },
      { status: 500 }
    );
  }
}
