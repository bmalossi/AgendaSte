import crypto from "node:crypto";

/**
 * Integração Oficial Mercado Pago — Checkout Transparente (Orders API v1)
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/websites/pix
 * App ID configurado: 8756301923572884 (Site MLB - Brasil)
 */

const PLACEHOLDER_TOKENS = new Set([
  "",
  "TEST-0000000000000000",
  "APP_USR-0000000000000000",
]);

export function isMercadoPagoConfigured(): boolean {
  const token = (process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();
  return Boolean(token && !PLACEHOLDER_TOKENS.has(token));
}

export interface CreateMercadoPagoPixOrderInput {
  appointmentId: string;
  clientName: string;
  clientEmail?: string;
  serviceId?: string;
  serviceName?: string;
  serviceDescription?: string;
  amountCents: number;
  stateId?: string;
}

export interface CreateMercadoPagoPixOrderResult {
  orderId: string;
  paymentId: string;
  status: string;
  statusDetail: string;
  qrCode: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
}

export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "Cliente", lastName: "LUVEA" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "Cliente" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export async function createMercadoPagoPixOrder(
  input: CreateMercadoPagoPixOrderInput
): Promise<CreateMercadoPagoPixOrderResult> {
  const accessToken = (process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();
  if (!accessToken || PLACEHOLDER_TOKENS.has(accessToken)) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN não configurado em .env.local."
    );
  }

  const amountBRL = (input.amountCents / 100).toFixed(2);
  const { firstName, lastName } = splitFullName(input.clientName);
  const payerEmail =
    input.clientEmail && input.clientEmail.includes("@")
      ? input.clientEmail.trim()
      : "cliente@luvea.app";

  const idempotencyKey = crypto.randomUUID();
  const externalReference = input.appointmentId.slice(0, 64);

  // 1. Tenta criar o Pix via API oficial e direta de Pagamentos (/v1/payments)
  // Esta API é o padrão do Checkout Transparente Pix: retorna o QR Code e ticket_url imediatamente.
  try {
    const paymentPayload = {
      transaction_amount: Number(amountBRL),
      description: (
        input.serviceDescription ||
        input.serviceName ||
        `Atendimento - ${input.clientName}`
      ).slice(0, 250),
      payment_method_id: "pix",
      payer: {
        email: payerEmail,
        first_name: firstName,
        last_name: lastName,
      },
      external_reference: externalReference,
    };

    const paymentRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentData = (await paymentRes.json()) as {
      id?: string | number;
      status?: string;
      status_detail?: string;
      message?: string;
      point_of_interaction?: {
        transaction_data?: {
          qr_code?: string;
          qr_code_base64?: string;
          ticket_url?: string;
        };
      };
      errors?: Array<{ message?: string; code?: string }>;
    };

    const qrCode = paymentData.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 =
      paymentData.point_of_interaction?.transaction_data?.qr_code_base64;
    const ticketUrl =
      paymentData.point_of_interaction?.transaction_data?.ticket_url;

    if (paymentRes.ok && qrCode) {
      return {
        orderId: String(paymentData.id || externalReference),
        paymentId: String(paymentData.id || externalReference),
        status: paymentData.status || "pending",
        statusDetail: paymentData.status_detail || "waiting_transfer",
        qrCode,
        qrCodeBase64,
        ticketUrl,
      };
    }

    if (!paymentRes.ok) {
      console.warn("[Mercado Pago Payments API]:", {
        status: paymentRes.status,
        data: paymentData,
      });
    }
  } catch (paymentErr) {
    console.warn("[Mercado Pago Payments API Exception]:", paymentErr);
  }

  // 2. Fallback / Alternativa: Orders API (/v1/orders)
  const orderPayload = {
    type: "online",
    total_amount: amountBRL,
    external_reference: externalReference,
    processing_mode: "automatic",
    config: {
      location: {
        state_id: input.stateId || "BR-SP",
      },
    },
    transactions: {
      payments: [
        {
          amount: amountBRL,
          payment_method: {
            id: "pix",
            type: "bank_transfer",
          },
        },
      ],
    },
    payer: {
      email: payerEmail,
    },
  };

  const response = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(orderPayload),
  });

  const data = (await response.json()) as {
    id?: string;
    status?: string;
    status_detail?: string;
    message?: string;
    errors?: Array<{ message?: string; code?: string }>;
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
      };
    };
    transactions?: {
      payments?: Array<{
        id?: string;
        status?: string;
        status_detail?: string;
        point_of_interaction?: {
          transaction_data?: {
            qr_code?: string;
            qr_code_base64?: string;
            ticket_url?: string;
          };
        };
        payment_method?: {
          qr_code?: string;
          qr_code_base64?: string;
          ticket_url?: string;
        };
      }>;
    };
  };

  const payment = data.transactions?.payments?.[0];
  let qrCode =
    payment?.point_of_interaction?.transaction_data?.qr_code ||
    data.point_of_interaction?.transaction_data?.qr_code ||
    payment?.payment_method?.qr_code;
  let qrCodeBase64 =
    payment?.point_of_interaction?.transaction_data?.qr_code_base64 ||
    data.point_of_interaction?.transaction_data?.qr_code_base64 ||
    payment?.payment_method?.qr_code_base64;
  let ticketUrl =
    payment?.point_of_interaction?.transaction_data?.ticket_url ||
    data.point_of_interaction?.transaction_data?.ticket_url ||
    payment?.payment_method?.ticket_url;

  if (response.ok && !qrCode && payment?.id) {
    try {
      const getPayRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(payment.id)}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (getPayRes.ok) {
        const getPayData = (await getPayRes.json()) as {
          point_of_interaction?: {
            transaction_data?: {
              qr_code?: string;
              qr_code_base64?: string;
              ticket_url?: string;
            };
          };
        };
        qrCode = getPayData.point_of_interaction?.transaction_data?.qr_code || qrCode;
        qrCodeBase64 = getPayData.point_of_interaction?.transaction_data?.qr_code_base64 || qrCodeBase64;
        ticketUrl = getPayData.point_of_interaction?.transaction_data?.ticket_url || ticketUrl;
      }
    } catch {
      // Ignora erro secundário
    }
  }

  if (!response.ok || !qrCode) {
    const errorDetail =
      data.errors?.[0]?.message ||
      data.message ||
      (typeof data === "object" ? JSON.stringify(data) : null) ||
      `HTTP ${response.status} ao criar Order Pix no Mercado Pago`;
    console.error("[Mercado Pago Orders API Response Error]:", {
      status: response.status,
      data,
    });
    throw new Error(errorDetail);
  }

  return {
    orderId: data.id || externalReference,
    paymentId: payment?.id || externalReference,
    status: payment?.status || data.status || "action_required",
    statusDetail:
      payment?.status_detail || data.status_detail || "waiting_transfer",
    qrCode,
    qrCodeBase64,
    ticketUrl,
  };
}

/**
 * Valida a assinatura HMAC-SHA256 enviada pelo Mercado Pago no header `x-signature`.
 * Formato esperado do header `x-signature`: `ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839`
 * Template do manifesto oficial: `id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];`
 */
export function verifyMercadoPagoWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  const { xSignature, xRequestId, dataId, secret } = params;
  if (!xSignature || !secret) return false;

  const parts = xSignature.split(",");
  let ts = "";
  let v1 = "";

  for (const part of parts) {
    const [key, value] = part.trim().split("=");
    if (key === "ts") ts = value || "";
    if (key === "v1") v1 = value || "";
  }

  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId || ""};ts:${ts};`;
  const computed = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(v1, "hex")
    );
  } catch {
    return false;
  }
}
