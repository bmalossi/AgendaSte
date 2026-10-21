import {
  DEFAULT_EVOLUTION_SETTINGS,
  EvolutionInstanceSettings,
} from "@/lib/agendaste-store";
import {
  normalizePhoneDigits,
  resolveTargetInstance,
} from "@/lib/whatsapp-instance-helper";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface WhatsAppSettingsPayload {
  phoneNumber?: string;
  instanceName?: string;
  apiUrl?: string;
  apiKey?: string;
  settings: Partial<EvolutionInstanceSettings>;
}

export async function GET(request: Request) {
  try {
    if (isSupabaseConfigured() && process.env.NODE_ENV === "production") {
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
        } = await supabase.auth.getUser();
        if (!user) {
          return Response.json(
            { error: "Acesso não autorizado para consultar configurações de WhatsApp." },
            { status: 401 }
          );
        }
      } catch (authErr) {
        console.warn("[WhatsApp Settings Auth Check]", authErr);
      }
    }

    const url = new URL(request.url);
    const rawPhone = url.searchParams.get("phoneNumber") || "";
    const customInstance = url.searchParams.get("instanceName") || "";
    const phoneDigits = normalizePhoneDigits(rawPhone);

    const baseUrl = (
      url.searchParams.get("apiUrl") ||
      process.env.WHATSAPP_API_URL ||
      "https://api.automab.dev"
    )
      .trim()
      .replace(/\/+$/, "");

    const apiKey = (
      url.searchParams.get("apiKey") ||
      process.env.WHATSAPP_GLOBAL_API_KEY ||
      process.env.WHATSAPP_API_KEY ||
      "370f7040e011d5e4d1b512a6cb263ebf"
    ).trim();

    // 1. Busca instâncias para resolver a instância correta
    let existingInstances: any[] = [];
    try {
      const fetchRes = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(6000),
      });
      if (fetchRes.ok) {
        const list = await fetchRes.json();
        if (Array.isArray(list)) {
          existingInstances = list;
        }
      }
    } catch (err) {
      console.warn("[Evolution API fetchInstances warn]:", err);
    }

    const target = resolveTargetInstance(phoneDigits, existingInstances, customInstance || undefined);
    const instanceName = target.name;

    // 2. Se a instância existe no servidor, busca as configurações reais
    if (target.exists) {
      try {
        const settingsRes = await fetch(`${baseUrl}/settings/find/${instanceName}`, {
          headers: { apikey: apiKey },
          signal: AbortSignal.timeout(6000),
        });

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          return Response.json({
            ok: true,
            exists: true,
            instanceName,
            settings: {
              rejectCall: !!data.rejectCall,
              msgCall: data.msgCall || "",
              groupsIgnore: data.groupsIgnore !== false, // default true
              alwaysOnline: !!data.alwaysOnline,
              readMessages: !!data.readMessages,
              readStatus: !!data.readStatus,
              syncFullHistory: !!data.syncFullHistory,
            },
          });
        }
      } catch (err) {
        console.warn("[Evolution API settings/find warn]:", err);
      }
    }

    // Instância ainda não criada ou offline
    return Response.json({
      ok: true,
      exists: target.exists,
      instanceName,
      settings: DEFAULT_EVOLUTION_SETTINGS,
    });
  } catch (err: any) {
    return Response.json(
      {
        ok: false,
        error: err?.message || "Falha ao obter configurações da Evolution API.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (isSupabaseConfigured() && process.env.NODE_ENV === "production") {
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
        } = await supabase.auth.getUser();
        if (!user) {
          return Response.json(
            { error: "Acesso não autorizado para atualizar configurações de WhatsApp." },
            { status: 401 }
          );
        }
      } catch (authErr) {
        console.warn("[WhatsApp Settings POST Auth Check]", authErr);
      }
    }

    const body = (await request.json().catch(() => ({}))) as WhatsAppSettingsPayload;
    const phoneDigits = normalizePhoneDigits(body.phoneNumber || "");
    const customInstance = body.instanceName || "";

    const baseUrl = (
      body.apiUrl ||
      process.env.WHATSAPP_API_URL ||
      "https://api.automab.dev"
    )
      .trim()
      .replace(/\/+$/, "");

    const apiKey = (
      body.apiKey ||
      process.env.WHATSAPP_GLOBAL_API_KEY ||
      process.env.WHATSAPP_API_KEY ||
      "370f7040e011d5e4d1b512a6cb263ebf"
    ).trim();

    // 1. Busca instâncias para resolver a instância correta
    let existingInstances: any[] = [];
    try {
      const fetchRes = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(6000),
      });
      if (fetchRes.ok) {
        const list = await fetchRes.json();
        if (Array.isArray(list)) {
          existingInstances = list;
        }
      }
    } catch (err) {
      console.warn("[Evolution API fetchInstances warn]:", err);
    }

    const target = resolveTargetInstance(phoneDigits, existingInstances, customInstance || undefined);
    const instanceName = target.name;
    const incomingSettings = body.settings || {};

    const payload = {
      rejectCall: !!incomingSettings.rejectCall,
      msgCall: incomingSettings.msgCall || "",
      groupsIgnore: incomingSettings.groupsIgnore !== false,
      alwaysOnline: !!incomingSettings.alwaysOnline,
      readMessages: !!incomingSettings.readMessages,
      readStatus: !!incomingSettings.readStatus,
      syncFullHistory: !!incomingSettings.syncFullHistory,
    };

    // 2. Se a instância existe no servidor, atualiza na Evolution API
    if (target.exists) {
      try {
        const setRes = await fetch(`${baseUrl}/settings/set/${instanceName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(8000),
        });

        if (setRes.ok) {
          const resJson = await setRes.json().catch(() => ({}));
          return Response.json({
            ok: true,
            exists: true,
            savedOnServer: true,
            instanceName,
            settings: payload,
            serverData: resJson,
          });
        } else {
          const errText = await setRes.text().catch(() => "");
          console.warn("[Evolution API settings/set fail]:", setRes.status, errText);
          return Response.json(
            {
              ok: false,
              exists: true,
              savedOnServer: false,
              error: `Erro ao aplicar configurações na Evolution API (${setRes.status}): ${errText}`,
              settings: payload,
            },
            { status: 200 }
          );
        }
      } catch (setErr: any) {
        console.warn("[Evolution API settings/set error]:", setErr);
      }
    }

    // Se a instância ainda não foi criada no servidor, salva com sucesso para ser aplicada ao criar
    return Response.json({
      ok: true,
      exists: false,
      savedOnServer: false,
      savedLocally: true,
      instanceName,
      settings: payload,
    });
  } catch (err: any) {
    return Response.json(
      {
        ok: false,
        error: err?.message || "Falha ao salvar configurações da Evolution API.",
      },
      { status: 500 }
    );
  }
}
