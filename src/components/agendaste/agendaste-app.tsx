"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
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
  Sun,
  Moon,
  Smartphone,
} from "lucide-react";
import { useAppTheme } from "@/lib/theme";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { PWAInstallModal } from "@/components/agendaste/pwa-install-modal";
import {
  StudioState,
  NavigationSectionId,
  CalendarEventItem,
  createInitialStudioState,
  createEmptyTenantStudioState,
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
  syncDeleteAppointmentFromSupabase,
  syncNewClientToSupabase,
  syncClientUpdateToSupabase,
  syncNewStaffToSupabase,
  getCurrentTenantContext,
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
  const { theme, toggleTheme, isDark } = useAppTheme();
  const pwa = usePWAInstall();
  const [state, setState] = useState<StudioState>(() =>
    createInitialStudioState()
  );
  const [activeSection, setActiveSection] =
    useState<NavigationSectionId>(initialSection);
  const [settingsTab, setSettingsTab] = useState<string | undefined>(initialTab);
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);
  const [bookingSiteOpen, setBookingSiteOpen] = useState(false);
  const [websiteWizardOpen, setWebsiteWizardOpen] = useState(initialWizard);
  const [websiteWizardInitialStep, setWebsiteWizardInitialStep] =
    useState(initialStep || 1);
  const [quickSaleOpen, setQuickSaleOpen] = useState(false);
  const [quickSalePrefill, setQuickSalePrefill] =
    useState<CalendarEventItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tenantOrgId, setTenantOrgId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloqueia scroll do body e adiciona handler do Escape quando o menu mobile estiver aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleNavigate = (section: NavigationSectionId, tab?: string) => {
    setActiveSection(section);
    if (tab) {
      setSettingsTab(tab);
    }
  };

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
      const tabParam = params.get("tab");
      if (tabParam) {
        setSettingsTab(tabParam);
      }
      const wiz = params.get("wizard");
      if (wiz === "true" || wiz === "1") {
        setWebsiteWizardOpen(true);
        const st = parseInt(params.get("step") || "1", 10);
        if (!isNaN(st)) setWebsiteWizardInitialStep(st);
      }
    }
  }, []);

  // Manipulador universal de estado com persistência dupla isolada por Tenant (localStorage + Supabase)
  const handleUpdateStudioState = (
    updater: StudioState | ((prev: StudioState) => StudioState)
  ) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;

      // 1. Persistência Instantânea Local isolada por usuário/tenant
      try {
        const cacheKey = currentUser?.id
          ? `luvea_studio_state_v1_${currentUser.id}`
          : "luvea_studio_state_dev_offline";
        localStorage.setItem(cacheKey, JSON.stringify(next));
        localStorage.setItem(
          "luvea_tv_events_override_v1",
          JSON.stringify(next.calendarEvents)
        );
        if (typeof BroadcastChannel !== "undefined") {
          const bc = new BroadcastChannel("luvea_tv_sync");
          bc.postMessage({ type: "CALENDAR_EVENTS_UPDATED" });
          bc.close();
        }
      } catch (err) {
        console.warn("Erro ao salvar no localStorage:", err);
      }

      // 2. Persistência na Nuvem (Supabase) restrita ao tenant do usuário
      if (isSupabaseConfigured() && tenantOrgId) {
        (async () => {
          try {
            // Sincroniza novos membros da equipe (staff) no Supabase
            const prevStaffIds = new Set(prev.staff.map((s) => s.id));
            const newStaffList = next.staff.filter((s) => !prevStaffIds.has(s.id));
            for (const staffMember of newStaffList) {
              await syncNewStaffToSupabase(staffMember, tenantOrgId);
            }

            // Sincroniza novos clientes PRIMEIRO para garantir chave estrangeira e evitar duplicidade
            const prevClientIds = new Set(prev.clients.map((c) => c.id));
            const newClients = next.clients.filter((c) => !prevClientIds.has(c.id));
            for (const cli of newClients) {
              await syncNewClientToSupabase(cli, next.staff[0]?.id, tenantOrgId);
            }

            // Sincroniza atualizações em clientes existentes (fotos auto-organizadas, anamnese, lembretes)
            for (const cli of next.clients) {
              const oldCli = prev.clients.find((c) => c.id === cli.id);
              if (
                oldCli &&
                (oldCli.autoSortedPhotos !== cli.autoSortedPhotos ||
                  oldCli.notesAndForms !== cli.notesAndForms ||
                  oldCli.sendAutomaticReminders !== cli.sendAutomaticReminders)
              ) {
                await syncClientUpdateToSupabase(cli, tenantOrgId);
              }
            }

            // Sincroniza agendamentos recém-criados com o ID do profissional REAL (evt.providerId)
            const prevIds = new Set(prev.calendarEvents.map((e) => e.id));
            const newEvents = next.calendarEvents.filter((e) => !prevIds.has(e.id));
            for (const evt of newEvents) {
              await syncNewAppointmentToSupabase(evt, evt.providerId, tenantOrgId);
            }

            // Sincroniza agendamentos excluídos no Supabase
            const nextIds = new Set(next.calendarEvents.map((e) => e.id));
            const deletedEvents = prev.calendarEvents.filter((e) => !nextIds.has(e.id));
            for (const evt of deletedEvents) {
              await syncDeleteAppointmentFromSupabase(evt.id, tenantOrgId);
            }

            // Detecta agendamentos com status, profissional, data ou horário alterado
            for (const evt of next.calendarEvents) {
              const oldEvt = prev.calendarEvents.find((e) => e.id === evt.id);
              if (
                oldEvt &&
                (oldEvt.status !== evt.status ||
                  oldEvt.providerId !== evt.providerId ||
                  oldEvt.dateISO !== evt.dateISO ||
                  oldEvt.startTime !== evt.startTime ||
                  oldEvt.endTime !== evt.endTime ||
                  oldEvt.whatsappClientReply !== evt.whatsappClientReply ||
                  oldEvt.arrivedAtReception !== evt.arrivedAtReception)
              ) {
                await syncAppointmentUpdateToSupabase(evt, tenantOrgId);
              }
            }
          } catch (syncErr) {
            console.error("Erro na sincronização sequencial com Supabase:", syncErr);
          }
        })();

        // Sincroniza dados da organização, estoque e site de agendamento quando alterados
        if (
          next.settings.business.bookingSlug !== prev.settings.business.bookingSlug ||
          next.settings.business.businessName !== prev.settings.business.businessName ||
          next.settings.website?.websitePublished !== prev.settings.website?.websitePublished ||
          next.settings.website?.theme !== prev.settings.website?.theme ||
          next.inventory !== prev.inventory
        ) {
          supabase
            .from("organizations")
            .update({
              name: next.settings.business.businessName,
              slug: next.settings.business.bookingSlug,
              settings: {
                website: next.settings.website,
                websitePublished: next.settings.website?.websitePublished,
                onboardingSteps: next.onboarding.steps,
                inventory: next.inventory,
              },
            })
            .eq("id", tenantOrgId)
            .then(({ error }) => {
              if (error) console.warn("Erro ao sincronizar organização no Supabase:", error);
            });
        }
      }

      return next;
    });
  };

  // Hidratação ao vivo com isolamento estrito por usuário/tenant
  useEffect(() => {
    let activeChannel: any = null;

    async function initUserTenantState() {
      if (isSupabaseConfigured()) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          const user = authData?.user;
          if (user) {
            setCurrentUser(user);
            const userCacheKey = `luvea_studio_state_v1_${user.id}`;
            const cached = localStorage.getItem(userCacheKey);
            let localState = state;

            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                if (parsed && Array.isArray(parsed.calendarEvents)) {
                  if (parsed.calendarView?.selectedDateISO === "2026-10-17") {
                    parsed.calendarView.selectedDateISO = getTodayDateISO();
                  }
                  localState = parsed;
                  setState(parsed);
                }
              } catch (err) {
                console.warn("Erro ao restaurar do localStorage do usuário:", err);
              }
            } else {
              // Inicializa com estado limpo e vazio do próprio usuário (ZERO dados de terceiros)
              const initial = createEmptyTenantStudioState({
                fullName: user.user_metadata?.full_name,
                businessName: user.user_metadata?.business_name,
                subdomain: user.user_metadata?.subdomain,
                email: user.email,
              });
              localState = initial;
              setState(initial);
            }

            // Busca contexto do tenant (organização) do usuário
            const tenantCtx = await getCurrentTenantContext();
            if (tenantCtx?.organizationId) {
              setTenantOrgId(tenantCtx.organizationId);
              const liveState = await loadStudioStateFromSupabase(
                localState,
                tenantCtx.organizationId
              );
              setState(liveState);
              try {
                localStorage.setItem(userCacheKey, JSON.stringify(liveState));
              } catch (e) {
                console.warn("Erro ao salvar cache do usuário:", e);
              }

              // Subscrição Realtime restrita EXCLUSIVAMENTE ao tenant do usuário
              activeChannel = supabase
                .channel(`luvea-realtime-appointments-${tenantCtx.organizationId}`)
                .on(
                  "postgres_changes",
                  {
                    event: "*",
                    schema: "public",
                    table: "appointments",
                    filter: `organization_id=eq.${tenantCtx.organizationId}`,
                  },
                  () => {
                    setState((latest) => {
                      loadStudioStateFromSupabase(latest, tenantCtx.organizationId).then((liveState) => {
                        setState(liveState);
                        try {
                          localStorage.setItem(
                            userCacheKey,
                            JSON.stringify(liveState)
                          );
                        } catch {}
                      });
                      return latest;
                    });
                  }
                )
                .subscribe();
            }
            return;
          }
        } catch (err) {
          console.warn("[Luvea Multi-Tenant] Erro ao sincronizar tenant do usuário:", err);
        }
      }

      // Fallback em ambiente local / dev sem Supabase conectado
      try {
        const cached = localStorage.getItem("luvea_studio_state_dev_offline");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.calendarEvents)) {
            setState(parsed);
          }
        }
      } catch (err) {
        console.warn("Erro ao restaurar cache dev offline:", err);
      }
    }

    initUserTenantState();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
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
    <div className="luvea-dashboard min-h-screen flex flex-col md:flex-row bg-white dark:bg-[#09090b] text-[#1C1C1E] dark:text-[#f4f4f5]">
      {/* Mobile Top Header (<768px): Studio & Section Identity + Quick Access */}
      <header className="md:hidden sticky top-0 inset-x-0 z-30 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md border-b border-[#E5E5EA] dark:border-[#27272a] px-3.5 py-2.5 flex items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#FBCFE8] text-[#831843] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            {providerShortName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-[14px] font-bold text-[#1C1C1E] dark:text-white leading-tight truncate">
              {getSectionTitle(activeSection)}
            </h1>
            <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa] leading-tight truncate">
              {state.settings.business.businessName || "Luvea Studio"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenMyBookingSite}
            title="Abrir site de agendamento online"
            className="h-9 px-3 rounded-full border border-[#D1D1D6] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[12px] font-medium text-[#1C1C1E] dark:text-white flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-[#a1a1aa]" />
            <span className="hidden sm:inline">Site Online</span>
          </button>

          {/* Theme Toggle Mobile */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            aria-label="Alternar tema claro e escuro"
            className="w-9 h-9 rounded-full border border-[#D1D1D6] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white active:scale-90 transition-transform"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#1C1C1E]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu de navegação"
            className="w-9 h-9 rounded-full border border-[#D1D1D6] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white active:scale-90 transition-transform"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Offcanvas Drawer (<768px): Full Studio Navigation (Portal to body at z-[100]) */}
      {mounted &&
        mobileMenuOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
            className="md:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-start animate-in fade-in duration-150"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-[85%] max-w-[320px] bg-white dark:bg-[#18181b] h-full h-[100dvh] shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200 select-none"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-between gap-3 bg-[#FAF9F6] dark:bg-[#18181b]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#FBCFE8] text-[#831843] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {providerShortName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-[#1C1C1E] dark:text-white truncate">
                    {providerFullName}
                  </p>
                  <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa] truncate">
                    {state.settings.personal.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
                className="w-8 h-8 rounded-full border border-[#D1D1D6] dark:border-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white hover:bg-white dark:hover:bg-[#27272a] active:scale-95 transition-transform shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Navigation Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 text-[13.5px] bg-white dark:bg-[#18181b]">
              {/* Grupo 1: Atendimento & Recepção */}
              <div>
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#71717a]">
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
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[#6E56CF] dark:text-[#A494F7]" />
                      <span>Agenda Inteligente</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("clients");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "clients"
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Contact className="w-4 h-4 text-[#6E56CF] dark:text-[#A494F7]" />
                      <span>Clientes &amp; Fichas</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("charts");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "charts"
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <ClipboardList className="w-4 h-4 text-[#6E56CF] dark:text-[#A494F7]" />
                      <span>Prontuários (Anamnese)</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("reception");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "reception"
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-[#6E56CF] dark:text-[#A494F7]" />
                      <span>Recepção IA &amp; WhatsApp</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>
                </div>
              </div>

              {/* Grupo 2: Financeiro */}
              <div>
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#71717a]">
                  Financeiro &amp; PDV
                </p>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleOpenQuickSale();
                    }}
                    className="w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white active:scale-95 transition-transform"
                  >
                    <span className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-[#E11D8F]" />
                      <span>Venda Rápida POS</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[10px] font-bold">
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
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Banknote className="w-4 h-4 text-[#1C1C1E] dark:text-[#a1a1aa]" />
                      <span>Histórico de Vendas</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("payments_invoices");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "payments_invoices"
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-[#1C1C1E] dark:text-[#a1a1aa]" />
                      <span>Faturas &amp; Cobranças</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("insights_analytics");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "insights_analytics" || activeSection === "insights"
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-[#1C1C1E] dark:text-[#a1a1aa]" />
                      <span>Análises &amp; Métricas</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("insights_reports");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "insights_reports"
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-[#1C1C1E] dark:text-[#a1a1aa]" />
                      <span>Relatórios (12 Modelos)</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>
                </div>
              </div>

              {/* Grupo 3: Gestão & Catálogo */}
              <div>
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#71717a]">
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
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-[#1C1C1E] dark:text-[#a1a1aa]" />
                      <span>Catálogo &amp; Serviços</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("team_staff");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection.startsWith("team_")
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-[#1C1C1E] dark:text-[#a1a1aa]" />
                      <span>Equipe &amp; Comissões</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("inventory");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "inventory"
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-[#1C1C1E] dark:text-[#a1a1aa]" />
                      <span>Estoque &amp; Backbar</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("marketing");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "marketing"
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-[#1C1C1E] dark:text-[#a1a1aa]" />
                      <span>Marketing IA</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>
                </div>
              </div>

              {/* Grupo 4: Sistema & Preferências */}
              <div>
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#71717a]">
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
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-[#1C1C1E] dark:text-[#a1a1aa]" />
                      <span>Configurações</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("get_started");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "get_started"
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-[#5B43D6] dark:text-[#A494F7]" />
                      <span>Primeiros Passos ({completedOnboardingCount}/{totalOnboardingCount})</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("refer");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium active:scale-95 transition-transform ${
                      activeSection === "refer"
                        ? "bg-[#ECE9FE] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                        : "text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Gift className="w-4 h-4 text-[#1C1C1E] dark:text-[#a1a1aa]" />
                      <span>Indique e Ganhe R$ 150</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] dark:text-[#71717a]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white active:scale-95 transition-transform"
                  >
                    <span className="flex items-center gap-3">
                      {isDark ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                      )}
                      <span>{isDark ? "Modo Claro" : "Modo Escuro"}</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-[#27272a] text-zinc-600 dark:text-[#a1a1aa] border border-zinc-200 dark:border-[#3f3f46]">
                      {isDark ? "Dark" : "Light"}
                    </span>
                  </button>

                  {!pwa.isInstalled && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        pwa.install();
                      }}
                      className="w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium text-[#1C1C1E] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] dark:hover:text-white active:scale-95 transition-transform"
                    >
                      <span className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-[#1C1C1E] dark:text-white" />
                        <span>{pwa.isIOS ? "Instalar no iPhone" : "Instalar no Celular"}</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b]">
                        App
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOutUser();
                    }}
                    className="w-full h-11 px-3 rounded-[10px] flex items-center justify-between font-medium text-[#6E6E73] dark:text-[#71717a] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] active:scale-95 transition-transform"
                  >
                    <span className="flex items-center gap-3">
                      <LogOut className="w-4 h-4 text-[#8E8E93] dark:text-zinc-500" />
                      <span>Sair da conta</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Bar with safe area padding */}
            <div className="p-3 border-t border-[#E5E5EA] dark:border-[#27272a] bg-[#FAF9F6] dark:bg-[#18181b] text-center pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
              {pwa.isInstalled ? (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                  LUVEA App Instalado · Luvea Studio
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    pwa.install();
                  }}
                  className="text-[11px] font-semibold text-[#8E8E93] dark:text-[#71717a] hover:text-[#1C1C1E] dark:hover:text-white transition"
                >
                  LUVEA PWA · Toque para instalar
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
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
      <main className="flex-1 min-w-0 pb-[calc(5.2rem+env(safe-area-inset-bottom,0px))] md:pb-0 overflow-x-hidden bg-white dark:bg-[#09090b] flex flex-col">
        {/* Top Banner de Avaliação Gratuita (Anti-AI Slop) */}
        {!trialBannerDismissed &&
          state.onboarding.subscriptionStatus !== "active" &&
          state.onboarding.trialDaysLeft <= 3 && (
            <div
              className={`px-4 py-2.5 text-[12.5px] font-medium flex items-center justify-between transition-colors border-b shrink-0 ${
                state.onboarding.trialDaysLeft === 0
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200"
                  : "bg-[#F5F5F7] dark:bg-[#18181b] border-[#E5E5EA] dark:border-[#27272a] text-[#1C1C1E] dark:text-[#f4f4f5]"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    state.onboarding.trialDaysLeft === 0 ? "bg-rose-500" : "bg-amber-500"
                  }`}
                />
                <span className="truncate">
                  {state.onboarding.trialDaysLeft === 0
                    ? "Seu teste gratuito de 14 dias expirou. Escolha um plano para manter sua agenda e automações ativas."
                    : `Restam apenas ${state.onboarding.trialDaysLeft} ${
                        state.onboarding.trialDaysLeft === 1 ? "dia" : "dias"
                      } de teste gratuito no Plano ${state.onboarding.planTier || "Gold"}.`}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <button
                  type="button"
                  onClick={() => handleNavigate("settings", "subscription")}
                  className="underline hover:opacity-80 transition font-semibold text-[12.5px]"
                >
                  {state.onboarding.trialDaysLeft === 0 ? "Escolher plano" : "Salvar cartão"}
                </button>
                <button
                  type="button"
                  onClick={() => setTrialBannerDismissed(true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition"
                  aria-label="Dispensar aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        {activeSection === "get_started" && (
          <GetStartedView
            state={state}
            setState={handleUpdateStudioState}
            onNavigate={handleNavigate}
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
            initialTab={settingsTab || initialTab}
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
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md border-t border-[#E5E5EA] dark:border-[#27272a] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] select-none"
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
                activeSection === "calendar" ? "text-[#6E56CF] dark:text-[#A494F7]" : "text-[#71717A] dark:text-[#a1a1aa]"
              }`}
            />
            <span
              className={`text-[10.5px] font-semibold leading-none ${
                activeSection === "calendar" ? "text-[#6E56CF] dark:text-[#A494F7]" : "text-[#71717A] dark:text-[#a1a1aa]"
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
                activeSection === "clients" ? "text-[#6E56CF] dark:text-[#A494F7]" : "text-[#71717A] dark:text-[#a1a1aa]"
              }`}
            />
            <span
              className={`text-[10.5px] font-semibold leading-none ${
                activeSection === "clients" ? "text-[#6E56CF] dark:text-[#A494F7]" : "text-[#71717A] dark:text-[#a1a1aa]"
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
            <div className="w-11 h-11 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] flex items-center justify-center shadow-md border-2 border-white dark:border-[#18181b]">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-bold text-[#1C1C1E] dark:text-white mt-0.5 leading-none">
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
                activeSection === "charts" ? "text-[#6E56CF] dark:text-[#A494F7]" : "text-[#71717A] dark:text-[#a1a1aa]"
              }`}
            />
            <span
              className={`text-[10.5px] font-semibold leading-none ${
                activeSection === "charts" ? "text-[#6E56CF] dark:text-[#A494F7]" : "text-[#71717A] dark:text-[#a1a1aa]"
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
                mobileMenuOpen ? "text-[#6E56CF] dark:text-[#A494F7]" : "text-[#71717A] dark:text-[#a1a1aa]"
              }`}
            />
            <span
              className={`text-[10.5px] font-semibold leading-none ${
                mobileMenuOpen ? "text-[#6E56CF] dark:text-[#A494F7]" : "text-[#71717A] dark:text-[#a1a1aa]"
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

      {/* Global PWA Install Modal (Accessible from menu or any view) */}
      <PWAInstallModal
        isOpen={pwa.showInstallModal}
        onClose={pwa.closeInstallModal}
        isIOS={pwa.isIOS}
        isAndroid={pwa.isAndroid}
        isDesktop={pwa.isDesktop}
        isChromeIOS={pwa.isChromeIOS}
        isSafari={pwa.isSafari}
        isInAppBrowser={pwa.isInAppBrowser}
        hasNativePrompt={pwa.hasNativePrompt}
        onDirectInstall={pwa.install}
      />
    </div>
  );
}

export const AgendaSteApp = LuveaApp;
