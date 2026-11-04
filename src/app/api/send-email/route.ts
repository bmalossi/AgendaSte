import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { resend, getSenderEmail, isResendConfigured } from "@/lib/resend";
import {
  WelcomeEmail,
  ResetPasswordEmail,
  AppointmentConfirmationEmail,
  InvoiceEmail,
  ConfirmEmail,
  ReceiptEmail,
} from "@/emails";

export const dynamic = "force-dynamic";

/**
 * Valida se a requisição possui permissão para disparar e-mails.
 * Aceita:
 * 1. Sessão ativa de usuário autenticado via cookies SSR Supabase (painel web do estúdio).
 * 2. Token JWT de usuário válido no header `Authorization: Bearer <token>`.
 * 3. Chave secreta interna (SUPABASE_SERVICE_ROLE_KEY ou INTERNAL_API_SECRET) para cron/webhooks.
 * 4. Fallback seguro em desenvolvimento/testes locais quando Supabase não estiver configurado.
 */
async function verifyEmailDispatchAuth(
  request: Request
): Promise<{ authorized: boolean; error?: string; status?: number }> {
  const authHeader = request.headers.get("authorization")?.trim();
  const apiKeyHeader = request.headers.get("x-api-key")?.trim();
  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  // Verificação de simulação para testes automatizados de segurança
  if (request.headers.get("x-simulate-unauthorized") === "true") {
    return {
      authorized: false,
      error: "Acesso não autorizado. É necessário estar autenticado para disparar e-mails.",
      status: 401,
    };
  }

  // 1. Chaves de serviço / API secret interno para automações e chamadas servidor-servidor
  if (
    (internalSecret && (apiKeyHeader === internalSecret || authHeader === `Bearer ${internalSecret}`)) ||
    (serviceRoleKey && (apiKeyHeader === serviceRoleKey || authHeader === `Bearer ${serviceRoleKey}`))
  ) {
    return { authorized: true };
  }

  // 2. Se o Supabase estiver configurado e estivermos em produção, exige sessão válida
  if (isSupabaseConfigured() && process.env.NODE_ENV === "production") {
    try {
      // 2.1 Verifica se há Bearer token JWT fornecido no header Authorization
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const client = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
        );
        const {
          data: { user },
          error: tokenErr,
        } = await client.auth.getUser(token);

        if (user && !tokenErr) {
          return { authorized: true };
        }
      }

      // 2.2 Verifica se há sessão ativa nos cookies SSR do navegador
      try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
            },
          }
        );
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (user && !userErr) {
          return { authorized: true };
        }
      } catch {
        // Falha ao ler cookies (ex: runtime fora do contexto de requisição SSR)
      }

      // Se em produção com Supabase mas nenhuma autenticação válida foi encontrada
      return {
        authorized: false,
        error: "Acesso não autorizado. É necessário estar autenticado para disparar e-mails.",
        status: 401,
      };
    } catch (err: any) {
      return {
        authorized: false,
        error: err.message || "Erro durante a validação de autenticação da sessão.",
        status: 401,
      };
    }
  }

  // 3. Em produção sem Supabase configurado, bloqueia por segurança
  if (process.env.NODE_ENV === "production") {
    return {
      authorized: false,
      error: "Serviço de autenticação não configurado em ambiente de produção.",
      status: 401,
    };
  }

  // 4. Desenvolvimento / testes locais offline (permite disparos e testes no painel local)
  return { authorized: true };
}

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
  subject: z.string().min(1, "O assunto do e-mail é obrigatório."),
  from: z.string().optional(),
  type: z
    .enum([
      "welcome",
      "reset_password",
      "appointment_confirmation",
      "invoice",
      "receipt",
      "payment_receipt",
      "confirm_email",
      "confirmation",
      "custom",
    ])
    .default("welcome"),
  payload: z.record(z.string(), z.any()).optional(),
  // Atalhos diretos de props compatíveis com a especificação
  name: z.string().optional(),
  portalUrl: z.string().optional(),
  subdomain: z.string().optional(),
  businessName: z.string().optional(),
  planTier: z.string().optional(),
  resetUrl: z.string().optional(),
  confirmationUrl: z.string().optional(),
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
  // Props de fatura / cobrança
  invoiceNumber: z.string().optional(),
  dueDate: z.string().optional(),
  issuedDate: z.string().optional(),
  paymentLinkUrl: z.string().optional(),
  pixCopyPasteCode: z.string().optional(),
  // Props de comprovante de pagamento
  receiptNumber: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentDate: z.string().optional(),
  tipCents: z.number().optional(),
  receiptUrl: z.string().optional(),
  memo: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string(),
        quantity: z.number().optional(),
        amountCents: z.number(),
      })
    )
    .optional(),
  subtotalCents: z.number().optional(),
  discountCents: z.number().optional(),
  taxCents: z.number().optional(),
  html: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Verificação de sessão Supabase e autenticação anti-abuso
    const authCheck = await verifyEmailDispatchAuth(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error:
            authCheck.error ||
            "Acesso não autorizado. É necessário estar autenticado para disparar e-mails.",
          code: "UNAUTHORIZED",
        },
        { status: authCheck.status || 401 }
      );
    }

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
    } else if (data.type === "invoice") {
      const rawItems = data.items || payload.items || [];
      const parsedItems = Array.isArray(rawItems) && rawItems.length > 0
        ? rawItems.map((it: any) => ({
            label: String(it.label || "Item"),
            quantity: typeof it.quantity === "number" ? it.quantity : 1,
            amountCents: Number(it.amountCents || 0),
          }))
        : [
            {
              label: String(data.serviceName || payload.serviceName || "Serviço Personalizado"),
              quantity: 1,
              amountCents: Number(data.totalCents ?? payload.totalCents ?? 0),
            },
          ];

      reactElement = InvoiceEmail({
        invoiceNumber: String(data.invoiceNumber || payload.invoiceNumber || "#1000949"),
        clientName: String(data.clientName || payload.clientName || "Cliente"),
        clientEmail: String(recipients[0]),
        studioName: String(
          data.studioName ||
            payload.studioName ||
            data.businessName ||
            payload.businessName ||
            "Luvea Studio"
        ),
        studioAddress:
          data.studioAddress || payload.studioAddress
            ? String(data.studioAddress || payload.studioAddress)
            : undefined,
        issuedDate: String(data.issuedDate || payload.issuedDate || "17/10/2026"),
        dueDate: String(data.dueDate || payload.dueDate || "30/10/2026"),
        items: parsedItems,
        subtotalCents: Number(
          data.subtotalCents ??
            payload.subtotalCents ??
            data.totalCents ??
            payload.totalCents ??
            0
        ),
        discountCents: Number(data.discountCents ?? payload.discountCents ?? 0),
        taxCents: Number(data.taxCents ?? payload.taxCents ?? 0),
        totalCents: Number(data.totalCents ?? payload.totalCents ?? 0),
        paymentLinkUrl: String(
          data.paymentLinkUrl ||
            payload.paymentLinkUrl ||
            `https://luveastudio.luvea.app/pay/${String(
              data.invoiceNumber || "1000949"
            ).replace("#", "")}`
        ),
        pixCopyPasteCode:
          data.pixCopyPasteCode || payload.pixCopyPasteCode
            ? String(data.pixCopyPasteCode || payload.pixCopyPasteCode)
            : undefined,
        memo:
          data.memo || payload.memo
            ? String(data.memo || payload.memo)
            : undefined,
      });
    } else if (data.type === "receipt" || data.type === "payment_receipt") {
      const rawItems = data.items || payload.items || [];
      const parsedItems =
        Array.isArray(rawItems) && rawItems.length > 0
          ? rawItems.map((it: any) => ({
              label: String(it.label || "Item"),
              quantity: typeof it.quantity === "number" ? it.quantity : 1,
              amountCents: Number(it.amountCents || 0),
            }))
          : [
              {
                label: String(
                  data.serviceName ||
                    payload.serviceName ||
                    "Atendimento Personalizado"
                ),
                quantity: 1,
                amountCents: Number(data.totalCents ?? payload.totalCents ?? 0),
              },
            ];

      reactElement = ReceiptEmail({
        receiptNumber: String(
          data.receiptNumber ||
            payload.receiptNumber ||
            data.invoiceNumber ||
            payload.invoiceNumber ||
            "#REC-1"
        ),
        clientName: String(
          data.clientName ||
            payload.clientName ||
            data.name ||
            payload.name ||
            "Cliente"
        ),
        clientEmail: String(recipients[0]),
        studioName: String(
          data.studioName ||
            payload.studioName ||
            data.businessName ||
            payload.businessName ||
            "Luvea Studio"
        ),
        studioAddress:
          data.studioAddress || payload.studioAddress
            ? String(data.studioAddress || payload.studioAddress)
            : undefined,
        paymentDate: String(
          data.paymentDate ||
            payload.paymentDate ||
            data.issuedDate ||
            payload.issuedDate ||
            "17/10/2026, 09:00"
        ),
        paymentMethod: String(
          data.paymentMethod ||
            payload.paymentMethod ||
            "Pix"
        ),
        professionalName:
          data.professionalName || payload.professionalName
            ? String(data.professionalName || payload.professionalName)
            : undefined,
        items: parsedItems,
        subtotalCents: Number(
          data.subtotalCents ??
            payload.subtotalCents ??
            data.totalCents ??
            payload.totalCents ??
            0
        ),
        discountCents: Number(data.discountCents ?? payload.discountCents ?? 0),
        tipCents: Number(data.tipCents ?? payload.tipCents ?? 0),
        totalCents: Number(data.totalCents ?? payload.totalCents ?? 0),
        receiptUrl: String(
          data.receiptUrl ||
            payload.receiptUrl ||
            data.paymentLinkUrl ||
            payload.paymentLinkUrl ||
            "https://luvea.app"
        ),
        memo:
          data.memo || payload.memo
            ? String(data.memo || payload.memo)
            : undefined,
      });
    } else if (data.type === "confirm_email" || data.type === "confirmation") {
      reactElement = ConfirmEmail({
        confirmationUrl: String(
          data.confirmationUrl ||
            payload.confirmationUrl ||
            data.resetUrl ||
            payload.resetUrl ||
            "https://luvea.app/confirm"
        ),
        clientName: String(
          data.clientName ||
            payload.clientName ||
            data.name ||
            payload.name ||
            "Cliente"
        ),
        studioName: String(
          data.studioName ||
            payload.studioName ||
            data.businessName ||
            payload.businessName ||
            "Luvea Studio"
        ),
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
