"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { CheckCircle2, Calendar } from "lucide-react";
import {
  TVPollingResponse,
  TVAppointmentDTO,
  TVProfessionalColumn,
  paginateProfessionals,
} from "@/lib/tv-kiosk";

interface LiveBoardViewProps {
  token: string;
  onUnauthorized: () => void;
}

export type TVScreenSize = "32" | "43" | "55";

interface TVSizeConfig {
  outerPadding: string;
  headerPadding: string;
  titleSize: string;
  subtitleSize: string;
  clockSize: string;
  dateSize: string;
  sectionPadding: string;
  sectionTitleSize: string;
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
    sectionTitleSize: "text-[14px]",
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
    sectionTitleSize: "text-[16px] sm:text-[17px]",
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
    sectionTitleSize: "text-[18px] sm:text-[20px]",
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

// Coluna Cockpit em Tempo Real de cada Profissional
const ProfessionalCockpitColumn = React.memo(function ProfessionalCockpitColumn({
  column,
  currentServerMs,
  isHighlighted,
  cfg,
}: {
  column: TVProfessionalColumn;
  currentServerMs: number;
  isHighlighted: boolean;
  cfg: TVSizeConfig;
}) {
  // Ordena por horário de início
  const sorted = useMemo(() => {
    return [...column.appointments].sort((a, b) => {
      const aTime = a.startsAt ? new Date(a.startsAt).getTime() : 0;
      const bTime = b.startsAt ? new Date(b.startsAt).getTime() : 0;
      return aTime - bTime;
    });
  }, [column.appointments]);

  // Identifica agendamento em andamento e próximos
  const { inProgressApt, nextApt, freeTimeText, isInService } = useMemo<{
    inProgressApt: TVAppointmentDTO | null;
    nextApt: TVAppointmentDTO | null;
    freeTimeText: string;
    isInService: boolean;
  }>(() => {
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
  }, [sorted, currentServerMs]);

  const initial = column.name.charAt(0).toUpperCase() || "P";

  return (
    <section
      className={`relative flex flex-col justify-between h-full rounded-2xl md:rounded-3xl ${cfg.cardPadding} transition-all duration-700 overflow-hidden ${
        isInService
          ? "bg-[#0b0f11]/95 border border-emerald-500/40 ring-1 ring-emerald-500/25 shadow-[0_0_32px_rgba(16,185,129,0.12)]"
          : "bg-[#0d0d10]/95 border border-white/[0.08] shadow-[0_12px_32px_-10px_rgba(0,0,0,0.6)]"
      } ${
        isHighlighted
          ? "ring-2 ring-emerald-400/60 shadow-[0_0_28px_rgba(52,211,153,0.35)]"
          : ""
      }`}
    >
      {/* 1. TOPO: Avatar com Inicial + Nome + Status */}
      <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/[0.06] shrink-0">
        <div
          className={`${cfg.avatarSize} ${cfg.avatarText} rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center font-semibold text-zinc-100 shrink-0 select-none`}
        >
          {initial}
        </div>
        <div className="flex flex-col truncate">
          <h3
            className={`${cfg.profNameSize} font-semibold text-white tracking-tight truncate leading-tight`}
          >
            {column.name}
          </h3>
          <span
            className={`${cfg.profStatusSize} font-bold tracking-[0.14em] uppercase mt-0.5 ${
              isInService ? "text-emerald-400" : "text-zinc-400 font-medium"
            }`}
          >
            {isInService ? "Em Atendimento" : "Disponível"}
          </span>
        </div>
      </div>

      {/* 2. CORPO CENTRAL E INFORMAÇÕES DO ATENDIMENTO (Sem cortes, 100% contido) */}
      <div className="flex-1 flex flex-col justify-between py-2 min-h-0 overflow-hidden">
        {inProgressApt ? (
          /* CASO 1: EM ATENDIMENTO */
          <div className="flex flex-col justify-between h-full min-h-0">
            <div className="space-y-0.5">
              <span
                className={`${cfg.labelSize} font-semibold tracking-[0.16em] uppercase text-zinc-400 block`}
              >
                Cliente Atual
              </span>
              <h4
                className={`${cfg.clientNameSize} font-bold text-white tracking-tight leading-snug truncate`}
              >
                {inProgressApt.clientName}
              </h4>
              <p className={`${cfg.serviceTextSize} text-zinc-400 font-normal truncate`}>
                {inProgressApt.serviceName}
              </p>
            </div>

            {/* Caixa de Horário */}
            <div
              className={`rounded-xl bg-white/[0.03] border border-white/[0.06] ${cfg.boxPadding}`}
            >
              <span
                className={`${cfg.labelSize} font-semibold tracking-[0.16em] uppercase text-zinc-400 block mb-0.5`}
              >
                Horário
              </span>
              <div
                className={`${cfg.timeSize} font-bold text-white tracking-tight tabular-nums`}
              >
                {inProgressApt.startTime} – {inProgressApt.endTime}
              </div>
            </div>

            {/* Bloco Próximo Atendimento */}
            <div className="pt-0.5">
              <div
                className={`flex items-center justify-between ${cfg.labelSize} font-semibold tracking-[0.16em] uppercase text-zinc-400`}
              >
                <span>Próximo</span>
                {nextApt && (
                  <span className="font-bold text-zinc-300 tabular-nums">
                    {nextApt.startTime}
                  </span>
                )}
              </div>
              {nextApt ? (
                <div className="mt-0.5 space-y-0.5">
                  <h5
                    className={`${cfg.profNameSize} font-semibold text-zinc-100 tracking-tight truncate`}
                  >
                    {nextApt.clientName}
                  </h5>
                  <p className={`${cfg.serviceTextSize} text-zinc-400 font-normal truncate`}>
                    {nextApt.serviceName}
                  </p>
                </div>
              ) : (
                <div className="mt-0.5">
                  <h5 className={`${cfg.serviceTextSize} font-medium text-zinc-500 tracking-tight`}>
                    Nenhum cliente agendado
                  </h5>
                  <p className={`${cfg.labelSize} text-zinc-600 font-normal`}>
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
              <CheckCircle2 className={`${cfg.iconSize} text-zinc-400 stroke-[1.5]`} />
              <h4 className={`${cfg.freeTitleSize} font-semibold text-white tracking-tight mt-1.5`}>
                Livre agora
              </h4>
              <p className={`${cfg.freeDescSize} text-zinc-400 font-normal mt-0.5`}>
                Disponível para atendimento
              </p>
            </div>

            {/* Bloco Próximo Horário */}
            <div
              className={`rounded-xl bg-white/[0.03] border border-white/[0.06] ${cfg.boxPadding}`}
            >
              <span
                className={`${cfg.labelSize} font-semibold tracking-[0.16em] uppercase text-zinc-400 block mb-0.5`}
              >
                Próximo Horário
              </span>
              <div
                className={`${cfg.timeSize} font-bold text-white tracking-tight tabular-nums`}
              >
                {nextApt.startTime}
              </div>
              <p className={`${cfg.serviceTextSize} text-zinc-300 font-medium mt-0.5 truncate`}>
                {nextApt.clientName} · {nextApt.serviceName}
              </p>
            </div>

            {/* Bloco Tempo Livre */}
            <div className="pt-0.5">
              <span
                className={`${cfg.labelSize} font-semibold tracking-[0.16em] uppercase text-zinc-400 block`}
              >
                Tempo Livre
              </span>
              <div
                className={`${cfg.timeSize} font-bold text-white tracking-tight mt-0.5 tabular-nums`}
              >
                {freeTimeText}
              </div>
            </div>
          </div>
        ) : (
          /* CASO 3: DISPONÍVEL SEM MAIS AGENDAMENTOS (AGENDA LIVRE) */
          <div className="flex flex-col justify-between h-full min-h-0">
            <div className="flex flex-col items-center justify-center text-center py-1 sm:py-2 my-auto">
              <Calendar className={`${cfg.iconSize} text-zinc-400 stroke-[1.5]`} />
              <h4 className={`${cfg.freeTitleSize} font-semibold text-white tracking-tight mt-1.5`}>
                Livre agora
              </h4>
              <p className={`${cfg.freeDescSize} text-zinc-400 font-normal mt-0.5`}>
                Disponível para atendimento
              </p>
            </div>

            {/* Bloco Sem Agenda */}
            <div
              className={`rounded-xl bg-white/[0.03] border border-white/[0.06] ${cfg.boxPadding}`}
            >
              <span
                className={`${cfg.labelSize} font-semibold tracking-[0.16em] uppercase text-zinc-400 block mb-0.5`}
              >
                Próximo Horário
              </span>
              <div className={`${cfg.timeSize} font-bold text-white tracking-tight`}>
                Sem agenda
              </div>
              <p className={`${cfg.freeDescSize} text-zinc-400 font-normal mt-0.5`}>
                Nenhum agendamento previsto
              </p>
            </div>

            {/* Bloco Situação */}
            <div className="pt-0.5">
              <span
                className={`${cfg.labelSize} font-semibold tracking-[0.16em] uppercase text-zinc-400 block`}
              >
                Situação
              </span>
              <div className={`${cfg.timeSize} font-semibold text-white tracking-tight mt-0.5`}>
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
  const [currentServerMs, setCurrentServerMs] = useState<number>(Date.now());
  const [pageIndex, setPageIndex] = useState(0);
  const [burnInOffset, setBurnInOffset] = useState({ x: 0, y: 0 });
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  // Seleção de tamanho de tela de TV (32", 43" ou 55"+)
  const [tvSize, setTvSize] = useState<TVScreenSize>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("luvea_tv_screen_size_v2");
      if (saved === "32" || saved === "43" || saved === "55") return saved;
      // Auto-detecta 32" (720p / HD / altura <= 800px)
      if (window.innerHeight <= 800 || window.innerWidth <= 1366) {
        return "32";
      }
    }
    return "32";
  });

  const handleSelectTvSize = (size: TVScreenSize) => {
    setTvSize(size);
    try {
      localStorage.setItem("luvea_tv_screen_size_v2", size);
    } catch {}
  };

  const currentConfig = TV_SIZES[tvSize] || TV_SIZES["32"];

  const serverTimeOffsetRef = useRef<number>(0);
  const previousAptsRef = useRef<Map<string, string>>(new Map());
  const wakeLockRef = useRef<any>(null);
  const retryCountRef = useRef(0);

  // Atalhos de teclado no controle remoto / teclado:
  // 1: 32"
  // 2: 43"
  // 3: 55"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") handleSelectTvSize("32");
      if (e.key === "2") handleSelectTvSize("43");
      if (e.key === "3") handleSelectTvSize("55");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 1. Wake Lock API na tela ao vivo
  useEffect(() => {
    let released = false;
    async function requestWakeLock() {
      if ("wakeLock" in navigator && !released) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        } catch {
          // Ignora
        }
      }
    }
    requestWakeLock();
    return () => {
      released = true;
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch {}
      }
    };
  }, []);

  // 2. Proteção contra Burn-in (micro-movimentação de 1px a cada 10 minutos)
  useEffect(() => {
    const timer = setInterval(() => {
      setBurnInOffset((prev) => ({
        x: prev.x === 0 ? 1 : 0,
        y: prev.y === 0 ? 1 : 0,
      }));
    }, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Função de sincronização com /api/tv/appointments
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
        serverTimeOffsetRef.current = serverMs - Date.now();
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

      // Backoff exponencial para reconexão (3s -> 6s -> 12s -> 20s)
      const nextDelay = Math.min(20, Math.max(3, 3 * Math.pow(1.8, retryCountRef.current)));
      retryCountRef.current += 1;
      setReconnectingSeconds(Math.round(nextDelay));
    }
  }, [token, onUnauthorized]);

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
      setCurrentServerMs(current.getTime());

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

  return (
    <div
      style={{
        transform: `translate(${burnInOffset.x}px, ${burnInOffset.y}px)`,
      }}
      className={`fixed inset-0 w-screen h-screen ${currentConfig.outerPadding} bg-[#070709] text-white flex flex-col justify-between overflow-hidden select-none transition-all duration-500`}
    >
      {/* Vídeo invisível de 1x1 pixel em loop como fallback de Wake Lock */}
      <video
        aria-hidden="true"
        className="fixed top-0 left-0 w-[1px] h-[1px] opacity-[0.001] pointer-events-none"
        autoPlay
        loop
        muted
        playsInline
      >
        <source
          src="data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAAAhmcmVlAAAABG1kYXQ="
          type="video/mp4"
        />
      </video>

      {/* Faixa de Aviso de Queda de Conexão */}
      {!isOnline && (
        <div className="absolute top-0 left-0 w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-2 text-xs font-mono text-amber-300 z-50">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Conexão oscilando. Exibindo última grade sincronizada.
          {reconnectingSeconds && ` Tentando reconectar em ${reconnectingSeconds}s...`}
        </div>
      )}

      {/* 1. Header Superior: LUVEA | Meu Estúdio & Relógio 18:02 SÁB · 24 OUT 2026 */}
      <header
        className={`w-full flex items-center justify-between ${currentConfig.headerPadding} border-b border-white/[0.08] shrink-0`}
      >
        {/* Esquerda: Identidade do Estúdio + Subtítulo PAINEL DE ATENDIMENTOS */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 md:gap-2.5">
            <span className={`${currentConfig.titleSize} tracking-tight text-white`}>
              LUVEA
            </span>
            <span className="text-zinc-600 font-light text-lg">|</span>
            <span className="text-base sm:text-lg font-semibold tracking-tight text-zinc-100 truncate max-w-xs sm:max-w-md">
              {boardData?.organizationName || "Meu Estúdio"}
            </span>
          </div>
          <span
            className={`${currentConfig.subtitleSize} font-semibold tracking-[0.2em] uppercase text-zinc-500 mt-0.5`}
          >
            Painel de Atendimentos
          </span>
        </div>

        {/* Direita: Relógio Digital Limpo e Data Localizada */}
        <div className="flex flex-col items-end text-right">
          <span
            className={`${currentConfig.clockSize} tabular-nums tracking-tight text-white leading-none`}
          >
            {clockTime || "--:--"}
          </span>
          <span
            className={`${currentConfig.dateSize} font-semibold tracking-wider uppercase text-zinc-400 mt-0.5`}
          >
            {clockDate}
          </span>
        </div>
      </header>

      {/* 2. Barra de Seção: Equipe em tempo real + SINCRONIZADO */}
      <div
        className={`w-full flex items-center justify-between ${currentConfig.sectionPadding} shrink-0`}
      >
        <h2 className={`${currentConfig.sectionTitleSize} font-semibold text-zinc-100 tracking-tight`}>
          Equipe em tempo real
        </h2>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isOnline ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 ring-2 ring-emerald-500/20" />
              </span>
              <span
                className={`text-emerald-400 uppercase ${currentConfig.syncBadgeSize} font-bold tracking-wider`}
              >
                Sincronizado
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-500/20 animate-pulse" />
              <span
                className={`text-amber-300 uppercase ${currentConfig.syncBadgeSize} font-bold tracking-wider`}
              >
                Reconectando
              </span>
            </>
          )}
        </div>
      </div>

      {/* 3. Corpo Principal: Grid Cockpit de Profissionais (100% contido, 0px de corte) */}
      <main className="flex-1 w-full min-h-0 overflow-hidden flex flex-col justify-start">
        {!boardData ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-500 text-sm">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
            <span className="font-light tracking-wide text-zinc-400">Sincronizando agenda do dia...</span>
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
            className={`grid h-full ${currentConfig.gridGap} transition-opacity duration-500`}
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, currentColumns.length)}, minmax(0, 1fr))`,
            }}
          >
            {currentColumns.map((column) => (
              <ProfessionalCockpitColumn
                key={column.id}
                column={column}
                currentServerMs={currentServerMs}
                isHighlighted={column.appointments.some((a) => highlightedIds.has(a.id))}
                cfg={currentConfig}
              />
            ))}
          </div>
        )}
      </main>

      {/* 4. Rodapé Fixo com Seletor de Escala Nativo (32", 43", 55"+) */}
      <footer
        className={`w-full flex items-center justify-between ${currentConfig.footerPadding} border-t border-white/[0.06] text-zinc-500 shrink-0`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`${currentConfig.footerTextSize} font-medium tracking-wider text-zinc-500 uppercase`}
          >
            LUVEA - {boardData?.organizationName?.toUpperCase() || "MEU ESTÚDIO"}
          </span>
        </div>

        {/* Seletor Rápido de Tela (32", 43", 55"+) */}
        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full">
          <span className="text-zinc-500 mr-0.5 select-none hidden sm:inline text-[10px] uppercase font-semibold">
            TV:
          </span>
          <button
            type="button"
            onClick={() => handleSelectTvSize("32")}
            title="Otimizado para TV 32 polegadas (HD)"
            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold transition ${
              tvSize === "32"
                ? "bg-white text-black shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            32&quot;
          </button>
          <button
            type="button"
            onClick={() => handleSelectTvSize("43")}
            title="Otimizado para TV 40-50 polegadas (Full HD)"
            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold transition ${
              tvSize === "43"
                ? "bg-white text-black shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            43&quot;
          </button>
          <button
            type="button"
            onClick={() => handleSelectTvSize("55")}
            title="Otimizado para TV 55+ polegadas (4K)"
            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold transition ${
              tvSize === "55"
                ? "bg-white text-black shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            55&quot;
          </button>
        </div>

        {professionalPages.length > 1 && (
          <div className="hidden md:flex items-center gap-2 text-zinc-400 text-xs">
            <span>
              Página {pageIndex + 1} de {professionalPages.length}
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            <span className="text-[11px] text-zinc-500">Alternando a cada 20s</span>
          </div>
        )}

        <div
          className={`${currentConfig.footerTextSize} font-medium tracking-wider text-zinc-500 uppercase`}
        >
          AGENDA ATUALIZADA AUTOMATICAMENTE
        </div>
      </footer>
    </div>
  );
}
