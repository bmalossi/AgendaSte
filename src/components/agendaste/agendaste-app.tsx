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
  Menu,
  ClipboardList,
  Users,
  Banknote,
  Package,
  BarChart3,
  Gift,
  ShieldCheck,
  ChevronRight,
  Clock,
  LogOut,
} from "lucide-react";
import {
  StudioState,
  NavigationSectionId,
  CalendarEventItem,
  createInitialStudioState,
  getTodayDateISO,
  getBookingSiteUrl,
} from "@/lib/agendaste-store";
import { LuveaSidebar } from "@/components/agendaste/sidebar";
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
import { WebsiteSetupWizard } from "@/components/agendaste/website-setup-wizard";
import { supabase, isSupabaseConfigured, signOutUser } from "@/lib/supabase/client";
import {
  loadStudioStateFromSupabase,
  syncNewAppointmentToSupabase,
  syncAppointmentUpdateToSupabase,
  syncNewClientToSupabase,
} from "@/lib/supabase/agendaste-sync";

export function LuveaApp({
  initialSection = "get_started",
  initialTab,
  initialWizard = false,
  initialStep = 1,
}: {
  initialSection?: NavigationSectionId;
  initialTab?: string;
  initialWizard?: boolean;
  initialStep?: number;
}) {
  const [state, setState] = useState<StudioState>(() =>
    createInitialStudioState()
  );
  const [activeSection, setActiveSection] =
    useState<NavigationSectionId>(initialSection);
  const [bookingSiteOpen, setBookingSiteOpen] = useState(false);
  const [websiteWizardOpen, setWebsiteWizardOpen] = useState(initialWizard);
  const [websiteWizardInitialStep, setWebsiteWizardInitialStep] =
    useState(initialStep || 1);
  const [quickSaleOpen, setQuickSaleOpen] = useState(false);
  const [quickSalePrefill, setQuickSalePrefill] =
    useState<CalendarEventItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleOpenMyBookingSite = () => {
    const isPublished = Boolean(state.settings.website?.websitePublished);
    if (!isPublished) {
      setWebsiteWizardInitialStep(1);
      setWebsiteWizardOpen(true);
      return;
    }
    const slug = state.settings.website?.subdomainSlug;
    const targetUrl = getBookingSiteUrl(slug);
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  // Sincroniza seção e wizard com a URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("view") as NavigationSectionId | null;
      if (v) {
        setActiveSection(v);
      }
      const wiz = params.get("wizard");
      if (wiz === "true" || wiz === "1") {
        setWebsiteWizardOpen(true);
        const st = parseInt(params.get("step") || "1", 10);
        if (!isNaN(st)) setWebsiteWizardInitialStep(st);
      }
    }
  }, []);

  // Manipulador universal de estado com persistência dupla (localStorage + Supabase)
  const handleUpdateStudioState = (
    updater: StudioState | ((prev: StudioState) => StudioState)
  ) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;

      // 1. Persistência Instantânea Local (Zero perda em refresh/reload)
      try {
        localStorage.setItem("luvea_studio_state_v1", JSON.stringify(next));
      } catch (err) {
        console.warn("Erro ao salvar no localStorage:", err);
      }

      // 2. Persistência na Nuvem (Supabase)
      if (isSupabaseConfigured()) {
        // Detecta agendamentos recém-criados
        const prevIds = new Set(prev.calendarEvents.map((e) => e.id));
        const newEvents = next.calendarEvents.filter((e) => !prevIds.has(e.id));
        for (const evt of newEvents) {
          syncNewAppointmentToSupabase(evt, next.staff[0]?.id).catch(console.error);
        }

        // Detecta agendamentos com status alterado
        for (const evt of next.calendarEvents) {
          const oldEvt = prev.calendarEvents.find((e) => e.id === evt.id);
          if (
            oldEvt &&
            (oldEvt.status !== evt.status ||
              oldEvt.whatsappClientReply !== evt.whatsappClientReply)
          ) {
            syncAppointmentUpdateToSupabase(evt).catch(console.error);
          }
        }

        // Detecta novos clientes
        const prevClientIds = new Set(prev.clients.map((c) => c.id));
        const newClients = next.clients.filter((c) => !prevClientIds.has(c.id));
        for (const cli of newClients) {
          syncNewClientToSupabase(cli).catch(console.error);
        }
      }

      return next;
    });
  };

  // Hidratação ao vivo (localStorage + Supabase) e subscrição Realtime
  useEffect(() => {
    let localState = state;
    try {
      const cached =
        localStorage.getItem("luvea_studio_state_v1") ||
        localStorage.getItem("agendaste_studio_state_v1");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.calendarEvents)) {
          if (parsed.calendarView?.selectedDateISO === "2026-10-17") {
            parsed.calendarView.selectedDateISO = getTodayDateISO();
          }
          localState = parsed;
          setState(parsed);
        }
      }
    } catch (err) {
      console.warn("Erro ao restaurar do localStorage:", err);
    }

    if (!isSupabaseConfigured()) return;

    loadStudioStateFromSupabase(localState).then((liveState) => {
      setState(liveState);
      try {
        localStorage.setItem(
          "luvea_studio_state_v1",
          JSON.stringify(liveState)
        );
      } catch (e) {
        console.warn("Erro ao salvar cache:", e);
      }
    });

    const channel = supabase
      .channel("luvea-realtime-appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          setState((curr) => {
            loadStudioStateFromSupabase(curr).then((liveState) => {
              setState(liveState);
              try {
                localStorage.setItem(
                  "luvea_studio_state_v1",
                  JSON.stringify(liveState)
                );
              } catch {}
            });
            return curr;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-dismiss do toast flutuante após 5 segundos
  useEffect(() => {
    if (!state.lastToastMessage) return;
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, lastToastMessage: null }));
    }, 5000);
    return () => clearTimeout(timer);
  }, [state.lastToastMessage]);

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

  function getSectionTitle(sec: NavigationSectionId): string {
    switch (sec) {
      case "calendar":
        return "Agenda";
      case "clients":
        return "Clientes";
      case "charts":
        return "Prontuários";
      case "reception":
        return "Recepção IA";
      case "payments_sales_history":
        return "Vendas";
      case "payments_invoices":
        return "Faturas";
      case "payments_gift_cards":
        return "Vale-Presentes";
      case "catalog_services":
        return "Serviços";
      case "catalog_packages":
        return "Pacotes";
      case "catalog_memberships":
        return "Assinaturas";
      case "catalog_resources":
        return "Recursos";
      case "team_staff":
        return "Equipe";
      case "team_commissions":
        return "Comissões";
      case "team_payroll":
        return "Repasses";
      case "team_time_tracking":
        return "Ponto";
      case "marketing":
        return "Marketing";
      case "insights":
      case "insights_analytics":
        return "Análises";
      case "insights_reports":
        return "Relatórios";
      case "inventory":
        return "Estoque";
      case "refer":
        return "Indicações";
      case "settings":
        return "Configurações";
      case "get_started":
      default:
        return "Primeiros Passos";
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-[#1C1C1E]">
      {/* Mobile Top Header (<768px): Studio & Section Identity + Quick Access */}
      <header className="md:hidden sticky top-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E5EA] px-3.5 py-2.5 flex items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#FBCFE8] text-[#831843] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            {providerShortName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-[14px] font-bold text-[#1C1C1E] leading-tight truncate">
              {getSectionTitle(activeSection)}
            </h1>
            <p className="text-[11px] text-[#6E6E73] leading-tight truncate">
              {state.settings.business.businessName || "Luvea Studio"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenMyBookingSite}
            title="Abrir site de agendamento online"
            className="h-9 px-3 rounded-full border border-[#D1D1D6] bg-white hover:bg-[#F5F5F7] text-[12px] font-medium text-[#1C1C1E] flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#1C1C1E]" />
            <span className="hidden sm:inline">Site Online</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu de navegação"
            className="w-9 h-9 rounded-full border border-[#D1D1D6] bg-white hover:bg-[#F5F5F7] flex items-center justify-center text-[#1C1C1E] active:scale-90 transition-transform"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Offcanvas Drawer (<768px): Full Studio Navigation */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-start animate-in fade-in duration-150"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-[85%] max-w-[320px] bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E5E5EA] flex items-center justify-between gap-3 bg-[#FAF9F6]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#FBCFE8] text-[#831843] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {providerShortName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-[#1C1C1E] truncate">
                    {providerFullName}
                  </p>
                  <p className="text-[11.5px] text-[#6E6E73] truncate">
                    {state.settings.personal.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
                className="w-8 h-8 rounded-full border border-[#D1D1D6] flex items-center justify-center text-[#1C1C1E] hover:bg-white active:scale-95 transition-transform shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Navigation Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 text-[13.5px]">
              {/* Grupo 1: Atendimento & Recepção */}
              <div>
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                  Atendimento &amp; Agenda
                </p>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("calendar");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "calendar"
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[#6E56CF]" />
                      <span>Agenda Inteligente</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("clients");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "clients"
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Contact className="w-4 h-4 text-[#6E56CF]" />
                      <span>Clientes &amp; Fichas</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("charts");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "charts"
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <ClipboardList className="w-4 h-4 text-[#6E56CF]" />
                      <span>Prontuários (Anamnese)</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("reception");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "reception"
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-[#6E56CF]" />
                      <span>Recepção IA &amp; WhatsApp</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>
                </div>
              </div>

              {/* Grupo 2: Financeiro */}
              <div>
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                  Financeiro &amp; PDV
                </p>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleOpenQuickSale();
                    }}
                    className="w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] active:scale-95 transition-transform"
                  >
                    <span className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-[#E11D8F]" />
                      <span>Venda Rápida POS</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold">
                      1-Toque
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("payments_sales_history");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "payments_sales_history"
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Banknote className="w-4 h-4 text-[#1C1C1E]" />
                      <span>Histórico de Vendas</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("payments_invoices");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "payments_invoices"
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-[#1C1C1E]" />
                      <span>Faturas &amp; Cobranças</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("insights_analytics");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "insights_analytics" || activeSection === "insights"
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-[#1C1C1E]" />
                      <span>Análises &amp; Métricas</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("insights_reports");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "insights_reports"
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-[#1C1C1E]" />
                      <span>Relatórios (12 Modelos)</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>
                </div>
              </div>

              {/* Grupo 3: Gestão & Catálogo */}
              <div>
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                  Gestão &amp; Catálogo
                </p>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("catalog_services");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection.startsWith("catalog_")
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-[#1C1C1E]" />
                      <span>Catálogo &amp; Serviços</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("team_staff");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection.startsWith("team_")
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-[#1C1C1E]" />
                      <span>Equipe &amp; Comissões</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("inventory");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "inventory"
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-[#1C1C1E]" />
                      <span>Estoque &amp; Backbar</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("marketing");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "marketing"
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-[#1C1C1E]" />
                      <span>Marketing IA</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>
                </div>
              </div>

              {/* Grupo 4: Sistema & Preferências */}
              <div>
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                  Sistema
                </p>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("settings");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "settings"
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-[#1C1C1E]" />
                      <span>Configurações</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("get_started");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "get_started"
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-[#5B43D6]" />
                      <span>Primeiros Passos ({completedOnboardingCount}/{totalOnboardingCount})</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("refer");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "refer"
                        ? "bg-[#ECE9FE] text-[#1C1C1E] font-semibold"
                        : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Gift className="w-4 h-4 text-[#1C1C1E]" />
                      <span>Indique e Ganhe R$ 150</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOutUser();
                    }}
                    className="w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#F5F5F7] active:scale-95 transition-transform"
                  >
                    <span className="flex items-center gap-3">
                      <LogOut className="w-4 h-4 text-[#8E8E93]" />
                      <span>Sair da conta</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Bar */}
            <div className="p-3 border-t border-[#E5E5EA] bg-[#FAF9F6] text-center">
              <span className="text-[11px] font-semibold text-[#8E8E93]">
                LUVEA PWA · Luvea Studio
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Left Collapsible LUVEA Sidebar (Desktop/Tablet >=768px) */}
      <LuveaSidebar
        activeSection={activeSection}
        onSelectSection={(sec) => setActiveSection(sec)}
        completedOnboardingCount={completedOnboardingCount}
        totalOnboardingCount={totalOnboardingCount}
        providerFullName={providerFullName}
        providerShortName={providerShortName}
        onSignOut={signOutUser}
      />

      {/* Main Content Workspace with safe area padding for bottom navigation */}
      <main className="flex-1 min-w-0 pb-[calc(5.2rem+env(safe-area-inset-bottom,0px))] md:pb-0 overflow-x-hidden">
        {activeSection === "get_started" && (
          <GetStartedView
            state={state}
            setState={handleUpdateStudioState}
            onNavigate={(sec) => setActiveSection(sec)}
            onOpenBookingSite={handleOpenMyBookingSite}
            onOpenWebsiteWizard={(step = 1) => {
              setWebsiteWizardInitialStep(step);
              setWebsiteWizardOpen(true);
            }}
          />
        )}

        {activeSection === "reception" && (
          <ReceptionView state={state} setState={handleUpdateStudioState} />
        )}

        {activeSection === "calendar" && (
          <CalendarView
            state={state}
            onUpdateState={handleUpdateStudioState}
            onOpenQuickSale={handleOpenQuickSale}
          />
        )}

        {activeSection === "clients" && (
          <ClientsView
            state={state}
            onUpdateState={handleUpdateStudioState}
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
            onUpdateState={handleUpdateStudioState}
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
            onUpdateState={handleUpdateStudioState}
          />
        )}

        {(activeSection === "team_staff" ||
          activeSection === "team_commissions" ||
          activeSection === "team_payroll" ||
          activeSection === "team_time_tracking") && (
          <TeamView
            section={activeSection}
            state={state}
            onUpdateState={handleUpdateStudioState}
          />
        )}

        {activeSection === "marketing" && (
          <MarketingView state={state} onUpdateState={handleUpdateStudioState} />
        )}

        {activeSection === "settings" && (
          <SettingsView
            state={state}
            onUpdateState={handleUpdateStudioState}
            initialTab={initialTab}
          />
        )}

        {(activeSection === "insights" ||
          activeSection === "insights_analytics" ||
          activeSection === "insights_reports" ||
          activeSection === "inventory" ||
          activeSection === "charts" ||
          activeSection === "refer") && (
          <ComplementarySectionView
            section={activeSection}
            state={state}
            onUpdateState={handleUpdateStudioState}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (<768px): Agenda, Clientes, + Venda, Prontuários, Menu */}
      <nav
        aria-label="Navegação móvel principal"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E5EA] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] select-none"
      >
        <div className="grid grid-cols-5 items-center justify-items-center">
          {/* 1. Agenda */}
          <button
            type="button"
            onClick={() => setActiveSection("calendar")}
            className="w-full h-12 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            <Calendar
              className={`w-5 h-5 transition-colors ${
                activeSection === "calendar" ? "text-[#6E56CF]" : "text-[#71717A]"
              }`}
            />
            <span
              className={`text-[10.5px] font-semibold leading-none ${
                activeSection === "calendar" ? "text-[#6E56CF]" : "text-[#71717A]"
              }`}
            >
              Agenda
            </span>
          </button>

          {/* 2. Clientes */}
          <button
            type="button"
            onClick={() => setActiveSection("clients")}
            className="w-full h-12 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            <Contact
              className={`w-5 h-5 transition-colors ${
                activeSection === "clients" ? "text-[#6E56CF]" : "text-[#71717A]"
              }`}
            />
            <span
              className={`text-[10.5px] font-semibold leading-none ${
                activeSection === "clients" ? "text-[#6E56CF]" : "text-[#71717A]"
              }`}
            >
              Clientes
            </span>
          </button>

          {/* 3. Center CTA: + Venda Rápida */}
          <button
            type="button"
            onClick={() => handleOpenQuickSale()}
            className="w-full h-12 flex flex-col items-center justify-center active:scale-90 transition-transform -mt-2"
          >
            <div className="w-11 h-11 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center shadow-md border-2 border-white">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-bold text-[#1C1C1E] mt-0.5 leading-none">
              Venda
            </span>
          </button>

          {/* 4. Prontuários (Anamnese) */}
          <button
            type="button"
            onClick={() => setActiveSection("charts")}
            className="w-full h-12 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            <ClipboardList
              className={`w-5 h-5 transition-colors ${
                activeSection === "charts" ? "text-[#6E56CF]" : "text-[#71717A]"
              }`}
            />
            <span
              className={`text-[10.5px] font-semibold leading-none ${
                activeSection === "charts" ? "text-[#6E56CF]" : "text-[#71717A]"
              }`}
            >
              Prontuários
            </span>
          </button>

          {/* 5. Menu Completo */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="w-full h-12 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            <Menu
              className={`w-5 h-5 transition-colors ${
                mobileMenuOpen ? "text-[#6E56CF]" : "text-[#71717A]"
              }`}
            />
            <span
              className={`text-[10.5px] font-semibold leading-none ${
                mobileMenuOpen ? "text-[#6E56CF]" : "text-[#71717A]"
              }`}
            >
              Menu
            </span>
          </button>
        </div>
      </nav>

      {/* Global Public Booking Site Modal (Luvea Studio — 01-1-get-started.png) */}
      {bookingSiteOpen && (
        <PublicBookingSiteModal
          state={state}
          setState={handleUpdateStudioState}
          onClose={() => setBookingSiteOpen(false)}
        />
      )}

      {/* Website & Booking Setup Wizard (3 Phases) */}
      {websiteWizardOpen && (
        <WebsiteSetupWizard
          state={state}
          setState={handleUpdateStudioState}
          initialStep={websiteWizardInitialStep}
          onClose={() => setWebsiteWizardOpen(false)}
          onOpenPublicSite={(slug) => {
            setWebsiteWizardOpen(false);
            const targetUrl = getBookingSiteUrl(slug);
            window.open(targetUrl, "_blank", "noopener,noreferrer");
          }}
          onNavigateToCatalog={() => {
            setWebsiteWizardOpen(false);
            setActiveSection("catalog_services");
          }}
        />
      )}

      {/* Global Quick Sale POS Drawer */}
      <QuickSaleDrawer
        open={quickSaleOpen}
        onClose={() => setQuickSaleOpen(false)}
        state={state}
        prefillAppointment={quickSalePrefill}
        onUpdateState={handleUpdateStudioState}
      />

      {/* Floating Bottom-Center Dark Toast Notification matching 05-3-clients-added.png & DESIGN.md §4.4 */}
      {state.lastToastMessage && (
        <div className="fixed bottom-[calc(4.8rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-[#1C1C1E] text-white shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-3 max-w-[92vw]">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span className="text-[13px] font-semibold truncate">
            {state.lastToastMessage}
          </span>
          <button
            onClick={() =>
              setState((prev) => ({ ...prev, lastToastMessage: null }))
            }
            className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export const AgendaSteApp = LuveaApp;
