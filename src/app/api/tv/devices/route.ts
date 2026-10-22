import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { getAllMemoryPairings } from "@/lib/tv-kiosk";

async function getAuthenticatedUserOrg(request: Request) {
  if (!isSupabaseConfigured()) {
    return {
      userId: "demo-user",
      organizationId: "demo-org-luvea",
      role: "owner",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return null;
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.organization_id) {
    return null;
  }

  return {
    userId: user.id,
    organizationId: profile.organization_id,
    role: profile.role || "owner",
  };
}

/**
 * GET /api/tv/devices
 * Lista todos os dispositivos / Smart TVs pareados com o estúdio.
 */
export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUserOrg(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabaseAdmin
          .from("tv_pairings")
          .select("id, code, device_name, status, created_at, updated_at")
          .eq("organization_id", auth.organizationId)
          .order("created_at", { ascending: false });

        if (!error && data) {
          return NextResponse.json({ devices: data || [] });
        }
        console.warn("[TV Devices] Tabela ausente ou aviso no Supabase, utilizando fallback em memória:", error?.message || error);
      } catch (dbErr) {
        console.warn("[TV Devices] Falha ao consultar Supabase, utilizando fallback em memória:", dbErr);
      }
    }

    const all = getAllMemoryPairings();
    const orgDevices = all
      .filter((d) => d.organization_id === auth.organizationId)
      .map((d) => ({
        id: d.id,
        code: d.code,
        device_name: d.device_name,
        status: d.status,
        created_at: d.created_at,
        updated_at: d.updated_at,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ devices: orgDevices });
  } catch (err) {
    console.error("[TV Devices GET] Erro:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tv/devices
 * Revoga o acesso de uma Smart TV previamente autorizada.
 */
export async function DELETE(request: Request) {
  try {
    const auth = await getAuthenticatedUserOrg(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    if (auth.role !== "owner" && auth.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem revogar acessos de TV." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json(
        { error: "Identificador do dispositivo não informado." },
        { status: 400 }
      );
    }

    let revoked = false;

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabaseAdmin
          .from("tv_pairings")
          .update({
            status: "REVOKED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("organization_id", auth.organizationId);

        if (!error) {
          revoked = true;
        } else {
          console.warn("[TV Devices DELETE] Aviso no Supabase, tentando em memória:", error.message || error);
        }
      } catch (dbErr) {
        console.warn("[TV Devices DELETE] Falha ao conectar ao Supabase, tentando em memória:", dbErr);
      }
    }

    if (!revoked) {
      const all = getAllMemoryPairings();
      const device = all.find(
        (d) => d.id === id && d.organization_id === auth.organizationId
      );
      if (device) {
        device.status = "REVOKED";
        device.updated_at = new Date().toISOString();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Acesso do dispositivo revogado com sucesso.",
    });
  } catch (err) {
    console.error("[TV Devices DELETE] Erro:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor ao revogar TV." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tv/devices
 * Renomeia um dispositivo conectado (ex: "TV Recepção Principal").
 */
export async function PATCH(request: Request) {
  try {
    const auth = await getAuthenticatedUserOrg(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const deviceName =
      typeof body.device_name === "string" && body.device_name.trim()
        ? body.device_name.trim().slice(0, 100)
        : "";

    if (!id || !deviceName) {
      return NextResponse.json(
        { error: "Identificador e novo nome do dispositivo são obrigatórios." },
        { status: 400 }
      );
    }

    let updated = false;

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabaseAdmin
          .from("tv_pairings")
          .update({
            device_name: deviceName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("organization_id", auth.organizationId);

        if (!error) {
          updated = true;
        } else {
          console.warn("[TV Devices PATCH] Aviso no Supabase, tentando em memória:", error.message || error);
        }
      } catch (dbErr) {
        console.warn("[TV Devices PATCH] Falha ao conectar ao Supabase, tentando em memória:", dbErr);
      }
    }

    if (!updated) {
      const all = getAllMemoryPairings();
      const device = all.find(
        (d) => d.id === id && d.organization_id === auth.organizationId
      );
      if (device) {
        device.device_name = deviceName;
        device.updated_at = new Date().toISOString();
      }
    }

    return NextResponse.json({
      success: true,
      device_name: deviceName,
    });
  } catch (err) {
    console.error("[TV Devices PATCH] Erro:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor ao renomear TV." },
      { status: 500 }
    );
  }
}
