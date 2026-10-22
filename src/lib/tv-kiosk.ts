// =============================================================================
// LUVEA TV KIOSK — MOTOR DE DOMÍNIO PURO & CONTRATOS (ANTI-AI SLOP)
// Vocabulário canônico alinhado a CONTEXT.md, ADR-0004 e Impeccable Design
// =============================================================================

export type TVAppointmentStatus =
  | "in_progress"
  | "next"
  | "delayed"
  | "completed"
  | "waiting";

export interface TVAppointmentDTO {
  id: string;
  startTime: string; // "14:00"
  endTime: string; // "15:30"
  clientName: string; // "Mariana O." (LGPD-safe)
  serviceName: string; // "Corte + Escova"
  status: TVAppointmentStatus;
  professionalId: string;
  professionalName: string;
}

export interface TVProfessionalColumn {
  id: string;
  name: string;
  appointments: TVAppointmentDTO[];
}

export interface TVPollingResponse {
  organizationName: string;
  logoUrl: string | null;
  timezone: string;
  professionals: TVProfessionalColumn[];
  serverTime: string; // ISO 8601
}

export interface RawTVAppointment {
  id: string;
  professional_id: string;
  client_name?: string | null;
  service_name?: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
}

export interface RawTVProfessional {
  id: string;
  name: string;
}

export interface RawTVOrganization {
  id: string;
  name: string;
  settings?: {
    logo_url?: string | null;
    timezone?: string;
    [key: string]: unknown;
  } | null;
}

export interface TVPairingRecord {
  id: string;
  code: string;
  organization_id: string | null;
  device_name: string;
  status: "PENDING" | "AUTHORIZED" | "EXPIRED" | "REVOKED";
  token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Armazenamento em memória para ambiente local de desenvolvimento / fallback
const memoryPairings = new Map<string, TVPairingRecord>();

export function getMemoryPairing(code: string): TVPairingRecord | undefined {
  return memoryPairings.get(code);
}

export function setMemoryPairing(code: string, record: TVPairingRecord): void {
  memoryPairings.set(code, record);
}

export function getAllMemoryPairings(): TVPairingRecord[] {
  return Array.from(memoryPairings.values());
}

export function cleanupExpiredMemoryPairings(now: Date = new Date()): void {
  const nowTime = now.getTime();
  for (const [code, record] of memoryPairings.entries()) {
    if (
      record.status === "PENDING" &&
      new Date(record.expires_at).getTime() < nowTime
    ) {
      record.status = "EXPIRED";
      record.updated_at = now.toISOString();
    }
  }
}

// Rate limiting em memória por IP (10 requisições / minuto)
const IP_RATE_LIMITS = new Map<string, number[]>();

export function checkPairRateLimit(
  ip: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const timestamps = (IP_RATE_LIMITS.get(ip) || []).filter(
    (t) => now - t < windowMs
  );
  if (timestamps.length >= maxRequests) {
    return false;
  }
  timestamps.push(now);
  IP_RATE_LIMITS.set(ip, timestamps);
  return true;
}

export function resetPairRateLimits(): void {
  IP_RATE_LIMITS.clear();
}

const BRAZILIAN_PREPOSITIONS = new Set([
  "da",
  "de",
  "do",
  "das",
  "dos",
  "e",
  "d'",
  "di",
]);

/**
 * Mascara o nome do cliente em conformidade estrita com a LGPD para exibição
 * em TVs e monitores públicos de recepção (ex: "Mariana da Silva Oliveira" -> "Mariana O.").
 * Pula preposições brasileiras comuns na identificação do sobrenome.
 */
export function maskNameLGPD(fullName?: string | null): string {
  if (!fullName || typeof fullName !== "string") {
    return "Cliente";
  }

  const tokens = fullName
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  if (tokens.length === 0) {
    return "Cliente";
  }

  if (tokens.length === 1) {
    return tokens[0];
  }

  const firstName = tokens[0];

  // Procura de trás para frente o último token que não seja uma preposição
  let targetLastName = "";
  for (let i = tokens.length - 1; i >= 1; i--) {
    const candidate = tokens[i].toLowerCase();
    if (!BRAZILIAN_PREPOSITIONS.has(candidate)) {
      targetLastName = tokens[i];
      break;
    }
  }

  // Se todos os tokens subsequentes forem preposições, pega o segundo token
  if (!targetLastName && tokens.length > 1) {
    targetLastName = tokens[1];
  }

  if (!targetLastName) {
    return firstName;
  }

  const initial = targetLastName.charAt(0).toUpperCase();
  return `${firstName} ${initial}.`;
}

/**
 * Gera um código numérico de 6 dígitos para pareamento de TV (ex: "892437").
 */
export function generatePairingCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

/**
 * Deriva o status visual do agendamento para o TV Kiosk via lógica temporal.
 * Não altera nem exige novos status no banco de dados.
 */
export function deriveAppointmentStatus(
  appointment: { starts_at: string; ends_at: string; status: string },
  now: Date = new Date()
): TVAppointmentStatus {
  if (appointment.status === "completed") {
    return "completed";
  }

  if (appointment.status === "pending") {
    return "waiting";
  }

  const startsMs = new Date(appointment.starts_at).getTime();
  const endsMs = new Date(appointment.ends_at).getTime();
  const nowMs = now.getTime();

  if (nowMs >= endsMs) {
    return "delayed";
  }

  if (nowMs >= startsMs && nowMs < endsMs) {
    return "in_progress";
  }

  return "next";
}

/**
 * Filtra agendamentos irrelevantes para a TV pública (remove cancelados e no-shows).
 */
export function filterTVAppointments<T extends { status: string }>(
  appointments: T[]
): T[] {
  return appointments.filter(
    (apt) => apt.status !== "canceled" && apt.status !== "no_show"
  );
}

/**
 * Divide a lista de profissionais em páginas com limite de colunas para rotação automática em Smart TVs.
 */
export function paginateProfessionals<T>(
  professionals: T[],
  maxPerPage: number = 5
): T[][] {
  if (!professionals || professionals.length === 0) {
    return [];
  }

  if (professionals.length <= maxPerPage) {
    return [professionals];
  }

  const pages: T[][] = [];
  for (let i = 0; i < professionals.length; i += maxPerPage) {
    pages.push(professionals.slice(i, i + maxPerPage));
  }
  return pages;
}

/**
 * Formata um timestamp ISO em horário local HH:MM no fuso horário informado.
 */
export function formatTimeInTimezone(
  dateIso: string,
  timezone: string = "America/Sao_Paulo"
): string {
  try {
    const date = new Date(dateIso);
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    // Fallback defensivo se fuso for inválido
    const date = new Date(dateIso);
    return date.toISOString().substring(11, 16);
  }
}

/**
 * Transforma dados brutos do Supabase no contrato oficial TVPollingResponse.
 */
export function buildTVPollingResponse(
  rawAppointments: RawTVAppointment[],
  professionals: RawTVProfessional[],
  org: RawTVOrganization,
  now: Date = new Date()
): TVPollingResponse {
  const timezone =
    typeof org.settings?.timezone === "string" && org.settings.timezone.trim()
      ? org.settings.timezone.trim()
      : "America/Sao_Paulo";

  const logoUrl =
    typeof org.settings?.logo_url === "string" ? org.settings.logo_url : null;

  const validAppointments = filterTVAppointments(rawAppointments);

  // Mapeia profissionais criando as colunas
  const profColumns: TVProfessionalColumn[] = professionals.map((prof) => {
    const profApts = validAppointments
      .filter((apt) => apt.professional_id === prof.id)
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      )
      .map((apt): TVAppointmentDTO => {
        return {
          id: apt.id,
          startTime: formatTimeInTimezone(apt.starts_at, timezone),
          endTime: formatTimeInTimezone(apt.ends_at, timezone),
          clientName: maskNameLGPD(apt.client_name),
          serviceName: apt.service_name || "Atendimento",
          status: deriveAppointmentStatus(apt, now),
          professionalId: prof.id,
          professionalName: prof.name,
        };
      });

    return {
      id: prof.id,
      name: prof.name,
      appointments: profApts,
    };
  });

  return {
    organizationName: org.name,
    logoUrl,
    timezone,
    professionals: profColumns,
    serverTime: now.toISOString(),
  };
}
