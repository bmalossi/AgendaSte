import { NextResponse } from "next/server";
import { validateSubdomainFormat } from "@/lib/subdomain";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("slug") || searchParams.get("subdomain") || "";
    const formatCheck = validateSubdomainFormat(raw);

    if (!formatCheck.valid) {
      return NextResponse.json({
        ok: true,
        available: false,
        normalized: formatCheck.normalized,
        reason: formatCheck.reason,
        message: formatCheck.message,
      });
    }

    const slug = formatCheck.normalized;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        available: true,
        normalized: slug,
        message: "Subdomínio disponível para reserva",
      });
    }

    // Identifica se o requisitante está autenticado e qual a sua organização atual
    let requesterOrgId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .maybeSingle();

        requesterOrgId = profile?.organization_id || null;
      }
    } catch {
      // Requisitante anônimo
    }

    // Consulta se já existe uma organização com este slug
    const { data: existingOrg, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("id, name, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (orgError) {
      console.warn("[Subdomain Check Error]:", orgError.message);
    }

    if (!existingOrg) {
      return NextResponse.json({
        ok: true,
        available: true,
        normalized: slug,
        message: "Subdomínio disponível para reserva",
      });
    }

    // Se o subdomínio já pertencer ao próprio estúdio do usuário autenticado
    if (requesterOrgId && requesterOrgId === existingOrg.id) {
      return NextResponse.json({
        ok: true,
        available: true,
        isCurrent: true,
        normalized: slug,
        message: "Subdomínio atual do seu estúdio",
      });
    }

    // Se a organização existente for órfã (criada provisoriamente sem perfis vinculados)
    const { count: profileCount } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", existingOrg.id);

    if (!profileCount || profileCount === 0) {
      return NextResponse.json({
        ok: true,
        available: true,
        isReclaimable: true,
        normalized: slug,
        message: "Subdomínio disponível para reserva",
      });
    }

    // O subdomínio pertence a outro estúdio com membros ativos
    return NextResponse.json({
      ok: true,
      available: false,
      normalized: slug,
      reason: "taken",
      message: "Este subdomínio já está em uso por outro estúdio.",
    });
  } catch (err: any) {
    console.error("[Subdomain Check Exception]:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro ao verificar disponibilidade do subdomínio." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const raw = String(body.subdomain || body.slug || "");
    const url = new URL(request.url);
    url.searchParams.set("slug", raw);
    return GET(new Request(url.toString(), { headers: request.headers }));
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
