"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  X,
  Calendar,
  CreditCard,
  Contact,
  Sparkles,
  Settings,
  ExternalLink,
  Plus,
} from "lucide-react";
import {
  StudioState,
  NavigationSectionId,
  CalendarEventItem,
  createInitialStudioState,
} from "@/lib/agendaste-store";
import { AgendaSteSidebar } from "@/components/agendaste/sidebar";
import {
  GetStartedView,
  PublicBookingSiteModal,
  ReceptionView,
} from "@/components/agendaste/views/get-started-and-reception";
import { CalendarView } from "@/components/agendaste/views/calendar-view";
import { ClientsView } from "@/components/agendaste/views/clients-view";
import {
  PaymentsView,
  QuickSaleDrawer,
} from "@/components/agendaste/views/payments-view";
import { CatalogView } from "@/components/agendaste/views/catalog-view";
import { TeamView } from "@/components/agendaste/views/team-view";
import {
  MarketingView,
  SettingsView,
  ComplementarySectionView,
} from "@/components/agendaste/views/marketing-and-settings-view";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadStudioStateFromSupabase } from "@/lib/supabase/agendaste-sync";

export function AgendaSteApp() {
  const [state, setState] = useState<StudioState>(() =>
    createInitialStudioState()
  );
  const [activeSection, setActiveSection] =
    useState<NavigationSectionId>("get_started");
  const [bookingSiteOpen, setBookingSiteOpen] = useState(false);
  const [quickSaleOpen, setQuickSaleOpen] = useState(false);
  const [quickSalePrefill, setQuickSalePrefill] =
    useState<CalendarEventItem | null>(null);

  // Hidratação ao vivo do Supabase e subscrição Realtime
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    loadStudioStateFromSupabase(state).then((liveState) => {
      setState(liveState);
    });

    const channel = supabase
      .channel("agendaste-realtime-appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          loadStudioStateFromSupabase(state).then((liveState) => {
            setState(liveState);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const completedOnboardingCount = state.onboarding.steps.filter(
    (s) => s.completed
  ).length;
  const totalOnboardingCount = state.onboarding.steps.length;

  const providerFullName = `${state.settings.personal.firstName} ${state.settings.personal.lastName}`;
  const providerShortName = `${state.settings.personal.firstName} F.`;

  const handleOpenQuickSale = (prefill?: CalendarEventItem) => {
    setQuickSalePrefill(prefill ?? null);
    setQuickSaleOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-[#1C1C1E]">
      {/* Left Collapsible AgendaSte Sidebar */}
      <AgendaSteSidebar
        activeSection={activeSection}
        onSelectSection={(sec) => setActiveSection(sec)}
        completedOnboardingCount={completedOnboardingCount}
        totalOnboardingCount={totalOnboardingCount}
        providerFullName={providerFullName}
        providerShortName={providerShortName}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 overflow-x-hidden">
        {activeSection === "get_started" && (
          <GetStartedView
            state={state}
            setState={setState}
            onNavigate={(sec) => setActiveSection(sec)}
            onOpenBookingSite={() => setBookingSiteOpen(true)}
          />
        )}

        {activeSection === "reception" && (
          <ReceptionView state={state} setState={setState} />
        )}

        {activeSection === "calendar" && (
          <CalendarView
            state={state}
            onUpdateState={setState}
            onOpenQuickSale={handleOpenQuickSale}
          />
        )}

        {activeSection === "clients" && (
          <ClientsView
            state={state}
            onUpdateState={setState}
            onNavigateToCalendarWithClient={() => setActiveSection("calendar")}
            onOpenQuickSale={() => handleOpenQuickSale()}
          />
        )}

        {(activeSection === "payments_sales_history" ||
          activeSection === "payments_invoices" ||
          activeSection === "payments_gift_cards") && (
          <PaymentsView
            section={activeSection}
            state={state}
            onUpdateState={setState}
            onOpenQuickSale={handleOpenQuickSale}
          />
        )}

        {(activeSection === "catalog_services" ||
          activeSection === "catalog_packages" ||
          activeSection === "catalog_memberships" ||
          activeSection === "catalog_resources") && (
          <CatalogView
            section={activeSection}
            state={state}
            onUpdateState={setState}
          />
        )}

        {(activeSection === "team_staff" ||
          activeSection === "team_commissions" ||
          activeSection === "team_payroll" ||
          activeSection === "team_time_tracking") && (
          <TeamView
            section={activeSection}
            state={state}
            onUpdateState={setState}
          />
        )}

        {activeSection === "marketing" && (
          <MarketingView state={state} onUpdateState={setState} />
        )}

        {activeSection === "settings" && (
          <SettingsView state={state} onUpdateState={setState} />
        )}

        {(activeSection === "insights" ||
          activeSection === "inventory" ||
          activeSection === "charts" ||
          activeSection === "refer") && (
          <ComplementarySectionView
            section={activeSection}
            state={state}
            onUpdateState={setState}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (<768px): Agenda, Venda Rápida, Clientes, Recepção IA, Menu */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E5E5EA] px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveSection("calendar")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold ${
            activeSection === "calendar" ? "text-[#6E56CF]" : "text-[#6E6E73]"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda</span>
        </button>
        <button
          onClick={() => handleOpenQuickSale()}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold text-[#1C1C1E]"
        >
          <CreditCard className="w-4 h-4 text-[#E11D8F]" />
          <span>Venda Rápida</span>
        </button>
        <button
          onClick={() => setActiveSection("clients")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold ${
            activeSection === "clients" ? "text-[#6E56CF]" : "text-[#6E6E73]"
          }`}
        >
          <Contact className="w-4 h-4" />
          <span>Clientes</span>
        </button>
        <button
          onClick={() => setActiveSection("reception")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold ${
            activeSection === "reception" ? "text-[#6E56CF]" : "text-[#6E6E73]"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Recepção IA</span>
        </button>
        <button
          onClick={() => setActiveSection("get_started")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold ${
            activeSection === "get_started"
              ? "text-[#6E56CF]"
              : "text-[#6E6E73]"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Global Public Booking Site Modal (Aura Studio — 01-1-get-started.png) */}
      {bookingSiteOpen && (
        <PublicBookingSiteModal
          state={state}
          setState={setState}
          onClose={() => setBookingSiteOpen(false)}
        />
      )}

      {/* Global Quick Sale POS Drawer */}
      <QuickSaleDrawer
        open={quickSaleOpen}
        onClose={() => setQuickSaleOpen(false)}
        state={state}
        prefillAppointment={quickSalePrefill}
        onUpdateState={setState}
      />

      {/* Floating Bottom-Center Dark Toast Notification matching 05-3-clients-added.png & DESIGN.md §4.4 */}
      {state.lastToastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-[#1C1C1E] text-white shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span className="text-[13px] font-semibold">
            {state.lastToastMessage}
          </span>
          <button
            onClick={() =>
              setState((prev) => ({ ...prev, lastToastMessage: null }))
            }
            className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
