"use client";

import React, { useState, useEffect, use } from "react";
import { PublicBookingWebsite } from "@/components/agendaste/public-booking-website";
import {
  createEmptyTenantStudioState,
  StudioState,
  ServiceCatalogItem,
  PhysicalResource,
  CalendarEventItem,
} from "@/lib/agendaste-store";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { isValidUuid } from "@/lib/supabase/agendaste-sync";

interface SitePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function PublicSitePage({ params }: SitePageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const publicCacheKey = `luvea_public_site_${slug}`;
  const [notFound, setNotFound] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [defaultProfId, setDefaultProfId] = useState<string | null>(null);

  // Inicializa com estado limpo do próprio estúdio (ZERO dados demo de terceiros)
  const [state, setState] = useState<StudioState>(() => {
    const initial = createEmptyTenantStudioState({
      businessName: slug,
      subdomain: slug,
    });
    if (initial.settings.website) {
      initial.settings.website.subdomainSlug = slug;
      initial.settings.website.websitePublished = true;
    }
    return initial;
  });

  // Hidratação estritamente isolada por SLUG do estúdio (nunca compartilha cache com o painel admin)
  useEffect(() => {
    try {
      const cached = localStorage.getItem(publicCacheKey);
      if (cached) {
        const parsed: StudioState = JSON.parse(cached);
        if (parsed) {
          setState((prev) => ({
            ...parsed,
            settings: {
              ...parsed.settings,
              website: {
                ...(parsed.settings.website ?? prev.settings.website),
                subdomainSlug: slug,
                websitePublished: true,
              },
            },
          }));
        }
      }
    } catch (e) {
      console.warn("Erro ao carregar cache do site público:", e);
    }

    // Se o Supabase estiver configurado, busca os dados públicos da organização pelo slug
    if (isSupabaseConfigured()) {
      async function loadPublicTenantData() {
        try {
          // 1. Tenta primeiro via RPC segura get_public_studio_by_slug (SECURITY DEFINER para anon)
          let org: any = null;
          const { data: rpcOrg, error: rpcError } = await supabase.rpc(
            "get_public_studio_by_slug",
            { p_slug: slug }
          );

          if (!rpcError && rpcOrg) {
            org = Array.isArray(rpcOrg) ? rpcOrg[0] : rpcOrg;
          }

          // Fallback caso a RPC não esteja disponível
          if (!org) {
            const { data: tableOrg } = await supabase
              .from("organizations")
              .select("id, name, slug, phone, whatsapp_number, settings")
              .eq("slug", slug)
              .maybeSingle();
            org = tableOrg;
          }

          if (org && org.id) {
            setOrgId(org.id);
            setNotFound(false);

            // Janela para consulta segura de horários ocupados (mês atual + próximo)
            const now = new Date();
            const startWindow = new Date(
              now.getFullYear(),
              now.getMonth(),
              1
            ).toISOString();
            const endWindow = new Date(
              now.getFullYear(),
              now.getMonth() + 2,
              1
            ).toISOString();

            const [
              { data: servicesData },
              { data: profsData },
              { data: resourcesData },
              { data: busySlotsData },
            ] = await Promise.all([
              supabase
                .from("services")
                .select("*")
                .eq("organization_id", org.id)
                .eq("active", true),
              supabase
                .from("professionals")
                .select("*")
                .eq("organization_id", org.id),
              supabase
                .from("resources")
                .select("*")
                .eq("organization_id", org.id),
              supabase.rpc("get_public_busy_slots", {
                p_org_id: org.id,
                p_start: startWindow,
                p_end: endWindow,
              }),
            ]);

            const primaryProf = profsData && profsData[0] ? profsData[0].id : null;
            if (primaryProf) {
              setDefaultProfId(primaryProf);
            }

            // Converte horários ocupados em slots bloqueados (zero vazamento de PII de clientes)
            const busyEvents: CalendarEventItem[] = (busySlotsData || []).map(
              (slot: any, idx: number): CalendarEventItem => {
                const starts = new Date(slot.starts_at);
                const year = starts.getFullYear();
                const month = String(starts.getMonth() + 1).padStart(2, "0");
                const day = String(starts.getDate()).padStart(2, "0");
                const dateISO = `${year}-${month}-${day}`;
                const hours = String(starts.getHours()).padStart(2, "0");
                const minutes = String(starts.getMinutes()).padStart(2, "0");
                const startTime = `${hours}:${minutes}`;

                const ends = new Date(slot.ends_at);
                const endHours = String(ends.getHours()).padStart(2, "0");
                const endMinutes = String(ends.getMinutes()).padStart(2, "0");
                const endTime = `${endHours}:${endMinutes}`;

                const durationMin = Math.round(
                  (ends.getTime() - starts.getTime()) / (60 * 1000)
                );

                return {
                  id: `busy-slot-${idx}`,
                  eventType: "appointment",
                  dateISO,
                  startTime,
                  endTime,
                  activeDurationMinutes: durationMin,
                  processingStartOffsetMinutes: 0,
                  processingDurationMinutes: 0,
                  blockAfterMinutes: 0,
                  providerId: primaryProf || "staff-owner",
                  providerName: "Ocupado",
                  clientName: "Horário Reservado",
                  serviceIds: [],
                  serviceNames: ["Atendimento"],
                  resourceIds: slot.resource_ids || [],
                  addressOrNotes: "",
                  isRepeating: false,
                  collectDeposit: false,
                  depositCents: 0,
                  depositPaid: true,
                  totalCents: 0,
                  status: "confirmed",
                  calendarColor: "#9CA3AF",
                  whatsappReminderSent: false,
                  whatsappClientReply: "none",
                };
              }
            );

            setState((prev) => {
              const next: StudioState = {
                ...prev,
                settings: {
                  ...prev.settings,
                  personal: {
                    ...prev.settings.personal,
                    phone: org.phone || prev.settings.personal.phone,
                  },
                  business: {
                    ...prev.settings.business,
                    businessName: org.name || prev.settings.business.businessName,
                    bookingSlug: org.slug,
                  },
                  website: {
                    ...(prev.settings.website ?? {
                      theme: "classic",
                      subdomainSlug: org.slug,
                      websitePublished: true,
                    }),
                    subdomainSlug: org.slug,
                    websitePublished: true,
                  },
                },
                staff:
                  profsData && profsData.length > 0
                    ? profsData.map((p: any) => ({
                        id: p.id,
                        firstName: p.first_name || "Profissional",
                        lastName: p.last_name || "",
                        fullName:
                          `${p.first_name || ""} ${p.last_name || ""}`.trim() ||
                          p.studio_name ||
                          "Profissional",
                        initials: (p.first_name?.[0] || "P").toUpperCase(),
                        role: "Especialista",
                        avatarColor: "#E11D8F",
                        email: p.email || "",
                        phone: p.phone_whatsapp || "",
                        serviceCommissionPercent: 60,
                        productCommissionPercent: 20,
                        weeklyGoalCents: p.weekly_goal_cents || 500000,
                        bookedThisWeekCents: 0,
                        clockInNotificationsEnabled: false,
                        assignedServiceIds: [],
                      }))
                    : prev.staff,
                services:
                  servicesData && servicesData.length > 0
                    ? servicesData.map(
                        (s: any): ServiceCatalogItem => ({
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
                          processingTimeEnabled:
                            s.processing_time_enabled ?? false,
                          processingStartOffsetMinutes:
                            s.processing_start_offset_minutes || 0,
                          processingDurationMinutes:
                            s.processing_duration_minutes || 0,
                          blockTimeEnabled: s.block_time_enabled ?? false,
                          blockAfterMinutes: s.block_after_minutes || 0,
                          requiredResourceIds: s.required_resource_ids || [],
                          options: Array.isArray(s.options) ? s.options : [],
                          addOns: Array.isArray(s.add_ons) ? s.add_ons : [],
                        })
                      )
                    : prev.services,
                resources:
                  resourcesData && resourcesData.length > 0
                    ? resourcesData.map(
                        (r: any): PhysicalResource => ({
                          id: r.id,
                          name: r.name,
                          category: r.category as "equipment" | "room",
                          description: r.description || "",
                          assignedServiceIds: [],
                        })
                      )
                    : prev.resources,
                calendarEvents: busyEvents,
              };

              try {
                localStorage.setItem(publicCacheKey, JSON.stringify(next));
              } catch {}

              return next;
            });
          } else {
            // Organização não encontrada no Supabase
            setNotFound(true);
          }
        } catch (err) {
          console.warn("Erro ao buscar dados públicos do estúdio:", err);
        }
      }

      loadPublicTenantData();
    }
  }, [slug, publicCacheKey]);

  const handleUpdateStudioState = async (
    updater: StudioState | ((prev: StudioState) => StudioState)
  ) => {
    let nextState: StudioState | null = null;

    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      nextState = next;
      try {
        localStorage.setItem(publicCacheKey, JSON.stringify(next));
      } catch (e) {
        console.warn("Erro ao salvar no localStorage do site:", e);
      }
      return next;
    });

    // Se o cliente gerou um novo agendamento, persiste de forma segura no Supabase
    const activeOrgId = orgId;
    if (nextState && activeOrgId && isSupabaseConfigured()) {
      const targetState = nextState as StudioState;
      const newEvt = targetState.calendarEvents[0];

      if (newEvt && (newEvt.id.startsWith("evt-online-") || !isValidUuid(newEvt.id))) {
        try {
          const client = targetState.clients.find(
            (c) =>
              c.fullName.toLowerCase() === newEvt.clientName.toLowerCase() ||
              (c.id && c.id === newEvt.clientId)
          );

          // 1. Cria ou localiza o cliente no Supabase via política pública segura
          let validClientId: string | null = null;
          if (client) {
            const { data: newCli } = await supabase
              .from("clients")
              .insert({
                organization_id: activeOrgId,
                professional_id: isValidUuid(newEvt.providerId)
                  ? newEvt.providerId
                  : defaultProfId || undefined,
                full_name: client.fullName,
                phone_whatsapp: client.phone || "(11) 99876-5432",
                email: client.email || "",
                avatar_color: client.avatarColor || "#FBCFE8",
                anamnesis_notes:
                  client.notesAndForms?.anamnesis ||
                  "Cadastro via Site de Agendamento Online.",
              })
              .select("id")
              .maybeSingle();

            if (newCli?.id) {
              validClientId = newCli.id;
            }
          }

          // 2. Insere o agendamento no Supabase vinculado à organização correta
          const startsAt = new Date(
            `${newEvt.dateISO}T${newEvt.startTime}:00`
          ).toISOString();
          const durationMs = (newEvt.activeDurationMinutes || 60) * 60 * 1000;
          const endsAt = new Date(
            new Date(startsAt).getTime() + durationMs
          ).toISOString();

          const metaLine = `__LUVEA_META__:${JSON.stringify({
            clientName: newEvt.clientName,
            serviceNames: newEvt.serviceNames,
            dateISO: newEvt.dateISO,
            startTime: newEvt.startTime,
            originalId: newEvt.id,
            addressOrNotes: newEvt.addressOrNotes || "",
          })}`;
          const notesToSave = newEvt.addressOrNotes
            ? `${metaLine}\n${newEvt.addressOrNotes}`
            : metaLine;

          await supabase.from("appointments").insert({
            organization_id: activeOrgId,
            professional_id: isValidUuid(newEvt.providerId)
              ? newEvt.providerId
              : defaultProfId || undefined,
            client_id: validClientId,
            service_ids: (newEvt.serviceIds || []).filter(isValidUuid),
            resource_ids: (newEvt.resourceIds || []).filter(isValidUuid),
            event_type: "appointment",
            starts_at: startsAt,
            ends_at: endsAt,
            active_duration_minutes: newEvt.activeDurationMinutes || 60,
            processing_start_offset_minutes:
              newEvt.processingStartOffsetMinutes || 0,
            processing_duration_minutes:
              newEvt.processingDurationMinutes || 0,
            block_after_minutes: newEvt.blockAfterMinutes || 0,
            is_repeating: false,
            status: newEvt.status || "confirmed",
            total_cents: newEvt.totalCents || 0,
            deposit_cents: newEvt.depositCents || 0,
            deposit_paid: Boolean(newEvt.depositPaid),
            payment_method: "pix",
            notes: notesToSave,
            whatsapp_client_reply: "none",
          });
        } catch (syncErr) {
          console.warn("Erro ao persistir agendamento no Supabase:", syncErr);
        }
      }
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E5E5EA] p-8 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] border border-[#E5E5EA] mx-auto flex items-center justify-center text-[#1C1C1E]">
            <span className="font-serif text-lg font-bold">L</span>
          </div>
          <h1 className="text-xl font-semibold text-[#1C1C1E] tracking-tight">
            Estúdio não encontrado
          </h1>
          <p className="text-xs sm:text-[13px] text-[#6E6E73] leading-relaxed">
            O endereço <span className="font-mono text-[#1C1C1E]">{slug}.luvea.app</span> não está registrado ou não se encontra ativo no momento.
          </p>
          <div className="pt-2">
            <a
              href="https://luvea.app"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#1C1C1E] text-white text-xs font-medium hover:bg-black transition-colors"
            >
              Conhecer a LUVEA
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PublicBookingWebsite
      state={state}
      onUpdateState={handleUpdateStudioState}
      isModal={false}
    />
  );
}
