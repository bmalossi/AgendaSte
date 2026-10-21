import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (process.env.NODE_ENV === "production" && webhookSecret) {
      const authHeader = request.headers.get("authorization");
      const secretHeader = request.headers.get("x-webhook-secret");
      const token = authHeader?.replace(/^Bearer\s+/i, "") || secretHeader;
      if (token !== webhookSecret) {
        return NextResponse.json(
          { ok: false, error: "Assinatura do webhook inválida." },
          { status: 401 }
        );
      }
    }

    const body = await request.json();

    const { event, organizationId, subdomain, status } = body;

    // Atualiza o status da organização caso Supabase esteja ativo
    if (isSupabaseConfigured() && (organizationId || subdomain)) {
      const newStatus =
        status === "paid" || status === "approved" || status === "CONFIRMED"
          ? "active"
          : status === "refunded" || status === "canceled"
          ? "canceled"
          : "past_due";

      const query = supabaseAdmin
        .from("organizations")
        .update({ subscription_status: newStatus });

      if (organizationId) {
        await query.eq("id", organizationId);
      } else if (subdomain) {
        await query.eq("slug", subdomain);
      }
    }

    return NextResponse.json({ ok: true, received: true, event });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Webhook error" },
      { status: 500 }
    );
  }
}
