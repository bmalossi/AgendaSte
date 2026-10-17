"use client";

import React, { useState } from "react";
import {
  Users,
  Plus,
  DollarSign,
  TrendingUp,
  Clock,
  Check,
  Play,
  Pause,
  LogOut,
  Sparkles,
  QrCode,
  X,
} from "lucide-react";
import {
  StudioState,
  formatBRL,
  calculatePayrollSummary,
  toggleTimeclockAction,
} from "@/lib/agendaste-store";

interface TeamViewProps {
  section:
    | "team_staff"
    | "team_commissions"
    | "team_payroll"
    | "team_time_tracking";
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
}

function formatSecondsHMS(totalSec: number): string {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;
}

export function TeamView({ section, state, onUpdateState }: TeamViewProps) {
  const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("Especialista em Beleza");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffCommission, setNewStaffCommission] = useState("45");

  // ===========================================================================
  // 1. STAFF (06-5-staff.png)
  // ===========================================================================
  if (section === "team_staff") {
    return (
      <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        {/* Editorial Hero Card matching 06-5-staff.png */}
        <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-gg-card">
          <div className="lg:col-span-7 space-y-4">
            <h1 className="font-display text-[42px] leading-[1.06] text-[#1C1C1E]">
              Feito para equipes que trabalham melhor juntas
            </h1>
            <p className="text-[15px] text-[#6E6E73] max-w-xl">
              Adicione profissionais parceiros, personalize permissões de agenda, defina metas semanais e automatize repasses.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setAddStaffModalOpen(true)}
                className="px-6 py-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[14px] font-semibold transition"
              >
                Adicionar membro da equipe
              </button>
              <button
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    staffMode: prev.staffMode === "solo" ? "team" : "solo",
                    lastToastMessage:
                      prev.staffMode === "solo"
                        ? "Modo Equipe ativado!"
                        : "Modo Individual (Trabalho sozinho) ativado!",
                  }))
                }
                className="px-6 py-3 rounded-full bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[#1C1C1E] text-[14px] font-semibold transition"
              >
                {state.staffMode === "solo"
                  ? "Modo Individual Ativo (Mudar p/ Equipe)"
                  : "Trabalho sozinho (I work solo)"}
              </button>
            </div>
          </div>

          {/* Right Mockup Card (Ava Robinson — Owner from 06-5-staff.png) */}
          <div className="lg:col-span-5 bg-white rounded-[20px] p-5 border border-[#E5E5EA] shadow-gg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#DDD6FE] flex items-center justify-center font-bold text-[#1C1C1E]">
                  BF
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#1C1C1E]">
                    Bruno Fernandes Malossi Silva
                  </p>
                  <p className="text-[12px] text-[#6E6E73]">
                    Proprietário (Owner) · Acesso Total
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#16A34A] text-white text-[11px] font-bold shadow-sm">
                Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Active Staff List */}
        <div className="bg-white rounded-[20px] border border-[#E5E5EA] shadow-gg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EFEFF4] flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#1C1C1E]">
              Profissionais do Estúdio ({state.staff.length})
            </h2>
            <button
              onClick={() => setAddStaffModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#1C1C1E] text-white text-[12px] font-semibold"
            >
              + Adicionar profissional
            </button>
          </div>
          <div className="divide-y divide-[#EFEFF4]">
            {state.staff.map((member) => (
              <div
                key={member.id}
                className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-[#FAFAFC]"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold text-[#1C1C1E]"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-bold text-[#1C1C1E]">
                        {member.fullName}
                      </p>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[11px] font-semibold">
                        {member.role}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#6E6E73]">
                      {member.email} · {member.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-[11px] text-[#8E8E93]">
                      Comissão Serviços / Produtos
                    </p>
                    <p className="text-[13px] font-mono font-bold text-[#1C1C1E]">
                      {member.serviceCommissionPercent}% /{" "}
                      {member.productCommissionPercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#8E8E93]">
                      Agendado na semana
                    </p>
                    <p className="text-[14px] font-mono font-bold text-[#16A34A]">
                      {formatBRL(member.bookedThisWeekCents)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {addStaffModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-gg-modal">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-bold text-[#1C1C1E]">
                  Adicionar Membro da Equipe
                </h3>
                <button onClick={() => setAddStaffModalOpen(false)}>
                  <X className="w-4 h-4 text-[#6E6E73]" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Nome completo"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
              />
              <input
                type="text"
                placeholder="Cargo / Especialidade"
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
              />
              <input
                type="email"
                placeholder="E-mail profissional"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
              />
              <input
                type="number"
                placeholder="% Comissão sobre serviços (Ex: 45)"
                value={newStaffCommission}
                onChange={(e) => setNewStaffCommission(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono"
              />
              <button
                onClick={() => {
                  if (!newStaffName.trim()) return;
                  const parts = newStaffName.trim().split(" ");
                  const initials = parts
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  onUpdateState((prev) => ({
                    ...prev,
                    staff: [
                      ...prev.staff,
                      {
                        id: `staff-${Date.now()}`,
                        firstName: parts[0],
                        lastName: parts.slice(1).join(" "),
                        fullName: newStaffName.trim(),
                        initials,
                        role: newStaffRole,
                        email:
                          newStaffEmail || "equipe@aurastudio.com.br",
                        phone: "(11) 99777-1122",
                        avatarColor: "#BAE6FD",
                        serviceCommissionPercent: Math.min(
                          100,
                          Math.max(0, parseInt(newStaffCommission || "45", 10))
                        ),
                        productCommissionPercent: 15,
                        weeklyGoalCents: 600000,
                        bookedThisWeekCents: 185000,
                        clockInNotificationsEnabled: true,
                        assignedServiceIds: prev.services.map((s) => s.id),
                      },
                    ],
                    lastToastMessage: `${newStaffName.trim()} adicionado(a) à equipe!`,
                  }));
                  setAddStaffModalOpen(false);
                  setNewStaffName("");
                }}
                className="w-full py-3 rounded-full bg-[#1C1C1E] text-white text-[14px] font-semibold"
              >
                Salvar Profissional
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // 2. COMMISSIONS (06-5-commissions.png)
  // ===========================================================================
  if (section === "team_commissions") {
    return (
      <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        {/* Editorial Hero Card matching 06-5-commissions.png */}
        <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-gg-card">
          <div className="lg:col-span-7 space-y-4">
            <h1 className="font-display text-[42px] leading-[1.06] text-[#1C1C1E]">
              Gerencie comissões com facilidade
            </h1>
            <p className="text-[15px] text-[#6E6E73] max-w-xl">
              Configure estruturas de comissão por serviços e produtos para cada profissional e acompanhe metas semanais em tempo real.
            </p>
          </div>

          {/* Dark Weekly Goal Card from 06-5-commissions.png */}
          <div className="lg:col-span-5 bg-[#1C1C1E] text-white rounded-[22px] p-6 space-y-4 shadow-gg-card">
            <div className="flex items-center justify-between text-[12px] text-[#A1A1AA]">
              <span className="uppercase tracking-wider font-semibold">
                Meta Semanal (Weekly Goal)
              </span>
              <span className="font-mono text-white">R$ 6.250,00</span>
            </div>
            <div>
              <p className="text-[28px] font-mono font-bold text-white">
                R$ 8.250,00
              </p>
              <p className="text-[12px] text-[#16A34A] font-semibold">
                Agendado nesta semana · 132% da meta atingida ✓
              </p>
            </div>
            <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-[#E11D8F] w-full rounded-full" />
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[13px]">
              <span className="text-[#A1A1AA]">Comissão acumulada</span>
              <span className="font-mono font-bold text-white">
                R$ 3.712,50
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Commission Policy Editor per Staff */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.staff.map((member) => {
            const pctGoal = Math.min(
              100,
              Math.round(
                (member.bookedThisWeekCents /
                  Math.max(1, member.weeklyGoalCents)) *
                  100
              )
            );
            const earnedCommissionCents = Math.round(
              member.bookedThisWeekCents *
                (member.serviceCommissionPercent / 100)
            );

            return (
              <div
                key={member.id}
                className="bg-white rounded-[22px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[#1C1C1E]"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.initials}
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold text-[#1C1C1E]">
                        {member.fullName}
                      </h3>
                      <p className="text-[12px] text-[#6E6E73]">{member.role}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[15px] font-bold text-[#6E56CF]">
                    Comissão: {formatBRL(earnedCommissionCents)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="p-4 rounded-[16px] bg-[#FAFAFC] border border-[#EFEFF4] space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#6E6E73]">
                      Agendado: <strong>{formatBRL(member.bookedThisWeekCents)}</strong>
                    </span>
                    <span className="text-[#6E6E73]">
                      Meta: <strong>{formatBRL(member.weeklyGoalCents)}</strong> ({pctGoal}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E5E5EA] overflow-hidden">
                    <div
                      className="h-full bg-[#6E56CF] rounded-full transition-all"
                      style={{ width: `${pctGoal}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">
                      % Comissão Serviços
                    </label>
                    <input
                      type="number"
                      value={member.serviceCommissionPercent}
                      onChange={(e) => {
                        const val = Math.min(
                          100,
                          Math.max(0, parseInt(e.target.value || "0", 10))
                        );
                        onUpdateState((prev) => ({
                          ...prev,
                          staff: prev.staff.map((s) =>
                            s.id === member.id
                              ? { ...s, serviceCommissionPercent: val }
                              : s
                          ),
                        }));
                      }}
                      className="w-full px-3.5 py-2 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">
                      % Comissão Produtos (Retail)
                    </label>
                    <input
                      type="number"
                      value={member.productCommissionPercent}
                      onChange={(e) => {
                        const val = Math.min(
                          100,
                          Math.max(0, parseInt(e.target.value || "0", 10))
                        );
                        onUpdateState((prev) => ({
                          ...prev,
                          staff: prev.staff.map((s) =>
                            s.id === member.id
                              ? { ...s, productCommissionPercent: val }
                              : s
                          ),
                        }));
                      }}
                      className="w-full px-3.5 py-2 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 3. PAYROLL / FECHAMENTO DE REPASSE (06-5-payroll.png)
  // ===========================================================================
  if (section === "team_payroll") {
    const payrollRows = calculatePayrollSummary(state);
    const totalPayrollCents = payrollRows.reduce(
      (sum, r) => sum + r.totalPayoutCents,
      0
    );

    return (
      <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        {/* Editorial Hero matching 06-5-payroll.png */}
        <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-gg-card">
          <div className="lg:col-span-7 space-y-4">
            <h1 className="font-display text-[42px] leading-[1.06] text-[#1C1C1E]">
              Pague sua equipe em minutos, não em horas
            </h1>
            <p className="text-[15px] text-[#6E6E73] max-w-xl">
              Cálculo automático de repasses (Lei do Salão-Parceiro / MEI), somando comissões de serviços, venda de produtos, gorjetas e horas do ponto.
            </p>
            <button
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  lastToastMessage: `Fechamento de repasse Pix (${formatBRL(
                    totalPayrollCents
                  )}) processado para ${payrollRows.length} profissionais!`,
                }))
              }
              className="px-6 py-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[14px] font-semibold transition"
            >
              Rodar fechamento de repasse (Run payroll)
            </button>
          </div>

          {/* Right Mockup Card from 06-5-payroll.png */}
          <div className="lg:col-span-5 bg-white rounded-[20px] p-6 border border-[#E5E5EA] shadow-gg-card space-y-3">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#6E6E73]">
              Total líquido a repassar
            </span>
            <p className="text-[32px] font-mono font-bold text-[#1C1C1E]">
              {formatBRL(totalPayrollCents)}
            </p>
            <p className="text-[12px] text-[#16A34A] font-semibold">
              Conciliado automaticamente com o Histórico de Vendas &amp; Ponto ✓
            </p>
          </div>
        </div>

        {/* Payroll Breakdown Table */}
        <div className="bg-white rounded-[20px] border border-[#E5E5EA] shadow-gg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EFEFF4] flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#1C1C1E]">
              Demonstrativo de Repasse por Profissional
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EFEFF4] text-[12px] font-semibold text-[#8E8E93]">
                  <th className="py-3.5 px-5">Profissional</th>
                  <th className="py-3.5 px-5">Volume Bruto</th>
                  <th className="py-3.5 px-5">Comissão Serviços</th>
                  <th className="py-3.5 px-5">Comissão Produtos</th>
                  <th className="py-3.5 px-5">Gorjetas</th>
                  <th className="py-3.5 px-5">Horas no Ponto</th>
                  <th className="py-3.5 px-5 text-right">Repasse Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFF4] text-[13px]">
                {payrollRows.map((row) => (
                  <tr key={row.staffId} className="hover:bg-[#FAFAFC]">
                    <td className="py-4 px-5 font-bold text-[#1C1C1E]">
                      {row.staffName}
                      <span className="block text-[11px] font-normal text-[#6E6E73]">
                        {row.role}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono">
                      {formatBRL(row.bookedCents)}
                    </td>
                    <td className="py-4 px-5 font-mono text-[#1C1C1E]">
                      {formatBRL(row.serviceCommissionCents)}
                    </td>
                    <td className="py-4 px-5 font-mono text-[#1C1C1E]">
                      {formatBRL(row.productCommissionCents)}
                    </td>
                    <td className="py-4 px-5 font-mono text-[#16A34A]">
                      {formatBRL(row.tipsCents)}
                    </td>
                    <td className="py-4 px-5 font-mono">{row.loggedHours}h</td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-[#6E56CF] text-[15px]">
                      {formatBRL(row.totalPayoutCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 4. TIME TRACKING (06-5-time-tracking.png & 06-5-1.png)
  // ===========================================================================
  const sessionStatus = state.timeTracking.activeSessionStatus;
  const elapsedFormatted = formatSecondsHMS(
    state.timeTracking.activeElapsedSeconds || 15678
  );

  return (
    <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {/* Editorial Hero + Live Dark Timeclock Widget (06-5-time-tracking.png) */}
      <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-gg-card">
        <div className="lg:col-span-7 space-y-4">
          <h1 className="font-display text-[42px] leading-[1.06] text-[#1C1C1E]">
            Controle de ponto simplificado
          </h1>
          <p className="text-[15px] text-[#6E6E73] max-w-xl">
            Gerencie entradas, intervalos e folhas de ponto da equipe em um só lugar, sincronizando automaticamente as horas trabalhadas com o fechamento de repasse.
          </p>
        </div>

        {/* Dark Timeclock 04:21:18 Card from 06-5-time-tracking.png */}
        <div className="lg:col-span-5 bg-[#1C1C1E] text-white rounded-[22px] p-6 space-y-4 shadow-gg-card">
          <div className="flex items-center justify-between">
            <span className="text-[12px] uppercase tracking-wider text-[#A1A1AA] font-semibold">
              Relógio de Ponto (Timeclock)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold">
              {sessionStatus === "clocked_in"
                ? "Em turno ativo"
                : sessionStatus === "on_break"
                  ? "Em intervalo (Break)"
                  : "Turno encerrado"}
            </span>
          </div>

          <p className="text-[36px] font-mono font-bold tracking-wider text-white">
            {elapsedFormatted}
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {sessionStatus === "idle" ? (
              <button
                onClick={() =>
                  onUpdateState((prev) =>
                    toggleTimeclockAction(prev, "check_in")
                  )
                }
                className="col-span-2 py-2.5 rounded-full bg-[#6E56CF] hover:opacity-95 text-white text-[13px] font-semibold"
              >
                Registrar Entrada (Check in)
              </button>
            ) : (
              <>
                <button
                  onClick={() =>
                    onUpdateState((prev) =>
                      toggleTimeclockAction(
                        prev,
                        sessionStatus === "on_break"
                          ? "resume_work"
                          : "take_break"
                      )
                    )
                  }
                  className="py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[13px] font-semibold"
                >
                  {sessionStatus === "on_break"
                    ? "Retornar do intervalo"
                    : "Iniciar intervalo (Take break)"}
                </button>
                <button
                  onClick={() =>
                    onUpdateState((prev) =>
                      toggleTimeclockAction(prev, "check_out")
                    )
                  }
                  className="py-2.5 rounded-full bg-[#E11D8F] hover:opacity-95 text-white text-[13px] font-semibold"
                >
                  Registrar Saída (Check out)
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settings & Timesheets Layout matching 06-5-1.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Anchor Nav */}
        <div className="lg:col-span-3 space-y-1">
          <div className="px-4 py-2.5 rounded-[12px] bg-[#1C1C1E] text-white font-semibold text-[13px] shadow-sm">
            Configurações gerais
          </div>
          <div className="px-4 py-2.5 rounded-[12px] text-[#6E6E73] font-medium text-[13px]">
            Membros da equipe
          </div>
          <div className="px-4 py-2.5 rounded-[12px] text-[#6E6E73] font-medium text-[13px]">
            Folhas de ponto (Timesheets)
          </div>
        </div>

        {/* Right Cards (06-5-1.png) */}
        <div className="lg:col-span-9 space-y-6">
          {/* Card 1: General Settings & Break Rules */}
          <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4">
            <h2 className="text-[18px] font-bold text-[#1C1C1E]">
              Configurações gerais (General settings)
            </h2>

            <div className="flex items-center justify-between py-2 border-b border-[#EFEFF4]">
              <div>
                <p className="text-[14px] font-bold text-[#1C1C1E]">
                  Ativar controle de ponto (Enable time tracking)
                </p>
                <p className="text-[12px] text-[#6E6E73]">
                  Permite que membros da equipe registrem entrada, intervalos e saída.
                </p>
              </div>
              <input
                type="checkbox"
                checked={state.timeTracking.enabled}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    timeTracking: {
                      ...prev.timeTracking,
                      enabled: e.target.checked,
                    },
                  }))
                }
                className="w-5 h-5 accent-[#6E56CF]"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-[14px] font-bold text-[#1C1C1E]">
                  1º tipo de intervalo padrão (1st break type)
                </p>
                <p className="text-[12px] text-[#6E6E73]">
                  Duração padrão do intervalo de almoço/descanso (minutos).
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={state.timeTracking.firstBreakDurationMinutes}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      timeTracking: {
                        ...prev.timeTracking,
                        firstBreakDurationMinutes: Math.max(
                          10,
                          parseInt(e.target.value || "30", 10)
                        ),
                      },
                    }))
                  }
                  className="w-20 px-3 py-1.5 rounded-lg border border-[#E5E5EA] text-[13px] font-mono font-bold"
                />
                <input
                  type="checkbox"
                  checked={state.timeTracking.firstBreakTypeEnabled}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      timeTracking: {
                        ...prev.timeTracking,
                        firstBreakTypeEnabled: e.target.checked,
                      },
                    }))
                  }
                  className="w-5 h-5 accent-[#6E56CF]"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Team Members Notifications (06-5-1.png) */}
          <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4">
            <h2 className="text-[18px] font-bold text-[#1C1C1E]">
              Notificações de entrada/saída por membro
            </h2>
            <div className="divide-y divide-[#EFEFF4]">
              {state.staff.map((member) => (
                <div
                  key={member.id}
                  className="py-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-[#1C1C1E]"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.initials}
                    </div>
                    <span className="text-[14px] font-semibold text-[#1C1C1E]">
                      {member.fullName}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={member.clockInNotificationsEnabled}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        staff: prev.staff.map((s) =>
                          s.id === member.id
                            ? {
                                ...s,
                                clockInNotificationsEnabled: e.target.checked,
                              }
                            : s
                        ),
                      }))
                    }
                    className="w-5 h-5 accent-[#6E56CF]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Recorded Timesheet Logs */}
          <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-3">
            <h2 className="text-[18px] font-bold text-[#1C1C1E]">
              Folhas de Ponto Registradas ({state.timeTracking.logs.length})
            </h2>
            <div className="divide-y divide-[#EFEFF4]">
              {state.timeTracking.logs.map((log) => (
                <div
                  key={log.id}
                  className="py-3 flex items-center justify-between text-[13px]"
                >
                  <div>
                    <p className="font-bold text-[#1C1C1E]">{log.staffName}</p>
                    <p className="text-[12px] text-[#6E6E73]">
                      Data: {log.dateISO} · Entrada {log.checkInTime} – Saída{" "}
                      {log.checkOutTime ?? "Em andamento"} ({log.breakMinutes}m
                      intervalo)
                    </p>
                  </div>
                  <span className="font-mono font-bold text-[#6E56CF]">
                    {formatSecondsHMS(log.totalWorkedSeconds)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
