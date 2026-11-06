/**
 * Normalização, validação e governança de subdomínios oficiais da Luvea (*.luvea.app).
 */

export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  "admin",
  "administrator",
  "api",
  "app",
  "auth",
  "billing",
  "checkout",
  "dashboard",
  "dev",
  "help",
  "internal",
  "login",
  "cadastro",
  "mail",
  "portal",
  "preview",
  "root",
  "site",
  "status",
  "suporte",
  "system",
  "terms",
  "termos",
  "tv",
  "webhook",
  "webhooks",
  "www",
  "luvea",
  "agendaste",
  "staging",
  "prod",
  "assets",
  "static",
  "cdn",
]);

/**
 * Converte qualquer string em slug canônico de subdomínio:
 * - Converte para minúsculas
 * - Remove acentos e caracteres diacríticos
 * - Converte caracteres não alfanuméricos em hífens
 * - Remove hífens duplicados e hífens nas extremidades
 */
export function normalizeSubdomain(value: string): string {
  return (value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface SubdomainValidationResult {
  valid: boolean;
  normalized: string;
  reason?: "empty" | "too_short" | "too_long" | "invalid_format" | "reserved";
  message?: string;
}

/**
 * Validação de formato e regras de nomenclatura de subdomínio.
 */
export function validateSubdomainFormat(value: string): SubdomainValidationResult {
  const normalized = normalizeSubdomain(value);

  if (!normalized) {
    return {
      valid: false,
      normalized: "",
      reason: "empty",
      message: "Informe o subdomínio desejado.",
    };
  }

  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return {
      valid: false,
      normalized,
      reason: "reserved",
      message: "Este subdomínio é reservado pela plataforma.",
    };
  }

  if (normalized.length < 3) {
    return {
      valid: false,
      normalized,
      reason: "too_short",
      message: "O subdomínio deve ter pelo menos 3 caracteres.",
    };
  }

  if (normalized.length > 30) {
    return {
      valid: false,
      normalized,
      reason: "too_long",
      message: "O subdomínio deve ter no máximo 30 caracteres.",
    };
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      reason: "invalid_format",
      message: "Use apenas letras minúsculas, números e hífens.",
    };
  }

  return {
    valid: true,
    normalized,
  };
}
