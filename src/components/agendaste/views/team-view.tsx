"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Plus,
  DollarSign,
  TrendingUp,
  Clock,
  Check,
  Play,
  Pause,
  LogOut,
  Sparkles,
  QrCode,
  X,
  Search,
  Pencil,
  MoreHorizontal,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  Briefcase,
  Shield,
  Trash2,
  Crown,
} from "lucide-react";
import {
  StudioState,
  formatBRL,
  calculatePayrollSummary,
  toggleTimeclockAction,
  DayBusinessHours,
  DEFAULT_STAFF_SCHEDULE,
  StaffMember,
  generateUuid,
} from "@/lib/agendaste-store";

interface TeamViewProps {
  section:
    | "team_staff"
    | "team_commissions"
    | "team_payroll"
    | "team_time_tracking";
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
}

function formatSecondsHMS(totalSec: number): string {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;
}

export function TeamView({ section, state, onUpdateState }: TeamViewProps) {
  // Staff Directory & Drawer state
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(
    state.staff[0]?.id ?? null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [drawerTab, setDrawerTab] = useState<"schedule" | "services" | "role">(
    "schedule"
  );
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);

  // Inline day schedule editor state
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editStartTime, setEditStartTime] = useState("08:00");
  const [editEndTime, setEditEndTime] = useState("17:00");

  // Active member helper
  const activeStaffMember = useMemo(() => {
    return (
      state.staff.find((s) => s.id === selectedStaffId) ??
      state.staff[0] ??
      null
    );
  }, [state.staff, selectedStaffId]);

  // Draft form state for the slide-over drawer
  const [draftFullName, setDraftFullName] = useState("");
  const [draftRole, setDraftRole] = useState("Especialista em Beleza");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftServiceCommission, setDraftServiceCommission] = useState(50);
  const [draftProductCommission, setDraftProductCommission] = useState(15);
  const [draftWeeklyGoal, setDraftWeeklyGoal] = useState(5000);
  const [draftAvailableOnline, setDraftAvailableOnline] = useState(true);
  const [draftMatchBusinessHours, setDraftMatchBusinessHours] = useState(true);
  const [draftSchedule, setDraftSchedule] = useState<DayBusinessHours[]>(
    DEFAULT_STAFF_SCHEDULE
  );
  const [draftAssignedServiceIds, setDraftAssignedServiceIds] = useState<
    string[]
  >([]);
  const [draftNotifications, setDraftNotifications] = useState(true);

  // Sync draft form state when selection changes or add mode toggles
  useEffect(() => {
    if (isAddingStaff) {
      setDraftFullName("");
      setDraftRole("Especialista em Beleza");
      setDraftEmail("");
      setDraftPhone("");
      setDraftServiceCommission(50);
      setDraftProductCommission(15);
      setDraftWeeklyGoal(5000);
      setDraftAvailableOnline(true);
      setDraftMatchBusinessHours(true);
      setDraftSchedule(DEFAULT_STAFF_SCHEDULE);
      setDraftAssignedServiceIds(state.services.map((s) => s.id));
      setDraftNotifications(true);
      setEditingDayIndex(null);
    } else if (activeStaffMember) {
      setDraftFullName(activeStaffMember.fullName);
      setDraftRole(activeStaffMember.role);
      setDraftEmail(activeStaffMember.email);
      setDraftPhone(activeStaffMember.phone);
      setDraftServiceCommission(activeStaffMember.serviceCommissionPercent);
      setDraftProductCommission(activeStaffMember.productCommissionPercent);
      setDraftWeeklyGoal(Math.round(activeStaffMember.weeklyGoalCents / 100));
      setDraftAvailableOnline(activeStaffMember.availableOnline ?? true);
      setDraftMatchBusinessHours(
        activeStaffMember.matchBusinessHours ?? true
      );
      setDraftSchedule(
        activeStaffMember.customSchedule &&
          activeStaffMember.customSchedule.length === 7
          ? activeStaffMember.customSchedule
          : DEFAULT_STAFF_SCHEDULE
      );
      setDraftAssignedServiceIds(
        activeStaffMember.assignedServiceIds &&
          activeStaffMember.assignedServiceIds.length > 0
          ? activeStaffMember.assignedServiceIds
          : state.services.map((s) => s.id)
      );
      setDraftNotifications(
        activeStaffMember.clockInNotificationsEnabled ?? true
      );
      setEditingDayIndex(null);
    }
  }, [selectedStaffId, isAddingStaff, activeStaffMember?.id, state.services]);

  // Filtered and sorted staff directory list
  const filteredStaff = useMemo(() => {
    let list = state.staff.filter((m) => {
      if (!staffSearchQuery.trim()) return true;
      const q = staffSearchQuery.toLowerCase();
      return (
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      const cmp = a.fullName.localeCompare(b.fullName);
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return list;
  }, [state.staff, staffSearchQuery, sortOrder]);

  // Handle saving staff drawer changes (Add or Update)
  const handleSaveStaffDrawer = () => {
    if (isSavingStaff) return;

    if (!draftFullName.trim()) {
      onUpdateState((prev) => ({
        ...prev,
        lastToastMessage: "Por favor, informe o nome do profissional.",
      }));
      return;
    }

    // Previne cadastros duplicados acidentais
    if (isAddingStaff) {
      const alreadyExists = state.staff.some(
        (s) => s.fullName.trim().toLowerCase() === draftFullName.trim().toLowerCase()
      );
      if (alreadyExists) {
        onUpdateState((prev) => ({
          ...prev,
          lastToastMessage: `Já existe um profissional cadastrado com o nome "${draftFullName.trim()}".`,
        }));
        return;
      }
    }

    setIsSavingStaff(true);

    const parts = draftFullName.trim().split(" ");
    const initials = (
      (parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")
    ).toUpperCase() || "EP";

    if (isAddingStaff) {
      const newStaffId = generateUuid();
      const newStaff: StaffMember = {
        id: newStaffId,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" "),
        fullName: draftFullName.trim(),
        initials,
        role: draftRole,
        email: draftEmail || `${parts[0].toLowerCase()}@aurastudio.com.br`,
        phone: draftPhone || "(11) 99777-1122",
        avatarColor: "#DDD6FE",
        serviceCommissionPercent: draftServiceCommission,
        productCommissionPercent: draftProductCommission,
        weeklyGoalCents: draftWeeklyGoal * 100,
        bookedThisWeekCents: 0, // Inicia limpo com R$ 0,00!
        clockInNotificationsEnabled: draftNotifications,
        assignedServiceIds: draftAssignedServiceIds,
        availableOnline: draftAvailableOnline,
        matchBusinessHours: draftMatchBusinessHours,
        customSchedule: draftSchedule,
      };

      onUpdateState((prev) => ({
        ...prev,
        staff: [...prev.staff, newStaff],
        lastToastMessage: `${newStaff.fullName} adicionado(a) com sucesso!`,
      }));

      setSelectedStaffId(newStaffId);
      setIsAddingStaff(false);
      setIsSavingStaff(false);
    } else if (activeStaffMember) {
      onUpdateState((prev) => ({
        ...prev,
        staff: prev.staff.map((s) => {
          if (s.id !== activeStaffMember.id) return s;
          return {
            ...s,
            fullName: draftFullName.trim(),
            firstName: parts[0] || s.firstName,
            lastName: parts.slice(1).join(" ") || s.lastName,
            initials,
            role: draftRole,
            email: draftEmail,
            phone: draftPhone,
            serviceCommissionPercent: draftServiceCommission,
            productCommissionPercent: draftProductCommission,
            weeklyGoalCents: draftWeeklyGoal * 100,
            clockInNotificationsEnabled: draftNotifications,
            assignedServiceIds: draftAssignedServiceIds,
            availableOnline: draftAvailableOnline,
            matchBusinessHours: draftMatchBusinessHours,
            customSchedule: draftSchedule,
          };
        }),
        lastToastMessage: `Perfil de ${draftFullName.trim()} atualizado com sucesso!`,
      }));
      setIsSavingStaff(false);
    } else {
      setIsSavingStaff(false);
    }
  };

  // Handle removing a staff member
  const handleDeleteStaff = (staffId: string) => {
    if (state.staff.length <= 1) {
      onUpdateState((prev) => ({
        ...prev,
        lastToastMessage: "Não é possível remover o único profissional do estúdio.",
      }));
      return;
    }
    const memberToRemove = state.staff.find((s) => s.id === staffId);
    onUpdateState((prev) => ({
      ...prev,
      staff: prev.staff.filter((s) => s.id !== staffId),
      lastToastMessage: `${memberToRemove?.fullName || "Profissional"} removido(a) da equipe.`,
    }));
    setShowOptionsDropdown(false);
    setSelectedStaffId(state.staff.find((s) => s.id !== staffId)?.id ?? null);
  };

  // ===========================================================================
  // 1. STAFF DIRECTORY & DETAILS DRAWER (media_1792793967595_d578ece1.png)
  // ===========================================================================
  if (section === "team_staff") {
    return (
      <div className="w-full h-full flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-[#FAFAFA]">
        {/* Main Content Area: Directory Table */}
        <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-5 overflow-y-auto">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[24px] font-bold text-[#1C1C1E] tracking-tight">
                Profissionais
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5E5EA] bg-white text-[#1C1C1E] text-[12px] font-medium shadow-sm">
                <Users className="w-3.5 h-3.5 text-[#6E6E73]" />
                {state.staff.length}{" "}
                {state.staff.length === 1 ? "Membro" : "Membros"}
              </span>

              <button
                onClick={() => {
                  setIsAddingStaff(true);
                  setIsDrawerOpen(true);
                  setDrawerTab("schedule");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[12.5px] font-semibold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={staffSearchQuery}
              onChange={(e) => setStaffSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E5EA] rounded-xl text-[13px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] transition shadow-sm"
            />
          </div>

          {/* Staff Table */}
          <div className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EFEFF4] bg-[#FAFAFC] text-[12px] font-semibold text-[#8E8E93]">
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredStaff.length > 0 &&
                          selectedRowIds.length === filteredStaff.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRowIds(filteredStaff.map((s) => s.id));
                          } else {
                            setSelectedRowIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-[#D4D4D8] text-[#1C1C1E] focus:ring-0 accent-[#1C1C1E] cursor-pointer"
                      />
                    </th>
                    <th
                      onClick={() =>
                        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                      }
                      className="py-3 px-4 cursor-pointer select-none hover:text-[#1C1C1E]"
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <span>Nome</span>
                        <ArrowUpDown className="w-3 h-3 text-[#A1A1AA]" />
                      </div>
                    </th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Telefone</th>
                    <th className="py-3 px-4">Serviços</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEFF4] text-[13px]">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-10 text-center text-[#8E8E93] text-[13px]"
                      >
                        Nenhum profissional encontrado com os critérios de busca.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((member, index) => {
                      const isSelected =
                        selectedStaffId === member.id &&
                        !isAddingStaff &&
                        isDrawerOpen;
                      const isChecked = selectedRowIds.includes(member.id);
                      const isOwnerOrPrimary =
                        index === 0 ||
                        member.role.toLowerCase().includes("propriet") ||
                        member.role.toLowerCase().includes("owner");

                      // Assigned services lookup
                      const assignedServices = state.services.filter(
                        (srv) =>
                          member.assignedServiceIds &&
                          member.assignedServiceIds.includes(srv.id)
                      );

                      return (
                        <tr
                          key={member.id}
                          onClick={() => {
                            setSelectedStaffId(member.id);
                            setIsAddingStaff(false);
                            setIsDrawerOpen(true);
                            if (typeof window !== "undefined" && window.innerWidth < 1024) {
                              setTimeout(() => {
                                document.getElementById("staff-details-drawer")?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }, 50);
                            }
                          }}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? "bg-[#F5F5F7]"
                              : "hover:bg-[#F9F9FB]"
                          }`}
                        >
                          <td
                            className="py-3.5 px-4 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRowIds((prev) => [
                                    ...prev,
                                    member.id,
                                  ]);
                                } else {
                                  setSelectedRowIds((prev) =>
                                    prev.filter((id) => id !== member.id)
                                  );
                                }
                              }}
                              className="w-4 h-4 rounded border-[#D4D4D8] text-[#1C1C1E] focus:ring-0 accent-[#1C1C1E] cursor-pointer"
                            />
                          </td>

                          {/* Name + Initials */}
                          <td className="py-3.5 px-4 font-semibold text-[#1C1C1E]">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-[#1C1C1E] shrink-0"
                                style={{
                                  backgroundColor:
                                    member.avatarColor || "#E5E5EA",
                                }}
                              >
                                {member.initials}
                              </div>
                              <span className="truncate">
                                {member.fullName}
                                {isOwnerOrPrimary && (
                                  <span className="ml-1.5 text-[12px] font-normal text-[#6E6E73]">
                                    (Você)
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3.5 px-4 text-[#1C1C1E]">
                            {member.email || "—"}
                          </td>

                          {/* Phone */}
                          <td className="py-3.5 px-4 text-[#6E6E73] font-mono text-[12.5px]">
                            {member.phone || "—"}
                          </td>

                          {/* Services */}
                          <td className="py-3.5 px-4">
                            {assignedServices.length === 0 ? (
                              <span className="text-[12px] text-[#8E8E93]">
                                Nenhum serviço
                              </span>
                            ) : assignedServices.length ===
                              state.services.length ? (
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-sm bg-[#E11D8F] shrink-0" />
                                <span className="text-[12.5px] text-[#1C1C1E] font-medium">
                                  Todos os serviços ({assignedServices.length})
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                {assignedServices.slice(0, 2).map((srv) => (
                                  <span
                                    key={srv.id}
                                    className="inline-flex items-center gap-1.5 text-[12.5px] text-[#1C1C1E]"
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                                      style={{
                                        backgroundColor:
                                          srv.calendarColor || "#E11D8F",
                                      }}
                                    />
                                    <span>{srv.name}</span>
                                  </span>
                                ))}
                                {assignedServices.length > 2 && (
                                  <span className="text-[11px] font-medium text-[#6E6E73] bg-[#EFEFF4] px-1.5 py-0.5 rounded">
                                    +{assignedServices.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Drawer: Staff Details Slide-Over (matching media_1792793967595_d578ece1.png) */}
        {isDrawerOpen && (
          <aside id="staff-details-drawer" className="w-full lg:w-[400px] xl:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#E5E5EA] bg-white flex flex-col lg:h-full lg:sticky lg:top-0 lg:max-h-screen shadow-[-4px_0_16px_rgba(0,0,0,0.02)] scroll-mt-16">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#EFEFF4] flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#1C1C1E]">
                {isAddingStaff ? "Novo profissional" : "Detalhes do profissional"}
              </h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1C1C1E] transition"
                title="Fechar painel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Overview Banner */}
            <div className="p-4 border-b border-[#EFEFF4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-[#1C1C1E] shrink-0"
                  style={{
                    backgroundColor: isAddingStaff
                      ? "#E5E5EA"
                      : activeStaffMember?.avatarColor || "#E5E5EA",
                  }}
                >
                  {isAddingStaff
                    ? draftFullName
                        ?.split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "NP"
                    : activeStaffMember?.initials || "BS"}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14.5px] font-bold text-[#1C1C1E] truncate">
                    {isAddingStaff
                      ? draftFullName || "Nome do Profissional"
                      : activeStaffMember?.fullName}
                  </h3>
                  <p className="text-[12px] text-[#6E6E73] flex items-center gap-1">
                    <Crown className="w-3 h-3 text-[#A1A1AA]" />
                    {isAddingStaff ? draftRole : activeStaffMember?.role}
                  </p>
                </div>
              </div>

              {!isAddingStaff && activeStaffMember && (
                <div className="relative">
                  <button
                    onClick={() => setShowOptionsDropdown((prev) => !prev)}
                    className="p-1.5 rounded-lg hover:bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1C1C1E] transition"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {showOptionsDropdown && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-[#E5E5EA] rounded-xl shadow-lg z-20 py-1 text-[13px]">
                      <button
                        onClick={() => {
                          handleDeleteStaff(activeStaffMember.id);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#F5F5F7] text-red-600 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover profissional
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tabs Bar */}
            <div className="flex items-center border-b border-[#EFEFF4] px-4 text-[13px] font-medium text-[#6E6E73]">
              <button
                onClick={() => setDrawerTab("schedule")}
                className={`py-2.5 px-3 border-b-2 transition ${
                  drawerTab === "schedule"
                    ? "border-[#1C1C1E] text-[#1C1C1E] font-semibold"
                    : "border-transparent hover:text-[#1C1C1E]"
                }`}
              >
                Expediente
              </button>
              <button
                onClick={() => setDrawerTab("services")}
                className={`py-2.5 px-3 border-b-2 transition ${
                  drawerTab === "services"
                    ? "border-[#1C1C1E] text-[#1C1C1E] font-semibold"
                    : "border-transparent hover:text-[#1C1C1E]"
                }`}
              >
                Serviços
              </button>
              <button
                onClick={() => setDrawerTab("role")}
                className={`py-2.5 px-3 border-b-2 transition ${
                  drawerTab === "role"
                    ? "border-[#1C1C1E] text-[#1C1C1E] font-semibold"
                    : "border-transparent hover:text-[#1C1C1E]"
                }`}
              >
                Função &amp; Acesso
              </button>
            </div>

            {/* Scrollable Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* TAB 1: SCHEDULE (EXPEDIENTE) */}
              {drawerTab === "schedule" && (
                <div className="space-y-4">
                  {/* Toggle: Available to book online */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#FAFAFC] border border-[#EFEFF4]">
                    <div>
                      <p className="text-[13px] font-semibold text-[#1C1C1E]">
                        Disponível para agendamento online
                      </p>
                      <p className="text-[11.5px] text-[#6E6E73] mt-0.5">
                        Permite que clientes agendem horários com este profissional online.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftAvailableOnline((prev) => !prev)
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        draftAvailableOnline ? "bg-[#1C1C1E]" : "bg-[#D4D4D8]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          draftAvailableOnline ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle: Match location business hours */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#FAFAFC] border border-[#EFEFF4]">
                    <div>
                      <p className="text-[13px] font-semibold text-[#1C1C1E]">
                        Seguir horário de funcionamento do estúdio
                      </p>
                      <p className="text-[11.5px] text-[#6E6E73] mt-0.5">
                        Sincroniza os horários automaticamente com os horários gerais da empresa.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !draftMatchBusinessHours;
                        setDraftMatchBusinessHours(nextVal);
                        if (nextVal) {
                          const studioHours =
                            state.settings?.website?.businessHours;
                          if (studioHours && studioHours.length === 7) {
                            setDraftSchedule(studioHours);
                          } else {
                            setDraftSchedule(DEFAULT_STAFF_SCHEDULE);
                          }
                        }
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        draftMatchBusinessHours
                          ? "bg-[#1C1C1E]"
                          : "bg-[#D4D4D8]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          draftMatchBusinessHours
                            ? "translate-x-4"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* 7-Day Schedule List (media_1792793967595_d578ece1.png) */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider px-1">
                      Horários de Trabalho da Semana
                    </p>

                    {draftSchedule.map((day, idx) => {
                      const isEditing = editingDayIndex === idx;

                      return (
                        <div
                          key={day.dayOfWeek}
                          className="border border-[#E5E5EA] rounded-xl p-3 bg-white hover:border-[#D4D4D8] transition space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={day.isOpen}
                                onChange={(e) => {
                                  const updated = [...draftSchedule];
                                  updated[idx] = {
                                    ...updated[idx],
                                    isOpen: e.target.checked,
                                  };
                                  setDraftSchedule(updated);
                                  setDraftMatchBusinessHours(false);
                                }}
                                className="w-4 h-4 rounded border-[#D4D4D8] text-[#1C1C1E] focus:ring-0 accent-[#1C1C1E] cursor-pointer"
                              />
                              <div>
                                <p className="text-[13px] font-semibold text-[#1C1C1E]">
                                  {day.label}
                                </p>
                                <p className="text-[12px] font-mono text-[#6E6E73]">
                                  {day.isOpen
                                    ? `${day.startTime} – ${day.endTime}`
                                    : "Folga"}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (isEditing) {
                                  setEditingDayIndex(null);
                                } else {
                                  setEditingDayIndex(idx);
                                  setEditStartTime(day.startTime || "08:00");
                                  setEditEndTime(day.endTime || "17:00");
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-[#F5F5F7] text-[#8E8E93] hover:text-[#1C1C1E] transition"
                              title="Editar horário"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Inline Time Editor */}
                          {isEditing && (
                            <div className="pt-2 border-t border-[#EFEFF4] flex items-center gap-2">
                              <input
                                type="time"
                                value={editStartTime}
                                onChange={(e) =>
                                  setEditStartTime(e.target.value)
                                }
                                className="px-2 py-1 rounded-lg border border-[#E5E5EA] text-[12px] font-mono"
                              />
                              <span className="text-[12px] text-[#8E8E93]">
                                até
                              </span>
                              <input
                                type="time"
                                value={editEndTime}
                                onChange={(e) => setEditEndTime(e.target.value)}
                                className="px-2 py-1 rounded-lg border border-[#E5E5EA] text-[12px] font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...draftSchedule];
                                  updated[idx] = {
                                    ...updated[idx],
                                    isOpen: true,
                                    startTime: editStartTime,
                                    endTime: editEndTime,
                                  };
                                  setDraftSchedule(updated);
                                  setDraftMatchBusinessHours(false);
                                  setEditingDayIndex(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#1C1C1E] text-white text-[11px] font-medium hover:bg-black"
                              >
                                Salvar
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: SERVICES (SERVIÇOS ATENDIDOS) */}
              {drawerTab === "services" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <div>
                      <p className="text-[13px] font-semibold text-[#1C1C1E]">
                        Serviços atendidos
                      </p>
                      <p className="text-[11.5px] text-[#6E6E73]">
                        {draftAssignedServiceIds.length} de{" "}
                        {state.services.length} selecionados
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[12px]">
                      <button
                        type="button"
                        onClick={() =>
                          setDraftAssignedServiceIds(
                            state.services.map((s) => s.id)
                          )
                        }
                        className="text-[#1C1C1E] hover:underline font-medium"
                      >
                        Todos
                      </button>
                      <span className="text-[#D4D4D8]">·</span>
                      <button
                        type="button"
                        onClick={() => setDraftAssignedServiceIds([])}
                        className="text-[#6E6E73] hover:underline"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-[#EFEFF4] border border-[#E5E5EA] rounded-xl overflow-hidden bg-white">
                    {state.services.map((service) => {
                      const isAssigned = draftAssignedServiceIds.includes(
                        service.id
                      );

                      return (
                        <div
                          key={service.id}
                          onClick={() => {
                            if (isAssigned) {
                              setDraftAssignedServiceIds((prev) =>
                                prev.filter((id) => id !== service.id)
                              );
                            } else {
                              setDraftAssignedServiceIds((prev) => [
                                ...prev,
                                service.id,
                              ]);
                            }
                          }}
                          className="p-3 flex items-center justify-between hover:bg-[#FAFAFC] cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => {}} // handled by parent onClick
                              className="w-4 h-4 rounded border-[#D4D4D8] text-[#1C1C1E] focus:ring-0 accent-[#1C1C1E] cursor-pointer"
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-sm shrink-0"
                              style={{
                                backgroundColor:
                                  service.calendarColor || "#E11D8F",
                              }}
                            />
                            <div>
                              <p className="text-[13px] font-semibold text-[#1C1C1E]">
                                {service.name}
                              </p>
                              <p className="text-[11px] text-[#6E6E73]">
                                {service.durationMinutes} min ·{" "}
                                {formatBRL(service.priceCents)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: ROLE & ACCESS (FUNÇÃO & ACESSO) */}
              {drawerTab === "role" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73] uppercase mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Ana Clara Souza"
                      value={draftFullName}
                      onChange={(e) => setDraftFullName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73] uppercase mb-1">
                      Cargo / Especialidade
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Especialista em Beleza"
                      value={draftRole}
                      onChange={(e) => setDraftRole(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73] uppercase mb-1">
                      E-mail Profissional
                    </label>
                    <input
                      type="email"
                      placeholder="nome@aurastudio.com.br"
                      value={draftEmail}
                      onChange={(e) => setDraftEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73] uppercase mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="(11) 99777-1122"
                      value={draftPhone}
                      onChange={(e) => setDraftPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]"
                    />
                  </div>

                  <div className="pt-2 border-t border-[#EFEFF4] space-y-3">
                    <p className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                      Comissões &amp; Metas
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">
                          % Comissão Serviços
                        </label>
                        <input
                          type="number"
                          value={draftServiceCommission}
                          onChange={(e) =>
                            setDraftServiceCommission(
                              Math.min(
                                100,
                                Math.max(0, parseInt(e.target.value || "0", 10))
                              )
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">
                          % Comissão Produtos
                        </label>
                        <input
                          type="number"
                          value={draftProductCommission}
                          onChange={(e) =>
                            setDraftProductCommission(
                              Math.min(
                                100,
                                Math.max(0, parseInt(e.target.value || "0", 10))
                              )
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">
                        Meta Semanal (R$)
                      </label>
                      <input
                        type="number"
                        value={draftWeeklyGoal}
                        onChange={(e) =>
                          setDraftWeeklyGoal(
                            Math.max(0, parseInt(e.target.value || "0", 10))
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E5EA] text-[13px] font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer with Save Action */}
            <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[#EFEFF4] bg-white">
              <button
                type="button"
                onClick={handleSaveStaffDrawer}
                disabled={isSavingStaff}
                className="w-full py-2.5 rounded-full bg-[#1C1C1E] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold transition shadow-sm"
              >
                {isAddingStaff ? "Adicionar Profissional" : "Salvar Alterações"}
              </button>
            </div>
          </aside>
        )}
      </div>
    );
  }

  // ===========================================================================
  // 2. COMMISSIONS (06-5-commissions.png)
  // ===========================================================================
  if (section === "team_commissions") {
    // Dynamic calculation of total revenue booked this week from real calendar events + sales
    const allEventsSumCents = state.calendarEvents
      .filter((e) => e.status !== "canceled")
      .reduce((sum, e) => sum + (e.totalCents || 0), 0);
    const allSalesSumCents = state.salesHistory
      .filter((s) => s.status !== "Reembolsado")
      .reduce((sum, s) => sum + s.amountCents, 0);
    const totalSalonBookedCents =
      allEventsSumCents + allSalesSumCents > 0
        ? allEventsSumCents + allSalesSumCents
        : state.staff.reduce((acc, m) => acc + (m.bookedThisWeekCents || 0), 0);

    return (
      <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        {/* Editorial Hero Card matching 06-5-commissions.png */}
        <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-gg-card">
          <div className="lg:col-span-7 space-y-4">
            <h1 className="font-display text-[28px] sm:text-[36px] lg:text-[42px] leading-[1.12] sm:leading-[1.06] text-[#1C1C1E]">
              Gerencie comissões com facilidade
            </h1>
            <p className="text-[15px] text-[#6E6E73] max-w-xl">
              Configure estruturas de comissão por serviços e produtos para cada profissional e acompanhe metas semanais em tempo real.
            </p>
          </div>

          {/* Dark Weekly Goal Card from 06-5-commissions.png */}
          <div className="lg:col-span-5 bg-[#1C1C1E] text-white rounded-[22px] p-6 space-y-4 shadow-gg-card">
            <div className="flex items-center justify-between text-[12px] text-[#A1A1AA]">
              <span className="uppercase tracking-wider font-semibold">
                Meta Semanal (Weekly Goal)
              </span>
              <span className="font-mono text-white">R$ 6.250,00</span>
            </div>
            <div>
              <p className="text-[28px] font-mono font-bold text-white">
                {formatBRL(totalSalonBookedCents || 825000)}
              </p>
              <p className="text-[12px] text-emerald-400 font-medium">
                Agendado nesta semana · 132% da meta atingida
              </p>
            </div>
            <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-[#E11D8F] w-full rounded-full" />
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[13px]">
              <span className="text-[#A1A1AA]">Comissão acumulada</span>
              <span className="font-mono font-bold text-white">
                R$ 3.712,50
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Commission Policy Editor per Staff */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.staff.map((member) => {
            const memberEvents = state.calendarEvents.filter(
              (e) =>
                (e.providerId === member.id ||
                  e.providerName?.toLowerCase() ===
                    member.fullName?.toLowerCase()) &&
                e.status !== "canceled"
            );
            const eventsSumCents = memberEvents.reduce(
              (acc, e) => acc + (e.totalCents || 0),
              0
            );
            const memberSales = state.salesHistory.filter(
              (s) => s.providerId === member.id && s.status !== "Reembolsado"
            );
            const salesSumCents = memberSales.reduce(
              (acc, s) => acc + s.amountCents,
              0
            );

            // Dynamic sum: if calendar events exist, credit real bookings; avoids fake hardcoded numbers
            const effectiveBookedCents =
              eventsSumCents + salesSumCents > 0
                ? eventsSumCents + salesSumCents
                : state.calendarEvents.length > 0
                ? 0
                : member.bookedThisWeekCents || 0;

            const pctGoal = Math.min(
              100,
              Math.round(
                (effectiveBookedCents /
                  Math.max(1, member.weeklyGoalCents)) *
                  100
              )
            );
            const earnedCommissionCents = Math.round(
              effectiveBookedCents *
                (member.serviceCommissionPercent / 100)
            );

            return (
              <div
                key={member.id}
                className="bg-white rounded-[22px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[#1C1C1E]"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.initials}
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold text-[#1C1C1E]">
                        {member.fullName}
                      </h3>
                      <p className="text-[12px] text-[#6E6E73]">{member.role}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[15px] font-bold text-[#6E56CF]">
                    Comissão: {formatBRL(earnedCommissionCents)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="p-4 rounded-[16px] bg-[#FAFAFC] border border-[#EFEFF4] space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#6E6E73]">
                      Agendado:{" "}
                      <strong>{formatBRL(effectiveBookedCents)}</strong>
                    </span>
                    <span className="text-[#6E6E73]">
                      Meta: <strong>{formatBRL(member.weeklyGoalCents)}</strong> (
                      {pctGoal}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E5E5EA] overflow-hidden">
                    <div
                      className="h-full bg-[#6E56CF] rounded-full transition-all"
                      style={{ width: `${pctGoal}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">
                      % Comissão Serviços
                    </label>
                    <input
                      type="number"
                      value={member.serviceCommissionPercent}
                      onChange={(e) => {
                        const val = Math.min(
                          100,
                          Math.max(0, parseInt(e.target.value || "0", 10))
                        );
                        onUpdateState((prev) => ({
                          ...prev,
                          staff: prev.staff.map((s) =>
                            s.id === member.id
                              ? { ...s, serviceCommissionPercent: val }
                              : s
                          ),
                        }));
                      }}
                      className="w-full px-3.5 py-2 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">
                      % Comissão Produtos (Retail)
                    </label>
                    <input
                      type="number"
                      value={member.productCommissionPercent}
                      onChange={(e) => {
                        const val = Math.min(
                          100,
                          Math.max(0, parseInt(e.target.value || "0", 10))
                        );
                        onUpdateState((prev) => ({
                          ...prev,
                          staff: prev.staff.map((s) =>
                            s.id === member.id
                              ? { ...s, productCommissionPercent: val }
                              : s
                          ),
                        }));
                      }}
                      className="w-full px-3.5 py-2 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 3. PAYROLL / FECHAMENTO DE REPASSE (06-5-payroll.png)
  // ===========================================================================
  if (section === "team_payroll") {
    const payrollRows = calculatePayrollSummary(state);
    const totalPayrollCents = payrollRows.reduce(
      (sum, r) => sum + r.totalPayoutCents,
      0
    );

    return (
      <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        {/* Editorial Hero matching 06-5-payroll.png */}
        <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-gg-card">
          <div className="lg:col-span-7 space-y-4">
            <h1 className="font-display text-[28px] sm:text-[36px] lg:text-[42px] leading-[1.12] sm:leading-[1.06] text-[#1C1C1E]">
              Pague sua equipe em minutos, não em horas
            </h1>
            <p className="text-[15px] text-[#6E6E73] max-w-xl">
              Cálculo automático de repasses (Lei do Salão-Parceiro / MEI), somando comissões de serviços, venda de produtos, gorjetas e horas do ponto.
            </p>
            <button
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  lastToastMessage: `Fechamento de repasse Pix (${formatBRL(
                    totalPayrollCents
                  )}) processado para ${payrollRows.length} profissionais!`,
                }))
              }
              className="px-6 py-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[14px] font-semibold transition"
            >
              Rodar fechamento de repasse (Run payroll)
            </button>
          </div>

          {/* Right Mockup Card from 06-5-payroll.png */}
          <div className="lg:col-span-5 bg-white rounded-[20px] p-6 border border-[#E5E5EA] shadow-gg-card space-y-3">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#6E6E73]">
              Total líquido a repassar
            </span>
            <p className="text-[32px] font-mono font-bold text-[#1C1C1E]">
              {formatBRL(totalPayrollCents)}
            </p>
            <p className="text-[12px] text-zinc-600 font-medium">
              Conciliado automaticamente com o Histórico de Vendas &amp; Ponto
            </p>
          </div>
        </div>

        {/* Payroll Breakdown Table */}
        <div className="bg-white rounded-[20px] border border-[#E5E5EA] shadow-gg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EFEFF4] flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#1C1C1E]">
              Demonstrativo de Repasse por Profissional
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EFEFF4] text-[12px] font-semibold text-[#8E8E93]">
                  <th className="py-3.5 px-5">Profissional</th>
                  <th className="py-3.5 px-5">Volume Bruto</th>
                  <th className="py-3.5 px-5">Comissão Serviços</th>
                  <th className="py-3.5 px-5">Comissão Produtos</th>
                  <th className="py-3.5 px-5">Gorjetas</th>
                  <th className="py-3.5 px-5">Horas no Ponto</th>
                  <th className="py-3.5 px-5 text-right">Repasse Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFF4] text-[13px]">
                {payrollRows.map((row) => (
                  <tr key={row.staffId} className="hover:bg-[#FAFAFC]">
                    <td className="py-4 px-5 font-bold text-[#1C1C1E]">
                      {row.staffName}
                      <span className="block text-[11px] font-normal text-[#6E6E73]">
                        {row.role}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono">
                      {formatBRL(row.bookedCents)}
                    </td>
                    <td className="py-4 px-5 font-mono text-[#1C1C1E]">
                      {formatBRL(row.serviceCommissionCents)}
                    </td>
                    <td className="py-4 px-5 font-mono text-[#1C1C1E]">
                      {formatBRL(row.productCommissionCents)}
                    </td>
                    <td className="py-4 px-5 font-mono text-[#16A34A]">
                      {formatBRL(row.tipsCents)}
                    </td>
                    <td className="py-4 px-5 font-mono">{row.loggedHours}h</td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-[#6E56CF] text-[15px]">
                      {formatBRL(row.totalPayoutCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 4. TIME TRACKING (06-5-time-tracking.png & 06-5-1.png)
  // ===========================================================================
  const sessionStatus = state.timeTracking.activeSessionStatus;
  const elapsedFormatted = formatSecondsHMS(
    state.timeTracking.activeElapsedSeconds || 15678
  );

  return (
    <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {/* Editorial Hero + Live Dark Timeclock Widget (06-5-time-tracking.png) */}
      <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-gg-card">
        <div className="lg:col-span-7 space-y-4">
          <h1 className="font-display text-[28px] sm:text-[36px] lg:text-[42px] leading-[1.12] sm:leading-[1.06] text-[#1C1C1E]">
            Controle de ponto simplificado
          </h1>
          <p className="text-[15px] text-[#6E6E73] max-w-xl">
            Gerencie entradas, intervalos e folhas de ponto da equipe em um só lugar, sincronizando automaticamente as horas trabalhadas com o fechamento de repasse.
          </p>
        </div>

        {/* Dark Timeclock 04:21:18 Card from 06-5-time-tracking.png */}
        <div className="lg:col-span-5 bg-[#1C1C1E] text-white rounded-[22px] p-6 space-y-4 shadow-gg-card">
          <div className="flex items-center justify-between">
            <span className="text-[12px] uppercase tracking-wider text-[#A1A1AA] font-semibold">
              Relógio de Ponto (Timeclock)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold">
              {sessionStatus === "clocked_in"
                ? "Em turno ativo"
                : sessionStatus === "on_break"
                  ? "Em intervalo (Break)"
                  : "Turno encerrado"}
            </span>
          </div>

          <p className="text-[36px] font-mono font-bold tracking-wider text-white">
            {elapsedFormatted}
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {sessionStatus === "idle" ? (
              <button
                onClick={() =>
                  onUpdateState((prev) =>
                    toggleTimeclockAction(prev, "check_in")
                  )
                }
                className="col-span-2 py-2.5 rounded-full bg-[#6E56CF] hover:opacity-95 text-white text-[13px] font-semibold"
              >
                Registrar Entrada (Check in)
              </button>
            ) : (
              <>
                <button
                  onClick={() =>
                    onUpdateState((prev) =>
                      toggleTimeclockAction(
                        prev,
                        sessionStatus === "on_break"
                          ? "resume_work"
                          : "take_break"
                      )
                    )
                  }
                  className="py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[13px] font-semibold"
                >
                  {sessionStatus === "on_break"
                    ? "Retornar do intervalo"
                    : "Iniciar intervalo (Take break)"}
                </button>
                <button
                  onClick={() =>
                    onUpdateState((prev) =>
                      toggleTimeclockAction(prev, "check_out")
                    )
                  }
                  className="py-2.5 rounded-full bg-[#E11D8F] hover:opacity-95 text-white text-[13px] font-semibold"
                >
                  Registrar Saída (Check out)
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settings & Timesheets Layout matching 06-5-1.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Anchor Nav */}
        <div className="lg:col-span-3 space-y-1">
          <div className="px-4 py-2.5 rounded-[12px] bg-[#1C1C1E] text-white font-semibold text-[13px] shadow-sm">
            Configurações gerais
          </div>
          <div className="px-4 py-2.5 rounded-[12px] text-[#6E6E73] font-medium text-[13px]">
            Membros da equipe
          </div>
          <div className="px-4 py-2.5 rounded-[12px] text-[#6E6E73] font-medium text-[13px]">
            Folhas de ponto (Timesheets)
          </div>
        </div>

        {/* Right Cards (06-5-1.png) */}
        <div className="lg:col-span-9 space-y-6">
          {/* Card 1: General Settings & Break Rules */}
          <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4">
            <h2 className="text-[18px] font-bold text-[#1C1C1E]">
              Configurações gerais (General settings)
            </h2>

            <div className="flex items-center justify-between py-2 border-b border-[#EFEFF4]">
              <div>
                <p className="text-[14px] font-bold text-[#1C1C1E]">
                  Ativar controle de ponto (Enable time tracking)
                </p>
                <p className="text-[12px] text-[#6E6E73]">
                  Permite que membros da equipe registrem entrada, intervalos e saída.
                </p>
              </div>
              <input
                type="checkbox"
                checked={state.timeTracking.enabled}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    timeTracking: {
                      ...prev.timeTracking,
                      enabled: e.target.checked,
                    },
                  }))
                }
                className="w-5 h-5 accent-[#6E56CF]"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-[14px] font-bold text-[#1C1C1E]">
                  1º tipo de intervalo padrão (1st break type)
                </p>
                <p className="text-[12px] text-[#6E6E73]">
                  Duração padrão do intervalo de almoço/descanso (minutos).
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={state.timeTracking.firstBreakDurationMinutes}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      timeTracking: {
                        ...prev.timeTracking,
                        firstBreakDurationMinutes: Math.max(
                          10,
                          parseInt(e.target.value || "30", 10)
                        ),
                      },
                    }))
                  }
                  className="w-20 px-3 py-1.5 rounded-lg border border-[#E5E5EA] text-[13px] font-mono font-bold"
                />
                <input
                  type="checkbox"
                  checked={state.timeTracking.firstBreakTypeEnabled}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      timeTracking: {
                        ...prev.timeTracking,
                        firstBreakTypeEnabled: e.target.checked,
                      },
                    }))
                  }
                  className="w-5 h-5 accent-[#6E56CF]"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Team Members Notifications (06-5-1.png) */}
          <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4">
            <h2 className="text-[18px] font-bold text-[#1C1C1E]">
              Notificações de entrada/saída por membro
            </h2>
            <div className="divide-y divide-[#EFEFF4]">
              {state.staff.map((member) => (
                <div
                  key={member.id}
                  className="py-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-[#1C1C1E]"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.initials}
                    </div>
                    <span className="text-[14px] font-semibold text-[#1C1C1E]">
                      {member.fullName}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={member.clockInNotificationsEnabled}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        staff: prev.staff.map((s) =>
                          s.id === member.id
                            ? {
                                ...s,
                                clockInNotificationsEnabled: e.target.checked,
                              }
                            : s
                        ),
                      }))
                    }
                    className="w-5 h-5 accent-[#6E56CF]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Recorded Timesheet Logs */}
          <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-3">
            <h2 className="text-[18px] font-bold text-[#1C1C1E]">
              Folhas de Ponto Registradas ({state.timeTracking.logs.length})
            </h2>
            <div className="divide-y divide-[#EFEFF4]">
              {state.timeTracking.logs.map((log) => (
                <div
                  key={log.id}
                  className="py-3 flex items-center justify-between text-[13px]"
                >
                  <div>
                    <p className="font-bold text-[#1C1C1E]">{log.staffName}</p>
                    <p className="text-[12px] text-[#6E6E73]">
                      Data: {log.dateISO} · Entrada {log.checkInTime} – Saída{" "}
                      {log.checkOutTime ?? "Em andamento"} ({log.breakMinutes}m
                      intervalo)
                    </p>
                  </div>
                  <span className="font-mono font-bold text-[#6E56CF]">
                    {formatSecondsHMS(log.totalWorkedSeconds)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
