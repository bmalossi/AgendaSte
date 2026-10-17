import { NextResponse } from "next/server";

interface CreatePixPayload {
  appointmentId: string;
  clientName: string;
  serviceName: string;
  totalCents: number;
  depositPercent?: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePixPayload;

    if (!body.appointmentId || !body.clientName || !body.totalCents) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Dados incompletos para gerar Pix dinâmico: informe appointmentId, clientName e totalCents.",
        },
        { status: 400 }
      );
    }

    const percent = body.depositPercent ?? 30;
    const depositCents = Math.round((body.totalCents * percent) / 100);
    const amountBRL = (depositCents / 100).toFixed(2);
    const txId = `VELOCE${body.appointmentId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}99A`;

    const brCode = `00020126580014BR.GOV.BCB.PIX0136camilaborges-pix-sinal@veloce.app520400005303986540${amountBRL.length}${amountBRL}5802BR5925ATELIER DRA CAMILA BORGES6009SAO PAULO62190515${txId}6304D1F8`;

    return NextResponse.json({
      ok: true,
      provider: process.env.PIX_PROVIDER || "mercadopago",
      txId,
      appointmentId: body.appointmentId,
      depositPercent: percent,
      depositCents,
      expiresInMinutes: 30,
      pixCopiaECola: brCode,
      status: "pending_payment",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Falha ao gerar cobrança Pix de reserva. Confira os parâmetros enviados.",
      },
      { status: 500 }
    );
  }
}
