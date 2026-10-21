import { NextResponse } from "next/server";
import { z } from "zod";
import { resend, getSenderEmail, isResendConfigured } from "@/lib/resend";
import {
  WelcomeEmail,
  ResetPasswordEmail,
  AppointmentConfirmationEmail,
} from "@/emails";

export const dynamic = "force-dynamic";

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
  subject: z.string().min(1, "O assunto do e-mail é obrigatório."),
  from: z.string().optional(),
  type: z.enum(["welcome", "reset_password", "appointment_confirmation", "custom"]).default("welcome"),
  payload: z.record(z.string(), z.any()).optional(),
  // Atalhos diretos de props compatíveis com a especificação
  name: z.string().optional(),
  portalUrl: z.string().optional(),
  subdomain: z.string().optional(),
  businessName: z.string().optional(),
  planTier: z.string().optional(),
  resetUrl: z.string().optional(),
  expiresInMinutes: z.number().optional(),
  clientName: z.string().optional(),
  studioName: z.string().optional(),
  serviceName: z.string().optional(),
  professionalName: z.string().optional(),
  formattedDate: z.string().optional(),
  formattedTime: z.string().optional(),
  depositCents: z.number().optional(),
  totalCents: z.number().optional(),
  studioAddress: z.string().optional(),
  manageBookingUrl: z.string().optional(),
  html: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parseResult = sendEmailSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos para envio de e-mail.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const recipients = Array.isArray(data.to) ? data.to : [data.to];
    const fromAddress = data.from?.trim() || getSenderEmail();

    // Seleciona o template correspondente
    let reactElement: React.ReactElement | null = null;
    const payload = (data.payload || {}) as Record<string, any>;

    if (data.type === "welcome") {
      reactElement = WelcomeEmail({
        name: String(data.name || payload.name || "Profissional"),
        subdomain: String(data.subdomain || payload.subdomain || "meuestudio"),
        portalUrl: (data.portalUrl || payload.portalUrl) ? String(data.portalUrl || payload.portalUrl) : undefined,
        businessName: String(data.businessName || payload.businessName || "Seu Estúdio"),
        planTier: String(data.planTier || payload.planTier || "gold"),
      });
    } else if (data.type === "reset_password") {
      reactElement = ResetPasswordEmail({
        name: String(data.name || payload.name || "Usuário"),
        resetUrl: String(data.resetUrl || payload.resetUrl || "https://luvea.app/redefinir-senha"),
        expiresInMinutes: Number(data.expiresInMinutes || payload.expiresInMinutes || 60),
      });
    } else if (data.type === "appointment_confirmation") {
      reactElement = AppointmentConfirmationEmail({
        clientName: String(data.clientName || payload.clientName || "Cliente"),
        studioName: String(data.studioName || payload.studioName || "Studio de Beleza"),
        serviceName: String(data.serviceName || payload.serviceName || "Atendimento Personalizado"),
        professionalName: String(data.professionalName || payload.professionalName || "Especialista"),
        formattedDate: String(data.formattedDate || payload.formattedDate || "A confirmar"),
        formattedTime: String(data.formattedTime || payload.formattedTime || "00:00"),
        depositCents: Number(data.depositCents ?? payload.depositCents ?? 0),
        totalCents: Number(data.totalCents ?? payload.totalCents ?? 0),
        studioAddress: (data.studioAddress || payload.studioAddress) ? String(data.studioAddress || payload.studioAddress) : undefined,
        manageBookingUrl: (data.manageBookingUrl || payload.manageBookingUrl) ? String(data.manageBookingUrl || payload.manageBookingUrl) : undefined,
      });
    }

    // Se o Resend não estiver configurado (ambiente local de desenvolvimento ou testes)
    if (!isResendConfigured()) {
      const mockId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      return NextResponse.json({
        success: true,
        simulated: true,
        data: { id: mockId },
        to: recipients,
        subject: data.subject,
        message: "E-mail simulado com sucesso (RESEND_API_KEY pendente no ambiente).",
      });
    }

    // Envio real através da API do Resend
    const sendOptions: any = {
      from: fromAddress,
      to: recipients,
      subject: data.subject,
    };

    if (reactElement) {
      sendOptions.react = reactElement;
    } else if (data.html) {
      sendOptions.html = data.html;
    }

    const { data: resendData, error: resendError } = await resend.emails.send(sendOptions);

    if (resendError) {
      return NextResponse.json(
        {
          success: false,
          error: resendError.message || "Erro retornado pelo serviço Resend.",
          code: resendError.name,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resendData,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Erro interno ao processar disparo de e-mail.",
      },
      { status: 500 }
    );
  }
}
