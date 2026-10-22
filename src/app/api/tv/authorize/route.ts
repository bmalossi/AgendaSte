import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import {
  getMemoryPairing,
  cleanupExpiredMemoryPairings,
} from "@/lib/tv-kiosk";

/**
 * POST /api/tv/authorize
 * Autoriza um código de pareamento gerado por uma TV, vinculando o dispositivo
 * à organização autenticada da gestora.
 */
export async function POST(request: Request) {
  try {
    let organizationId = "demo-org-luvea";

    // 1. Verificação de Autenticação da Gestora
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr || !user) {
          return NextResponse.json(
            { error: "Acesso não autorizado. Faça login no app LUVEA para autorizar telas." },
            { status: 401 }
          );
        }

        // Obtém a organização vinculada ao perfil da gestora
        const { data: profile, error: profErr } = await supabaseAdmin
          .from("profiles")
          .select("organization_id, role")
          .eq("id", user.id)
          .maybeSingle();

        if (profErr || !profile?.organization_id) {
          return NextResponse.json(
            { error: "Organização não localizada para o usuário autenticado." },
            { status: 403 }
          );
        }

        organizationId = profile.organization_id;
      } catch (authErr) {
        console.error("[TV Authorize] Erro ao validar sessão:", authErr);
        return NextResponse.json(
          { error: "Erro de autenticação na sessão." },
          { status: 401 }
        );
      }
    }

    // 2. Parse e validação do payload
    const body = await request.json().catch(() => ({}));
    const rawCode = typeof body.code === "string" ? body.code.trim() : "";
    const deviceName =
      typeof body.deviceName === "string" && body.deviceName.trim()
        ? body.deviceName.trim().slice(0, 100)
        : "Smart TV";

    if (!rawCode || !/^\d{6}$/.test(rawCode)) {
      return NextResponse.json(
        { error: "Código de pareamento inválido. Insira os 6 dígitos numéricos exibidos na tela da TV." },
        { status: 400 }
      );
    }

    const now = new Date();

    let authorized = false;

    if (isSupabaseConfigured()) {
      try {
        // 3. Consulta o registro no Supabase com Service Role
        const { data: pairing, error: selectErr } = await supabaseAdmin
          .from("tv_pairings")
          .select("id, status, expires_at")
          .eq("code", rawCode)
          .maybeSingle();

        if (!selectErr && pairing) {
          if (
            pairing.status === "EXPIRED" ||
            (pairing.status === "PENDING" && new Date(pairing.expires_at).getTime() < now.getTime())
          ) {
            return NextResponse.json(
              { error: "Este código expirou. Solicite um novo código na tela da TV." },
              { status: 410 }
            );
          }

          if (pairing.status === "AUTHORIZED") {
            return NextResponse.json(
              { error: "Este código já foi pareado e utilizado anteriormente." },
              { status: 409 }
            );
          }

          if (pairing.status === "REVOKED") {
            return NextResponse.json(
              { error: "Este dispositivo foi revogado." },
              { status: 403 }
            );
          }

          // 4. Atualiza para AUTHORIZED e vincula à organização
          const { error: updateErr } = await supabaseAdmin
            .from("tv_pairings")
            .update({
              status: "AUTHORIZED",
              organization_id: organizationId,
              device_name: deviceName,
              updated_at: now.toISOString(),
            })
            .eq("id", pairing.id);

          if (updateErr) {
            console.error("[TV Authorize] Erro ao atualizar status no banco:", updateErr);
            return NextResponse.json(
              { error: "Falha ao vincular dispositivo no servidor." },
              { status: 500 }
            );
          }

          authorized = true;
        } else if (selectErr) {
          console.warn("[TV Authorize] Tabela ausente ou erro no Supabase, verificando memória:", selectErr.message || selectErr);
        }
      } catch (authDbErr) {
        console.warn("[TV Authorize] Falha ao consultar Supabase, verificando memória:", authDbErr);
      }
    }

    if (!authorized) {
      // Fallback em memória (ambiente local ou pareamento temporário em memória)
      cleanupExpiredMemoryPairings(now);
      const pairing = getMemoryPairing(rawCode);

      if (!pairing) {
        return NextResponse.json(
          { error: "Código de pareamento não encontrado ou inexistente." },
          { status: 404 }
        );
      }

      if (
        pairing.status === "EXPIRED" ||
        (pairing.status === "PENDING" && new Date(pairing.expires_at).getTime() < now.getTime())
      ) {
        pairing.status = "EXPIRED";
        return NextResponse.json(
          { error: "Este código expirou. Solicite um novo código na tela da TV." },
          { status: 410 }
        );
      }

      if (pairing.status === "AUTHORIZED") {
        return NextResponse.json(
          { error: "Este código já foi pareado e utilizado anteriormente." },
          { status: 409 }
        );
      }

      if (pairing.status === "REVOKED") {
        return NextResponse.json(
          { error: "Este dispositivo foi revogado." },
          { status: 403 }
        );
      }

      pairing.status = "AUTHORIZED";
      pairing.organization_id = organizationId;
      pairing.device_name = deviceName;
      pairing.updated_at = now.toISOString();
    }

    return NextResponse.json({
      success: true,
      deviceName,
      message: "TV conectada com sucesso ao painel LUVEA.",
    });
  } catch (err) {
    console.error("[TV Authorize] Erro inesperado:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor ao autorizar TV." },
      { status: 500 }
    );
  }
}
