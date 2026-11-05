import {
  isMercadoPagoConfigured,
  isValidMercadoPagoToken,
} from "@/lib/mercadopago";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";

async function resolveTenantMercadoPagoToken(params: {
  organizationId?: string | null;
  subdomain?: string | null;
}): Promise<string> {
  const cleanOrgId = (params.organizationId || "").trim();
  const cleanSubdomain = (params.subdomain || "").trim().toLowerCase();

  if ((cleanOrgId || cleanSubdomain) && isSupabaseConfigured()) {
    try {
      let query = supabaseAdmin
        .from("organizations")
        .select("settings");

      if (cleanOrgId) {
        query = query.eq("id", cleanOrgId);
      } else {
        query = query.eq("slug", cleanSubdomain);
      }

      const { data: org } = await query.maybeSingle();
      if (org?.settings) {
        const settings = org.settings as Record<string, any>;
        const token = (
          settings?.website?.paymentsSetup?.mercadopagoAccessToken ||
          settings?.paymentsSetup?.mercadopagoAccessToken ||
          settings?.business?.mercadopagoAccessToken ||
          ""
        ).trim();
        if (isValidMercadoPagoToken(token)) {
          return token;
        }
      }
    } catch {
      // Fallback silencioso
    }
  }

  return "";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const paymentId = url.searchParams.get("paymentId")?.trim();
    const orderId = url.searchParams.get("orderId")?.trim();
    const organizationId = url.searchParams.get("organizationId")?.trim();
    const subdomain = url.searchParams.get("subdomain")?.trim();

    if (!paymentId && !orderId) {
      return Response.json(
        { ok: false, error: "Informe paymentId ou orderId." },
        { status: 400 }
      );
    }

    const tenantToken = await resolveTenantMercadoPagoToken({
      organizationId,
      subdomain,
    });
    const hasTenantScope = Boolean(organizationId || subdomain);

    const token = hasTenantScope
      ? tenantToken
      : tenantToken || (process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();

    if (!isValidMercadoPagoToken(token) && !isMercadoPagoConfigured(token)) {
      return Response.json({
        ok: true,
        mode: "sandbox_simulated",
        paid: false,
        status: "pending",
      });
    }

    // 1. Consulta por Payment ID (mais comum para Pix direto)
    if (paymentId) {
      const res = await fetch(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (res.ok) {
        const data = (await res.json()) as {
          status?: string;
          status_detail?: string;
          transaction_amount?: number;
          date_approved?: string;
        };

        const isPaid = data.status === "approved";

        return Response.json({
          ok: true,
          provider: "mercadopago",
          type: "payment",
          paymentId,
          status: data.status,
          statusDetail: data.status_detail,
          amount: data.transaction_amount,
          dateApproved: data.date_approved,
          paid: isPaid,
        });
      }
    }

    // 2. Consulta por Order ID (Orders API v1)
    if (orderId) {
      const res = await fetch(
        `https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (res.ok) {
        const data = (await res.json()) as {
          status?: string;
          transactions?: {
            payments?: Array<{ id: string | number; status: string }>;
          };
        };

        const paymentList = data.transactions?.payments || [];
        const isPaid =
          data.status === "closed" ||
          paymentList.some((p) => p.status === "approved");

        return Response.json({
          ok: true,
          provider: "mercadopago",
          type: "order",
          orderId,
          status: data.status,
          paid: isPaid,
          payments: paymentList,
        });
      }
    }

    return Response.json({
      ok: true,
      paid: false,
      status: "pending",
    });
  } catch (err: any) {
    console.error("[Pix Status API Error]:", err);
    return Response.json(
      { ok: false, error: err?.message || "Erro ao consultar status Pix" },
      { status: 500 }
    );
  }
}
