import { NextResponse } from "next/server";
import {
  resolvePlanPriceCents,
  calculateDiscountedPrice,
  PLATFORM_PROMO_COUPONS,
  type PlanTier,
  type BillingCycle,
} from "@/lib/billing/pricing";
import { validateStripeCouponOrPromoCode } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawCode = String(body.couponCode || "").trim().toUpperCase();
    const planTier = (body.planTier || "gold") as PlanTier;
    const billingCycle = (body.billingCycle || "monthly") as BillingCycle;

    if (!rawCode) {
      return NextResponse.json(
        { valid: false, error: "Informe o código do cupom." },
        { status: 400 }
      );
    }

    const basePriceCents = resolvePlanPriceCents(planTier, billingCycle);

    // 1. Verifica no catálogo de cupons da plataforma LUVEA
    if (PLATFORM_PROMO_COUPONS[rawCode]) {
      const promo = PLATFORM_PROMO_COUPONS[rawCode];
      const { discountCents, finalCents } = calculateDiscountedPrice(basePriceCents, {
        discountPercent: promo.discountPercent,
        discountAmountOffCents: promo.discountAmountOffCents,
      });

      return NextResponse.json({
        valid: true,
        code: promo.code,
        description: promo.description,
        discountPercent: promo.discountPercent,
        discountAmountOffCents: promo.discountAmountOffCents,
        discountCents,
        finalPriceCents: finalCents,
      });
    }

    // 2. Verifica na API oficial da Stripe
    const stripeResult = await validateStripeCouponOrPromoCode(rawCode);
    if (stripeResult.valid) {
      const { discountCents, finalCents } = calculateDiscountedPrice(basePriceCents, {
        discountPercent: stripeResult.discountPercent,
        discountAmountOffCents: stripeResult.discountAmountOffCents,
      });

      return NextResponse.json({
        valid: true,
        code: rawCode,
        description: stripeResult.name || `${rawCode} (Stripe)`,
        discountPercent: stripeResult.discountPercent,
        discountAmountOffCents: stripeResult.discountAmountOffCents,
        discountCents,
        finalPriceCents: finalCents,
        stripePromotionCodeId: stripeResult.promotionCodeId,
        stripeCouponId: stripeResult.couponId,
      });
    }

    return NextResponse.json(
      { valid: false, error: "Cupom inválido ou expirado." },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err?.message || "Erro ao validar cupom." },
      { status: 500 }
    );
  }
}
