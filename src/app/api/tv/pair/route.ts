import { NextResponse } from "next/server";
import {
  generatePairingCode,
  checkPairRateLimit,
  cleanupExpiredMemoryPairings,
  getMemoryPairing,
  setMemoryPairing,
  TVPairingRecord,
} from "@/lib/tv-kiosk";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/service-role";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * POST /api/tv/pair
 * Gera um código temporário de 6 dígitos numéricos para parear a Smart TV.
 * Totalmente anônimo (chamado diretamente pela TV na inicialização).
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const allowed = checkPairRateLimit(ip, 10, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Limite de solicitações atingido. Tente novamente em 1 minuto." },
        { status: 429 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    const code = generatePairingCode();
    const token = crypto.randomUUID();

    let savedInSupabase = false;

    if (isSupabaseConfigured()) {
      try {
        // 1. Cleanup oportunístico de códigos expirados no Supabase
        await supabaseAdmin
          .from("tv_pairings")
          .update({ status: "EXPIRED" })
          .eq("status", "PENDING")
          .lt("expires_at", now.toISOString());

        // 2. Insere novo registro de pareamento pendente
        const { error: insertErr } = await supabaseAdmin
          .from("tv_pairings")
          .insert({
            code,
            device_name: "Smart TV",
            status: "PENDING",
            token,
            expires_at: expiresAt,
          });

        if (!insertErr) {
          savedInSupabase = true;
        } else {
          console.warn(
            "[TV Pair] Tabela 'tv_pairings' ausente ou erro no Supabase. Utilizando fallback em memória para desenvolvimento local:",
            insertErr.message || insertErr
          );
        }
      } catch (cleanupOrInsertErr) {
        console.warn(
          "[TV Pair] Falha de comunicação com o Supabase. Utilizando fallback em memória:",
          cleanupOrInsertErr
        );
      }
    }

    if (!savedInSupabase) {
      // Fallback em memória (ambiente local ou antes da migration ser executada no Supabase)
      cleanupExpiredMemoryPairings(now);
      const record: TVPairingRecord = {
        id: crypto.randomUUID(),
        code,
        organization_id: null,
        device_name: "Smart TV",
        status: "PENDING",
        token,
        expires_at: expiresAt,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      setMemoryPairing(code, record);
    }

    return NextResponse.json({
      code,
      expiresAt,
      status: "PENDING",
    });
  } catch (err) {
    console.error("[TV Pair] Erro inesperado:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tv/pair?code=892437
 * Polling rápido (a cada 3s) executado pela tela de pareamento da TV
 * para detectar quando a gestora concluiu a autorização no celular/desktop.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code")?.trim();

    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Código de pareamento inválido ou não informado." },
        { status: 400 }
      );
    }

    const now = new Date();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabaseAdmin
          .from("tv_pairings")
          .select("id, status, token, expires_at, device_name")
          .eq("code", code)
          .maybeSingle();

        if (!error && data) {
          const isExpired =
            data.status === "EXPIRED" ||
            (data.status === "PENDING" && new Date(data.expires_at).getTime() < now.getTime());

          if (isExpired) {
            return NextResponse.json({ status: "EXPIRED" }, { status: 410 });
          }

          if (data.status === "AUTHORIZED") {
            return NextResponse.json({
              status: "AUTHORIZED",
              token: data.token,
              deviceName: data.device_name || "Smart TV",
            });
          }

          return NextResponse.json({
            status: data.status,
          });
        }
      } catch (dbErr) {
        console.warn("[TV Pair GET] Erro ao consultar Supabase, checando memória:", dbErr);
      }
    }

    // Fallback em memória (se não encontrado no Supabase ou tabela não criada)
    cleanupExpiredMemoryPairings(now);
    const record = getMemoryPairing(code);

    if (!record) {
      return NextResponse.json(
        { error: "Código de pareamento não encontrado." },
        { status: 404 }
      );
    }

    const isExpired =
      record.status === "EXPIRED" ||
      (record.status === "PENDING" &&
        new Date(record.expires_at).getTime() < now.getTime());

    if (isExpired) {
      record.status = "EXPIRED";
      return NextResponse.json({ status: "EXPIRED" }, { status: 410 });
    }

    if (record.status === "AUTHORIZED") {
      return NextResponse.json({
        status: "AUTHORIZED",
        token: record.token,
        deviceName: record.device_name,
      });
    }

    return NextResponse.json({
      status: record.status,
    });
  } catch (err) {
    console.error("[TV Pair Status] Erro inesperado:", err);
    return NextResponse.json(
      { error: "Erro interno ao consultar status de pareamento." },
      { status: 500 }
    );
  }
}
