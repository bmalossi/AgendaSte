import { supabase, isSupabaseConfigured } from "./client";
import {
  StudioState,
  ServiceCatalogItem,
  PhysicalResource,
  ClientProfile,
  CalendarEventItem,
  WaitlistEntryItem,
} from "../agendaste-store";

export function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

/**
 * Carrega os dados reais do Supabase para hidratar o estado da aplicação.
 * Se o Supabase estiver configurado e acessível, mapeia as linhas das tabelas
 * diretamente para o StudioState da LUVEA, preservando agendamentos locais
 * que ainda não foram sincronizados.
 */
export async function loadStudioStateFromSupabase(
  currentState: StudioState
): Promise<StudioState> {
  if (!isSupabaseConfigured()) {
    return currentState;
  }

  try {
    const [
      { data: profs },
      { data: resourcesData },
      { data: servicesData },
      { data: clientsData },
      { data: appointmentsData },
      { data: waitlistData },
    ] = await Promise.all([
      supabase.from("professionals").select("*").limit(1),
      supabase.from("resources").select("*"),
      supabase.from("services").select("*").eq("active", true),
      supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("appointments")
        .select("*")
        .order("starts_at", { ascending: true }),
      supabase.from("waitlist_entries").select("*"),
    ]);

    const updated = { ...currentState };

    // 1. Perfil do Profissional & Negócio
    if (profs && profs[0]) {
      const p = profs[0];
      updated.settings = {
        ...updated.settings,
        personal: {
          ...updated.settings.personal,
          firstName: p.first_name || updated.settings.personal.firstName,
          lastName: p.last_name || updated.settings.personal.lastName,
          email: p.email || updated.settings.personal.email,
          phone: p.phone_whatsapp || updated.settings.personal.phone,
        },
        business: {
          ...updated.settings.business,
          businessName: p.studio_name || updated.settings.business.businessName,
          bookingSlug: p.slug || updated.settings.business.bookingSlug,
          legalEntityType:
            p.legal_entity_type || updated.settings.business.legalEntityType,
          taxIdCnpjCpf:
            p.tax_id_cnpj_cpf || updated.settings.business.taxIdCnpjCpf,
          pixKey: p.pix_key || updated.settings.business.pixKey,
          defaultDepositPercent:
            p.default_deposit_percent ??
            updated.settings.business.defaultDepositPercent,
        },
      };
      if (p.weekly_goal_cents && updated.staff[0]) {
        updated.staff[0].weeklyGoalCents = p.weekly_goal_cents;
      }
    }

    // 2. Recursos Físicos
    if (resourcesData && resourcesData.length > 0) {
      updated.resources = resourcesData.map(
        (r): PhysicalResource => ({
          id: r.id,
          name: r.name,
          category: r.category as "equipment" | "room",
          description: r.description || "",
          assignedServiceIds: [],
        })
      );
    }

    // 3. Catálogo de Serviços
    if (servicesData && servicesData.length > 0) {
      updated.services = servicesData.map(
        (s): ServiceCatalogItem => ({
          id: s.id,
          name: s.name,
          description: s.description || "",
          category: s.category || "Geral",
          calendarColor: s.calendar_color || "#E11D8F",
          onlineBookingEnabled: s.online_booking_enabled ?? true,
          priceType: s.price_type || "fixed",
          priceCents: s.price_cents || 0,
          requireDeposit: s.require_deposit ?? false,
          depositCents: s.deposit_cents || 0,
          durationMinutes: s.duration_minutes || 60,
          processingTimeEnabled: s.processing_time_enabled ?? false,
          processingStartOffsetMinutes: s.processing_start_offset_minutes || 0,
          processingDurationMinutes: s.processing_duration_minutes || 0,
          blockTimeEnabled: s.block_time_enabled ?? false,
          blockAfterMinutes: s.block_after_minutes || 0,
          requiredResourceIds: s.required_resource_ids || [],
          options: Array.isArray(s.options) ? s.options : [],
          addOns: Array.isArray(s.add_ons) ? s.add_ons : [],
        })
      );
    }

    // 4. Clientes
    if (clientsData && clientsData.length > 0) {
      updated.clients = clientsData.map((c): ClientProfile => {
        const lastVisit = c.last_visit_at ? c.last_visit_at.slice(0, 10) : null;
        const daysSince = lastVisit
          ? Math.max(
              0,
              Math.floor(
                (new Date().getTime() - new Date(lastVisit).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : null;

        return {
          id: c.id,
          fullName: c.full_name,
          email: c.email || "",
          phone: c.phone_whatsapp,
          avatarColor: c.avatar_color || "#FBCFE8",
          createdAtISO: c.created_at || "2026-01-01",
          lastVisitISO: lastVisit,
          daysSinceLastVisit: daysSince,
          notesAndForms: {
            anamnesis: c.anamnesis_notes || "",
            allergies: c.allergies_warnings || "",
            formulasAndPreferences: c.preferences_notes || "",
            birthday: c.birthday || "",
          },
          autoSortedPhotos:
            Array.isArray(c.auto_sorted_photos) &&
            c.auto_sorted_photos.length > 0
              ? c.auto_sorted_photos
              : [],
          memberships: Array.isArray(c.membership_subscriptions)
            ? c.membership_subscriptions
            : [],
          packages: Array.isArray(c.package_credits) ? c.package_credits : [],
          totalSpentCents: c.total_spent_cents || 0,
          visitsCount: c.visits_count || 1,
          noShowCount: c.no_show_count || 0,
          sendAutomaticReminders: c.send_automatic_reminders ?? true,
        };
      });
    }

    // 5. Agendamentos (Cloud + Local Unsynced Merge)
    const cloudAppointments: CalendarEventItem[] = (appointmentsData || []).map(
      (a): CalendarEventItem => {
        const client = updated.clients.find((c) => c.id === a.client_id);
        const starts = new Date(a.starts_at);
        const year = starts.getFullYear();
        const month = String(starts.getMonth() + 1).padStart(2, "0");
        const day = String(starts.getDate()).padStart(2, "0");
        const dateISO = `${year}-${month}-${day}`;
        const hours = String(starts.getHours()).padStart(2, "0");
        const minutes = String(starts.getMinutes()).padStart(2, "0");
        const startTime = `${hours}:${minutes}`;

        const activeMinutes = a.active_duration_minutes || 60;
        const endTime = calculateEndTime(startTime, activeMinutes);

        const srvNames = (a.service_ids || [])
          .map((id: string) => updated.services.find((s) => s.id === id)?.name)
          .filter(Boolean) as string[];

        // Decodificar metadados de contingência em notes
        let displayNotes = a.notes || "";
        let metaClientName = "";
        let metaServiceNames: string[] = [];
        let metaDateISO = "";
        let metaStartTime = "";

        if (a.notes && a.notes.includes("__AURA_META__:")) {
          try {
            const parts = a.notes.split("\n");
            const metaLine = parts.find((p: string) =>
              p.startsWith("__AURA_META__:")
            );
            if (metaLine) {
              const meta = JSON.parse(metaLine.replace("__AURA_META__:", ""));
              metaClientName = meta.clientName || "";
              metaServiceNames = meta.serviceNames || [];
              metaDateISO = meta.dateISO || "";
              metaStartTime = meta.startTime || "";
              displayNotes = parts
                .filter((p: string) => !p.startsWith("__AURA_META__:"))
                .join("\n")
                .trim();
            }
          } catch {
            // fallback
          }
        }

        const finalClientName = client
          ? client.fullName
          : metaClientName || "Cliente";
        const finalServiceNames =
          srvNames.length > 0
            ? srvNames
            : metaServiceNames.length > 0
              ? metaServiceNames
              : ["Atendimento"];

        return {
          id: a.id,
          eventType: a.event_type || "appointment",
          dateISO: metaDateISO || dateISO,
          startTime: metaStartTime || startTime,
          endTime,
          activeDurationMinutes: activeMinutes,
          processingStartOffsetMinutes: a.processing_start_offset_minutes || 0,
          processingDurationMinutes: a.processing_duration_minutes || 0,
          blockAfterMinutes: a.block_after_minutes || 0,
          providerId: "staff-bruno",
          providerName: `${updated.settings.personal.firstName} ${updated.settings.personal.lastName}`,
          clientId: a.client_id || undefined,
          clientName: finalClientName,
          serviceIds: a.service_ids || [],
          serviceNames: finalServiceNames,
          resourceIds: a.resource_ids || [],
          addressOrNotes: displayNotes,
          isRepeating: a.is_repeating ?? false,
          collectDeposit: a.deposit_cents > 0,
          depositCents: a.deposit_cents || 0,
          depositPaid: a.deposit_paid ?? true,
          totalCents: a.total_cents || 0,
          status: a.status || "confirmed",
          calendarColor: "#E11D8F",
          whatsappReminderSent: a.whatsapp_reminder_sent ?? false,
          whatsappClientReply: a.whatsapp_client_reply || "none",
        };
      }
    );

    // Preservar eventos locais que ainda não constam na nuvem
    const cloudIds = new Set(cloudAppointments.map((e) => e.id));
    const cloudKeys = new Set(
      cloudAppointments.map((e) => `${e.dateISO}_${e.startTime}_${e.clientName}`)
    );

    const unsyncedLocal = (currentState.calendarEvents || []).filter(
      (local) =>
        !cloudIds.has(local.id) &&
        !cloudKeys.has(`${local.dateISO}_${local.startTime}_${local.clientName}`)
    );

    if (cloudAppointments.length > 0) {
      updated.calendarEvents = [...cloudAppointments, ...unsyncedLocal];
    } else if (unsyncedLocal.length > 0) {
      updated.calendarEvents = unsyncedLocal;
    }

    // Sincroniza em background os eventos locais pendentes
    if (unsyncedLocal.length > 0 && profs && profs[0]?.id) {
      for (const evt of unsyncedLocal) {
        syncNewAppointmentToSupabase(evt, profs[0].id).catch(console.warn);
      }
    }

    // 6. Lista de Espera
    if (waitlistData && waitlistData.length > 0) {
      updated.waitlist = waitlistData.map((w): WaitlistEntryItem => {
        const client = updated.clients.find((c) => c.id === w.client_id);
        const service = updated.services.find((s) => s.id === w.service_id);
        return {
          id: w.id,
          clientId: w.client_id || "cli-1",
          clientName: client ? client.fullName : "Cliente",
          clientPhone: client ? client.phone : "(11) 99999-0000",
          providerId: "staff-bruno",
          providerName: `${updated.settings.personal.firstName} ${updated.settings.personal.lastName}`,
          serviceId: w.service_id || "srv-1",
          serviceName: service ? service.name : "Serviço",
          preferredDateISO: w.preferred_date,
          preferredTimeWindow: w.preferred_time_window,
          notes: w.notes || "",
          createdAtISO: w.created_at || "2026-10-17",
        };
      });
    }

    return updated;
  } catch (error) {
    console.error("Erro ao sincronizar com Supabase:", error);
    return currentState;
  }
}

/**
 * Insere um novo agendamento no Supabase (se configurado)
 */
export async function syncNewAppointmentToSupabase(
  event: CalendarEventItem,
  professionalId = "11111111-1111-1111-1111-111111111111"
) {
  if (!isSupabaseConfigured()) return;

  try {
    let profId = professionalId;
    if (!isValidUuid(profId)) {
      const { data: profs } = await supabase
        .from("professionals")
        .select("id")
        .limit(1);
      if (profs && profs[0]?.id) {
        profId = profs[0].id;
      } else {
        profId = "11111111-1111-1111-1111-111111111111";
      }
    }

    // Resolver ou criar Cliente no Supabase para integridade de chave estrangeira
    let validClientId: string | null = null;
    if (event.clientId && isValidUuid(event.clientId)) {
      validClientId = event.clientId;
    } else if (event.clientName && event.clientName !== "Cliente") {
      const { data: matched } = await supabase
        .from("clients")
        .select("id")
        .eq("full_name", event.clientName)
        .limit(1);
      if (matched && matched[0]?.id) {
        validClientId = matched[0].id;
      } else {
        const { data: newCli } = await supabase
          .from("clients")
          .insert({
            professional_id: profId,
            full_name: event.clientName,
            phone_whatsapp: "(11) 99876-5432",
            avatar_color: "#FBCFE8",
          })
          .select("id")
          .single();
        if (newCli?.id) {
          validClientId = newCli.id;
        }
      }
    }

    // Resolver UUIDs de serviços válidos
    const validServiceIds: string[] = [];
    for (const sid of event.serviceIds || []) {
      if (isValidUuid(sid)) {
        validServiceIds.push(sid);
      }
    }
    if (
      validServiceIds.length === 0 &&
      event.serviceNames &&
      event.serviceNames.length > 0
    ) {
      const { data: dbServices } = await supabase
        .from("services")
        .select("id, name")
        .in("name", event.serviceNames);
      if (dbServices && dbServices.length > 0) {
        for (const s of dbServices) {
          validServiceIds.push(s.id);
        }
      }
    }

    const validResourceIds = (event.resourceIds || []).filter(isValidUuid);

    const startsAt = new Date(
      `${event.dateISO}T${event.startTime}:00`
    ).toISOString();
    const durationMs = (event.activeDurationMinutes || 60) * 60 * 1000;
    const endsAt = new Date(
      new Date(startsAt).getTime() + durationMs
    ).toISOString();

    const metaLine = `__AURA_META__:${JSON.stringify({
      clientName: event.clientName,
      serviceNames: event.serviceNames,
      dateISO: event.dateISO,
      startTime: event.startTime,
      originalId: event.id,
      addressOrNotes: event.addressOrNotes || "",
    })}`;
    const notesToSave = event.addressOrNotes
      ? `${metaLine}\n${event.addressOrNotes}`
      : metaLine;

    const allowedStatuses = [
      "confirmed",
      "completed",
      "pending",
      "canceled",
      "no_show",
    ];
    const status = allowedStatuses.includes(event.status)
      ? event.status
      : "confirmed";

    await supabase.from("appointments").insert({
      id: isValidUuid(event.id) ? event.id : undefined,
      professional_id: profId,
      client_id: validClientId,
      service_ids: validServiceIds,
      resource_ids: validResourceIds,
      event_type: event.eventType || "appointment",
      starts_at: startsAt,
      ends_at: endsAt,
      active_duration_minutes: event.activeDurationMinutes || 60,
      processing_start_offset_minutes:
        event.processingStartOffsetMinutes || 0,
      processing_duration_minutes: event.processingDurationMinutes || 0,
      block_after_minutes: event.blockAfterMinutes || 0,
      is_repeating: Boolean(event.isRepeating),
      status,
      total_cents: event.totalCents || 0,
      deposit_cents: event.depositCents || 0,
      deposit_paid: Boolean(event.depositPaid),
      payment_method: "pix",
      notes: notesToSave,
      whatsapp_client_reply: event.whatsappClientReply || "none",
    });
  } catch (err) {
    console.warn("Falha ao persistir agendamento no Supabase:", err);
  }
}

/**
 * Atualiza o status de um agendamento no Supabase (se configurado)
 */
export async function syncAppointmentUpdateToSupabase(
  event: CalendarEventItem
) {
  if (!isSupabaseConfigured()) return;
  try {
    if (isValidUuid(event.id)) {
      const allowedStatuses = [
        "confirmed",
        "completed",
        "pending",
        "canceled",
        "no_show",
      ];
      const status = allowedStatuses.includes(event.status)
        ? event.status
        : "confirmed";
      await supabase
        .from("appointments")
        .update({
          status,
          whatsapp_client_reply: event.whatsappClientReply || "none",
          notes: event.addressOrNotes,
        })
        .eq("id", event.id);
    }
  } catch (err) {
    console.warn("Falha ao atualizar agendamento no Supabase:", err);
  }
}

/**
 * Insere um novo cliente no Supabase (se configurado)
 */
export async function syncNewClientToSupabase(
  client: ClientProfile,
  professionalId = "11111111-1111-1111-1111-111111111111"
) {
  if (!isSupabaseConfigured()) return;

  try {
    let profId = professionalId;
    if (!isValidUuid(profId)) {
      const { data: profs } = await supabase
        .from("professionals")
        .select("id")
        .limit(1);
      if (profs && profs[0]?.id) {
        profId = profs[0].id;
      } else {
        profId = "11111111-1111-1111-1111-111111111111";
      }
    }

    await supabase.from("clients").insert({
      id: isValidUuid(client.id) ? client.id : undefined,
      professional_id: profId,
      full_name: client.fullName,
      email: client.email || null,
      phone_whatsapp: client.phone,
      avatar_color: client.avatarColor || "#FBCFE8",
      anamnesis_notes: client.notesAndForms?.anamnesis || "",
      allergies_warnings: client.notesAndForms?.allergies || "",
      preferences_notes: client.notesAndForms?.formulasAndPreferences || "",
      birthday: client.notesAndForms?.birthday || "",
      send_automatic_reminders: client.sendAutomaticReminders ?? true,
      total_spent_cents: client.totalSpentCents || 0,
      visits_count: client.visitsCount || 1,
      no_show_count: client.noShowCount || 0,
    });
  } catch (err) {
    console.warn("Falha ao persistir cliente no Supabase:", err);
  }
}
