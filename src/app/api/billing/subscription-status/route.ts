import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const invoiceId = url.searchParams.get("invoiceId")?.trim();
    const subdomain = url.searchParams.get("subdomain")?.trim();

    if (!invoiceId && !subdomain) {
      return NextResponse.json(
        { ok: false, error: "Informe invoiceId ou subdomain." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        mode: "local_dev",
        status: "pending",
        paid: false,
      });
    }

    if (invoiceId) {
      const { data: invoice } = await supabaseAdmin
        .from("subscription_invoices")
        .select("id, status, paid_at, plan_tier, billing_cycle")
        .or(`id.eq.${invoiceId},external_invoice_id.eq.${invoiceId}`)
        .maybeSingle();

      if (invoice) {
        const isPaid = invoice.status === "paid";
        return NextResponse.json({
          ok: true,
          status: invoice.status,
          paid: isPaid,
          paidAt: invoice.paid_at,
          planTier: invoice.plan_tier,
          billingCycle: invoice.billing_cycle,
        });
      }
    }

    if (subdomain) {
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("id, subscription_status, plan_tier, billing_cycle, current_period_end")
        .eq("slug", subdomain)
        .maybeSingle();

      if (org) {
        const isPaid = org.subscription_status === "active";
        return NextResponse.json({
          ok: true,
          status: org.subscription_status,
          paid: isPaid,
          planTier: org.plan_tier,
          billingCycle: org.billing_cycle,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      status: "pending",
      paid: false,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro ao consultar status da assinatura." },
      { status: 500 }
    );
  }
}
