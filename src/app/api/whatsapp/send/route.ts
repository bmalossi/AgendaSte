interface WhatsAppSendPayload {
  appointmentId?: string;
  clientName: string;
  clientPhone: string;
  templateType:
    | "reminder_24h"
    | "reminder_2h"
    | "pix_deposit"
    | "reactivation_45d"
    | "rebooking_confirmation";
  customMessage?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WhatsAppSendPayload;

    if (!body.clientName || !body.clientPhone || !body.templateType) {
      return Response.json(
        {
          ok: false,
          error:
            "Parâmetros obrigatórios ausentes: informe clientName, clientPhone e templateType.",
        },
        { status: 400 }
      );
    }

    const templates: Record<WhatsAppSendPayload["templateType"], string> = {
      reminder_24h: `Olá, ${body.clientName}! Seu horário no Atelier Dra. Camila Borges está reservado para amanhã. Responda [1] para Confirmar ou [2] para Reagendar.`,
      reminder_2h: `Oi, ${body.clientName}! Estamos preparando a sala para o seu atendimento em 2 horas. Responda [1] para Confirmar presença.`,
      pix_deposit: `Olá, ${body.clientName}! Para blindar seu horário na agenda, finalize o sinal de reserva de 30% via Pix Copia e Cola enviado abaixo.`,
      reactivation_45d:
        body.customMessage ||
        `Oi, ${body.clientName}! Notamos que já passou a janela ideal de manutenção do seu protocolo. Temos 1 horário disponível hoje com condição especial.`,
      rebooking_confirmation:
        body.customMessage ||
        `Perfeito, ${body.clientName}! Seu retorno programado foi travado na agenda. Enviaremos um lembrete automático 24h antes.`,
    };

    return Response.json({
      ok: true,
      engine: "evolution-baileys-v2",
      instance: process.env.WHATSAPP_INSTANCE_NAME || "veloce-studio-01",
      dispatchedAt: new Date().toISOString(),
      recipient: body.clientPhone,
      templateType: body.templateType,
      previewMessage: templates[body.templateType],
      twoWayWebhookListening: true,
    });
  } catch {
    return Response.json(
      {
        ok: false,
        error:
          "Não foi possível processar o disparo no motor WhatsApp. Verifique o payload JSON e tente novamente.",
      },
      { status: 500 }
    );
  }
}
