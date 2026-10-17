"use client";

import React, { useState } from "react";
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
  parseTimeMinutes,
  formatMinutesToHHMM,
  skipCalendarByWeeks,
  validateAndCreateCalendarEvent,
  bookFromWaitlistEntry,
  rebookAppointmentOneTap,
  processWhatsappInboundReply,
  executeQuickSaleCheckout,
} from "@/lib/glossgenius-store";

interface CalendarViewProps {
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
  onOpenQuickSale: (prefillAppointment?: CalendarEventItem) => void;
}

const HOURS = Array.from({ length: 13 }, (_, idx) => idx + 8); // 08:00 .. 20:00

const WEEK_DAYS = [
  { label: "Dom", dayNum: 11, dateISO: "2026-10-11" },
  { label: "Seg", dayNum: 12, dateISO: "2026-10-12" },
  { label: "Ter", dayNum: 13, dateISO: "2026-10-13" },
  { label: "Qua", dayNum: 14, dateISO: "2026-10-14" },
  { label: "Qui", dayNum: 15, dateISO: "2026-10-15" },
  { label: "Sex", dayNum: 16, dateISO: "2026-10-16" },
  { label: "Sáb", dayNum: 17, dateISO: "2026-10-17" },
];

export function CalendarView({
  state,
  onUpdateState,
  onOpenQuickSale,
}: CalendarViewProps) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [waitlistDrawerOpen, setWaitlistDrawerOpen] = useState(false);
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

  const selectedDateISO = state.calendarView.selectedDateISO;
  const viewMode = state.calendarView.mode;

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
              email: inlineClientEmail.trim() || "cliente@aurastudio.com.br",
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

    onUpdateState(() => result.state);
    setNewAppointmentDrawerOpen(false);
    setShowInlineNewClient(false);
    setInlineClientName("");
    setInlineClientPhone("");
    setInlineClientEmail("");
    setAddressOrNotes("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-1rem)] bg-white overflow-hidden">
      {/* Top Calendar Header (03-1-calendar.png) */}
      <header className="px-6 py-4 border-b border-[#E5E5EA] flex flex-wrap items-center justify-between gap-4 bg-white z-20">
        {/* Left: Month/Year + Popover Date Picker (03-2-calendar.png) */}
        <div className="relative flex items-center gap-3">
          <button
            onClick={() => setDatePopoverOpen((v) => !v)}
            className="flex items-center gap-2 text-[22px] font-semibold text-[#1C1C1E] hover:opacity-80 transition"
          >
            <span>Outubro 2026</span>
            <ChevronDown className="w-5 h-5 text-[#6E6E73]" />
          </button>

          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                calendarView: {
                  ...prev.calendarView,
                  selectedDateISO: "2026-10-17",
                },
              }))
            }
            className="px-3.5 py-1.5 rounded-full border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition"
          >
            Hoje
          </button>

          {/* Popover Date Picker with +2 to +8 weeks jump (03-2-calendar.png) */}
          {datePopoverOpen && (
            <div className="absolute left-0 top-12 w-[340px] bg-white rounded-[20px] border border-[#E5E5EA] shadow-gg-modal p-5 z-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[15px] font-semibold text-[#1C1C1E]">
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
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#8E8E93] mb-2">
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
                          ? "bg-[#1C1C1E] text-white"
                          : "text-[#1C1C1E] hover:bg-[#F5F5F7]"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Quick Week Skip Pills (+2 to +8 weeks — 03-2-calendar.png) */}
              <div className="pt-3 border-t border-[#E5E5EA]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-2.5">
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
                      className="px-3 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-[#ECE9FE] hover:text-[#6E56CF] text-[12px] font-semibold text-[#1C1C1E] transition"
                    >
                      +{weeks} sem.
                    </button>
                  ))}
                </div>
                <p className="mt-2.5 text-[11px] text-[#6E6E73]">
                  Data selecionada:{" "}
                  <strong className="text-[#1C1C1E]">{selectedDateISO}</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Center: Week Strip (Dom 11 .. Sáb 17) */}
        <div className="flex items-center gap-1.5 bg-[#F5F5F7] px-2 py-1.5 rounded-full">
          {WEEK_DAYS.map((wd) => {
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
                    ? "bg-[#1C1C1E] text-white shadow-sm"
                    : "text-[#6E6E73] hover:text-[#1C1C1E]"
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
            className="px-3.5 py-2 rounded-full border border-[#E5E5EA] text-[13px] font-medium text-[#1C1C1E] bg-white focus:outline-none"
          >
            <option value="all">Toda a equipe ({state.staff.length})</option>
            {state.staff.map((st) => (
              <option key={st.id} value={st.id}>
                {st.fullName}
              </option>
            ))}
          </select>

          {/* Day / Week Segmented Switch */}
          <div className="flex items-center bg-[#F5F5F7] p-1 rounded-full">
            <button
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  calendarView: { ...prev.calendarView, mode: "day" },
                }))
              }
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition ${
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
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition ${
                viewMode === "week"
                  ? "bg-white text-[#1C1C1E] shadow-sm"
                  : "text-[#6E6E73]"
              }`}
            >
              Semana
            </button>
          </div>

          {/* Waitlist Drawer Trigger (03-3-calendar.png) */}
          <button
            onClick={() => setWaitlistDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[13px] font-semibold text-[#1C1C1E] transition"
          >
            <Clock className="w-4 h-4 text-[#6E56CF]" />
            <span>Lista de espera</span>
            {state.waitlist.length > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-[#ECE9FE] text-[#6E56CF] font-bold">
                {state.waitlist.length}
              </span>
            )}
          </button>

          {/* + Novo Appointment Drawer Trigger (03-4-calendar.png) */}
          <button
            onClick={() => openNewDrawerAtSlot("11:30", "appointment")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[13px] font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo</span>
          </button>
        </div>
      </header>

      {/* Provider Subheader Bar */}
      <div className="px-6 py-2.5 bg-[#FAFAFC] border-b border-[#E5E5EA] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {state.staff.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E5EA] text-[12px]"
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-[#1C1C1E]"
                style={{ backgroundColor: member.avatarColor }}
              >
                {member.initials}
              </span>
              <span className="font-semibold text-[#1C1C1E]">
                {member.fullName}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-[12px] text-[#6E6E73]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E11D8F]" />
            Tempo ativo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-[#6E56CF] bg-[#ECE9FE]" />
            Janela de Pausa / Processamento (Permite Encaixe)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            WhatsApp 2-Way Sincronizado
          </span>
        </div>
      </div>

      {/* Main Hourly Grid */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="min-h-[1040px] relative">
          {/* Magenta Current Time Line (9:15 indicator from 03-1-calendar.png) */}
          <div
            className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
            style={{ top: `${((9 * 60 + 15 - 8 * 60) / 60) * 80}px` }}
          >
            <div className="w-20 pl-3 flex justify-end pr-2">
              <span className="px-2 py-0.5 rounded-full bg-[#E11D8F] text-white text-[11px] font-mono font-bold shadow-sm">
                9:15
              </span>
            </div>
            <div className="flex-1 h-[2px] bg-[#E11D8F]" />
          </div>

          {/* Hourly Rows */}
          {HOURS.map((hour) => {
            const label = `${String(hour).padStart(2, "0")}:00`;
            return (
              <div
                key={hour}
                onClick={() => openNewDrawerAtSlot(label, "appointment")}
                className="h-[80px] border-b border-[#EFEFF4] flex group hover:bg-[#FAFAFC] cursor-pointer transition"
              >
                <div className="w-20 pr-3 pt-2 text-right text-[12px] font-mono text-[#8E8E93] select-none border-r border-[#EFEFF4]">
                  {label}
                </div>
                <div className="flex-1 relative px-4 flex items-center">
                  <span className="opacity-0 group-hover:opacity-100 text-[12px] font-medium text-[#6E56CF] transition">
                    + Clique para agendar às {label}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Rendered Appointment & Event Blocks */}
          {eventsForSelectedDate.map((ev, index) => {
            const startMin = parseTimeMinutes(ev.startTime);
            const endMin = parseTimeMinutes(ev.endTime);
            const topPx = Math.max(0, ((startMin - 8 * 60) / 60) * 80);
            const heightPx = Math.max(58, ((endMin - startMin) / 60) * 80);
            const hasProcessingWindow = ev.processingDurationMinutes > 0;
            const resourcesUsed = state.resources.filter((r) =>
              ev.resourceIds.includes(r.id)
            );

            // Offset horizontal position slightly if overlapping processing fit
            const isSecondaryProvider = ev.providerId !== state.staff[0]?.id;
            const leftStyle = isSecondaryProvider ? "calc(5rem + 48%)" : "5.75rem";
            const widthStyle = isSecondaryProvider
              ? "calc(48% - 1.5rem)"
              : "calc(46% - 1rem)";

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
                  left: leftStyle,
                  width: widthStyle,
                  borderLeftColor: ev.calendarColor,
                }}
                className="absolute z-10 rounded-[14px] bg-white border border-[#E5E5EA] border-l-[5px] shadow-gg-card hover:shadow-md p-3 cursor-pointer transition flex flex-col justify-between overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[12px] font-mono font-bold text-[#1C1C1E]">
                        {ev.startTime} – {ev.endTime}
                      </span>
                      <span className="text-[13px] font-bold text-[#1C1C1E]">
                        · {ev.clientName}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#6E6E73] font-medium truncate">
                      {ev.serviceNames.join(" + ")} · {ev.providerName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {ev.depositPaid && (
                      <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[10px] font-bold">
                        Sinal Pix ✓
                      </span>
                    )}
                    {ev.whatsappClientReply === "1_confirmed" && (
                      <span className="px-2 py-0.5 rounded-full bg-[#ECE9FE] text-[#6E56CF] text-[10px] font-bold">
                        WhatsApp 1 ✓
                      </span>
                    )}
                    {ev.whatsappClientReply === "2_reschedule" && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] text-[10px] font-bold">
                        Pediu Reagendar
                      </span>
                    )}
                    {ev.status === "completed" && (
                      <span className="px-2 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold">
                        Pago ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Processing Time Segmented Bar Indicator (ADR-0002) */}
                {hasProcessingWindow && (
                  <div className="my-1 px-2.5 py-1 rounded-lg bg-[#F5F3FF] border border-dashed border-[#6E56CF]/50 flex items-center justify-between text-[11px] text-[#6E56CF]">
                    <span>
                      ⏳ Pausa de Processamento ({ev.processingDurationMinutes} min livres p/ encaixe)
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const gapStartHHMM = formatMinutesToHHMM(
                          startMin + ev.processingStartOffsetMinutes
                        );
                        openNewDrawerAtSlot(gapStartHHMM, "appointment");
                      }}
                      className="underline font-bold hover:text-[#1C1C1E]"
                    >
                      + Encaixar cliente
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-[#6E6E73] pt-1 border-t border-[#F5F5F7]">
                  <span className="truncate">
                    {resourcesUsed.length > 0
                      ? `🔒 Recursos: ${resourcesUsed.map((r) => r.name).join(", ")}`
                      : ev.addressOrNotes || "Toque para Checkout 1-Toque ou Retorno"}
                  </span>
                  <span className="font-mono font-bold text-[#1C1C1E]">
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

              {/* Filter Pill */}
              <div className="px-6 py-3 border-b border-[#EFEFF4] flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#F5F5F7] text-[12px] font-semibold text-[#1C1C1E]">
                  Hoje · Outubro 2026
                </span>
                <span className="text-[12px] text-[#6E6E73]">
                  {state.waitlist.length} solicitação(ões)
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {state.waitlist.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-[#ECE9FE] text-[#6E56CF] mx-auto flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#1C1C1E] mb-1">
                    Nenhuma solicitação na lista de espera
                  </h3>
                  <p className="text-[13px] text-[#6E6E73] mb-6">
                    Adicione clientes que aguardam vaga para preenchimento imediato em 1 toque.
                  </p>
                </div>
              ) : (
                state.waitlist.map((wl) => (
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
                      <span className="px-2.5 py-1 rounded-full bg-[#ECE9FE] text-[#6E56CF] text-[11px] font-bold">
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
                          : "+ Criar novo cliente"}
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

              {/* Services Multi-Select */}
              {eventType !== "personal_block" && (
                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1.5">
                    Serviços
                  </label>
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
                              ? "border-[#6E56CF] bg-[#ECE9FE]/50"
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
                                  ? ` · 🔒 ${resNames.join(", ")}`
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
                      {selectedEvent.depositPaid ? "Pago ✓" : "Pendente"}
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
                      className="py-2 px-3 rounded-full bg-[#F5F5F7] hover:bg-[#ECE9FE] hover:text-[#6E56CF] text-[12px] font-bold text-[#1C1C1E] transition"
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
                    className="py-2 px-3 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[12px] font-bold hover:opacity-90 transition"
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
                    className="py-2 px-3 rounded-full bg-[#FEF3C7] text-[#D97706] text-[12px] font-bold hover:opacity-90 transition"
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
