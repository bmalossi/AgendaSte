"use client";

import React, { useState, useEffect, use } from "react";
import { PublicBookingWebsite } from "@/components/agendaste/public-booking-website";
import {
  createInitialStudioState,
  StudioState,
} from "@/lib/agendaste-store";

interface SitePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function PublicSitePage({ params }: SitePageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [state, setState] = useState<StudioState>(() => {
    const initial = createInitialStudioState();
    if (initial.settings.website) {
      initial.settings.website.subdomainSlug = slug;
      initial.settings.website.websitePublished = true;
    }
    return initial;
  });

  // Hydrate from localStorage if running in browser
  useEffect(() => {
    try {
      const cached =
        localStorage.getItem("luvea_studio_state_v1") ||
        localStorage.getItem("agendaste_studio_state_v1");
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
      console.warn("Erro ao carregar estado do estúdio:", e);
    }
  }, [slug]);

  const handleUpdateStudioState = (
    updater: StudioState | ((prev: StudioState) => StudioState)
  ) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem("luvea_studio_state_v1", JSON.stringify(next));
      } catch (e) {
        console.warn("Erro ao salvar no localStorage:", e);
      }
      return next;
    });
  };

  return (
    <PublicBookingWebsite
      state={state}
      onUpdateState={handleUpdateStudioState}
      isModal={false}
    />
  );
}
