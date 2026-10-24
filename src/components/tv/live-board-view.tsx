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

// Coluna Cockpit em Tempo Real de cada Profissional (conforme referência editorial de luxo)
const ProfessionalCockpitColumn = React.memo(function ProfessionalCockpitColumn({
  column,
  currentServerMs,
  isHighlighted,
}: {
  column: TVProfessionalColumn;
  currentServerMs: number;
  isHighlighted: boolean;
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
      className={`relative flex flex-col justify-between h-full rounded-2xl md:rounded-3xl p-6 md:p-7 transition-all duration-700 overflow-hidden ${
        isInService
          ? "bg-[#0b0f11]/95 border border-emerald-500/40 ring-1 ring-emerald-500/25 shadow-[0_0_36px_rgba(16,185,129,0.12)]"
          : "bg-[#0d0d10]/95 border border-white/[0.08] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]"
      } ${
        isHighlighted
          ? "ring-2 ring-emerald-400/60 shadow-[0_0_28px_rgba(52,211,153,0.35)]"
          : ""
      }`}
    >
      {/* 1. TOPO: Avatar com Inicial + Nome + Status */}
      <div className="flex items-center gap-3.5 pb-5 border-b border-white/[0.06] shrink-0">
        <div className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[18px] font-semibold text-zinc-100 shrink-0 select-none">
          {initial}
        </div>
        <div className="flex flex-col truncate">
          <h3 className="text-[21px] md:text-[23px] font-semibold text-white tracking-tight truncate leading-tight">
            {column.name}
          </h3>
          <span
            className={`text-[11px] font-bold tracking-[0.14em] uppercase mt-1 ${
              isInService ? "text-emerald-400" : "text-zinc-400 font-medium"
            }`}
          >
            {isInService ? "Em Atendimento" : "Disponível"}
          </span>
        </div>
      </div>

      {/* 2. CORPO CENTRAL E INFORMAÇÕES DO ATENDIMENTO */}
      <div className="flex-1 flex flex-col justify-center py-4">
        {inProgressApt ? (
          /* CASO 1: EM ATENDIMENTO */
          <div className="flex flex-col justify-between h-full">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-zinc-400">
                Cliente Atual
              </span>
              <h4 className="text-[22px] md:text-[25px] font-bold text-white tracking-tight leading-snug truncate">
                {inProgressApt.clientName}
              </h4>
              <p className="text-[14.5px] text-zinc-400 font-normal truncate">
                {inProgressApt.serviceName}
              </p>
            </div>

            {/* Caixa de Horário */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 my-4">
              <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-zinc-400 block mb-1">
                Horário
              </span>
              <div className="text-[20px] md:text-[22px] font-bold text-white tracking-tight tabular-nums">
                {inProgressApt.startTime} – {inProgressApt.endTime}
              </div>
            </div>

            {/* Bloco Próximo Atendimento */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.16em] uppercase text-zinc-400">
                <span>Próximo</span>
                {nextApt && (
                  <span className="text-[13px] font-bold text-zinc-300 tabular-nums">
                    {nextApt.startTime}
                  </span>
                )}
              </div>
              {nextApt ? (
                <div className="mt-1.5 space-y-0.5">
                  <h5 className="text-[15.5px] font-semibold text-zinc-100 tracking-tight truncate">
                    {nextApt.clientName}
                  </h5>
                  <p className="text-[13px] text-zinc-400 font-normal truncate">
                    {nextApt.serviceName}
                  </p>
                </div>
              ) : (
                <div className="mt-1.5">
                  <h5 className="text-[15px] font-medium text-zinc-500 tracking-tight">
                    Nenhum cliente agendado
                  </h5>
                  <p className="text-[12.5px] text-zinc-600 font-normal">
                    Último atendimento do dia
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : nextApt ? (
          /* CASO 2: DISPONÍVEL COM PRÓXIMO AGENDAMENTO */
          <div className="flex flex-col justify-between h-full">
            <div className="flex flex-col items-center justify-center text-center py-4 my-auto">
              <CheckCircle2 className="w-8 h-8 text-zinc-400 stroke-[1.5]" />
              <h4 className="text-[20px] md:text-[22px] font-semibold text-white tracking-tight mt-2.5">
                Livre agora
              </h4>
              <p className="text-[13.5px] text-zinc-400 font-normal mt-0.5">
                Disponível para atendimento
              </p>
            </div>

            {/* Bloco Próximo Horário */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 my-3">
              <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-zinc-400 block mb-1">
                Próximo Horário
              </span>
              <div className="text-[24px] md:text-[26px] font-bold text-white tracking-tight tabular-nums">
                {nextApt.startTime}
              </div>
              <p className="text-[13.5px] text-zinc-300 font-medium mt-1 truncate">
                {nextApt.clientName} · {nextApt.serviceName}
              </p>
            </div>

            {/* Bloco Tempo Livre */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-zinc-400 block">
                Tempo Livre
              </span>
              <div className="text-[19px] md:text-[21px] font-bold text-white tracking-tight mt-0.5 tabular-nums">
                {freeTimeText}
              </div>
            </div>
          </div>
        ) : (
          /* CASO 3: DISPONÍVEL SEM MAIS AGENDAMENTOS (AGENDA LIVRE) */
          <div className="flex flex-col justify-between h-full">
            <div className="flex flex-col items-center justify-center text-center py-4 my-auto">
              <Calendar className="w-8 h-8 text-zinc-400 stroke-[1.5]" />
              <h4 className="text-[20px] md:text-[22px] font-semibold text-white tracking-tight mt-2.5">
                Livre agora
              </h4>
              <p className="text-[13.5px] text-zinc-400 font-normal mt-0.5">
                Disponível para atendimento
              </p>
            </div>

            {/* Bloco Sem Agenda */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 my-3">
              <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-zinc-400 block mb-1">
                Próximo Horário
              </span>
              <div className="text-[20px] md:text-[22px] font-bold text-white tracking-tight">
                Sem agenda
              </div>
              <p className="text-[13.5px] text-zinc-400 font-normal mt-1">
                Nenhum agendamento previsto
              </p>
            </div>

            {/* Bloco Situação */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-zinc-400 block">
                Situação
              </span>
              <div className="text-[19px] md:text-[21px] font-semibold text-white tracking-tight mt-0.5">
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

  const serverTimeOffsetRef = useRef<number>(0);
  const previousAptsRef = useRef<Map<string, string>>(new Map());
  const wakeLockRef = useRef<any>(null);
  const retryCountRef = useRef(0);

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
      className="relative flex flex-col justify-between h-screen w-screen p-6 md:p-10 bg-[#070709] text-white overflow-hidden transition-transform duration-1000 select-none"
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

      {/* 1. Header Superior Fixo: LUVEA | Meu Estúdio & 18:02 SÁB · 24 OUT 2026 */}
      <header className="w-full flex items-center justify-between pb-5 border-b border-white/[0.08] shrink-0">
        {/* Esquerda: Identidade do Estúdio + Subtítulo PAINEL DE ATENDIMENTOS */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl md:text-[26px] font-bold tracking-tight text-white font-mono">
              LUVEA
            </span>
            <span className="text-zinc-600 font-light text-xl">|</span>
            <span className="text-lg md:text-xl font-semibold tracking-tight text-zinc-100 truncate max-w-md">
              {boardData?.organizationName || "Meu Estúdio"}
            </span>
          </div>
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mt-1">
            Painel de Atendimentos
          </span>
        </div>

        {/* Direita: Relógio Digital Limpo e Data Localizada */}
        <div className="flex flex-col items-end text-right">
          <span className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight text-white leading-none">
            {clockTime || "--:--"}
          </span>
          <span className="text-xs md:text-[13px] font-semibold tracking-wider uppercase text-zinc-400 mt-1.5">
            {clockDate}
          </span>
        </div>
      </header>

      {/* 2. Barra de Seção: Equipe em tempo real + SINCRONIZADO */}
      <div className="w-full flex items-center justify-between py-4 shrink-0">
        <h2 className="text-[18px] md:text-[20px] font-semibold text-zinc-100 tracking-tight">
          Equipe em tempo real
        </h2>

        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 ring-2 ring-emerald-500/20" />
              </span>
              <span className="text-emerald-400 uppercase text-[11.5px] font-bold tracking-wider">
                Sincronizado
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-500/20 animate-pulse" />
              <span className="text-amber-300 uppercase text-[11.5px] font-bold tracking-wider">
                Reconectando
              </span>
            </>
          )}
        </div>
      </div>

      {/* 3. Corpo Principal: Grid Cockpit de Profissionais */}
      <main className="flex-1 w-full pb-4 overflow-hidden flex flex-col justify-start">
        {!boardData ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-500 text-sm">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
            <span className="font-light tracking-wide text-zinc-400">Sincronizando agenda do dia...</span>
          </div>
        ) : currentColumns.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-zinc-300">
              Nenhum profissional cadastrado
            </h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-sm">
              Cadastre os profissionais na equipe para acompanhar a escala em tempo real na TV.
            </p>
          </div>
        ) : (
          <div
            className="grid h-full gap-5 md:gap-6 transition-opacity duration-500"
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
              />
            ))}
          </div>
        )}
      </main>

      {/* 4. Rodapé Fixo */}
      <footer className="w-full flex items-center justify-between pt-4 border-t border-white/[0.06] text-xs text-zinc-500 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] md:text-[12px] font-medium tracking-widest text-zinc-500 uppercase">
            LUVEA - {boardData?.organizationName?.toUpperCase() || "MEU ESTÚDIO"}
          </span>
        </div>

        {professionalPages.length > 1 && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <span>
              Página {pageIndex + 1} de {professionalPages.length}
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            <span className="text-[11px] text-zinc-500">Alternando a cada 20s</span>
          </div>
        )}

        <div className="text-[11px] md:text-[12px] font-medium tracking-widest text-zinc-500 uppercase">
          AGENDA ATUALIZADA AUTOMATICAMENTE
        </div>
      </footer>
    </div>
  );
}
