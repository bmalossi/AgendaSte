"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  AudioLines,
  Calendar,
  CreditCard,
  Contact,
  BookOpen,
  Users,
  Send,
  TrendingUp,
  Package,
  ClipboardList,
  Gift,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Sun,
  Moon,
  AlertCircle,
} from "lucide-react";
import type { NavigationSectionId } from "@/lib/agendaste-store";
import { LuveaIcon } from "@/components/luvea-logo";
import { useAppTheme } from "@/lib/theme";

interface SidebarProps {
  activeSection: NavigationSectionId;
  onSelectSection: (section: NavigationSectionId) => void;
  completedOnboardingCount: number;
  totalOnboardingCount: number;
  providerFullName: string;
  providerShortName: string;
  onSignOut?: () => void;
}

export function LuveaSidebar({
  activeSection,
  onSelectSection,
  completedOnboardingCount,
  totalOnboardingCount,
  providerFullName,
  providerShortName,
  onSignOut,
}: SidebarProps) {
  const { isDark, toggleTheme } = useAppTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);
  type MenuDropdownId = "payments" | "catalog" | "team" | "insights" | null;

  const getInitialOpenMenu = (): MenuDropdownId => {
    if (activeSection.startsWith("payments_")) return "payments";
    if (activeSection.startsWith("catalog_")) return "catalog";
    if (activeSection.startsWith("team_")) return "team";
    if (activeSection.startsWith("insights")) return "insights";
    return null;
  };

  const [openDropdown, setOpenDropdown] = useState<MenuDropdownId>(getInitialOpenMenu);

  const paymentsOpen = openDropdown === "payments";
  const catalogOpen = openDropdown === "catalog";
  const teamOpen = openDropdown === "team";
  const insightsOpen = openDropdown === "insights";

  const isPaymentsGroup = activeSection.startsWith("payments_");
  const isCatalogGroup = activeSection.startsWith("catalog_");
  const isTeamGroup = activeSection.startsWith("team_");
  const isInsightsGroup = activeSection.startsWith("insights");

  useEffect(() => {
    if (activeSection.startsWith("payments_")) setOpenDropdown("payments");
    else if (activeSection.startsWith("catalog_")) setOpenDropdown("catalog");
    else if (activeSection.startsWith("team_")) setOpenDropdown("team");
    else if (activeSection.startsWith("insights")) setOpenDropdown("insights");
  }, [activeSection]);

  if (collapsed) {
    return (
      <aside className="hidden md:flex flex-col items-center w-16 shrink-0 border-r border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#18181b] py-3 select-none">
        <div className="mb-3">
          <LuveaIcon size={26} />
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Expandir menu lateral"
          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#27272a] mb-4"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <div className="flex flex-col gap-2 items-center w-full px-2">
          <button
            type="button"
            onClick={() => onSelectSection("get_started")}
            title="Primeiros Passos"
            className={`p-2.5 rounded-xl ${
              activeSection === "get_started"
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#27272a]"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectSection("reception")}
            title="Recepção IA"
            className={`p-2.5 rounded-xl ${
              activeSection === "reception"
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#27272a]"
            }`}
          >
            <AudioLines className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectSection("calendar")}
            title="Agenda"
            className={`p-2.5 rounded-xl ${
              activeSection === "calendar"
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#27272a]"
            }`}
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectSection("payments_sales_history")}
            title="Pagamentos"
            className={`p-2.5 rounded-xl ${
              isPaymentsGroup
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#27272a]"
            }`}
          >
            <CreditCard className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectSection("clients")}
            title="Clientes"
            className={`p-2.5 rounded-xl ${
              activeSection === "clients"
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#27272a]"
            }`}
          >
            <Contact className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectSection("catalog_services")}
            title="Catálogo"
            className={`p-2.5 rounded-xl ${
              isCatalogGroup
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#27272a]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectSection("team_staff")}
            title="Equipe"
            className={`p-2.5 rounded-xl ${
              isTeamGroup
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#27272a]"
            }`}
          >
            <Users className="w-4 h-4" />
          </button>
          <div className="relative group flex items-center justify-center">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="p-2.5 rounded-xl text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-75 relative"
            >
              <Send className="w-4 h-4" />
              <AlertCircle className="w-2.5 h-2.5 text-amber-500 absolute top-1.5 right-1.5" />
            </button>
            <div className="pointer-events-none absolute left-full ml-2 px-2.5 py-1 rounded-[8px] bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-[11px] font-medium shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Em breve</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectSection("settings")}
            title="Configurações"
            className={`p-2.5 rounded-xl mt-auto ${
              activeSection === "settings"
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#27272a]"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            className="p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#27272a] transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onSignOut?.()}
            title="Sair da conta"
            className="p-2.5 rounded-xl text-zinc-500 hover:text-[#1C1C1E] dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#27272a] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-[232px] shrink-0 border-r border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#18181b] h-screen sticky top-0 select-none">
      {/* Top Profile Header with luxury popup menu */}
      <div ref={profileMenuRef} className="relative px-3.5 py-3 border-b border-[#F1F1F4] dark:border-[#27272a]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            aria-expanded={profileMenuOpen}
            aria-label="Menu da conta e perfil"
            className="flex items-center gap-2.5 min-w-0 text-left group"
          >
            <div className="w-7 h-7 rounded-full bg-[#FBCFE8] text-[#831843] flex items-center justify-center shrink-0">
              <span className="text-xs font-bold">
                {providerShortName.slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-semibold text-[#18181B] dark:text-white truncate max-w-[112px]">
                  {providerFullName}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0 transition-transform ${
                    profileMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-[#a1a1aa] leading-tight truncate">
                {providerShortName}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCollapsed(true)}
            title="Recolher barra lateral"
            className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#27272a] transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Dropdown Popover */}
        {profileMenuOpen && (
          <div className="absolute top-[calc(100%+6px)] left-2 right-2 z-50 bg-white dark:bg-[#18181b] rounded-2xl border border-[#E5E5EA] dark:border-[#27272a] p-1.5 shadow-lg space-y-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-[#F5F5F7] dark:border-[#27272a]">
              <p className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white truncate">
                {providerFullName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                <span className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">Assinatura Ativa</span>
              </div>
            </div>

            {/* Alternador de Tema no Popover */}
            <button
              type="button"
              onClick={() => {
                toggleTheme();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition-colors text-left"
            >
              <span className="flex items-center gap-2.5">
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-zinc-500" />
                )}
                <span>{isDark ? "Modo Claro" : "Modo Escuro"}</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-[#27272a] text-zinc-600 dark:text-[#a1a1aa] border border-zinc-200 dark:border-[#3f3f46]">
                {isDark ? "Escuro" : "Claro"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                onSelectSection("settings");
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition-colors text-left"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Configurações</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                onSignOut?.();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Sair da conta</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-4">
        {/* 0/3 Get Started */}
        <div>
          <button
            type="button"
            onClick={() => onSelectSection("get_started")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              activeSection === "get_started"
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                : "text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
            }`}
          >
            <ShieldCheck
              className={`w-4 h-4 ${
                activeSection === "get_started"
                  ? "text-[#5B43D6] dark:text-[#A494F7]"
                  : "text-zinc-700 dark:text-zinc-400"
              }`}
            />
            <span>
              {completedOnboardingCount}/{totalOnboardingCount} Primeiros Passos
            </span>
          </button>
        </div>

        {/* AI Teammates section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-medium text-zinc-500 dark:text-[#71717a]">
            Colegas de IA
          </p>
          <button
            type="button"
            onClick={() => onSelectSection("reception")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              activeSection === "reception"
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                : "text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
            }`}
          >
            <AudioLines
              className={`w-4 h-4 ${
                activeSection === "reception"
                  ? "text-[#5B43D6] dark:text-[#A494F7]"
                  : "text-zinc-700 dark:text-zinc-400"
              }`}
            />
            <span>Recepção</span>
          </button>
        </div>

        {/* Business section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-medium text-zinc-500 dark:text-[#71717a]">Negócio</p>

          {/* Calendar */}
          <button
            type="button"
            onClick={() => onSelectSection("calendar")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              activeSection === "calendar"
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                : "text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
            }`}
          >
            <Calendar
              className={`w-4 h-4 ${
                activeSection === "calendar"
                  ? "text-[#5B43D6] dark:text-[#A494F7]"
                  : "text-zinc-700 dark:text-zinc-400"
              }`}
            />
            <span>Agenda</span>
          </button>

          {/* Payments expandable group (matches 04-1 purple frame when open/active) */}
          <div
            className={`rounded-xl transition-all ${
              paymentsOpen
                ? "border border-[#7C66DC] p-1 bg-white dark:bg-[#18181b]"
                : ""
            }`}
          >
            <button
              type="button"
              onClick={() => {
                const next = openDropdown === "payments" ? null : "payments";
                setOpenDropdown(next);
                if (next && !isPaymentsGroup) {
                  onSelectSection("payments_sales_history");
                }
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] hover:text-[#18181B] dark:hover:text-white"
            >
              <span className="flex items-center gap-2.5">
                <CreditCard
                  className={`w-4 h-4 ${
                    isPaymentsGroup ? "text-[#5B43D6] dark:text-[#A494F7]" : "text-zinc-700 dark:text-zinc-400"
                  }`}
                />
                <span className={isPaymentsGroup ? "font-semibold" : ""}>
                  Pagamentos
                </span>
              </span>
              {paymentsOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              )}
            </button>

            {paymentsOpen && (
              <div className="mt-1 space-y-0.5 pl-2">
                <button
                  type="button"
                  onClick={() => onSelectSection("payments_gift_cards")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "payments_gift_cards"
                      ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                      : "text-zinc-700 dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
                  }`}
                >
                  Vale-presentes
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("payments_invoices")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "payments_invoices"
                      ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                      : "text-zinc-700 dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
                  }`}
                >
                  Faturas
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("payments_sales_history")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "payments_sales_history"
                      ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                      : "text-zinc-700 dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
                  }`}
                >
                  Histórico de vendas
                </button>
              </div>
            )}
          </div>

          {/* Clients */}
          <button
            type="button"
            onClick={() => onSelectSection("clients")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              activeSection === "clients"
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                : "text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
            }`}
          >
            <Contact
              className={`w-4 h-4 ${
                activeSection === "clients"
                  ? "text-[#5B43D6] dark:text-[#A494F7]"
                  : "text-zinc-700 dark:text-zinc-400"
              }`}
            />
            <span>Clientes</span>
          </button>

          {/* Catalog expandable group (matches 06-1 purple frame when open/active) */}
          <div
            className={`rounded-xl transition-all ${
              catalogOpen
                ? "border border-[#7C66DC] p-1 bg-white dark:bg-[#18181b]"
                : ""
            }`}
          >
            <button
              type="button"
              onClick={() => {
                const next = openDropdown === "catalog" ? null : "catalog";
                setOpenDropdown(next);
                if (next && !isCatalogGroup) {
                  onSelectSection("catalog_services");
                }
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] hover:text-[#18181B] dark:hover:text-white"
            >
              <span className="flex items-center gap-2.5">
                <BookOpen
                  className={`w-4 h-4 ${
                    isCatalogGroup ? "text-[#5B43D6] dark:text-[#A494F7]" : "text-zinc-700 dark:text-zinc-400"
                  }`}
                />
                <span className={isCatalogGroup ? "font-semibold" : ""}>
                  Catálogo
                </span>
              </span>
              {catalogOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              )}
            </button>

            {catalogOpen && (
              <div className="mt-1 space-y-0.5 pl-2">
                <button
                  type="button"
                  onClick={() => onSelectSection("catalog_services")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "catalog_services"
                      ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                      : "text-zinc-700 dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
                  }`}
                >
                  Serviços
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("catalog_packages")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "catalog_packages"
                      ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                      : "text-zinc-700 dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
                  }`}
                >
                  Pacotes
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("catalog_memberships")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "catalog_memberships"
                      ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                      : "text-zinc-700 dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
                  }`}
                >
                  Assinaturas
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("catalog_resources")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "catalog_resources"
                      ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                      : "text-zinc-700 dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
                  }`}
                >
                  <span>Recursos</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#6E56CF] text-white">
                    Beta
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Team expandable group (matches 06-5 purple frame when open/active) */}
          <div
            className={`rounded-xl transition-all ${
              teamOpen
                ? "border border-[#7C66DC] p-1 bg-white dark:bg-[#18181b]"
                : ""
            }`}
          >
            <button
              type="button"
              onClick={() => {
                const next = openDropdown === "team" ? null : "team";
                setOpenDropdown(next);
                if (next && !isTeamGroup) {
                  onSelectSection("team_staff");
                }
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] hover:text-[#18181B] dark:hover:text-white"
            >
              <span className="flex items-center gap-2.5">
                <Users
                  className={`w-4 h-4 ${
                    isTeamGroup ? "text-[#5B43D6] dark:text-[#A494F7]" : "text-zinc-700 dark:text-zinc-400"
                  }`}
                />
                <span className={isTeamGroup ? "font-semibold" : ""}>
                  Equipe
                </span>
              </span>
              {teamOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              )}
            </button>

            {teamOpen && (
              <div className="mt-1 space-y-0.5 pl-2">
                <button
                  type="button"
                  onClick={() => onSelectSection("team_staff")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "team_staff"
                      ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                      : "text-zinc-700 dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
                  }`}
                >
                  Profissionais
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("team_payroll")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "team_payroll"
                      ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                      : "text-zinc-700 dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
                  }`}
                >
                  Folha de pagamento
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("team_commissions")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "team_commissions"
                      ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                      : "text-zinc-700 dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
                  }`}
                >
                  Comissões
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("team_time_tracking")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "team_time_tracking"
                      ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                      : "text-zinc-700 dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
                  }`}
                >
                  Controle de ponto
                </button>
              </div>
            )}
          </div>

          {/* Insights / Relatórios expandable group (matches Analytics & Reports screenshots) */}
          <div
            className={`rounded-xl transition-all ${
              insightsOpen ? "border border-[#7C66DC] p-1 bg-white dark:bg-[#18181b]" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => {
                const next = openDropdown === "insights" ? null : "insights";
                setOpenDropdown(next);
                if (next && !isInsightsGroup) {
                  onSelectSection("insights_analytics");
                }
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] hover:text-[#18181B] dark:hover:text-white"
            >
              <span className="flex items-center gap-2.5">
                <TrendingUp
                  className={`w-4 h-4 ${
                    isInsightsGroup ? "text-[#5B43D6] dark:text-[#A494F7]" : "text-zinc-700 dark:text-zinc-400"
                  }`}
                />
                <span className={isInsightsGroup ? "font-semibold" : ""}>
                  Relatórios
                </span>
              </span>
              {insightsOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              )}
            </button>

            {insightsOpen && (
              <div className="mt-1 space-y-0.5 pl-2">
                <button
                  type="button"
                  onClick={() => onSelectSection("insights_analytics")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "insights_analytics" ||
                    activeSection === "insights"
                      ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                      : "text-zinc-700 dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
                  }`}
                >
                  Análises
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("insights_reports")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "insights_reports"
                      ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                      : "text-zinc-700 dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
                  }`}
                >
                  Relatórios
                </button>
              </div>
            )}
          </div>

          {/* Inventory */}
          <button
            type="button"
            onClick={() => onSelectSection("inventory")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              activeSection === "inventory"
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                : "text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
            }`}
          >
            <Package
              className={`w-4 h-4 ${
                activeSection === "inventory"
                  ? "text-[#5B43D6] dark:text-[#A494F7]"
                  : "text-zinc-700 dark:text-zinc-400"
              }`}
            />
            <span>Estoque</span>
          </button>

          {/* Charts (Prontuários) */}
          <button
            type="button"
            onClick={() => onSelectSection("charts")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              activeSection === "charts"
                ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
                : "text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
            }`}
          >
            <ClipboardList
              className={`w-4 h-4 ${
                activeSection === "charts"
                  ? "text-[#5B43D6] dark:text-[#A494F7]"
                  : "text-zinc-700 dark:text-zinc-400"
              }`}
            />
            <span>Prontuários</span>
          </button>

          {/* Marketing (Trancado / Em breve) */}
          <div className="relative group">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium text-zinc-400 dark:text-zinc-500 cursor-not-allowed select-none opacity-80 hover:bg-zinc-50 dark:hover:bg-[#1f1f23] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <span>Marketing</span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Em breve</span>
              </span>
            </button>
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-8 px-2.5 py-1 rounded-[8px] bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-[11px] font-medium shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Em breve</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer items */}
      <div className="border-t border-[#E5E7EB] dark:border-[#27272a] px-2.5 py-2.5 space-y-0.5 bg-white dark:bg-[#18181b]">
        <button
          type="button"
          onClick={() => onSelectSection("refer")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
            activeSection === "refer"
              ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
              : "text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
          }`}
        >
          <Gift className="w-4 h-4 text-zinc-700 dark:text-zinc-400" />
          <span>Indique e ganhe R$ 150</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectSection("settings")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
            activeSection === "settings"
              ? "bg-[#ECE9FE] text-[#18181B] dark:bg-[#27272a] dark:text-white font-semibold"
              : "text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
          }`}
        >
          <Settings
            className={`w-4 h-4 ${
              activeSection === "settings"
                ? "text-[#5B43D6] dark:text-[#A494F7]"
                : "text-zinc-700 dark:text-zinc-400"
            }`}
          />
          <span>Configurações</span>
        </button>

        {/* Alternador de Tema no rodapé */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] hover:text-[#18181B] dark:hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2.5">
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700 dark:text-zinc-400" />
            )}
            <span>{isDark ? "Modo Claro" : "Modo Escuro"}</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-[#27272a] text-zinc-600 dark:text-[#a1a1aa] border border-zinc-200 dark:border-[#3f3f46]">
            {isDark ? "Dark" : "Light"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection("reception")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#27272A] dark:text-[#a1a1aa] hover:bg-zinc-100 dark:hover:bg-[#27272a] dark:hover:text-white"
        >
          <HelpCircle className="w-4 h-4 text-zinc-700 dark:text-zinc-400" />
          <span>Ajuda</span>
        </button>
        <button
          type="button"
          onClick={() => onSignOut?.()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#6E6E73] dark:text-[#71717a] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#27272a] transition-colors"
        >
          <LogOut className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}

export const AgendaSteSidebar = LuveaSidebar;
