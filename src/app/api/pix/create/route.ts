interface CreatePixPayload {
  appointmentId: string;
  clientName: string;
  serviceName?: string;
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

    const percent = body.depositPercent ?? 30;
    const depositCents =
      body.depositCents ?? Math.round((effectiveTotalCents * percent) / 100);
    const amountBRL = (depositCents / 100).toFixed(2);
    const txId = `AURA${body.appointmentId
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()}99A`;

    const brCode = `00020126580014BR.GOV.BCB.PIX0136pix@aurastudio.com.br520400005303986540${amountBRL.length}${amountBRL}5802BR5920AURA STUDIO GLOSS6009SAO PAULO62190515${txId}6304D1F8`;

    return Response.json({
      ok: true,
      provider: process.env.PIX_PROVIDER || "mercadopago",
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
  } catch {
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
