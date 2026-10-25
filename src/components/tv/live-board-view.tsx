"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { CheckCircle2, Calendar, Volume2, VolumeX } from "lucide-react";
import {
  TVPollingResponse,
  TVAppointmentDTO,
  TVProfessionalColumn,
  TVThemeMode,
  TVScreenSize,
  paginateProfessionals,
} from "@/lib/tv-kiosk";

interface LiveBoardViewProps {
  token: string;
  onUnauthorized: () => void;
}

export interface TVThemePalette {
  id: TVThemeMode;
  name: string;
  badgeName: string;
  bgRoot: string;
  headerBorder: string;
  footerBorder: string;
  brandTitle: string;
  brandSubtitle: string;
  clockText: string;
  dateText: string;
  syncOnlineText: string;
  syncOnlineDot: string;
  syncOnlinePing: string;
  syncOfflineText: string;
  syncOfflineDot: string;
  cardActive: string;
  cardNormal: string;
  cardBorderHighlight: string;
  cardHeaderDivider: string;
  avatarBg: string;
  avatarBorder: string;
  avatarText: string;
  profNameText: string;
  profStatusActive: string;
  profStatusNormal: string;
  labelMuted: string;
  clientNameText: string;
  serviceText: string;
  timeBoxBg: string;
  timeBoxBorder: string;
  timeText: string;
  progressTrackBg: string;
  progressBarBg: string;
  progressElapsedText: string;
  nextTimeText: string;
  nextClientText: string;
  nextServiceText: string;
  freeIconColor: string;
  freeTitleColor: string;
  freeDescColor: string;
  footerText: string;
  footerPillContainer: string;
  footerPillActive: string;
  footerPillInactive: string;
}

export const THEME_CONFIGS: Record<TVThemeMode, TVThemePalette> = {
  dark: {
    id: "dark",
    name: "Obsidian Escuro",
    badgeName: "Escuro",
    bgRoot: "bg-[#09090B] text-zinc-100",
    headerBorder: "border-white/[0.06]",
    footerBorder: "border-white/[0.06]",
    brandTitle: "text-white",
    brandSubtitle: "text-zinc-500",
    clockText: "text-white",
    dateText: "text-zinc-400",
    syncOnlineText: "text-emerald-400",
    syncOnlineDot: "bg-emerald-400 ring-2 ring-emerald-500/20",
    syncOnlinePing: "bg-emerald-400",
    syncOfflineText: "text-amber-300",
    syncOfflineDot: "bg-amber-400 ring-2 ring-amber-500/20",
    cardActive:
      "bg-[#0d1314]/95 border-emerald-500/40 ring-1 ring-emerald-500/25 shadow-[0_0_32px_rgba(16,185,129,0.12)]",
    cardNormal:
      "bg-[#0f0f13]/95 border-white/[0.08] shadow-[0_12px_32px_-10px_rgba(0,0,0,0.6)]",
    cardBorderHighlight:
      "ring-2 ring-emerald-400/60 shadow-[0_0_28px_rgba(52,211,153,0.35)]",
    cardHeaderDivider: "border-white/[0.06]",
    avatarBg: "bg-white/[0.06]",
    avatarBorder: "border-white/[0.12]",
    avatarText: "text-zinc-100",
    profNameText: "text-white",
    profStatusActive: "text-emerald-400",
    profStatusNormal: "text-zinc-400 font-medium",
    labelMuted: "text-zinc-400",
    clientNameText: "text-white",
    serviceText: "text-zinc-400",
    timeBoxBg: "bg-white/[0.03]",
    timeBoxBorder: "border-white/[0.06]",
    timeText: "text-white",
    progressTrackBg: "bg-white/[0.08]",
    progressBarBg: "bg-emerald-400",
    progressElapsedText: "text-zinc-400",
    nextTimeText: "text-zinc-300",
    nextClientText: "text-zinc-100",
    nextServiceText: "text-zinc-400",
    freeIconColor: "text-zinc-400",
    freeTitleColor: "text-white",
    freeDescColor: "text-zinc-400",
    footerText: "text-zinc-500",
    footerPillContainer: "bg-white/[0.04] border-white/[0.08]",
    footerPillActive: "bg-white text-black shadow-xs font-semibold",
    footerPillInactive: "text-zinc-400 hover:text-white",
  },
  light: {
    id: "light",
    name: "Editorial Claro",
    badgeName: "Claro",
    bgRoot: "bg-[#F5F6F8] text-zinc-900",
    headerBorder: "border-black/[0.08]",
    footerBorder: "border-black/[0.08]",
    brandTitle: "text-[#1C1C1E]",
    brandSubtitle: "text-zinc-500",
    clockText: "text-[#1C1C1E]",
    dateText: "text-zinc-600 font-medium",
    syncOnlineText: "text-emerald-700",
    syncOnlineDot: "bg-emerald-600 ring-2 ring-emerald-600/20",
    syncOnlinePing: "bg-emerald-500",
    syncOfflineText: "text-amber-700",
    syncOfflineDot: "bg-amber-600 ring-2 ring-amber-600/20",
    cardActive:
      "bg-white border-emerald-600/40 ring-1 ring-emerald-500/20 shadow-[0_8px_30px_rgba(5,150,105,0.08)]",
    cardNormal: "bg-white border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)]",
    cardBorderHighlight:
      "ring-2 ring-emerald-500/60 shadow-[0_0_24px_rgba(16,185,129,0.25)]",
    cardHeaderDivider: "border-black/[0.06]",
    avatarBg: "bg-zinc-100",
    avatarBorder: "border-black/[0.08]",
    avatarText: "text-zinc-800",
    profNameText: "text-zinc-900",
    profStatusActive: "text-emerald-700",
    profStatusNormal: "text-zinc-500 font-medium",
    labelMuted: "text-zinc-500",
    clientNameText: "text-zinc-950",
    serviceText: "text-zinc-600",
    timeBoxBg: "bg-zinc-50",
    timeBoxBorder: "border-zinc-200",
    timeText: "text-zinc-950",
    progressTrackBg: "bg-zinc-200",
    progressBarBg: "bg-emerald-600",
    progressElapsedText: "text-zinc-500",
    nextTimeText: "text-zinc-700",
    nextClientText: "text-zinc-900",
    nextServiceText: "text-zinc-600",
    freeIconColor: "text-zinc-500",
    freeTitleColor: "text-zinc-900",
    freeDescColor: "text-zinc-500",
    footerText: "text-zinc-500",
    footerPillContainer: "bg-black/[0.04] border-black/[0.08]",
    footerPillActive: "bg-[#1C1C1E] text-white shadow-xs font-semibold",
    footerPillInactive: "text-zinc-600 hover:text-zinc-950",
  },
  warm_brown: {
    id: "warm_brown",
    name: "Cacau & Âmbar",
    badgeName: "Marrom",
    bgRoot: "bg-[#14100E] text-[#F5EDE8]",
    headerBorder: "border-[#382820]/70",
    footerBorder: "border-[#382820]/70",
    brandTitle: "text-[#FBF7F4]",
    brandSubtitle: "text-[#A89487]",
    clockText: "text-[#FDFBF7]",
    dateText: "text-[#B8A496]",
    syncOnlineText: "text-[#E5A96A]",
    syncOnlineDot: "bg-[#E5A96A] ring-2 ring-[#E5A96A]/20",
    syncOnlinePing: "bg-[#E5A96A]",
    syncOfflineText: "text-amber-300",
    syncOfflineDot: "bg-amber-400 ring-2 ring-amber-500/20",
    cardActive:
      "bg-[#221915]/95 border-[#E5A96A]/50 ring-1 ring-[#E5A96A]/30 shadow-[0_0_36px_rgba(229,169,106,0.12)]",
    cardNormal:
      "bg-[#1C1512]/95 border-[#3D2C24]/80 shadow-[0_12px_36px_rgba(0,0,0,0.55)]",
    cardBorderHighlight:
      "ring-2 ring-[#E5A96A]/70 shadow-[0_0_28px_rgba(229,169,106,0.35)]",
    cardHeaderDivider: "border-[#382820]/70",
    avatarBg: "bg-[#2A201B]",
    avatarBorder: "border-[#47342B]",
    avatarText: "text-[#F5EDE8]",
    profNameText: "text-[#FDFBF7]",
    profStatusActive: "text-[#E5A96A]",
    profStatusNormal: "text-[#A89487] font-medium",
    labelMuted: "text-[#9E8A7D]",
    clientNameText: "text-[#FDFBF7]",
    serviceText: "text-[#C4B2A5]",
    timeBoxBg: "bg-[#16110F]",
    timeBoxBorder: "border-[#382820]",
    timeText: "text-[#FDFBF7]",
    progressTrackBg: "bg-[#33251E]",
    progressBarBg: "bg-[#E5A96A]",
    progressElapsedText: "text-[#A89487]",
    nextTimeText: "text-[#D4C3B6]",
    nextClientText: "text-[#FDFBF7]",
    nextServiceText: "text-[#B8A496]",
    freeIconColor: "text-[#A89487]",
    freeTitleColor: "text-[#FDFBF7]",
    freeDescColor: "text-[#A89487]",
    footerText: "text-[#8A776B]",
    footerPillContainer: "bg-white/[0.04] border-[#3D2C24]",
    footerPillActive: "bg-[#E5A96A] text-[#14100E] shadow-xs font-bold",
    footerPillInactive: "text-[#B8A496] hover:text-[#FDFBF7]",
  },
  noir_gold: {
    id: "noir_gold",
    name: "Noir Imperial & Gold",
    badgeName: "Noir Gold",
    bgRoot: "bg-[#050506] text-[#FAFAFA]",
    headerBorder: "border-[#26221A]",
    footerBorder: "border-[#26221A]",
    brandTitle: "text-[#FDF6E2]",
    brandSubtitle: "text-[#998F78]",
    clockText: "text-[#FDFBF7]",
    dateText: "text-[#D4AF37]/80",
    syncOnlineText: "text-[#E5B842]",
    syncOnlineDot: "bg-[#E5B842] ring-2 ring-[#E5B842]/25",
    syncOnlinePing: "bg-[#E5B842]",
    syncOfflineText: "text-amber-400",
    syncOfflineDot: "bg-amber-400 ring-2 ring-amber-500/25",
    cardActive:
      "bg-[#11100E]/95 border-[#D4AF37]/60 ring-1 ring-[#D4AF37]/30 shadow-[0_0_36px_rgba(212,175,55,0.18)]",
    cardNormal:
      "bg-[#0D0D0E]/95 border-[#28241D] shadow-[0_12px_40px_rgba(0,0,0,0.8)]",
    cardBorderHighlight:
      "ring-2 ring-[#E5B842]/80 shadow-[0_0_32px_rgba(229,184,66,0.4)]",
    cardHeaderDivider: "border-[#242018]",
    avatarBg: "bg-[#1C1A16]",
    avatarBorder: "border-[#4A402D]",
    avatarText: "text-[#F5E6BE]",
    profNameText: "text-[#FDFBF7]",
    profStatusActive: "text-[#E5B842]",
    profStatusNormal: "text-[#998F78] font-medium",
    labelMuted: "text-[#998F78]",
    clientNameText: "text-[#FAF6EE]",
    serviceText: "text-[#CFC2A5]",
    timeBoxBg: "bg-[#080809]",
    timeBoxBorder: "border-[#362F22]",
    timeText: "text-[#FAF6EE]",
    progressTrackBg: "bg-[#2B2519]",
    progressBarBg: "bg-gradient-to-r from-[#D4AF37] to-[#F3C864]",
    progressElapsedText: "text-[#A3977D]",
    nextTimeText: "text-[#E0D2B4]",
    nextClientText: "text-[#FAF6EE]",
    nextServiceText: "text-[#A3977D]",
    freeIconColor: "text-[#998F78]",
    freeTitleColor: "text-[#FAF6EE]",
    freeDescColor: "text-[#998F78]",
    footerText: "text-[#736B59]",
    footerPillContainer: "bg-white/[0.03] border-[#2B271F]",
    footerPillActive: "bg-[#D4AF37] text-black shadow-xs font-bold",
    footerPillInactive: "text-[#A3977D] hover:text-[#FAF6EE]",
  },
};

interface TVSizeConfig {
  outerPadding: string;
  headerPadding: string;
  titleSize: string;
  subtitleSize: string;
  clockSize: string;
  dateSize: string;
  sectionPadding: string;
  syncBadgeSize: string;
  gridGap: string;
  cardPadding: string;
  avatarSize: string;
  avatarText: string;
  profNameSize: string;
  profStatusSize: string;
  labelSize: string;
  clientNameSize: string;
  serviceTextSize: string;
  boxPadding: string;
  timeSize: string;
  freeTitleSize: string;
  freeDescSize: string;
  iconSize: string;
  footerPadding: string;
  footerTextSize: string;
}

const TV_SIZES: Record<TVScreenSize, TVSizeConfig> = {
  "32": {
    outerPadding: "p-3 sm:p-4",
    headerPadding: "pb-2.5",
    titleSize: "text-lg font-bold font-mono",
    subtitleSize: "text-[9.5px]",
    clockSize: "text-2xl sm:text-3xl font-bold",
    dateSize: "text-[10px] sm:text-[10.5px]",
    sectionPadding: "py-1.5 sm:py-2",
    syncBadgeSize: "text-[10px]",
    gridGap: "gap-2.5 sm:gap-3",
    cardPadding: "p-3 sm:p-3.5",
    avatarSize: "w-8 h-8",
    avatarText: "text-[13.5px]",
    profNameSize: "text-[16px] sm:text-[17px]",
    profStatusSize: "text-[9px]",
    labelSize: "text-[9px]",
    clientNameSize: "text-[16px] sm:text-[17.5px]",
    serviceTextSize: "text-[11.5px]",
    boxPadding: "p-2 sm:p-2.5 my-1.5 sm:my-2",
    timeSize: "text-[15.5px] sm:text-[16.5px]",
    freeTitleSize: "text-[15.5px] sm:text-[16.5px]",
    freeDescSize: "text-[11px]",
    iconSize: "w-5 h-5 sm:w-6 sm:h-6",
    footerPadding: "pt-2",
    footerTextSize: "text-[9.5px]",
  },
  "43": {
    outerPadding: "p-4 sm:p-5 md:p-6",
    headerPadding: "pb-3.5",
    titleSize: "text-xl sm:text-2xl font-bold font-mono",
    subtitleSize: "text-[10.5px]",
    clockSize: "text-3xl sm:text-4xl font-bold",
    dateSize: "text-[11.5px] sm:text-xs",
    sectionPadding: "py-2.5 sm:py-3",
    syncBadgeSize: "text-[11px]",
    gridGap: "gap-4 sm:gap-5",
    cardPadding: "p-4 sm:p-5",
    avatarSize: "w-9 h-9 sm:w-10 sm:h-10",
    avatarText: "text-[15px] sm:text-[16px]",
    profNameSize: "text-[18px] sm:text-[20px]",
    profStatusSize: "text-[10px]",
    labelSize: "text-[10px]",
    clientNameSize: "text-[19px] sm:text-[21px]",
    serviceTextSize: "text-[13px]",
    boxPadding: "p-3 my-2.5 sm:my-3",
    timeSize: "text-[18px] sm:text-[20px]",
    freeTitleSize: "text-[18px] sm:text-[19px]",
    freeDescSize: "text-[12.5px]",
    iconSize: "w-7 h-7 sm:w-8 sm:h-8",
    footerPadding: "pt-2.5 sm:pt-3",
    footerTextSize: "text-[11px]",
  },
  "55": {
    outerPadding: "p-5 md:p-7 lg:p-8",
    headerPadding: "pb-4",
    titleSize: "text-2xl sm:text-[26px] font-bold font-mono",
    subtitleSize: "text-[11.5px]",
    clockSize: "text-4xl sm:text-5xl font-bold",
    dateSize: "text-[12.5px] sm:text-sm",
    sectionPadding: "py-3 sm:py-3.5",
    syncBadgeSize: "text-[11.5px]",
    gridGap: "gap-5 sm:gap-6",
    cardPadding: "p-5 sm:p-6",
    avatarSize: "w-11 h-11",
    avatarText: "text-[17px]",
    profNameSize: "text-[21px] sm:text-[23px]",
    profStatusSize: "text-[11px]",
    labelSize: "text-[11px]",
    clientNameSize: "text-[22px] sm:text-[24px]",
    serviceTextSize: "text-[14px]",
    boxPadding: "p-3.5 my-3 sm:my-3.5",
    timeSize: "text-[20px] sm:text-[22px]",
    freeTitleSize: "text-[20px] sm:text-[22px]",
    freeDescSize: "text-[13.5px]",
    iconSize: "w-8 h-8",
    footerPadding: "pt-3.5 sm:pt-4",
    footerTextSize: "text-[11.5px]",
  },
};

/**
 * Reproduz um chime acústico de luxo (E5 + B5) usando a Web Audio API nativa.
 * Zero dependências de arquivos externos MP3/WAV, zero latência e sem falhas de rede.
 */
export function playLuxuryChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tom fundamental suave: Nota E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Harmônico quinta perfeita: B5 (987.77 Hz) suave após 90ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, now + 0.09);
    gain2.gain.setValueAtTime(0.0001, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.1, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.85);
  } catch (err) {
    console.warn("[TV Audio] Falha ao reproduzir chime acústico:", err);
  }
}

// Micro-componente isolado para a barra de progresso em tempo real
// Mantém seu próprio timer de 1s para atualizar o progresso contínuo e tempo restante
// sem disparar re-render da coluna do profissional a cada segundo.
const AppointmentProgressBar = React.memo(function AppointmentProgressBar({
  inProgressApt,
  serverOffsetMs,
  palette,
}: {
  inProgressApt: TVAppointmentDTO;
  serverOffsetMs: number;
  palette: TVThemePalette;
}) {
  const [currentMs, setCurrentMs] = useState<number>(() => Date.now() + serverOffsetMs);

  useEffect(() => {
    setCurrentMs(Date.now() + serverOffsetMs);
    const interval = setInterval(() => {
      setCurrentMs(Date.now() + serverOffsetMs);
    }, 1000);
    return () => clearInterval(interval);
  }, [serverOffsetMs]);

  const startsMs = inProgressApt.startsAt
    ? new Date(inProgressApt.startsAt).getTime()
    : currentMs - 15 * 60000;
  const endsMs = inProgressApt.endsAt
    ? new Date(inProgressApt.endsAt).getTime()
    : startsMs + 45 * 60000;

  const totalMs = Math.max(60000, endsMs - startsMs);
  const elapsedMs = Math.max(0, currentMs - startsMs);
  const remainingMs = Math.max(0, endsMs - currentMs);

  // Progresso contínuo em ponto flutuante (avança suavemente segundo a segundo)
  const rawPercent = (elapsedMs / totalMs) * 100;
  const percent = Math.min(100, Math.max(1, rawPercent));

  // Formatação do Tempo Restante para o Profissional
  const remainingMinutes = Math.ceil(remainingMs / 60000);
  const isOvertime = currentMs >= endsMs;
  const overtimeMinutes = Math.floor((currentMs - endsMs) / 60000);

  let remainingText = "";
  if (isOvertime) {
    remainingText =
      overtimeMinutes > 0
        ? `Tempo esgotado (+${overtimeMinutes} min)`
        : "Finalizando atendimento";
  } else if (remainingMinutes >= 60) {
    const h = Math.floor(remainingMinutes / 60);
    const m = remainingMinutes % 60;
    remainingText = m > 0 ? `${h}h ${m} min restantes` : `${h}h restantes`;
  } else if (remainingMinutes > 1) {
    remainingText = `${remainingMinutes} min restantes`;
  } else {
    remainingText = "Menos de 1 min restante";
  }

  return (
    <div className="mt-2 sm:mt-2.5">
      <div
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso do atendimento: ${remainingText}`}
        className={`h-1.5 w-full rounded-full ${palette.progressTrackBg} overflow-hidden`}
      >
        <div
          className={`h-full rounded-full ${
            isOvertime ? "bg-amber-400" : palette.progressBarBg
          } transition-all duration-1000 ease-linear motion-reduce:transition-none`}
          style={{ width: `${percent.toFixed(2)}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1 sm:mt-1.5">
        <span
          className={`text-[10px] sm:text-[11px] font-medium tabular-nums ${
            isOvertime
              ? "text-amber-400 font-semibold"
              : palette.progressElapsedText
          }`}
        >
          {remainingText}
        </span>
        <span
          className={`text-[9.5px] sm:text-[10.5px] font-mono font-semibold tabular-nums opacity-75 ${palette.labelMuted}`}
        >
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
});

// Coluna Cockpit em Tempo Real de cada Profissional
const ProfessionalCockpitColumn = React.memo(function ProfessionalCockpitColumn({
  column,
  serverOffsetMs,
  isHighlighted,
  isFocused = false,
  onFocus,
  cfg,
  palette,
}: {
  column: TVProfessionalColumn;
  serverOffsetMs: number;
  isHighlighted: boolean;
  isFocused?: boolean;
  onFocus?: () => void;
  cfg: TVSizeConfig;
  palette: TVThemePalette;
}) {
  // Reavalia status da coluna apenas quando o minuto mudar (para viradas de horário sem churn de CPU)
  const [minuteTick, setMinuteTick] = useState<number>(() => Math.floor(Date.now() / 60000));

  useEffect(() => {
    const interval = setInterval(() => {
      const currentMinute = Math.floor(Date.now() / 60000);
      setMinuteTick((prev) => (prev !== currentMinute ? currentMinute : prev));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Ordena por horário de início
  const sorted = useMemo(() => {
    return [...column.appointments].sort((a, b) => {
      const aStart = a.startsAt ? new Date(a.startsAt).getTime() : 0;
      const bStart = b.startsAt ? new Date(b.startsAt).getTime() : 0;
      return aStart - bStart;
    });
  }, [column.appointments]);

  // Identifica agendamento em andamento e próximos
  const { inProgressApt, nextApt, freeTimeText, isInService } = useMemo<{
    inProgressApt: TVAppointmentDTO | null;
    nextApt: TVAppointmentDTO | null;
    freeTimeText: string;
    isInService: boolean;
  }>(() => {
    const currentServerMs = Date.now() + serverOffsetMs;
    let inProgress: TVAppointmentDTO | null = null;
    const upcoming: TVAppointmentDTO[] = [];

    for (const apt of sorted) {
      if (apt.status === "completed") continue;

      const startsMs = apt.startsAt ? new Date(apt.startsAt).getTime() : 0;
      const endsMs = apt.endsAt ? new Date(apt.endsAt).getTime() : startsMs + 45 * 60000;

      // Atendimento em andamento: marcado explicitamente como in_progress OU horário atual dentro da janela
      if (
        apt.status === "in_progress" ||
        (currentServerMs >= startsMs && currentServerMs < endsMs)
      ) {
        if (!inProgress) {
          inProgress = apt;
          continue;
        }
      }

      // Se já terminou antes do horário atual, não é próximo
      if (endsMs <= currentServerMs) {
        continue;
      }

      upcoming.push(apt);
    }

    const next = upcoming[0] || null;

    let freeText = "";
    if (!inProgress && next && next.startsAt) {
      const nextStartMs = new Date(next.startsAt).getTime();
      const diffMinutes = Math.max(0, Math.round((nextStartMs - currentServerMs) / 60000));
      if (diffMinutes < 60) {
        freeText = `${diffMinutes} min`;
      } else {
        const h = Math.floor(diffMinutes / 60);
        const m = diffMinutes % 60;
        freeText = m > 0 ? `${h}h ${m} min` : `${h}h`;
      }
    }

    return {
      inProgressApt: inProgress,
      nextApt: next,
      freeTimeText: freeText,
      isInService: !!inProgress,
    };
  }, [sorted, minuteTick, serverOffsetMs]);

  const initial = column.name.charAt(0).toUpperCase() || "P";

  return (
    <section
      tabIndex={0}
      onFocus={onFocus}
      aria-label={`Profissional ${column.name}: ${isInService ? "Em Atendimento" : "Disponível"}`}
      className={`relative flex flex-col justify-between h-full rounded-2xl md:rounded-3xl ${
        cfg.cardPadding
      } transition-all duration-700 motion-reduce:transition-none overflow-hidden border outline-none ${
        isInService ? palette.cardActive : palette.cardNormal
      } ${isHighlighted ? palette.cardBorderHighlight : ""} ${
        isFocused
          ? "ring-2 ring-white/60 border-white/40 shadow-2xl scale-[1.008]"
          : "focus-visible:ring-2 focus-visible:ring-white/40"
      }`}
    >
      {/* 1. TOPO: Avatar com Inicial + Nome + Status */}
      <div
        className={`flex items-center gap-2.5 pb-2.5 border-b ${palette.cardHeaderDivider} shrink-0`}
      >
        <div
          className={`${cfg.avatarSize} ${cfg.avatarText} rounded-full ${palette.avatarBg} border ${palette.avatarBorder} flex items-center justify-center font-semibold ${palette.avatarText} shrink-0 select-none`}
        >
          {initial}
        </div>
        <div className="flex flex-col truncate">
          <h3
            className={`${cfg.profNameSize} font-semibold ${palette.profNameText} tracking-tight truncate leading-tight`}
          >
            {column.name}
          </h3>
          <span
            className={`${cfg.profStatusSize} font-bold tracking-[0.14em] uppercase mt-0.5 ${
              isInService ? palette.profStatusActive : palette.profStatusNormal
            }`}
          >
            {isInService ? "Em Atendimento" : "Disponível"}
          </span>
        </div>
      </div>

      {/* 2. CORPO CENTRAL E INFORMAÇÕES DO ATENDIMENTO */}
      <div className="flex-1 flex flex-col justify-between py-2 min-h-0 overflow-hidden">
        {inProgressApt ? (
          /* CASO 1: EM ATENDIMENTO */
          <div className="flex flex-col justify-between h-full min-h-0">
            <div className="space-y-0.5">
              <span
                className={`${cfg.labelSize} font-semibold tracking-[0.16em] uppercase ${palette.labelMuted} block`}
              >
                Cliente Atual
              </span>
              <h4
                className={`${cfg.clientNameSize} font-bold ${palette.clientNameText} tracking-tight leading-snug truncate`}
              >
                {inProgressApt.clientName}
              </h4>
              <p className={`${cfg.serviceTextSize} ${palette.serviceText} font-normal truncate`}>
                {inProgressApt.serviceName}
              </p>
            </div>

            {/* Caixa de Horário com Barra de Progresso */}
            <div
              className={`rounded-xl ${palette.timeBoxBg} border ${palette.timeBoxBorder} ${cfg.boxPadding}`}
            >
              <span
                className={`${cfg.labelSize} font-semibold tracking-[0.16em] uppercase ${palette.labelMuted} block mb-0.5`}
              >
                Horário
              </span>
              <div
                className={`${cfg.timeSize} font-bold ${palette.timeText} tracking-tight tabular-nums`}
              >
                {inProgressApt.startTime} – {inProgressApt.endTime}
              </div>

              {/* Barra de Progresso no Horário Agendado (Micro-componente isolado) */}
              <AppointmentProgressBar
                inProgressApt={inProgressApt}
                serverOffsetMs={serverOffsetMs}
                palette={palette}
              />
            </div>

            {/* Bloco Próximo Atendimento */}
            <div className="pt-0.5">
              <div
                className={`flex items-center justify-between ${cfg.labelSize} font-semibold tracking-[0.16em] uppercase ${palette.labelMuted}`}
              >
                <span>Próximo</span>
                {nextApt && (
                  <span className={`font-bold ${palette.nextTimeText} tabular-nums`}>
                    {nextApt.startTime}
                  </span>
                )}
              </div>
              {nextApt ? (
                <div className="mt-0.5 space-y-0.5">
                  <h5
                    className={`${cfg.profNameSize} font-semibold ${palette.nextClientText} tracking-tight truncate`}
                  >
                    {nextApt.clientName}
                  </h5>
                  <p
                    className={`${cfg.serviceTextSize} ${palette.nextServiceText} font-normal truncate`}
                  >
                    {nextApt.serviceName}
                  </p>
                </div>
              ) : (
                <div className="mt-0.5">
                  <h5 className={`${cfg.serviceTextSize} font-medium ${palette.labelMuted} tracking-tight`}>
                    Nenhum cliente agendado
                  </h5>
                  <p className={`${cfg.labelSize} ${palette.labelMuted} opacity-80 font-normal`}>
                    Último atendimento do dia
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : nextApt ? (
          /* CASO 2: DISPONÍVEL COM PRÓXIMO AGENDAMENTO */
          <div className="flex flex-col justify-between h-full min-h-0">
            <div className="flex flex-col items-center justify-center text-center py-1 sm:py-2 my-auto">
              <CheckCircle2 className={`${cfg.iconSize} ${palette.freeIconColor} stroke-[1.5]`} />
              <h4 className={`${cfg.freeTitleSize} font-semibold ${palette.freeTitleColor} tracking-tight mt-1.5`}>
                Livre agora
              </h4>
              <p className={`${cfg.freeDescSize} ${palette.freeDescColor} font-normal mt-0.5`}>
                Disponível para atendimento
              </p>
            </div>

            {/* Bloco Próximo Horário */}
            <div
              className={`rounded-xl ${palette.timeBoxBg} border ${palette.timeBoxBorder} ${cfg.boxPadding}`}
            >
              <span
                className={`${cfg.labelSize} font-semibold tracking-[0.16em] uppercase ${palette.labelMuted} block mb-0.5`}
              >
                Próximo Horário
              </span>
              <div
                className={`${cfg.timeSize} font-bold ${palette.timeText} tracking-tight tabular-nums`}
              >
                {nextApt.startTime}
              </div>
              <p className={`${cfg.serviceTextSize} ${palette.nextServiceText} font-medium mt-0.5 truncate`}>
                {nextApt.clientName} · {nextApt.serviceName}
              </p>
            </div>

            {/* Bloco Tempo Livre */}
            <div className="pt-0.5">
              <span
                className={`${cfg.labelSize} font-semibold tracking-[0.16em] uppercase ${palette.labelMuted} block`}
              >
                Tempo Livre
              </span>
              <div
                className={`${cfg.timeSize} font-bold ${palette.timeText} tracking-tight mt-0.5 tabular-nums`}
              >
                {freeTimeText}
              </div>
            </div>
          </div>
        ) : (
          /* CASO 3: DISPONÍVEL SEM MAIS AGENDAMENTOS (AGENDA LIVRE) */
          <div className="flex flex-col justify-between h-full min-h-0">
            <div className="flex flex-col items-center justify-center text-center py-1 sm:py-2 my-auto">
              <Calendar className={`${cfg.iconSize} ${palette.freeIconColor} stroke-[1.5]`} />
              <h4 className={`${cfg.freeTitleSize} font-semibold ${palette.freeTitleColor} tracking-tight mt-1.5`}>
                Livre agora
              </h4>
              <p className={`${cfg.freeDescSize} ${palette.freeDescColor} font-normal mt-0.5`}>
                Disponível para atendimento
              </p>
            </div>

            {/* Bloco Sem Agenda */}
            <div
              className={`rounded-xl ${palette.timeBoxBg} border ${palette.timeBoxBorder} ${cfg.boxPadding}`}
            >
              <span
                className={`${cfg.labelSize} font-semibold tracking-[0.16em] uppercase ${palette.labelMuted} block mb-0.5`}
              >
                Próximo Horário
              </span>
              <div className={`${cfg.timeSize} font-bold ${palette.timeText} tracking-tight`}>
                Sem agenda
              </div>
              <p className={`${cfg.freeDescSize} ${palette.freeDescColor} font-normal mt-0.5`}>
                Nenhum agendamento previsto
              </p>
            </div>

            {/* Bloco Situação */}
            <div className="pt-0.5">
              <span
                className={`${cfg.labelSize} font-semibold tracking-[0.16em] uppercase ${palette.labelMuted} block`}
              >
                Situação
              </span>
              <div className={`${cfg.timeSize} font-semibold ${palette.timeText} tracking-tight mt-0.5`}>
                Agenda livre
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

export function LiveBoardView({ token, onUnauthorized }: LiveBoardViewProps) {
  const [boardData, setBoardData] = useState<TVPollingResponse | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [reconnectingSeconds, setReconnectingSeconds] = useState<number | null>(null);
  const [clockTime, setClockTime] = useState("");
  const [clockDate, setClockDate] = useState("");
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [burnInOffset, setBurnInOffset] = useState({ x: 0, y: 0 });
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  // Rastreia se o usuário alterou manualmente o tamanho ou tema na TV
  const userSelectedSizeRef = useRef(false);
  const userSelectedThemeRef = useRef(false);

  // 1. Modo Visual (Tema): Claro, Marrom, Escuro, Noir Gold
  const [themeMode, setThemeMode] = useState<TVThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("luvea_tv_theme_v3");
      if (
        saved === "dark" ||
        saved === "light" ||
        saved === "warm_brown" ||
        saved === "noir_gold"
      ) {
        userSelectedThemeRef.current = true;
        return saved as TVThemeMode;
      }
    }
    return "dark";
  });

  // 2. Seleção de tamanho de tela de TV (32", 43" ou 55"+)
  const [tvSize, setTvSize] = useState<TVScreenSize>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("luvea_tv_screen_size_v3");
      if (saved === "32" || saved === "43" || saved === "55") {
        userSelectedSizeRef.current = true;
        return saved;
      }
      if (window.innerHeight <= 800 || window.innerWidth <= 1366) {
        return "32";
      }
    }
    return "32";
  });

  // 3. Indicador de Sincronização
  const [showSyncBadge, setShowSyncBadge] = useState<boolean>(true);

  // 4. Notificação Sonora (Audio Chime para novos atendimentos)
  const [audioChimeEnabled, setAudioChimeEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("luvea_tv_chime_v1") === "true";
      } catch {}
    }
    return false;
  });

  const toggleAudioChime = useCallback(() => {
    setAudioChimeEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("luvea_tv_chime_v1", String(next));
      } catch {}
      if (next) {
        playLuxuryChime();
      }
      return next;
    });
  }, []);

  // 5. Navegação Espacial por D-Pad do Controle Remoto
  const [focusedColIndex, setFocusedColIndex] = useState<number | null>(null);

  const handleSelectTvSize = (size: TVScreenSize) => {
    setTvSize(size);
    userSelectedSizeRef.current = true;
    try {
      localStorage.setItem("luvea_tv_screen_size_v3", size);
    } catch {}
  };

  const handleSelectTheme = (mode: TVThemeMode) => {
    setThemeMode(mode);
    userSelectedThemeRef.current = true;
    try {
      localStorage.setItem("luvea_tv_theme_v3", mode);
    } catch {}
  };

  const currentConfig = TV_SIZES[tvSize] || TV_SIZES["32"];
  const currentPalette = THEME_CONFIGS[themeMode] || THEME_CONFIGS.dark;

  const serverTimeOffsetRef = useRef<number>(0);
  const previousAptsRef = useRef<Map<string, string>>(new Map());
  const retryCountRef = useRef<number>(0);

  // 1. Prevenção de Burn-in (deslocamento micrométrico a cada 5 min)
  useEffect(() => {
    const burnInInterval = setInterval(() => {
      const offsetX = Math.floor(Math.random() * 5) - 2;
      const offsetY = Math.floor(Math.random() * 5) - 2;
      setBurnInOffset({ x: offsetX, y: offsetY });
    }, 5 * 60 * 1000);
    return () => clearInterval(burnInInterval);
  }, []);

  // 2. Wake Lock API para evitar suspensão de tela
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && (navigator as any).wakeLock) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch {
        // Silencioso em navegadores de TV sem suporte
      }
    };

    requestWakeLock();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  // 3. Polling em tempo real (a cada 20 segundos)
  const syncAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/tv/appointments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        console.warn("[TV Kiosk] Acesso revogado ou inativo:", res.status);
        onUnauthorized();
        return;
      }

      if (!res.ok) {
        throw new Error(`Erro na resposta: ${res.status}`);
      }

      const data: TVPollingResponse = await res.json();

      // Sincroniza offset do relógio com base no serverTime
      if (data.serverTime) {
        const serverMs = new Date(data.serverTime).getTime();
        const offset = serverMs - Date.now();
        serverTimeOffsetRef.current = offset;
        setServerOffsetMs(offset);
      }

      // Sincroniza configurações remotas de exibição (se usuário não tiver forçado override local)
      if (data.theme && !userSelectedThemeRef.current) {
        setThemeMode(data.theme);
      }
      if (data.screenSize && !userSelectedSizeRef.current) {
        setTvSize(data.screenSize);
      }
      if (typeof data.showSyncBadge === "boolean") {
        setShowSyncBadge(data.showSyncBadge);
      }

      // Detecta cards com alteração de status/horário para aplicar highlight sutil
      const currentMap = new Map<string, string>();
      const newHighlighted = new Set<string>();

      data.professionals.forEach((prof) => {
        prof.appointments.forEach((apt) => {
          const signature = `${apt.status}-${apt.startTime}-${apt.endTime}`;
          currentMap.set(apt.id, signature);

          const previousSig = previousAptsRef.current.get(apt.id);
          if (previousSig && previousSig !== signature) {
            newHighlighted.add(apt.id);
          }
        });
      });

      // Toca chime sonoro editorial suave se o áudio estiver ativado e houve atualização relevante
      if (
        audioChimeEnabled &&
        previousAptsRef.current.size > 0 &&
        newHighlighted.size > 0
      ) {
        playLuxuryChime();
      }

      previousAptsRef.current = currentMap;

      if (newHighlighted.size > 0) {
        setHighlightedIds(newHighlighted);
        setTimeout(() => setHighlightedIds(new Set()), 3000);
      }

      setBoardData(data);
      setIsOnline(true);
      setReconnectingSeconds(null);
      retryCountRef.current = 0;
    } catch (err) {
      console.warn("[TV Kiosk] Falha de sincronização:", err);
      setIsOnline(false);

      const nextDelay = Math.min(20, Math.max(3, 3 * Math.pow(1.8, retryCountRef.current)));
      retryCountRef.current += 1;
      setReconnectingSeconds(Math.round(nextDelay));
    }
  }, [token, onUnauthorized, audioChimeEnabled]);

  // Executa polling a cada 20 segundos
  useEffect(() => {
    syncAppointments();
    const pollInterval = setInterval(() => {
      syncAppointments();
    }, 20000);
    return () => clearInterval(pollInterval);
  }, [syncAppointments]);

  // 4. Relógio digital sincronizado e data localizada
  useEffect(() => {
    const tz = boardData?.timezone || "America/Sao_Paulo";

    const updateClock = () => {
      const current = new Date(Date.now() + serverTimeOffsetRef.current);

      try {
        const timeStr = new Intl.DateTimeFormat("pt-BR", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(current);
        setClockTime(timeStr);

        const dayOfWeek = new Intl.DateTimeFormat("pt-BR", {
          timeZone: tz,
          weekday: "short",
        })
          .format(current)
          .replace(".", "")
          .toUpperCase();
        const day = new Intl.DateTimeFormat("pt-BR", {
          timeZone: tz,
          day: "numeric",
        }).format(current);
        const month = new Intl.DateTimeFormat("pt-BR", {
          timeZone: tz,
          month: "short",
        })
          .format(current)
          .replace(".", "")
          .toUpperCase();
        const year = new Intl.DateTimeFormat("pt-BR", {
          timeZone: tz,
          year: "numeric",
        }).format(current);

        setClockDate(`${dayOfWeek} · ${day} ${month} ${year}`);
      } catch {
        setClockTime(current.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
        setClockDate("");
      }
    };

    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, [boardData?.timezone]);

  // 5. Paginação e rotação automática de colunas para estúdios com 6+ profissionais
  const professionalPages = useMemo(() => {
    if (!boardData?.professionals) return [];
    return paginateProfessionals(boardData.professionals, 5);
  }, [boardData?.professionals]);

  useEffect(() => {
    if (professionalPages.length <= 1) {
      setPageIndex(0);
      return;
    }

    const rotationInterval = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % professionalPages.length);
    }, 20000);

    return () => clearInterval(rotationInterval);
  }, [professionalPages.length]);

  const currentColumns: TVProfessionalColumn[] =
    professionalPages[pageIndex] || [];

  // Atalhos de teclado / controle remoto da TV e Navegação Espacial (D-Pad)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Escalas de TV (1=32", 2=43", 3=55"+)
      if (e.key === "1") handleSelectTvSize("32");
      if (e.key === "2") handleSelectTvSize("43");
      if (e.key === "3") handleSelectTvSize("55");

      // 2. Alternador de Tema (T)
      if (e.key === "t" || e.key === "T") {
        setThemeMode((prev) => {
          const list: TVThemeMode[] = ["dark", "light", "warm_brown", "noir_gold"];
          const nextIdx = (list.indexOf(prev) + 1) % list.length;
          const nextTheme = list[nextIdx];
          userSelectedThemeRef.current = true;
          try {
            localStorage.setItem("luvea_tv_theme_v3", nextTheme);
          } catch {}
          return nextTheme;
        });
      }

      // 3. Alternador de Som / Chime (M ou S)
      if (e.key === "m" || e.key === "M" || e.key === "s" || e.key === "S") {
        toggleAudioChime();
      }

      // 4. Navegação Espacial por D-Pad do Controle Remoto (Setas Direita / Esquerda)
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setFocusedColIndex((prev) => {
          if (prev === null) return 0;
          if (prev < currentColumns.length - 1) return prev + 1;
          if (professionalPages.length > 1) {
            setPageIndex((p) => (p + 1) % professionalPages.length);
            return 0;
          }
          return prev;
        });
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusedColIndex((prev) => {
          if (prev === null) return 0;
          if (prev > 0) return prev - 1;
          if (professionalPages.length > 1) {
            setPageIndex((p) => (p - 1 + professionalPages.length) % professionalPages.length);
            return 0;
          }
          return 0;
        });
      }
      if (e.key === "ArrowDown") {
        setFocusedColIndex(null);
      }
      if (e.key === "ArrowUp") {
        setFocusedColIndex(0);
      }
      if (e.key === "Enter" || e.key === " ") {
        if (focusedColIndex !== null && currentColumns[focusedColIndex]) {
          const targetCol = currentColumns[focusedColIndex];
          setHighlightedIds(new Set([targetCol.id]));
          setTimeout(() => setHighlightedIds(new Set()), 2500);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentColumns, professionalPages.length, focusedColIndex, toggleAudioChime]);

  return (
    <div
      style={{
        transform: `translate(${burnInOffset.x}px, ${burnInOffset.y}px)`,
      }}
      className={`fixed inset-0 w-screen h-screen ${currentPalette.bgRoot} ${currentConfig.outerPadding} flex flex-col justify-between select-none overflow-hidden transition-colors duration-700 ease-in-out motion-reduce:transition-none`}
    >
      {/* Atalhos de teclado e acessibilidade para leitores de tela */}
      <section
        className="sr-only"
        aria-label="Atalhos de teclado e acessibilidade do TV Kiosk"
      >
        <h2>Instruções e atalhos do Painel LUVEA TV Kiosk</h2>
        <p>A escala de profissionais sincroniza automaticamente a cada 20 segundos.</p>
        <ul>
          <li>Pressione a tecla 1 para selecionar escala de TV de 32 polegadas.</li>
          <li>Pressione a tecla 2 para selecionar escala de TV de 43 polegadas.</li>
          <li>Pressione a tecla 3 para selecionar escala de TV de 55 polegadas ou superior.</li>
          <li>Pressione a tecla T para alternar o modo visual entre Obsidian Escuro, Editorial Claro, Cacau e Âmbar, ou Noir Imperial e Gold.</li>
          <li>Pressione a tecla M ou S para ativar ou desativar o aviso sonoro acústico de novos atendimentos.</li>
          <li>Use as setas Esquerda e Direita do controle remoto (D-Pad) para navegar entre as colunas da equipe.</li>
          <li>Pressione Enter ou OK no controle remoto para destacar a coluna selecionada.</li>
        </ul>
        <a
          href="#tv-main-board"
          className="focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-zinc-900 focus:text-white focus:rounded-full focus:border focus:border-white/20 focus:text-xs focus:shadow-xl"
        >
          Pular para a grade de atendimentos da equipe
        </a>
      </section>

      {/* 1. Cabeçalho Limpo Editorial */}
      <header
        className={`w-full flex items-center justify-between ${currentConfig.headerPadding} border-b ${currentPalette.headerBorder} shrink-0`}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`${currentConfig.titleSize} ${currentPalette.brandTitle} tracking-tight`}>
              LUVEA
            </span>
            <span className="text-zinc-500 font-light">|</span>
            <span className={`${currentConfig.titleSize} font-medium ${currentPalette.brandTitle}`}>
              {boardData?.organizationName || "Meu Estúdio"}
            </span>
          </div>
          <span
            className={`${currentConfig.subtitleSize} font-mono uppercase tracking-[0.22em] ${currentPalette.brandSubtitle} mt-0.5`}
          >
            PAINEL DE ATENDIMENTOS
          </span>
        </div>

        {/* Relógio Digital e Data */}
        <div className="flex flex-col items-end">
          <div
            className={`${currentConfig.clockSize} font-mono tracking-tight tabular-nums ${currentPalette.clockText}`}
          >
            {clockTime || "--:--"}
          </div>
          <div
            className={`${currentConfig.dateSize} font-mono tracking-wider ${currentPalette.dateText} mt-0.5`}
          >
            {clockDate}
          </div>
        </div>
      </header>

      {/* 2. Micro-indicador SINCRONIZADO (Discreto e sem o texto "Equipe em tempo real") */}
      {showSyncBadge && (
        <div
          className={`flex items-center justify-end ${currentConfig.sectionPadding} shrink-0`}
        >
          <div
            className="flex items-center gap-1.5 sm:gap-2"
            role="status"
            aria-live="polite"
          >
            {isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full ${currentPalette.syncOnlinePing} opacity-60`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${currentPalette.syncOnlineDot}`}
                  />
                </span>
                <span
                  className={`${currentPalette.syncOnlineText} uppercase ${currentConfig.syncBadgeSize} font-bold tracking-wider`}
                >
                  Sincronizado
                </span>
              </>
            ) : (
              <>
                <span
                  className={`w-2 h-2 rounded-full ${currentPalette.syncOfflineDot} animate-pulse motion-reduce:animate-none`}
                />
                <span
                  className={`${currentPalette.syncOfflineText} uppercase ${currentConfig.syncBadgeSize} font-bold tracking-wider`}
                >
                  {reconnectingSeconds
                    ? `Reconectando em ${reconnectingSeconds}s`
                    : "Reconectando"}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. Corpo Principal: Grid Cockpit de Profissionais (100% contido, 0px de corte) */}
      <main
        id="tv-main-board"
        tabIndex={-1}
        className="flex-1 w-full min-h-0 overflow-hidden flex flex-col justify-start outline-none"
      >
        {!boardData ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-500 text-sm">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin motion-reduce:animate-none" />
            <span className="font-light tracking-wide text-zinc-400">
              Sincronizando agenda do dia...
            </span>
          </div>
        ) : currentColumns.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <h3 className="text-xl md:text-2xl font-medium tracking-tight text-zinc-300">
              Nenhum profissional cadastrado
            </h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-sm">
              Cadastre os profissionais na equipe para acompanhar a escala em tempo real na TV.
            </p>
          </div>
        ) : (
          <div
            className={`grid h-full ${currentConfig.gridGap} transition-opacity duration-500 motion-reduce:transition-none`}
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, currentColumns.length)}, minmax(0, 1fr))`,
            }}
          >
            {currentColumns.map((col, idx) => (
              <ProfessionalCockpitColumn
                key={col.id}
                column={col}
                serverOffsetMs={serverOffsetMs}
                isHighlighted={highlightedIds.has(col.id)}
                isFocused={focusedColIndex === idx}
                onFocus={() => setFocusedColIndex(idx)}
                cfg={currentConfig}
                palette={currentPalette}
              />
            ))}
          </div>
        )}
      </main>

      {/* 4. Rodapé Fixo com Seletores Discretos de Escala e Tema de TV */}
      <footer
        className={`w-full flex items-center justify-between ${currentConfig.footerPadding} border-t ${currentPalette.footerBorder} ${currentPalette.footerText} shrink-0`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`${currentConfig.footerTextSize} font-medium tracking-wider uppercase`}
          >
            LUVEA - {boardData?.organizationName?.toUpperCase() || "MEU ESTÚDIO"}
          </span>
        </div>

        {/* Controles de Escala & Tema */}
        <div className="flex items-center gap-3">
          {/* Seletor Rápido de Tela (32", 43", 55"+) */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border ${currentPalette.footerPillContainer}`}
          >
            <span className="opacity-60 mr-1 select-none hidden sm:inline text-[9.5px] uppercase font-semibold">
              TV:
            </span>
            <button
              type="button"
              onClick={() => handleSelectTvSize("32")}
              title="Otimizado para TV 32 polegadas (HD)"
              className={`px-2.5 py-0.5 rounded-full text-[10.5px] transition ${
                tvSize === "32"
                  ? currentPalette.footerPillActive
                  : currentPalette.footerPillInactive
              }`}
            >
              32&quot;
            </button>
            <button
              type="button"
              onClick={() => handleSelectTvSize("43")}
              title="Otimizado para TV 40-50 polegadas (Full HD)"
              className={`px-2.5 py-0.5 rounded-full text-[10.5px] transition ${
                tvSize === "43"
                  ? currentPalette.footerPillActive
                  : currentPalette.footerPillInactive
              }`}
            >
              43&quot;
            </button>
            <button
              type="button"
              onClick={() => handleSelectTvSize("55")}
              title="Otimizado para TV 55+ polegadas (4K)"
              className={`px-2.5 py-0.5 rounded-full text-[10.5px] transition ${
                tvSize === "55"
                  ? currentPalette.footerPillActive
                  : currentPalette.footerPillInactive
              }`}
            >
              55&quot;
            </button>
          </div>

          {/* Seletor Rápido de Tema (Escuro, Claro, Marrom, Noir Gold) */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border ${currentPalette.footerPillContainer}`}
          >
            <span className="opacity-60 mr-1 select-none hidden md:inline text-[9.5px] uppercase font-semibold">
              Tema:
            </span>
            {(["dark", "light", "warm_brown", "noir_gold"] as TVThemeMode[]).map((mode) => {
              const pal = THEME_CONFIGS[mode];
              const isActive = themeMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSelectTheme(mode)}
                  title={pal.name}
                  className={`px-2 py-0.5 rounded-full text-[10px] transition ${
                    isActive
                      ? currentPalette.footerPillActive
                      : currentPalette.footerPillInactive
                  }`}
                >
                  {pal.badgeName}
                </button>
              );
            })}
          </div>

          {/* Botão de Som / Chime Notificação Acústica */}
          <button
            type="button"
            onClick={toggleAudioChime}
            aria-label={
              audioChimeEnabled
                ? "Desativar aviso sonoro de novos atendimentos"
                : "Ativar aviso sonoro de novos atendimentos"
            }
            title={
              audioChimeEnabled
                ? "Som ativo (Chime para novos atendimentos)"
                : "Som desativado (Clique para ativar)"
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] transition focus-visible:ring-1 focus-visible:ring-white/40 ${
              audioChimeEnabled
                ? currentPalette.footerPillActive
                : `${currentPalette.footerPillContainer} ${currentPalette.footerPillInactive}`
            }`}
          >
            {audioChimeEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 opacity-60" />
            )}
            <span className="hidden sm:inline font-medium">
              {audioChimeEnabled ? "Som Ativo" : "Mudo"}
            </span>
          </button>
        </div>

        {professionalPages.length > 1 && (
          <div className="flex items-center gap-1">
            {professionalPages.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                  idx === pageIndex ? "bg-white w-4" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        )}

        <div
          className={`${currentConfig.footerTextSize} font-medium tracking-wider uppercase hidden sm:block`}
        >
          AGENDA ATUALIZADA AUTOMATICAMENTE
        </div>
      </footer>
    </div>
  );
}
