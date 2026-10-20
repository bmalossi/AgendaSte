import { NextResponse } from "next/server";
import { resend, getSenderEmail, isResendConfigured, getAppBaseUrl } from "@/lib/resend";
import { WelcomeEmail, ResetPasswordEmail } from "@/emails";

/**
 * Endpoint de Hook de E-mail do Supabase Auth (Send Email Hook / Custom Mailer).
 * Intercepta chamadas de signup, recovery (esqueci a senha) e magic link,
 * enviando templates exclusivos de alto luxo da Luvea via Resend.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, email_data } = body;

    if (!user?.email || !email_data?.email_action_type) {
      return NextResponse.json(
        { error: "Payload inválido para webhook de e-mail do Supabase." },
        { status: 400 }
      );
    }

    const email = user.email as string;
    const actionType = email_data.email_action_type as string;
    const tokenHash = email_data.token_hash || email_data.token || "";
    const siteUrl = email_data.site_url || getAppBaseUrl();
    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email.split("@")[0] ||
      "Profissional";
    const subdomain = user.user_metadata?.subdomain || "meuestudio";
    const businessName = user.user_metadata?.business_name || "Seu Estúdio";

    let subject = "Notificação de Segurança Luvea";
    let reactTemplate: React.ReactElement | null = null;

    if (actionType === "recovery") {
      // Link seguro para a tela de redefinição de senha
      const redirectBase = email_data.redirect_to || `${siteUrl}/redefinir-senha`;
      const resetUrl = `${redirectBase}?token_hash=${encodeURIComponent(
        tokenHash
      )}&type=recovery`;

      subject = "Redefinição de Senha — Luvea";
      reactTemplate = ResetPasswordEmail({
        name: userName,
        resetUrl,
        expiresInMinutes: 60,
      });
    } else if (actionType === "signup" || actionType === "invite") {
      // Link seguro de confirmação de cadastro
      const redirectBase = email_data.redirect_to || `${siteUrl}/auth/callback`;
      const portalUrl = `https://${subdomain}.luvea.app`;

      subject = `Boas-vindas à Luvea — ${businessName}`;
      reactTemplate = WelcomeEmail({
        name: userName,
        subdomain,
        portalUrl,
        businessName,
        planTier: user.user_metadata?.plan_tier || "gold",
      });
    } else if (actionType === "magiclink") {
      const redirectBase = email_data.redirect_to || `${siteUrl}/auth/callback`;
      const magicUrl = `${redirectBase}?token_hash=${encodeURIComponent(
        tokenHash
      )}&type=magiclink`;

      subject = "Seu link de acesso instantâneo — Luvea";
      reactTemplate = ResetPasswordEmail({
        name: userName,
        resetUrl: magicUrl,
        expiresInMinutes: 15,
      });
    }

    if (!reactTemplate) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Se o Resend não estiver conectado com chave real, simula sucesso
    if (!isResendConfigured()) {
      return NextResponse.json({
        ok: true,
        simulated: true,
        actionType,
        recipient: email,
      });
    }

    const { data, error } = await resend.emails.send({
      from: getSenderEmail(),
      to: [email],
      subject,
      react: reactTemplate,
    });

    if (error) {
      console.error("[Resend Auth Hook Error]", error);
      return NextResponse.json(
        { error: error.message || "Erro no envio via Resend" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: data?.id,
    });
  } catch (err: any) {
    console.error("[Resend Auth Hook Unexpected]", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao processar envio de e-mail do Supabase" },
      { status: 500 }
    );
  }
}
