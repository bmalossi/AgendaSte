"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { LuveaWordmark, LuveaIcon } from "@/components/luvea-logo";
import {
  TVPollingResponse,
  TVAppointmentDTO,
  TVProfessionalColumn,
  TVAppointmentStatus,
  paginateProfessionals,
} from "@/lib/tv-kiosk";

interface LiveBoardViewProps {
  token: string;
  onUnauthorized: () => void;
}

// Micro-indicador semântico de status em conformidade com o AGENTS.md e craft editorial de luxo
// Zero badges berrantes: apenas "Em Atendimento", "A Seguir" e "Em Finalização" quando relevante.
function StatusBadge({ status }: { status: TVAppointmentStatus }) {
  switch (status) {
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12.5px] font-medium bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 ring-2 ring-emerald-500/20" />
          </span>
          Em Atendimento
        </span>
      );
    case "next":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-white/[0.06] border border-white/[0.1] text-zinc-300">
          A Seguir
        </span>
      );
    case "delayed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-300/90">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
          Em Finalização
        </span>
      );
    // "waiting", "completed" e agendamentos futuros não usam badges poluídos
    case "waiting":
    case "completed":
    default:
      return null;
  }
}

// Card de agendamento individual otimizado para leitura nítida a 3-6 metros
const AppointmentCard = React.memo(function AppointmentCard({
  appointment,
  isHighlighted,
}: {
  appointment: TVAppointmentDTO;
  isHighlighted: boolean;
}) {
  const isCompleted = appointment.status === "completed";
  const isInProgress = appointment.status === "in_progress";

  return (
    <div
      className={`relative w-full rounded-2xl p-5 md:p-6 transition-all duration-700 flex flex-col justify-between gap-3.5 ${
        isInProgress
          ? "bg-gradient-to-br from-zinc-900/95 via-zinc-900/70 to-emerald-950/25 border-emerald-500/35 shadow-[0_12px_36px_-8px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/20"
          : isCompleted
          ? "bg-[#0C0C0E]/50 border-white/[0.03] opacity-35"
          : "bg-zinc-900/50 hover:bg-zinc-900/70 border-white/[0.07] shadow-sm"
      } ${
        isHighlighted
          ? "ring-2 ring-emerald-400/60 shadow-[0_0_24px_rgba(52,211,153,0.3)]"
          : ""
      }`}
    >
      {/* Linha 1: Horário Formatado Editorial (Sem setas unicode ou fontes mono cruas) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[23px] md:text-[27px] font-semibold tabular-nums text-white tracking-tight">
            {appointment.startTime}
          </span>
          <span className="text-zinc-600 font-light text-base">–</span>
          <span className="text-[17px] md:text-[20px] font-normal tabular-nums text-zinc-400 tracking-tight">
            {appointment.endTime}
          </span>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      {/* Linha 2: Nome do Cliente (LGPD-safe) e Serviço */}
      <div className="pt-0.5 space-y-1">
        <h4 className="text-[21px] md:text-[25px] font-medium text-zinc-100 tracking-tight leading-snug truncate">
          {appointment.clientName}
        </h4>
        <p className="text-[14.5px] md:text-[16.5px] text-zinc-400 font-normal truncate">
          {appointment.serviceName}
        </p>
      </div>
    </div>
  );
});

export function LiveBoardView({ token, onUnauthorized }: LiveBoardViewProps) {
  const [boardData, setBoardData] = useState<TVPollingResponse | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [reconnectingSeconds, setReconnectingSeconds] = useState<number | null>(null);
  const [clockTime, setClockTime] = useState("");
  const [clockDate, setClockDate] = useState("");
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

  // 4. Relógio digital sincronizado (atualização a cada 1 segundo)
  useEffect(() => {
    const tz = boardData?.timezone || "America/Sao_Paulo";

    const updateClock = () => {
      const current = new Date(Date.now() + serverTimeOffsetRef.current);

      try {
        const timeStr = new Intl.DateTimeFormat("pt-BR", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(current);
        setClockTime(timeStr);

        const dateStr = new Intl.DateTimeFormat("pt-BR", {
          timeZone: tz,
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(current);

        // Capitaliza a primeira letra do dia da semana (ex: Quinta-feira, 22 de Outubro)
        const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        setClockDate(formattedDate);
      } catch {
        setClockTime(current.toLocaleTimeString("pt-BR"));
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

  // 6. Contagem de agendamentos do dia para cálculo de estado vazio
  const totalAppointmentsCount = useMemo(() => {
    if (!boardData?.professionals) return 0;
    return boardData.professionals.reduce(
      (sum, p) => sum + p.appointments.length,
      0
    );
  }, [boardData?.professionals]);

  const activeAppointmentsCount = useMemo(() => {
    if (!boardData?.professionals) return 0;
    return boardData.professionals.reduce(
      (sum, p) =>
        sum +
        p.appointments.filter((a) => a.status !== "completed").length,
      0
    );
  }, [boardData?.professionals]);

  return (
    <div
      style={{
        transform: `translate(${burnInOffset.x}px, ${burnInOffset.y}px)`,
      }}
      className="relative flex flex-col justify-between h-screen w-screen p-6 md:p-10 bg-[#09090B] text-white overflow-hidden transition-transform duration-1000"
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

      {/* Faixa de Aviso de Queda de Conexão (Resiliência) */}
      {!isOnline && (
        <div className="absolute top-0 left-0 w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-2 text-xs font-mono text-amber-300 z-50">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Conexão oscilando. Exibindo última grade sincronizada.
          {reconnectingSeconds && ` Tentando reconectar em ${reconnectingSeconds}s...`}
        </div>
      )}

      {/* Header Fixo */}
      <header className="w-full flex items-center justify-between pb-6 border-b border-white/[0.08] shrink-0">
        {/* Esquerda: Identidade do Estúdio */}
        <div className="flex items-center gap-4">
          <LuveaWordmark dark className="text-2xl tracking-[0.24em]" />
          <div className="h-6 w-px bg-white/[0.1]" />
          <span className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-100 truncate max-w-md">
            {boardData?.organizationName || "Carregando estúdio..."}
          </span>
        </div>

        {/* Centro: Relógio em Tempo Real e Data por Extenso (Editorial Elegante) */}
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-4xl md:text-5xl font-light tabular-nums tracking-tight text-white">
            {clockTime || "--:--:--"}
          </span>
          <span className="text-xs md:text-sm text-zinc-400 font-normal tracking-wider uppercase mt-1">
            {clockDate}
          </span>
        </div>

        {/* Direita: Status de Transmissão */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300">
            {isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 ring-2 ring-emerald-500/20" />
                </span>
                <span className="font-medium tracking-wide">Painel da Recepção</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-500/20 animate-pulse" />
                <span className="font-medium tracking-wide text-amber-300">Reconectando</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Corpo Principal: Grid de Profissionais em Colunas */}
      <main className="flex-1 w-full my-6 overflow-hidden flex flex-col justify-start">
        {!boardData ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-500 text-sm">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
            <span className="font-light tracking-wide text-zinc-400">Sincronizando agenda do dia...</span>
          </div>
        ) : totalAppointmentsCount === 0 ? (
          /* Estado Vazio: Nenhum agendamento no dia */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="p-4 rounded-3xl bg-[#141417] border border-white/[0.08] mb-4">
              <LuveaIcon size={44} dark />
            </div>
            <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-zinc-300">
              Sem agendamentos hoje
            </h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-sm">
              Os novos agendamentos confirmados aparecerão automaticamente nesta tela.
            </p>
          </div>
        ) : activeAppointmentsCount === 0 ? (
          /* Estado Vazio: Todos os agendamentos concluídos */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="p-4 rounded-3xl bg-[#141417] border border-white/[0.08] mb-4">
              <LuveaIcon size={44} dark />
            </div>
            <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-zinc-300">
              Agenda do dia concluída
            </h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-sm">
              Todos os atendimentos programados para hoje foram finalizados.
            </p>
          </div>
        ) : (
          /* Grid de Colunas de Profissionais */
          <div
            className="grid h-full gap-5 transition-opacity duration-500"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, currentColumns.length)}, minmax(0, 1fr))`,
            }}
          >
            {currentColumns.map((column) => (
              <section
                key={column.id}
                className="flex flex-col h-full bg-[#101013]/90 backdrop-blur-2xl border border-white/[0.07] rounded-3xl p-5 md:p-6 overflow-hidden shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]"
              >
                {/* Nome do Profissional no Topo da Coluna com Avatar Elegante */}
                <div className="pb-4 mb-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-sm font-medium text-zinc-200 shrink-0">
                      {column.name.charAt(0)}
                    </div>
                    <h3 className="text-[22px] md:text-[26px] font-semibold text-white tracking-tight truncate">
                      {column.name}
                    </h3>
                  </div>
                  <span className="text-[12px] font-mono font-medium px-2.5 py-1 rounded-full bg-white/[0.04] text-zinc-400 border border-white/[0.06] shrink-0">
                    {column.appointments.filter((a) => a.status !== "completed").length} ativos
                  </span>
                </div>

                {/* Lista de Cards de Agendamento da Coluna */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none">
                  {column.appointments.length === 0 ? (
                    <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mb-2" />
                      <p className="text-sm font-normal text-zinc-500">
                        Disponível para atendimento
                      </p>
                    </div>
                  ) : (
                    column.appointments.map((apt) => (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                        isHighlighted={highlightedIds.has(apt.id)}
                      />
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Rodapé Fixo (Zero Jargão de Desenvolvedor ou AI Slop) */}
      <footer className="w-full flex items-center justify-between pt-4 border-t border-white/[0.06] text-xs text-zinc-500 shrink-0">
        <div className="flex items-center gap-3">
          <span className="tracking-widest uppercase text-[11px] font-medium text-zinc-400">LUVEA</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-500 text-[12px]">Salon OS</span>
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

        <div className="text-[12px] text-zinc-500 font-normal">
          Atendimentos com horário agendado
        </div>
      </footer>
    </div>
  );
}
