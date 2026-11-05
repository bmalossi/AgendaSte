import {
  isMercadoPagoConfigured,
  isValidMercadoPagoToken,
  createMercadoPagoPixOrder,
  generatePixBrCode,
  normalizePixKey,
  type PixKeyTypeOption,
} from "@/lib/mercadopago";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type StudioPixProviderMode = "direct_pix_key" | "mercadopago_api";

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
  // Contexto Multi-Tenant (Estúdio / Empresa)
  organizationId?: string;
  subdomain?: string;
  pixProviderMode?: StudioPixProviderMode;
  pixKey?: string;
  pixKeyType?: PixKeyTypeOption;
  merchantName?: string;
  merchantCity?: string;
  mercadopagoAccessToken?: string;
}

interface ResolvedTenantPixConfig {
  mode: StudioPixProviderMode;
  mercadopagoAccessToken: string;
  pixKey: string;
  pixKeyType?: PixKeyTypeOption;
  merchantName: string;
  merchantCity: string;
  hasTenantContext: boolean;
}

async function resolveTenantPixConfig(
  body: CreatePixPayload
): Promise<ResolvedTenantPixConfig> {
  let dbMpToken = "";
  let dbMode: StudioPixProviderMode | undefined;
  let dbPixKey = "";
  let dbPixKeyType: PixKeyTypeOption | undefined;
  let dbMerchantName = "";
  let dbMerchantCity = "";

  const cleanOrgId = (body.organizationId || "").trim();
  const cleanSubdomain = (body.subdomain || "").trim().toLowerCase();

  if ((cleanOrgId || cleanSubdomain) && isSupabaseConfigured()) {
    try {
      let orgQuery = supabaseAdmin
        .from("organizations")
        .select("id, name, slug, settings");

      if (cleanOrgId) {
        orgQuery = orgQuery.eq("id", cleanOrgId);
      } else {
        orgQuery = orgQuery.eq("slug", cleanSubdomain);
      }

      const { data: org } = await orgQuery.maybeSingle();

      if (org) {
        dbMerchantName = org.name || "";
        const settings = (org.settings || {}) as Record<string, any>;
        const webPayments =
          settings?.website?.paymentsSetup || settings?.paymentsSetup || {};
        const bizSettings = settings?.business || {};

        dbMpToken = (
          webPayments.mercadopagoAccessToken ||
          bizSettings.mercadopagoAccessToken ||
          ""
        ).trim();

        const rawMode =
          webPayments.pixProviderMode || bizSettings.pixProviderMode;
        if (rawMode === "mercadopago_api" || rawMode === "direct_pix_key") {
          dbMode = rawMode;
        }

        dbPixKey = (
          webPayments.pixKeyValue ||
          bizSettings.pixKey ||
          ""
        ).trim();

        if (webPayments.pixKeyType) {
          dbPixKeyType = webPayments.pixKeyType as PixKeyTypeOption;
        }

        dbMerchantCity = (
          settings?.website?.city ||
          ( typeof bizSettings.cityState === "string"
            ? bizSettings.cityState.split(",")[0]
            : "" ) ||
          ""
        ).trim();

        if (!dbPixKey && org.id) {
          const { data: prof } = await supabaseAdmin
            .from("professionals")
            .select("pix_key, studio_name")
            .eq("organization_id", org.id)
            .limit(1)
            .maybeSingle();

          if (prof?.pix_key) {
            dbPixKey = prof.pix_key.trim();
          }
          if (!dbMerchantName && prof?.studio_name) {
            dbMerchantName = prof.studio_name.trim();
          }
        }
      }
    } catch (err) {
      console.warn("[Multi-Tenant Pix Lookup Warning]:", err);
    }
  }

  const effectiveMpToken = (body.mercadopagoAccessToken || dbMpToken || "").trim();
  const effectivePixKey = (body.pixKey || dbPixKey || "pix@luveastudio.app").trim();
  const effectivePixKeyType = body.pixKeyType || dbPixKeyType;
  const effectiveMerchantName = (
    body.merchantName ||
    dbMerchantName ||
    "LUVEA STUDIO"
  ).trim();
  const effectiveMerchantCity = (
    body.merchantCity ||
    dbMerchantCity ||
    "SAO PAULO"
  ).trim();

  const effectiveMode: StudioPixProviderMode =
    body.pixProviderMode ||
    dbMode ||
    (isValidMercadoPagoToken(effectiveMpToken)
      ? "mercadopago_api"
      : "direct_pix_key");

  const hasTenantContext = Boolean(
    cleanOrgId ||
      cleanSubdomain ||
      body.pixKey ||
      body.pixProviderMode ||
      body.mercadopagoAccessToken ||
      dbPixKey ||
      dbMpToken
  );

  return {
    mode: effectiveMode,
    mercadopagoAccessToken: effectiveMpToken,
    pixKey: effectivePixKey,
    pixKeyType: effectivePixKeyType,
    merchantName: effectiveMerchantName,
    merchantCity: effectiveMerchantCity,
    hasTenantContext,
  };
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

    const txId = `LUVEA${body.appointmentId
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 18)}99A`;

    const tenantConfig = await resolveTenantPixConfig(body);
    let fallbackReason: string | undefined;

    // 1. Modo Mercado Pago Automático do Estúdio (ou fallback legado sem tenant se env global ativa)
    const shouldAttemptMercadoPago = tenantConfig.hasTenantContext
      ? tenantConfig.mode === "mercadopago_api" &&
        isValidMercadoPagoToken(tenantConfig.mercadopagoAccessToken)
      : isMercadoPagoConfigured();

    if (shouldAttemptMercadoPago) {
      try {
        const mpOrder = await createMercadoPagoPixOrder({
          appointmentId: body.appointmentId,
          clientName: body.clientName,
          clientEmail: body.clientEmail,
          serviceId: body.serviceId,
          serviceName: body.serviceName,
          serviceDescription: body.serviceDescription,
          amountCents: depositCents,
          accessToken: tenantConfig.hasTenantContext
            ? tenantConfig.mercadopagoAccessToken
            : undefined,
        });

        return Response.json({
          ok: true,
          provider: "mercadopago",
          mode: "mercadopago_orders_api",
          tenantMode: "mercadopago_api",
          orderId: mpOrder.orderId,
          paymentId: mpOrder.paymentId,
          txId: mpOrder.orderId,
          appointmentId: body.appointmentId,
          depositPercent: percent,
          depositCents,
          totalCents: effectiveTotalCents,
          expiresInMinutes: 30,
          merchantNameUsed: tenantConfig.merchantName,
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
          "[Mercado Pago Orders API] Fallback para BRCode da Chave Pix do estúdio:",
          fallbackReason
        );
      }
    }

    // 2. Geração de BRCode Oficial Padrão Banco Central (EMV QRCPS-MPM com CRC16-CCITT)
    // Direcionado diretamente para a Chave Pix e Nome do Estúdio (Multi-Tenant)
    const brCode = generatePixBrCode({
      pixKey: tenantConfig.pixKey,
      pixKeyType: tenantConfig.pixKeyType,
      merchantName: tenantConfig.merchantName,
      merchantCity: tenantConfig.merchantCity,
      amountCents: depositCents,
      txId,
    });

    const isDirectTenantPix =
      tenantConfig.hasTenantContext &&
      tenantConfig.mode === "direct_pix_key" &&
      !fallbackReason;

    return Response.json({
      ok: true,
      provider: isDirectTenantPix
        ? "bcb_emv_direct"
        : process.env.PIX_PROVIDER || "mercadopago",
      mode: isDirectTenantPix ? "direct_pix_key" : "sandbox_fallback",
      tenantMode: tenantConfig.mode,
      fallbackReason,
      txId,
      appointmentId: body.appointmentId,
      depositPercent: percent,
      depositCents,
      totalCents: effectiveTotalCents,
      expiresInMinutes: 30,
      pixKeyUsed: normalizePixKey(
        tenantConfig.pixKey,
        tenantConfig.pixKeyType
      ),
      merchantNameUsed: tenantConfig.merchantName,
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
