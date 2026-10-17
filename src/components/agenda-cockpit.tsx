"use client";

import React, { useState, useMemo } from "react";
import {
  INITIAL_APPOINTMENTS,
  INITIAL_REACTIVATION_LEADS,
  INITIAL_WHATSAPP_LOGS,
  STUDIO_PROFILE,
  type AppointmentItem,
  type AppointmentStatus,
  type ReactivationLead,
  type WhatsAppEventLog,
} from "@/lib/mock-data";
import { formatBRL, cn } from "@/lib/utils";
import { ActionButton, StatusIndicator } from "@/components/ui/primitives";

type ActiveTab = "agenda" | "whatsapp" | "antinoshow" | "financeiro";
type StatusFilter = "all" | AppointmentStatus;

export function AgendaCockpit() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("agenda");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [appointments, setAppointments] =
    useState<AppointmentItem[]>(INITIAL_APPOINTMENTS);
  const [expandedId, setExpandedId] = useState<string | null>("apt-1000");
  const [reactivationLeads, setReactivationLeads] = useState<ReactivationLead[]>(
    INITIAL_REACTIVATION_LEADS
  );
  const [whatsappLogs, setWhatsappLogs] =
    useState<WhatsAppEventLog[]>(INITIAL_WHATSAPP_LOGS);

  const [waConnected, setWaConnected] = useState<boolean>(true);
  const [depositPercent, setDepositPercent] = useState<number>(
    STUDIO_PROFILE.defaultDepositPercent
  );
  const [copiedBioLink, setCopiedBioLink] = useState<boolean>(false);
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [toastBanner, setToastBanner] = useState<{
    message: string;
    tone: "confirmed" | "pending" | "risk";
  } | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState<boolean>(false);
  const [quickClientName, setQuickClientName] = useState<string>("");
  const [quickService, setQuickService] = useState<string>(
    "Avaliação + Toxina Botulínica"
  );
  const [quickTime, setQuickTime] = useState<string>("18:15");

  const triggerToast = (
    message: string,
    tone: "confirmed" | "pending" | "risk" = "confirmed"
  ) => {
    setToastBanner({ message, tone });
    setTimeout(() => {
      setToastBanner((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const metrics = useMemo(() => {
    let totalForecastCents = 0;
    let lockedRevenueCents = 0;
    let pendingRevenueCents = 0;
    let riskRevenueCents = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    let riskCount = 0;

    for (const apt of appointments) {
      totalForecastCents += apt.priceCents;
      if (apt.status === "completed") {
        lockedRevenueCents += apt.priceCents;
        confirmedCount += 1;
      } else if (apt.status === "confirmed") {
        lockedRevenueCents +=
          apt.paymentStatus === "paid" ? apt.priceCents : apt.depositCents;
        pendingRevenueCents +=
          apt.paymentStatus === "paid"
            ? 0
            : apt.priceCents - apt.depositCents;
        confirmedCount += 1;
      } else if (apt.status === "pending") {
        lockedRevenueCents +=
          apt.paymentStatus === "deposit_paid" ? apt.depositCents : 0;
        pendingRevenueCents +=
          apt.paymentStatus === "deposit_paid"
            ? apt.priceCents - apt.depositCents
            : apt.priceCents;
        pendingCount += 1;
      } else {
        riskRevenueCents += apt.priceCents;
        riskCount += 1;
      }
    }

    const confirmationRate =
      appointments.length > 0
        ? Math.round((confirmedCount / appointments.length) * 100)
        : 0;

    return {
      totalForecastCents,
      lockedRevenueCents,
      pendingRevenueCents,
      riskRevenueCents,
      confirmedCount,
      pendingCount,
      riskCount,
      confirmationRate,
    };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    if (statusFilter === "all") return appointments;
    if (statusFilter === "confirmed") {
      return appointments.filter(
        (a) => a.status === "confirmed" || a.status === "completed"
      );
    }
    return appointments.filter((a) => a.status === statusFilter);
  }, [appointments, statusFilter]);

  const handleOneTapConfirm = async (apt: AppointmentItem) => {
    setBusyActionId(`confirm-${apt.id}`);
    setAppointments((prev) =>
      prev.map((item) =>
        item.id === apt.id
          ? {
              ...item,
              status: "confirmed",
              paymentStatus:
                item.paymentStatus === "pending"
                  ? "deposit_paid"
                  : item.paymentStatus,
              whatsappSyncState: {
                ...item.whatsappSyncState,
                reminder2h: true,
                clientReply: "1_confirmed",
                lastMessageAt: "Agora · Confirmado manualmente em 1 toque",
              },
            }
          : item
      )
    );
    setWhatsappLogs((prev) => [
      {
        id: `wa-${Date.now()}`,
        timestamp: "Agora",
        clientName: apt.clientName,
        direction: "outbound",
        badge: "CONFIRMAÇÃO 1-TAP",
        message: `Horário das ${apt.timeSlot} confirmado e sinal validado.`,
        resultingAction: "Status alterado para CONFIRMADO",
      },
      ...prev,
    ]);
    setBusyActionId(null);
    triggerToast(
      `Horário de ${apt.clientName} (${apt.timeSlot}) confirmado.`,
      "confirmed"
    );
  };

  const handleOneTapCheckout = (apt: AppointmentItem) => {
    setAppointments((prev) =>
      prev.map((item) =>
        item.id === apt.id
          ? {
              ...item,
              status: "completed",
              paymentStatus: "paid",
              whatsappSyncState: {
                ...item.whatsappSyncState,
                lastMessageAt: "Agora · Checkout liquidado e recibo emitido",
              },
            }
          : item
      )
    );
    setExpandedId(apt.id);
    triggerToast(
      `Baixa de ${formatBRL(apt.priceCents)} registrada para ${apt.clientName}. Selecione o retorno abaixo.`,
      "confirmed"
    );
  };

  const handleOneTapRebook = async (apt: AppointmentItem, days: 15 | 30 | 45) => {
    setBusyActionId(`rebook-${apt.id}-${days}`);
    const targetDate = new Date(2026, 9, 16);
    targetDate.setDate(targetDate.getDate() + days);
    const formattedDate = targetDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
    const rebookLabel = `${formattedDate} · ${apt.timeSlot} (+${days}d)`;

    try {
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: apt.id,
          clientName: apt.clientName,
          clientPhone: apt.clientPhone,
          templateType: "rebooking_confirmation",
        }),
      });
    } catch {
      // Fallback local
    }

    setAppointments((prev) =>
      prev.map((item) =>
        item.id === apt.id
          ? {
              ...item,
              rebookedFor: rebookLabel,
            }
          : item
      )
    );
    setWhatsappLogs((prev) => [
      {
        id: `wa-${Date.now()}`,
        timestamp: "Agora",
        clientName: apt.clientName,
        direction: "outbound",
        badge: `RETORNO +${days}D`,
        message: `Retorno programado para ${rebookLabel} enviado via WhatsApp.`,
        resultingAction: "Retorno travado na agenda",
      },
      ...prev,
    ]);
    setBusyActionId(null);
    triggerToast(
      `Retorno de ${apt.clientName} agendado para ${rebookLabel}.`,
      "confirmed"
    );
  };

  const handleOneTapPixCharge = async (apt: AppointmentItem) => {
    setBusyActionId(`pix-${apt.id}`);
    let generatedCode = `00020126580014BR.GOV.BCB.PIX0136camilaborges-pix-sinal@veloce.app5204000053039865406${(
      apt.depositCents / 100
    ).toFixed(2)}5802BR5925ATELIER DRA CAMILA BORGES6009SAO PAULO630499B1`;

    try {
      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: apt.id,
          clientName: apt.clientName,
          serviceName: apt.serviceName,
          totalCents: apt.priceCents,
          depositPercent,
        }),
      });
      const data = await res.json();
      if (data?.pixCopiaECola) {
        generatedCode = data.pixCopiaECola;
      }

      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: apt.id,
          clientName: apt.clientName,
          clientPhone: apt.clientPhone,
          templateType: "pix_deposit",
        }),
      });
    } catch {
      // Fallback local
    }

    setAppointments((prev) =>
      prev.map((item) =>
        item.id === apt.id
          ? {
              ...item,
              pixCode: generatedCode,
              whatsappSyncState: {
                ...item.whatsappSyncState,
                lastMessageAt: `Agora · Pix Sinal (${formatBRL(item.depositCents)}) enviado no WhatsApp`,
              },
            }
          : item
      )
    );
    setWhatsappLogs((prev) => [
      {
        id: `wa-${Date.now()}`,
        timestamp: "Agora",
        clientName: apt.clientName,
        direction: "outbound",
        badge: "SINAL PIX 30%",
        message: `Cobrança Pix de ${formatBRL(apt.depositCents)} disparada para o horário ${apt.timeSlot}.`,
        resultingAction: "Aguardando compensação via webhook",
      },
      ...prev,
    ]);
    setExpandedId(apt.id);
    setBusyActionId(null);
    triggerToast(
      `Cobrança Pix de ${formatBRL(apt.depositCents)} enviada para ${apt.clientName}.`,
      "pending"
    );
  };

  const handleRecoverRiskSlot = async (apt: AppointmentItem) => {
    const candidate =
      reactivationLeads.find((l) => !l.campaignSent) || reactivationLeads[0];
    setBusyActionId(`recover-${apt.id}`);

    setAppointments((prev) =>
      prev.map((item) =>
        item.id === apt.id
          ? {
              ...item,
              clientName: `${candidate.clientName} (Encaixe Fila)`,
              clientPhone: candidate.clientPhone,
              serviceName: candidate.lastService,
              priceCents: candidate.averageTicketCents,
              depositCents: Math.round(candidate.averageTicketCents * 0.3),
              status: "confirmed",
              paymentStatus: "deposit_paid",
              whatsappSyncState: {
                reminder24h: true,
                reminder2h: true,
                clientReply: "1_confirmed",
                lastMessageAt:
                  "Agora · Horário recuperado via fila de espera + Sinal Pix",
              },
            }
          : item
      )
    );

    setReactivationLeads((prev) =>
      prev.map((lead) =>
        lead.id === candidate.id ? { ...lead, campaignSent: true } : lead
      )
    );

    setWhatsappLogs((prev) => [
      {
        id: `wa-${Date.now()}`,
        timestamp: "Agora",
        clientName: candidate.clientName,
        direction: "inbound",
        badge: "HORÁRIO SALVO",
        message: `Assumiu vaga das ${apt.timeSlot} com sinal Pix de ${formatBRL(
          Math.round(candidate.averageTicketCents * 0.3)
        )}.`,
        resultingAction: `Receita de ${apt.timeSlot} recuperada`,
      },
      ...prev,
    ]);

    setBusyActionId(null);
    triggerToast(
      `Horário das ${apt.timeSlot} assumido por ${candidate.clientName}.`,
      "confirmed"
    );
  };

  const handleSimulateInboundWhatsAppReply = () => {
    const target = appointments.find((a) => a.status === "pending");
    if (!target) {
      triggerToast(
        "Todos os horários pendentes já estão confirmados.",
        "confirmed"
      );
      return;
    }

    setAppointments((prev) =>
      prev.map((item) =>
        item.id === target.id
          ? {
              ...item,
              status: "confirmed",
              paymentStatus: "deposit_paid",
              whatsappSyncState: {
                reminder24h: true,
                reminder2h: true,
                clientReply: "1_confirmed",
                lastMessageAt:
                  "Agora · Cliente respondeu '1' no WhatsApp (2-Way Sync)",
              },
            }
          : item
      )
    );

    setWhatsappLogs((prev) => [
      {
        id: `wa-${Date.now()}`,
        timestamp: "Agora",
        clientName: target.clientName,
        direction: "inbound",
        badge: "2-WAY SYNC [1]",
        message: `Respondeu "1" ao lembrete automático das ${target.timeSlot}.`,
        resultingAction: `Bloco ${target.timeSlot} confirmado automaticamente`,
      },
      ...prev,
    ]);

    triggerToast(
      `2-Way Sync: ${target.clientName} respondeu "1" e confirmou ${target.timeSlot}.`,
      "confirmed"
    );
  };

  const handleReactivationDispatch = async (lead: ReactivationLead) => {
    setBusyActionId(`lead-${lead.id}`);
    try {
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: lead.clientName,
          clientPhone: lead.clientPhone,
          templateType: "reactivation_45d",
          customMessage: lead.suggestedOffer,
        }),
      });
    } catch {
      // Fallback local
    }

    setReactivationLeads((prev) =>
      prev.map((item) =>
        item.id === lead.id ? { ...item, campaignSent: true } : item
      )
    );
    setWhatsappLogs((prev) => [
      {
        id: `wa-${Date.now()}`,
        timestamp: "Agora",
        clientName: lead.clientName,
        direction: "outbound",
        badge: `REATIVAÇÃO ${lead.daysAbsent}D`,
        message: lead.suggestedOffer,
        resultingAction: "Convite disparado com link de reserva Pix",
      },
      ...prev,
    ]);
    setBusyActionId(null);
    triggerToast(
      `Convite de reativação enviado para ${lead.clientName}.`,
      "confirmed"
    );
  };

  const handleQuickAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientName.trim()) return;
    const newApt: AppointmentItem = {
      id: `apt-${Date.now()}`,
      timeSlot: quickTime,
      endTime: "19:00",
      durationMinutes: 45,
      clientName: quickClientName.trim(),
      clientPhone: "+55 11 99502-1180",
      clientSince: "Out 2026",
      serviceName: quickService,
      serviceCategory: "Encaixe",
      priceCents: 45000,
      depositCents: 13500,
      status: "pending",
      paymentStatus: "pending",
      whatsappSyncState: {
        reminder24h: true,
        reminder2h: false,
        clientReply: "awaiting",
        lastMessageAt: "Agora · Cobrança de Sinal Pix 30% enviada no WhatsApp",
      },
      clinicalRecord: {
        lastVisitLabel: "Primeira sessão / Encaixe",
        totalVisits: 1,
        ltvCents: 45000,
        anamnesisSummary:
          "Cadastro rápido de balcão. Anamnese digital enviada via link no WhatsApp.",
        protocolNotes: "Aguardando compensação do sinal Pix de R$ 135,00.",
        suggestedReturnDays: 30,
      },
      rebookedFor: null,
    };

    setAppointments((prev) => [...prev, newApt]);
    setQuickClientName("");
    setShowQuickAdd(false);
    setExpandedId(newApt.id);
    triggerToast(
      `Encaixe de ${newApt.clientName} às ${newApt.timeSlot} registrado.`,
      "pending"
    );
  };

  const handleCopyBioLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`https://${STUDIO_PROFILE.bookingSlug}`);
    }
    setCopiedBioLink(true);
    setTimeout(() => setCopiedBioLink(false), 2500);
    triggerToast("Link da Bio copiado.", "confirmed");
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-canvas text-ink pb-20 lg:pb-0">
      {/* Notificação Técnica Discreta (Chassi Preto Carbono, Sem Pastel) */}
      {toastBanner && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-3 right-3 left-3 lg:left-auto lg:w-[420px] z-50 flex items-center justify-between gap-3 border border-ink bg-canvas-chassis text-ink-inverted px-4 py-3 text-xs font-mono"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "h-2 w-2 shrink-0",
                toastBanner.tone === "confirmed" && "bg-[#22c55e]",
                toastBanner.tone === "pending" && "bg-[#f59e0b]",
                toastBanner.tone === "risk" && "bg-[#ef4444]"
              )}
              aria-hidden="true"
            />
            <span>{toastBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastBanner(null)}
            className="underline px-1 text-[#a1a19a] hover:text-ink-inverted"
          >
            FECHAR
          </button>
        </div>
      )}

      {/* Grade Arquitetônica Exposta: Sidebar 232px | Coluna Principal | Coluna de Retenção 348px */}
      <div className="mx-auto max-w-[1600px] lg:grid lg:grid-cols-[232px_minmax(0,1fr)_348px] lg:min-h-screen border-x border-line">
        {/* SIDEBAR DESKTOP (Chassi Industrial #0D0E0D) */}
        <aside
          aria-label="Navegação Principal do Estúdio"
          className="hidden lg:flex lg:flex-col lg:justify-between bg-canvas-chassis text-ink-inverted border-r border-line"
        >
          <div>
            {/* Cabeçalho da Marca */}
            <div className="px-5 py-5 border-b border-[#262726] flex items-baseline justify-between">
              <div>
                <h1 className="font-mono text-base font-bold tracking-wider text-ink-inverted">
                  VELOCE // OS
                </h1>
                <p className="text-xs text-[#9ca09c] mt-1">
                  {STUDIO_PROFILE.studioName}
                </p>
              </div>
              <span className="font-mono text-xs text-[#22c55e]">v2.4</span>
            </div>

            {/* Navegação Estrutural Sem Ícones Decorativos */}
            <nav
              className="divide-y divide-[#262726] border-b border-[#262726]"
              aria-label="Módulos do Sistema"
            >
              <button
                type="button"
                onClick={() => setActiveTab("agenda")}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-3.5 text-left font-mono text-xs font-semibold tracking-tight transition-colors",
                  activeTab === "agenda"
                    ? "bg-[#ffffff] text-[#0d0e0d]"
                    : "text-[#c8ccc8] hover:bg-[#181a18] hover:text-ink-inverted"
                )}
              >
                <span>AGENDA & CHECKOUT</span>
                <span className="tabular-data">[{appointments.length}]</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("whatsapp")}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-3.5 text-left font-mono text-xs font-semibold tracking-tight transition-colors",
                  activeTab === "whatsapp"
                    ? "bg-[#ffffff] text-[#0d0e0d]"
                    : "text-[#c8ccc8] hover:bg-[#181a18] hover:text-ink-inverted"
                )}
              >
                <span>ROBÔ WHATSAPP QR</span>
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <span className="h-2 w-2 bg-[#22c55e]" />
                  <span>SYNC</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("antinoshow")}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-3.5 text-left font-mono text-xs font-semibold tracking-tight transition-colors",
                  activeTab === "antinoshow"
                    ? "bg-[#ffffff] text-[#0d0e0d]"
                    : "text-[#c8ccc8] hover:bg-[#181a18] hover:text-ink-inverted"
                )}
              >
                <span>SINAL PIX ANTI-FALTA</span>
                <span className="tabular-data">{depositPercent}%</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("financeiro")}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-3.5 text-left font-mono text-xs font-semibold tracking-tight transition-colors",
                  activeTab === "financeiro"
                    ? "bg-[#ffffff] text-[#0d0e0d]"
                    : "text-[#c8ccc8] hover:bg-[#181a18] hover:text-ink-inverted"
                )}
              >
                <span>CAIXA & REATIVAÇÃO</span>
                <span className="tabular-data">
                  [{reactivationLeads.filter((l) => !l.campaignSent).length}]
                </span>
              </button>
            </nav>

            {/* Painel de Teste 2-Way Sync */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between font-mono text-xs text-[#c8ccc8]">
                <span>BAILEYS 2-WAY</span>
                <span className="text-[#22c55e]">ONLINE</span>
              </div>
              <p className="text-xs text-[#9ca09c] leading-relaxed">
                Quando o paciente responde <strong className="text-ink-inverted">&quot;1&quot;</strong> no WhatsApp, o status muda sozinho na grade.
              </p>
              <button
                type="button"
                onClick={handleSimulateInboundWhatsAppReply}
                className="w-full min-h-[38px] px-3 py-2 bg-[#181a18] hover:bg-[#242724] text-ink-inverted border border-[#3a3d3a] font-mono text-xs font-semibold tracking-tight transition-colors"
              >
                SIMULAR RESPOSTA &quot;1&quot;
              </button>
            </div>
          </div>

          <div className="p-5 border-t border-[#262726] font-mono text-xs text-[#9ca09c] space-y-1">
            <div>MODO DEMONSTRAÇÃO</div>
            <p className="font-sans text-xs text-[#858a85] leading-snug">
              Dados sintéticos para validação de fluxos em 1 toque.
            </p>
          </div>
        </aside>

        {/* COLUNA CENTRAL: TABELA HORÁRIA SUÍÇA E OPERAÇÃO DE 1 TOQUE */}
        <main className="min-w-0 max-w-full bg-canvas">
          {/* Barra Superior de Comando */}
          <header className="bg-canvas-elevated border-b border-line px-4 py-4 sm:px-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-ink">
                  {activeTab === "agenda" && "Grade Diária & Checkout Rápido"}
                  {activeTab === "whatsapp" && "Pareamento WhatsApp 2-Way Sync"}
                  {activeTab === "antinoshow" && "Regra de Sinal Pix & Link da Bio"}
                  {activeTab === "financeiro" && "Fechamento de Caixa & Reativação"}
                </h2>
                <span className="font-mono text-xs font-semibold text-ink-muted tabular-data">
                  {STUDIO_PROFILE.dateLabel}
                </span>
              </div>
              <p className="text-xs text-ink-secondary mt-1">
                {STUDIO_PROFILE.studioName} · {STUDIO_PROFILE.professionalRole} (Dados sintéticos)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={handleSimulateInboundWhatsAppReply}
              >
                SIMULAR WHATS &quot;1&quot;
              </ActionButton>

              <ActionButton
                variant="primary"
                size="sm"
                onClick={() => {
                  setActiveTab("agenda");
                  setShowQuickAdd((prev) => !prev);
                }}
              >
                + NOVO HORÁRIO
              </ActionButton>
            </div>
          </header>

          {/* RAZÃO FINANCEIRO DO TURNO (Grade Arquitetônica Exposta de 3 Colunas, Zero Pastel) */}
          <section
            aria-label="Razão Financeiro e Filtros de Status"
            className="border-b border-line bg-canvas-elevated"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line">
              <div className="px-4 py-3.5 sm:px-6 flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-[#15803d] shrink-0" />
                  <span className="font-mono text-xs font-semibold text-ink-secondary">
                    GARANTIDO / PAGO
                  </span>
                </div>
                <strong className="font-mono text-base font-bold text-ink tabular-data">
                  {formatBRL(metrics.lockedRevenueCents)}
                </strong>
              </div>

              <div className="px-4 py-3.5 sm:px-6 flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-[#d97706] shrink-0" />
                  <span className="font-mono text-xs font-semibold text-ink-secondary">
                    A RECEBER NO CHECKOUT
                  </span>
                </div>
                <strong className="font-mono text-base font-bold text-ink tabular-data">
                  {formatBRL(metrics.pendingRevenueCents)}
                </strong>
              </div>

              <div className="px-4 py-3.5 sm:px-6 flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-[#dc2626] shrink-0" />
                  <span className="font-mono text-xs font-semibold text-ink-secondary">
                    EM RISCO (SEM SINAL)
                  </span>
                </div>
                <strong className="font-mono text-base font-bold text-[#b91c1c] tabular-data">
                  {formatBRL(metrics.riskRevenueCents)}
                </strong>
              </div>
            </div>

            {/* Seletor Mecânico de Filtro por Status (Sem Pílulas Pastéis) */}
            <div
              role="group"
              aria-label="Filtrar grade por status"
              className="grid grid-cols-2 sm:grid-cols-4 border-t border-line divide-y sm:divide-y-0 divide-x divide-line bg-canvas"
            >
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "min-h-[40px] px-4 py-2 font-mono text-xs font-semibold tracking-tight flex items-center justify-between transition-colors tabular-data",
                  statusFilter === "all"
                    ? "bg-ink text-ink-inverted"
                    : "bg-canvas text-ink-secondary hover:bg-canvas-subtle"
                )}
              >
                <span>TODOS OS HORÁRIOS</span>
                <span>[{appointments.length}]</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("confirmed")}
                className={cn(
                  "min-h-[40px] px-4 py-2 font-mono text-xs font-semibold tracking-tight flex items-center justify-between transition-colors tabular-data",
                  statusFilter === "confirmed"
                    ? "bg-ink text-ink-inverted"
                    : "bg-canvas text-ink-secondary hover:bg-canvas-subtle"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 bg-[#15803d]" />
                  <span>CONFIRMADOS</span>
                </span>
                <span>[{metrics.confirmedCount}]</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={cn(
                  "min-h-[40px] px-4 py-2 font-mono text-xs font-semibold tracking-tight flex items-center justify-between transition-colors tabular-data",
                  statusFilter === "pending"
                    ? "bg-ink text-ink-inverted"
                    : "bg-canvas text-ink-secondary hover:bg-canvas-subtle"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 bg-[#d97706]" />
                  <span>PENDENTES</span>
                </span>
                <span>[{metrics.pendingCount}]</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("risk")}
                className={cn(
                  "min-h-[40px] px-4 py-2 font-mono text-xs font-semibold tracking-tight flex items-center justify-between transition-colors tabular-data",
                  statusFilter === "risk"
                    ? "bg-ink text-ink-inverted"
                    : "bg-canvas text-ink-secondary hover:bg-canvas-subtle"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 bg-[#dc2626]" />
                  <span>FALTA / RISCO</span>
                </span>
                <span>[{metrics.riskCount}]</span>
              </button>
            </div>
          </section>

          {/* FORMULÁRIO INLINE DE ENCAIXE RÁPIDO */}
          {showQuickAdd && (
            <form
              onSubmit={handleQuickAddAppointment}
              className="border-b border-ink bg-canvas-subtle px-4 py-4 sm:px-6 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold text-ink">
                  NOVO ENCAIXE COM COBRANÇA AUTOMÁTICA DE SINAL PIX ({depositPercent}%)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="font-mono text-xs font-semibold text-ink-secondary underline"
                >
                  FECHAR
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <label className="block sm:col-span-2">
                  <span className="font-mono text-xs font-semibold text-ink-secondary">
                    PACIENTE / CLIENTE
                  </span>
                  <input
                    type="text"
                    required
                    value={quickClientName}
                    onChange={(e) => setQuickClientName(e.target.value)}
                    placeholder="Nome completo"
                    className="mt-1 w-full min-h-[38px] border border-line bg-canvas-elevated px-3 py-1.5 text-sm text-ink"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-xs font-semibold text-ink-secondary">
                    PROTOCOLO
                  </span>
                  <select
                    value={quickService}
                    onChange={(e) => setQuickService(e.target.value)}
                    className="mt-1 w-full min-h-[38px] border border-line bg-canvas-elevated px-2.5 py-1.5 text-sm text-ink"
                  >
                    <option value="Avaliação + Toxina Botulínica">
                      Avaliação + Toxina (R$ 450)
                    </option>
                    <option value="Limpeza Ultrassônica + LED">
                      Limpeza + LED (R$ 340)
                    </option>
                    <option value="Sessão Drenagem Pós-Op">
                      Drenagem Pós-Op (R$ 280)
                    </option>
                  </select>
                </label>
                <div className="flex items-end gap-2">
                  <label className="block flex-1">
                    <span className="font-mono text-xs font-semibold text-ink-secondary">
                      HORA
                    </span>
                    <input
                      type="time"
                      value={quickTime}
                      onChange={(e) => setQuickTime(e.target.value)}
                      className="mt-1 w-full min-h-[38px] border border-line bg-canvas-elevated px-2.5 py-1.5 font-mono text-sm text-ink tabular-data"
                    />
                  </label>
                  <ActionButton type="submit" variant="primary" size="md">
                    GRAVAR
                  </ActionButton>
                </div>
              </div>
            </form>
          )}

          {/* =================================================================
              MÓDULO A: TABELA HORÁRIA SUÍÇA (Sem Caixas Coloridas nos Horários,
              Sem Pílulas Pastéis, Sem Ícones de Enfeite)
              ================================================================= */}
          {activeTab === "agenda" && (
            <section
              aria-label="Grade Horária do Dia"
              className="divide-y divide-line bg-canvas-elevated border-b border-line"
            >
              {filteredAppointments.map((apt) => {
                const isExpanded = expandedId === apt.id;
                const remainingCents =
                  apt.paymentStatus === "paid"
                    ? 0
                    : apt.paymentStatus === "deposit_paid"
                    ? apt.priceCents - apt.depositCents
                    : apt.priceCents;

                return (
                  <article key={apt.id} className="transition-colors duration-100">
                    {/* Linha Estrutural da Tabela Horária */}
                    <div className="grid grid-cols-1 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:divide-x divide-line">
                      {/* Célula 1: Coluna Cronológica Pura (Sem caixa colorida de fundo) */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : apt.id)
                        }
                        aria-expanded={isExpanded}
                        className="px-4 py-3.5 text-left flex sm:flex-col items-baseline sm:items-start justify-between sm:justify-center gap-2 hover:bg-canvas-subtle transition-colors border-b sm:border-b-0 border-line"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-2.5 w-2.5 shrink-0",
                              (apt.status === "confirmed" ||
                                apt.status === "completed") &&
                                "bg-[#15803d]",
                              apt.status === "pending" && "bg-[#d97706]",
                              apt.status === "risk" && "bg-[#dc2626]"
                            )}
                            aria-hidden="true"
                          />
                          <span className="font-mono text-lg font-bold text-ink tabular-data tracking-tight">
                            {apt.timeSlot}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-ink-muted tabular-data">
                          {apt.endTime} · {apt.durationMinutes}M
                        </span>
                      </button>

                      {/* Célula 2: Dados do Paciente, Procedimento e Sincronização */}
                      <div className="px-4 py-3.5 sm:px-5 space-y-1.5 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <div className="flex items-baseline gap-3 flex-wrap">
                            <h3 className="text-base font-bold text-ink">
                              {apt.clientName}
                            </h3>
                            <StatusIndicator
                              status={apt.status}
                              paymentStatus={apt.paymentStatus}
                            />
                          </div>

                          {apt.rebookedFor && (
                            <span className="font-mono text-xs font-semibold text-ink border border-ink px-2 py-0.5 tabular-data">
                              RETORNO: {apt.rebookedFor}
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline justify-between gap-2 flex-wrap text-sm">
                          <span className="font-medium text-ink-secondary">
                            {apt.serviceName}
                          </span>
                          <div className="font-mono text-sm tabular-data">
                            <strong className="font-bold text-ink">
                              {formatBRL(apt.priceCents)}
                            </strong>
                            {apt.paymentStatus === "deposit_paid" && (
                              <span className="text-xs text-ink-muted ml-2">
                                [SINAL {formatBRL(apt.depositCents)} OK · SALDO{" "}
                                {formatBRL(remainingCents)}]
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-0.5 text-xs font-mono text-ink-muted flex-wrap">
                          <span>WHATS: {apt.whatsappSyncState.lastMessageAt}</span>
                          {apt.clinicalRecord.allergyAlert && (
                            <span className="font-semibold text-[#b91c1c]">
                              ALERTA: {apt.clinicalRecord.allergyAlert}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Célula 3: Teclas de Ação Direta em 1 Toque (POS Keys) */}
                      <div className="px-4 py-3 sm:px-4 flex items-center gap-2 flex-wrap sm:justify-end bg-canvas/40 border-t sm:border-t-0 border-line">
                        {apt.status === "pending" && (
                          <>
                            <ActionButton
                              variant="confirm"
                              size="sm"
                              disabled={busyActionId === `confirm-${apt.id}`}
                              onClick={() => handleOneTapConfirm(apt)}
                            >
                              CONFIRMAR
                            </ActionButton>
                            <ActionButton
                              variant="warning"
                              size="sm"
                              disabled={busyActionId === `pix-${apt.id}`}
                              onClick={() => handleOneTapPixCharge(apt)}
                            >
                              COBRAR PIX
                            </ActionButton>
                          </>
                        )}

                        {apt.status === "confirmed" && (
                          <ActionButton
                            variant="primary"
                            size="sm"
                            onClick={() => handleOneTapCheckout(apt)}
                          >
                            BAIXAR {formatBRL(remainingCents)}
                          </ActionButton>
                        )}

                        {apt.status === "risk" && (
                          <>
                            <ActionButton
                              variant="danger"
                              size="sm"
                              disabled={busyActionId === `recover-${apt.id}`}
                              onClick={() => handleRecoverRiskSlot(apt)}
                            >
                              ACIONAR FILA (R$ 380)
                            </ActionButton>
                            <ActionButton
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOneTapPixCharge(apt)}
                            >
                              REENVIAR PIX
                            </ActionButton>
                          </>
                        )}

                        {apt.status === "completed" && !apt.rebookedFor && (
                          <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleOneTapRebook(
                                apt,
                                apt.clinicalRecord.suggestedReturnDays
                              )
                            }
                          >
                            RETORNO +{apt.clinicalRecord.suggestedReturnDays}D
                          </ActionButton>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : apt.id)
                          }
                          aria-expanded={isExpanded}
                          className={cn(
                            "min-h-[36px] px-3 py-1.5 font-mono text-xs font-semibold border transition-colors",
                            isExpanded
                              ? "bg-ink text-ink-inverted border-ink"
                              : "bg-canvas-elevated text-ink border-line hover:border-ink"
                          )}
                        >
                          {isExpanded ? "FECHAR" : "FICHA"}
                        </button>
                      </div>
                    </div>

                    {/* BARRA DE REAGENDAMENTO DE RETORNO EM 1 TOQUE (1-Tap Rebooking) */}
                    {(apt.status === "completed" || isExpanded) && (
                      <div className="border-t border-line bg-canvas px-4 py-2.5 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-ink-secondary">
                          1-TAP REBOOKING · TRAVAR PRÓXIMO RETORNO COM LEMBRETE WHATSAPP:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {([15, 30, 45] as const).map((days) => {
                            const isSuggested =
                              apt.clinicalRecord.suggestedReturnDays === days;
                            return (
                              <button
                                key={days}
                                type="button"
                                onClick={() => handleOneTapRebook(apt, days)}
                                className={cn(
                                  "min-h-[32px] px-3 py-1 font-mono text-xs font-semibold border transition-colors tabular-data",
                                  isSuggested
                                    ? "bg-ink text-ink-inverted border-ink"
                                    : "bg-canvas-elevated text-ink border-line hover:border-ink"
                                )}
                              >
                                +{days} DIAS {isSuggested ? "[RECOMENDADO]" : ""}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* FICHA TÉCNICA EXPANSÍVEL INLINE (Grade de 3 Colunas Exposta, Zero Cards) */}
                    {isExpanded && (
                      <div className="border-t border-line bg-canvas-subtle grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-line text-xs">
                        {/* Coluna 1: Anamnese & Protocolo */}
                        <div className="p-4 space-y-1.5">
                          <div className="font-mono text-xs font-bold text-ink">
                            PRONTUÁRIO & ANAMNESE
                          </div>
                          <p className="text-sm text-ink-secondary leading-relaxed">
                            {apt.clinicalRecord.anamnesisSummary}
                          </p>
                          <p className="text-xs text-ink-muted leading-relaxed">
                            <strong>Conduta:</strong>{" "}
                            {apt.clinicalRecord.protocolNotes}
                          </p>
                        </div>

                        {/* Coluna 2: Histórico, LTV & Registro Fotográfico */}
                        <div className="p-4 space-y-1.5">
                          <div className="font-mono text-xs font-bold text-ink">
                            HISTÓRICO & ARQUIVO ANTES/DEPOIS
                          </div>
                          <div className="font-mono text-xs text-ink-secondary tabular-data">
                            Última sessão: {apt.clinicalRecord.lastVisitLabel}
                          </div>
                          <div className="font-mono text-xs text-ink-secondary tabular-data">
                            Sessões realizadas: {apt.clinicalRecord.totalVisits}{" "}
                            · LTV:{" "}
                            <strong className="text-ink">
                              {formatBRL(apt.clinicalRecord.ltvCents)}
                            </strong>
                          </div>
                          {apt.clinicalRecord.beforeAfterTag && (
                            <div className="font-mono text-xs font-semibold text-ink pt-1">
                              ARQUIVO: {apt.clinicalRecord.beforeAfterTag}
                            </div>
                          )}
                        </div>

                        {/* Coluna 3: Disparo Direto Pix & WhatsApp */}
                        <div className="p-4 space-y-2.5">
                          <div className="flex items-center justify-between font-mono text-xs font-bold text-ink">
                            <span>COMANDOS DIRETOS</span>
                            <span className="text-ink-secondary tabular-data">
                              {apt.clientPhone}
                            </span>
                          </div>

                          {apt.pixCode && (
                            <div className="space-y-1 pt-1 border-t border-line">
                              <div className="flex items-center justify-between font-mono text-xs font-semibold text-ink">
                                <span>PIX COPIA E COLA:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      typeof navigator !== "undefined" &&
                                      navigator.clipboard
                                    ) {
                                      navigator.clipboard.writeText(
                                        apt.pixCode || ""
                                      );
                                    }
                                    setCopiedPixId(apt.id);
                                    setTimeout(
                                      () => setCopiedPixId(null),
                                      2000
                                    );
                                  }}
                                  className="underline font-mono text-xs"
                                >
                                  {copiedPixId === apt.id
                                    ? "COPIADO"
                                    : "COPIAR CÓDIGO"}
                                </button>
                              </div>
                              <div className="font-mono text-xs break-all text-ink-muted">
                                {apt.pixCode.slice(0, 48)}...
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <ActionButton
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOneTapPixCharge(apt)}
                            >
                              ENVIAR PIX ({formatBRL(apt.depositCents)})
                            </ActionButton>
                            <ActionButton
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOneTapConfirm(apt)}
                            >
                              FORÇAR CONFIRMAÇÃO
                            </ActionButton>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}

          {/* =================================================================
              MÓDULO B: MOTOR DE ROBÔ WHATSAPP (QR CODE & 2-WAY SYNC)
              ================================================================= */}
          {activeTab === "whatsapp" && (
            <section
              aria-label="Configuração do Motor de Robô WhatsApp"
              className="bg-canvas-elevated border-b border-line divide-y divide-line"
            >
              <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-ink">
                    Pareamento Direto via QR Code (Evolution API / Baileys)
                  </h3>
                  <p className="text-sm text-ink-secondary mt-1">
                    Conecta o WhatsApp do consultório sem custo por mensagem. Dispara lembretes 24h e 2h antes e processa respostas <strong>1 (Confirmar)</strong> ou <strong>2 (Reagendar)</strong>.
                  </p>
                </div>
                <ActionButton
                  variant={waConnected ? "primary" : "warning"}
                  size="md"
                  onClick={() => {
                    setWaConnected((prev) => !prev);
                    triggerToast(
                      waConnected
                        ? "Sessão em modo de leitura de novo QR Code."
                        : "WhatsApp reconectado em 2-Way Sync.",
                      waConnected ? "pending" : "confirmed"
                    );
                  }}
                >
                  {waConnected
                    ? "SESSÃO PAREADA · TROCAR APARELHO"
                    : "CONFIRMAR LEITURA DO QR CODE"}
                </ActionButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-line">
                <div className="p-6 flex items-start gap-5">
                  <div
                    aria-label="Matriz QR de Pareamento"
                    className="h-28 w-28 shrink-0 border border-ink bg-canvas p-2 grid grid-cols-5 grid-rows-5 gap-1"
                  >
                    {Array.from({ length: 25 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          idx % 2 === 0 || idx < 5 || idx > 19
                            ? "bg-ink"
                            : "bg-transparent"
                        )}
                      />
                    ))}
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="inline-flex items-center gap-2 font-mono font-bold text-ink">
                      <span className="h-2 w-2 bg-[#15803d]" />
                      <span>{STUDIO_PROFILE.whatsappInstance}</span>
                    </div>
                    <p className="text-sm text-ink-secondary leading-relaxed">
                      Webhook bidirecional ativo para respostas numéricas e confirmação de sinal Pix.
                    </p>
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      onClick={handleSimulateInboundWhatsAppReply}
                    >
                      SIMULAR PACIENTE RESPONDENDO &quot;1&quot;
                    </ActionButton>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h4 className="font-mono text-xs font-bold text-ink">
                    REGRAS DE DISPARO AUTOMÁTICO
                  </h4>
                  <div className="divide-y divide-line border-t border-b border-line">
                    <div className="py-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm text-ink">
                          Gatilho 24h Antes + Cobrança de Sinal Pix
                        </div>
                        <div className="text-xs text-ink-secondary mt-0.5">
                          Envia Pix Copia e Cola caso o sinal de {depositPercent}% esteja em aberto.
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#15803d]">
                        [ATIVO]
                      </span>
                    </div>
                    <div className="py-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm text-ink">
                          Confirmação 2h Antes (1 = Confirmar / 2 = Reagendar)
                        </div>
                        <div className="text-xs text-ink-secondary mt-0.5">
                          Atualiza a grade sozinha ou aciona a fila de espera.
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#15803d]">
                        [ATIVO]
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =================================================================
              MÓDULO C: MÁQUINA ANTI-NO-SHOW (TAXA DE RESERVA PIX & BIO LINK)
              ================================================================= */}
          {activeTab === "antinoshow" && (
            <section
              aria-label="Configuração da Máquina Anti-No-Show"
              className="bg-canvas-elevated border-b border-line divide-y divide-line"
            >
              <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-ink">
                    Link Público de Reserva com Sinal Pix Obrigatório
                  </h3>
                  <p className="text-sm text-ink-secondary mt-1">
                    O horário só é bloqueado na agenda após compensação automática do sinal via Mercado Pago ou Asaas.
                  </p>
                </div>
                <ActionButton
                  variant="primary"
                  size="md"
                  onClick={handleCopyBioLink}
                >
                  {copiedBioLink
                    ? "LINK COPIADO"
                    : `COPIAR ${STUDIO_PROFILE.bookingSlug.toUpperCase()}`}
                </ActionButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-line">
                <div className="p-6 space-y-3">
                  <h4 className="font-mono text-xs font-bold text-ink">
                    PERCENTUAL DE SINAL EXIGIDO NA RESERVA
                  </h4>
                  <p className="text-sm text-ink-secondary">
                    Defina a taxa de comprometimento cobrada no ato do agendamento online:
                  </p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {[20, 30, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setDepositPercent(pct);
                          triggerToast(
                            `Sinal Anti-No-Show definido em ${pct}%.`,
                            "confirmed"
                          );
                        }}
                        className={cn(
                          "min-h-[40px] px-4 py-2 font-mono text-xs font-bold border transition-colors tabular-data",
                          depositPercent === pct
                            ? "bg-ink text-ink-inverted border-ink"
                            : "bg-canvas text-ink border-line hover:border-ink"
                        )}
                      >
                        {pct}% DE SINAL PIX
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-ink">
                    <span>CÁLCULO DEMONSTRATIVO NA BIO</span>
                    <span>PIX DINÂMICO</span>
                  </div>
                  <p className="text-sm text-ink-secondary leading-relaxed">
                    Para <strong>Toxina Botulínica (R$ 1.290,00)</strong>, o paciente paga{" "}
                    <strong className="font-mono text-ink">
                      {formatBRL(Math.round((129000 * depositPercent) / 100))}
                    </strong>{" "}
                    via Pix para travar o horário e quita o saldo restante no checkout em 1 toque.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* =================================================================
              MÓDULO D: FINANCEIRO PROATIVO, PRONTUÁRIO & REATIVAÇÃO 30/45D
              ================================================================= */}
          {activeTab === "financeiro" && (
            <section
              aria-label="Relatório Financeiro e Reativação de Clientes"
              className="bg-canvas-elevated border-b border-line divide-y divide-line"
            >
              <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-ink">
                    Reativação de Pacientes Ausentes (Janela 30/45+ Dias)
                  </h3>
                  <p className="text-sm text-ink-secondary mt-0.5">
                    Pacientes que ultrapassaram o ciclo de retorno do procedimento com disparo direto no WhatsApp.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-ink border border-ink px-3 py-1.5 tabular-data">
                  RECEITA RECUPERÁVEL: R$ 2.290,00
                </span>
              </div>

              <div className="divide-y divide-line">
                {reactivationLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <h4 className="text-base font-bold text-ink">
                          {lead.clientName}
                        </h4>
                        <span className="font-mono text-xs font-semibold text-[#b45309] tabular-data">
                          [{lead.daysAbsent} DIAS SEM RETORNO]
                        </span>
                        <span className="font-mono text-xs font-bold text-ink tabular-data">
                          TICKET: {formatBRL(lead.averageTicketCents)}
                        </span>
                      </div>
                      <p className="text-sm text-ink-secondary">
                        Último procedimento: <strong>{lead.lastService}</strong>{" "}
                        · Janela preferida: {lead.preferredSlot}
                      </p>
                      <p className="text-xs text-ink-muted font-mono">
                        MSG: &ldquo;{lead.suggestedOffer}&rdquo;
                      </p>
                    </div>

                    <div className="shrink-0">
                      <ActionButton
                        variant={lead.campaignSent ? "secondary" : "primary"}
                        size="sm"
                        disabled={
                          lead.campaignSent || busyActionId === `lead-${lead.id}`
                        }
                        onClick={() => handleReactivationDispatch(lead)}
                      >
                        {lead.campaignSent
                          ? "CONVITE ENVIADO"
                          : "DISPARAR WHATSAPP (1-TAP)"}
                      </ActionButton>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* COLUNA TÉCNICA DIREITA (Sem Cards Aninhados, Sem Pílulas Pastéis) */}
        <aside
          aria-label="Console de Automação WhatsApp e Retenção"
          className="border-t lg:border-t-0 lg:border-l border-line bg-canvas-elevated divide-y divide-line"
        >
          {/* Bloco 1: Link da Bio Anti-No-Show */}
          <section className="p-5 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-mono text-xs font-bold text-ink">
                LINK ANTI-NO-SHOW (BIO)
              </h3>
              <span className="font-mono text-xs font-semibold text-[#15803d] tabular-data">
                SINAL PIX {depositPercent}%
              </span>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed">
              Reservas online só entram na grade após pagamento do sinal de {depositPercent}% via Pix.
            </p>

            <div className="flex items-stretch border border-line bg-canvas">
              <div className="flex-1 min-w-0 px-3 py-2 font-mono text-xs text-ink break-all flex items-center">
                {STUDIO_PROFILE.bookingSlug}
              </div>
              <button
                type="button"
                onClick={handleCopyBioLink}
                className="px-3 py-2 bg-ink text-ink-inverted font-mono text-xs font-semibold hover:bg-[#262926] transition-colors shrink-0"
              >
                {copiedBioLink ? "COPIADO" : "COPIAR"}
              </button>
            </div>
          </section>

          {/* Bloco 2: Radar de Reativação 30/45+ Dias */}
          <section className="p-5 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-mono text-xs font-bold text-ink">
                REATIVAÇÃO 30/45+ DIAS
              </h3>
              <span className="font-mono text-xs font-semibold text-[#b45309] tabular-data">
                [{reactivationLeads.filter((l) => !l.campaignSent).length} AUSENTES]
              </span>
            </div>

            <div className="divide-y divide-line border-t border-b border-line">
              {reactivationLeads.map((lead) => (
                <div key={lead.id} className="py-3 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-ink">
                      {lead.clientName}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#b45309] tabular-data">
                      {lead.daysAbsent}D AUSENTE
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs text-ink-secondary gap-2">
                    <span className="break-words">{lead.lastService}</span>
                    <span className="font-mono font-bold text-ink tabular-data shrink-0">
                      {formatBRL(lead.averageTicketCents)}
                    </span>
                  </div>
                  <ActionButton
                    variant={lead.campaignSent ? "ghost" : "secondary"}
                    size="sm"
                    className="w-full"
                    disabled={
                      lead.campaignSent || busyActionId === `lead-${lead.id}`
                    }
                    onClick={() => handleReactivationDispatch(lead)}
                  >
                    {lead.campaignSent
                      ? "CONVITE ENVIADO NO WHATS"
                      : "ACIONAR RETORNO (1-TAP)"}
                  </ActionButton>
                </div>
              ))}
            </div>
          </section>

          {/* Bloco 3: Log em Tempo Real do Robô WhatsApp 2-Way Sync */}
          <section className="p-5 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-mono text-xs font-bold text-ink">
                LOG ROBÔ WHATSAPP 2-WAY
              </h3>
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-ink">
                <span className="h-2 w-2 bg-[#15803d]" />
                <span>ONLINE</span>
              </span>
            </div>

            <div className="divide-y divide-line border-t border-b border-line">
              {whatsappLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="py-2.5 text-xs space-y-1">
                  <div className="flex items-baseline justify-between font-mono text-xs gap-2">
                    <span className="font-bold text-ink">{log.clientName}</span>
                    <span className="text-ink-muted tabular-data">
                      {log.timestamp} · {log.badge}
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary leading-snug">
                    {log.message}
                  </p>
                  <div className="font-mono text-xs font-semibold text-ink">
                    → {log.resultingAction}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* BOTTOM NAVIGATION BAR MOBILE-FIRST (Teclas Mecânicas de 1 Toque) */}
      <nav
        aria-label="Navegação Mobile de 1 Toque"
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-canvas-chassis text-ink-inverted border-t border-[#262726] grid grid-cols-4 divide-x divide-[#262726]"
      >
        <button
          type="button"
          onClick={() => setActiveTab("agenda")}
          className={cn(
            "min-h-[52px] flex items-center justify-center font-mono text-xs font-semibold tracking-tight transition-colors",
            activeTab === "agenda"
              ? "bg-[#ffffff] text-[#0d0e0d]"
              : "text-[#c8ccc8]"
          )}
        >
          AGENDA
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("whatsapp")}
          className={cn(
            "min-h-[52px] flex items-center justify-center font-mono text-xs font-semibold tracking-tight transition-colors",
            activeTab === "whatsapp"
              ? "bg-[#ffffff] text-[#0d0e0d]"
              : "text-[#c8ccc8]"
          )}
        >
          ROBÔ QR
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("antinoshow")}
          className={cn(
            "min-h-[52px] flex items-center justify-center font-mono text-xs font-semibold tracking-tight transition-colors",
            activeTab === "antinoshow"
              ? "bg-[#ffffff] text-[#0d0e0d]"
              : "text-[#c8ccc8]"
          )}
        >
          SINAL PIX
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("financeiro")}
          className={cn(
            "min-h-[52px] flex items-center justify-center font-mono text-xs font-semibold tracking-tight transition-colors",
            activeTab === "financeiro"
              ? "bg-[#ffffff] text-[#0d0e0d]"
              : "text-[#c8ccc8]"
          )}
        >
          CAIXA
        </button>
      </nav>
    </div>
  );
}
