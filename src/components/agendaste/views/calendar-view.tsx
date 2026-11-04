"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  FileText,
  Pencil,
  Settings,
  EllipsisVertical,
  GripVertical,
  Trash2,
  ArrowLeft,
  Phone,
  Mail,
} from "lucide-react";
import {
  StudioState,
  CalendarEventItem,
  CalendarEventType,
  DayBusinessHours,
  WaitlistEntryItem,
  formatBRL,
  formatDateBR,
  parseTimeMinutes,
  formatMinutesToHHMM,
  skipCalendarByWeeks,
  validateAndCreateCalendarEvent,
  addWaitlistEntry,
  updateWaitlistEntry,
  deleteWaitlistEntry,
  isWaitlistEntryExpired,
  bookFromWaitlistEntry,
  rebookAppointmentOneTap,
  rescheduleCalendarEvent,
  deleteCalendarEvent,
  processWhatsappInboundReply,
  toggleAppointmentReceptionArrival,
  executeQuickSaleCheckout,
  saveCatalogService,
  getTodayDateISO,
  getPendingCheckoutAppointments,
  addDaysToDateISO,
  checkCalendarSlotConflict,
} from "@/lib/agendaste-store";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { EditorialDatePicker } from "@/components/ui/editorial-date-picker";

interface CalendarViewProps {
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
  onOpenQuickSale: (prefillAppointment?: CalendarEventItem) => void;
}

const DEFAULT_START_HOUR = 7; // Default 07:00 (7 AM) as per luxury salon reference
const HOUR_HEIGHT = 72; // px per hour slot

function formatHour12(hour: number): string {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}

function formatTime12h(hours: number, minutes: number): string {
  const ampm = hours >= 12 ? "pm" : "am";
  const displayH = hours % 12 === 0 ? 12 : hours % 12;
  const displayM = minutes === 0 ? "00" : String(minutes).padStart(2, "0");
  return `${displayH}:${displayM}${ampm}`;
}

function formatDurationLabel(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 min";
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) {
    return `${mins} mins`;
  }
  if (mins === 0) {
    return hours === 1 ? "1 hr" : `${hours} hrs`;
  }
  return `${hours} hr${hours > 1 ? "s" : ""} ${mins} mins`;
}

function getDayOfWeek(dateISO: string): number {
  const parts = dateISO.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.getDay();
}

function getDayWorkingHours(
  businessHours: DayBusinessHours[] | undefined,
  dateISO: string
): { isOpen: boolean; startMinutes: number; endMinutes: number } {
  const dow = getDayOfWeek(dateISO);
  const schedule = businessHours?.find((h) => h.dayOfWeek === dow);
  if (!schedule) {
    if (dow === 0) return { isOpen: false, startMinutes: 8 * 60, endMinutes: 17 * 60 };
    return { isOpen: true, startMinutes: 8 * 60, endMinutes: 17 * 60 };
  }
  return {
    isOpen: schedule.isOpen,
    startMinutes: parseTimeMinutes(schedule.startTime || "08:00"),
    endMinutes: parseTimeMinutes(schedule.endTime || "17:00"),
  };
}

function getWeekDays(selectedDateISO: string) {
  const parts = selectedDateISO.split("-").map(Number);
  const baseDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayOfWeek = baseDate.getDay();
  const sunday = new Date(baseDate);
  sunday.setDate(baseDate.getDate() - dayOfWeek);

  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const labelsFull = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return {
      label: labels[i],
      labelFull: labelsFull[i],
      dayNum: d.getDate(),
      dateISO: `${year}-${month}-${day}`,
    };
  });
}

function formatNavDate(dateISO: string): string {
  const parts = dateISO.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

function getMonthShort(dateISO: string): string {
  const parts = dateISO.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return months[d.getMonth()];
}

export function CalendarView({
  state,
  onUpdateState,
  onOpenQuickSale,
}: CalendarViewProps) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [providerFilterDropdownOpen, setProviderFilterDropdownOpen] =
    useState(false);
  const [viewModeDropdownOpen, setViewModeDropdownOpen] = useState(false);
  const [calendarSettingsDrawerOpen, setCalendarSettingsDrawerOpen] =
    useState(false);
  const [waitlistDrawerOpen, setWaitlistDrawerOpen] = useState(false);
  const [waitlistProviderFilter, setWaitlistProviderFilter] =
    useState<string>("all");
  const [newAppointmentDrawerOpen, setNewAppointmentDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(
    null
  );
  const [pendingCheckoutPopoverOpen, setPendingCheckoutPopoverOpen] =
    useState(false);

  const todayDateISO = getTodayDateISO();

  const visibleStartHour =
    state.calendarView?.visibleStartHour ?? DEFAULT_START_HOUR;
  const visibleEndHour = state.calendarView?.visibleEndHour ?? 20;
  const multiServiceDisplayMode =
    state.calendarView?.multiServiceDisplayMode ?? "multiple_cards";

  const calendarHours = useMemo(() => {
    const start = Math.min(visibleStartHour, visibleEndHour);
    const end = Math.max(visibleStartHour, visibleEndHour);
    return Array.from({ length: end - start + 1 }, (_, idx) => idx + start);
  }, [visibleStartHour, visibleEndHour]);

  // Mantém selectedEvent sincronizado quando o estado dos agendamentos é atualizado
  useEffect(() => {
    if (!selectedEvent) return;
    const fresh = state.calendarEvents.find((e) => e.id === selectedEvent.id);
    if (fresh) {
      if (
        fresh.providerId !== selectedEvent.providerId ||
        fresh.providerName !== selectedEvent.providerName ||
        fresh.status !== selectedEvent.status ||
        fresh.dateISO !== selectedEvent.dateISO ||
        fresh.startTime !== selectedEvent.startTime ||
        fresh.endTime !== selectedEvent.endTime ||
        fresh.whatsappClientReply !== selectedEvent.whatsappClientReply
      ) {
        setSelectedEvent(fresh);
      }
    }
  }, [
    state.calendarEvents,
    selectedEvent?.id,
    selectedEvent?.providerId,
    selectedEvent?.providerName,
    selectedEvent?.status,
    selectedEvent?.dateISO,
    selectedEvent?.startTime,
    selectedEvent?.endTime,
    selectedEvent?.whatsappClientReply,
  ]);

  // Reschedule Modal State & Mechanics
  const [rescheduleEvent, setRescheduleEvent] = useState<CalendarEventItem | null>(null);
  const [rescheduleDateISO, setRescheduleDateISO] = useState<string>("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState<string>("");
  const [rescheduleDurationMinutes, setRescheduleDurationMinutes] = useState<number>(60);
  const [rescheduleProviderId, setRescheduleProviderId] = useState<string>("");
  const [rescheduleNotifyWhatsapp, setRescheduleNotifyWhatsapp] = useState<boolean>(true);
  const [rescheduleConflictWarning, setRescheduleConflictWarning] = useState<string | null>(null);

  const handleOpenReschedule = (event: CalendarEventItem) => {
    setRescheduleEvent(event);
    setRescheduleDateISO(event.dateISO);
    setRescheduleStartTime(event.startTime);
    const duration = event.activeDurationMinutes || 60;
    setRescheduleDurationMinutes(duration);
    setRescheduleProviderId(event.providerId);
    setRescheduleConflictWarning(null);
    setRescheduleNotifyWhatsapp(true);
  };

  const computedRescheduleEndTime = useMemo(() => {
    if (!rescheduleStartTime) return "";
    const startMin = parseTimeMinutes(rescheduleStartTime);
    const endMin = startMin + rescheduleDurationMinutes;
    return formatMinutesToHHMM(endMin);
  }, [rescheduleStartTime, rescheduleDurationMinutes]);

  useEffect(() => {
    if (!rescheduleEvent || !rescheduleDateISO || !rescheduleStartTime) {
      setRescheduleConflictWarning(null);
      return;
    }
    const startMin = parseTimeMinutes(rescheduleStartTime);
    const endMin = startMin + rescheduleDurationMinutes;
    const provider =
      state.staff.find((s) => s.id === rescheduleProviderId) ||
      state.staff.find(
        (s) =>
          s.fullName.trim().toLowerCase() ===
          rescheduleProviderId.trim().toLowerCase()
      ) ||
      state.staff[0];

    if (!provider) return;

    const conflict = checkCalendarSlotConflict(state, {
      dateISO: rescheduleDateISO,
      startMin,
      endMin,
      providerId: provider.id,
      providerFullName: provider.fullName,
      requiredResourceIds: rescheduleEvent.resourceIds || [],
      excludeEventId: rescheduleEvent.id,
    });

    if (!conflict.ok) {
      setRescheduleConflictWarning(conflict.message);
    } else {
      setRescheduleConflictWarning(null);
    }
  }, [
    rescheduleEvent,
    rescheduleDateISO,
    rescheduleStartTime,
    rescheduleDurationMinutes,
    rescheduleProviderId,
    state,
  ]);

  const handleConfirmReschedule = (forceEncaixe = false) => {
    if (!rescheduleEvent) return;
    if (rescheduleConflictWarning && !forceEncaixe) {
      return;
    }

    const result = rescheduleCalendarEvent(state, {
      eventId: rescheduleEvent.id,
      newDateISO: rescheduleDateISO,
      newStartTime: rescheduleStartTime,
      newEndTime: computedRescheduleEndTime,
      newProviderId: rescheduleProviderId,
      allowConflict: true,
      notifyNote: `Reagendado para ${formatDateBR(rescheduleDateISO)} às ${rescheduleStartTime}`,
      status: "confirmed",
    });

    if (!result.ok) {
      alert(result.message || "Erro ao reagendar atendimento.");
      return;
    }

    onUpdateState(() => result.state);

    const client = state.clients.find((c) => c.id === rescheduleEvent.clientId);
    if (rescheduleNotifyWhatsapp && client?.phone) {
      const cleanPhone = client.phone.replace(/\D/g, "");
      const provName =
        state.staff.find((s) => s.id === rescheduleProviderId)?.fullName ||
        rescheduleEvent.providerName;
      const msg = encodeURIComponent(
        `Olá ${client.fullName}! Seu atendimento de ${rescheduleEvent.serviceNames.join(" + ")} foi reagendado para ${formatDateBR(rescheduleDateISO)} às ${rescheduleStartTime} com ${provName}. Responda 1 para confirmar ou 2 se precisar ajustar.`
      );
      if (cleanPhone.length >= 10 && typeof window !== "undefined") {
        window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, "_blank");
      }
    }

    setRescheduleEvent(null);
    setSelectedEvent(null);
  };

  const handleMarkAwaitingReschedule = () => {
    if (!rescheduleEvent) return;
    onUpdateState((prev) =>
      processWhatsappInboundReply(prev, rescheduleEvent.id, "2_reschedule")
    );
    setSelectedEvent((prev) =>
      prev && prev.id === rescheduleEvent.id
        ? {
            ...prev,
            whatsappClientReply: "2_reschedule",
            status: "pending",
          }
        : null
    );
    setRescheduleEvent(null);
  };

  // Delete Appointment Confirmation State
  const [eventToDelete, setEventToDelete] = useState<CalendarEventItem | null>(null);
  const [deleteMode, setDeleteMode] = useState<"delete" | "cancel">("delete");

  const handleConfirmDelete = () => {
    if (!eventToDelete) return;
    const result = deleteCalendarEvent(state, eventToDelete.id, deleteMode);
    if (!result.ok) {
      alert(result.message || "Erro ao excluir agendamento.");
      return;
    }
    onUpdateState(() => result.state);
    setEventToDelete(null);
    if (selectedEvent?.id === eventToDelete.id) {
      setSelectedEvent(null);
    }
  };

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
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number | null>(null);
  const [customEndTime, setCustomEndTime] = useState<string | null>(null);
  const [servicesPopoverOpen, setServicesPopoverOpen] = useState(false);
  const [pendingServiceIds, setPendingServiceIds] = useState<string[]>([]);
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
  const [activeServiceMenuId, setActiveServiceMenuId] = useState<string | null>(null);

  // Waitlist Entry Form State (Print Model Reference)
  const [editingWaitlistId, setEditingWaitlistId] = useState<string | null>(null);
  const [validUntilISO, setValidUntilISO] = useState<string>("");
  const [isHousecall, setIsHousecall] = useState<boolean>(false);
  const [waitlistNotes, setWaitlistNotes] = useState<string>("");
  const [waitlistConfirmModalOpen, setWaitlistConfirmModalOpen] = useState(false);
  const [notifyClientOnWaitlist, setNotifyClientOnWaitlist] = useState(true);
  const [convertingWaitlistId, setConvertingWaitlistId] = useState<string | null>(null);

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

  const pendingCheckoutAppointments = useMemo(
    () =>
      getPendingCheckoutAppointments(
        state.calendarEvents,
        todayDateISO,
        currentTime?.totalMinutes
      ),
    [state.calendarEvents, todayDateISO, currentTime?.totalMinutes]
  );

  const pendingCheckoutIds = useMemo(
    () => new Set(pendingCheckoutAppointments.map((p) => p.id)),
    [pendingCheckoutAppointments]
  );

  useEffect(() => {
    if (!pendingCheckoutPopoverOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPendingCheckoutPopoverOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingCheckoutPopoverOpen]);

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
      const topPx =
        ((currentTime.totalMinutes - visibleStartHour * 60) / 60) * HOUR_HEIGHT;
      scrollContainerRef.current.scrollTo({
        top: Math.max(0, topPx - 160),
        behavior: "smooth",
      });
      hasAutoScrolledRef.current = true;
    }
  }, [currentTime, isViewingToday, visibleStartHour]);

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
      const topPx =
        ((currentTime.totalMinutes - visibleStartHour * 60) / 60) * HOUR_HEIGHT;
      scrollContainerRef.current.scrollTo({
        top: Math.max(0, topPx - 160),
        behavior: "smooth",
      });
    }
  };

  const handleNavigatePrev = () => {
    if (viewMode === "week") {
      onUpdateState((prev) => skipCalendarByWeeks(prev, -1));
    } else {
      onUpdateState((prev) => {
        const parts = prev.calendarView.selectedDateISO.split("-").map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        d.setDate(d.getDate() - 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return {
          ...prev,
          calendarView: {
            ...prev.calendarView,
            selectedDateISO: `${year}-${month}-${day}`,
          },
        };
      });
    }
  };

  const handleNavigateNext = () => {
    if (viewMode === "week") {
      onUpdateState((prev) => skipCalendarByWeeks(prev, 1));
    } else {
      onUpdateState((prev) => {
        const parts = prev.calendarView.selectedDateISO.split("-").map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        d.setDate(d.getDate() + 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return {
          ...prev,
          calendarView: {
            ...prev.calendarView,
            selectedDateISO: `${year}-${month}-${day}`,
          },
        };
      });
    }
  };

  const [hoveredSlot, setHoveredSlot] = useState<{
    dateISO: string;
    snappedMinutes: number;
    topPx: number;
    timeHHMM: string;
    timeLabel: string;
  } | null>(null);

  const handleColumnMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    dateISO: string
  ) => {
    const todayISO = getTodayDateISO();
    if (dateISO < todayISO) {
      setHoveredSlot(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMinutes = visibleStartHour * 60 + (y / HOUR_HEIGHT) * 60;
    const snappedMinutes = Math.min(
      (visibleStartHour + calendarHours.length) * 60,
      Math.max(visibleStartHour * 60, Math.round(totalMinutes / 15) * 15)
    );
    const snappedTopPx =
      ((snappedMinutes - visibleStartHour * 60) / 60) * HOUR_HEIGHT;

    const hours = Math.floor(snappedMinutes / 60);
    const minutes = snappedMinutes % 60;
    const timeHHMM = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    const timeLabel = formatTime12h(hours, minutes);

    setHoveredSlot({
      dateISO,
      snappedMinutes,
      topPx: snappedTopPx,
      timeHHMM,
      timeLabel,
    });
  };

  const handleColumnClick = (dateISO: string) => {
    const todayISO = getTodayDateISO();
    if (dateISO < todayISO) {
      onUpdateState((prev) => ({
        ...prev,
        lastToastMessage: "Não é permitido agendar ou reservar em datas passadas.",
      }));
      return;
    }
    if (hoveredSlot && hoveredSlot.dateISO === dateISO) {
      openNewDrawerAtSlot(hoveredSlot.timeHHMM, "appointment", dateISO);
    }
  };

  const eventsForSelectedDate = state.calendarEvents.filter(
    (e) =>
      e.dateISO === selectedDateISO &&
      e.status !== "canceled" &&
      (state.calendarView.selectedProviderId === "all" ||
        e.providerId === state.calendarView.selectedProviderId)
  );

  const openNewDrawerAtSlot = (
    timeHHMM: string,
    presetType?: CalendarEventType,
    presetDateISO?: string,
    overrideProviderId?: string
  ) => {
    const todayISO = getTodayDateISO();
    const targetDateISO = presetDateISO ?? (selectedDateISO < todayISO ? todayISO : selectedDateISO);

    // Trancar agendamento e reserva em datas passadas apenas quando clicado em um slot explicitamente no passado
    if (presetDateISO && presetDateISO < todayISO && presetType !== "working_hours") {
      onUpdateState((prev) => ({
        ...prev,
        lastToastMessage: "Não é permitido agendar ou reservar em datas passadas.",
      }));
      return;
    }

    setConflictError(null);
    setEditingWaitlistId(null);
    const chosenType = presetType ?? "appointment";
    setEventType(chosenType);
    setEventDateISO(targetDateISO < todayISO ? todayISO : targetDateISO);
    setStartTime(timeHHMM);
    setCustomDurationMinutes(null);
    setCustomEndTime(null);
    setServicesPopoverOpen(false);
    setDurationDropdownOpen(false);
    setActiveServiceMenuId(null);
    const targetProviderId =
      overrideProviderId ||
      (state.calendarView.selectedProviderId !== "all"
        ? state.calendarView.selectedProviderId
        : providerId || state.staff[0]?.id || "staff-bruno");
    setProviderId(targetProviderId);
    if (chosenType === "personal_block") {
      setSelectedServiceIds([]);
    } else if (chosenType === "waitlist_entry") {
      setValidUntilISO(presetDateISO ?? (selectedDateISO < todayISO ? todayISO : selectedDateISO));
      setIsHousecall(false);
      setWaitlistNotes("");
      if (!clientId && state.clients[0]) {
        setClientId(state.clients[0].id);
      }
      if (selectedServiceIds.length === 0 && state.services[0]) {
        setSelectedServiceIds([state.services[0].id]);
      }
    } else {
      if (!clientId && state.clients[0]) {
        setClientId(state.clients[0].id);
      }
      if (selectedServiceIds.length === 0 && state.services[0]) {
        setSelectedServiceIds([state.services[0].id]);
      }
    }
    setNewAppointmentDrawerOpen(true);
  };

  const handleHeaderOpenNewAppointment = () => {
    const todayISO = getTodayDateISO();
    const effectiveDateISO = selectedDateISO < todayISO ? todayISO : selectedDateISO;

    // Horário de início inteligente:
    // Se for para hoje, sugere o próximo bloco de 30 minutos (entre 08:00 e 19:30). Caso contrário, 10:00 padrão.
    let defaultTime = "10:00";
    if (effectiveDateISO === todayISO) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      let nextMinutes = currentMinutes < 30 ? 30 : 0;
      let nextHours = currentMinutes < 30 ? currentHours : currentHours + 1;
      if (nextHours < 8) {
        nextHours = 9;
        nextMinutes = 0;
      } else if (nextHours >= 20) {
        nextHours = 10;
        nextMinutes = 0;
      }
      defaultTime = `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
    }

    openNewDrawerAtSlot(defaultTime, "appointment", effectiveDateISO);
  };

  const handleOpenEditWaitlist = (wl: WaitlistEntryItem, isReschedule = false) => {
    const todayISO = getTodayDateISO();
    setEditingWaitlistId(wl.id);
    setConflictError(null);
    setEventType("waitlist_entry");
    setClientId(wl.clientId);
    setProviderId(wl.providerId);
    if (wl.serviceIds && wl.serviceIds.length > 0) {
      setSelectedServiceIds(wl.serviceIds);
    } else if (wl.serviceId) {
      setSelectedServiceIds([wl.serviceId]);
    } else if (state.services[0]) {
      setSelectedServiceIds([state.services[0].id]);
    }

    // Se estiver expirado ou for reagendamento, sugere a data de hoje para renovação válida
    const isPast = Boolean(
      (wl.validUntilISO && wl.validUntilISO < todayISO) ||
      (!wl.validUntilISO && wl.preferredDateISO < todayISO)
    );
    const newDateISO = isPast || isReschedule
      ? todayISO
      : (wl.validUntilISO || wl.preferredDateISO || todayISO);

    setValidUntilISO(newDateISO);
    setEventDateISO(newDateISO);
    setIsHousecall(Boolean(wl.isHousecall));
    setWaitlistNotes(wl.notes || "");
    setNotifyClientOnWaitlist(wl.notifyClient ?? true);
    setShowInlineNewClient(false);
    setWaitlistDrawerOpen(false);
    setNewAppointmentDrawerOpen(true);
  };

  const handleDeleteWaitlist = (waitlistId: string) => {
    onUpdateState((prev) => deleteWaitlistEntry(prev, waitlistId));
  };

  const selectedServicesObjects = state.services.filter((s) =>
    selectedServiceIds.includes(s.id)
  );
  const computedTotalCents = selectedServicesObjects.reduce(
    (acc, s) => acc + s.priceCents,
    0
  );
  const baseServiceDurationMin = selectedServicesObjects.reduce(
    (acc, s) => acc + s.durationMinutes + (s.blockTimeEnabled ? s.blockAfterMinutes : 0),
    0
  );
  const defaultDurationMin =
    eventType === "personal_block"
      ? 30
      : baseServiceDurationMin > 0
      ? baseServiceDurationMin
      : 30;

  const effectiveDurationMin = customDurationMinutes ?? defaultDurationMin;
  const effectiveEndTime =
    customEndTime ??
    formatMinutesToHHMM(parseTimeMinutes(startTime) + effectiveDurationMin);

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const startMin = parseTimeMinutes(newStart);
    const newEndMin = startMin + effectiveDurationMin;
    setCustomEndTime(formatMinutesToHHMM(newEndMin));
  };

  const handleEndTimeChange = (newEnd: string) => {
    setCustomEndTime(newEnd);
    const startMin = parseTimeMinutes(startTime);
    const endMin = parseTimeMinutes(newEnd);
    if (endMin > startMin) {
      setCustomDurationMinutes(endMin - startMin);
    }
  };

  const handleSelectDuration = (durationMin: number) => {
    setCustomDurationMinutes(durationMin);
    const startMin = parseTimeMinutes(startTime);
    setCustomEndTime(formatMinutesToHHMM(startMin + durationMin));
    setDurationDropdownOpen(false);
  };

  const getDurationOptions = () => {
    const base = defaultDurationMin;
    const optionsSet = new Set<number>();
    optionsSet.add(base);
    if (eventType === "personal_block") {
      [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 240].forEach((m) =>
        optionsSet.add(m)
      );
    } else {
      [5, 10, 15, 20, 25, 30, 45, 60, 75, 90, 120].forEach((delta) => {
        optionsSet.add(base + delta);
      });
      [15, 30, 45, 60, 75, 90, 105, 120].forEach((m) => {
        if (m >= base) optionsSet.add(m);
      });
    }
    if (customDurationMinutes) {
      optionsSet.add(customDurationMinutes);
    }
    return Array.from(optionsSet).sort((a, b) => a - b);
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServiceIds((prev) => prev.filter((id) => id !== serviceId));
    setCustomDurationMinutes(null);
    setCustomEndTime(null);
  };

  const handleMoveService = (index: number, direction: "up" | "down") => {
    setSelectedServiceIds((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleCreateEvent = () => {
    if (isSubmittingEvent) return;
    setIsSubmittingEvent(true);
    setConflictError(null);
    const result = validateAndCreateCalendarEvent(state, {
      eventType,
      dateISO: eventDateISO,
      startTime,
      endTime: effectiveEndTime,
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
      serviceIds: eventType === "personal_block" ? [] : selectedServiceIds,
      addressOrNotes,
      isRepeating,
      collectDeposit,
    });

    if (!result.ok) {
      setConflictError(result.message);
      setIsSubmittingEvent(false);
      return;
    }

    const finalWaitlist = convertingWaitlistId
      ? result.state.waitlist.filter((w) => w.id !== convertingWaitlistId)
      : result.state.waitlist;

    onUpdateState(() => ({
      ...result.state,
      waitlist: finalWaitlist,
      calendarView: {
        ...result.state.calendarView,
        selectedDateISO: eventDateISO,
      },
      lastToastMessage: convertingWaitlistId
        ? `Agendamento de ${result.createdEvent.clientName} confirmado e convertido da lista de espera!`
        : result.state.lastToastMessage,
    }));
    setConvertingWaitlistId(null);
    setNewAppointmentDrawerOpen(false);
    setShowInlineNewClient(false);
    setInlineClientName("");
    setInlineClientPhone("");
    setInlineClientEmail("");
    setAddressOrNotes("");
    setIsSubmittingEvent(false);
  };

  const handleConfirmSaveWaitlist = () => {
    let resolvedClientId = clientId;
    let updatedClients = state.clients;

    if (showInlineNewClient && inlineClientName.trim()) {
      const existing = state.clients.find(
        (c) =>
          c.fullName.trim().toLowerCase() ===
          inlineClientName.trim().toLowerCase()
      );
      if (existing) {
        resolvedClientId = existing.id;
      } else {
        const newClient = {
          id: `cli-${Date.now()}`,
          fullName: inlineClientName.trim(),
          email: inlineClientEmail.trim() || "",
          phone: inlineClientPhone.trim() || "",
          avatarColor: "#FBCFE8",
          createdAtISO: eventDateISO,
          lastVisitISO: eventDateISO,
          daysSinceLastVisit: 0,
          totalSpentCents: 0,
          visitsCount: 1,
          noShowCount: 0,
          sendAutomaticReminders: true,
          notesAndForms: {
            anamnesis: "",
            allergies: "",
            formulasAndPreferences: "",
            birthday: "",
          },
          autoSortedPhotos: [],
          packages: [],
          memberships: [],
        };
        updatedClients = [newClient, ...state.clients];
        resolvedClientId = newClient.id;
      }
    }

    if (!resolvedClientId && updatedClients[0]) {
      resolvedClientId = updatedClients[0].id;
    }

    const effectiveServiceIds =
      selectedServiceIds.length > 0
        ? selectedServiceIds
        : state.services[0]
        ? [state.services[0].id]
        : [];

    if (editingWaitlistId) {
      const result = updateWaitlistEntry(
        {
          ...state,
          clients: updatedClients,
        },
        editingWaitlistId,
        {
          clientId: resolvedClientId,
          providerId: providerId || state.staff[0]?.id || "staff-bruno",
          serviceIds: effectiveServiceIds,
          validUntilISO: validUntilISO || undefined,
          isHousecall,
          notes: waitlistNotes.trim(),
          notifyClient: notifyClientOnWaitlist,
          preferredDateISO: eventDateISO,
        }
      );
      onUpdateState(() => result.state);
    } else {
      const result = addWaitlistEntry(
        {
          ...state,
          clients: updatedClients,
        },
        {
          clientId: resolvedClientId,
          providerId: providerId || state.staff[0]?.id || "staff-bruno",
          serviceIds: effectiveServiceIds,
          validUntilISO: validUntilISO || undefined,
          isHousecall,
          notes: waitlistNotes.trim(),
          notifyClient: notifyClientOnWaitlist,
          preferredDateISO: eventDateISO,
        }
      );
      onUpdateState(() => result.state);
    }

    setEditingWaitlistId(null);
    setWaitlistConfirmModalOpen(false);
    setNewAppointmentDrawerOpen(false);
    setShowInlineNewClient(false);
    setInlineClientName("");
    setInlineClientPhone("");
    setInlineClientEmail("");
    setWaitlistNotes("");
    setValidUntilISO("");
    setIsHousecall(false);

    // Retorna para o drawer da lista de espera
    setWaitlistDrawerOpen(true);
  };

  const renderDatePopover = (positionClass: string) => {
    if (!datePopoverOpen) return null;

    const [selYear, selMonth] = selectedDateISO.split("-").map(Number);
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    const firstDayIndex = new Date(selYear, selMonth - 1, 1).getDay();

    return (
      <>
        {/* Click outside backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20"
          onClick={() => setDatePopoverOpen(false)}
          aria-hidden="true"
        />

        {/* Popover Card */}
        <div
          className={`absolute ${positionClass} w-[min(340px,calc(100vw-2rem))] bg-white dark:bg-[#18181b] rounded-[20px] border border-[#E5E5EA] dark:border-[#27272a] shadow-xl p-4 sm:p-5 z-50 animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[15px] font-semibold text-[#1C1C1E] dark:text-white capitalize">
              {formatDateBR(selectedDateISO)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleNavigatePrev}
                title="Retroceder"
                aria-label="Retroceder"
                className="p-1.5 rounded-full hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[#6E6E73] dark:text-[#a1a1aa]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleGoToToday}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-full border border-[#E5E5EA] dark:border-[#27272a] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[#1C1C1E] dark:text-white"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={handleNavigateNext}
                title="Avançar"
                aria-label="Avançar"
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
            {/* Blank leading days for accurate day-of-week alignment */}
            {Array.from({ length: firstDayIndex }, (_, i) => (
              <span key={`empty-${i}`} className="h-8 w-8 mx-auto" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const iso = `${selYear}-${String(selMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = selectedDateISO === iso;
              return (
                <button
                  key={day}
                  type="button"
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

          {/* Quick Week Skip Pills */}
          <div className="pt-3 border-t border-[#E5E5EA] dark:border-[#27272a]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#71717a] mb-2.5">
              Avançar semanas (Retorno rápido)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[2, 3, 4, 5, 6, 7, 8].map((weeks) => (
                <button
                  key={weeks}
                  type="button"
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
          </div>
        </div>
      </>
    );
  };

  const renderPendingCheckoutContent = () => {
    const totalPendingCents = pendingCheckoutAppointments.reduce(
      (sum, e) => sum + (e.totalCents || 0),
      0
    );

    return (
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="p-4 sm:p-4.5 border-b border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-[15px] font-semibold text-[#1C1C1E] dark:text-white">
              Fila de Baixa
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] dark:bg-[#27272a] text-[#1C1C1E] dark:text-zinc-200 border border-[#E5E5EA] dark:border-[#3F3F46]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
              <span>
                {pendingCheckoutAppointments.length}{" "}
                {pendingCheckoutAppointments.length === 1 ? "pendente" : "pendentes"}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setPendingCheckoutPopoverOpen(false)}
            title="Fechar fila de baixa"
            aria-label="Fechar fila de baixa"
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtitle / Tip */}
        <div className="px-4 py-2 bg-[#FAFAFC] dark:bg-[#1a1a1e] border-b border-[#E5E5EA] dark:border-[#27272a] text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
          Atendimentos concluídos pendentes de baixa no PDV.
        </div>

        {/* List of overdue appointments */}
        {pendingCheckoutAppointments.length === 0 ? (
          <div className="p-8 text-center text-[#6E6E73] dark:text-[#a1a1aa] text-[13px]">
            Nenhum atendimento aguardando baixa no momento.
          </div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#E5E5EA] dark:divide-[#27272a]">
            {pendingCheckoutAppointments.map((ev) => {
              const clientInitials = ev.clientName
                ? ev.clientName
                    .split(" ")
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase())
                    .join("")
                : "CL";

              const isToday = ev.dateISO === todayDateISO;
              const timeDesc = isToday
                ? `Terminou às ${ev.endTime}`
                : `Concluído em ${formatDateBR(ev.dateISO)} às ${ev.endTime}`;

              const servicesText =
                ev.serviceNames && ev.serviceNames.length > 0
                  ? ev.serviceNames.join(", ")
                  : "Atendimento";

              return (
                <div
                  key={ev.id}
                  className="p-3.5 sm:p-4 hover:bg-[#FAFAFA] dark:hover:bg-[#202024] transition flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] text-[#1C1C1E] dark:text-white flex items-center justify-center font-bold text-[12px] shrink-0">
                        {clientInitials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white truncate">
                          {ev.clientName}
                        </h4>
                        <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa] truncate">
                          {servicesText} · {ev.providerName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[13.5px] font-bold text-[#1C1C1E] dark:text-white">
                        {formatBRL(ev.totalCents || 0)}
                      </div>
                      <div className="text-[10.5px] text-amber-600 dark:text-amber-400 font-medium flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{timeDesc}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingCheckoutPopoverOpen(false);
                        onOpenQuickSale(ev);
                      }}
                      className="flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[13px] font-semibold hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition shadow-xs cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1C1E] dark:focus-visible:ring-white"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Dar baixa (POS)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {pendingCheckoutAppointments.length > 0 && (
          <div className="p-3.5 px-4 bg-[#F5F5F7]/80 dark:bg-[#1f1f23] border-t border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-between text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
            <span>Total pendente:</span>
            <span className="font-bold text-[#1C1C1E] dark:text-white text-[13px]">
              {formatBRL(totalPendingCents)}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderViewModeDropdown = () => {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setViewModeDropdownOpen((v) => !v);
            setProviderFilterDropdownOpen(false);
            setDatePopoverOpen(false);
          }}
          className="flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-full border border-[#E5E5EA] dark:border-[#27272a] text-[13px] font-medium text-[#1C1C1E] dark:text-white bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition shadow-2xs shrink-0 cursor-pointer"
          aria-expanded={viewModeDropdownOpen}
          title="Alterar modo de visualização"
        >
          <span>{viewMode === "week" ? "Semana" : "Dia"}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#6E6E73] dark:text-[#a1a1aa] transition-transform duration-200 ${
              viewModeDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {viewModeDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20"
              onClick={() => setViewModeDropdownOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute left-0 top-full mt-2 w-44 bg-white dark:bg-[#18181b] rounded-2xl border border-[#E5E5EA] dark:border-[#27272a] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#71717a]">
                Visualização
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdateState((prev) => ({
                    ...prev,
                    calendarView: { ...prev.calendarView, mode: "day" },
                  }));
                  setViewModeDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between min-h-[44px] px-3 py-2.5 rounded-xl text-[13px] font-medium text-left transition ${
                  viewMode === "day"
                    ? "bg-[#F5F5F7] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                    : "text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]/50"
                }`}
              >
                <span>Dia</span>
                {viewMode === "day" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1C1C1E] dark:bg-white" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateState((prev) => ({
                    ...prev,
                    calendarView: { ...prev.calendarView, mode: "week" },
                  }));
                  setViewModeDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between min-h-[44px] px-3 py-2.5 rounded-xl text-[13px] font-medium text-left transition ${
                  viewMode === "week"
                    ? "bg-[#F5F5F7] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                    : "text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]/50"
                }`}
              >
                <span>Semana</span>
                {viewMode === "week" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1C1C1E] dark:bg-white" />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderProviderFilterDropdown = (alignClass: "left-0" | "right-0" = "right-0") => {
    const isAll = state.calendarView.selectedProviderId === "all";
    const currentStaff = state.staff.find(
      (s) => s.id === state.calendarView.selectedProviderId
    );

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setProviderFilterDropdownOpen((v) => !v);
            setViewModeDropdownOpen(false);
            setDatePopoverOpen(false);
          }}
          className="flex items-center gap-1.5 sm:gap-2 min-h-[44px] px-3.5 py-2 rounded-full border border-[#E5E5EA] dark:border-[#27272a] text-[13px] font-medium text-[#1C1C1E] dark:text-white bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition shadow-2xs shrink-0 cursor-pointer"
          aria-expanded={providerFilterDropdownOpen}
          title="Filtrar agenda por profissional"
        >
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-[#1C1C1E] shrink-0"
            style={{
              backgroundColor: isAll
                ? "#E5E5EA"
                : currentStaff?.avatarColor || "#E5E5EA",
            }}
          >
            {isAll ? "EQ" : currentStaff?.initials || "All"}
          </span>
          <span className="truncate max-w-[130px]">
            {isAll
              ? `Toda a equipe (${state.staff.length})`
              : currentStaff?.fullName.split(" ")[0] || "Equipe"}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#6E6E73] dark:text-[#a1a1aa] shrink-0 transition-transform duration-200 ${
              providerFilterDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {providerFilterDropdownOpen && (
          <>
            {/* Click outside backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20"
              onClick={() => setProviderFilterDropdownOpen(false)}
              aria-hidden="true"
            />

            {/* Dropdown Card */}
            <div
              className={`absolute ${alignClass} top-full mt-2 w-64 bg-white dark:bg-[#18181b] rounded-2xl border border-[#E5E5EA] dark:border-[#27272a] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}
            >
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#71717a]">
                Filtrar por profissional
              </div>

              {/* Opção Toda a equipe */}
              <button
                type="button"
                onClick={() => {
                  onUpdateState((prev) => ({
                    ...prev,
                    calendarView: {
                      ...prev.calendarView,
                      selectedProviderId: "all",
                    },
                  }));
                  setProviderFilterDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between min-h-[44px] px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                  isAll
                    ? "bg-[#F5F5F7] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white"
                    : "hover:bg-[#F5F5F7]/70 dark:hover:bg-[#27272a]/50 text-[#1C1C1E] dark:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#E5E5EA] dark:bg-[#3F3F46] flex items-center justify-center text-[#1C1C1E] dark:text-white shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white leading-tight">
                      Toda a equipe
                    </p>
                    <p className="text-[11px] text-[#8E8E93] dark:text-[#71717a]">
                      {state.staff.length} profissionais na grade
                    </p>
                  </div>
                </div>
                {isAll && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
                )}
              </button>

              <div className="my-1 border-t border-[#F5F5F7] dark:border-[#27272a]" />

              {/* Lista dos membros */}
              <div className="max-h-[260px] overflow-y-auto space-y-0.5">
                {state.staff.map((st) => {
                  const isSelected =
                    state.calendarView.selectedProviderId === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        onUpdateState((prev) => ({
                          ...prev,
                          calendarView: {
                            ...prev.calendarView,
                            selectedProviderId: st.id,
                          },
                        }));
                        setProviderId(st.id);
                        setProviderFilterDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between min-h-[44px] px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                        isSelected
                          ? "bg-[#F5F5F7] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white"
                          : "hover:bg-[#F5F5F7]/70 dark:hover:bg-[#27272a]/50 text-[#1C1C1E] dark:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-[#1C1C1E] shrink-0"
                          style={{
                            backgroundColor: st.avatarColor || "#E5E5EA",
                          }}
                        >
                          {st.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white leading-tight truncate">
                            {st.fullName}
                          </p>
                          <p className="text-[11px] text-[#8E8E93] dark:text-[#71717a] truncate">
                            {st.role || "Especialista"}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col h-[calc(100dvh-53px-calc(5.2rem+env(safe-area-inset-bottom,0px)))] md:h-[calc(100vh-1rem)] max-h-full bg-white dark:bg-[#18181b] overflow-hidden">
      {/* Top Calendar Header Matching Reference Screenshot (media_1792845742688_c1165d63.png) */}
      <header className="relative z-20 px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b]">
        {/* Desktop Header Layout (>= md) */}
        <div className="hidden md:flex items-center justify-between gap-3 xl:gap-4 overflow-x-auto no-scrollbar py-0.5">
          {/* Left: Out + [📅] + < Sáb, 24 de Out, 2026 > */}
          <div className="relative flex items-center gap-2.5 sm:gap-3 shrink-0">
            <span className="text-[20px] font-bold text-[#1C1C1E] dark:text-white tracking-tight">
              {getMonthShort(selectedDateISO)}
            </span>

            {/* Calendar Icon Button */}
            <button
              type="button"
              onClick={() => setDatePopoverOpen((v) => !v)}
              title="Abrir calendário"
              aria-label="Abrir calendário"
              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border border-[#E5E5EA] dark:border-[#27272a] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[#1C1C1E] dark:text-white transition flex items-center justify-center cursor-pointer"
            >
              <CalendarIcon className="w-4 h-4 text-[#1C1C1E] dark:text-white" />
            </button>

            {/* Integrated Navigation Pill: < [ Date Text ] > */}
            <div className="flex items-center min-h-[44px] h-11 rounded-full border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] shadow-2xs">
              <button
                type="button"
                onClick={handleNavigatePrev}
                title="Retroceder"
                aria-label="Retroceder"
                className="h-full min-w-[44px] px-3 hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white rounded-l-full transition flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setDatePopoverOpen((v) => !v)}
                title="Selecionar data"
                className="h-full px-3.5 text-[13px] font-semibold text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition whitespace-nowrap flex items-center cursor-pointer"
              >
                {formatNavDate(selectedDateISO)}
              </button>

              <button
                type="button"
                onClick={handleNavigateNext}
                title="Avançar"
                aria-label="Avançar"
                className="h-full min-w-[44px] px-3 hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white rounded-r-full transition flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Popover Date Picker with +2 to +8 weeks jump */}
            {renderDatePopover("left-0 top-full mt-2")}
          </div>

          {/* Right: [⚙] [Semana ⌄] [(Avatar) Bruno ⌄] [Lista de espera] [Venda rápida] [+ Agendar] */}
          <div className="flex items-center gap-2 xl:gap-2.5 shrink-0 pl-1">
            {/* Settings Icon */}
            <button
              type="button"
              onClick={() => {
                setCalendarSettingsDrawerOpen(true);
                setProviderFilterDropdownOpen(false);
                setViewModeDropdownOpen(false);
                setDatePopoverOpen(false);
              }}
              title="Configurações de exibição da agenda"
              aria-label="Configurações de exibição da agenda"
              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border border-[#E5E5EA] dark:border-[#27272a] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white transition flex items-center justify-center cursor-pointer shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* View Mode Dropdown: Semana / Dia */}
            {renderViewModeDropdown()}

            {/* Provider Dropdown: (Avatar) Bruno / Toda a equipe ⌄ */}
            {renderProviderFilterDropdown("right-0")}

            {/* Botão Lista de espera */}
            <button
              type="button"
              onClick={() => setWaitlistDrawerOpen(true)}
              className="min-h-[44px] h-11 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full border border-[#E5E5EA] dark:border-[#27272a] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[12.5px] sm:text-[13px] font-medium text-[#1C1C1E] dark:text-white transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span>Lista de espera</span>
              {state.waitlist.length > 0 && (
                <span className="px-2 py-0.5 text-[10.5px] rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] font-bold">
                  {state.waitlist.length}
                </span>
              )}
            </button>

            {/* Pílula de Alerta de Baixa (se houver agendamentos aguardando checkout) */}
            {pendingCheckoutAppointments.length > 0 && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setPendingCheckoutPopoverOpen((v) => !v)}
                  aria-expanded={pendingCheckoutPopoverOpen}
                  aria-label={`${pendingCheckoutAppointments.length} atendimentos aguardando baixa`}
                  className="min-h-[44px] h-11 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] hover:bg-[#EAEAEA] dark:hover:bg-[#3F3F46] border border-[#E5E5EA] dark:border-[#3F3F46] text-[#1C1C1E] dark:text-white text-[12.5px] sm:text-[13px] font-medium transition cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20 shrink-0" />
                  <span>{pendingCheckoutAppointments.length} aguardando baixa</span>
                </button>

                {pendingCheckoutPopoverOpen && (
                  <div className="hidden md:block">
                    <div
                      className="fixed inset-0 z-40 bg-black/10 dark:bg-black/30"
                      onClick={() => setPendingCheckoutPopoverOpen(false)}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute right-0 top-full mt-2 w-[420px] bg-white dark:bg-[#18181b] rounded-2xl border border-[#E5E5EA] dark:border-[#27272a] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                      role="dialog"
                      aria-modal="true"
                      aria-label="Fila de Baixa Financeira"
                    >
                      {renderPendingCheckoutContent()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botão Venda rápida */}
            <button
              type="button"
              onClick={() => onOpenQuickSale()}
              className="min-h-[44px] h-11 px-3.5 sm:px-4 py-2 rounded-full border border-[#E5E5EA] dark:border-[#27272a] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[12.5px] sm:text-[13px] font-medium text-[#1C1C1E] dark:text-white transition cursor-pointer flex items-center justify-center shrink-0 whitespace-nowrap"
            >
              Venda rápida
            </button>

            {/* Botão + Agendar */}
            <button
              type="button"
              onClick={handleHeaderOpenNewAppointment}
              className="min-h-[44px] h-11 px-5 rounded-full bg-[#1C1C1E] dark:bg-white hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 text-white dark:text-[#18181b] text-[13px] sm:text-[13.5px] font-semibold transition-all shadow-sm cursor-pointer flex items-center justify-center shrink-0 whitespace-nowrap active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 mr-1.5 shrink-0 stroke-[2.25]" />
              <span>Agendar</span>
            </button>
          </div>
        </div>

        {/* Mobile Header Layout (< md) */}
        <div className="md:hidden space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex items-center gap-2">
              <span className="text-[17px] font-bold text-[#1C1C1E] dark:text-white tracking-tight">
                {getMonthShort(selectedDateISO)}
              </span>
              <button
                type="button"
                onClick={() => setDatePopoverOpen((v) => !v)}
                title="Abrir calendário"
                aria-label="Abrir calendário"
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border border-[#E5E5EA] dark:border-[#27272a] text-[#1C1C1E] dark:text-white flex items-center justify-center hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition cursor-pointer"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
              <div className="flex items-center min-h-[44px] h-11 rounded-full border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[13px]">
                <button
                  type="button"
                  onClick={handleNavigatePrev}
                  title="Retroceder"
                  aria-label="Retroceder"
                  className="h-full min-w-[44px] px-3 text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white rounded-l-full flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDatePopoverOpen((v) => !v)}
                  title="Selecionar data"
                  className="h-full px-3.5 font-semibold text-[#1C1C1E] dark:text-white whitespace-nowrap flex items-center cursor-pointer"
                >
                  {formatNavDate(selectedDateISO)}
                </button>
                <button
                  type="button"
                  onClick={handleNavigateNext}
                  title="Avançar"
                  aria-label="Avançar"
                  className="h-full min-w-[44px] px-3 text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white rounded-r-full flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Popover Date Picker */}
              {renderDatePopover("left-0 top-full mt-2")}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCalendarSettingsDrawerOpen(true);
                  setProviderFilterDropdownOpen(false);
                  setViewModeDropdownOpen(false);
                  setDatePopoverOpen(false);
                }}
                title="Configurações de exibição da agenda"
                aria-label="Configurações de exibição da agenda"
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border border-[#E5E5EA] dark:border-[#27272a] text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleHeaderOpenNewAppointment}
                className="min-h-[44px] h-11 px-4 sm:px-4.5 rounded-full bg-[#1C1C1E] dark:bg-white hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 text-white dark:text-[#18181b] text-[13px] font-semibold shrink-0 flex items-center justify-center cursor-pointer whitespace-nowrap active:scale-[0.98] shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1 shrink-0 stroke-[2.25]" />
                <span>Agendar</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-[12.5px] pb-1">
            {renderViewModeDropdown()}
            {renderProviderFilterDropdown("left-0")}

            <button
              type="button"
              onClick={() => setWaitlistDrawerOpen(true)}
              className="flex items-center gap-2 min-h-[44px] h-11 px-4 rounded-full border border-[#E5E5EA] dark:border-[#27272a] text-[#1C1C1E] dark:text-white bg-white dark:bg-[#18181b] shrink-0 cursor-pointer font-medium"
            >
              <span>Lista de espera</span>
              {state.waitlist.length > 0 && (
                <span className="px-2 py-0.5 text-[10.5px] rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] font-bold">
                  {state.waitlist.length}
                </span>
              )}
            </button>

            {/* Mobile Pílula de Alerta de Baixa */}
            {pendingCheckoutAppointments.length > 0 && (
              <button
                type="button"
                onClick={() => setPendingCheckoutPopoverOpen(true)}
                aria-label={`${pendingCheckoutAppointments.length} atendimentos aguardando baixa`}
                className="flex items-center gap-2 min-h-[44px] h-11 px-3.5 sm:px-4 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] text-[#1C1C1E] dark:text-white shrink-0 font-medium text-[12.5px] cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20 shrink-0" />
                <span className="font-semibold">{pendingCheckoutAppointments.length}</span>
                <span className="hidden sm:inline">aguardando baixa</span>
                <span className="sm:hidden">baixa</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenQuickSale()}
              className="min-h-[44px] h-11 px-4 rounded-full border border-[#E5E5EA] text-[#1C1C1E] dark:text-white bg-white dark:bg-[#18181b] shrink-0 flex items-center justify-center font-medium cursor-pointer"
            >
              Venda rápida
            </button>
          </div>
        </div>
      </header>

      {/* Week Mode Full 7-Day Matrix or Day Mode View */}
      {viewMode === "week" ? (
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#18181b] overflow-x-auto">
          <div className="flex-1 flex flex-col min-w-[760px] md:min-w-0 min-h-0">
            {/* 7-Day Header Strip */}
            <div className="flex border-b border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] shrink-0 sticky top-0 z-30">
              {/* Time gutter spacer */}
              <div className="w-14 sm:w-16 shrink-0 border-r border-[#E5E5EA] dark:border-[#27272a]" />

              {/* 7 Day Columns Header */}
              <div className="grid grid-cols-7 flex-1">
              {getWeekDays(selectedDateISO).map((wd) => {
                const isToday =
                  currentTime ? wd.dateISO === currentTime.todayISO : false;
                const isSelected = selectedDateISO === wd.dateISO;
                return (
                  <button
                    key={wd.dateISO}
                    type="button"
                    onClick={() =>
                      onUpdateState((prev) => ({
                        ...prev,
                        calendarView: {
                          ...prev.calendarView,
                          selectedDateISO: wd.dateISO,
                        },
                      }))
                    }
                    className="py-3 px-1 sm:px-2 text-center border-r border-[#E5E5EA] dark:border-[#27272a] transition select-none flex flex-col items-center justify-center gap-0.5 hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]/40"
                  >
                    <span
                      className={`text-[15px] sm:text-[16px] font-bold leading-none ${
                        isSelected || isToday
                          ? "text-[#E11D8F]"
                          : "text-[#1C1C1E] dark:text-white"
                      }`}
                    >
                      {wd.dayNum}
                    </span>
                    <span
                      className={`text-[12px] sm:text-[13px] font-medium leading-tight mt-1 ${
                        isSelected || isToday
                          ? "text-[#E11D8F] font-semibold"
                          : "text-[#6E6E73] dark:text-[#a1a1aa]"
                      }`}
                    >
                      {wd.labelFull}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Matrix */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto relative"
          >
            <div
              style={{ minHeight: `${calendarHours.length * HOUR_HEIGHT}px` }}
              className="flex relative"
            >
              {/* Time Gutter on the Left */}
              <div className="w-14 sm:w-16 shrink-0 border-r border-[#E5E5EA] dark:border-[#27272a] select-none relative bg-white dark:bg-[#18181b] z-20">
                {calendarHours.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="pr-2 sm:pr-3 pt-1.5 text-right text-[11px] font-mono text-[#8E8E93] dark:text-[#71717a] border-b border-[#EFEFF4] dark:border-[#27272a]"
                  >
                    {formatHour12(hour)}
                  </div>
                ))}

                {/* Current Time Badge on Gutter */}
                {currentTime && (
                  <div
                    className="absolute right-1 -translate-y-1/2 z-30 pointer-events-none"
                    style={{
                      top: `${((currentTime.totalMinutes - visibleStartHour * 60) / 60) * HOUR_HEIGHT}px`,
                    }}
                  >
                    <span className="px-1.5 py-0.5 rounded-full bg-[#E11D8F] text-white text-[10px] font-mono font-bold shadow-xs whitespace-nowrap">
                      {currentTime.formatted}
                    </span>
                  </div>
                )}
              </div>

              {/* 7 Columns Container */}
              <div className="grid grid-cols-7 flex-1 relative">
                {/* Real-time Magenta Line across all 7 columns */}
                {currentTime && (
                  <div
                    className="absolute left-0 right-0 h-[2px] bg-[#E11D8F] z-20 pointer-events-none transition-all duration-300"
                    style={{
                      top: `${((currentTime.totalMinutes - visibleStartHour * 60) / 60) * HOUR_HEIGHT}px`,
                    }}
                  />
                )}

                {/* Render each day column */}
                {getWeekDays(selectedDateISO).map((wd) => {
                  const workingHours = getDayWorkingHours(
                    state.settings?.website?.businessHours,
                    wd.dateISO
                  );
                  const isHovered = hoveredSlot?.dateISO === wd.dateISO;

                  // Day events for this specific column
                  const dayEvents = state.calendarEvents.filter(
                    (e) =>
                      e.dateISO === wd.dateISO &&
                      e.status !== "canceled" &&
                      (state.calendarView.selectedProviderId === "all" ||
                        e.providerId === state.calendarView.selectedProviderId)
                  );

                  return (
                    <div
                      key={wd.dateISO}
                      onMouseMove={(e) => handleColumnMouseMove(e, wd.dateISO)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={() => handleColumnClick(wd.dateISO)}
                      className="relative border-r border-[#E5E5EA] dark:border-[#27272a] select-none cursor-pointer"
                    >
                      {/* Background Hour Rows */}
                      {calendarHours.map((hour) => (
                        <div
                          key={hour}
                          style={{ height: `${HOUR_HEIGHT}px` }}
                          className="border-b border-[#EFEFF4] dark:border-[#27272a]"
                        />
                      ))}

                      {/* Hatched / "Rabiscada" Non-working overlays */}
                      {!workingHours.isOpen ? (
                        // Entire day closed
                        <div
                          className="absolute inset-0 pointer-events-none z-0 calendar-blocked-slot"
                        />
                      ) : (
                        <>
                          {/* Top hatched area: Before working hours (e.g. before 8am) */}
                          {workingHours.startMinutes > visibleStartHour * 60 && (
                            <div
                              className="absolute left-0 right-0 top-0 pointer-events-none z-0 calendar-blocked-slot"
                              style={{
                                height: `${((workingHours.startMinutes - visibleStartHour * 60) / 60) * HOUR_HEIGHT}px`,
                              }}
                            />
                          )}
                          {/* Bottom hatched area: After working hours (e.g. after 5pm) */}
                          {workingHours.endMinutes <
                            (visibleStartHour + calendarHours.length) * 60 && (
                            <div
                              className="absolute left-0 right-0 pointer-events-none z-0 calendar-blocked-slot"
                              style={{
                                top: `${((workingHours.endMinutes - visibleStartHour * 60) / 60) * HOUR_HEIGHT}px`,
                                height: `${(((visibleStartHour + calendarHours.length) * 60 - workingHours.endMinutes) / 60) * HOUR_HEIGHT}px`,
                              }}
                            />
                          )}
                        </>
                      )}

                      {/* Interactive Hover Slot Guide & Pill ("9:30am", "3:15pm") */}
                      {isHovered && hoveredSlot && (
                        <>
                          <div
                            className="absolute left-0 right-0 h-[1.5px] bg-[#E11D8F]/60 pointer-events-none z-20"
                            style={{ top: `${hoveredSlot.topPx}px` }}
                          />
                          <div
                            className="absolute left-1.5 z-30 pointer-events-none -translate-y-1/2 px-2 py-0.5 rounded-[6px] bg-white dark:bg-zinc-800 border border-[#D4D4D8] dark:border-[#3F3F46] shadow-sm text-[11px] font-semibold text-[#1C1C1E] dark:text-zinc-100 whitespace-nowrap"
                            style={{ top: `${hoveredSlot.topPx}px` }}
                          >
                            {hoveredSlot.timeLabel}
                          </div>
                        </>
                      )}

                      {/* Render Appointments in this column */}
                      {dayEvents.map((ev) => {
                        const startMin = parseTimeMinutes(ev.startTime);
                        const endMin = parseTimeMinutes(ev.endTime);
                        const topPx = Math.max(
                          0,
                          ((startMin - visibleStartHour * 60) / 60) * HOUR_HEIGHT
                        );
                        const heightPx = Math.max(
                          38,
                          ((endMin - startMin) / 60) * HOUR_HEIGHT
                        );
                        const isCompleted = ev.status === "completed";
                        const isPending = ev.status === "pending";
                        const isAwaitingCheckout = pendingCheckoutIds.has(ev.id);

                        const shouldSplitServices =
                          multiServiceDisplayMode === "multiple_cards" &&
                          ev.serviceNames.length > 1 &&
                          heightPx >= 68;

                        if (shouldSplitServices) {
                          const totalEvtMin = Math.max(15, endMin - startMin);
                          let runningSliceMin = startMin;
                          const numSrv = ev.serviceNames.length;
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
                              }}
                              className="absolute z-10 left-1 right-1 flex flex-col gap-1 cursor-pointer select-none"
                            >
                              {ev.serviceNames.map((sName, sIdx) => {
                                const approxDuration = Math.round(totalEvtMin / numSrv);
                                const sStart = runningSliceMin;
                                const sEnd =
                                  sIdx === numSrv - 1 ? endMin : sStart + approxDuration;
                                runningSliceMin = sEnd;
                                const sStartH = Math.floor(sStart / 60);
                                const sStartM = sStart % 60;
                                const sEndH = Math.floor(sEnd / 60);
                                const sEndM = sEnd % 60;
                                const sliceTimeStr = `${formatTime12h(sStartH, sStartM)} - ${formatTime12h(sEndH, sEndM)}`;

                                return (
                                  <div
                                    key={`${ev.id}-${sIdx}`}
                                    className={`flex-1 rounded-[10px] p-2 flex flex-col justify-start overflow-hidden border shadow-xs transition hover:shadow-md ${
                                      isCompleted
                                        ? "bg-[#F1F5F9] dark:bg-[#27272a] border-[#CBD5E1] dark:border-[#3f3f46] text-[#1C1C1E] dark:text-zinc-100"
                                        : isAwaitingCheckout
                                        ? "bg-white dark:bg-[#18181b] border-amber-300/80 dark:border-amber-500/40 text-[#1C1C1E] dark:text-zinc-100 shadow-2xs hover:border-amber-400 dark:hover:border-amber-500/60"
                                        : isPending
                                        ? "bg-[#FEF3C7] dark:bg-[#451a03] border-[#F59E0B] dark:border-[#b45309] text-[#78350F] dark:text-[#fef3c7]"
                                        : "bg-[#FCE7F3] dark:bg-[#3b1228] border-[#F472B6] dark:border-[#9d174d] text-[#1C1C1E] dark:text-pink-50"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1 leading-none">
                                      <span className="text-[10px] font-medium opacity-80 text-[#6E6E73] dark:text-zinc-400">
                                        {sliceTimeStr}
                                      </span>
                                      {isAwaitingCheckout && sIdx === 0 && (
                                        <span
                                          className="relative flex items-center justify-center p-0.5"
                                          title="Aguardando baixa"
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ring-2 ring-amber-400/20 shrink-0" />
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-semibold text-[11px] truncate mt-0.5">
                                      {sName}
                                    </span>
                                    {isAwaitingCheckout && sIdx === numSrv - 1 && heightPx >= 84 && (
                                      <div className="mt-auto pt-0.5 flex justify-end">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenQuickSale(ev);
                                          }}
                                          title="Dar baixa no PDV"
                                          aria-label={`Dar baixa do atendimento de ${ev.clientName}`}
                                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1C1C1E] dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border dark:border-zinc-700/80 text-white dark:text-zinc-200 text-[10px] font-semibold hover:bg-[#2C2C2E] transition active:scale-[0.96] shadow-2xs cursor-pointer"
                                        >
                                          <CreditCard className="w-2.5 h-2.5" />
                                          <span>Baixar</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

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
                            }}
                            className={`absolute z-10 left-1 right-1 rounded-[10px] p-2 cursor-pointer transition select-none flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                              isCompleted
                                ? "bg-[#F1F5F9] dark:bg-[#27272a] border border-[#CBD5E1] dark:border-[#3f3f46] text-[#1C1C1E] dark:text-zinc-100"
                                : isAwaitingCheckout
                                ? "bg-white dark:bg-[#18181b] border border-amber-300/80 dark:border-amber-500/40 text-[#1C1C1E] dark:text-zinc-100 shadow-2xs hover:border-amber-400 dark:hover:border-amber-500/60"
                                : isPending
                                ? "bg-[#FEF3C7] dark:bg-[#451a03] border border-[#F59E0B] dark:border-[#b45309] text-[#78350F] dark:text-[#fef3c7]"
                                : "bg-[#FCE7F3] dark:bg-[#3b1228] border border-[#F472B6] dark:border-[#9d174d] text-[#1C1C1E] dark:text-pink-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 leading-tight">
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-[11.5px] truncate block leading-none text-[#1C1C1E] dark:text-zinc-100">
                                  {ev.clientName}
                                </span>
                                {heightPx >= 44 && (
                                  <span className="text-[10px] opacity-75 truncate block mt-0.5 text-[#71717A] dark:text-zinc-400">
                                    {ev.serviceNames.join(", ")}
                                  </span>
                                )}
                              </div>
                              <div className="shrink-0 mt-0.5">
                                {isAwaitingCheckout ? (
                                  <span
                                    className="relative flex items-center justify-center p-0.5"
                                    title="Atendimento concluído · Aguardando baixa"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/25 shrink-0" />
                                  </span>
                                ) : isCompleted ? (
                                  <FileText className="w-3.5 h-3.5 text-[#475569] dark:text-zinc-300" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E11D8F] dark:text-[#f472b6]" />
                                )}
                              </div>
                            </div>
                            {heightPx >= 46 && (
                              <div className="flex items-center justify-between gap-1 mt-auto pt-0.5 text-[9.5px]">
                                <span className="font-mono opacity-70 truncate text-[#6E6E73] dark:text-zinc-400">
                                  {ev.startTime} – {ev.endTime}
                                </span>
                                {isAwaitingCheckout && (
                                  heightPx >= 84 ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenQuickSale(ev);
                                      }}
                                      title="Dar baixa no PDV (Venda Rápida)"
                                      aria-label={`Dar baixa do atendimento de ${ev.clientName} no valor de ${formatBRL(ev.totalCents)}`}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1C1C1E] dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border dark:border-zinc-700/80 text-white dark:text-zinc-200 text-[9.5px] font-semibold hover:bg-[#2C2C2E] transition active:scale-[0.96] shadow-2xs cursor-pointer shrink-0"
                                    >
                                      <CreditCard className="w-2.5 h-2.5" />
                                      <span>Baixar</span>
                                    </button>
                                  ) : (
                                    <span className="font-mono font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                                      {formatBRL(ev.totalCents)}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      ) : (
        /* Day Mode Single Day Timeline */
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#18181b]">
          {/* Day Mode Subheader */}
          <div className="px-3.5 sm:px-6 py-2 bg-[#FAFAFC] dark:bg-[#18181b] border-b border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-between gap-3 overflow-x-auto no-scrollbar text-[11px] sm:text-[12px]">
            <div className="flex items-center gap-2 shrink-0">
              {state.staff.map((member) => {
                const isSelected = state.calendarView.selectedProviderId === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      const nextId = isSelected ? "all" : member.id;
                      onUpdateState((prev) => ({
                        ...prev,
                        calendarView: {
                          ...prev.calendarView,
                          selectedProviderId: nextId,
                        },
                      }));
                      setProviderId(member.id);
                    }}
                    title={`Filtrar agenda por ${member.fullName}`}
                    className={`relative flex items-center gap-1.5 min-h-[38px] sm:min-h-[44px] px-3 py-1.5 rounded-full transition cursor-pointer shrink-0 before:absolute before:-inset-1 before:content-[''] ${
                      isSelected
                        ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] shadow-xs"
                        : "bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#323238]"
                    }`}
                  >
                    <span
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-[#1C1C1E]"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.initials}
                    </span>
                    <span className="font-semibold">
                      {member.fullName.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
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
            </div>
          </div>

          {/* Main Hourly Grid (Day Mode) */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto relative"
          >
            <div
              style={{ minHeight: `${calendarHours.length * HOUR_HEIGHT}px` }}
              className="relative"
            >
              {/* Magenta Current Time Line */}
              {isViewingToday && currentTime && (
                <div
                  className="absolute left-0 right-0 z-20 flex items-center pointer-events-none transition-all duration-300"
                  style={{
                    top: `${Math.max(
                      0,
                      Math.min(
                        calendarHours.length * HOUR_HEIGHT,
                        ((currentTime.totalMinutes - visibleStartHour * 60) / 60) *
                          HOUR_HEIGHT
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

              {/* Day Column Working Hours Overlays */}
              {(() => {
                const workingHours = getDayWorkingHours(
                  state.settings?.website?.businessHours,
                  selectedDateISO
                );
                return (
                  <>
                    {!workingHours.isOpen ? (
                      <div
                        className="absolute inset-0 pointer-events-none z-0 left-14 sm:left-20 calendar-blocked-slot"
                      />
                    ) : (
                      <>
                        {workingHours.startMinutes > visibleStartHour * 60 && (
                          <div
                            className="absolute left-14 sm:left-20 right-0 top-0 pointer-events-none z-0 calendar-blocked-slot"
                            style={{
                              height: `${((workingHours.startMinutes - visibleStartHour * 60) / 60) * HOUR_HEIGHT}px`,
                            }}
                          />
                        )}
                        {workingHours.endMinutes <
                          (visibleStartHour + calendarHours.length) * 60 && (
                          <div
                            className="absolute left-14 sm:left-20 right-0 pointer-events-none z-0 calendar-blocked-slot"
                            style={{
                              top: `${((workingHours.endMinutes - visibleStartHour * 60) / 60) * HOUR_HEIGHT}px`,
                              height: `${(((visibleStartHour + calendarHours.length) * 60 - workingHours.endMinutes) / 60) * HOUR_HEIGHT}px`,
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                );
              })()}

              {/* Hourly Rows */}
              {calendarHours.map((hour) => {
                const label = `${String(hour).padStart(2, "0")}:00`;
                return (
                  <div
                    key={hour}
                    onClick={() => openNewDrawerAtSlot(label, "appointment")}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-b border-[#EFEFF4] dark:border-[#27272a] flex group hover:bg-[#FAFAFC] dark:hover:bg-[#18181b] cursor-pointer transition"
                  >
                    <div className="w-14 sm:w-20 pr-2 sm:pr-3 pt-2 text-right text-[11px] sm:text-[12px] font-mono text-[#8E8E93] dark:text-[#71717a] select-none border-r border-[#EFEFF4] dark:border-[#27272a]">
                      {formatHour12(hour)}
                    </div>
                    <div className="flex-1 relative px-3 sm:px-4 flex items-center">
                      <span className="opacity-0 group-hover:opacity-100 text-[11px] sm:text-[12px] font-medium text-[#6E56CF] dark:text-[#A494F7] transition">
                        + Clique para agendar às {label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Day Mode Rendered Appointment & Event Blocks */}
              {eventsForSelectedDate.map((ev) => {
                const startMin = parseTimeMinutes(ev.startTime);
                const endMin = parseTimeMinutes(ev.endTime);
                const topPx = Math.max(
                  0,
                  ((startMin - visibleStartHour * 60) / 60) * HOUR_HEIGHT
                );
                const heightPx = Math.max(
                  46,
                  ((endMin - startMin) / 60) * HOUR_HEIGHT
                );
                const hasProcessingWindow = ev.processingDurationMinutes > 0;
                const resourcesUsed = state.resources.filter((r) =>
                  ev.resourceIds.includes(r.id)
                );
                const isCompleted = ev.status === "completed";
                const isPending = ev.status === "pending";
                const isAwaitingCheckout = pendingCheckoutIds.has(ev.id);

                const isAllProviders =
                  state.calendarView.selectedProviderId === "all";
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
                      ...(hasSimultaneousEvent
                        ? {
                            left: isSecondary
                              ? "calc(3.75rem + 50%)"
                              : "3.75rem",
                            width: "calc(50% - 2.25rem)",
                          }
                        : {}),
                    }}
                    className={`absolute z-10 ${
                      hasSimultaneousEvent
                        ? ""
                        : "left-[3.75rem] sm:left-[5.5rem] right-2 sm:right-4"
                    } rounded-[12px] p-2.5 sm:p-3 cursor-pointer transition select-none flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                      isCompleted
                        ? "bg-[#F1F5F9] dark:bg-[#27272a] border border-[#CBD5E1] dark:border-[#3f3f46] text-[#1C1C1E] dark:text-zinc-100"
                        : isAwaitingCheckout
                        ? "bg-white dark:bg-[#18181b] border border-amber-300/80 dark:border-amber-500/40 text-[#1C1C1E] dark:text-zinc-100 shadow-2xs hover:border-amber-400 dark:hover:border-amber-500/60"
                        : isPending
                        ? "bg-[#FEF3C7] dark:bg-[#451a03] border border-[#F59E0B] dark:border-[#b45309] text-[#78350F] dark:text-[#fef3c7]"
                        : "bg-[#FCE7F3] dark:bg-[#3b1228] border border-[#F472B6] dark:border-[#9d174d] text-[#1C1C1E] dark:text-pink-50"
                    }`}
                  >
                    {heightPx < 58 ? (
                      <div className="flex items-center justify-between gap-2 h-full">
                        <div className="min-w-0 flex-1 flex items-center gap-1.5 truncate">
                          {isAwaitingCheckout && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/25 shrink-0" />
                          )}
                          <span className="text-[12px] sm:text-[13px] font-bold truncate text-[#1C1C1E] dark:text-zinc-100">
                            {ev.clientName}
                          </span>
                          <span className="text-[11px] opacity-75 truncate hidden sm:inline text-[#6E6E73] dark:text-zinc-400">
                            · {ev.serviceNames.join(" + ")}
                          </span>
                          <span className="text-[11px] font-mono opacity-80 shrink-0 text-[#6E6E73] dark:text-zinc-400">
                            · {ev.startTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-[11px] sm:text-[12px] text-[#1C1C1E] dark:text-zinc-100">
                            {formatBRL(ev.totalCents)}
                          </span>
                          {isAwaitingCheckout ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenQuickSale(ev);
                              }}
                              title="Iniciar checkout e dar baixa direta no PDV (Venda Rápida)"
                              aria-label={`Iniciar checkout e dar baixa de ${ev.clientName} no valor de ${formatBRL(ev.totalCents)}`}
                              className="relative inline-flex items-center gap-1 min-h-[26px] px-2.5 py-0.5 rounded-full bg-[#1C1C1E] dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border dark:border-zinc-700 text-white dark:text-zinc-200 text-[10.5px] font-semibold transition active:scale-[0.97] shadow-2xs cursor-pointer before:absolute before:-inset-2 before:content-['']"
                            >
                              <CreditCard className="w-2.5 h-2.5" />
                              <span>Baixar</span>
                            </button>
                          ) : isCompleted ? (
                            <FileText className="w-3.5 h-3.5 text-[#475569] dark:text-zinc-300" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#E11D8F] dark:text-[#f472b6]" />
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[12px] sm:text-[13px] font-bold truncate text-[#1C1C1E] dark:text-zinc-100">
                                {ev.clientName}
                              </span>
                              <span className="text-[11px] sm:text-[12px] font-mono opacity-80 shrink-0 text-[#6E6E73] dark:text-zinc-400">
                                · {ev.startTime} – {ev.endTime}
                              </span>
                            </div>
                            <p className="text-[11px] sm:text-[12px] opacity-80 font-medium truncate mt-0.5 text-[#6E6E73] dark:text-zinc-400">
                              {ev.serviceNames.join(" + ")} · {ev.providerName}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                            {isAwaitingCheckout ? (
                              <div
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 text-[10.5px] font-medium"
                                title="Atendimento concluído · Aguardando baixa"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ring-2 ring-amber-400/20 shrink-0" />
                                <span>Aguardando baixa</span>
                              </div>
                            ) : isCompleted ? (
                              <FileText className="w-4 h-4 text-[#475569] dark:text-zinc-300" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-[#E11D8F] dark:text-[#f472b6]" />
                            )}
                          </div>
                        </div>

                        {hasProcessingWindow && (
                          <div className="my-1 px-2.5 py-1 rounded-lg bg-[#F5F3FF] border border-dashed border-[#6E56CF]/50 flex items-center justify-between gap-1 text-[11px] text-[#6E56CF]">
                            <span className="inline-flex items-center gap-1.5 truncate">
                              <Clock className="w-3 h-3 shrink-0" />
                              Pausa ({ev.processingDurationMinutes} min livres p/
                              encaixe)
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

                        <div className="flex items-center justify-between gap-2 text-[10.5px] sm:text-[11px] pt-1.5 border-t border-black/5 dark:border-white/5">
                          <span className="truncate flex-1 min-w-0 opacity-75">
                            {resourcesUsed.length > 0
                              ? `Recursos: ${resourcesUsed.map((r) => r.name).join(", ")}`
                              : ev.addressOrNotes || (isAwaitingCheckout ? "Atendimento concluído" : "1-Toque para Detalhes")}
                          </span>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="font-mono font-bold">
                              {formatBRL(ev.totalCents)}
                            </span>
                            {isAwaitingCheckout && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenQuickSale(ev);
                                }}
                                title="Iniciar checkout e dar baixa direta no PDV (Venda Rápida)"
                                aria-label={`Iniciar checkout e dar baixa de ${ev.clientName} no valor de ${formatBRL(ev.totalCents)}`}
                                className="relative inline-flex items-center gap-1.5 min-h-[36px] sm:min-h-[44px] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#1C1C1E] dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border dark:border-zinc-700 text-white dark:text-zinc-200 text-[11px] sm:text-[12px] font-semibold transition shadow-xs active:scale-[0.98] cursor-pointer before:absolute before:-inset-1 before:content-['']"
                              >
                                <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>Dar baixa (POS)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DRAWER 1: LISTA DE ESPERA (03-3-calendar.png)
         ===================================================================== */}
      {waitlistDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex justify-end">
          <div className="w-full max-w-[430px] bg-white dark:bg-[#18181b] h-full shadow-gg-drawer flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[20px] font-bold text-[#1C1C1E] dark:text-white">
                    Lista de espera
                  </h2>
                  {state.waitlist.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] text-[11px] font-bold text-[#1C1C1E] dark:text-white">
                      {state.waitlist.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingWaitlistId(null);
                      setWaitlistDrawerOpen(false);
                      openNewDrawerAtSlot("14:00", "waitlist_entry");
                    }}
                    title="Adicionar à lista de espera"
                    className="w-8 h-8 rounded-full border border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setWaitlistDrawerOpen(false)}
                    className="w-8 h-8 rounded-full border border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Pill + Provider Filter */}
              <div className="px-6 py-3 border-b border-[#EFEFF4] dark:border-[#27272a] flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] text-[12px] font-semibold text-[#1C1C1E] dark:text-white">
                  {formatDateBR(selectedDateISO)}
                </span>
                <DropdownSelect
                  variant="inline"
                  align="right"
                  value={waitlistProviderFilter}
                  onChange={(val) => setWaitlistProviderFilter(val)}
                  options={[
                    { value: "all", label: "Todos profissionais" },
                    ...state.staff.map((st) => ({
                      value: st.id,
                      label: st.fullName,
                    })),
                  ]}
                />
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
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] text-[#1C1C1E] dark:text-white mx-auto flex items-center justify-center mb-3 shadow-2xs">
                    <CalendarIcon className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <h3 className="text-[15px] font-bold text-[#1C1C1E] dark:text-white mb-1">
                    Nenhuma solicitação na lista de espera
                  </h3>
                  <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa] mb-6">
                    Cadastre clientes interessados para preenchimento de desistências e encaixes.
                  </p>
                </div>
              ) : (
                state.waitlist
                  .filter(
                    (w) =>
                      waitlistProviderFilter === "all" ||
                      w.providerId === waitlistProviderFilter
                  )
                  .map((wl) => {
                    const todayISO = getTodayDateISO();
                    const isExpired = isWaitlistEntryExpired(wl, todayISO);
                    const limitDate = wl.validUntilISO || wl.preferredDateISO;

                    if (isExpired) {
                      return (
                        <div
                          key={wl.id}
                          className="p-4 rounded-[18px] border border-red-200 dark:border-red-900/50 bg-[#FEF2F2]/75 dark:bg-red-950/25 space-y-3 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-[15px] font-bold text-[#1C1C1E] dark:text-white">
                                  {wl.clientName}
                                </h4>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-[#18181b] border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[11px] font-semibold shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                  Expirado
                                </span>
                              </div>
                              <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                                {wl.serviceNames && wl.serviceNames.length > 0
                                  ? wl.serviceNames.join(", ")
                                  : wl.serviceName}{" "}
                                · com {wl.providerName}
                              </p>
                              {limitDate && (
                                <p className="text-[11px] text-red-600/90 dark:text-red-400/90 font-medium mt-1">
                                  Limite expirou em {formatDateBR(limitDate)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {wl.isHousecall && (
                                <span className="px-2 py-0.5 rounded-full bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] text-[#1C1C1E] dark:text-zinc-200 text-[10.5px] font-medium">
                                  Domicílio
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteWaitlist(wl.id)}
                                className="w-7 h-7 rounded-full border border-red-200 dark:border-red-900/40 bg-white dark:bg-[#18181b] text-[#6E6E73] hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 flex items-center justify-center transition"
                                title="Apagar da lista de espera"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {wl.notes && (
                            <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] bg-white/80 dark:bg-[#18181b] p-2.5 rounded-[12px] border border-red-100 dark:border-red-900/30">
                              {wl.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditWaitlist(wl, true)}
                              className="flex-1 py-2 px-4 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-semibold hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <CalendarIcon className="w-3.5 h-3.5" />
                              <span>Reagendar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWaitlist(wl.id)}
                              className="py-2 px-3.5 rounded-full border border-[#D4D4D8] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[#6E6E73] hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 text-[12.5px] font-medium hover:bg-white dark:hover:bg-[#27272a] transition flex items-center justify-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Apagar</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={wl.id}
                        className="p-4 rounded-[18px] border border-[#E5E5EA] dark:border-[#27272a] bg-[#FAFAFC] dark:bg-[#27272a]/50 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-[15px] font-bold text-[#1C1C1E] dark:text-white">
                              {wl.clientName}
                            </h4>
                            <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
                              {wl.serviceNames && wl.serviceNames.length > 0
                                ? wl.serviceNames.join(", ")
                                : wl.serviceName}{" "}
                              · com {wl.providerName}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {wl.isHousecall && (
                              <span className="px-2 py-0.5 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] text-[#1C1C1E] dark:text-zinc-200 text-[10.5px] font-medium">
                                Domicílio
                              </span>
                            )}
                            <span className="px-2.5 py-1 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[11px] font-semibold shadow-xs">
                              {wl.validUntilISO
                                ? `Válido até ${formatDateBR(wl.validUntilISO)}`
                                : wl.preferredTimeWindow || "Horário flexível"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditWaitlist(wl, false)}
                              className="w-7 h-7 rounded-full border border-[#E5E5EA] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[#6E6E73] hover:text-[#1C1C1E] dark:text-zinc-400 dark:hover:text-white flex items-center justify-center transition"
                              title="Editar cadastro"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWaitlist(wl.id)}
                              className="w-7 h-7 rounded-full border border-[#E5E5EA] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[#6E6E73] hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 flex items-center justify-center transition"
                              title="Apagar da lista de espera"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {wl.notes && (
                          <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] bg-white dark:bg-[#18181b] p-2.5 rounded-[12px] border border-[#E5E5EA]/50 dark:border-[#27272a]">
                            {wl.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditWaitlist(wl, false)}
                            className="py-2 px-3.5 rounded-full border border-[#D4D4D8] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white text-[12.5px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition flex items-center justify-center gap-1.5"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConvertingWaitlistId(wl.id);
                              setClientId(wl.clientId);
                              setProviderId(wl.providerId);
                              if (wl.serviceIds && wl.serviceIds.length > 0) {
                                setSelectedServiceIds(wl.serviceIds);
                              } else if (wl.serviceId) {
                                setSelectedServiceIds([wl.serviceId]);
                              }
                              setAddressOrNotes(wl.notes ? `Encaixe lista de espera: ${wl.notes}` : "");
                              setWaitlistDrawerOpen(false);
                              openNewDrawerAtSlot(
                                "14:00",
                                "appointment",
                                wl.preferredDateISO || selectedDateISO,
                                wl.providerId
                              );
                            }}
                            className="flex-1 py-2 px-4 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[12.5px] font-semibold hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>Converter em agendamento</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}

              {/* Editorial Clean Card at Bottom of Waitlist Drawer */}
              <div className="p-4 rounded-[18px] bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] space-y-2">
                <h4 className="text-[13.5px] font-bold text-[#1C1C1E] dark:text-white">
                  Preencha horários vagos com a lista de espera
                </h4>
                <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                  Cadastre clientes interessados e converta-os em agendamentos assim que um horário for liberado.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingWaitlistId(null);
                    setWaitlistDrawerOpen(false);
                    openNewDrawerAtSlot("14:00", "waitlist_entry");
                  }}
                  className="w-full py-2.5 rounded-full border border-[#D4D4D8] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white text-[12.5px] font-semibold hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
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
          <div className="w-full max-w-[460px] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white h-full shadow-gg-drawer flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {eventType === "waitlist_entry" && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewAppointmentDrawerOpen(false);
                      setEditingWaitlistId(null);
                      setWaitlistDrawerOpen(true);
                    }}
                    title="Voltar à lista de espera"
                    className="w-8 h-8 rounded-full border border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <h2 className="text-[20px] font-bold text-[#1C1C1E] dark:text-white">
                  {eventType === "waitlist_entry"
                    ? (editingWaitlistId ? "Editar lista de espera" : "Entrada na lista de espera")
                    : "Novo agendamento"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setNewAppointmentDrawerOpen(false);
                  setEditingWaitlistId(null);
                }}
                className="w-8 h-8 rounded-full border border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
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
                <label className="block text-[12px] font-semibold text-[#6E6E73] dark:text-[#a1a1aa] mb-1.5">
                  Tipo de Evento
                </label>
                <DropdownSelect
                  value={eventType}
                  onChange={(val) => {
                    const newType = val as CalendarEventType;
                    setEventType(newType);
                    if (newType === "personal_block") {
                      setSelectedServiceIds([]);
                    } else if (selectedServiceIds.length === 0 && state.services[0]) {
                      setSelectedServiceIds([state.services[0].id]);
                    }
                  }}
                  options={[
                    { value: "appointment", label: "Agendamento de Serviço" },
                    { value: "personal_block", label: "Horário reservado / Bloqueio" },
                    { value: "working_hours", label: "Horário de expediente" },
                    { value: "waitlist_entry", label: "Entrada na lista de espera" },
                  ]}
                />
              </div>

              {eventType === "waitlist_entry" ? (
                /* =========================================================
                   WAITLIST ENTRY SPECIFIC FORM (Print Model Reference)
                   ========================================================= */
                <div className="space-y-4">
                  {/* Client Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] font-semibold text-[#6E6E73] dark:text-[#a1a1aa]">
                        Cliente *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowInlineNewClient((v) => !v)}
                        className="text-[12px] font-semibold text-[#6E56CF] dark:text-[#a78bfa] hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {showInlineNewClient
                          ? "Selecionar existente"
                          : "+ Adicionar novo"}
                      </button>
                    </div>

                    {showInlineNewClient ? (
                      <div className="p-4 rounded-[16px] bg-[#F5F5F7] dark:bg-[#27272a] space-y-2.5">
                        <input
                          type="text"
                          placeholder="Nome completo do cliente"
                          value={inlineClientName}
                          onChange={(e) => setInlineClientName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E5EA] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Telefone / WhatsApp"
                            value={inlineClientPhone}
                            onChange={(e) => setInlineClientPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E5EA] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white"
                          />
                          <input
                            type="email"
                            placeholder="E-mail"
                            value={inlineClientEmail}
                            onChange={(e) => setInlineClientEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E5EA] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <DropdownSelect
                          value={clientId || state.clients[0]?.id || ""}
                          onChange={(val) => setClientId(val)}
                          placeholder="Selecione o cliente..."
                          options={state.clients.map((cli) => ({
                            value: cli.id,
                            label: cli.fullName,
                            sublabel: cli.phone || undefined,
                          }))}
                        />
                        {/* Selected Client Card Info (Phone + Email) */}
                        {(() => {
                          const activeClient =
                            state.clients.find((c) => c.id === clientId) ||
                            state.clients[0];
                          if (!activeClient) return null;
                          return (
                            <div className="mt-2.5 p-3 rounded-[14px] bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA]/60 dark:border-[#3F3F46]/40 space-y-1.5 text-[12.5px]">
                              {activeClient.phone && (
                                <div className="flex items-center gap-2 text-[#6E6E73] dark:text-[#a1a1aa]">
                                  <Phone className="w-3.5 h-3.5 shrink-0" />
                                  <span className="font-mono text-[#1C1C1E] dark:text-white">
                                    {activeClient.phone}
                                  </span>
                                </div>
                              )}
                              {activeClient.email && (
                                <div className="flex items-center gap-2 text-[#6E6E73] dark:text-[#a1a1aa]">
                                  <Mail className="w-3.5 h-3.5 shrink-0" />
                                  <span className="text-[#1C1C1E] dark:text-white truncate">
                                    {activeClient.email}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>

                  {/* Provider Selector */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6E6E73] dark:text-[#a1a1aa] mb-1.5">
                      Profissional *
                    </label>
                    <DropdownSelect
                      value={providerId}
                      onChange={(val) => setProviderId(val)}
                      placeholder="Selecione o profissional..."
                      options={state.staff.map((st) => ({
                        value: st.id,
                        label: st.fullName,
                        sublabel: st.role,
                      }))}
                    />
                  </div>

                  {/* Services Multi-Select Chips (Print Model) */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] font-semibold text-[#6E6E73] dark:text-[#a1a1aa]">
                        Serviços *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingServiceIds([...selectedServiceIds]);
                          setServicesPopoverOpen((v) => !v);
                        }}
                        className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar serviço</span>
                      </button>
                    </div>

                    <div
                      onClick={() => {
                        setPendingServiceIds([...selectedServiceIds]);
                        setServicesPopoverOpen(true);
                      }}
                      className="min-h-[46px] p-2 rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] flex items-center justify-between gap-2 cursor-pointer hover:border-[#1C1C1E] dark:hover:border-white transition"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {selectedServicesObjects.length === 0 ? (
                          <span className="text-[13px] text-[#8E8E93] dark:text-[#71717a] px-1.5">
                            Selecione um ou mais serviços...
                          </span>
                        ) : (
                          selectedServicesObjects.map((srv) => (
                            <span
                              key={srv.id}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] text-[12px] font-medium text-[#1C1C1E] dark:text-white"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-[4px] shrink-0"
                                style={{ backgroundColor: srv.calendarColor || "#E11D8F" }}
                              />
                              <span className="truncate max-w-[180px]">{srv.name}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveService(srv.id);
                                }}
                                className="w-3.5 h-3.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white ml-0.5"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-[#8E8E93] shrink-0 mr-1" />
                    </div>

                    {/* Popover Selection */}
                    {servicesPopoverOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setServicesPopoverOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-[min(320px,calc(100vw-3rem))] bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] rounded-[18px] shadow-2xl p-3 z-40 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between px-1 pb-1 border-b border-[#E5E5EA] dark:border-[#27272a]">
                            <span className="text-[12px] font-bold text-[#1C1C1E] dark:text-white">
                              Selecionar serviços
                            </span>
                          </div>

                          <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
                            {state.services.map((srv) => {
                              const isChecked = pendingServiceIds.includes(srv.id);
                              return (
                                <div
                                  key={srv.id}
                                  onClick={() =>
                                    setPendingServiceIds((prev) =>
                                      isChecked
                                        ? prev.filter((id) => id !== srv.id)
                                        : [...prev, srv.id]
                                    )
                                  }
                                  className={`p-2.5 rounded-[12px] border cursor-pointer transition flex items-center justify-between ${
                                    isChecked
                                      ? "border-[#1C1C1E] dark:border-white bg-[#F5F5F7] dark:bg-[#27272a]"
                                      : "border-[#E5E5EA]/60 dark:border-[#27272a] hover:bg-[#FAFAFC] dark:hover:bg-[#27272a]/40"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className="w-1.5 h-6 rounded-full shrink-0"
                                      style={{
                                        backgroundColor: srv.calendarColor || "#E11D8F",
                                      }}
                                    />
                                    <div className="min-w-0">
                                      <p className="text-[12.5px] font-semibold text-[#1C1C1E] dark:text-white truncate">
                                        {srv.name}
                                      </p>
                                      <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                                        {srv.durationMinutes} mins · {formatBRL(srv.priceCents)}
                                      </p>
                                    </div>
                                  </div>
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                                      isChecked
                                        ? "border-[#1C1C1E] dark:border-white bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b]"
                                        : "border-[#D4D4D8] dark:border-[#3F3F46]"
                                    }`}
                                  >
                                    {isChecked && <Check className="w-2.5 h-2.5" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="pt-2 border-t border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setServicesPopoverOpen(false)}
                              className="px-3 py-1.5 rounded-full text-[12px] font-medium text-[#6E6E73] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedServiceIds(pendingServiceIds);
                                setServicesPopoverOpen(false);
                              }}
                              disabled={pendingServiceIds.length === 0}
                              className="px-4 py-1.5 rounded-full text-[12px] font-semibold text-white bg-[#1C1C1E] dark:bg-white dark:text-[#18181b] hover:bg-[#2C2C2E] disabled:opacity-40 transition"
                            >
                              Confirmar ({pendingServiceIds.length})
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Valid until Input (Editorial Date Picker com bloqueio de datas passadas) */}
                  <EditorialDatePicker
                    label="Válido até"
                    placeholder="Selecione a data limite..."
                    value={validUntilISO}
                    onChange={(val) => setValidUntilISO(val)}
                    minDateISO={todayDateISO}
                    lockPastDates={true}
                    allowClear={true}
                  />

                  {/* Make a housecall Toggle Switch */}
                  <div className="flex items-center justify-between p-3.5 rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b]">
                    <div>
                      <span className="text-[13px] font-medium text-[#1C1C1E] dark:text-white">
                        Atendimento em domicílio
                      </span>
                      <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                        Atendimento externo no endereço do cliente
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isHousecall}
                      onClick={() => setIsHousecall(!isHousecall)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                        isHousecall ? "bg-[#1C1C1E] dark:bg-white" : "bg-[#E5E5EA] dark:bg-[#3F3F46]"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#18181b] shadow-sm transition duration-200 ease-in-out ${
                          isHousecall ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Preferred times & other notes */}
                  <div className="space-y-1.5">
                    <div className="rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] p-3 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition">
                      <label className="block text-[11px] font-semibold text-[#8E8E93] dark:text-[#71717a] mb-1">
                        Horários preferidos e outras observações
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Adicione preferências de horário, restrições ou notas..."
                        value={waitlistNotes}
                        onChange={(e) => setWaitlistNotes(e.target.value)}
                        className="w-full bg-transparent text-[13px] text-[#1C1C1E] dark:text-white outline-none resize-none placeholder:text-[#8E8E93]"
                      />
                    </div>
                    <p className="text-[11.5px] text-[#8E8E93] dark:text-[#71717a] px-1">
                      As preferências de horário do cliente serão geradas automaticamente a partir destas notas
                    </p>
                  </div>
                </div>
              ) : (
                /* =========================================================
                   APPOINTMENT / PERSONAL BLOCK / WORKING HOURS FORM
                   ========================================================= */
                <>
                  {/* Date, Start time, End time - 3 Column Layout (Screenshot 1 & 2) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                <div className="col-span-2 sm:col-span-1">
                  <EditorialDatePicker
                    label="Data *"
                    placeholder="Selecione a data..."
                    value={eventDateISO}
                    onChange={(val) => setEventDateISO(val)}
                    minDateISO={todayDateISO}
                    lockPastDates={true}
                  />
                </div>
                <div className="rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] p-2.5 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition">
                  <label className="block text-[11px] font-semibold text-[#8E8E93] dark:text-[#71717a] mb-1">
                    Start time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full bg-transparent text-[12.5px] sm:text-[13px] font-mono font-medium text-[#1C1C1E] dark:text-white outline-none"
                  />
                </div>
                <div className="rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] p-2.5 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition">
                  <label className="block text-[11px] font-semibold text-[#8E8E93] dark:text-[#71717a] mb-1">
                    End time
                  </label>
                  <input
                    type="time"
                    value={effectiveEndTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="w-full bg-transparent text-[12.5px] sm:text-[13px] font-mono font-medium text-[#1C1C1E] dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Client Selector + Inline Client Creation */}
              {eventType !== "personal_block" &&
                eventType !== "working_hours" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] font-semibold text-[#6E6E73] dark:text-[#a1a1aa]">
                        Client *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowInlineNewClient((v) => !v)}
                        className="text-[12px] font-semibold text-[#6E56CF] dark:text-[#a78bfa] hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {showInlineNewClient
                          ? "Selecionar cliente existente"
                          : "+ Adicionar Novo Cliente"}
                      </button>
                    </div>

                    {showInlineNewClient ? (
                      <div className="p-4 rounded-[16px] bg-[#F5F5F7] dark:bg-[#27272a] space-y-2.5">
                        <input
                          type="text"
                          placeholder="Nome completo do cliente"
                          value={inlineClientName}
                          onChange={(e) => setInlineClientName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E5EA] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="WhatsApp (11) 9..."
                            value={inlineClientPhone}
                            onChange={(e) =>
                              setInlineClientPhone(e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E5EA] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white"
                          />
                          <input
                            type="email"
                            placeholder="E-mail"
                            value={inlineClientEmail}
                            onChange={(e) =>
                              setInlineClientEmail(e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E5EA] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <DropdownSelect
                        value={clientId}
                        onChange={(val) => setClientId(val)}
                        placeholder="Selecione o cliente..."
                        options={state.clients.map((cli) => ({
                          value: cli.id,
                          label: cli.fullName,
                          sublabel: cli.phone || undefined,
                        }))}
                      />
                    )}
                  </div>
                )}

              {/* Service Provider Card */}
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] dark:text-[#a1a1aa] mb-1.5">
                  Profissional *
                </label>
                <DropdownSelect
                  value={providerId}
                  onChange={(val) => setProviderId(val)}
                  placeholder="Selecione o profissional..."
                  options={state.staff.map((st) => ({
                    value: st.id,
                    label: st.fullName,
                    sublabel: st.role,
                  }))}
                />
              </div>

              {/* Services Section with Dropdown Popover + Stack of Added Services (Screenshot 1 & 2) */}
              {eventType !== "personal_block" && eventType !== "working_hours" && (
                <div className="space-y-3">
                  {/* Header: Label + Add + button */}
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-[#6E6E73] dark:text-[#a1a1aa]">
                      Services *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingServiceIds([...selectedServiceIds]);
                          setServicesPopoverOpen((v) => !v);
                        }}
                        className="px-3.5 py-1 rounded-full border border-[#0D9488] text-[#0F766E] dark:border-[#14B8A6] dark:text-[#2DD4BF] hover:bg-[#F0FDFA] dark:hover:bg-[#134E4A]/30 text-[12.5px] font-semibold transition flex items-center gap-1"
                      >
                        <span>Add +</span>
                      </button>

                      {/* Dropdown Popover (Screenshot 1) */}
                      {servicesPopoverOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setServicesPopoverOpen(false)}
                          />
                          <div className="absolute right-0 top-full mt-2 w-[min(320px,calc(100vw-3rem))] bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] rounded-[18px] shadow-2xl p-3 z-40 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between px-1 pb-1 border-b border-[#E5E5EA] dark:border-[#27272a]">
                              <span className="text-[12px] font-bold text-[#1C1C1E] dark:text-white">
                                Selecionar serviços
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowInlineNewService((v) => !v)}
                                className="text-[11px] font-semibold text-[#6E56CF] dark:text-[#a78bfa] hover:underline"
                              >
                                {showInlineNewService ? "Fechar novo" : "+ Criar novo"}
                              </button>
                            </div>

                            {showInlineNewService && (
                              <div className="p-2.5 rounded-[12px] bg-[#F5F5F7] dark:bg-[#27272a] space-y-2">
                                <input
                                  type="text"
                                  placeholder="Nome do serviço"
                                  value={inlineServiceName}
                                  onChange={(e) => setInlineServiceName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#E5E5EA] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[12px] text-[#1C1C1E] dark:text-white"
                                />
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input
                                    type="number"
                                    placeholder="Preço (R$)"
                                    value={inlineServicePriceBRL}
                                    onChange={(e) => setInlineServicePriceBRL(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#E5E5EA] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[12px] font-mono text-[#1C1C1E] dark:text-white"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Duração (min)"
                                    value={inlineServiceDurationMin}
                                    onChange={(e) => setInlineServiceDurationMin(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#E5E5EA] dark:border-[#3F3F46] bg-white dark:bg-[#18181b] text-[12px] font-mono text-[#1C1C1E] dark:text-white"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!inlineServiceName.trim()) return;
                                    const priceCents =
                                      Math.max(0, parseInt(inlineServicePriceBRL || "150", 10)) * 100;
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
                                    setPendingServiceIds((prev) => [...prev, newId]);
                                    setInlineServiceName("");
                                    setShowInlineNewService(false);
                                  }}
                                  className="w-full py-1.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] text-[11px] font-semibold"
                                >
                                  Salvar e selecionar
                                </button>
                              </div>
                            )}

                            <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
                              {state.services.map((srv) => {
                                const isChecked = pendingServiceIds.includes(srv.id);
                                return (
                                  <div
                                    key={srv.id}
                                    onClick={() =>
                                      setPendingServiceIds((prev) =>
                                        isChecked
                                          ? prev.filter((id) => id !== srv.id)
                                          : [...prev, srv.id]
                                      )
                                    }
                                    className={`p-2.5 rounded-[12px] border cursor-pointer transition flex items-center justify-between ${
                                      isChecked
                                        ? "border-[#1C1C1E] dark:border-white bg-[#F5F5F7] dark:bg-[#27272a]"
                                        : "border-[#E5E5EA]/60 dark:border-[#27272a] hover:bg-[#FAFAFC] dark:hover:bg-[#27272a]/40"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span
                                        className="w-1.5 h-6 rounded-full shrink-0"
                                        style={{
                                          backgroundColor: srv.calendarColor || "#E11D8F",
                                        }}
                                      />
                                      <div className="min-w-0">
                                        <p className="text-[12.5px] font-semibold text-[#1C1C1E] dark:text-white truncate">
                                          {srv.name}
                                        </p>
                                        <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
                                          {srv.durationMinutes} mins · {formatBRL(srv.priceCents)}
                                        </p>
                                      </div>
                                    </div>
                                    <div
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                                        isChecked
                                          ? "border-[#1C1C1E] dark:border-white bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b]"
                                          : "border-[#D4D4D8] dark:border-[#3F3F46]"
                                      }`}
                                    >
                                      {isChecked && <Check className="w-2.5 h-2.5" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="pt-2 border-t border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setServicesPopoverOpen(false)}
                                className="px-3 py-1.5 rounded-full text-[12px] font-medium text-[#6E6E73] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedServiceIds(pendingServiceIds);
                                  setCustomDurationMinutes(null);
                                  setCustomEndTime(null);
                                  setServicesPopoverOpen(false);
                                }}
                                disabled={pendingServiceIds.length === 0}
                                className="px-4 py-1.5 rounded-full text-[12px] font-semibold text-white bg-[#1C1C1E] dark:bg-white dark:text-[#18181b] hover:bg-[#2C2C2E] disabled:opacity-40 disabled:hover:bg-[#1C1C1E] transition"
                              >
                                Add {pendingServiceIds.length} service{pendingServiceIds.length === 1 ? "" : "s"}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Added Services Cards (Screenshot 2) */}
                  {selectedServicesObjects.length === 0 ? (
                    <div
                      onClick={() => {
                        setPendingServiceIds([...selectedServiceIds]);
                        setServicesPopoverOpen(true);
                      }}
                      className="p-4 rounded-[14px] border border-dashed border-[#D4D4D8] dark:border-[#3F3F46] text-center cursor-pointer hover:bg-[#FAFAFC] dark:hover:bg-[#18181b] transition"
                    >
                      <p className="text-[12.5px] font-medium text-[#6E6E73] dark:text-[#a1a1aa]">
                        Nenhum serviço selecionado.
                      </p>
                      <p className="text-[11.5px] text-[#0D9488] dark:text-[#2DD4BF] font-semibold mt-1">
                        Clique em Add + para selecionar serviços
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(() => {
                        let runningMin = parseTimeMinutes(startTime);
                        return selectedServicesObjects.map((srv, idx) => {
                          const srvStartMin = runningMin;
                          runningMin += srv.durationMinutes;
                          const srvStartH = Math.floor(srvStartMin / 60);
                          const srvStartM = srvStartMin % 60;
                          const timeFormatted12 = formatTime12h(srvStartH, srvStartM);
                          const isMenuOpen = activeServiceMenuId === srv.id;

                          return (
                            <div
                              key={srv.id}
                              className="p-3.5 rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] flex items-center justify-between shadow-xs transition hover:border-[#D4D4D8] dark:hover:border-[#3F3F46]"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className="w-1 self-stretch rounded-full shrink-0"
                                  style={{
                                    backgroundColor: srv.calendarColor || "#E11D8F",
                                  }}
                                />
                                <div className="min-w-0">
                                  <p className="text-[13.5px] font-semibold text-[#1C1C1E] dark:text-white truncate">
                                    {srv.name}
                                  </p>
                                  <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                                    {timeFormatted12} · {srv.durationMinutes} mins · {formatBRL(srv.priceCents)}
                                  </p>
                                </div>
                              </div>

                              {/* Options Menu button */}
                              <div className="relative shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveServiceMenuId((prev) =>
                                      prev === srv.id ? null : srv.id
                                    )
                                  }
                                  className="p-1.5 rounded-full hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[#8E8E93] dark:text-[#a1a1aa]"
                                >
                                  <EllipsisVertical className="w-4 h-4" />
                                </button>
                                {isMenuOpen && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-30"
                                      onClick={() => setActiveServiceMenuId(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-1 w-44 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] shadow-lg z-40 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                                      {idx > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleMoveService(idx, "up");
                                            setActiveServiceMenuId(null);
                                          }}
                                          className="w-full px-2.5 py-1.5 rounded-[8px] text-left text-[12px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]"
                                        >
                                          Mover para cima
                                        </button>
                                      )}
                                      {idx < selectedServicesObjects.length - 1 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleMoveService(idx, "down");
                                            setActiveServiceMenuId(null);
                                          }}
                                          className="w-full px-2.5 py-1.5 rounded-[8px] text-left text-[12px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]"
                                        >
                                          Mover para baixo
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleRemoveService(srv.id);
                                          setActiveServiceMenuId(null);
                                        }}
                                        className="w-full px-2.5 py-1.5 rounded-[8px] text-left text-[12px] font-medium text-[#DC2626] hover:bg-[#FEE2E2] dark:hover:bg-[#7f1d1d]/30"
                                      >
                                        Remover serviço
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}

                      <p className="text-[11.5px] text-[#8E8E93] dark:text-[#71717a] text-center pt-0.5">
                        Hold and drag services to reorder
                      </p>

                      {/* Total Duration dropdown (Screenshot 2) */}
                      <div className="relative pt-2">
                        <label className="block text-[12px] font-semibold text-[#6E6E73] dark:text-[#a1a1aa] mb-1.5">
                          Total duration
                        </label>
                        <button
                          type="button"
                          onClick={() => setDurationDropdownOpen((v) => !v)}
                          className="w-full px-4 py-3 rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] flex items-center justify-between text-[14px] font-semibold text-[#1C1C1E] dark:text-white hover:border-[#1C1C1E] dark:hover:border-white transition"
                        >
                          <span>{formatDurationLabel(effectiveDurationMin)}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-[#8E8E93] transition-transform ${
                              durationDropdownOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {durationDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setDurationDropdownOpen(false)}
                            />
                            <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-[16px] bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] shadow-xl z-40 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                              {getDurationOptions().map((dMin) => {
                                const isSelected = effectiveDurationMin === dMin;
                                return (
                                  <button
                                    key={dMin}
                                    type="button"
                                    onClick={() => handleSelectDuration(dMin)}
                                    className={`w-full px-3.5 py-2 rounded-[10px] text-left text-[13px] font-medium flex items-center justify-between transition ${
                                      isSelected
                                        ? "bg-[#F5F5F7] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                                        : "text-[#6E6E73] dark:text-[#a1a1aa] hover:bg-[#FAFAFC] dark:hover:bg-[#27272a]/60 hover:text-[#1C1C1E] dark:hover:text-white"
                                    }`}
                                  >
                                    <span>{formatDurationLabel(dMin)}</span>
                                    {isSelected && (
                                      <Check className="w-4 h-4 text-[#1C1C1E] dark:text-white" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Personal Block / Horário Reservado Total Duration Dropdown */}
              {eventType === "personal_block" && (
                <div className="space-y-3 pt-1">
                  <div className="relative">
                    <label className="block text-[12px] font-semibold text-[#6E6E73] dark:text-[#a1a1aa] mb-1.5">
                      Total duration (Duração do horário reservado)
                    </label>
                    <button
                      type="button"
                      onClick={() => setDurationDropdownOpen((v) => !v)}
                      className="w-full px-4 py-3 rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] flex items-center justify-between text-[14px] font-semibold text-[#1C1C1E] dark:text-white hover:border-[#1C1C1E] dark:hover:border-white transition"
                    >
                      <span>{formatDurationLabel(effectiveDurationMin)}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#8E8E93] transition-transform ${
                          durationDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {durationDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setDurationDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-[16px] bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] shadow-xl z-40 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                          {getDurationOptions().map((dMin) => {
                            const isSelected = effectiveDurationMin === dMin;
                            return (
                              <button
                                key={dMin}
                                type="button"
                                onClick={() => handleSelectDuration(dMin)}
                                className={`w-full px-3.5 py-2 rounded-[10px] text-left text-[13px] font-medium flex items-center justify-between transition ${
                                  isSelected
                                    ? "bg-[#F5F5F7] dark:bg-[#27272a] text-[#1C1C1E] dark:text-white font-semibold"
                                    : "text-[#6E6E73] dark:text-[#a1a1aa] hover:bg-[#FAFAFC] dark:hover:bg-[#27272a]/60 hover:text-[#1C1C1E] dark:hover:text-white"
                                }`}
                              >
                                <span>{formatDurationLabel(dMin)}</span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-[#1C1C1E] dark:text-white" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Repeat Toggle & Deposit Toggle (only for appointment) */}
              {eventType === "appointment" && (
                <div className="space-y-3 pt-1">
                  <label className="flex items-center justify-between p-3.5 rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Repeat className="w-4 h-4 text-[#6E6E73]" />
                      <span className="text-[13px] font-medium text-[#1C1C1E] dark:text-white">
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

                  <label className="flex items-center justify-between p-3.5 rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <QrCode className="w-4 h-4 text-[#6E56CF]" />
                      <div>
                        <p className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                          Cobrar sinal (Taxa de reserva Pix)
                        </p>
                        <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa]">
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
              )}

              {/* Address / Notes (Client Notes) */}
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] dark:text-[#a1a1aa] mb-1.5">
                  Client Notes / Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Adicione observações, fórmula ou instruções..."
                  value={addressOrNotes}
                  onChange={(e) => setAddressOrNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[13px] text-[#1C1C1E] dark:text-white"
                />
              </div>
            </>
          )}
        </div>

            {/* Sticky Bottom Bar */}
            <div className="px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[#E5E5EA] dark:border-[#27272a] bg-[#FAFAFC] dark:bg-[#18181b]">
              {eventType === "waitlist_entry" ? (
                <button
                  type="button"
                  onClick={() => setWaitlistConfirmModalOpen(true)}
                  className="w-full py-3.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-zinc-200 dark:text-[#18181b] text-white text-[14px] font-semibold transition shadow-sm"
                >
                  Salvar
                </button>
              ) : (
                <div className="flex items-center justify-between">
                  {eventType !== "personal_block" ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#71717a]">
                        Total estimado
                      </p>
                      <p className="text-[20px] font-mono font-bold text-[#1C1C1E] dark:text-white">
                        {formatBRL(computedTotalCents)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#71717a]">
                        Tipo
                      </p>
                      <p className="text-[14px] font-bold text-[#1C1C1E] dark:text-white">
                        Horário reservado
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleCreateEvent}
                    disabled={isSubmittingEvent}
                    className="px-7 py-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-zinc-200 dark:text-[#18181b] disabled:opacity-50 text-white text-[14px] font-semibold transition"
                  >
                    {isSubmittingEvent
                      ? "Salvando..."
                      : eventType === "personal_block"
                      ? "Reservar horário"
                      : "Book appointment"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CONFIRMAÇÃO DE ENTRADA NA LISTA DE ESPERA (Print Model Flow)
         ===================================================================== */}
      {waitlistConfirmModalOpen && (() => {
        const targetClient =
          showInlineNewClient && inlineClientName.trim()
            ? {
                fullName: inlineClientName.trim(),
                phone: inlineClientPhone,
                email: inlineClientEmail,
              }
            : state.clients.find((c) => c.id === clientId) || state.clients[0];
        const targetProvider =
          state.staff.find((s) => s.id === providerId) || state.staff[0];
        const serviceSummary =
          selectedServicesObjects.length > 0
            ? selectedServicesObjects.map((s) => s.name).join(", ")
            : "Serviço padrão";

        return (
          <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-[420px] bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-2xl border border-[#E5E5EA] dark:border-[#2c2c2e] p-6 space-y-5 animate-in zoom-in-95 duration-150">
              <div>
                <h3 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
                  {editingWaitlistId ? "Atualizar lista de espera" : "Adicionar à lista de espera"}
                </h3>
                <p className="text-[16px] font-semibold text-[#1C1C1E] dark:text-zinc-100 mt-2.5">
                  {targetClient?.fullName || "Cliente"}
                </p>
                <p className="text-[13px] text-[#6E6E73] dark:text-zinc-400 mt-0.5">
                  {serviceSummary} com {targetProvider?.fullName}
                </p>
              </div>

              <label className="flex items-center gap-3 p-3.5 rounded-[14px] bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#333] cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyClientOnWaitlist}
                  onChange={(e) => setNotifyClientOnWaitlist(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#1C1C1E] dark:accent-white cursor-pointer"
                />
                <span className="text-[12.5px] text-[#1C1C1E] dark:text-white font-medium select-none">
                  Notificar cliente por WhatsApp e e-mail
                </span>
              </label>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setWaitlistConfirmModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-[#D4D4D8] dark:border-[#3F3F46] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[13px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#333] transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveWaitlist}
                  className="flex-1 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-zinc-200 dark:text-[#18181b] text-white text-[13px] font-semibold transition"
                >
                  {editingWaitlistId ? "Salvar alterações" : "Adicionar à lista de espera"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =====================================================================
          DRAWER 3: APPOINTMENT DETAILS (Confirmed vs Completed)
         ===================================================================== */}
      {selectedEvent && (() => {
        const isCompleted = selectedEvent.status === "completed";
        const client = state.clients.find((c) => c.id === selectedEvent.clientId);
        const clientInitials =
          selectedEvent.clientName
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "CL";
        const provider = state.staff.find((s) => s.id === selectedEvent.providerId);

        return (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex justify-end">
            <div className="w-full max-w-[420px] bg-white dark:bg-[#18181b] h-full shadow-gg-drawer flex flex-col justify-between animate-in slide-in-from-right duration-200">
              {/* Header */}
              <div className="px-6 py-5 border-b border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-[#1C1C1E] dark:text-white">
                    {isCompleted ? "Completed Appointment" : "Confirmed appointment"}
                  </h2>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Atendimento realizado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEventToDelete(selectedEvent);
                      setDeleteMode("delete");
                    }}
                    title="Excluir agendamento"
                    aria-label="Excluir agendamento"
                    className="w-8 h-8 rounded-full border border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-center text-[#6E6E73] dark:text-[#a1a1aa] hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="w-8 h-8 rounded-full border border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Client Profile Card */}
                <div className="p-4 rounded-[16px] border border-[#E5E5EA] dark:border-[#27272a] bg-[#FAFAFC] dark:bg-[#27272a]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-pink-100 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800 text-[#DB2777] dark:text-pink-300 flex items-center justify-center text-[14px] font-bold shrink-0">
                      {clientInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-[#1C1C1E] dark:text-white truncate">
                        {selectedEvent.clientName}
                      </p>
                      <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] truncate">
                        {client?.visitsCount ? `${client.visitsCount} agendamento` : "1 agendamento"}
                        {client?.phone ? ` · ${client.phone}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Service Details Card */}
                <div className="p-4 rounded-[16px] border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[15px] font-bold text-[#1C1C1E] dark:text-white">
                        {selectedEvent.serviceNames.join(" + ")}
                      </p>
                      <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                        {selectedEvent.activeDurationMinutes || 35}min · {selectedEvent.startTime} – {selectedEvent.endTime}
                      </p>
                    </div>
                    <span className="text-[16px] font-mono font-bold text-[#1C1C1E] dark:text-white shrink-0">
                      {formatBRL(selectedEvent.totalCents)}
                    </span>
                  </div>

                  {/* Provider Selector / Badge */}
                  <div className="pt-2 border-t border-[#F5F5F7] dark:border-[#27272a] flex items-center justify-between gap-2">
                    <span className="text-[12px] font-medium text-[#6E6E73] dark:text-[#a1a1aa]">
                      Profissional:
                    </span>
                    {(() => {
                      const matchedStaff =
                        state.staff.find((s) => s.id === selectedEvent.providerId) ||
                        state.staff.find(
                          (s) =>
                            s.fullName.trim().toLowerCase() ===
                            (selectedEvent.providerName || "").trim().toLowerCase()
                        ) ||
                        state.staff.find(
                          (s) =>
                            s.firstName.trim().toLowerCase() ===
                            (selectedEvent.providerName || "").trim().toLowerCase()
                        );
                      const currentSelectValue = matchedStaff?.id ?? selectedEvent.providerId;

                      return (
                        <DropdownSelect
                          variant="pill"
                          value={currentSelectValue}
                          onChange={(newProvId) => {
                            const newProv = state.staff.find((s) => s.id === newProvId);
                            if (!newProv) return;
                            onUpdateState((prev) => ({
                              ...prev,
                              calendarEvents: prev.calendarEvents.map((evt) =>
                                evt.id === selectedEvent.id
                                  ? {
                                      ...evt,
                                      providerId: newProv.id,
                                      providerName: newProv.fullName,
                                    }
                                  : evt
                              ),
                              lastToastMessage: `Agendamento transferido para ${newProv.fullName}.`,
                            }));
                            setSelectedEvent((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    providerId: newProv.id,
                                    providerName: newProv.fullName,
                                  }
                                : null
                            );
                          }}
                          options={state.staff.map((st) => ({
                            value: st.id,
                            label: `${st.initials} · ${st.fullName}`,
                            sublabel: st.role,
                          }))}
                        />
                      );
                    })()}
                  </div>
                </div>

                {/* Payment Breakdown Card (When Completed) */}
                {isCompleted && (
                  <div className="p-4 rounded-[16px] border border-[#E5E5EA] dark:border-[#27272a] bg-[#F8FAFC] dark:bg-[#1e293b]/30 space-y-2">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#6E6E73] dark:text-[#94a3b8]">Pagamento</span>
                      <span className="font-semibold text-[#1C1C1E] dark:text-white">Pix / Dinheiro</span>
                    </div>
                    <div className="flex items-center justify-between text-[14px] font-bold border-t border-[#E2E8F0] dark:border-[#334155] pt-2">
                      <span className="text-[#1C1C1E] dark:text-white">Total</span>
                      <span className="font-mono text-[16px] text-[#1C1C1E] dark:text-white">
                        {formatBRL(selectedEvent.totalCents)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Retention & Tools (Retorno em 1 Toque + WhatsApp) */}
                <div className="pt-2 space-y-2.5">
                  <div className="p-3.5 rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-[#FAFAFC] dark:bg-[#18181b] space-y-2">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6E6E73] dark:text-[#a1a1aa]">
                      <CalendarPlus className="w-3.5 h-3.5 text-[#6E56CF]" />
                      <span>Reagendamento de retorno</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[15, 30, 45].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => {
                            onUpdateState((prev) =>
                              rebookAppointmentOneTap(prev, selectedEvent.id, days)
                            );
                            setSelectedEvent(null);
                          }}
                          className="py-1.5 px-2 rounded-full bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] hover:bg-[#1C1C1E] hover:text-white text-[11px] font-semibold text-[#1C1C1E] dark:text-white transition"
                        >
                          +{days} dias
                        </button>
                      ))}
                    </div>
                  </div>

                  {!isCompleted && (
                    <div className="p-3.5 rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-[#FAFAFC] dark:bg-[#18181b] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              selectedEvent.arrivedAtReception
                                ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                                : "bg-zinc-400 ring-2 ring-zinc-400/20"
                            }`}
                          />
                          <span className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white">
                            Presença na recepção
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5 truncate">
                          {selectedEvent.arrivedAtReception
                            ? "Sinalizado como Na recepção no TV Kiosk"
                            : "Sinaliza chegada na coluna do profissional no TV Kiosk"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextArrived = !Boolean(
                            selectedEvent.arrivedAtReception
                          );
                          onUpdateState((prev) =>
                            toggleAppointmentReceptionArrival(
                              prev,
                              selectedEvent.id,
                              nextArrived
                            )
                          );
                          setSelectedEvent((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  arrivedAtReception: nextArrived,
                                  status:
                                    nextArrived && prev.status === "pending"
                                      ? "confirmed"
                                      : prev.status,
                                }
                              : null
                          );
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold transition shrink-0 ${
                          selectedEvent.arrivedAtReception
                            ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] hover:bg-[#2C2C2E]"
                            : "border border-[#D4D4D8] dark:border-[#3F3F46] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#3F3F46]"
                        }`}
                      >
                        {selectedEvent.arrivedAtReception
                          ? "Na recepção"
                          : "Marcar na recepção"}
                      </button>
                    </div>
                  )}

                  <div className="p-3.5 rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-[#FAFAFC] dark:bg-[#18181b] space-y-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1C1C1E] dark:text-white">
                        <MessageSquare className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>Automação WhatsApp 2-Way</span>
                      </div>
                      {selectedEvent.whatsappClientReply === "1_confirmed" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] text-[11px] font-medium text-[#1C1C1E] dark:text-white">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                          Confirmado (1)
                        </span>
                      ) : selectedEvent.whatsappClientReply === "2_reschedule" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] text-[11px] font-medium text-[#1C1C1E] dark:text-white">
                          <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                          Reagendamento (2)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] text-[11px] font-medium text-[#71717A] dark:text-[#a1a1aa]">
                          <span className="w-2 h-2 rounded-full bg-zinc-400 ring-2 ring-zinc-400/20" />
                          Aguardando
                        </span>
                      )}
                    </div>

                    {selectedEvent.whatsappClientReply === "1_confirmed" ? (
                      <div className="space-y-2">
                        <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
                          Cliente confirmou presença no horário combinado via WhatsApp.
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReschedule(selectedEvent)}
                            className="flex-1 py-1.5 px-3 rounded-full border border-[#D4D4D8] dark:border-[#3F3F46] bg-white dark:bg-[#27272a] hover:bg-[#F5F5F7] dark:hover:bg-[#3F3F46] text-[#1C1C1E] dark:text-white text-[11.5px] font-semibold transition"
                          >
                            Reagendar
                          </button>
                          {client?.phone && (
                            <a
                              href={`https://wa.me/55${client.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1.5 px-3 rounded-full border border-[#D4D4D8] dark:border-[#3F3F46] bg-white dark:bg-[#27272a] hover:bg-[#F5F5F7] text-[#1C1C1E] dark:text-white text-[11.5px] font-medium transition flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3 text-[#16A34A]" />
                              <span>Conversar</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ) : selectedEvent.whatsappClientReply === "2_reschedule" ? (
                      <div className="space-y-2">
                        <p className="text-[11.5px] text-amber-700 dark:text-amber-400 font-medium">
                          Cliente solicitou reagendamento de horário via WhatsApp.
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateState((prev) =>
                                processWhatsappInboundReply(
                                  prev,
                                  selectedEvent.id,
                                  "1_confirmed"
                                )
                              );
                              setSelectedEvent((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      status: "confirmed",
                                      whatsappReminderSent: true,
                                      whatsappClientReply: "1_confirmed",
                                    }
                                  : null
                              );
                            }}
                            className="py-1.5 px-2 rounded-full border border-[#D4D4D8] dark:border-[#3F3F46] bg-white dark:bg-[#27272a] hover:bg-[#F5F5F7] text-[#1C1C1E] dark:text-white text-[11px] font-semibold transition"
                          >
                            Manter Atual
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReschedule(selectedEvent)}
                            className="py-1.5 px-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] hover:bg-black text-[11px] font-semibold transition shadow-xs"
                          >
                            Escolher Horário (2)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
                          Lembrete interativo. Escolha a resposta do cliente:
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateState((prev) =>
                                processWhatsappInboundReply(
                                  prev,
                                  selectedEvent.id,
                                  "1_confirmed"
                                )
                              );
                              setSelectedEvent((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      status: "confirmed",
                                      whatsappReminderSent: true,
                                      whatsappClientReply: "1_confirmed",
                                    }
                                  : null
                              );
                            }}
                            className="py-1.5 px-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition shadow-xs"
                          >
                            Confirmou (1)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReschedule(selectedEvent)}
                            className="py-1.5 px-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition shadow-xs"
                          >
                            Reagendar (2)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEventToDelete(selectedEvent);
                    setDeleteMode("delete");
                  }}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border border-[#D4D4D8] dark:border-[#3F3F46] hover:border-rose-300 dark:hover:border-rose-800 text-[#6E6E73] dark:text-[#a1a1aa] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 transition shrink-0 flex items-center justify-center cursor-pointer"
                  title="Excluir agendamento"
                  aria-label="Excluir agendamento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const ev = selectedEvent;
                    setSelectedEvent(null);
                    openNewDrawerAtSlot(ev.startTime, ev.eventType, ev.dateISO, ev.providerId);
                  }}
                  className="min-h-[44px] px-4 py-2.5 rounded-full border border-[#D4D4D8] dark:border-[#3F3F46] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[13px] font-semibold transition cursor-pointer flex items-center justify-center"
                >
                  Editar
                </button>

                {!isCompleted ? (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenQuickSale(selectedEvent);
                      setSelectedEvent(null);
                    }}
                    aria-label={`Iniciar checkout e dar baixa de ${selectedEvent.clientName} no valor de ${formatBRL(selectedEvent.totalCents)}`}
                    className="flex-1 min-h-[44px] py-2.5 px-4 rounded-full bg-[#1C1C1E] dark:bg-white hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 text-white dark:text-[#09090b] text-[13px] font-semibold transition active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Dar baixa · {formatBRL(selectedEvent.totalCents)}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateState((prev) => ({
                        ...prev,
                        lastToastMessage: `Comprovante de ${selectedEvent.clientName} enviado com sucesso!`,
                      }));
                      setSelectedEvent(null);
                    }}
                    aria-label={`Enviar comprovante para ${selectedEvent.clientName}`}
                    className="flex-1 min-h-[44px] py-2.5 px-4 rounded-full bg-[#1C1C1E] dark:bg-white hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 text-white dark:text-[#09090b] text-[13px] font-semibold transition active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Enviar comprovante</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* =====================================================================
          MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE AGENDAMENTO (Anti-AI Slop)
         ===================================================================== */}
      {eventToDelete && (() => {
        const isCompletedEvent = eventToDelete.status === "completed";

        return (
          <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-[440px] bg-white dark:bg-[#18181b] rounded-2xl border border-[#E5E5EA] dark:border-[#27272a] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] text-[#1C1C1E] dark:text-white flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white leading-tight">
                    Excluir Agendamento
                  </h3>
                  <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] mt-1">
                    Esta ação afetará o agendamento de {eventToDelete.clientName}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEventToDelete(null)}
                  className="w-8 h-8 rounded-full border border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Event Summary Card */}
              <div className="p-3.5 rounded-[14px] bg-[#FAFAFC] dark:bg-[#27272a]/30 border border-[#E5E5EA] dark:border-[#27272a] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-[#1C1C1E] dark:text-white truncate">
                    {eventToDelete.clientName}
                  </span>
                  <span className="font-mono text-[12px] font-bold text-[#1C1C1E] dark:text-white shrink-0">
                    {formatBRL(eventToDelete.totalCents)}
                  </span>
                </div>
                <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] truncate">
                  {eventToDelete.serviceNames.join(" + ")} · {eventToDelete.providerName}
                </p>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E5EA]/70 dark:border-[#27272a] text-[11.5px]">
                  <span className="text-[#6E6E73] dark:text-[#a1a1aa]">
                    {formatDateBR(eventToDelete.dateISO)} às {eventToDelete.startTime} – {eventToDelete.endTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] text-[10.5px] font-medium text-[#1C1C1E] dark:text-zinc-200">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCompletedEvent
                          ? "bg-slate-400"
                          : eventToDelete.status === "confirmed"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                    {isCompletedEvent
                      ? "Realizado"
                      : eventToDelete.status === "confirmed"
                      ? "Confirmado"
                      : "Pendente"}
                  </span>
                </div>
              </div>

              {/* Mode Options */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white">
                  Escolha como deseja prosseguir:
                </label>
                <div className="space-y-2">
                  <label
                    onClick={() => setDeleteMode("delete")}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                      deleteMode === "delete"
                        ? "bg-[#FAFAFC] dark:bg-[#27272a]/50 border-[#1C1C1E] dark:border-white ring-1 ring-[#1C1C1E] dark:ring-white"
                        : "border-[#E5E5EA] dark:border-[#27272a] hover:bg-[#FAFAFC] dark:hover:bg-[#27272a]/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={deleteMode === "delete"}
                      onChange={() => setDeleteMode("delete")}
                      className="mt-0.5 text-[#1C1C1E] focus:ring-0 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold text-[#1C1C1E] dark:text-white">
                        Excluir definitivamente da agenda
                      </p>
                      <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                        Remove completamente o agendamento da grade e libera o horário do profissional.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setDeleteMode("cancel")}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                      deleteMode === "cancel"
                        ? "bg-[#FAFAFC] dark:bg-[#27272a]/50 border-[#1C1C1E] dark:border-white ring-1 ring-[#1C1C1E] dark:ring-white"
                        : "border-[#E5E5EA] dark:border-[#27272a] hover:bg-[#FAFAFC] dark:hover:bg-[#27272a]/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={deleteMode === "cancel"}
                      onChange={() => setDeleteMode("cancel")}
                      className="mt-0.5 text-[#1C1C1E] focus:ring-0 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold text-[#1C1C1E] dark:text-white">
                        Apenas marcar como cancelado
                      </p>
                      <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                        Desocupa o horário da agenda mantendo o registro no histórico de cancelamentos do estúdio.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEventToDelete(null)}
                  className="px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#3F3F46] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] text-[12.5px] font-medium transition"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[12.5px] font-semibold transition shadow-sm"
                >
                  {deleteMode === "delete" ? "Excluir definitivamente" : "Confirmar cancelamento"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =====================================================================
          MODAL: REAGENDAMENTO DE ATENDIMENTO (Mecânica Completa)
         ===================================================================== */}
      {rescheduleEvent && (() => {
        const client = state.clients.find((c) => c.id === rescheduleEvent.clientId);
        const provider =
          state.staff.find((s) => s.id === rescheduleProviderId) ||
          state.staff.find(
            (s) =>
              s.fullName.trim().toLowerCase() ===
              rescheduleProviderId.trim().toLowerCase()
          ) ||
          state.staff[0];
        const todayISO = getTodayDateISO();
        const tomorrowISO = addDaysToDateISO(todayISO, 1);
        const plus2DaysISO = addDaysToDateISO(todayISO, 2);
        const plus7DaysISO = addDaysToDateISO(todayISO, 7);

        return (
          <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-[480px] bg-white dark:bg-[#18181b] rounded-2xl border border-[#E5E5EA] dark:border-[#27272a] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
                    Reagendar Atendimento
                  </h2>
                  <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                    Defina a nova data e horário para {rescheduleEvent.clientName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRescheduleEvent(null)}
                  className="w-8 h-8 rounded-full border border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-4">
                {/* Card Resumo do Atendimento Atual */}
                <div className="p-3.5 rounded-[14px] bg-[#FAFAFC] dark:bg-[#27272a]/30 border border-[#E5E5EA] dark:border-[#27272a] space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-bold text-[#1C1C1E] dark:text-white">
                      {rescheduleEvent.clientName}
                    </span>
                    <span className="font-mono text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      {formatBRL(rescheduleEvent.totalCents)}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa]">
                    {rescheduleEvent.serviceNames.join(" + ")} · {rescheduleDurationMinutes} min
                  </p>
                  <div className="pt-1.5 border-t border-[#E5E5EA]/70 dark:border-[#27272a] flex items-center gap-1.5 text-[11px] text-[#8E8E93] dark:text-[#71717a]">
                    <span>Horário original:</span>
                    <span className="font-medium text-[#1C1C1E] dark:text-zinc-300">
                      {formatDateBR(rescheduleEvent.dateISO)} às {rescheduleEvent.startTime} – {rescheduleEvent.endTime} ({rescheduleEvent.providerName})
                    </span>
                  </div>
                </div>

                {/* Seleção de Data com Atalhos Rápidos */}
                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white">
                    Nova Data
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: "Hoje", val: todayISO },
                      { label: "Amanhã", val: tomorrowISO },
                      { label: "+2 dias", val: plus2DaysISO },
                      { label: "Próx. semana", val: plus7DaysISO },
                    ].map((shortcut) => {
                      const isSelected = rescheduleDateISO === shortcut.val;
                      return (
                        <button
                          key={shortcut.label}
                          type="button"
                          onClick={() => setRescheduleDateISO(shortcut.val)}
                          className={`px-3 py-1.5 rounded-full text-[11.5px] font-medium transition ${
                            isSelected
                              ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] shadow-xs"
                              : "border border-[#D4D4D8] dark:border-[#3F3F46] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#3F3F46]"
                          }`}
                        >
                          {shortcut.label}
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <EditorialDatePicker
                      label="Nova data"
                      placeholder="Selecione a nova data..."
                      value={rescheduleDateISO}
                      onChange={(val) => setRescheduleDateISO(val)}
                      minDateISO={todayDateISO}
                      lockPastDates={true}
                    />
                  </div>
                </div>

                {/* Seleção de Horário de Início */}
                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white">
                    Novo Horário de Início
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map((h) => {
                      const isSelected = rescheduleStartTime === h;
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setRescheduleStartTime(h)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition ${
                            isSelected
                              ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b]"
                              : "border border-[#E5E5EA] dark:border-[#3F3F46] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7]"
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={rescheduleStartTime}
                      onChange={(e) => setRescheduleStartTime(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#3F3F46] text-[13px] font-mono text-[#1C1C1E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1C1C1E]"
                    />
                    <div className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] shrink-0 font-medium">
                      Até <span className="font-mono font-bold text-[#1C1C1E] dark:text-white">{computedRescheduleEndTime}</span> ({rescheduleDurationMinutes} min)
                    </div>
                  </div>
                </div>

                {/* Profissional */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white">
                    Profissional Responsável
                  </label>
                  <DropdownSelect
                    value={rescheduleProviderId}
                    onChange={(val) => setRescheduleProviderId(val)}
                    options={state.staff.map((st) => ({
                      value: st.id,
                      label: `${st.initials} · ${st.fullName}`,
                      sublabel: st.role,
                    }))}
                  />
                </div>

                {/* Feedback de Conflito / Disponibilidade */}
                {rescheduleConflictWarning ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2 text-[11.5px] text-amber-900 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Possível conflito de horário</p>
                      <p className="mt-0.5 opacity-90">{rescheduleConflictWarning}</p>
                      <p className="text-[11px] mt-1 opacity-75">
                        Você pode confirmar para forçar o encaixe na grade ou escolher outro horário.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 rounded-xl bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3F3F46] flex items-center gap-2 text-[12px] text-[#1C1C1E] dark:text-zinc-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                    <span>Horário disponível para {provider.fullName}</span>
                  </div>
                )}

                {/* Notificação WhatsApp */}
                <div className="p-3.5 rounded-xl border border-[#E5E5EA] dark:border-[#27272a] bg-[#FAFAFC] dark:bg-[#27272a]/20 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rescheduleNotifyWhatsapp}
                      onChange={(e) => setRescheduleNotifyWhatsapp(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1C1C1E] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[12px] font-semibold text-[#1C1C1E] dark:text-white">
                      Notificar cliente no WhatsApp sobre a nova data
                    </span>
                  </label>
                  {client?.phone ? (
                    <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa] pl-6">
                      Envia confirmação interativa para {client.phone} com opção 1 para confirmar.
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#8E8E93] dark:text-[#71717a] pl-6">
                      Cliente sem telefone cadastrado. O agendamento será atualizado diretamente na agenda.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleMarkAwaitingReschedule}
                  className="text-[11.5px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] dark:text-[#a1a1aa] dark:hover:text-white transition"
                >
                  Apenas marcar pendente
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRescheduleEvent(null)}
                    className="px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#3F3F46] bg-white dark:bg-[#27272a] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] text-[12.5px] font-medium transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmReschedule(Boolean(rescheduleConflictWarning))}
                    className="px-5 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] hover:bg-black dark:hover:bg-zinc-200 text-[12.5px] font-semibold transition shadow-sm"
                  >
                    Confirmar Reagendamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =====================================================================
          DRAWER 4: CONFIGURAÇÕES DE EXIBIÇÃO DA AGENDA (media_1793017669411_09e3485d.png)
         ===================================================================== */}
      {calendarSettingsDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex justify-end animate-in fade-in duration-150"
          onClick={() => setCalendarSettingsDrawerOpen(false)}
        >
          <div
            className="w-full max-w-[420px] bg-white dark:bg-[#18181b] h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 border-l border-[#E5E5EA] dark:border-[#27272a]"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-between">
                <h2 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white tracking-tight">
                  Configurações de exibição da agenda
                </h2>
                <button
                  type="button"
                  onClick={() => setCalendarSettingsDrawerOpen(false)}
                  title="Fechar"
                  aria-label="Fechar configurações"
                  className="w-8 h-8 rounded-full border border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6">
                {/* Seção 1: Agendamentos com múltiplos serviços */}
                <div>
                  <h3 className="text-[13.5px] font-semibold text-[#1C1C1E] dark:text-white mb-3">
                    Agendamentos com múltiplos serviços
                  </h3>
                  <div className="space-y-2.5">
                    {/* Card 1: Card único */}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateState((prev) => ({
                          ...prev,
                          calendarView: {
                            ...prev.calendarView,
                            multiServiceDisplayMode: "single_card",
                          },
                        }))
                      }
                      className={`w-full p-4 rounded-2xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
                        multiServiceDisplayMode === "single_card"
                          ? "border-[#1C1C1E] dark:border-white bg-[#F9F9FB] dark:bg-[#27272a]/70 shadow-2xs"
                          : "border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]/40"
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                          multiServiceDisplayMode === "single_card"
                            ? "border-[#1C1C1E] dark:border-white"
                            : "border-[#D4D4D8] dark:border-[#52525b]"
                        }`}
                      >
                        {multiServiceDisplayMode === "single_card" && (
                          <div className="w-2 h-2 rounded-full bg-[#1C1C1E] dark:bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white leading-tight">
                          Card único
                        </p>
                        <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] mt-1 leading-normal">
                          Mostra todos os serviços de um agendamento em um único card na agenda.
                        </p>
                      </div>
                    </button>

                    {/* Card 2: Múltiplos cards */}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateState((prev) => ({
                          ...prev,
                          calendarView: {
                            ...prev.calendarView,
                            multiServiceDisplayMode: "multiple_cards",
                          },
                        }))
                      }
                      className={`w-full p-4 rounded-2xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
                        multiServiceDisplayMode === "multiple_cards"
                          ? "border-[#1C1C1E] dark:border-white bg-[#F9F9FB] dark:bg-[#27272a]/70 shadow-2xs"
                          : "border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]/40"
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                          multiServiceDisplayMode === "multiple_cards"
                            ? "border-[#1C1C1E] dark:border-white"
                            : "border-[#D4D4D8] dark:border-[#52525b]"
                        }`}
                      >
                        {multiServiceDisplayMode === "multiple_cards" && (
                          <div className="w-2 h-2 rounded-full bg-[#1C1C1E] dark:bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white leading-tight">
                          Múltiplos cards
                        </p>
                        <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] mt-1 leading-normal">
                          Mostra todos os serviços de um agendamento como cards separados na agenda.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Seção 2: Horários visíveis */}
                <div>
                  <h3 className="text-[13.5px] font-semibold text-[#1C1C1E] dark:text-white">
                    Horários visíveis
                  </h3>
                  <p className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5 mb-3.5">
                    Escolha quais horários ficam visíveis na sua agenda.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Início (Start) */}
                    <div>
                      <DropdownSelect
                        label="Início"
                        value={visibleStartHour}
                        onChange={(val) => {
                          const numVal = Number(val);
                          onUpdateState((prev) => ({
                            ...prev,
                            calendarView: {
                              ...prev.calendarView,
                              visibleStartHour: numVal,
                              visibleEndHour:
                                numVal >= visibleEndHour
                                  ? Math.min(23, numVal + 4)
                                  : visibleEndHour,
                            },
                          }));
                        }}
                        options={[5, 6, 7, 8, 9, 10, 11, 12].map((h) => ({
                          value: h,
                          label: `${formatHour12(h).toUpperCase()} (${String(h).padStart(2, "0")}:00)`,
                        }))}
                      />
                    </div>

                    {/* Fim (End) */}
                    <div>
                      <DropdownSelect
                        label="Fim"
                        value={visibleEndHour}
                        onChange={(val) => {
                          const numVal = Number(val);
                          onUpdateState((prev) => ({
                            ...prev,
                            calendarView: {
                              ...prev.calendarView,
                              visibleEndHour: numVal,
                              visibleStartHour:
                                numVal <= visibleStartHour
                                  ? Math.max(5, numVal - 4)
                                  : visibleStartHour,
                            },
                          }));
                        }}
                        options={[16, 17, 18, 19, 20, 21, 22, 23].map((h) => ({
                          value: h,
                          label: `${formatHour12(h).toUpperCase()} (${String(h).padStart(2, "0")}:00)`,
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-[#E5E5EA] dark:border-[#27272a] bg-[#FAFAFC] dark:bg-[#18181b] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    calendarView: {
                      ...prev.calendarView,
                      visibleStartHour: 7,
                      visibleEndHour: 20,
                      multiServiceDisplayMode: "multiple_cards",
                    },
                  }))
                }
                className="text-[12.5px] font-medium text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white transition cursor-pointer"
              >
                Restaurar padrões
              </button>
              <button
                type="button"
                onClick={() => setCalendarSettingsDrawerOpen(false)}
                className="px-5 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[13px] font-semibold hover:bg-[#2C2C2E] dark:hover:bg-zinc-200 transition shadow-sm cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet Modal for Fila de Baixa */}
      {pendingCheckoutPopoverOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setPendingCheckoutPopoverOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white dark:bg-[#18181b] rounded-t-3xl border-t border-[#E5E5EA] dark:border-[#27272a] shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Fila de Baixa Financeira"
          >
            <div className="w-10 h-1 bg-[#D1D1D6] dark:bg-zinc-700 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />
            {renderPendingCheckoutContent()}
          </div>
        </div>
      )}
    </div>
  );
}
