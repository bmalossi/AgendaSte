"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { NavigationSectionId } from "@/lib/agendaste-store";

// Carregamento dinâmico estritamente client-side para o painel operacional.
// Evita ChunkLoadError de SSR no Webpack e permite hidratação suave com skeleton editorial.
const LuveaApp = dynamic(
  () =>
    import("@/components/agendaste/agendaste-app").then((mod) => mod.LuveaApp),
  {
    ssr: false,
    loading: () => <DashboardLoadingSkeleton />,
  }
);

function DashboardLoadingSkeleton() {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar Skeleton */}
      <div className="w-60 border-r border-[#E5E5EA] bg-[#F9F9FB] p-4 flex flex-col justify-between hidden md:flex">
        <div className="space-y-4">
          <div className="h-7 w-28 bg-[#E5E5EA] rounded-lg animate-pulse" />
          <div className="space-y-2 pt-4">
            <div className="h-9 w-full bg-[#E5E5EA] rounded-xl animate-pulse" />
            <div className="h-9 w-full bg-[#E5E5EA] rounded-xl animate-pulse" />
            <div className="h-9 w-full bg-[#E5E5EA] rounded-xl animate-pulse" />
            <div className="h-9 w-full bg-[#E5E5EA] rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-full bg-[#E5E5EA] rounded-xl animate-pulse" />
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-14 border-b border-[#E5E5EA] px-6 flex items-center justify-between">
          <div className="h-5 w-36 bg-[#E5E5EA] rounded animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 bg-[#E5E5EA] rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-[#E5E5EA] rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex-1 p-6 sm:p-8 space-y-6">
          <div className="h-28 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="h-36 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl animate-pulse" />
            <div className="h-36 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl animate-pulse" />
            <div className="h-36 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AppDashboardContent() {
  const searchParams = useSearchParams();
  const initialSection = (searchParams.get("view") as NavigationSectionId) || "get_started";
  const initialTab = searchParams.get("tab") || undefined;
  const initialWizard = searchParams.get("wizard") === "true" || searchParams.get("wizard") === "1";
  const stepParam = searchParams.get("step");
  const initialStep = stepParam ? parseInt(stepParam, 10) : undefined;

  return (
    <LuveaApp
      initialSection={initialSection}
      initialTab={initialTab}
      initialWizard={initialWizard}
      initialStep={initialStep}
    />
  );
}

export default function AppDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <AppDashboardContent />
    </Suspense>
  );
}
