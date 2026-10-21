import { isMercadoPagoConfigured } from "@/lib/mercadopago";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const paymentId = url.searchParams.get("paymentId")?.trim();
    const orderId = url.searchParams.get("orderId")?.trim();

    if (!paymentId && !orderId) {
      return Response.json(
        { ok: false, error: "Informe paymentId ou orderId." },
        { status: 400 }
      );
    }

    if (!isMercadoPagoConfigured()) {
      return Response.json({
        ok: true,
        mode: "sandbox_simulated",
        paid: false,
        status: "pending",
      });
    }

    const token = (process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();

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
