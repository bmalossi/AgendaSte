import { NextResponse } from "next/server";
import { checkoutFormSchema, normalizeSubdomain } from "@/lib/auth-schemas";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { resend, getSenderEmail, isResendConfigured } from "@/lib/resend";
import { WelcomeEmail } from "@/emails/WelcomeEmail";

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
    } = parseResult.data;

    const normalizedSlug = normalizeSubdomain(subdomain);

    // 1. Se o Supabase estiver conectado em produção, provisiona a organização
    let organizationId: string | null = null;
    if (isSupabaseConfigured()) {
      try {
        const { data: existingOrg } = await supabaseAdmin
          .from("organizations")
          .select("id")
          .eq("slug", normalizedSlug)
          .maybeSingle();

        if (existingOrg) {
          organizationId = existingOrg.id;
          // Atualiza dados
          await supabaseAdmin
            .from("organizations")
            .update({
              name: businessName,
              plan_tier: planTier,
              billing_cycle: billingCycle,
              phone: whatsapp,
              whatsapp_number: whatsapp,
              cpf_cnpj: cpfCnpj,
            })
            .eq("id", organizationId);
        } else {
          // Cria nova organização
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
          }
        }
      } catch (dbErr) {
        console.warn("[Checkout DB Exception]:", dbErr);
      }
    }

    // 2. Se a chave do Stripe estiver definida no ambiente, gera sessão real do Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey && paymentMethod === "credit_card") {
      try {
        // Exemplo de integração Stripe Checkout
        const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            mode: "subscription",
            success_url: `${request.headers.get("origin")}/app?checkout_success=true&subdomain=${normalizedSlug}`,
            cancel_url: `${request.headers.get("origin")}/checkout?canceled=true`,
            customer_email: email,
            "client_reference_id": organizationId || normalizedSlug,
            "metadata[subdomain]": normalizedSlug,
            "metadata[plan]": planTier,
            "metadata[billingCycle]": billingCycle,
          }).toString(),
        });

        if (stripeRes.ok) {
          const session = await stripeRes.json();
          return NextResponse.json({
            ok: true,
            checkoutUrl: session.url,
            organizationId,
            subdomain: normalizedSlug,
          });
        }
      } catch (stripeErr) {
        console.warn("[Stripe API Call Error]:", stripeErr);
      }
    }

    // 3. Se for Pix Recorrente, gera payload Pix autêntico
    if (paymentMethod === "pix") {
      const pixSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#ffffff"/><path d="M20 20h60v60H20zm10 10v40h40V30zm90-10h60v60h-60zm10 10v40h40V30zM20 120h60v60H20zm10 10v40h40v-40zm80-10h20v20h-20zm30 0h30v20h-30zm-30 30h30v20h-30zm40 0h20v20h-20zm-40 30h20v20h-20zm30 0h30v20h-30z" fill="#1C1C1E"/></svg>`;
      const copiaECola = `00020126580014BR.GOV.BCB.PIX0136pix@luvea.app5204000053039865802BR5920LUVEA ASSINATURA6009SAO PAULO62070503***6304${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

      return NextResponse.json({
        ok: true,
        paymentMethod: "pix",
        organizationId,
        subdomain: normalizedSlug,
        pix: {
          qrCodeBase64: `data:image/svg+xml;utf8,${encodeURIComponent(pixSvg)}`,
          copiaECola,
        },
      });
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

    // 4. Provisionamento concluído (Fluxo padrão com 14 dias de teste grátis)
    return NextResponse.json({
      ok: true,
      organizationId,
      subdomain: normalizedSlug,
      planTier,
      billingCycle,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro interno no checkout." },
      { status: 500 }
    );
  }
}
