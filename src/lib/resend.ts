import { Resend } from "resend";

/**
 * Singleton do cliente Resend para evitar múltiplas instâncias em Next.js Serverless.
 */
const apiKey = process.env.RESEND_API_KEY?.trim() || "";

// Se a chave não estiver presente em desenvolvimento ou testes, usa fallback seguro para não quebrar inicialização
export const resend = new Resend(apiKey || "re_mock_development_key");

/**
 * Verifica se o Resend está devidamente configurado com uma chave de API válida.
 */
export function isResendConfigured(): boolean {
  return Boolean(apiKey && apiKey.startsWith("re_") && apiKey !== "re_mock_development_key");
}

/**
 * Retorna o remetente oficial configurado para a marca Luvea.
 */
export function getSenderEmail(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || "Luvea Studio <no-reply@luvea.app>";
}

/**
 * URL base oficial da aplicação.
 */
export function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://luvea.app";
}
