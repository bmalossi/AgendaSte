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

export function isValidMercadoPagoToken(token?: string | null): boolean {
  const clean = (token || "").trim();
  return Boolean(clean && !PLACEHOLDER_TOKENS.has(clean));
}

export function isMercadoPagoConfigured(customAccessToken?: string | null): boolean {
  if (isValidMercadoPagoToken(customAccessToken)) {
    return true;
  }
  const token = (process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();
  return isValidMercadoPagoToken(token);
}

export type PixKeyTypeOption = "cpf_cnpj" | "email" | "phone" | "random";

/**
 * Normaliza a Chave Pix para o padrão DICT do Banco Central do Brasil:
 * - CPF/CNPJ: apenas dígitos (11 ou 14 caracteres)
 * - Telefone: formato internacional E.164 (+55DDD9XXXXXXXX)
 * - E-mail: minúsculas sem espaços
 * - Chave Aleatória (EVP): trim preservando hifens
 */
export function normalizePixKey(
  rawKey: string,
  keyType?: PixKeyTypeOption
): string {
  const trimmed = (rawKey || "").trim();
  if (!trimmed) return "pix@luveastudio.app";

  if (keyType === "email" || trimmed.includes("@")) {
    return trimmed.toLowerCase().replace(/\s+/g, "");
  }

  const digitsOnly = trimmed.replace(/\D/g, "");

  if (keyType === "cpf_cnpj") {
    return digitsOnly || trimmed;
  }

  if (keyType === "phone") {
    if (trimmed.startsWith("+")) {
      return `+${digitsOnly}`;
    }
    if (digitsOnly.length === 10 || digitsOnly.length === 11) {
      return `+55${digitsOnly}`;
    }
    if (digitsOnly.startsWith("55") && (digitsOnly.length === 12 || digitsOnly.length === 13)) {
      return `+${digitsOnly}`;
    }
    return digitsOnly ? `+55${digitsOnly}` : trimmed;
  }

  // Auto-detecção quando keyType não é especificado ou é random:
  // Se contém pontuação de CPF/CNPJ (ex: 000.000.000-00 ou 00.000.000/0001-00)
  if (
    /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(trimmed) ||
    /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(trimmed) ||
    digitsOnly.length === 14
  ) {
    return digitsOnly;
  }

  // Se parece telefone formatado ex: (11) 99999-9999
  if (/^\(?\d{2}\)?\s*\d{4,5}-\d{4}$/.test(trimmed)) {
    return `+55${digitsOnly}`;
  }

  return trimmed;
}

function formatEmvField(id: string, value: string): string {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

function sanitizeEmvText(input: string, maxLength: number, fallback: string): string {
  const cleaned = (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  return (cleaned || fallback).slice(0, maxLength);
}

/**
 * Calcula o CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF)
 * exigido na Tag 63 do padrão oficial BRCode do Banco Central do Brasil.
 */
export function computeCrc16Ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface GeneratePixBrCodeInput {
  pixKey: string;
  pixKeyType?: PixKeyTypeOption;
  merchantName?: string;
  merchantCity?: string;
  amountCents?: number;
  txId?: string;
}

/**
 * Gera um payload Pix Copia e Cola (EMV® QRCPS-MPM / BRCode BACEN) 100% válido
 * diretamente para a chave Pix configurada pelo estúdio (Multi-Tenant).
 */
export function generatePixBrCode(input: GeneratePixBrCodeInput): string {
  const normalizedKey = normalizePixKey(input.pixKey, input.pixKeyType);
  const merchantName = sanitizeEmvText(
    input.merchantName || "LUVEA STUDIO",
    25,
    "LUVEA STUDIO"
  );
  const merchantCity = sanitizeEmvText(
    input.merchantCity || "SAO PAULO",
    15,
    "SAO PAULO"
  );
  const cleanTxId =
    (input.txId || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 25) || "***";

  const guiField = formatEmvField("00", "BR.GOV.BCB.PIX");
  const keyField = formatEmvField("01", normalizedKey.slice(0, 77));
  const merchantAccountInfo = formatEmvField("26", `${guiField}${keyField}`);

  const amountField =
    typeof input.amountCents === "number" && input.amountCents > 0
      ? formatEmvField("54", (input.amountCents / 100).toFixed(2))
      : "";

  const additionalDataField = formatEmvField(
    "62",
    formatEmvField("05", cleanTxId)
  );

  const payloadWithoutCrc = [
    formatEmvField("00", "01"),
    merchantAccountInfo,
    formatEmvField("52", "0000"),
    formatEmvField("53", "986"),
    amountField,
    formatEmvField("58", "BR"),
    formatEmvField("59", merchantName),
    formatEmvField("60", merchantCity),
    additionalDataField,
    "6304",
  ].join("");

  const crc = computeCrc16Ccitt(payloadWithoutCrc);
  return `${payloadWithoutCrc}${crc}`;
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
  /** Token específico da organização/estúdio (Multi-Tenant) */
  accessToken?: string;
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
  const accessToken = (
    input.accessToken ||
    process.env.MERCADOPAGO_ACCESS_TOKEN ||
    ""
  ).trim();
  if (!isValidMercadoPagoToken(accessToken)) {
    throw new Error(
      "Access Token do Mercado Pago não configurado ou inválido para este estúdio."
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
  toleranceSeconds?: number;
}): boolean {
  const { xSignature, xRequestId, dataId, secret, toleranceSeconds } = params;
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

  if (toleranceSeconds && toleranceSeconds > 0) {
    const parsedTs = parseInt(ts, 10);
    if (isNaN(parsedTs)) return false;
    const tsSeconds = ts.length > 11 ? Math.floor(parsedTs / 1000) : parsedTs;
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - tsSeconds) > toleranceSeconds) {
      return false;
    }
  }

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
