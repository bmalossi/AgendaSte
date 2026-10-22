import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/service-role";
import {
  buildTVPollingResponse,
  getAllMemoryPairings,
  RawTVAppointment,
  RawTVProfessional,
  RawTVOrganization,
} from "@/lib/tv-kiosk";

/**
 * GET /api/tv/appointments
 * Polling principal executado pela Smart TV (a cada 20s).
 * Requer o header "Authorization: Bearer <tv_token>".
 * Retorna exclusivamente dados limpos e anonimizados em conformidade com a LGPD.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const match = authHeader.match(/^Bearer\s+([0-9a-fA-F-]+)$/i);
    const tvToken = match ? match[1].trim() : null;

    if (!tvToken) {
      return NextResponse.json(
        { error: "Token de dispositivo não fornecido ou inválido." },
        { status: 401 }
      );
    }

    const now = new Date();

    if (isSupabaseConfigured()) {
      // 1. Valida o token do dispositivo na tabela tv_pairings
      let pairing: { id: string; organization_id: string | null; status: string; device_name: string } | null = null;
      let queryFailed = false;

      try {
        const { data, error: pairErr } = await supabaseAdmin
          .from("tv_pairings")
          .select("id, organization_id, status, device_name")
          .eq("token", tvToken)
          .maybeSingle();

        if (pairErr) {
          queryFailed = true;
          console.warn("[TV Appointments] Tabela 'tv_pairings' ausente ou erro no Supabase (verificando memória):", pairErr.message || pairErr);
        } else {
          pairing = data;
        }
      } catch (dbErr) {
        queryFailed = true;
        console.warn("[TV Appointments] Falha de conexão ao Supabase:", dbErr);
      }

      if (pairing && pairing.status === "AUTHORIZED" && pairing.organization_id) {
        // 2. Valida o status da assinatura da organização
        const { data: org, error: orgErr } = await supabaseAdmin
          .from("organizations")
          .select("id, name, subscription_status, settings")
          .eq("id", pairing.organization_id)
          .maybeSingle();

        if (orgErr || !org) {
          return NextResponse.json(
            { error: "Organização vinculada não encontrada." },
            { status: 404 }
          );
        }

        const activeStatuses = ["active", "trialing"];
        if (!activeStatuses.includes(org.subscription_status)) {
          return NextResponse.json(
            { error: "subscription_inactive", message: "A assinatura do estúdio está inativa ou suspensa." },
            { status: 403 }
          );
        }

        const timezone =
          typeof org.settings?.timezone === "string" && org.settings.timezone.trim()
            ? org.settings.timezone.trim()
            : "America/Sao_Paulo";

        // 3. Busca profissionais da organização
        const { data: profsData, error: profsErr } = await supabaseAdmin
          .from("professionals")
          .select("id, first_name, last_name, studio_name")
          .eq("organization_id", org.id);

        if (profsErr) {
          console.error("[TV Appointments] Erro ao buscar profissionais:", profsErr);
        }

        const professionals: RawTVProfessional[] = (profsData || []).map((p) => ({
          id: p.id,
          name: [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.studio_name || "Profissional",
        }));

        // 3.1. Busca serviços da organização para mapear nomes reais
        const { data: srvsData } = await supabaseAdmin
          .from("services")
          .select("id, name")
          .eq("organization_id", org.id);

        const servicesMap = new Map<string, string>();
        for (const s of srvsData || []) {
          if (s.id && s.name) {
            servicesMap.set(s.id, s.name);
          }
        }

        // 4. Calcula limites da data de hoje no fuso horário do estúdio
        const dayFormatter = new Intl.DateTimeFormat("en-CA", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const todayYMD = dayFormatter.format(now); // YYYY-MM-DD

        // 5. Busca agendamentos do dia atual para a organização
        // Consulta as colunas reais com relacionamento em clients para obter nome do cliente
        const { data: aptsData, error: aptsErr } = await supabaseAdmin
          .from("appointments")
          .select(`
            id,
            professional_id,
            client_id,
            service_ids,
            starts_at,
            ends_at,
            status,
            notes,
            client:clients(full_name)
          `)
          .eq("organization_id", org.id)
          .gte("starts_at", `${todayYMD}T00:00:00Z`)
          .lte("starts_at", `${todayYMD}T23:59:59Z`)
          .in("status", ["confirmed", "completed", "pending"]);

        if (aptsErr) {
          console.error("[TV Appointments] Erro ao buscar agendamentos:", aptsErr);
        }

        const rawAppointments: RawTVAppointment[] = (aptsData || []).map((a: any) => {
          let clientName = a.client?.full_name || "";
          let serviceName = "";

          if (Array.isArray(a.service_ids) && a.service_ids.length > 0) {
            const names = a.service_ids
              .map((sid: string) => servicesMap.get(sid))
              .filter(Boolean);
            if (names.length > 0) {
              serviceName = names.join(" + ");
            }
          }

          // Se clientName ou serviceName ainda estiverem vazios, tenta extrair de __LUVEA_META__ em a.notes
          if (
            (!clientName || !serviceName) &&
            a.notes &&
            (a.notes.includes("__LUVEA_META__:") || a.notes.includes("__AURA_META__:"))
          ) {
            try {
              const metaLine = a.notes
                .split("\n")
                .find((p: string) => p.startsWith("__LUVEA_META__:") || p.startsWith("__AURA_META__:"));
              if (metaLine) {
                const meta = JSON.parse(
                  metaLine.replace("__LUVEA_META__:", "").replace("__AURA_META__:", "")
                );
                if (!clientName && meta.clientName) clientName = meta.clientName;
                if (!serviceName && Array.isArray(meta.serviceNames) && meta.serviceNames.length > 0) {
                  serviceName = meta.serviceNames.join(" + ");
                }
              }
            } catch {}
          }

          return {
            id: a.id,
            professional_id: a.professional_id,
            client_name: clientName || "Cliente",
            service_name: serviceName || "Atendimento",
            starts_at: a.starts_at,
            ends_at: a.ends_at,
            status: a.status,
          };
        });

        const response = buildTVPollingResponse(
          rawAppointments,
          professionals,
          {
            id: org.id,
            name: org.name,
            settings: org.settings,
          },
          now
        );

        return NextResponse.json(response);
      }

      if (!queryFailed && pairing && (pairing.status !== "AUTHORIZED" || !pairing.organization_id)) {
        return NextResponse.json(
          { error: "Dispositivo não autorizado ou revogado." },
          { status: 401 }
        );
      }
    }

    // Fallback em memória (ambiente local/demo/testes ou antes da migration ser executada)
    const pairings = getAllMemoryPairings();
    const pairing = pairings.find(
      (p) => p.token === tvToken && p.status === "AUTHORIZED"
    );

    if (!pairing) {
      return NextResponse.json(
        { error: "Dispositivo não autorizado ou revogado." },
        { status: 401 }
        );
      }

      // Dados de demonstração realistas
      const mockOrg: RawTVOrganization = {
        id: pairing.organization_id || "demo-org-luvea",
        name: "Studio Luvea Jardins",
        settings: {
          logo_url: null,
          timezone: "America/Sao_Paulo",
        },
      };

      const mockProfessionals: RawTVProfessional[] = [
        { id: "prof-1", name: "Helena Rostova" },
        { id: "prof-2", name: "Gabriel Menezes" },
        { id: "prof-3", name: "Carla Silveira" },
      ];

      // Gera horários dinâmicos ao redor da hora atual
      const currentHour = now.getUTCHours();
      const currentMinute = now.getUTCMinutes();
      const datePrefix = now.toISOString().split("T")[0];

      const makeIso = (h: number, m: number) => {
        const hh = String((h + 24) % 24).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        return `${datePrefix}T${hh}:${mm}:00Z`;
      };

      const mockAppointments: RawTVAppointment[] = [
        {
          id: "demo-apt-1",
          professional_id: "prof-1",
          client_name: "Mariana da Silva Oliveira",
          service_name: "Corte + Escova Premium",
          starts_at: makeIso(currentHour, 0),
          ends_at: makeIso(currentHour + 1, 0),
          status: "confirmed",
        },
        {
          id: "demo-apt-2",
          professional_id: "prof-1",
          client_name: "Fernanda Costa Ribeiro",
          service_name: "Balayage Iluminada",
          starts_at: makeIso(currentHour + 1, 15),
          ends_at: makeIso(currentHour + 2, 45),
          status: "confirmed",
        },
        {
          id: "demo-apt-3",
          professional_id: "prof-2",
          client_name: "Lucas Mendes de Souza",
          service_name: "Barba Terapia Completa",
          starts_at: makeIso(currentHour - 1, 0),
          ends_at: makeIso(currentHour, 0),
          status: "completed",
        },
        {
          id: "demo-apt-4",
          professional_id: "prof-2",
          client_name: "Carlos Eduardo Pires",
          service_name: "Corte Masculino Degradê",
          starts_at: makeIso(currentHour, 10),
          ends_at: makeIso(currentHour + 1, 0),
          status: "confirmed",
        },
      ];

      const response = buildTVPollingResponse(
        mockAppointments,
        mockProfessionals,
        mockOrg,
        now
      );

      return NextResponse.json(response);
  } catch (err) {
    console.error("[TV Appointments] Erro inesperado:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor ao sincronizar agenda." },
      { status: 500 }
    );
  }
}
