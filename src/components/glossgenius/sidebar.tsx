"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import type { NavigationSectionId } from "@/lib/glossgenius-store";

interface SidebarProps {
  activeSection: NavigationSectionId;
  onSelectSection: (section: NavigationSectionId) => void;
  completedOnboardingCount: number;
  totalOnboardingCount: number;
  providerFullName: string;
  providerShortName: string;
}

export function GlossGeniusSidebar({
  activeSection,
  onSelectSection,
  completedOnboardingCount,
  totalOnboardingCount,
  providerFullName,
  providerShortName,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(
    activeSection.startsWith("payments_")
  );
  const [catalogOpen, setCatalogOpen] = useState(
    activeSection.startsWith("catalog_")
  );
  const [teamOpen, setTeamOpen] = useState(activeSection.startsWith("team_"));

  const isPaymentsGroup = activeSection.startsWith("payments_");
  const isCatalogGroup = activeSection.startsWith("catalog_");
  const isTeamGroup = activeSection.startsWith("team_");

  if (collapsed) {
    return (
      <aside className="hidden md:flex flex-col items-center w-16 shrink-0 border-r border-[#E5E7EB] bg-white py-3 select-none">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Expandir menu lateral"
          className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 mb-4"
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
                ? "bg-[#ECE9FE] text-[#18181B]"
                : "text-zinc-600 hover:bg-zinc-100"
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
                ? "bg-[#ECE9FE] text-[#18181B]"
                : "text-zinc-600 hover:bg-zinc-100"
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
                ? "bg-[#ECE9FE] text-[#18181B]"
                : "text-zinc-600 hover:bg-zinc-100"
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
                ? "bg-[#ECE9FE] text-[#18181B]"
                : "text-zinc-600 hover:bg-zinc-100"
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
                ? "bg-[#ECE9FE] text-[#18181B]"
                : "text-zinc-600 hover:bg-zinc-100"
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
                ? "bg-[#ECE9FE] text-[#18181B]"
                : "text-zinc-600 hover:bg-zinc-100"
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
                ? "bg-[#ECE9FE] text-[#18181B]"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectSection("marketing")}
            title="Marketing"
            className={`p-2.5 rounded-xl ${
              activeSection === "marketing"
                ? "bg-[#ECE9FE] text-[#18181B]"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectSection("settings")}
            title="Configurações"
            className={`p-2.5 rounded-xl mt-auto ${
              activeSection === "settings"
                ? "bg-[#ECE9FE] text-[#18181B]"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-[232px] shrink-0 border-r border-[#E5E7EB] bg-white h-screen sticky top-0 select-none">
      {/* Top Profile Header identical to 01-get-started.png */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#F1F1F4]">
        <button
          type="button"
          onClick={() => onSelectSection("settings")}
          className="flex items-center gap-2.5 min-w-0 text-left group"
        >
          <div className="w-7 h-7 rounded-full bg-[#FBCFE8] text-[#831843] flex items-center justify-center shrink-0">
            <span className="text-xs font-bold">
              {providerShortName.slice(0, 1).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-semibold text-[#18181B] truncate max-w-[112px]">
                {providerFullName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            </div>
            <p className="text-[11px] text-zinc-500 leading-tight truncate">
              {providerShortName}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="Recolher barra lateral"
          className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
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
                ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                : "text-[#27272A] hover:bg-zinc-100"
            }`}
          >
            <ShieldCheck
              className={`w-4 h-4 ${
                activeSection === "get_started"
                  ? "text-[#5B43D6]"
                  : "text-zinc-700"
              }`}
            />
            <span>
              {completedOnboardingCount}/{totalOnboardingCount} Primeiros Passos
            </span>
          </button>
        </div>

        {/* AI Teammates section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-medium text-zinc-500">
            Colegas de IA
          </p>
          <button
            type="button"
            onClick={() => onSelectSection("reception")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              activeSection === "reception"
                ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                : "text-[#27272A] hover:bg-zinc-100"
            }`}
          >
            <AudioLines
              className={`w-4 h-4 ${
                activeSection === "reception"
                  ? "text-[#5B43D6]"
                  : "text-zinc-700"
              }`}
            />
            <span>Recepção</span>
          </button>
        </div>

        {/* Business section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-medium text-zinc-500">Negócio</p>

          {/* Calendar */}
          <button
            type="button"
            onClick={() => onSelectSection("calendar")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              activeSection === "calendar"
                ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                : "text-[#27272A] hover:bg-zinc-100"
            }`}
          >
            <Calendar
              className={`w-4 h-4 ${
                activeSection === "calendar"
                  ? "text-[#5B43D6]"
                  : "text-zinc-700"
              }`}
            />
            <span>Agenda</span>
          </button>

          {/* Payments expandable group (matches 04-1 purple frame when open/active) */}
          <div
            className={`rounded-xl transition-all ${
              paymentsOpen || isPaymentsGroup
                ? "border border-[#7C66DC] p-1 bg-white"
                : ""
            }`}
          >
            <button
              type="button"
              onClick={() => {
                const next = !paymentsOpen;
                setPaymentsOpen(next);
                if (next && !isPaymentsGroup) {
                  onSelectSection("payments_sales_history");
                }
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium text-[#27272A] hover:bg-zinc-100"
            >
              <span className="flex items-center gap-2.5">
                <CreditCard
                  className={`w-4 h-4 ${
                    isPaymentsGroup ? "text-[#5B43D6]" : "text-zinc-700"
                  }`}
                />
                <span className={isPaymentsGroup ? "font-semibold" : ""}>
                  Pagamentos
                </span>
              </span>
              {paymentsOpen || isPaymentsGroup ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>

            {(paymentsOpen || isPaymentsGroup) && (
              <div className="mt-1 space-y-0.5 pl-2">
                <button
                  type="button"
                  onClick={() => onSelectSection("payments_gift_cards")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "payments_gift_cards"
                      ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Vale-presentes
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("payments_invoices")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "payments_invoices"
                      ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Faturas
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("payments_sales_history")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "payments_sales_history"
                      ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                      : "text-zinc-700 hover:bg-zinc-100"
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
                ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                : "text-[#27272A] hover:bg-zinc-100"
            }`}
          >
            <Contact
              className={`w-4 h-4 ${
                activeSection === "clients"
                  ? "text-[#5B43D6]"
                  : "text-zinc-700"
              }`}
            />
            <span>Clientes</span>
          </button>

          {/* Catalog expandable group (matches 06-1 purple frame when open/active) */}
          <div
            className={`rounded-xl transition-all ${
              catalogOpen || isCatalogGroup
                ? "border border-[#7C66DC] p-1 bg-white"
                : ""
            }`}
          >
            <button
              type="button"
              onClick={() => {
                const next = !catalogOpen;
                setCatalogOpen(next);
                if (next && !isCatalogGroup) {
                  onSelectSection("catalog_services");
                }
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium text-[#27272A] hover:bg-zinc-100"
            >
              <span className="flex items-center gap-2.5">
                <BookOpen
                  className={`w-4 h-4 ${
                    isCatalogGroup ? "text-[#5B43D6]" : "text-zinc-700"
                  }`}
                />
                <span className={isCatalogGroup ? "font-semibold" : ""}>
                  Catálogo
                </span>
              </span>
              {catalogOpen || isCatalogGroup ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>

            {(catalogOpen || isCatalogGroup) && (
              <div className="mt-1 space-y-0.5 pl-2">
                <button
                  type="button"
                  onClick={() => onSelectSection("catalog_services")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "catalog_services"
                      ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Serviços
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("catalog_packages")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "catalog_packages"
                      ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Pacotes
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("catalog_memberships")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "catalog_memberships"
                      ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Assinaturas
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("catalog_resources")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "catalog_resources"
                      ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                      : "text-zinc-700 hover:bg-zinc-100"
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
              teamOpen || isTeamGroup
                ? "border border-[#7C66DC] p-1 bg-white"
                : ""
            }`}
          >
            <button
              type="button"
              onClick={() => {
                const next = !teamOpen;
                setTeamOpen(next);
                if (next && !isTeamGroup) {
                  onSelectSection("team_staff");
                }
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium text-[#27272A] hover:bg-zinc-100"
            >
              <span className="flex items-center gap-2.5">
                <Users
                  className={`w-4 h-4 ${
                    isTeamGroup ? "text-[#5B43D6]" : "text-zinc-700"
                  }`}
                />
                <span className={isTeamGroup ? "font-semibold" : ""}>
                  Equipe
                </span>
              </span>
              {teamOpen || isTeamGroup ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>

            {(teamOpen || isTeamGroup) && (
              <div className="mt-1 space-y-0.5 pl-2">
                <button
                  type="button"
                  onClick={() => onSelectSection("team_staff")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "team_staff"
                      ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Profissionais
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("team_payroll")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "team_payroll"
                      ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Folha de pagamento
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("team_commissions")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "team_commissions"
                      ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Comissões
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSection("team_time_tracking")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    activeSection === "team_time_tracking"
                      ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Controle de ponto
                </button>
              </div>
            )}
          </div>

          {/* Marketing */}
          <button
            type="button"
            onClick={() => onSelectSection("marketing")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              activeSection === "marketing"
                ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                : "text-[#27272A] hover:bg-zinc-100"
            }`}
          >
            <Send
              className={`w-4 h-4 ${
                activeSection === "marketing"
                  ? "text-[#5B43D6]"
                  : "text-zinc-700"
              }`}
            />
            <span>Marketing</span>
          </button>

          {/* Insights */}
          <button
            type="button"
            onClick={() => onSelectSection("insights")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              activeSection === "insights"
                ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                : "text-[#27272A] hover:bg-zinc-100"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <TrendingUp
                className={`w-4 h-4 ${
                  activeSection === "insights"
                    ? "text-[#5B43D6]"
                    : "text-zinc-700"
                }`}
              />
              <span>Relatórios</span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {/* Inventory */}
          <button
            type="button"
            onClick={() => onSelectSection("inventory")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              activeSection === "inventory"
                ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                : "text-[#27272A] hover:bg-zinc-100"
            }`}
          >
            <Package
              className={`w-4 h-4 ${
                activeSection === "inventory"
                  ? "text-[#5B43D6]"
                  : "text-zinc-700"
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
                ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
                : "text-[#27272A] hover:bg-zinc-100"
            }`}
          >
            <ClipboardList
              className={`w-4 h-4 ${
                activeSection === "charts"
                  ? "text-[#5B43D6]"
                  : "text-zinc-700"
              }`}
            />
            <span>Prontuários</span>
          </button>
        </div>
      </div>

      {/* Footer items identical to GlossGenius */}
      <div className="border-t border-[#E5E7EB] px-2.5 py-2.5 space-y-0.5 bg-white">
        <button
          type="button"
          onClick={() => onSelectSection("refer")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
            activeSection === "refer"
              ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
              : "text-[#27272A] hover:bg-zinc-100"
          }`}
        >
          <Gift className="w-4 h-4 text-zinc-700" />
          <span>Indique e ganhe R$ 150</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectSection("settings")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
            activeSection === "settings"
              ? "bg-[#ECE9FE] text-[#18181B] font-semibold"
              : "text-[#27272A] hover:bg-zinc-100"
          }`}
        >
          <Settings
            className={`w-4 h-4 ${
              activeSection === "settings"
                ? "text-[#5B43D6]"
                : "text-zinc-700"
            }`}
          />
          <span>Configurações</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectSection("reception")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#27272A] hover:bg-zinc-100"
        >
          <HelpCircle className="w-4 h-4 text-zinc-700" />
          <span>Ajuda</span>
        </button>
      </div>
    </aside>
  );
}
