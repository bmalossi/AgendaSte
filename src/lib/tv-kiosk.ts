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
  startsAt?: string; // ISO 8601
  endsAt?: string; // ISO 8601
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
 * Retorna os limites UTC (ISO) de início e fim do dia para um determinado fuso horário.
 * Evita vazamento de agendamentos da noite anterior ou corte prematuro causado por offset UTC.
 */
export function getDayBoundsInTimezone(
  date: Date = new Date(),
  timezone: string = "America/Sao_Paulo"
): { startOfDayIso: string; endOfDayIso: string; todayYMD: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayYMD = formatter.format(date); // YYYY-MM-DD

  const [year, month, day] = todayYMD.split("-").map(Number);
  const utcRef = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(utcRef);

  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value || "GMT";
  let offsetMinutes = 0;
  const match = tzPart.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (match) {
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const mins = match[3] ? parseInt(match[3], 10) : 0;
    offsetMinutes = sign * (hours * 60 + mins);
  }

  const localMidnightUtcMs =
    Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60000;
  const startOfDay = new Date(localMidnightUtcMs);
  const endOfDay = new Date(localMidnightUtcMs + 24 * 60 * 60 * 1000 - 1);

  return {
    startOfDayIso: startOfDay.toISOString(),
    endOfDayIso: endOfDay.toISOString(),
    todayYMD,
  };
}

/**
 * Filtra agendamentos para a TV pública:
 * - Remove cancelados e no-show.
 * - Quando 'now' é fornecido, remove também agendamentos já concluídos (completed)
 *   e agendamentos anteriores cujo horário de término já expirou (ends_at <= now).
 * Mantém estritamente:
 * 1. Atendimentos em andamento no horário marcado (starts_at <= now < ends_at)
 * 2. Próximos atendimentos do dia (starts_at > now)
 */
export function filterTVAppointments<
  T extends { status: string; ends_at?: string; starts_at?: string }
>(appointments: T[], now?: Date): T[] {
  return appointments.filter((apt) => {
    // 1. Remove cancelados e no-show sempre
    if (apt.status === "canceled" || apt.status === "no_show") {
      return false;
    }

    // 2. Quando filtrando para exibição ativa em tempo real:
    if (now) {
      if (apt.status === "completed") {
        return false;
      }

      if (apt.ends_at) {
        const endsMs = new Date(apt.ends_at).getTime();
        if (!isNaN(endsMs) && endsMs <= now.getTime()) {
          return false;
        }
      }
    }

    return true;
  });
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
 * Por padrão filtra agendamentos anteriores expirados e concluídos, mantendo apenas
 * o atendimento em andamento no horário marcado e os próximos do dia.
 */
export function buildTVPollingResponse(
  rawAppointments: RawTVAppointment[],
  professionals: RawTVProfessional[],
  org: RawTVOrganization,
  now: Date = new Date(),
  options: { filterPast?: boolean } = {}
): TVPollingResponse {
  const timezone =
    typeof org.settings?.timezone === "string" && org.settings.timezone.trim()
      ? org.settings.timezone.trim()
      : "America/Sao_Paulo";

  const logoUrl =
    typeof org.settings?.logo_url === "string" ? org.settings.logo_url : null;

  // Filtra agendamentos anteriores / expirados por padrão
  const shouldFilterPast = options.filterPast !== false;
  const validAppointments = filterTVAppointments(
    rawAppointments,
    shouldFilterPast ? now : undefined
  );

  // Deduplica profissionais por ID ou por nome idêntico normalizado (prevenção contra duplicidades)
  const uniqueProfs: RawTVProfessional[] = [];
  const seenProfIds = new Set<string>();
  const seenProfNames = new Set<string>();
  const profAliasMap = new Map<string, string>(); // duplicateId -> primaryId

  for (const prof of professionals) {
    const normName = prof.name.trim().toLowerCase();
    if (!seenProfIds.has(prof.id) && !seenProfNames.has(normName)) {
      seenProfIds.add(prof.id);
      seenProfNames.add(normName);
      profAliasMap.set(prof.id, prof.id);
      uniqueProfs.push(prof);
    } else {
      const primary = uniqueProfs.find(
        (p) => p.name.trim().toLowerCase() === normName || p.id === prof.id
      );
      if (primary) {
        profAliasMap.set(prof.id, primary.id);
      }
    }
  }

  // Mapeia profissionais criando as colunas
  const profColumns: TVProfessionalColumn[] = uniqueProfs.map((prof) => {
    const profApts = validAppointments
      .filter((apt) => {
        const resolvedId = profAliasMap.get(apt.professional_id) || apt.professional_id;
        return resolvedId === prof.id;
      })
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      )
      .map((apt): TVAppointmentDTO => {
        return {
          id: apt.id,
          startTime: formatTimeInTimezone(apt.starts_at, timezone),
          endTime: formatTimeInTimezone(apt.ends_at, timezone),
          startsAt: apt.starts_at,
          endsAt: apt.ends_at,
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
