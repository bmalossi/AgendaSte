"use client";

import React, { useState } from "react";
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
} from "@/lib/glossgenius-store";
import { GlossGeniusSidebar } from "@/components/glossgenius/sidebar";
import {
  GetStartedView,
  PublicBookingSiteModal,
  ReceptionView,
} from "@/components/glossgenius/views/get-started-and-reception";
import { CalendarView } from "@/components/glossgenius/views/calendar-view";
import { ClientsView } from "@/components/glossgenius/views/clients-view";
import {
  PaymentsView,
  QuickSaleDrawer,
} from "@/components/glossgenius/views/payments-view";
import { CatalogView } from "@/components/glossgenius/views/catalog-view";
import { TeamView } from "@/components/glossgenius/views/team-view";
import {
  MarketingView,
  SettingsView,
  ComplementarySectionView,
} from "@/components/glossgenius/views/marketing-and-settings-view";

export function GlossGeniusApp() {
  const [state, setState] = useState<StudioState>(() =>
    createInitialStudioState()
  );
  const [activeSection, setActiveSection] =
    useState<NavigationSectionId>("get_started");
  const [bookingSiteOpen, setBookingSiteOpen] = useState(false);
  const [quickSaleOpen, setQuickSaleOpen] = useState(false);
  const [quickSalePrefill, setQuickSalePrefill] =
    useState<CalendarEventItem | null>(null);

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
      {/* Left Collapsible GlossGenius Sidebar */}
      <GlossGeniusSidebar
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

      {/* Mobile Bottom Navigation Bar (<768px) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E5E5EA] px-2 py-1.5 flex items-center justify-around">
        {[
          {
            id: "get_started" as NavigationSectionId,
            label: "Início",
            icon: Sparkles,
          },
          {
            id: "calendar" as NavigationSectionId,
            label: "Agenda",
            icon: Calendar,
          },
          {
            id: "clients" as NavigationSectionId,
            label: "Clientes",
            icon: Contact,
          },
          {
            id: "payments_sales_history" as NavigationSectionId,
            label: "Vendas",
            icon: CreditCard,
          },
          {
            id: "settings" as NavigationSectionId,
            label: "Ajustes",
            icon: Settings,
          },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold ${
                active ? "text-[#6E56CF]" : "text-[#6E6E73]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
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

      {/* Floating Bottom-Right Dark Toast Notification matching 05-3-clients-added.png */}
      {state.lastToastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1C1C1E] text-white shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-3">
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
