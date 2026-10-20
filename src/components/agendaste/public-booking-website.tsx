"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Home,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  QrCode,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react";
import {
  StudioState,
  BookingSiteThemeId,
  WebsiteBookingSetupConfig,
  formatBRL,
  bookFromPublicSite,
  getDefaultWebsiteBookingConfig,
} from "@/lib/agendaste-store";

interface PublicBookingWebsiteProps {
  state: StudioState;
  onUpdateState?: (updater: StudioState | ((prev: StudioState) => StudioState)) => void;
  onClose?: () => void;
  isModal?: boolean;
}

// 6 Temas Editoriais de Luxo
const THEME_STYLES: Record<
  BookingSiteThemeId,
  {
    bg: string;
    text: string;
    textMuted: string;
    cardBg: string;
    cardBorder: string;
    accentBtn: string;
    accentBtnHover: string;
    badgeBg: string;
    badgeText: string;
    fontFamily: string;
  }
> = {
  classic: {
    bg: "bg-[#0A1A14]",
    text: "text-[#F8F9FA]",
    textMuted: "text-emerald-100/70",
    cardBg: "bg-[#0F261E]/90",
    cardBorder: "border-emerald-800/40",
    accentBtn: "bg-emerald-400 text-[#0A1A14]",
    accentBtnHover: "hover:bg-emerald-300",
    badgeBg: "bg-emerald-950/60",
    badgeText: "text-emerald-300",
    fontFamily: "font-serif",
  },
  billboard: {
    bg: "bg-[#18181B]",
    text: "text-white",
    textMuted: "text-zinc-400",
    cardBg: "bg-[#27272A]/80",
    cardBorder: "border-zinc-700/60",
    accentBtn: "bg-white text-black",
    accentBtnHover: "hover:bg-zinc-200",
    badgeBg: "bg-zinc-800",
    badgeText: "text-zinc-200",
    fontFamily: "font-mono",
  },
  canvas: {
    bg: "bg-[#FAFAFA]",
    text: "text-[#18181B]",
    textMuted: "text-zinc-500",
    cardBg: "bg-white",
    cardBorder: "border-zinc-200",
    accentBtn: "bg-[#18181B] text-white",
    accentBtnHover: "hover:bg-black",
    badgeBg: "bg-zinc-100",
    badgeText: "text-zinc-800",
    fontFamily: "font-sans",
  },
  energy: {
    bg: "bg-[#100B20]",
    text: "text-white",
    textMuted: "text-purple-200/70",
    cardBg: "bg-[#1C1438]/90",
    cardBorder: "border-purple-800/50",
    accentBtn: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
    accentBtnHover: "hover:opacity-95",
    badgeBg: "bg-purple-950/70",
    badgeText: "text-pink-300",
    fontFamily: "font-sans",
  },
  organic: {
    bg: "bg-[#F7F4EE]",
    text: "text-[#242A24]",
    textMuted: "text-[#5A6359]",
    cardBg: "bg-[#EFEAE1]/90",
    cardBorder: "border-[#D9D1C1]",
    accentBtn: "bg-[#2D4030] text-[#F7F4EE]",
    accentBtnHover: "hover:bg-[#1E2B20]",
    badgeBg: "bg-[#E2DDD2]",
    badgeText: "text-[#2D4030]",
    fontFamily: "font-serif",
  },
  play: {
    bg: "bg-[#F3F4F6]",
    text: "text-[#0F172A]",
    textMuted: "text-slate-500",
    cardBg: "bg-white",
    cardBorder: "border-slate-200 shadow-sm",
    accentBtn: "bg-[#2563EB] text-white",
    accentBtnHover: "hover:bg-blue-700",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    fontFamily: "font-sans",
  },
};

export function PublicBookingWebsite({
  state,
  onUpdateState,
  onClose,
  isModal = false,
}: PublicBookingWebsiteProps) {
  const websiteConfig: WebsiteBookingSetupConfig =
    state.settings.website ??
    getDefaultWebsiteBookingConfig(state.settings.business.businessName);

  const themeId = websiteConfig.theme || "classic";
  const theme = THEME_STYLES[themeId] ?? THEME_STYLES.classic;

  const businessName =
    state.settings.business.businessName || "Luvea Studio & Estética";

  // Category filter for services
  const onlineServices = state.services.filter((s) => s.onlineBookingEnabled);
  const categories = useMemo(() => {
    const set = new Set<string>();
    onlineServices.forEach((s) => set.add(s.category || "Geral"));
    return ["Todos", ...Array.from(set)];
  }, [onlineServices]);

  const [activeCategory, setActiveCategory] = useState("Todos");
  const filteredServices = useMemo(() => {
    if (activeCategory === "Todos") return onlineServices;
    return onlineServices.filter((s) => (s.category || "Geral") === activeCategory);
  }, [onlineServices, activeCategory]);

  // Booking Flow Drawer / Modal State
  const [selectedService, setSelectedService] = useState<typeof onlineServices[0] | null>(null);
  const [selectedDateISO, setSelectedDateISO] = useState<string>("2026-10-19");
  const [selectedTime, setSelectedTime] = useState<string>("10:00");
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    state.staff[0]?.id || ""
  );

  // Client Details
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // Card on file form
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Pix state
  const [pixPayload, setPixPayload] = useState<string | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Booking status & confirmation
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<"service_time" | "guarantee" | "success">("service_time");

  // Calculate day-of-week for selected date
  const dayOfWeekSchedule = useMemo(() => {
    if (!selectedDateISO) return null;
    const [y, m, d] = selectedDateISO.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dow = dt.getUTCDay();
    return websiteConfig.businessHours.find((h) => h.dayOfWeek === dow) || null;
  }, [selectedDateISO, websiteConfig.businessHours]);

  // Generate available time slots for the chosen day
  const availableTimeSlots = useMemo(() => {
    if (!dayOfWeekSchedule || !dayOfWeekSchedule.isOpen) return [];
    const [startH, startM] = dayOfWeekSchedule.startTime.split(":").map(Number);
    const [endH, endM] = dayOfWeekSchedule.endTime.split(":").map(Number);
    const openMin = startH * 60 + startM;
    const closeMin = endH * 60 + endM;

    const duration = selectedService?.durationMinutes ?? 60;
    const slots: string[] = [];

    // Increment in 30-min steps
    for (let m = openMin; m + duration <= closeMin; m += 30) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
    return slots;
  }, [dayOfWeekSchedule, selectedService]);

  // Open booking drawer for a specific service
  const handleStartBooking = (srv: typeof onlineServices[0]) => {
    setSelectedService(srv);
    setBookingError(null);
    setBookingStep("service_time");

    // Auto-pick first available time
    if (availableTimeSlots.length > 0) {
      setSelectedTime(availableTimeSlots[0]);
    }
  };

  // Generate Pix Payload
  const handleGeneratePix = async () => {
    if (!selectedService) return;
    setIsGeneratingPix(true);
    setBookingError(null);

    const depositCents = selectedService.requireDeposit
      ? selectedService.depositCents
      : Math.round(selectedService.priceCents * 0.3);

    try {
      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: `luvea-online-${Date.now()}`,
          clientName: clientName || "Cliente Online",
          clientEmail: clientEmail || "cliente@luvea.app",
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          depositCents,
        }),
      });
      const data = await res.json();
      setPixPayload(
        data.qrCodePayload ||
          "00020126580014BR.GOV.BCB.PIX0136pix@luvea.app5204000053039865802BR5920LUVEA6009SAO PAULO62070503***6304ABCD"
      );
    } catch {
      setPixPayload(
        "00020126580014BR.GOV.BCB.PIX0136pix@luvea.app5204000053039865802BR5920LUVEA6009SAO PAULO62070503***6304ABCD"
      );
    } finally {
      setIsGeneratingPix(false);
    }
  };

  // Submit final booking
  const handleFinalizeBooking = () => {
    if (!selectedService) return;
    setBookingError(null);

    if (!clientName.trim() || !clientPhone.trim()) {
      setBookingError("Por favor, preencha seu nome e WhatsApp.");
      return;
    }

    const guarantee = websiteConfig.onlineBookingGuarantee;
    const isPix = guarantee === "pix_deposit";

    const result = bookFromPublicSite(state, {
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || "contato@luvea.app",
      clientPhone: clientPhone.trim(),
      serviceId: selectedService.id,
      providerId: selectedProviderId,
      dateISO: selectedDateISO,
      startTime: selectedTime,
      selectedAddOnIds: [],
      depositPaidViaPix: isPix ? true : false,
      cardOnFile:
        guarantee === "card_on_file"
          ? {
              last4: cardNumber.replace(/\D/g, "").slice(-4) || "4242",
              cardHolder: cardHolder || clientName,
            }
          : undefined,
    });

    if (!result.ok) {
      setBookingError(result.error);
      return;
    }

    if (onUpdateState) {
      onUpdateState(result.state);
    }

    const createdEvt = result.state.calendarEvents[0];
    setConfirmedBookingId(createdEvt?.id ?? `res-${Date.now()}`);
    setBookingStep("success");
  };

  return (
    <div
      className={`w-full min-h-screen ${theme.bg} ${theme.text} transition-colors duration-200 ${
        isModal ? "relative" : ""
      }`}
    >
      {/* Optional Top Modal Bar if displayed inside app overlay */}
      {isModal && (
        <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/10 px-6 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider font-mono text-emerald-400">
              ● Site de Agendamento Online
            </span>
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
              {websiteConfig.subdomainSlug}.luvea.app
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </header>
      )}

      {/* Main Public Website Content */}
      <div className="max-w-5xl mx-auto px-6 py-10 sm:py-16 space-y-16">
        {/* Hero Header */}
        <div className="space-y-6 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border border-current opacity-80">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Agendamento Online Instantâneo</span>
          </div>

          <h1 className={`text-4xl sm:text-6xl font-extrabold tracking-tight ${theme.fontFamily}`}>
            {businessName}
          </h1>

          {/* Location & House Calls Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
            {websiteConfig.hasFixedAddress && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
                <MapPin className="w-4 h-4 shrink-0" />
                <span>
                  {websiteConfig.addressLine1}, {websiteConfig.city} - {websiteConfig.state}
                </span>
              </div>
            )}
            {websiteConfig.doesHouseCalls && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
                <Home className="w-4 h-4 shrink-0" />
                <span>Atendimento a domicílio disponível</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Anchors */}
        <div className="flex items-center justify-center gap-6 text-xs sm:text-sm font-semibold border-b border-current/10 pb-4">
          <a href="#servicos" className="hover:opacity-75 transition-opacity">
            Serviços
          </a>
          <a href="#horarios" className="hover:opacity-75 transition-opacity">
            Horários de Atendimento
          </a>
          <a href="#pagamentos" className="hover:opacity-75 transition-opacity">
            Pagamentos
          </a>
        </div>

        {/* Services Section */}
        <section id="servicos" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${theme.fontFamily}`}>
                Menu de Serviços
              </h2>
              <p className={`text-xs sm:text-sm ${theme.textMuted}`}>
                Escolha o procedimento desejado para reservar seu horário em 30 segundos.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? `${theme.accentBtn} shadow-xs`
                      : `${theme.badgeBg} ${theme.badgeText} hover:opacity-80`
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`p-5 rounded-2xl border ${theme.cardBg} ${theme.cardBorder} flex flex-col justify-between transition-all hover:shadow-md`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-base sm:text-lg leading-snug">
                      {service.name}
                    </h3>
                    <span className="font-mono font-bold text-sm sm:text-base shrink-0">
                      {formatBRL(service.priceCents)}
                    </span>
                  </div>

                  <p className={`text-xs sm:text-sm ${theme.textMuted} line-clamp-2`}>
                    {service.description || "Procedimento profissional de excelência."}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-current/10 flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 text-xs ${theme.textMuted} font-mono`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{service.durationMinutes} min</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartBooking(service)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold ${theme.accentBtn} ${theme.accentBtnHover} transition-colors inline-flex items-center gap-1.5`}
                  >
                    <span>Agendar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Business Hours & Location Section */}
        <section id="horarios" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          {/* Operating Hours Card */}
          <div className={`p-6 rounded-2xl border ${theme.cardBg} ${theme.cardBorder} space-y-4`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <h3 className={`font-bold text-lg ${theme.fontFamily}`}>
                Horários de Atendimento
              </h3>
            </div>
            <div className="space-y-2 divide-y divide-current/10 text-xs sm:text-sm">
              {websiteConfig.businessHours.map((schedule) => (
                <div key={schedule.dayOfWeek} className="pt-2 flex items-center justify-between">
                  <span className="font-medium">{schedule.label}</span>
                  <span className={`font-mono ${schedule.isOpen ? "" : "text-zinc-500 italic"}`}>
                    {schedule.isOpen
                      ? `${schedule.startTime} às ${schedule.endTime}`
                      : "Fechado"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Location & Guarantee Information */}
          <div id="pagamentos" className={`p-6 rounded-2xl border ${theme.cardBg} ${theme.cardBorder} space-y-5 flex flex-col justify-between`}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className={`font-bold text-lg ${theme.fontFamily}`}>
                  Formas de Pagamento & Garantia
                </h3>
              </div>

              <p className={`text-xs sm:text-sm ${theme.textMuted} leading-relaxed`}>
                Garantimos a melhor experiência para clientes e profissionais.
                {websiteConfig.onlineBookingGuarantee === "pix_deposit" && (
                  <> Reservas online utilizam Sinal via Pix Dinâmico de 30% para reserva do horário, com o saldo restante pago na recepção.</>
                )}
                {websiteConfig.onlineBookingGuarantee === "card_on_file" && (
                  <> Reservas online exigem cartão em arquivo para proteção contra faltas (no-show). Nenhuma cobrança é realizada agora; o valor é pago no atendimento.</>
                )}
                {websiteConfig.onlineBookingGuarantee === "none" && (
                  <> Agende seu horário instantaneamente sem cobrança antecipada. Pagamento realizado na finalização do procedimento.</>
                )}
              </p>

              <div className="flex items-center gap-4 text-xs font-semibold pt-2">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-500" />
                  <span>Pix Dinâmico</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-purple-500" />
                  <span>Cartões de Crédito e Débito</span>
                </div>
              </div>
            </div>

            {websiteConfig.hasFixedAddress && (
              <div className="pt-4 border-t border-current/10 text-xs space-y-1">
                <p className="font-bold">Endereço:</p>
                <p className={theme.textMuted}>
                  {websiteConfig.addressLine1}
                  {websiteConfig.addressLine2 ? `, ${websiteConfig.addressLine2}` : ""}
                  {" — "}{websiteConfig.city}/{websiteConfig.state} • CEP {websiteConfig.zipCode}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className={`pt-8 border-t border-current/10 text-center text-xs ${theme.textMuted} space-y-2`}>
          <p>© {new Date().getFullYear()} {businessName}. Todos os direitos reservados.</p>
          <p className="text-[11px] opacity-75">
            Desenvolvido sobre a plataforma LUVEA • Edição Brasil
          </p>
        </footer>
      </div>

      {/* =======================================================================
          BOOKING MODAL / DRAWER
      ======================================================================= */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-zinc-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-zinc-500">
                  Reserva Online
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                  {selectedService.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                  {selectedService.durationMinutes} minutos • {formatBRL(selectedService.priceCents)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {bookingError && (
              <div className="p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-xs flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* STEP 1: SERVICE & TIME */}
            {bookingStep === "service_time" && (
              <div className="space-y-4">
                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono text-zinc-700 mb-1.5">
                    Data do Agendamento
                  </label>
                  <input
                    type="date"
                    value={selectedDateISO}
                    onChange={(e) => setSelectedDateISO(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
                  />
                  {dayOfWeekSchedule && !dayOfWeekSchedule.isOpen && (
                    <p className="text-xs text-red-600 mt-1">
                      O estúdio não realiza atendimentos em {dayOfWeekSchedule.label.toLowerCase()}s. Escolha outro dia.
                    </p>
                  )}
                </div>

                {/* Available Slots */}
                {dayOfWeekSchedule?.isOpen && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono text-zinc-700 mb-1.5">
                      Horário Disponível ({dayOfWeekSchedule.startTime} às {dayOfWeekSchedule.endTime})
                    </label>
                    {availableTimeSlots.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">
                        Nenhum horário disponível para a duração deste procedimento neste dia.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto pr-1">
                        {availableTimeSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                              selectedTime === slot
                                ? "bg-zinc-900 text-white shadow-xs"
                                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Client Contact Inputs */}
                <div className="pt-2 border-t border-zinc-100 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Fernanda Lima"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        WhatsApp *
                      </label>
                      <input
                        type="text"
                        placeholder="(11) 98765-4321"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        placeholder="cliente@exemplo.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Next Button */}
                <div className="pt-3">
                  <button
                    type="button"
                    disabled={!dayOfWeekSchedule?.isOpen || !clientName.trim() || !clientPhone.trim()}
                    onClick={() => {
                      if (websiteConfig.onlineBookingGuarantee === "none") {
                        handleFinalizeBooking();
                      } else {
                        setBookingStep("guarantee");
                        if (websiteConfig.onlineBookingGuarantee === "pix_deposit") {
                          handleGeneratePix();
                        }
                      }
                    }}
                    className="w-full py-3 rounded-full bg-zinc-900 text-white text-xs sm:text-sm font-semibold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {websiteConfig.onlineBookingGuarantee === "none"
                      ? "Confirmar Agendamento"
                      : "Avançar para Garantia de Horário"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: GUARANTEE (PIX OR CARD ON FILE) */}
            {bookingStep === "guarantee" && (
              <div className="space-y-4">
                {/* Pix Deposit Mode */}
                {websiteConfig.onlineBookingGuarantee === "pix_deposit" && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-emerald-600" />
                        Sinal de Reserva via Pix Dinâmico Anti-No-Show
                      </p>
                      <p className="text-[11.5px] leading-relaxed text-emerald-800">
                        Pague o sinal de <strong>{formatBRL(selectedService.requireDeposit ? selectedService.depositCents : Math.round(selectedService.priceCents * 0.3))}</strong> para garantir seu horário. O saldo de <strong>{formatBRL(selectedService.priceCents - (selectedService.requireDeposit ? selectedService.depositCents : Math.round(selectedService.priceCents * 0.3)))}</strong> será pago no dia do procedimento.
                      </p>
                    </div>

                    {isGeneratingPix ? (
                      <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                        Gerando Pix Copia e Cola instantâneo...
                      </div>
                    ) : pixPayload ? (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider font-mono text-zinc-500">
                          Pix Copia e Cola
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={pixPayload}
                            className="flex-1 px-3 py-2 rounded-xl bg-zinc-100 text-xs font-mono border border-zinc-200 select-all"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(pixPayload);
                              setCopiedPix(true);
                              setTimeout(() => setCopiedPix(false), 2000);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-black inline-flex items-center gap-1.5 shrink-0"
                          >
                            {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedPix ? "Copiado!" : "Copiar"}</span>
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleFinalizeBooking}
                      className="w-full py-3 rounded-full bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Já realizei o Pix · Confirmar Reserva
                    </button>
                  </div>
                )}

                {/* Card on file mode */}
                {websiteConfig.onlineBookingGuarantee === "card_on_file" && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-purple-600" />
                        Cartão Obrigatório em Arquivo
                      </p>
                      <p className="text-[11.5px] leading-relaxed text-zinc-600">
                        Nenhuma cobrança é realizada neste momento. O cartão é mantido de forma segura apenas como garantia contra faltas sem aviso prévio. O pagamento de {formatBRL(selectedService.priceCents)} será feito ao concluir seu atendimento.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Número do Cartão
                      </label>
                      <input
                        type="text"
                        placeholder="•••• •••• •••• 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Validade
                        </label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleFinalizeBooking}
                      className="w-full mt-2 py-3 rounded-full bg-zinc-900 text-white text-xs sm:text-sm font-semibold hover:bg-black transition-colors"
                    >
                      Cadastrar Cartão & Confirmar Agendamento
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {bookingStep === "success" && (
              <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-zinc-900">
                    {websiteConfig.autoApproveAppointments
                      ? "Agendamento Confirmado!"
                      : "Solicitação Enviada com Sucesso!"}
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    {websiteConfig.autoApproveAppointments
                      ? `Seu horário foi reservado para ${selectedDateISO} às ${selectedTime}. Enviamos a confirmação para seu WhatsApp (${clientPhone}).`
                      : `Sua solicitação para ${selectedDateISO} às ${selectedTime} foi encaminhada para aprovação pelo profissional.`}
                  </p>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl text-xs font-mono text-zinc-600 max-w-xs mx-auto">
                  Código da Reserva: {confirmedBookingId}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-6 py-2.5 rounded-full bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-colors"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
