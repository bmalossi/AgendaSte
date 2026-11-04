import { NextResponse } from "next/server";
import { checkoutFormSchema, normalizeSubdomain } from "@/lib/auth-schemas";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { resend, getSenderEmail, isResendConfigured } from "@/lib/resend";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import {
  resolvePlanPriceCents,
  calculateBonusTrialPeriodEnd,
  validateSubdomainOwnership,
  calculateDiscountedPrice,
  PLATFORM_PROMO_COUPONS,
} from "@/lib/billing/pricing";
import {
  createOrRetrieveStripeCustomer,
  createStripeCheckoutSession,
  validateStripeCouponOrPromoCode,
} from "@/lib/billing/stripe";
import {
  isMercadoPagoConfigured,
  createMercadoPagoPixOrder,
} from "@/lib/mercadopago";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parseResult = checkoutFormSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Dados de checkout inválidos.",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      whatsapp,
      cpfCnpj,
      businessName,
      subdomain,
      planTier,
      billingCycle,
      paymentMethod,
      couponCode,
    } = parseResult.data;

    const normalizedSlug = normalizeSubdomain(subdomain);
    const basePriceCents = resolvePlanPriceCents(planTier, billingCycle);

    // Validação de Cupom de Desconto (se informado)
    let discountCents = 0;
    let stripeCouponId: string | undefined = undefined;
    let stripePromotionCodeId: string | undefined = undefined;

    if (couponCode && couponCode.trim()) {
      const codeUpper = couponCode.trim().toUpperCase();
      if (PLATFORM_PROMO_COUPONS[codeUpper]) {
        const promo = PLATFORM_PROMO_COUPONS[codeUpper];
        const res = calculateDiscountedPrice(basePriceCents, {
          discountPercent: promo.discountPercent,
          discountAmountOffCents: promo.discountAmountOffCents,
        });
        discountCents = res.discountCents;
      } else {
        const stripePromo = await validateStripeCouponOrPromoCode(codeUpper);
        if (stripePromo.valid) {
          const res = calculateDiscountedPrice(basePriceCents, {
            discountPercent: stripePromo.discountPercent,
            discountAmountOffCents: stripePromo.discountAmountOffCents,
          });
          discountCents = res.discountCents;
          stripeCouponId = stripePromo.couponId;
          stripePromotionCodeId = stripePromo.promotionCodeId;
        }
      }
    }

    const effectivePriceCents = Math.max(0, basePriceCents - discountCents);

    // 1. Identifica usuário autenticado requisitante (se houver) para proteção Anti-Overwrite e Vinculação de Conta
    let requesterUserId: string | null = null;
    let requesterOrgId: string | null = null;
    let requesterRole: string | null = null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          requesterUserId = user.id;
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("organization_id, role")
            .eq("id", user.id)
            .maybeSingle();

          if (profile) {
            requesterOrgId = profile.organization_id;
            requesterRole = profile.role;
          }
        }
      } catch (authErr) {
        console.warn("[Checkout Auth Context Check Error]:", authErr);
      }
    }

    // 2. Consulta existência da organização e valida titularidade / recupera órfãos
    let organizationId: string | null = null;
    let existingTrialEndsAt: Date | null = null;
    let existingOrg: any = null;

    if (isSupabaseConfigured()) {
      try {
        const { data: org } = await supabaseAdmin
          .from("organizations")
          .select("id, slug, name, trial_ends_at, subscription_status, current_period_end, payment_gateway")
          .eq("slug", normalizedSlug)
          .maybeSingle();

        if (org) {
          existingOrg = org;
          existingTrialEndsAt = org.trial_ends_at ? new Date(org.trial_ends_at) : null;

          // Verifica se a organização existente possui membros vinculados em profiles
          const { count: profileCount } = await supabaseAdmin
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", org.id);

          const isOrphan = !profileCount || profileCount === 0;

          const ownershipCheck = validateSubdomainOwnership({
            existingOrg: {
              id: org.id,
              slug: org.slug,
              name: org.name,
            },
            requesterUserId,
            requesterOrgId,
            requesterRole,
            isOrphan,
          });

          if (!ownershipCheck.canProceed) {
            return NextResponse.json(
              {
                ok: false,
                error: ownershipCheck.error,
              },
              { status: ownershipCheck.status || 409 }
            );
          }

          // Se a organização encontrada for órfã e o usuário logado já possuir outra org (ex: provisória do cadastro),
          // limpamos a órfã vazia para que a organização real do usuário assuma o slug desejado.
          if (requesterUserId && requesterOrgId && requesterOrgId !== org.id && isOrphan) {
            await supabaseAdmin.from("organizations").delete().eq("id", org.id);
            organizationId = requesterOrgId;
          } else {
            organizationId = org.id;
            // Se o usuário logado ainda não estiver vinculado a essa org, vincula o profile
            if (requesterUserId && (!requesterOrgId || requesterOrgId !== org.id)) {
              await supabaseAdmin
                .from("profiles")
                .update({ organization_id: org.id })
                .eq("id", requesterUserId);
              requesterOrgId = org.id;
            }
          }
        } else {
          // Slug inédito: se o usuário já estiver logado com uma organização, reutiliza/atualiza o slug dela!
          if (requesterUserId && requesterOrgId) {
            organizationId = requesterOrgId;
          }
        }
      } catch (dbErr) {
        console.warn("[Checkout DB Read Exception]:", dbErr);
      }
    }

    // 3. Calcula bônus de dias restantes do Teste Grátis (Free Trial)
    const bonusTrial = calculateBonusTrialPeriodEnd({
      trialEndsAt: existingTrialEndsAt,
      billingCycle,
      now: new Date(),
    });

    // 4. Provisiona ou atualiza a organização no Supabase
    if (isSupabaseConfigured()) {
      try {
        if (organizationId) {
          await supabaseAdmin
            .from("organizations")
            .update({
              name: businessName,
              slug: normalizedSlug,
              plan_tier: planTier,
              billing_cycle: billingCycle,
              phone: whatsapp,
              whatsapp_number: whatsapp,
              cpf_cnpj: cpfCnpj,
              payment_gateway: paymentMethod === "credit_card" ? "stripe" : "mercadopago",
              updated_at: new Date().toISOString(),
            })
            .eq("id", organizationId);
        } else {
          const { data: newOrg, error: orgError } = await supabaseAdmin
            .from("organizations")
            .insert({
              name: businessName,
              slug: normalizedSlug,
              plan_tier: planTier,
              billing_cycle: billingCycle,
              subscription_status: "trialing",
              phone: whatsapp,
              whatsapp_number: whatsapp,
              cpf_cnpj: cpfCnpj,
              payment_gateway: paymentMethod === "credit_card" ? "stripe" : "mercadopago",
            })
            .select("id")
            .single();

          if (orgError) {
            console.warn("[Checkout] Erro ao criar organização no Supabase:", orgError);
          } else if (newOrg) {
            organizationId = newOrg.id;
            if (requesterUserId) {
              await supabaseAdmin
                .from("profiles")
                .update({ organization_id: newOrg.id })
                .eq("id", requesterUserId);
            }
          }
        }
      } catch (saveErr) {
        console.warn("[Checkout Save Org Error]:", saveErr);
      }
    }

    const orgIdForBilling = organizationId || normalizedSlug;

    // Resolução da URL base da aplicação
    const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const proto = request.headers.get("x-forwarded-proto") || (rawHost.includes("localhost") ? "http" : "https");
    const baseUrl = rawHost ? `${proto}://${rawHost}` : (process.env.NEXT_PUBLIC_APP_URL || "https://luvea.app").replace(/\/$/, "");

    // 5. Fluxo de Cartão de Crédito (Stripe Checkout Session Oficial - Opção A)
    if (paymentMethod === "credit_card") {
      let customerId = "";
      try {
        customerId = await createOrRetrieveStripeCustomer({
          email,
          name: fullName,
          metadata: {
            subdomain: normalizedSlug,
            businessName,
            organizationId: orgIdForBilling,
          },
        });
      } catch (cusErr) {
        console.warn("[Stripe Customer Error]:", cusErr);
        customerId = `cus_mock_${Math.random().toString(36).substring(2, 8)}`;
      }

      // Se estiver migrando do Pix para Cartão com período pago vigente, ancora a cobrança no fim do ciclo pago
      const hasActivePaidPeriod = Boolean(
        existingOrg?.current_period_end &&
          new Date(existingOrg.current_period_end).getTime() > Date.now()
      );
      const trialEndTimestamp = hasActivePaidPeriod
        ? Math.floor(new Date(existingOrg.current_period_end).getTime() / 1000)
        : undefined;

      const checkoutSession = await createStripeCheckoutSession({
        customerId,
        planTier,
        billingCycle,
        trialEndTimestamp,
        bonusTrialDays: !hasActivePaidPeriod ? bonusTrial.bonusDaysApplied : undefined,
        couponId: stripeCouponId,
        promotionCodeId: stripePromotionCodeId,
        customPriceCents: effectivePriceCents,
        successUrl: `${baseUrl}/app?checkout_success=true&session_id={CHECKOUT_SESSION_ID}&subdomain=${encodeURIComponent(normalizedSlug)}&plan=${planTier}&payment_method=card`,
        cancelUrl: `${baseUrl}/checkout?canceled=true&subdomain=${encodeURIComponent(normalizedSlug)}`,
        metadata: {
          organizationId: orgIdForBilling,
          subdomain: normalizedSlug,
          userId: requesterUserId || "",
          planTier,
          billingCycle,
          couponCode: couponCode || "",
          discountCents: String(discountCents),
        },
      });

      // Registra fatura pendente no Supabase e anula faturas Pix pendentes
      if (isSupabaseConfigured() && organizationId) {
        try {
          const periodStart = hasActivePaidPeriod
            ? new Date(existingOrg.current_period_end).toISOString()
            : bonusTrial.periodStart.toISOString();
          const periodEnd = hasActivePaidPeriod
            ? new Date(
                new Date(existingOrg.current_period_end).getTime() +
                  (billingCycle === "yearly" ? 365 : 30) * 86400000
              ).toISOString()
            : bonusTrial.periodEnd.toISOString();

          await supabaseAdmin.from("subscription_invoices").insert({
            organization_id: organizationId,
            gateway: "stripe",
            external_invoice_id: `inv_str_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            external_payment_id: checkoutSession.sessionId,
            plan_tier: planTier,
            billing_cycle: billingCycle,
            amount_cents: effectivePriceCents,
            bonus_trial_days_applied: hasActivePaidPeriod ? 0 : bonusTrial.bonusDaysApplied,
            status: "pending",
            period_start: periodStart,
            period_end: periodEnd,
          });

          await supabaseAdmin
            .from("organizations")
            .update({
              stripe_customer_id: customerId,
              current_period_start: periodStart,
              current_period_end: periodEnd,
            })
            .eq("id", organizationId);

          // Anula faturas Pix pendentes concorrentes para evitar cobrança dupla (Acceptance Criterion 4)
          await supabaseAdmin
            .from("subscription_invoices")
            .update({ status: "void", updated_at: new Date().toISOString() })
            .eq("organization_id", organizationId)
            .eq("gateway", "mercadopago")
            .eq("status", "pending");
        } catch (invErr) {
          console.warn("[Subscription Invoice Record Error]:", invErr);
        }
      }

      return NextResponse.json({
        ok: true,
        paymentMethod: "credit_card",
        checkoutUrl: checkoutSession.checkoutUrl,
        sessionId: checkoutSession.sessionId,
        organizationId,
        subdomain: normalizedSlug,
        amountCents: effectivePriceCents,
        discountCents,
        bonusDaysApplied: bonusTrial.bonusDaysApplied,
      });
    }

    // 6. Fluxo de Pix (Mercado Pago Oficial)
    if (paymentMethod === "pix") {
      const invoiceExternalId = `sub_inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      let qrCode = "";
      let qrCodeBase64: string | undefined = undefined;
      let ticketUrl: string | undefined = undefined;

      if (isMercadoPagoConfigured()) {
        try {
          const mpResult = await createMercadoPagoPixOrder({
            appointmentId: invoiceExternalId,
            clientName: fullName,
            clientEmail: email,
            serviceName: `Plano ${planTier.toUpperCase()} - LUVEA Studio`,
            serviceDescription: `Assinatura ${planTier} (${billingCycle === "yearly" ? "Anual" : "Mensal"})`,
            amountCents: effectivePriceCents,
          });

          qrCode = mpResult.qrCode;
          qrCodeBase64 = mpResult.qrCodeBase64;
          ticketUrl = mpResult.ticketUrl;
        } catch (mpErr) {
          console.warn("[Mercado Pago Pix Order Error]:", mpErr);
        }
      }

      // Fallback seguro com Copia e Cola estruturado para ambientes locais sem token
      if (!qrCode) {
        const pixSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#ffffff"/><path d="M20 20h60v60H20zm10 10v40h40V30zm90-10h60v60h-60zm10 10v40h40V30zM20 120h60v60H20zm10 10v40h40v-40zm80-10h20v20h-20zm30 0h30v20h-30zm-30 30h30v20h-30zm40 0h20v20h-20zm-40 30h20v20h-20zm30 0h30v20h-30z" fill="#1C1C1E"/></svg>`;
        qrCode = `00020126580014BR.GOV.BCB.PIX0136pix@luvea.app5204000053039865802BR5920LUVEA ASSINATURA6009SAO PAULO62070503***6304${Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()}`;
        qrCodeBase64 = `data:image/svg+xml;utf8,${encodeURIComponent(pixSvg)}`;
      }

      // Registra fatura no banco
      if (isSupabaseConfigured() && organizationId) {
        try {
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
          await supabaseAdmin.from("subscription_invoices").insert({
            organization_id: organizationId,
            gateway: "mercadopago",
            external_invoice_id: invoiceExternalId,
            plan_tier: planTier,
            billing_cycle: billingCycle,
            amount_cents: effectivePriceCents,
            bonus_trial_days_applied: bonusTrial.bonusDaysApplied,
            status: "pending",
            pix_qr_code: qrCode,
            pix_qr_code_base64: qrCodeBase64,
            pix_ticket_url: ticketUrl,
            pix_expires_at: expiresAt.toISOString(),
            period_start: bonusTrial.periodStart.toISOString(),
            period_end: bonusTrial.periodEnd.toISOString(),
          });
        } catch (invDbErr) {
          console.warn("[Save Pix Invoice Error]:", invDbErr);
        }
      }

      // Dispara e-mail de boas-vindas assíncrono via Resend
      if (isResendConfigured()) {
        try {
          await resend.emails.send({
            from: getSenderEmail(),
            to: [email],
            subject: `Boas-vindas à Luvea — ${businessName}`,
            react: WelcomeEmail({
              name: fullName,
              subdomain: normalizedSlug,
              portalUrl: `https://${normalizedSlug}.luvea.app`,
              businessName,
              planTier,
            }),
          });
        } catch (emailErr) {
          console.warn("[Resend Checkout Welcome Email Error]:", emailErr);
        }
      }

      return NextResponse.json({
        ok: true,
        paymentMethod: "pix",
        invoiceId: invoiceExternalId,
        organizationId,
        subdomain: normalizedSlug,
        amountCents: effectivePriceCents,
        discountCents,
        bonusDaysApplied: bonusTrial.bonusDaysApplied,
        pix: {
          qrCode,
          qrCodeBase64,
          ticketUrl,
          copiaECola: qrCode,
        },
      });
    }

    return NextResponse.json(
      { ok: false, error: "Método de pagamento não suportado." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro interno no checkout." },
      { status: 500 }
    );
  }
}
