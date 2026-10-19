/**
 * Legal Configuration Module for AgendaSte
 * Centralizes corporate data, legal counsel placeholders, and DPO contacts
 * for Terms of Use and Privacy Policy (LGPD).
 */

export interface LegalCompanyConfig {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  enderecoCompleto: string;
  cidadeEstadoForo: string;
  emailSuporte: string;
  emailEncarregadoDpo: string;
  dataVigencia: string;
  versaoDocumento: string;
}

/**
 * Default company legal data.
 * Missing/unfilled fields are left as empty strings, which render as [a preencher]
 * and block final production publication until legal counsel review.
 */
export const DEFAULT_LEGAL_CONFIG: LegalCompanyConfig = {
  razaoSocial: process.env.NEXT_PUBLIC_LEGAL_RAZAO_SOCIAL || "",
  nomeFantasia: "AgendaSte",
  cnpj: process.env.NEXT_PUBLIC_LEGAL_CNPJ || "",
  enderecoCompleto: process.env.NEXT_PUBLIC_LEGAL_ENDERECO || "",
  cidadeEstadoForo:
    process.env.NEXT_PUBLIC_LEGAL_FORO || "São Paulo - SP",
  emailSuporte:
    process.env.NEXT_PUBLIC_LEGAL_EMAIL_SUPORTE || "suporte@agendaste.com.br",
  emailEncarregadoDpo:
    process.env.NEXT_PUBLIC_LEGAL_DPO_EMAIL || "privacidade@agendaste.com.br",
  dataVigencia: "19 de outubro de 2026",
  versaoDocumento: "1.0",
};

export const REQUIRED_LEGAL_FIELDS: (keyof LegalCompanyConfig)[] = [
  "razaoSocial",
  "cnpj",
  "enderecoCompleto",
  "cidadeEstadoForo",
  "emailSuporte",
  "emailEncarregadoDpo",
  "dataVigencia",
];

/**
 * Returns an array of keys that are missing, empty, or only whitespace.
 * A non-empty list serves as a pre-launch publication gate.
 */
export function getPendingLegalFields(
  config: Partial<LegalCompanyConfig> = DEFAULT_LEGAL_CONFIG
): string[] {
  const pending: string[] = [];

  for (const field of REQUIRED_LEGAL_FIELDS) {
    const val = config[field];
    if (!val || typeof val !== "string" || val.trim().length === 0) {
      pending.push(field);
    }
  }

  return pending;
}

/**
 * Helper to display legal text or a highlighted placeholder when missing.
 */
export function formatLegalValue(
  value: string | undefined | null,
  fallbackLabel: string = "a preencher"
): string {
  if (value && typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return `[${fallbackLabel}]`;
}
