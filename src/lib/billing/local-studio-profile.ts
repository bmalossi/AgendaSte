import { normalizeSubdomain } from "../auth-schemas";

/**
 * Perfil mínimo do estúdio lido do cache local do painel (/app).
 * Usado como fallback para que rotas públicas (ex.: /checkout) reconheçam o usuário que já
 * está dentro do painel, mesmo quando a sessão do Supabase ainda não foi resolvida
 * (hidratação) ou quando o painel roda em modo local de pré-visualização.
 */
export interface LocalStudioProfile {
  fullName: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  businessName: string;
  subdomain: string;
}

const USER_CACHE_PREFIX = "luvea_studio_state_v1_";
const DEV_OFFLINE_KEY = "luvea_studio_state_dev_offline";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseStudioProfile(raw: unknown): LocalStudioProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const settings = (raw as any).settings;
  if (!settings || typeof settings !== "object") return null;

  const personal = settings.personal || {};
  const business = settings.business || {};
  const website = settings.website || {};

  const fullName = [asString(personal.firstName), asString(personal.lastName)]
    .filter(Boolean)
    .join(" ");
  const businessName = asString(business.businessName);
  const rawSlug = asString(website.subdomainSlug);
  const subdomain = rawSlug ? normalizeSubdomain(rawSlug) : businessName ? normalizeSubdomain(businessName) : "";

  const profile: LocalStudioProfile = {
    fullName,
    email: asString(personal.email),
    phone: asString(personal.phone),
    cpfCnpj: asString(business.taxIdCnpjCpf),
    businessName,
    subdomain,
  };

  if (!profile.fullName && !profile.businessName && !profile.email) return null;
  return profile;
}

function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
}

function readKey(key: string): LocalStudioProfile | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    return parseStudioProfile(JSON.parse(cached));
  } catch {
    return null;
  }
}

/**
 * Lê o perfil do estúdio do cache local. Com `userId`, usa exclusivamente o cache daquele usuário.
 * Sem `userId`, usa o primeiro cache de usuário encontrado (ou o cache offline apenas em localhost).
 */
export function readLocalStudioProfile(userId?: string | null): LocalStudioProfile | null {
  if (typeof window === "undefined") return null;
  try {
    if (userId) {
      return readKey(`${USER_CACHE_PREFIX}${userId}`);
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(USER_CACHE_PREFIX)) {
        const profile = readKey(key);
        if (profile) return profile;
      }
    }
    if (isLocalHost()) {
      return readKey(DEV_OFFLINE_KEY);
    }
  } catch {
    // localStorage indisponível (modo privado/SSR)
  }
  return null;
}

/**
 * Indica se há um painel de estúdio autenticado neste navegador (cache por usuário).
 * O cache é removido em `signOutUser`, portanto não gera falso positivo após logout.
 */
export function hasLocalStudioSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(USER_CACHE_PREFIX)) return true;
    }
  } catch {
    // ignora
  }
  return false;
}
