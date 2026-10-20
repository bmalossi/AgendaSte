import { z } from "zod";

/**
 * Normaliza e valida um slug de subdomínio para estúdios (ex: "espaco-uniko").
 */
export function normalizeSubdomain(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Validação simplificada de CPF/CNPJ (apenas dígitos válidos).
 */
export function isValidCpfCnpj(val: string): boolean {
  const digits = val.replace(/\D/g, "");
  return digits.length === 11 || digits.length === 14;
}

export const checkoutFormSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Nome completo deve ter pelo menos 3 caracteres.")
      .max(100, "Nome muito longo."),
    email: z.string().email("E-mail corporativo ou pessoal inválido."),
    whatsapp: z
      .string()
      .min(10, "Informe o WhatsApp com DDD.")
      .regex(/^[\d\s()+-]+$/, "Formato de telefone inválido."),
    cpfCnpj: z
      .string()
      .min(11, "Informe um CPF ou CNPJ válido.")
      .refine(isValidCpfCnpj, "CPF (11 dígitos) ou CNPJ (14 dígitos) inválido."),
    businessName: z
      .string()
      .min(2, "Nome do estúdio deve ter pelo menos 2 caracteres.")
      .max(80, "Nome do estúdio muito longo."),
    subdomain: z
      .string()
      .min(3, "O subdomínio deve ter pelo menos 3 caracteres.")
      .max(30, "Subdomínio muito longo (máximo 30 caracteres).")
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        "Subdomínio pode conter apenas letras minúsculas, números e hífens."
      ),
    planTier: z.enum(["essencial", "gold", "platinum"]),
    billingCycle: z.enum(["monthly", "yearly"]),
    paymentMethod: z.enum(["credit_card", "pix"]),
    // Campos condicionais para cartão de crédito
    cardNumber: z.string().optional(),
    cardName: z.string().optional(),
    cardExp: z.string().optional(),
    cardCvc: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "credit_card") {
      const cardClean = (data.cardNumber || "").replace(/\D/g, "");
      if (cardClean.length < 13 || cardClean.length > 19) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cardNumber"],
          message: "Número de cartão de crédito inválido.",
        });
      }
      if (!data.cardName || data.cardName.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cardName"],
          message: "Nome impresso no cartão é obrigatório.",
        });
      }
      if (!data.cardExp || !/^\d{2}\/\d{2}$/.test(data.cardExp)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cardExp"],
          message: "Validade inválida (use MM/AA).",
        });
      }
      if (!data.cardCvc || data.cardCvc.replace(/\D/g, "").length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cardCvc"],
          message: "CVC deve ter 3 ou 4 dígitos.",
        });
      }
    }
  });

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const magicLinkSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

export type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

export const cadastroSchema = z
  .object({
    fullName: z.string().min(3, "Nome completo é obrigatório."),
    email: z.string().email("E-mail corporativo ou pessoal inválido."),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula.")
      .regex(/[0-9]/, "A senha deve conter ao menos um número."),
    confirmPassword: z.string(),
    businessName: z.string().min(2, "Nome do seu negócio é obrigatório."),
    subdomain: z
      .string()
      .min(3, "Subdomínio deve ter no mínimo 3 caracteres.")
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        "Subdomínio pode conter apenas letras minúsculas, números e hífens."
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type CadastroFormData = z.infer<typeof cadastroSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula.")
      .regex(/[0-9]/, "A senha deve conter ao menos um número."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Calcula a pontuação de força de uma senha (0 a 4).
 */
export function calculatePasswordStrength(pass: string): {
  score: number;
  label: "Fraca" | "Razoável" | "Boa" | "Excelente";
  colorClass: string;
} {
  if (!pass) {
    return { score: 0, label: "Fraca", colorClass: "bg-zinc-200" };
  }

  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass) || pass.length >= 12) score++;

  switch (score) {
    case 1:
      return { score: 1, label: "Fraca", colorClass: "bg-amber-400" };
    case 2:
      return { score: 2, label: "Razoável", colorClass: "bg-amber-500" };
    case 3:
      return { score: 3, label: "Boa", colorClass: "bg-emerald-500" };
    case 4:
      return { score: 4, label: "Excelente", colorClass: "bg-emerald-600" };
    default:
      return { score: 0, label: "Fraca", colorClass: "bg-zinc-200" };
  }
}
