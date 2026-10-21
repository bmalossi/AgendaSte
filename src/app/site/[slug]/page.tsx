"use client";

import React, { useState, useEffect, use } from "react";
import { PublicBookingWebsite } from "@/components/agendaste/public-booking-website";
import {
  createInitialStudioState,
  StudioState,
  ServiceCatalogItem,
  PhysicalResource,
} from "@/lib/agendaste-store";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

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

  const [state, setState] = useState<StudioState>(() => {
    const initial = createInitialStudioState();
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
          const { data: org } = await supabase
            .from("organizations")
            .select("id, name, slug, phone, whatsapp_number, settings")
            .eq("slug", slug)
            .maybeSingle();

          if (org) {
            setNotFound(false);
            const [
              { data: servicesData },
              { data: profsData },
              { data: resourcesData },
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
            ]);

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
                          processingTimeEnabled: s.processing_time_enabled ?? false,
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

  const handleUpdateStudioState = (
    updater: StudioState | ((prev: StudioState) => StudioState)
  ) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(publicCacheKey, JSON.stringify(next));
      } catch (e) {
        console.warn("Erro ao salvar no localStorage do site:", e);
      }
      return next;
    });
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
