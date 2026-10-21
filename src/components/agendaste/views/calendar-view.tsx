"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  X,
  Check,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  QrCode,
  Repeat,
  MapPin,
  UserPlus,
  Users,
  CheckCircle2,
  CalendarPlus,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import {
  StudioState,
  CalendarEventItem,
  CalendarEventType,
  formatBRL,
  formatDateBR,
  parseTimeMinutes,
  formatMinutesToHHMM,
  skipCalendarByWeeks,
  validateAndCreateCalendarEvent,
  bookFromWaitlistEntry,
  rebookAppointmentOneTap,
  processWhatsappInboundReply,
  executeQuickSaleCheckout,
  saveCatalogService,
  getTodayDateISO,
} from "@/lib/agendaste-store";

interface CalendarViewProps {
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
  onOpenQuickSale: (prefillAppointment?: CalendarEventItem) => void;
}

const START_HOUR = 8;
const HOURS = Array.from({ length: 15 }, (_, idx) => idx + START_HOUR); // 08:00 .. 22:00 (grade ativa até 23:00)

function getWeekDays(selectedDateISO: string) {
  const parts = selectedDateISO.split("-").map(Number);
  const baseDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayOfWeek = baseDate.getDay();
  const sunday = new Date(baseDate);
  sunday.setDate(baseDate.getDate() - dayOfWeek);

  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return {
      label: labels[i],
      dayNum: d.getDate(),
      dateISO: `${year}-${month}-${day}`,
    };
  });
}

export function CalendarView({
  state,
  onUpdateState,
  onOpenQuickSale,
}: CalendarViewProps) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [waitlistDrawerOpen, setWaitlistDrawerOpen] = useState(false);
  const [waitlistProviderFilter, setWaitlistProviderFilter] =
    useState<string>("all");
  const [newAppointmentDrawerOpen, setNewAppointmentDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(
    null
  );

  // New Appointment Form State (03-4-calendar.png)
  const [eventType, setEventType] = useState<CalendarEventType>("appointment");
  const [providerId, setProviderId] = useState<string>(
    state.staff[0]?.id ?? "staff-bruno"
  );
  const [clientId, setClientId] = useState<string>("");
  const [showInlineNewClient, setShowInlineNewClient] = useState(false);
  const [inlineClientName, setInlineClientName] = useState("");
  const [inlineClientPhone, setInlineClientPhone] = useState("");
  const [inlineClientEmail, setInlineClientEmail] = useState("");
  const [showInlineNewService, setShowInlineNewService] = useState(false);
  const [inlineServiceName, setInlineServiceName] = useState("");
  const [inlineServicePriceBRL, setInlineServicePriceBRL] = useState("180");
  const [inlineServiceDurationMin, setInlineServiceDurationMin] = useState("45");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    state.services[0] ? [state.services[0].id] : []
  );
  const [eventDateISO, setEventDateISO] = useState<string>(
    state.calendarView.selectedDateISO
  );
  const [startTime, setStartTime] = useState<string>("11:30");
  const [addressOrNotes, setAddressOrNotes] = useState<string>("");
  const [isRepeating, setIsRepeating] = useState<boolean>(false);
  const [collectDeposit, setCollectDeposit] = useState<boolean>(true);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Dynamic real-time tracking (updates every 30s, hydration-safe)
  const [currentTime, setCurrentTime] = useState<{
    hours: number;
    minutes: number;
    formatted: string;
    totalMinutes: number;
    todayISO: string;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolledRef = useRef(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const todayISO = `${year}-${month}-${day}`;
      setCurrentTime({
        hours,
        minutes,
        formatted,
        totalMinutes: hours * 60 + minutes,
        todayISO,
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const selectedDateISO = state.calendarView.selectedDateISO;
  const viewMode = state.calendarView.mode;

  // Determine if viewing "today" (local date)
  const isViewingToday =
    currentTime !== null
      ? selectedDateISO === currentTime.todayISO
      : selectedDateISO === getTodayDateISO();

  // If calendar opens on the old demo date 2026-10-17, automatically sync to today
  useEffect(() => {
    if (state.calendarView.selectedDateISO === "2026-10-17") {
      const today = getTodayDateISO();
      onUpdateState((prev) => ({
        ...prev,
        calendarView: {
          ...prev.calendarView,
          selectedDateISO: today,
        },
      }));
    }
  }, [state.calendarView.selectedDateISO, onUpdateState]);

  // Auto-scroll to current time on mount if viewing today
  useEffect(() => {
    if (
      !hasAutoScrolledRef.current &&
      currentTime &&
      isViewingToday &&
      scrollContainerRef.current
    ) {
      const topPx = ((currentTime.totalMinutes - START_HOUR * 60) / 60) * 80;
      scrollContainerRef.current.scrollTo({
        top: Math.max(0, topPx - 160),
        behavior: "smooth",
      });
      hasAutoScrolledRef.current = true;
    }
  }, [currentTime, isViewingToday]);

  const handleGoToToday = () => {
    const targetISO = currentTime?.todayISO ?? getTodayDateISO();
    onUpdateState((prev) => ({
      ...prev,
      calendarView: {
        ...prev.calendarView,
        selectedDateISO: targetISO,
      },
    }));
    if (currentTime && scrollContainerRef.current) {
      const topPx = ((currentTime.totalMinutes - START_HOUR * 60) / 60) * 80;
      scrollContainerRef.current.scrollTo({
        top: Math.max(0, topPx - 160),
        behavior: "smooth",
      });
    }
  };

  const eventsForSelectedDate = state.calendarEvents.filter(
    (e) =>
      e.dateISO === selectedDateISO &&
      e.status !== "canceled" &&
      (state.calendarView.selectedProviderId === "all" ||
        e.providerId === state.calendarView.selectedProviderId)
  );

  const openNewDrawerAtSlot = (timeHHMM: string, presetType?: CalendarEventType) => {
    setConflictError(null);
    setEventType(presetType ?? "appointment");
    setEventDateISO(selectedDateISO);
    setStartTime(timeHHMM);
    setNewAppointmentDrawerOpen(true);
  };

  const selectedServicesObjects = state.services.filter((s) =>
    selectedServiceIds.includes(s.id)
  );
  const computedTotalCents = selectedServicesObjects.reduce(
    (acc, s) => acc + s.priceCents,
    0
  );
  const computedDurationMin = selectedServicesObjects.reduce(
    (acc, s) => acc + s.durationMinutes + (s.blockTimeEnabled ? s.blockAfterMinutes : 0),
    0
  );
  const computedEndTime = formatMinutesToHHMM(
    parseTimeMinutes(startTime) + (computedDurationMin || 60)
  );

  const handleCreateEvent = () => {
    setConflictError(null);
    const result = validateAndCreateCalendarEvent(state, {
      eventType,
      dateISO: eventDateISO,
      startTime,
      providerId,
      clientId: showInlineNewClient ? undefined : clientId || state.clients[0]?.id,
      newClientInline:
        showInlineNewClient && inlineClientName.trim()
          ? {
              fullName: inlineClientName.trim(),
              phone: inlineClientPhone.trim() || "(11) 99999-0000",
              email: inlineClientEmail.trim() || "cliente@luveastudio.app",
            }
          : undefined,
      serviceIds: selectedServiceIds,
      addressOrNotes,
      isRepeating,
      collectDeposit,
    });

    if (!result.ok) {
      setConflictError(result.message);
      return;
    }

    onUpdateState(() => ({
      ...result.state,
      calendarView: {
        ...result.state.calendarView,
        selectedDateISO: eventDateISO,
      },
    }));
    setNewAppointmentDrawerOpen(false);
    setShowInlineNewClient(false);
    setInlineClientName("");
    setInlineClientPhone("");
    setInlineClientEmail("");
    setAddressOrNotes("");
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-53px-calc(4.5rem+env(safe-area-inset-bottom,0px)))] md:h-[calc(100vh-1rem)] bg-white dark:bg-[#09090b] overflow-hidden">
      {/* Top Calendar Header (03-1-calendar.png) */}
      <header className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] z-20">
        {/* Desktop Header Layout (>= md) */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Left: Month/Year + Popover Date Picker (03-2-calendar.png) */}
          <div className="relative flex items-center gap-3">
            <button
              onClick={() => setDatePopoverOpen((v) => !v)}
              className="flex items-center gap-2 text-[22px] font-semibold text-[#1C1C1E] dark:text-white hover:opacity-80 transition"
            >
              <span>Outubro 2026</span>
              <ChevronDown className="w-5 h-5 text-[#6E6E73] dark:text-[#a1a1aa]" />
            </button>

            <button
              onClick={handleGoToToday}
              className="px-3.5 py-1.5 rounded-full border border-[#E5E5EA] dark:border-[#27272a] text-[13px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
            >
              Hoje
            </button>

            {/* Popover Date Picker with +2 to +8 weeks jump (03-2-calendar.png) */}
            {datePopoverOpen && (
              <div className="absolute left-0 top-12 w-[340px] bg-white dark:bg-[#18181b] rounded-[20px] border border-[#E5E5EA] dark:border-[#27272a] shadow-gg-modal p-5 z-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[15px] font-semibold text-[#1C1C1E] dark:text-white">
                    Outubro 2026
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        onUpdateState((prev) => skipCalendarByWeeks(prev, -1))
                      }
                      className="p-1.5 rounded-full hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[#6E6E73] dark:text-[#a1a1aa]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        onUpdateState((prev) => skipCalendarByWeeks(prev, 1))
                      }
                      className="p-1.5 rounded-full hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[#6E6E73] dark:text-[#a1a1aa]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mini Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#8E8E93] dark:text-[#71717a] mb-2">
                  <span>D</span>
                  <span>S</span>
                  <span>T</span>
                  <span>Q</span>
                  <span>Q</span>
                  <span>S</span>
                  <span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[13px] mb-4">
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1;
                    const iso = `2026-10-${String(day).padStart(2, "0")}`;
                    const isSelected = selectedDateISO === iso;
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          onUpdateState((prev) => ({
                            ...prev,
                            calendarView: {
                              ...prev.calendarView,
                              selectedDateISO: iso,
                            },
                          }));
                          setDatePopoverOpen(false);
                        }}
                        className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center font-medium transition ${
                          isSelected
                            ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b]"
                            : "text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Week Skip Pills (+2 to +8 weeks — 03-2-calendar.png) */}
                <div className="pt-3 border-t border-[#E5E5EA] dark:border-[#27272a]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#71717a] mb-2.5">
                    Avançar semanas (Retorno rápido)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[2, 3, 4, 5, 6, 7, 8].map((weeks) => (
                      <button
                        key={weeks}
                        onClick={() => {
                          onUpdateState((prev) => skipCalendarByWeeks(prev, weeks));
                          setDatePopoverOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] hover:bg-[#1C1C1E] dark:hover:bg-white hover:text-white dark:hover:text-[#09090b] text-[12px] font-semibold text-[#1C1C1E] dark:text-white transition"
                      >
                        +{weeks} sem.
                      </button>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                    Data selecionada:{" "}
                    <strong className="text-[#1C1C1E] dark:text-white">{formatDateBR(selectedDateISO)}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Center: Week Strip (Dom .. Sáb) */}
          <div className="flex items-center gap-1.5 bg-[#F5F5F7] dark:bg-[#18181b] border border-transparent dark:border-[#27272a] px-2 py-1.5 rounded-full">
            {getWeekDays(selectedDateISO).map((wd) => {
              const active = selectedDateISO === wd.dateISO;
              return (
                <button
                  key={wd.dateISO}
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      calendarView: {
                        ...prev.calendarView,
                        selectedDateISO: wd.dateISO,
                      },
                    }))
                  }
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition flex items-center gap-1.5 ${
                    active
                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] shadow-sm"
                      : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white"
                  }`}
                >
                  <span>{wd.label}</span>
                  <span>{wd.dayNum}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Mode Toggle, Waitlist Button, and + New Button (03-1 / 03-3 / 03-4) */}
          <div className="flex items-center gap-2.5">
            {/* Provider Selector */}
            <select
              aria-label="Filtrar por profissional"
              value={state.calendarView.selectedProviderId}
              onChange={(e) =>
                onUpdateState((prev) => ({
                  ...prev,
                  calendarView: {
                    ...prev.calendarView,
                    selectedProviderId: e.target.value,
                  },
                }))
              }
              className="px-3.5 py-2 rounded-full border border-[#E5E5EA] dark:border-[#27272a] text-[13px] font-medium text-[#1C1C1E] dark:text-white bg-white dark:bg-[#18181b] focus:outline-none"
            >
              <option value="all">Toda a equipe ({state.staff.length})</option>
              {state.staff.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName}
                </option>
              ))}
            </select>

            {/* Day / Week Segmented Switch */}
            <div className="flex items-center bg-[#F5F5F7] dark:bg-[#27272a] p-1 rounded-full border border-transparent dark:border-[#3f3f46]">
              <button
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    calendarView: { ...prev.calendarView, mode: "day" },
                  }))
                }
                className={`px-3 py-1 rounded-full text-[12px] font-semibold transition ${
                  viewMode === "day"
                    ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white shadow-sm"
                    : "text-[#6E6E73] dark:text-[#a1a1aa]"
                }`}
              >
                Dia
              </button>
              <button
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    calendarView: { ...prev.calendarView, mode: "week" },
                  }))
                }
                className={`px-3 py-1 rounded-full text-[12px] font-semibold transition ${
                  viewMode === "week"
                    ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white shadow-sm"
                    : "text-[#6E6E73] dark:text-[#a1a1aa]"
                }`}
              >
                Semana
              </button>
            </div>

            {/* Waitlist Drawer Trigger (03-3-calendar.png) */}
            <button
              onClick={() => setWaitlistDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E5EA] dark:border-[#27272a] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[13px] font-semibold text-[#1C1C1E] dark:text-white transition"
            >
              <Clock className="w-4 h-4 text-[#6E56CF] dark:text-[#A494F7]" />
              <span>Lista de espera</span>
              {state.waitlist.length > 0 && (
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] font-bold">
                  {state.waitlist.length}
                </span>
              )}
            </button>

            {/* Quick Sale POS Button */}
            <button
              onClick={() => onOpenQuickSale()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E5E5EA] dark:border-[#27272a] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[13px] font-semibold text-[#1C1C1E] dark:text-white transition"
            >
              <CreditCard className="w-4 h-4 text-[#E11D8F]" />
              <span>Venda rápida</span>
            </button>

            {/* + Novo Appointment Drawer Trigger (03-4-calendar.png) */}
            <button
              onClick={() => openNewDrawerAtSlot("11:30", "appointment")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1C1E] dark:bg-white hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 text-white dark:text-[#09090b] text-[13px] font-semibold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>

        {/* Mobile Header Layout (< md) */}
        <div className="md:hidden space-y-2.5">
          {/* Row 1: Month/Year + Date Picker + Hoje + Action Buttons (Fila de espera & Agendar) */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setDatePopoverOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[17px] font-bold text-[#1C1C1E] active:scale-95 transition"
              >
                <span>Outubro 2026</span>
                <ChevronDown className="w-4 h-4 text-[#6E6E73]" />
              </button>

              <button
                type="button"
                onClick={handleGoToToday}
                className="px-2.5 py-1 rounded-full border border-[#E5E5EA] text-[11.5px] font-semibold text-[#1C1C1E] active:scale-95 transition"
              >
                Hoje
              </button>

              {/* Mobile Popover Date Picker */}
              {datePopoverOpen && (
                <div className="absolute left-0 top-10 w-[min(340px,calc(100vw-2rem))] bg-white rounded-[20px] border border-[#E5E5EA] shadow-gg-modal p-4 z-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] font-semibold text-[#1C1C1E]">
                      Outubro 2026
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          onUpdateState((prev) => skipCalendarByWeeks(prev, -1))
                        }
                        className="p-1.5 rounded-full hover:bg-[#F5F5F7] text-[#6E6E73]"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          onUpdateState((prev) => skipCalendarByWeeks(prev, 1))
                        }
                        className="p-1.5 rounded-full hover:bg-[#F5F5F7] text-[#6E6E73]"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mini Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-[#8E8E93] mb-1.5">
                    <span>D</span>
                    <span>S</span>
                    <span>T</span>
                    <span>Q</span>
                    <span>Q</span>
                    <span>S</span>
                    <span>S</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[12px] mb-3">
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = i + 1;
                      const iso = `2026-10-${String(day).padStart(2, "0")}`;
                      const isSelected = selectedDateISO === iso;
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            onUpdateState((prev) => ({
                              ...prev,
                              calendarView: {
                                ...prev.calendarView,
                                selectedDateISO: iso,
                              },
                            }));
                            setDatePopoverOpen(false);
                          }}
                          className={`h-7 w-7 mx-auto rounded-full flex items-center justify-center font-medium transition ${
                            isSelected
                              ? "bg-[#1C1C1E] text-white"
                              : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Week Skip Pills */}
                  <div className="pt-2.5 border-t border-[#E5E5EA]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-2">
                      Avançar semanas (Retorno rápido)
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {[2, 3, 4, 5, 6, 7, 8].map((weeks) => (
                        <button
                          key={weeks}
                          onClick={() => {
                            onUpdateState((prev) => skipCalendarByWeeks(prev, weeks));
                            setDatePopoverOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-full bg-[#F5F5F7] hover:bg-[#1C1C1E] hover:text-white text-[11px] font-semibold text-[#1C1C1E] transition"
                        >
                          +{weeks} sem.
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions on Mobile (ALWAYS visible, never hidden) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Waitlist (Fila de espera) Trigger */}
              <button
                type="button"
                onClick={() => setWaitlistDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5E5EA] bg-white text-[12px] font-semibold text-[#1C1C1E] hover:bg-[#F5F5F7] active:scale-95 transition"
              >
                <Clock className="w-3.5 h-3.5 text-[#6E56CF]" />
                <span>Fila</span>
                {state.waitlist.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#6E56CF] text-white font-bold">
                    {state.waitlist.length}
                  </span>
                )}
              </button>

              {/* + Novo Agendamento Button */}
              <button
                type="button"
                onClick={() => openNewDrawerAtSlot("11:30", "appointment")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1C1C1E] text-white text-[12px] font-semibold active:scale-95 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agendar</span>
              </button>
            </div>
          </div>

          {/* Row 2: Week Strip (Dom .. Sáb) with clean 7-column grid */}
          <div className="grid grid-cols-7 gap-1 bg-[#F5F5F7] p-1 rounded-full text-center">
            {getWeekDays(selectedDateISO).map((wd) => {
              const active = selectedDateISO === wd.dateISO;
              return (
                <button
                  key={wd.dateISO}
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      calendarView: {
                        ...prev.calendarView,
                        selectedDateISO: wd.dateISO,
                      },
                    }))
                  }
                  className={`py-1 rounded-full text-[11px] font-semibold transition flex flex-col items-center justify-center ${
                    active
                      ? "bg-[#1C1C1E] text-white shadow-sm"
                      : "text-[#6E6E73] hover:text-[#1C1C1E]"
                  }`}
                >
                  <span className="text-[10px] uppercase">{wd.label}</span>
                  <span className="text-[12px] font-bold leading-tight">{wd.dayNum}</span>
                </button>
              );
            })}
          </div>

          {/* Row 3: Provider Filter + Day/Week Segmented Control */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <select
                aria-label="Filtrar por profissional"
                value={state.calendarView.selectedProviderId}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    calendarView: {
                      ...prev.calendarView,
                      selectedProviderId: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-1.5 rounded-full border border-[#E5E5EA] text-[12px] font-medium text-[#1C1C1E] bg-white focus:outline-none truncate"
              >
                <option value="all">Toda a equipe ({state.staff.length})</option>
                {state.staff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-[#F5F5F7] p-0.5 rounded-full shrink-0">
              <button
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    calendarView: { ...prev.calendarView, mode: "day" },
                  }))
                }
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                  viewMode === "day"
                    ? "bg-white text-[#1C1C1E] shadow-sm"
                    : "text-[#6E6E73]"
                }`}
              >
                Dia
              </button>
              <button
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    calendarView: { ...prev.calendarView, mode: "week" },
                  }))
                }
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                  viewMode === "week"
                    ? "bg-white text-[#1C1C1E] shadow-sm"
                    : "text-[#6E6E73]"
                }`}
              >
                Semana
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Week Mode 7-Day Overview Strip when viewMode === 'week' */}
      {viewMode === "week" && (
        <div className="px-6 py-3 bg-[#F5F3FF] border-b border-[#DDD6FE] grid grid-cols-7 gap-2">
          {getWeekDays(selectedDateISO).map((wd) => {
            const dayEvents = state.calendarEvents.filter(
              (ev) => ev.dateISO === wd.dateISO && ev.status !== "canceled"
            );
            const isSelected = selectedDateISO === wd.dateISO;
            return (
              <div
                key={wd.dateISO}
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    calendarView: {
                      ...prev.calendarView,
                      selectedDateISO: wd.dateISO,
                    },
                  }))
                }
                className={`p-2.5 rounded-[14px] border cursor-pointer transition ${
                  isSelected
                    ? "bg-white border-[#6E56CF] shadow-sm"
                    : "bg-white/70 border-[#E5E5EA] hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1C1E] mb-1">
                  <span>
                    {wd.label} {wd.dayNum}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold">
                    {dayEvents.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="text-[10px] truncate px-1.5 py-0.5 rounded bg-[#F5F5F7] text-[#1C1C1E] font-medium"
                    >
                      {ev.startTime} {ev.clientName}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Provider Subheader Bar / Legend */}
      <div className="px-3.5 sm:px-6 py-2 bg-[#FAFAFC] dark:bg-[#18181b] border-b border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-between gap-3 overflow-x-auto no-scrollbar text-[11px] sm:text-[12px]">
        <div className="flex items-center gap-2 shrink-0">
          {state.staff.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] shrink-0"
            >
              <span
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-[#1C1C1E]"
                style={{ backgroundColor: member.avatarColor }}
              >
                {member.initials}
              </span>
              <span className="font-semibold text-[#1C1C1E] dark:text-white">
                {member.fullName.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[#6E6E73] dark:text-[#a1a1aa] shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#E11D8F]" />
            <span>Tempo ativo</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border border-dashed border-[#1C1C1E] dark:border-white bg-[#F5F5F7] dark:bg-[#27272a]" />
            <span>Pausa/Encaixe</span>
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span>WhatsApp Sincronizado</span>
          </span>
        </div>
      </div>

      {/* Main Hourly Grid */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative">
        <div style={{ minHeight: `${HOURS.length * 80}px` }} className="relative">
          {/* Magenta Current Time Line (Dynamic real-time indicator) */}
          {isViewingToday && currentTime && (
            <div
              className="absolute left-0 right-0 z-20 flex items-center pointer-events-none transition-all duration-300"
              style={{
                top: `${Math.max(
                  0,
                  Math.min(
                    HOURS.length * 80,
                    ((currentTime.totalMinutes - START_HOUR * 60) / 60) * 80
                  )
                )}px`,
              }}
            >
              <div className="w-14 sm:w-20 pl-2 sm:pl-3 flex justify-end pr-2">
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-[#E11D8F] text-white text-[10px] sm:text-[11px] font-mono font-bold shadow-sm whitespace-nowrap">
                  {currentTime.formatted}
                </span>
              </div>
              <div className="flex-1 h-[2px] bg-[#E11D8F]" />
            </div>
          )}

          {/* Hourly Rows */}
          {HOURS.map((hour) => {
            const label = `${String(hour).padStart(2, "0")}:00`;
            return (
              <div
                key={hour}
                onClick={() => openNewDrawerAtSlot(label, "appointment")}
                className="h-[80px] border-b border-[#EFEFF4] dark:border-[#27272a] flex group hover:bg-[#FAFAFC] dark:hover:bg-[#18181b] cursor-pointer transition"
              >
                <div className="w-14 sm:w-20 pr-2 sm:pr-3 pt-2 text-right text-[11px] sm:text-[12px] font-mono text-[#8E8E93] dark:text-[#71717a] select-none border-r border-[#EFEFF4] dark:border-[#27272a]">
                  {label}
                </div>
                <div className="flex-1 relative px-3 sm:px-4 flex items-center">
                  <span className="opacity-0 group-hover:opacity-100 text-[11px] sm:text-[12px] font-medium text-[#6E56CF] dark:text-[#A494F7] transition">
                    + Clique para agendar às {label}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Rendered Appointment & Event Blocks */}
          {eventsForSelectedDate.map((ev) => {
            const startMin = parseTimeMinutes(ev.startTime);
            const endMin = parseTimeMinutes(ev.endTime);
            const topPx = Math.max(0, ((startMin - START_HOUR * 60) / 60) * 80);
            const heightPx = Math.max(58, ((endMin - startMin) / 60) * 80);
            const hasProcessingWindow = ev.processingDurationMinutes > 0;
            const resourcesUsed = state.resources.filter((r) =>
              ev.resourceIds.includes(r.id)
            );

            // Check if multiple providers have events at this exact overlapping slot
            const isAllProviders = state.calendarView.selectedProviderId === "all";
            const hasSimultaneousEvent =
              isAllProviders &&
              eventsForSelectedDate.some(
                (other) =>
                  other.id !== ev.id &&
                  Math.max(startMin, parseTimeMinutes(other.startTime)) <
                    Math.min(endMin, parseTimeMinutes(other.endTime))
              );

            const isSecondary = ev.providerId !== state.staff[0]?.id;

            return (
              <div
                key={ev.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(ev);
                }}
                style={{
                  top: `${topPx}px`,
                  height: `${heightPx}px`,
                  borderLeftColor: ev.calendarColor,
                  ...(hasSimultaneousEvent
                    ? {
                        left: isSecondary ? "calc(3.75rem + 50%)" : "3.75rem",
                        width: "calc(50% - 2.25rem)",
                      }
                    : {}),
                }}
                className={`absolute z-10 ${
                  hasSimultaneousEvent
                    ? ""
                    : "left-[3.75rem] sm:left-[5.5rem] right-2 sm:right-4"
                } rounded-[14px] bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] border-l-[5px] shadow-gg-card hover:shadow-md p-2.5 sm:p-3 cursor-pointer transition flex flex-col justify-between overflow-hidden`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                      <span className="text-[11.5px] sm:text-[12px] font-mono font-bold text-[#1C1C1E] dark:text-white shrink-0">
                        {ev.startTime} – {ev.endTime}
                      </span>
                      <span className="text-[12px] sm:text-[13px] font-bold text-[#1C1C1E] dark:text-white truncate">
                        · {ev.clientName}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] font-medium truncate mt-0.5">
                      {ev.serviceNames.join(" + ")} · {ev.providerName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {ev.depositPaid && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-[9px] sm:text-[10px] font-medium shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                        Sinal Pix
                      </span>
                    )}
                    {ev.whatsappClientReply === "1_confirmed" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-[9px] sm:text-[10px] font-medium shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6E56CF] ring-2 ring-[#6E56CF]/20" />
                        WhatsApp 1
                      </span>
                    )}
                    {ev.whatsappClientReply === "2_reschedule" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-[9px] sm:text-[10px] font-medium shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] ring-2 ring-[#D97706]/20" />
                        Reagendar
                      </span>
                    )}
                    {ev.status === "completed" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-[9px] sm:text-[10px] font-medium shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1C1C1E] ring-2 ring-[#1C1C1E]/20" />
                        Pago
                      </span>
                    )}
                  </div>
                </div>

                {/* Processing Time Segmented Bar Indicator (ADR-0002) */}
                {hasProcessingWindow && (
                  <div className="my-1 px-2 sm:px-2.5 py-1 rounded-lg bg-[#F5F3FF] border border-dashed border-[#6E56CF]/50 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 text-[10.5px] sm:text-[11px] text-[#6E56CF]">
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <Clock className="w-3 h-3 shrink-0" />
                      Pausa ({ev.processingDurationMinutes} min livres p/ encaixe)
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const gapStartHHMM = formatMinutesToHHMM(
                          startMin + ev.processingStartOffsetMinutes
                        );
                        openNewDrawerAtSlot(gapStartHHMM, "appointment");
                      }}
                      className="underline font-bold hover:text-[#1C1C1E] shrink-0"
                    >
                      + Encaixar
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 text-[10.5px] sm:text-[11px] text-[#6E6E73] pt-1 border-t border-[#F5F5F7]">
                  <span className="truncate flex-1 min-w-0">
                    {resourcesUsed.length > 0
                      ? `Recursos: ${resourcesUsed.map((r) => r.name).join(", ")}`
                      : ev.addressOrNotes || "1-Toque para Retorno ou Baixa"}
                  </span>
                  <span className="font-mono font-bold text-[#1C1C1E] shrink-0">
                    {formatBRL(ev.totalCents)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          DRAWER 1: LISTA DE ESPERA (03-3-calendar.png)
         ===================================================================== */}
      {waitlistDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex justify-end">
          <div className="w-full max-w-[430px] bg-white h-full shadow-gg-drawer flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-[#E5E5EA] flex items-center justify-between">
                <h2 className="text-[20px] font-bold text-[#1C1C1E]">
                  Lista de espera
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setWaitlistDrawerOpen(false);
                      openNewDrawerAtSlot("14:00", "waitlist_entry");
                    }}
                    title="Adicionar à lista de espera"
                    className="w-8 h-8 rounded-full border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] hover:bg-[#F5F5F7]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setWaitlistDrawerOpen(false)}
                    className="w-8 h-8 rounded-full border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] hover:bg-[#F5F5F7]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Pill + Provider Filter */}
              <div className="px-6 py-3 border-b border-[#EFEFF4] flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-[#F5F5F7] text-[12px] font-semibold text-[#1C1C1E]">
                  Hoje · Outubro 2026
                </span>
                <select
                  aria-label="Filtrar lista de espera por profissional"
                  value={waitlistProviderFilter}
                  onChange={(e) => setWaitlistProviderFilter(e.target.value)}
                  className="px-3 py-1 rounded-full border border-[#E5E5EA] text-[12px] font-medium text-[#1C1C1E] bg-white"
                >
                  <option value="all">Todos profissionais</option>
                  {state.staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {state.waitlist.filter(
                (w) =>
                  waitlistProviderFilter === "all" ||
                  w.providerId === waitlistProviderFilter
              ).length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5EA] text-[#1C1C1E] mx-auto flex items-center justify-center mb-3 shadow-2xs">
                    <CalendarIcon className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <h3 className="text-[15px] font-bold text-[#1C1C1E] mb-1">
                    Nenhuma solicitação na lista de espera
                  </h3>
                  <p className="text-[13px] text-[#6E6E73] mb-6">
                    Adicione clientes que aguardam vaga para preenchimento imediato em 1 toque.
                  </p>
                </div>
              ) : (
                state.waitlist
                  .filter(
                    (w) =>
                      waitlistProviderFilter === "all" ||
                      w.providerId === waitlistProviderFilter
                  )
                  .map((wl) => (
                    <div
                      key={wl.id}
                      className="p-4 rounded-[18px] border border-[#E5E5EA] bg-[#FAFAFC] space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-[15px] font-bold text-[#1C1C1E]">
                            {wl.clientName}
                          </h4>
                          <p className="text-[12px] text-[#6E6E73]">
                            {wl.serviceName} · com {wl.providerName}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-[#1C1C1E] text-white text-[11px] font-semibold shadow-sm">
                          {wl.preferredTimeWindow}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#6E6E73]">{wl.notes}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            onUpdateState((prev) =>
                              bookFromWaitlistEntry(prev, wl.id, "14:00")
                            );
                            setWaitlistDrawerOpen(false);
                          }}
                          className="flex-1 py-2 px-4 rounded-full bg-[#1C1C1E] text-white text-[12px] font-semibold hover:bg-[#2C2C2E] transition"
                        >
                          Agendar às 14:00 (1-Toque)
                        </button>
                      </div>
                    </div>
                  ))
              )}

              {/* Editorial Promo Card at Bottom of Waitlist Drawer (03-3-calendar.png) */}
              <div className="p-5 rounded-[20px] bg-[#F5F3FF] border border-[#DDD6FE] space-y-3">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#6E56CF] text-white text-[10px] font-bold uppercase tracking-wider">
                  Preencha horários vagos
                </span>
                <h4 className="text-[15px] font-bold text-[#1C1C1E]">
                  Adicione clientes à lista de espera e mantenha sua agenda lotada
                </h4>
                <p className="text-[12px] text-[#6E6E73]">
                  Clientes também podem entrar na lista direto pelo seu Site de Agendamento Online quando um dia estiver cheio.
                </p>
                <button
                  onClick={() => {
                    setWaitlistDrawerOpen(false);
                    openNewDrawerAtSlot("15:00", "waitlist_entry");
                  }}
                  className="w-full py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-semibold hover:bg-[#2C2C2E] transition"
                >
                  Adicionar à lista de espera
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DRAWER 2: NOVO AGENDAMENTO / EVENTO (03-4-calendar.png)
         ===================================================================== */}
      {newAppointmentDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex justify-end">
          <div className="w-full max-w-[460px] bg-white h-full shadow-gg-drawer flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#E5E5EA] flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-[#1C1C1E]">
                Novo agendamento
              </h2>
              <button
                onClick={() => setNewAppointmentDrawerOpen(false)}
                className="w-8 h-8 rounded-full border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body (03-4-calendar.png) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Conflict Error Banner */}
              {conflictError && (
                <div className="p-4 rounded-[16px] bg-[#FEE2E2] border border-[#DC2626]/30 flex items-start gap-3 text-[#DC2626]">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-[13px]">
                    <p className="font-bold">Bloqueio de Conflito Detectado</p>
                    <p>{conflictError}</p>
                  </div>
                </div>
              )}

              {/* Event Type Selector */}
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1.5">
                  Tipo de evento
                </label>
                <select
                  value={eventType}
                  onChange={(e) =>
                    setEventType(e.target.value as CalendarEventType)
                  }
                  className="w-full px-4 py-3 rounded-[14px] border border-[#E5E5EA] text-[14px] font-semibold text-[#1C1C1E] bg-white"
                >
                  <option value="appointment">Agendamento (Appointment)</option>
                  <option value="personal_block">
                    Evento pessoal / Bloqueio
                  </option>
                  <option value="working_hours">Horário de expediente</option>
                  <option value="waitlist_entry">
                    Entrada na lista de espera
                  </option>
                </select>
              </div>

              {/* Service Provider Card */}
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1.5">
                  Profissional
                </label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full px-4 py-3 rounded-[14px] border border-[#E5E5EA] text-[14px] font-semibold text-[#1C1C1E] bg-white"
                >
                  {state.staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.initials} · {st.fullName} ({st.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Selector + Inline Client Creation */}
              {eventType !== "personal_block" &&
                eventType !== "working_hours" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] font-semibold text-[#6E6E73]">
                        Cliente
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowInlineNewClient((v) => !v)}
                        className="text-[12px] font-semibold text-[#6E56CF] hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {showInlineNewClient
                          ? "Selecionar cliente existente"
                          : "+ Adicionar Novo Cliente"}
                      </button>
                    </div>

                    {showInlineNewClient ? (
                      <div className="p-4 rounded-[16px] bg-[#F5F5F7] space-y-2.5">
                        <input
                          type="text"
                          placeholder="Nome completo do cliente"
                          value={inlineClientName}
                          onChange={(e) => setInlineClientName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E5EA] bg-white text-[13px]"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="WhatsApp (11) 9..."
                            value={inlineClientPhone}
                            onChange={(e) =>
                              setInlineClientPhone(e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E5EA] bg-white text-[13px]"
                          />
                          <input
                            type="email"
                            placeholder="E-mail"
                            value={inlineClientEmail}
                            onChange={(e) =>
                              setInlineClientEmail(e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E5EA] bg-white text-[13px]"
                          />
                        </div>
                      </div>
                    ) : (
                      <select
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full px-4 py-3 rounded-[14px] border border-[#E5E5EA] text-[14px] font-medium text-[#1C1C1E] bg-white"
                      >
                        {state.clients.map((cli) => (
                          <option key={cli.id} value={cli.id}>
                            {cli.fullName} ({cli.phone})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

              {/* Services Multi-Select + Inline Service Creation */}
              {eventType !== "personal_block" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-semibold text-[#6E6E73]">
                      Serviços
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowInlineNewService((v) => !v)}
                      className="text-[12px] font-semibold text-[#6E56CF] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {showInlineNewService
                        ? "Fechar novo serviço"
                        : "+ Adicionar novo serviço"}
                    </button>
                  </div>

                  {showInlineNewService && (
                    <div className="p-3.5 mb-2.5 rounded-[14px] bg-[#F5F5F7] space-y-2">
                      <input
                        type="text"
                        placeholder="Nome do novo serviço"
                        value={inlineServiceName}
                        onChange={(e) => setInlineServiceName(e.target.value)}
                        className="w-full px-3 py-2 rounded-[10px] border border-[#E5E5EA] bg-white text-[13px]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Preço (R$)"
                          value={inlineServicePriceBRL}
                          onChange={(e) =>
                            setInlineServicePriceBRL(e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-[10px] border border-[#E5E5EA] bg-white text-[13px] font-mono"
                        />
                        <input
                          type="number"
                          placeholder="Duração (min)"
                          value={inlineServiceDurationMin}
                          onChange={(e) =>
                            setInlineServiceDurationMin(e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-[10px] border border-[#E5E5EA] bg-white text-[13px] font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!inlineServiceName.trim()) return;
                          const priceCents =
                            Math.max(
                              0,
                              parseInt(inlineServicePriceBRL || "150", 10)
                            ) * 100;
                          const durationMinutes = Math.max(
                            15,
                            parseInt(inlineServiceDurationMin || "45", 10)
                          );
                          const newId = `srv-inline-${Date.now()}`;
                          onUpdateState((prev) =>
                            saveCatalogService(prev, {
                              id: newId,
                              name: inlineServiceName.trim(),
                              description: "Criado inline na Agenda.",
                              category: "Geral",
                              calendarColor: "#6E56CF",
                              onlineBookingEnabled: true,
                              priceType: "fixed",
                              priceCents,
                              requireDeposit: true,
                              depositCents: Math.round(priceCents * 0.3),
                              durationMinutes,
                              processingTimeEnabled: false,
                              processingStartOffsetMinutes: 0,
                              processingDurationMinutes: 0,
                              blockTimeEnabled: false,
                              blockAfterMinutes: 0,
                              requiredResourceIds: [],
                              options: [],
                              addOns: [],
                            })
                          );
                          setSelectedServiceIds((prev) => [...prev, newId]);
                          setInlineServiceName("");
                          setShowInlineNewService(false);
                        }}
                        className="w-full py-2 rounded-full bg-[#1C1C1E] text-white text-[12px] font-semibold"
                      >
                        Salvar e selecionar serviço
                      </button>
                    </div>
                  )}

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {state.services.map((srv) => {
                      const checked = selectedServiceIds.includes(srv.id);
                      const resNames = state.resources
                        .filter((r) => srv.requiredResourceIds.includes(r.id))
                        .map((r) => r.name);
                      return (
                        <label
                          key={srv.id}
                          className={`flex items-center justify-between p-3 rounded-[14px] border cursor-pointer transition ${
                            checked
                              ? "border-2 border-[#1C1C1E] bg-[#F5F5F7] shadow-sm"
                              : "border-[#E5E5EA] hover:bg-[#FAFAFC]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedServiceIds((prev) =>
                                  checked
                                    ? prev.filter((id) => id !== srv.id)
                                    : [...prev, srv.id]
                                )
                              }
                              className="rounded text-[#6E56CF]"
                            />
                            <div>
                              <p className="text-[13px] font-semibold text-[#1C1C1E]">
                                {srv.name}
                              </p>
                              <p className="text-[11px] text-[#6E6E73]">
                                {srv.durationMinutes} min
                                {srv.processingTimeEnabled
                                  ? ` (inclui ${srv.processingDurationMinutes}m pausa)`
                                  : ""}
                                {resNames.length > 0
                                  ? ` · Recursos: ${resNames.join(", ")}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <span className="text-[13px] font-mono font-bold text-[#1C1C1E]">
                            {formatBRL(srv.priceCents)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1.5">
                    Data
                  </label>
                  <input
                    type="date"
                    value={eventDateISO}
                    onChange={(e) => setEventDateISO(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[14px] border border-[#E5E5EA] text-[13px] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1.5">
                    Horário ({startTime} – {computedEndTime})
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[14px] border border-[#E5E5EA] text-[13px] font-mono font-medium"
                  />
                </div>
              </div>

              {/* Repeat Toggle & Deposit Toggle */}
              <div className="space-y-3 pt-1">
                <label className="flex items-center justify-between p-3.5 rounded-[14px] border border-[#E5E5EA] cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Repeat className="w-4 h-4 text-[#6E6E73]" />
                    <span className="text-[13px] font-medium text-[#1C1C1E]">
                      Repetir agendamento (Recorrente)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRepeating}
                    onChange={(e) => setIsRepeating(e.target.checked)}
                    className="w-4 h-4 accent-[#6E56CF]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-[14px] border border-[#E5E5EA] cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4 text-[#6E56CF]" />
                    <div>
                      <p className="text-[13px] font-semibold text-[#1C1C1E]">
                        Cobrar sinal (Taxa de reserva Pix)
                      </p>
                      <p className="text-[11px] text-[#6E6E73]">
                        Proteção anti-no-show automática
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={collectDeposit}
                    onChange={(e) => setCollectDeposit(e.target.checked)}
                    className="w-4 h-4 accent-[#6E56CF]"
                  />
                </label>
              </div>

              {/* Address / Notes */}
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1.5">
                  Endereço ou Observações do Atendimento
                </label>
                <textarea
                  rows={2}
                  placeholder="Adicione observações, fórmula ou link..."
                  value={addressOrNotes}
                  onChange={(e) => setAddressOrNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[14px] border border-[#E5E5EA] text-[13px]"
                />
              </div>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="px-6 py-4 border-t border-[#E5E5EA] bg-[#FAFAFC] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                  Total estimado
                </p>
                <p className="text-[20px] font-mono font-bold text-[#1C1C1E]">
                  {formatBRL(computedTotalCents)}
                </p>
              </div>
              <button
                onClick={handleCreateEvent}
                className="px-7 py-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[14px] font-semibold transition"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DRAWER 3: 1-TAP CHECKOUT, RETORNO & WHATSAPP 2-WAY (Selected Event)
         ===================================================================== */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex justify-end">
          <div className="w-full max-w-[440px] bg-white h-full shadow-gg-drawer flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="px-6 py-5 border-b border-[#E5E5EA] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E56CF]">
                  Atendimento · {selectedEvent.dateISO}
                </span>
                <h2 className="text-[20px] font-bold text-[#1C1C1E]">
                  {selectedEvent.clientName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-full border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Summary Card */}
              <div className="p-4 rounded-[18px] bg-[#F5F5F7] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-mono font-bold text-[#1C1C1E]">
                    {selectedEvent.startTime} – {selectedEvent.endTime}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-bold text-[#1C1C1E] border border-[#E5E5EA]">
                    Status: {selectedEvent.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-[14px] font-semibold text-[#1C1C1E]">
                  {selectedEvent.serviceNames.join(" + ")}
                </p>
                <p className="text-[12px] text-[#6E6E73]">
                  Profissional: {selectedEvent.providerName}
                </p>
                <div className="pt-2 border-t border-[#E5E5EA] flex items-center justify-between">
                  <span className="text-[12px] text-[#6E6E73]">
                    Sinal Pix ({formatBRL(selectedEvent.depositCents)}):{" "}
                    <strong>
                      {selectedEvent.depositPaid ? "Pago" : "Pendente"}
                    </strong>
                  </span>
                  <span className="text-[16px] font-mono font-bold text-[#1C1C1E]">
                    {formatBRL(selectedEvent.totalCents)}
                  </span>
                </div>
              </div>

              {/* 1-Tap Rebooking (Retorno em 1 Toque) */}
              <div className="p-4 rounded-[18px] border border-[#E5E5EA] space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4 text-[#6E56CF]" />
                  <h3 className="text-[14px] font-bold text-[#1C1C1E]">
                    Reagendamento de Retorno em 1 Toque
                  </h3>
                </div>
                <p className="text-[12px] text-[#6E6E73]">
                  Garanta a retenção agendando o próximo retorno imediatamente:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45].map((days) => (
                    <button
                      key={days}
                      onClick={() => {
                        onUpdateState((prev) =>
                          rebookAppointmentOneTap(prev, selectedEvent.id, days)
                        );
                        setSelectedEvent(null);
                      }}
                      className="py-2 px-3 rounded-full bg-[#F5F5F7] hover:bg-[#1C1C1E] hover:text-white text-[12px] font-bold text-[#1C1C1E] transition"
                    >
                      +{days} dias
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp 2-Way Sync Simulator */}
              <div className="p-4 rounded-[18px] border border-[#E5E5EA] space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#16A34A]" />
                  <h3 className="text-[14px] font-bold text-[#1C1C1E]">
                    Automação WhatsApp 2-Way Sync
                  </h3>
                </div>
                <p className="text-[12px] text-[#6E6E73]">
                  Simule a resposta do cliente no WhatsApp para atualizar o card em tempo real:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onUpdateState((prev) =>
                        processWhatsappInboundReply(
                          prev,
                          selectedEvent.id,
                          "1_confirmed"
                        )
                      );
                      setSelectedEvent(null);
                    }}
                    className="py-2.5 px-3 rounded-full bg-[#16A34A] text-white text-[12px] font-bold shadow-sm hover:opacity-95 transition"
                  >
                    Respondeu &ldquo;1 Confirmar&rdquo;
                  </button>
                  <button
                    onClick={() => {
                      onUpdateState((prev) =>
                        processWhatsappInboundReply(
                          prev,
                          selectedEvent.id,
                          "2_reschedule"
                        )
                      );
                      setSelectedEvent(null);
                    }}
                    className="py-2.5 px-3 rounded-full bg-[#D97706] text-white text-[12px] font-bold shadow-sm hover:opacity-95 transition"
                  >
                    Respondeu &ldquo;2 Reagendar&rdquo;
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom 1-Tap Checkout Action */}
            <div className="p-6 border-t border-[#E5E5EA] bg-[#FAFAFC] space-y-2.5">
              <button
                onClick={() => {
                  onUpdateState((prev) =>
                    executeQuickSaleCheckout(prev, {
                      appointmentId: selectedEvent.id,
                      clientId:
                        selectedEvent.clientId ?? prev.clients[0]?.id ?? "",
                      providerId: selectedEvent.providerId,
                      itemsSummary: selectedEvent.serviceNames.join(" + "),
                      amountCents: selectedEvent.totalCents,
                      tipCents: 0,
                      paymentMethod: "Pix",
                    })
                  );
                  setSelectedEvent(null);
                }}
                className="w-full py-3.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Dar Baixa 1-Toque (Pix {formatBRL(selectedEvent.totalCents)})</span>
              </button>
              <button
                onClick={() => {
                  const ev = selectedEvent;
                  setSelectedEvent(null);
                  onOpenQuickSale(ev);
                }}
                className="w-full py-2.5 rounded-full border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] text-[#1C1C1E] text-[13px] font-semibold transition"
              >
                Abrir no PDV (Incluir Gorjeta, Pacote ou Vale-Presente)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
