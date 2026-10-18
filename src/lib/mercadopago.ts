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
    return { firstName: "Cliente", lastName: "AgendaSte" };
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
      : "cliente@agendaste.com.br";

  const idempotencyKey = crypto.randomUUID();
  const externalReference = input.appointmentId.slice(0, 64);

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
    items: [
      {
        id: input.serviceId || "srv-agendaste",
        title: input.serviceName || "Sinal de Reserva AgendaSte",
        description:
          input.serviceDescription ||
          `Reserva de horário (${input.serviceName || "Procedimento"}) - ${input.clientName}`,
        category_id: "services",
        quantity: 1,
        unit_price: amountBRL,
      },
    ],
    transactions: {
      payments: [
        {
          amount: amountBRL,
          payment_method: {
            id: "pix",
            type: "bank_transfer",
          },
          expiration_time: "PT30M",
        },
      ],
    },
    payer: {
      email: payerEmail,
      first_name: firstName,
      last_name: lastName,
    },
  };

  const response = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(orderPayload),
  });

  const data = (await response.json()) as {
    id?: string;
    status?: string;
    status_detail?: string;
    message?: string;
    errors?: Array<{ message?: string; code?: string }>;
    transactions?: {
      payments?: Array<{
        id?: string;
        status?: string;
        status_detail?: string;
        payment_method?: {
          qr_code?: string;
          qr_code_base64?: string;
          ticket_url?: string;
        };
      }>;
    };
  };

  const payment = data.transactions?.payments?.[0];
  const qrCode = payment?.payment_method?.qr_code;

  if (!response.ok || !qrCode) {
    const errorDetail =
      data.errors?.[0]?.message ||
      data.message ||
      `HTTP ${response.status} ao criar Order Pix no Mercado Pago`;
    throw new Error(errorDetail);
  }

  return {
    orderId: data.id || externalReference,
    paymentId: payment?.id || externalReference,
    status: payment?.status || data.status || "action_required",
    statusDetail:
      payment?.status_detail || data.status_detail || "waiting_transfer",
    qrCode,
    qrCodeBase64: payment?.payment_method?.qr_code_base64,
    ticketUrl: payment?.payment_method?.ticket_url,
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
