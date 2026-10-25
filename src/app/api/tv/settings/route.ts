import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import {
  getMemoryTVSettings,
  setMemoryTVSettings,
  TVThemeMode,
  TVScreenSize,
} from "@/lib/tv-kiosk";

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
 * GET /api/tv/settings
 * Retorna as configurações de exibição da TV Kiosk da organização do usuário logado.
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
        const { data: org, error } = await supabaseAdmin
          .from("organizations")
          .select("settings")
          .eq("id", auth.organizationId)
          .maybeSingle();

        if (!error && org?.settings) {
          const s = org.settings as Record<string, unknown>;
          return NextResponse.json({
            theme: (s.tv_theme as TVThemeMode) || "dark",
            screenSize: (s.tv_screen_size as TVScreenSize) || "32",
            showSyncBadge:
              typeof s.tv_show_sync_badge === "boolean"
                ? s.tv_show_sync_badge
                : true,
          });
        }
      } catch (dbErr) {
        console.warn("[TV Settings GET] Erro ao consultar Supabase:", dbErr);
      }
    }

    const mem = getMemoryTVSettings(auth.organizationId);
    return NextResponse.json(mem);
  } catch (err) {
    console.error("[TV Settings GET] Erro inesperado:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tv/settings
 * Atualiza modo de exibição (tema), tamanho de tela e status de sincronização da TV.
 */
export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUserOrg(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { theme, screenSize, showSyncBadge } = body;

    const validThemes: TVThemeMode[] = ["dark", "light", "warm_brown", "noir_gold"];
    const validSizes: TVScreenSize[] = ["32", "43", "55"];

    const validatedTheme = validThemes.includes(theme) ? theme : undefined;
    const validatedSize = validSizes.includes(screenSize) ? screenSize : undefined;
    const validatedBadge =
      typeof showSyncBadge === "boolean" ? showSyncBadge : undefined;

    if (isSupabaseConfigured()) {
      try {
        const { data: org } = await supabaseAdmin
          .from("organizations")
          .select("settings")
          .eq("id", auth.organizationId)
          .maybeSingle();

        const currentSettings = (org?.settings as Record<string, unknown>) || {};
        const updatedSettings = {
          ...currentSettings,
          ...(validatedTheme && { tv_theme: validatedTheme }),
          ...(validatedSize && { tv_screen_size: validatedSize }),
          ...(validatedBadge !== undefined && { tv_show_sync_badge: validatedBadge }),
        };

        await supabaseAdmin
          .from("organizations")
          .update({ settings: updatedSettings })
          .eq("id", auth.organizationId);
      } catch (dbErr) {
        console.warn("[TV Settings POST] Erro ao atualizar Supabase:", dbErr);
      }
    }

    const updated = setMemoryTVSettings(auth.organizationId, {
      ...(validatedTheme && { theme: validatedTheme }),
      ...(validatedSize && { screenSize: validatedSize }),
      ...(validatedBadge !== undefined && { showSyncBadge: validatedBadge }),
    });

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (err) {
    console.error("[TV Settings POST] Erro inesperado:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
