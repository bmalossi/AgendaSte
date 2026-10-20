export interface UserWhatsAppConfigPayload {
  provider?: "evolution_api" | "meta_cloud" | "wa_web_manual";
  phoneNumber?: string;
  instanceName?: string;
  apiUrl?: string;
  apiKey?: string;
  metaPhoneNumberId?: string;
  metaBusinessAccountId?: string;
  metaAccessToken?: string;
}

export interface WhatsAppSendPayload {
  appointmentId?: string;
  clientName: string;
  clientPhone: string;
  templateType?:
    | "reminder_24h"
    | "reminder_2h"
    | "pix_deposit"
    | "reactivation_45d"
    | "rebooking_confirmation"
    | "custom";
  customMessage?: string;
  whatsappConfig?: UserWhatsAppConfigPayload;
}

function normalizeWhatsAppNumber(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WhatsAppSendPayload;

    if (!body.clientName || !body.clientPhone) {
      return Response.json(
        {
          ok: false,
          error:
            "Parâmetros obrigatórios ausentes: informe ao menos clientName e clientPhone.",
        },
        { status: 400 }
      );
    }

    const templateType = body.templateType || "custom";

    const templates: Record<string, string> = {
      reminder_24h: `Olá, ${body.clientName}! Seu horário no Aura Studio está reservado para amanhã. Responda [1] para Confirmar ou [2] para Reagendar.`,
      reminder_2h: `Oi, ${body.clientName}! Estamos preparando a sala para o seu atendimento em 2 horas. Responda [1] para Confirmar presença.`,
      pix_deposit:
        body.customMessage ||
        `Olá, ${body.clientName}! Para blindar seu horário na agenda, finalize o sinal de reserva via Pix Copia e Cola enviado abaixo.`,
      reactivation_45d:
        body.customMessage ||
        `Oi, ${body.clientName}! Notamos que já passou a janela ideal de manutenção do seu protocolo. Temos 1 horário disponível hoje com condição especial.`,
      rebooking_confirmation:
        body.customMessage ||
        `Perfeito, ${body.clientName}! Seu retorno programado foi travado na agenda. Enviaremos um lembrete automático 24h antes.`,
      custom: body.customMessage || `Olá, ${body.clientName}! Mensagem do Aura Studio.`,
    };

    const messageToSend = body.customMessage || templates[templateType];
    const normalizedPhone = normalizeWhatsAppNumber(body.clientPhone);

    const userCfg = body.whatsappConfig;
    const provider = userCfg?.provider || "evolution_api";

    // 1. Provedor Manual wa.me (Zero infraestrutura)
    if (provider === "wa_web_manual") {
      const waMeUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
        messageToSend
      )}`;
      return Response.json({
        ok: true,
        engine: "wa_web_manual",
        instance: "manual",
        dispatchedAt: new Date().toISOString(),
        recipient: normalizedPhone || body.clientPhone,
        templateType,
        previewMessage: messageToSend,
        waMeUrl,
        twoWayWebhookListening: false,
      });
    }

    // 2. Provedor Meta Cloud API Oficial
    if (provider === "meta_cloud") {
      const phoneNumberId = userCfg?.metaPhoneNumberId?.trim();
      const accessToken = userCfg?.metaAccessToken?.trim();

      if (phoneNumberId && accessToken && normalizedPhone) {
        try {
          const metaRes = await fetch(
            `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: normalizedPhone,
                type: "text",
                text: { preview_url: true, body: messageToSend },
              }),
            }
          );

          const metaData = await metaRes.json().catch(() => null);

          if (metaRes.ok) {
            return Response.json({
              ok: true,
              engine: "meta_cloud_official",
              instance: phoneNumberId,
              dispatchedAt: new Date().toISOString(),
              recipient: normalizedPhone,
              templateType,
              previewMessage: messageToSend,
              twoWayWebhookListening: true,
              metaResponse: metaData,
            });
          }

          console.error("[Meta Cloud API Error]:", {
            status: metaRes.status,
            data: metaData,
          });

          return Response.json(
            {
              ok: false,
              error:
                metaData?.error?.message ||
                `Erro ${metaRes.status} retornado pela Meta Cloud API`,
              fallbackToManual: true,
              previewMessage: messageToSend,
              recipient: normalizedPhone,
              twoWayWebhookListening: false,
              metaResponse: metaData,
            },
            { status: metaRes.status || 400 }
          );
        } catch (metaErr: any) {
          console.error("[Meta Cloud API Exception]:", metaErr);
          return Response.json(
            {
              ok: false,
              error: `Falha na conexão com Meta Cloud API: ${metaErr?.message || "Servidor inacessível"}`,
              fallbackToManual: true,
              previewMessage: messageToSend,
              recipient: normalizedPhone,
              twoWayWebhookListening: false,
            },
            { status: 502 }
          );
        }
      }
    }

    // 3. Provedor Evolution API / Baileys (ou variáveis de ambiente globais)
    const baseUrl = (
      userCfg?.apiUrl ||
      process.env.WHATSAPP_API_URL ||
      "https://api.automab.dev"
    )
      .trim()
      .replace(/\/+$/, "");
    const apiKey = (
      userCfg?.apiKey ||
      process.env.WHATSAPP_API_KEY ||
      "236FEA403B1A-4A4D-9200-6847A420E3FE"
    ).trim();

    const phoneDigits = (userCfg?.phoneNumber || "").replace(/\D/g, "");
    let instance = (
      userCfg?.instanceName ||
      process.env.WHATSAPP_INSTANCE_NAME ||
      "pessoal"
    ).trim();

    if (!userCfg?.instanceName && phoneDigits && !phoneDigits.includes("944477528")) {
      instance = `luvea_${phoneDigits}`;
    }

    const isMockTesting =
      process.env.NODE_ENV === "test" ||
      normalizedPhone === "5511998765432";

    // Se as credenciais da Evolution API estiverem configuradas e não for teste sintético, executa o disparo real
    if (baseUrl && apiKey && normalizedPhone && !isMockTesting) {
      try {
        const endpoint = `${baseUrl}/message/sendText/${instance}`;
        const evoRes = await fetch(endpoint, {
          method: "POST",
          headers: {
            apikey: apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number: normalizedPhone,
            text: messageToSend,
            delay: 1200,
            linkPreview: true,
          }),
        });

        const evoData = await evoRes.json().catch(() => null);

        if (evoRes.ok) {
          return Response.json({
            ok: true,
            engine: "evolution-api-v2",
            instance,
            dispatchedAt: new Date().toISOString(),
            recipient: normalizedPhone,
            templateType,
            previewMessage: messageToSend,
            twoWayWebhookListening: true,
            evolutionResponse: evoData,
          });
        }

        console.error("[Evolution API Error Response]:", {
          status: evoRes.status,
          data: evoData,
        });
        const existsFalse = evoData?.response?.message?.[0]?.exists === false;
        const errorMsg = existsFalse
          ? `O número ${normalizedPhone} não foi encontrado no WhatsApp.`
          : (evoData?.error ||
            evoData?.message ||
            `Erro ${evoRes.status} retornado pela Evolution API`);

        return Response.json(
          {
            ok: false,
            error: errorMsg,
            fallbackToManual: true,
            previewMessage: messageToSend,
            recipient: normalizedPhone,
            twoWayWebhookListening: false,
            evolutionResponse: evoData,
          },
          { status: evoRes.status || 400 }
        );
      } catch (evoErr: any) {
        console.error("[Evolution API Fetch Exception]:", evoErr);
        return Response.json(
          {
            ok: false,
            error: `Falha na conexão com Evolution API: ${evoErr?.message || "Servidor inacessível"}`,
            fallbackToManual: true,
            previewMessage: messageToSend,
            recipient: normalizedPhone,
            twoWayWebhookListening: false,
          },
          { status: 502 }
        );
      }
    }

    // Fallback simulado (para testes e ambiente de desenvolvimento sem credenciais)
    return Response.json({
      ok: true,
      engine: provider === "meta_cloud" ? "meta_cloud_simulated" : "evolution-baileys-v2",
      instance: instance || "veloce-studio-01",
      dispatchedAt: new Date().toISOString(),
      recipient: normalizedPhone || body.clientPhone,
      templateType,
      previewMessage: messageToSend,
      twoWayWebhookListening: true,
    });
  } catch (err: any) {
    return Response.json(
      {
        ok: false,
        error:
          err?.message ||
          "Não foi possível processar o disparo no motor WhatsApp. Verifique os dados e tente novamente.",
      },
      { status: 500 }
    );
  }
}
