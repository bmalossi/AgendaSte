import { supabase, isSupabaseConfigured } from "./client";
import {
  StudioState,
  ServiceCatalogItem,
  PhysicalResource,
  ClientProfile,
  CalendarEventItem,
  WaitlistEntryItem,
} from "../agendaste-store";

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
 * diretamente para o StudioState do AgendaSte.
 */
export async function loadStudioStateFromSupabase(
  initialState: StudioState
): Promise<StudioState> {
  if (!isSupabaseConfigured()) {
    return initialState;
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
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("appointments").select("*").order("starts_at", { ascending: true }),
      supabase.from("waitlist_entries").select("*"),
    ]);

    const updated = { ...initialState };

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
          legalEntityType: p.legal_entity_type || updated.settings.business.legalEntityType,
          taxIdCnpjCpf: p.tax_id_cnpj_cpf || updated.settings.business.taxIdCnpjCpf,
          pixKey: p.pix_key || updated.settings.business.pixKey,
          defaultDepositPercent: p.default_deposit_percent ?? updated.settings.business.defaultDepositPercent,
        },
      };
      if (p.weekly_goal_cents && updated.staff[0]) {
        updated.staff[0].weeklyGoalCents = p.weekly_goal_cents;
      }
    }

    // 2. Recursos Físicos
    if (resourcesData && resourcesData.length > 0) {
      updated.resources = resourcesData.map((r): PhysicalResource => ({
        id: r.id,
        name: r.name,
        category: r.category as "equipment" | "room",
        description: r.description || "",
        assignedServiceIds: [],
      }));
    }

    // 3. Catálogo de Serviços
    if (servicesData && servicesData.length > 0) {
      updated.services = servicesData.map((s): ServiceCatalogItem => ({
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
      }));
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
            Array.isArray(c.auto_sorted_photos) && c.auto_sorted_photos.length > 0
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

    // 5. Agendamentos
    if (appointmentsData && appointmentsData.length > 0) {
      updated.calendarEvents = appointmentsData.map((a): CalendarEventItem => {
        const client = updated.clients.find((c) => c.id === a.client_id);
        const starts = new Date(a.starts_at);
        const dateISO = starts.toISOString().slice(0, 10);
        const startTime = starts.toTimeString().slice(0, 5);
        const activeMinutes = a.active_duration_minutes || 60;
        const endTime = calculateEndTime(startTime, activeMinutes);

        const srvNames = (a.service_ids || [])
          .map((id: string) => updated.services.find((s) => s.id === id)?.name)
          .filter(Boolean) as string[];

        return {
          id: a.id,
          eventType: a.event_type || "appointment",
          dateISO,
          startTime,
          endTime,
          activeDurationMinutes: activeMinutes,
          processingStartOffsetMinutes: a.processing_start_offset_minutes || 0,
          processingDurationMinutes: a.processing_duration_minutes || 0,
          blockAfterMinutes: a.block_after_minutes || 0,
          providerId: "staff-bruno",
          providerName: `${updated.settings.personal.firstName} ${updated.settings.personal.lastName}`,
          clientId: a.client_id || undefined,
          clientName: client ? client.fullName : "Cliente",
          serviceIds: a.service_ids || [],
          serviceNames: srvNames.length > 0 ? srvNames : ["Atendimento"],
          resourceIds: a.resource_ids || [],
          addressOrNotes: a.notes || "",
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
      });
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
    return initialState;
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
    const startsAt = new Date(`${event.dateISO}T${event.startTime}:00`).toISOString();
    const endsAt = new Date(
      new Date(`${event.dateISO}T${event.startTime}:00`).getTime() +
        event.activeDurationMinutes * 60000
    ).toISOString();

    await supabase.from("appointments").insert({
      id: event.id.length === 36 ? event.id : undefined,
      professional_id: professionalId,
      client_id: event.clientId && event.clientId.length === 36 ? event.clientId : null,
      service_ids: event.serviceIds.filter((id) => id.length === 36),
      resource_ids: event.resourceIds.filter((id) => id.length === 36),
      event_type: event.eventType,
      starts_at: startsAt,
      ends_at: endsAt,
      active_duration_minutes: event.activeDurationMinutes,
      processing_start_offset_minutes: event.processingStartOffsetMinutes || 0,
      processing_duration_minutes: event.processingDurationMinutes || 0,
      block_after_minutes: event.blockAfterMinutes || 0,
      is_repeating: event.isRepeating,
      status: event.status,
      total_cents: event.totalCents,
      deposit_cents: event.depositCents,
      deposit_paid: event.depositPaid,
      payment_method: "Pix",
      notes: event.addressOrNotes,
      whatsapp_client_reply: event.whatsappClientReply || "none",
    });
  } catch (err) {
    console.warn("Falha ao persistir agendamento no Supabase:", err);
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
    await supabase.from("clients").insert({
      id: client.id.length === 36 ? client.id : undefined,
      professional_id: professionalId,
      full_name: client.fullName,
      email: client.email,
      phone_whatsapp: client.phone,
      avatar_color: client.avatarColor,
      anamnesis_notes: client.notesAndForms.anamnesis,
      allergies_warnings: client.notesAndForms.allergies,
      preferences_notes: client.notesAndForms.formulasAndPreferences,
      birthday: client.notesAndForms.birthday,
      send_automatic_reminders: client.sendAutomaticReminders,
      total_spent_cents: client.totalSpentCents,
      visits_count: client.visitsCount,
      no_show_count: client.noShowCount,
    });
  } catch (err) {
    console.warn("Falha ao persistir cliente no Supabase:", err);
  }
}
