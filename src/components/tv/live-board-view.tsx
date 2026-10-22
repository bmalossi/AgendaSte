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

// Micro-indicador semântico de status em conformidade com o AGENTS.md (Zero AI Slop)
function StatusBadge({ status }: { status: TVAppointmentStatus }) {
  switch (status) {
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium bg-emerald-950/80 border border-emerald-800/40 text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20 animate-pulse" />
          Em Atendimento
        </span>
      );
    case "next":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium bg-sky-950/80 border border-sky-800/40 text-sky-300">
          <span className="w-2 h-2 rounded-full bg-sky-400 ring-2 ring-sky-500/20" />
          Confirmado
        </span>
      );
    case "waiting":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium bg-amber-950/80 border border-amber-800/40 text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-500/20" />
          Aguardando
        </span>
      );
    case "delayed":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium bg-rose-950/80 border border-rose-800/40 text-rose-300">
          <span className="w-2 h-2 rounded-full bg-rose-400 ring-2 ring-rose-500/20 animate-pulse" />
          Atrasado
        </span>
      );
    case "completed":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-zinc-500" />
          Concluído
        </span>
      );
  }
}

// Card de agendamento individual otimizado para leitura a 3-5 metros
const AppointmentCard = React.memo(function AppointmentCard({
  appointment,
  isHighlighted,
}: {
  appointment: TVAppointmentDTO;
  isHighlighted: boolean;
}) {
  const isCompleted = appointment.status === "completed";

  return (
    <div
      className={`relative w-full rounded-2xl p-5 border transition-all duration-500 flex flex-col justify-between gap-3 ${
        isCompleted
          ? "bg-[#121214] border-[#222226] opacity-60"
          : "bg-[#18181B] border-[#27272A] shadow-lg"
      } ${
        isHighlighted
          ? "ring-2 ring-emerald-500/50 shadow-emerald-950/30"
          : ""
      }`}
    >
      {/* Linha 1: Horário & Badge de Status */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[22px] md:text-[25px] font-bold font-mono text-white tracking-tight">
          {appointment.startTime}
          <span className="text-zinc-500 font-normal text-lg mx-1.5">➔</span>
          {appointment.endTime}
        </span>
        <StatusBadge status={appointment.status} />
      </div>

      {/* Linha 2: Nome do Cliente (LGPD-safe) */}
      <div className="pt-0.5">
        <h4 className="text-[20px] md:text-[23px] font-medium text-zinc-100 tracking-tight leading-tight truncate">
          {appointment.clientName}
        </h4>
        <p className="text-[15px] md:text-[17px] text-zinc-400 mt-1 truncate">
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
      <header className="w-full flex items-center justify-between pb-6 border-b border-[#1E1E22] shrink-0">
        {/* Esquerda: Identidade do Estúdio */}
        <div className="flex items-center gap-4">
          <LuveaWordmark dark className="text-2xl tracking-[0.24em]" />
          <div className="h-6 w-px bg-[#27272A]" />
          <span className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-100 truncate max-w-md">
            {boardData?.organizationName || "Carregando estúdio..."}
          </span>
        </div>

        {/* Centro: Relógio em Tempo Real e Data por Extenso */}
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-3xl md:text-4xl font-mono font-bold tracking-tight text-white">
            {clockTime || "--:--:--"}
          </span>
          <span className="text-xs md:text-sm text-zinc-400 font-medium tracking-wide mt-0.5">
            {clockDate}
          </span>
        </div>

        {/* Direita: Status de Conexão */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18181B] border border-[#27272A] text-xs font-mono text-zinc-300">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                <span>Ao Vivo</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20 animate-pulse" />
                <span>Reconectando</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Corpo Principal: Grid de Profissionais em Colunas */}
      <main className="flex-1 w-full my-6 overflow-hidden flex flex-col justify-start">
        {!boardData ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-500 font-mono text-sm">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
            <span>Sincronizando agenda do dia...</span>
          </div>
        ) : totalAppointmentsCount === 0 ? (
          /* Estado Vazio: Nenhum agendamento no dia */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="p-4 rounded-3xl bg-[#141417] border border-[#222226] mb-4">
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
            <div className="p-4 rounded-3xl bg-[#141417] border border-[#222226] mb-4">
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
                className="flex flex-col h-full bg-[#111114] border border-[#1E1E22] rounded-3xl p-5 overflow-hidden shadow-xl"
              >
                {/* Nome do Profissional no Topo da Coluna */}
                <div className="pb-4 mb-4 border-b border-[#222226] flex items-center justify-between shrink-0">
                  <h3 className="text-[24px] md:text-[28px] font-semibold text-white tracking-tight truncate">
                    {column.name}
                  </h3>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#18181B] text-zinc-400 border border-[#27272A]">
                    {column.appointments.length}
                  </span>
                </div>

                {/* Lista de Cards de Agendamento da Coluna */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none">
                  {column.appointments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-zinc-600 text-sm font-mono p-4">
                      Horários livres
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

      {/* Rodapé Fixo */}
      <footer className="w-full flex items-center justify-between pt-4 border-t border-[#1E1E22] text-xs text-zinc-500 shrink-0 font-mono">
        <div className="flex items-center gap-4">
          <span>LUVEA Kiosk v1.0</span>
          <span>·</span>
          <span>Atualização automática a cada 20s</span>
        </div>

        {professionalPages.length > 1 && (
          <div className="flex items-center gap-2 text-zinc-400">
            <span>
              Página {pageIndex + 1} de {professionalPages.length}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            <span className="text-[11px] text-zinc-600">Rotação ativa</span>
          </div>
        )}

        <div>
          <span>Conformidade LGPD Ativa</span>
        </div>
      </footer>
    </div>
  );
}
