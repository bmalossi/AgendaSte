"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  FileText,
  Gift,
  QrCode,
  CreditCard,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Copy,
  Trash2,
  DollarSign,
  Package,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Calendar,
  Clock,
  User,
  ShoppingBag,
  Layers,
  Award,
  Box,
  Mail,
  Receipt,
  Banknote,
  ChevronRight,
} from "lucide-react";
import {
  StudioState,
  InvoiceLineItem,
  CalendarEventItem,
  SaleHistoryRecord,
  formatBRL,
  formatDateBR,
  getTodayDateISO,
  createAndSendInvoice,
  executeQuickSaleCheckout,
  issueGiftCard,
  createClientProfile,
  saveCatalogService,
} from "@/lib/agendaste-store";

interface PaymentsViewProps {
  section:
    | "payments_sales_history"
    | "payments_invoices"
    | "payments_gift_cards";
  state: StudioState;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
  onOpenQuickSale: (prefillAppointment?: CalendarEventItem) => void;
}

export function PaymentsView({
  section,
  state,
  onUpdateState,
  onOpenQuickSale,
}: PaymentsViewProps) {
  // Sales History Filters (04-1-sales-history.png)
  const [salesSearch, setSalesSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  // Invoices Builder Mode (04-2-invoices.png & 04-2-1-invoices.png)
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [invTitle, setInvTitle] = useState(
    "Pacote Noiva & Produção Completa Aura Studio"
  );
  const [invProviderId, setInvProviderId] = useState(
    state.staff[0]?.id ?? "staff-bruno"
  );
  const [invClientId, setInvClientId] = useState(
    state.clients[0]?.id ?? "cli-stefany"
  );
  const [invMemo, setInvMemo] = useState(
    "Pagamento referente à reserva de data exclusiva com Link Pix / Cartão."
  );
  const [invDueDate, setInvDueDate] = useState("2026-10-30");
  const [invDiscountCents, setInvDiscountCents] = useState(0);
  const [invTaxCents, setInvTaxCents] = useState(0);
  const [invLineItems, setInvLineItems] = useState<InvoiceLineItem[]>([
    {
      id: "li-init-1",
      label: state.services[0]?.name ?? "Loiro Iluminado & Glossing",
      itemType: "service",
      amountCents: state.services[0]?.priceCents ?? 38000,
      quantity: 1,
    },
  ]);

  // Gift Cards Modal
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftRecipientName, setGiftRecipientName] = useState("");
  const [giftRecipientEmail, setGiftRecipientEmail] = useState("");
  const [giftAmountBRL, setGiftAmountBRL] = useState("250");

  // ===========================================================================
  // 1. SALES HISTORY (04-1-sales-history.png)
  // ===========================================================================
  if (section === "payments_sales_history") {
    const filteredSales = state.salesHistory.filter((s) => {
      const q = salesSearch.trim().toLowerCase();
      const matchesText =
        !q ||
        s.clientName.toLowerCase().includes(q) ||
        s.providerName.toLowerCase().includes(q) ||
        s.itemsSummary.toLowerCase().includes(q);
      const matchesMethod =
        methodFilter === "all" || s.paymentMethod === methodFilter;
      return matchesText && matchesMethod;
    });

    const totalRevenueCents = filteredSales.reduce(
      (sum, s) => sum + s.amountCents + s.tipCents,
      0
    );

    return (
      <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
              Histórico de vendas
            </h1>
            <p className="text-[13px] text-[#6E6E73]">
              Acompanhe todas as vendas rápidas, sinais Pix, pacotes e atendimentos concluídos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-[#F5F5F7] text-[13px] font-semibold text-[#1C1C1E]">
              Volume filtrado:{" "}
              <span className="font-mono font-bold text-[#16A34A]">
                {formatBRL(totalRevenueCents)}
              </span>
            </div>
            <button
              onClick={() => onOpenQuickSale()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[13px] font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nova venda rápida</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Row (04-1-sales-history.png) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-4 h-4 text-[#8E8E93] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={salesSearch}
              onChange={(e) => setSalesSearch(e.target.value)}
              placeholder="Buscar por cliente, profissional ou item..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full border border-[#E5E5EA] bg-white text-[13px]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {["all", "Pix", "Cartão", "Pacote", "Vale-Presente"].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-3.5 py-2 rounded-full text-[12px] font-semibold transition ${
                  methodFilter === m
                    ? "bg-[#1C1C1E] text-white"
                    : "bg-white border border-[#E5E5EA] text-[#6E6E73] hover:text-[#1C1C1E]"
                }`}
              >
                {m === "all" ? "Todos os métodos" : m}
              </button>
            ))}
          </div>
        </div>

        {/* Table matching 04-1-sales-history.png */}
        <div className="bg-white rounded-[20px] border border-[#E5E5EA] shadow-gg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EFEFF4] text-[12px] font-semibold text-[#8E8E93]">
                  <th className="py-3.5 px-5">Horário do agendamento</th>
                  <th className="py-3.5 px-5">Cliente</th>
                  <th className="py-3.5 px-5">Profissional</th>
                  <th className="py-3.5 px-5">Itens</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Método</th>
                  <th className="py-3.5 px-5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFF4] text-[13px]">
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-[#FAFAFC] transition"
                  >
                    <td className="py-4 px-5 font-medium text-[#1C1C1E]">
                      {sale.appointmentTimeLabel}
                    </td>
                    <td className="py-4 px-5 font-bold text-[#1C1C1E]">
                      {sale.clientName}
                    </td>
                    <td className="py-4 px-5 text-[#6E6E73]">
                      {sale.providerName}
                    </td>
                    <td className="py-4 px-5 text-[#1C1C1E]">
                      {sale.itemsSummary}
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-[11px] font-medium shadow-2xs">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            sale.status === "Pago"
                              ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                              : sale.status === "Sinal Pago"
                              ? "bg-[#6E56CF] ring-2 ring-[#6E56CF]/20"
                              : "bg-[#D97706] ring-2 ring-[#D97706]/20"
                          }`}
                        />
                        <span>{sale.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-5 font-medium text-[#6E6E73]">
                      {sale.paymentMethod}
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-[#1C1C1E]">
                      {formatBRL(sale.amountCents + sale.tipCents)}
                      {sale.tipCents > 0 && (
                        <span className="block text-[10px] text-[#16A34A]">
                          +{formatBRL(sale.tipCents)} gorjeta
                        </span>
                      )}
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
  // 2. INVOICES & NEW INVOICE BUILDER (04-2-invoices.png & 04-2-1-invoices.png)
  // ===========================================================================
  if (section === "payments_invoices") {
    const subtotalCents = invLineItems.reduce(
      (sum, li) => sum + li.amountCents * li.quantity,
      0
    );
    const totalInvoiceCents = Math.max(
      0,
      subtotalCents - invDiscountCents + invTaxCents
    );

    if (isCreatingInvoice) {
      return (
        <div className="min-h-screen bg-[#FAFAFC] pb-24">
          {/* Top Full-Page Header (04-2-1-invoices.png) */}
          <div className="px-8 py-5 bg-white border-b border-[#E5E5EA] flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreatingInvoice(false)}
                className="w-9 h-9 rounded-full border border-[#E5E5EA] flex items-center justify-center hover:bg-[#F5F5F7]"
              >
                <ArrowLeft className="w-4 h-4 text-[#1C1C1E]" />
              </button>
              <h1 className="text-[22px] font-bold text-[#1C1C1E]">
                Nova fatura (New invoice)
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsCreatingInvoice(false)}
                className="px-5 py-2.5 rounded-full border border-[#E5E5EA] bg-white text-[13px] font-semibold text-[#1C1C1E]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onUpdateState((prev) =>
                    createAndSendInvoice(prev, {
                      title: invTitle,
                      providerId: invProviderId,
                      clientId: invClientId,
                      memo: invMemo,
                      dueDateISO: invDueDate,
                      lineItems: invLineItems,
                      discountCents: invDiscountCents,
                      taxCents: invTaxCents,
                    })
                  );
                  setIsCreatingInvoice(false);
                }}
                className="px-6 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[13px] font-semibold transition"
              >
                Enviar fatura ({formatBRL(totalInvoiceCents)})
              </button>
            </div>
          </div>

          {/* Two-Column Builder Layout matching 04-2-1-invoices.png */}
          <div className="w-full px-6 lg:px-8 xl:px-10 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Anchor Nav */}
            <div className="lg:col-span-3 space-y-1">
              <div className="px-4 py-2.5 rounded-[12px] bg-[#1C1C1E] text-white font-semibold text-[13px] shadow-sm">
                Detalhes básicos
              </div>
              <div className="px-4 py-2.5 rounded-[12px] text-[#6E6E73] font-medium text-[13px]">
                Itens da fatura
              </div>
            </div>

            {/* Right Form Cards */}
            <div className="lg:col-span-9 space-y-6">
              {/* Card 1: Basic Details */}
              <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4">
                <h2 className="text-[18px] font-bold text-[#1C1C1E]">
                  Detalhes básicos
                </h2>

                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                    Título da fatura
                  </label>
                  <input
                    type="text"
                    value={invTitle}
                    onChange={(e) => setInvTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                      Profissional responsável
                    </label>
                    <select
                      value={invProviderId}
                      onChange={(e) => setInvProviderId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] bg-white"
                    >
                      {state.staff.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                      Cliente destinatário
                    </label>
                    <select
                      value={invClientId}
                      onChange={(e) => setInvClientId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] bg-white"
                    >
                      {state.clients.map((cli) => (
                        <option key={cli.id} value={cli.id}>
                          {cli.fullName} ({cli.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-semibold text-[#6E6E73]">
                      Mensagem / Memo na fatura
                    </label>
                    <span className="text-[11px] text-[#8E8E93]">
                      {invMemo.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={invMemo}
                    onChange={(e) => setInvMemo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
                    Data de vencimento
                  </label>
                  <input
                    type="date"
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full max-w-xs px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
                  />
                </div>
              </div>

              {/* Card 2: Invoice Items (04-2-1-invoices.png) */}
              <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 shadow-gg-card space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-bold text-[#1C1C1E]">
                    Itens da fatura
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      setInvLineItems((prev) => [
                        ...prev,
                        {
                          id: `li-${Date.now()}`,
                          label: "Serviço Personalizado / Adicional",
                          itemType: "custom",
                          amountCents: 15000,
                          quantity: 1,
                        },
                      ])
                    }
                    className="px-4 py-2 rounded-full border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[12px] font-semibold text-[#1C1C1E] flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar item</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {invLineItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-[14px] border border-[#E5E5EA] flex flex-wrap items-center justify-between gap-3"
                    >
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) =>
                          setInvLineItems((prev) =>
                            prev.map((li, i) =>
                              i === idx ? { ...li, label: e.target.value } : li
                            )
                          )
                        }
                        className="flex-1 min-w-[200px] px-3 py-1.5 rounded-[10px] border border-[#E5E5EA] text-[13px] font-semibold"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#6E6E73]">R$</span>
                        <input
                          type="number"
                          value={Math.round(item.amountCents / 100)}
                          onChange={(e) => {
                            const val =
                              Math.max(0, parseInt(e.target.value || "0", 10)) *
                              100;
                            setInvLineItems((prev) =>
                              prev.map((li, i) =>
                                i === idx ? { ...li, amountCents: val } : li
                              )
                            );
                          }}
                          className="w-24 px-3 py-1.5 rounded-[10px] border border-[#E5E5EA] text-[13px] font-mono font-bold"
                        />
                        {invLineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setInvLineItems((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="p-1.5 text-[#8E8E93] hover:text-[#DC2626]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal / Discount / Total Breakdown */}
                <div className="pt-4 border-t border-[#EFEFF4] space-y-2 text-[13px]">
                  <div className="flex justify-between text-[#6E6E73]">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatBRL(subtotalCents)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6E6E73]">
                    <span>Desconto (R$)</span>
                    <input
                      type="number"
                      value={Math.round(invDiscountCents / 100)}
                      onChange={(e) =>
                        setInvDiscountCents(
                          Math.max(0, parseInt(e.target.value || "0", 10)) * 100
                        )
                      }
                      className="w-24 px-2.5 py-1 rounded-lg border border-[#E5E5EA] text-right font-mono"
                    />
                  </div>
                  <div className="flex justify-between text-[16px] font-bold text-[#1C1C1E] pt-2 border-t border-[#EFEFF4]">
                    <span>Total da Fatura (Link Pix &amp; Cartão)</span>
                    <span className="font-mono">
                      {formatBRL(totalInvoiceCents)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default Invoices Landing + List (04-2-invoices.png)
    return (
      <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        {/* Editorial Hero Card matching 04-2-invoices.png */}
        <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-gg-card">
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#DDD6FE] text-[12px] font-semibold text-[#1C1C1E]">
              Apresentando Faturas
            </span>
            <h1 className="font-display text-[42px] leading-[1.06] text-[#1C1C1E]">
              Simplifique solicitações de pagamento personalizadas com faturas
            </h1>
            <p className="text-[15px] text-[#6E6E73] max-w-xl">
              Envie faturas profissionais por e-mail ou WhatsApp com cobrança integrada via Pix Dinâmico e Cartão, rastreie vencimentos e receba mais rápido.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsCreatingInvoice(true)}
                className="px-6 py-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[14px] font-semibold transition"
              >
                Criar fatura
              </button>
            </div>
          </div>

          {/* Right Mockup Card (#1000948 from 04-2-invoices.png) */}
          <div className="lg:col-span-5 bg-white rounded-[20px] p-6 border border-[#E5E5EA] shadow-gg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-mono font-bold text-[#6E56CF]">
                FATURA #1000948
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-[11px] font-medium shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                <span>Pix &amp; Cartão Ativo</span>
              </span>
            </div>
            <p className="text-[26px] font-mono font-bold text-[#1C1C1E]">
              R$ 1.125,00
            </p>
            <p className="text-[12px] text-[#6E6E73]">
              Vencimento: 30/10/2026 · Destinatário: Isolde Quinn
            </p>
          </div>
        </div>

        {/* Active Invoices Table */}
        <div className="bg-white rounded-[20px] border border-[#E5E5EA] shadow-gg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EFEFF4] flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#1C1C1E]">
              Faturas Emitidas ({state.invoices.length})
            </h2>
            <button
              onClick={() => setIsCreatingInvoice(true)}
              className="px-4 py-2 rounded-full bg-[#1C1C1E] text-white text-[12px] font-semibold"
            >
              + Nova fatura
            </button>
          </div>
          <div className="divide-y divide-[#EFEFF4]">
            {state.invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-[#FAFAFC]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-bold text-[#6E56CF]">
                      {inv.invoiceNumber}
                    </span>
                    <span className="text-[15px] font-bold text-[#1C1C1E]">
                      {inv.title}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-[11px] font-medium shadow-2xs">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          inv.status === "paid"
                            ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                            : inv.status === "sent"
                            ? "bg-[#6E56CF] ring-2 ring-[#6E56CF]/20"
                            : "bg-[#D97706] ring-2 ring-[#D97706]/20"
                        }`}
                      />
                      <span>
                        {inv.status === "paid"
                          ? "Paga"
                          : inv.status === "sent"
                          ? "Enviada"
                          : "Pendente"}
                      </span>
                    </span>
                  </div>
                  <p className="text-[12px] text-[#6E6E73]">
                    Cliente: {inv.clientName} ({inv.clientEmail}) · Vence em{" "}
                    {formatDateBR(inv.dueDateISO)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[16px] font-mono font-bold text-[#1C1C1E]">
                    {formatBRL(inv.totalCents)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 3. GIFT CARDS (Vale-Presentes)
  // ===========================================================================
  return (
    <div className="w-full px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      <div className="rounded-[24px] bg-gg-hero-gradient border border-[#E5E5EA] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-gg-card">
        <div className="lg:col-span-7 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#DDD6FE] text-[12px] font-semibold text-[#1C1C1E]">
            <Gift className="w-3.5 h-3.5 text-[#E11D8F]" />
            Vale-Presentes Digitais
          </span>
          <h1 className="font-display text-[40px] leading-[1.08] text-[#1C1C1E]">
            Aumente seu faturamento antecipado com Vale-Presentes personalizados
          </h1>
          <p className="text-[15px] text-[#6E6E73] max-w-xl">
            Venda cartões de presente online ou no balcão e permita o abatimento automático de saldo no checkout em 1 toque.
          </p>
          <button
            onClick={() => setGiftModalOpen(true)}
            className="px-6 py-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[14px] font-semibold transition"
          >
            Emitir Vale-Presente
          </button>
        </div>

        <div className="lg:col-span-5 bg-[#1C1C1E] text-white rounded-[22px] p-6 space-y-4 shadow-gg-card">
          <div className="flex items-center justify-between">
            <span className="text-[12px] uppercase tracking-widest text-[#A1A1AA]">
              Aura Studio · Gift Card
            </span>
            <Sparkles className="w-5 h-5 text-[#E11D8F]" />
          </div>
          <p className="font-display text-[34px]">R$ 250,00</p>
          <p className="text-[12px] font-mono text-[#A1A1AA]">
            CÓDIGO: AURA-GIFT-250
          </p>
        </div>
      </div>

      {/* Gift Cards Table */}
      <div className="bg-white rounded-[20px] border border-[#E5E5EA] shadow-gg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EFEFF4] flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#1C1C1E]">
            Vale-Presentes Ativos ({state.giftCards.length})
          </h2>
          <button
            onClick={() => setGiftModalOpen(true)}
            className="px-4 py-2 rounded-full bg-[#1C1C1E] text-white text-[12px] font-semibold"
          >
            + Novo Vale-Presente
          </button>
        </div>
        <div className="divide-y divide-[#EFEFF4]">
          {state.giftCards.map((gc) => (
            <div
              key={gc.id}
              className="p-5 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-mono text-[14px] font-bold text-[#6E56CF]">
                  {gc.code}
                </p>
                <p className="text-[13px] font-semibold text-[#1C1C1E]">
                  Para: {gc.recipientName} ({gc.recipientEmail})
                </p>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-mono font-bold text-[#1C1C1E]">
                  Saldo: {formatBRL(gc.remainingBalanceCents)}
                </p>
                <p className="text-[11px] text-[#8E8E93]">
                  Valor original: {formatBRL(gc.initialBalanceCents)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {giftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-gg-modal">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#1C1C1E]">
                Emitir Vale-Presente
              </h3>
              <button onClick={() => setGiftModalOpen(false)}>
                <X className="w-4 h-4 text-[#6E6E73]" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Nome do presenteado(a)"
              value={giftRecipientName}
              onChange={(e) => setGiftRecipientName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
            />
            <input
              type="email"
              placeholder="E-mail do presenteado(a)"
              value={giftRecipientEmail}
              onChange={(e) => setGiftRecipientEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px]"
            />
            <input
              type="number"
              placeholder="Valor em R$"
              value={giftAmountBRL}
              onChange={(e) => setGiftAmountBRL(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono"
            />
            <button
              onClick={() => {
                const cents =
                  Math.max(10, parseInt(giftAmountBRL || "250", 10)) * 100;
                onUpdateState((prev) =>
                  issueGiftCard(prev, {
                    recipientName: giftRecipientName || "Cliente Especial",
                    recipientEmail:
                      giftRecipientEmail || "presente@aurastudio.com.br",
                    initialBalanceCents: cents,
                  })
                );
                setGiftModalOpen(false);
              }}
              className="w-full py-3 rounded-full bg-[#1C1C1E] text-white text-[14px] font-semibold"
            >
              Emitir Cartão Presente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// GLOBAL QUICK SALE POS DRAWER (Venda Rápida PDV c/ Pix QR Code)
// =============================================================================

interface QuickSaleDrawerProps {
  open: boolean;
  onClose: () => void;
  state: StudioState;
  prefillAppointment?: CalendarEventItem | null;
  onUpdateState: (updater: (prev: StudioState) => StudioState) => void;
}

interface CartItem {
  id: string;
  type: "service" | "product" | "package" | "membership" | "custom";
  name: string;
  priceCents: number;
  durationMinutes?: number;
  calendarColor?: string;
  subtitle?: string;
}

export function QuickSaleDrawer({
  open,
  onClose,
  state,
  prefillAppointment,
  onUpdateState,
}: QuickSaleDrawerProps) {
  // Wizard Navigation Step: 1 = Atendimento, 2 = Itens, 3 = Pagamento & Resumo, 4 = Comprovante
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Atendimento State
  const [clientId, setClientId] = useState<string>(
    prefillAppointment?.clientId ?? ""
  );
  const [providerId, setProviderId] = useState<string>(
    prefillAppointment?.providerId ?? state.staff[0]?.id ?? ""
  );
  const [attendanceDate, setAttendanceDate] = useState<string>(
    prefillAppointment?.dateISO ?? state.calendarView?.selectedDateISO ?? getTodayDateISO()
  );
  const [attendanceTime, setAttendanceTime] = useState<string>(
    prefillAppointment?.startTime ??
      new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );

  // Step 2: Items Cart State
  const [selectedCartItems, setSelectedCartItems] = useState<CartItem[]>(() => {
    if (!prefillAppointment) return [];
    if (prefillAppointment.serviceIds && prefillAppointment.serviceIds.length > 0) {
      const items: CartItem[] = [];
      prefillAppointment.serviceIds.forEach((sid) => {
        const s = state.services.find((x) => x.id === sid);
        if (s) {
          items.push({
            id: s.id,
            type: "service",
            name: s.name,
            priceCents: s.priceCents,
            durationMinutes: s.durationMinutes,
            calendarColor: s.calendarColor,
            subtitle: `${s.durationMinutes} mins · ${s.category}`,
          });
        }
      });
      return items;
    }
    if (prefillAppointment.serviceNames && prefillAppointment.serviceNames.length > 0) {
      return prefillAppointment.serviceNames.map((name, idx) => ({
        id: `pref-srv-${idx}`,
        type: "service" as const,
        name,
        priceCents: prefillAppointment.totalCents,
        durationMinutes: prefillAppointment.activeDurationMinutes,
        calendarColor: prefillAppointment.calendarColor,
        subtitle: `${prefillAppointment.activeDurationMinutes} mins`,
      }));
    }
    return [];
  });
  const [cartActiveTab, setCartActiveTab] = useState<
    "services" | "products" | "packages" | "memberships"
  >("services");
  const [cartSearchQuery, setCartSearchQuery] = useState("");
  const [showCustomItemInput, setShowCustomItemInput] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemAmountBRL, setCustomItemAmountBRL] = useState("");

  // Step 3: Payment & Pix State
  const [paymentMethod, setPaymentMethod] =
    useState<SaleHistoryRecord["paymentMethod"]>("Pix");
  const [cashGivenBRL, setCashGivenBRL] = useState<string>("");
  const [pixAmountMode, setPixAmountMode] = useState<"integral" | "deposit" | "custom">("integral");
  const [customPixBRL, setCustomPixBRL] = useState<string>("");
  const [pixPayload, setPixPayload] = useState<string | null>(null);
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);
  const [pixTicketUrl, setPixTicketUrl] = useState<string | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isPixPaid, setIsPixPaid] = useState(false);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [generatedAmountCents, setGeneratedAmountCents] = useState<number | null>(null);

  // WhatsApp Charge Dispatch in Step 3
  const [phoneRecipientMode, setPhoneRecipientMode] = useState<"registered" | "custom">("registered");
  const [customPhone, setCustomPhone] = useState<string>("");
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppFeedback, setWhatsAppFeedback] = useState<{
    type: "success" | "fallback" | "error";
    message: string;
  } | null>(null);

  // Step 4: Receipt Dispatch State
  const [receiptEmail, setReceiptEmail] = useState("");
  const [isSendingReceiptEmail, setIsSendingReceiptEmail] = useState(false);
  const [receiptEmailFeedback, setReceiptEmailFeedback] = useState<string | null>(null);
  const [isSendingReceiptWhatsApp, setIsSendingReceiptWhatsApp] = useState(false);
  const [receiptWhatsAppFeedback, setReceiptWhatsAppFeedback] = useState<{
    type: "success" | "fallback" | "error";
    message: string;
  } | null>(null);

  // In-place Quick Add Modals State
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("150");
  const [newServiceDuration, setNewServiceDuration] = useState("60");
  const [newServiceCategory, setNewServiceCategory] = useState("Cabelo");

  // Selected Entities & Calculations
  const selectedClient = state.clients.find((c) => c.id === clientId);
  const selectedProvider = state.staff.find((s) => s.id === providerId) ?? state.staff[0];
  const activeGiftCard = state.giftCards.find((g) => g.status === "active");

  const itemsTotalCents = selectedCartItems.reduce((acc, it) => acc + it.priceCents, 0);
  const parsedCustomItem = customItemAmountBRL.trim()
    ? parseFloat(customItemAmountBRL.replace(",", "."))
    : NaN;
  const customItemCents = !isNaN(parsedCustomItem) && parsedCustomItem > 0
    ? Math.round(parsedCustomItem * 100)
    : 0;
  const finalTotalCents = itemsTotalCents + customItemCents;

  const depositPercent = 30;
  const depositCents = Math.round((finalTotalCents * depositPercent) / 100);
  const cleanCustomPix = customPixBRL.trim().replace(",", ".");
  const numCustomPix = parseFloat(cleanCustomPix);
  const parsedCustomPixCents =
    isNaN(numCustomPix) || numCustomPix <= 0
      ? 0
      : Math.round(numCustomPix * 100);

  const targetPixCents =
    pixAmountMode === "integral"
      ? finalTotalCents
      : pixAmountMode === "deposit"
      ? depositCents
      : parsedCustomPixCents;

  // Dinheiro Troco Calculation
  const parsedCashGiven = parseFloat(cashGivenBRL.replace(",", ".")) || 0;
  const cashGivenCents = Math.round(parsedCashGiven * 100);
  const changeCents = Math.max(0, cashGivenCents - finalTotalCents);

  // Sync client email when client changes
  useEffect(() => {
    if (selectedClient?.email) {
      setReceiptEmail(selectedClient.email);
    }
  }, [selectedClient]);

  // Sync prefill appointment if provided or updated
  useEffect(() => {
    if (prefillAppointment) {
      if (prefillAppointment.clientId) setClientId(prefillAppointment.clientId);
      if (prefillAppointment.providerId) setProviderId(prefillAppointment.providerId);
      if (prefillAppointment.dateISO) setAttendanceDate(prefillAppointment.dateISO);
      if (prefillAppointment.startTime) setAttendanceTime(prefillAppointment.startTime);
    }
  }, [prefillAppointment]);

  // Auto-dismiss feedbacks (5 seconds)
  useEffect(() => {
    if (!whatsAppFeedback) return;
    const timer = setTimeout(() => setWhatsAppFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [whatsAppFeedback]);

  useEffect(() => {
    if (!receiptWhatsAppFeedback) return;
    const timer = setTimeout(() => setReceiptWhatsAppFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [receiptWhatsAppFeedback]);

  useEffect(() => {
    if (!receiptEmailFeedback) return;
    const timer = setTimeout(() => setReceiptEmailFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [receiptEmailFeedback]);

  // Real-time Pix status polling (every 4s)
  useEffect(() => {
    if (!open || step !== 3 || isPixPaid || (!currentPaymentId && !currentOrderId)) return;

    const interval = setInterval(async () => {
      try {
        const query = currentPaymentId
          ? `paymentId=${encodeURIComponent(currentPaymentId)}`
          : `orderId=${encodeURIComponent(currentOrderId || "")}`;
        const res = await fetch(`/api/pix/status?${query}`);
        if (!res.ok) return;
        const statusData = await res.json();
        if (statusData?.paid) {
          setIsPixPaid(true);
        }
      } catch (err) {
        // Silencioso em caso de erro transitório de rede
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [open, step, isPixPaid, currentPaymentId, currentOrderId]);

  // Toggle Item in Cart
  const toggleCartItem = (item: CartItem) => {
    setSelectedCartItems((prev) => {
      const exists = prev.some((it) => it.id === item.id);
      if (exists) {
        return prev.filter((it) => it.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
    setPixPayload(null);
  };

  // Generate Pix QR Code
  const handleGeneratePix = async () => {
    if (targetPixCents <= 0) return;
    setIsGeneratingPix(true);
    try {
      const modeLabel =
        pixAmountMode === "integral"
          ? "Integral (100%)"
          : pixAmountMode === "deposit"
          ? "Sinal (30%)"
          : `Valor Personalizado (${formatBRL(targetPixCents)})`;

      const serviceTitle =
        selectedCartItems.map((s) => s.name).join(" + ") ||
        customItemName.trim() ||
        "Venda Rápida PDV";

      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: prefillAppointment?.id || `venda-rapida-${Date.now()}`,
          clientName: selectedClient?.fullName || "Cliente Venda Rápida",
          clientEmail: selectedClient?.email || "cliente@luvea.com.br",
          serviceId: selectedCartItems[0]?.id ?? "quick-sale",
          serviceName: `${serviceTitle} (${modeLabel})`,
          serviceDescription: `Pagamento ${modeLabel} - ${serviceTitle} - ${
            selectedClient?.fullName ?? "Cliente"
          }`,
          totalCents: finalTotalCents,
          depositCents: targetPixCents,
          depositPercent:
            finalTotalCents > 0
              ? Math.round((targetPixCents / finalTotalCents) * 100)
              : 100,
        }),
      });
      const data = await res.json();
      const code =
        data.qrCodePayload ||
        data.pixCopiaECola ||
        "00020126580014BR.GOV.BCB.PIX0136pix@aurastudio.com.br5204000053039865802BR5920AURA STUDIO6009SAO PAULO62070503***6304ABCD";
      setPixPayload(code);
      if (data.qrCodeBase64) setPixQrBase64(data.qrCodeBase64);
      if (data.ticketUrl) setPixTicketUrl(data.ticketUrl);
      if (data.paymentId) setCurrentPaymentId(String(data.paymentId));
      if (data.orderId) setCurrentOrderId(String(data.orderId));
      setIsPixPaid(false);
      setGeneratedAmountCents(targetPixCents);
    } catch (err) {
      console.error("Erro ao gerar Pix no PDV:", err);
      setPixPayload(
        "00020126580014BR.GOV.BCB.PIX0136pix@aurastudio.com.br5204000053039865802BR5920AURA STUDIO6009SAO PAULO62070503***6304ABCD"
      );
      setGeneratedAmountCents(targetPixCents);
    } finally {
      setIsGeneratingPix(false);
    }
  };

  // Send Pix to WhatsApp (Step 3)
  const handleSendWhatsAppPix = async () => {
    if (!pixPayload) return;
    const clientName = selectedClient?.fullName || "Cliente";
    const serviceTitle =
      selectedCartItems.map((s) => s.name).join(" + ") ||
      customItemName.trim() ||
      "Atendimento";
    const amountStr = formatBRL(targetPixCents);
    const formattedAttendanceDate = formatDateBR(attendanceDate);

    const isPartial = targetPixCents < finalTotalCents;
    const modeLabel = isPartial ? "Sinal / Entrada" : "Pagamento Integral";

    const msg = [
      `*Cobrança Pix · Aura Studio*`,
      `Olá, *${clientName}*!`,
      ``,
      `Seu atendimento está registrado para *${attendanceTime} (${formattedAttendanceDate})*:`,
      `*Itens:* ${serviceTitle}`,
      `*Valor Total do Atendimento:* ${formatBRL(finalTotalCents)}`,
      `*Valor a Pagar Agora (${modeLabel}):* ${amountStr}`,
      ``,
      `*Para visualizar o QR Code ou copiar o código Pix em 1 clique:*`,
      `Acesse o link seguro abaixo:`,
      `${pixTicketUrl || "https://www.mercadopago.com.br"}`,
      ``,
      `_(Ao abrir o link, basta clicar no botão de copiar o código e colar no app do seu banco.)_`,
    ].join("\n");

    const phoneToUse =
      phoneRecipientMode === "registered"
        ? (selectedClient?.phone || "").trim()
        : customPhone.trim();

    if (!phoneToUse) {
      setWhatsAppFeedback({
        type: "error",
        message:
          phoneRecipientMode === "registered"
            ? "O cliente selecionado não possui telefone cadastrado. Selecione a opção 'Outro Número'."
            : "Por favor, digite o número de WhatsApp no campo correspondente.",
      });
      return;
    }

    const rawPhone = phoneToUse.replace(/\D/g, "");
    const phoneTarget =
      rawPhone.length >= 10 && !rawPhone.startsWith("55")
        ? `55${rawPhone}`
        : rawPhone;

    const fallbackWaUrl = phoneTarget
      ? `https://wa.me/${phoneTarget}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    setIsSendingWhatsApp(true);
    setWhatsAppFeedback(null);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientPhone: phoneToUse || phoneTarget,
          templateType: "pix_deposit",
          customMessage: msg,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setWhatsAppFeedback({
          type: "success",
          message: `Mensagem enviada com sucesso para ${clientName}!`,
        });
      } else {
        const errorDetail = data?.error || "Falha no envio da mensagem";
        setWhatsAppFeedback({
          type: "fallback",
          message: `${errorDetail}. Abrindo WhatsApp Web como contingência...`,
        });
        window.open(fallbackWaUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      console.error("Erro ao disparar WhatsApp:", err);
      setWhatsAppFeedback({
        type: "fallback",
        message: "Erro de conexão com o servidor. Abrindo WhatsApp Web como contingência...",
      });
      window.open(fallbackWaUrl, "_blank", "noopener,noreferrer");
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // Confirm Checkout and Advance to Step 4
  const handleConfirmCheckout = () => {
    if (!clientId) return;
    if (finalTotalCents <= 0) return;

    const isPixPartial =
      paymentMethod === "Pix" &&
      pixAmountMode !== "integral" &&
      targetPixCents < finalTotalCents;

    const itemsSummary =
      selectedCartItems.map((s) => s.name).join(" + ") ||
      customItemName.trim() ||
      "Venda Rápida PDV";

    onUpdateState((prev) =>
      executeQuickSaleCheckout(prev, {
        appointmentId: prefillAppointment?.id,
        clientId,
        providerId: providerId || prev.staff[0]?.id || "",
        itemsSummary,
        amountCents: paymentMethod === "Pix" ? targetPixCents : finalTotalCents,
        tipCents: 0,
        dateISO: attendanceDate,
        appointmentTime: attendanceTime,
        paymentMethod,
        status: isPixPartial ? "Sinal Pago" : "Pago",
        redeemPackageId:
          paymentMethod === "Pacote"
            ? selectedClient?.packages[0]?.packageId
            : undefined,
        redeemGiftCardId:
          paymentMethod === "Vale-Presente"
            ? activeGiftCard?.id
            : undefined,
      })
    );

    setStep(4);
  };

  // Send Final Receipt via WhatsApp (Step 4)
  const handleSendReceiptWhatsApp = async () => {
    const clientName = selectedClient?.fullName || "Cliente";
    const providerName = selectedProvider?.fullName || "Aura Studio";
    const serviceTitle =
      selectedCartItems.map((s) => s.name).join(" + ") ||
      customItemName.trim() ||
      "Atendimento";
    const amountStr = formatBRL(finalTotalCents);
    const formattedAttendanceDate = formatDateBR(attendanceDate);

    const msg = [
      `*Comprovante de Atendimento · Aura Studio*`,
      `Olá, *${clientName}*!`,
      ``,
      `Seu atendimento e pagamento foram confirmados com sucesso:`,
      `*Data e Horário:* ${attendanceTime} (${formattedAttendanceDate})`,
      `*Profissional:* ${providerName}`,
      `*Itens:* ${serviceTitle}`,
      `*Valor:* ${amountStr}`,
      `*Forma de Pagamento:* ${paymentMethod} (Confirmado)`,
      ``,
      `Seu horário está confirmado na nossa agenda. Agradecemos a sua preferência!`,
    ].join("\n");

    const phoneToUse =
      phoneRecipientMode === "registered"
        ? (selectedClient?.phone || "").trim()
        : customPhone.trim();

    if (!phoneToUse) {
      setReceiptWhatsAppFeedback({
        type: "error",
        message: "Informe um número de telefone válido para o envio do comprovante.",
      });
      return;
    }

    const rawPhone = phoneToUse.replace(/\D/g, "");
    const phoneTarget =
      rawPhone.length >= 10 && !rawPhone.startsWith("55")
        ? `55${rawPhone}`
        : rawPhone;

    const fallbackWaUrl = phoneTarget
      ? `https://wa.me/${phoneTarget}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    setIsSendingReceiptWhatsApp(true);
    setReceiptWhatsAppFeedback(null);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientPhone: phoneToUse || phoneTarget,
          templateType: "custom",
          customMessage: msg,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setReceiptWhatsAppFeedback({
          type: "success",
          message: `Comprovante enviado com sucesso para ${clientName}!`,
        });
      } else {
        const errorDetail = data?.error || "Falha no envio";
        setReceiptWhatsAppFeedback({
          type: "fallback",
          message: `${errorDetail}. Abrindo WhatsApp Web...`,
        });
        window.open(fallbackWaUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setReceiptWhatsAppFeedback({
        type: "fallback",
        message: "Erro de conexão. Abrindo WhatsApp Web como contingência...",
      });
      window.open(fallbackWaUrl, "_blank", "noopener,noreferrer");
    } finally {
      setIsSendingReceiptWhatsApp(false);
    }
  };

  // Send Final Receipt via Email (Step 4)
  const handleSendReceiptEmail = async () => {
    if (!receiptEmail.trim()) {
      setReceiptEmailFeedback("Por favor, digite um endereço de e-mail.");
      return;
    }
    setIsSendingReceiptEmail(true);
    setTimeout(() => {
      setIsSendingReceiptEmail(false);
      setReceiptEmailFeedback(`Comprovante enviado para ${receiptEmail.trim()} com sucesso!`);
    }, 800);
  };

  // Reset Wizard for New Sale
  const handleResetForNewSale = () => {
    setStep(1);
    setClientId("");
    setSelectedCartItems([]);
    setCustomItemName("");
    setCustomItemAmountBRL("");
    setCustomPixBRL("");
    setCashGivenBRL("");
    setPixPayload(null);
    setPixQrBase64(null);
    setPixTicketUrl(null);
    setIsPixPaid(false);
    setWhatsAppFeedback(null);
    setReceiptWhatsAppFeedback(null);
    setReceiptEmailFeedback(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] max-w-2xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-[#E5E5EA] relative animate-in zoom-in-95 duration-150">
        
        {/* Modal Header com Progressão por Passos */}
        <div className="px-6 py-4 border-b border-[#E5E5EA] flex items-center justify-between bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#6E56CF] bg-[#6E56CF]/10 px-2 py-0.5 rounded-full">
                Venda Rápida PDV
              </span>
              <span className="text-[12px] font-semibold text-[#8E8E93]">
                Passo {step} de 4
              </span>
            </div>
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1C1C1E] mt-0.5">
              {step === 1 && "Atendimento & Horário"}
              {step === 2 && "Adicionar à Comanda"}
              {step === 3 && "Pagamento & Resumo"}
              {step === 4 && "Comprovante & Conclusão"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#E5E5EA] hover:bg-[#F5F5F7] flex items-center justify-center text-[#6E6E73] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="px-6 py-2.5 bg-[#F5F5F7] border-b border-[#E5E5EA] flex items-center justify-between text-[12px] font-medium shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition shrink-0 ${
              step === 1
                ? "bg-[#1C1C1E] text-white font-semibold shadow-sm"
                : step > 1
                ? "text-[#1C1C1E] hover:bg-[#E5E5EA]"
                : "text-[#8E8E93]"
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${step > 1 ? "bg-[#1C1C1E] text-white" : "border border-current"}`}>
              {step > 1 ? <Check className="w-2.5 h-2.5 stroke-[2.5]" /> : "1"}
            </span>
            <span>Atendimento</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-[#C7C7CC] shrink-0" />

          <button
            type="button"
            onClick={() => {
              if (clientId) setStep(2);
            }}
            disabled={!clientId}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition shrink-0 ${
              step === 2
                ? "bg-[#1C1C1E] text-white font-semibold shadow-sm"
                : step > 2
                ? "text-[#1C1C1E] hover:bg-[#E5E5EA]"
                : "text-[#8E8E93] disabled:opacity-50"
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${step > 2 ? "bg-[#1C1C1E] text-white" : "border border-current"}`}>
              {step > 2 ? <Check className="w-2.5 h-2.5 stroke-[2.5]" /> : "2"}
            </span>
            <span>Itens ({selectedCartItems.length})</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-[#C7C7CC] shrink-0" />

          <button
            type="button"
            onClick={() => {
              if (clientId && finalTotalCents > 0) setStep(3);
            }}
            disabled={!clientId || finalTotalCents <= 0}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition shrink-0 ${
              step === 3
                ? "bg-[#1C1C1E] text-white font-semibold shadow-sm"
                : step > 3
                ? "text-[#1C1C1E] hover:bg-[#E5E5EA]"
                : "text-[#8E8E93] disabled:opacity-50"
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${step > 3 ? "bg-[#1C1C1E] text-white" : "border border-current"}`}>
              {step > 3 ? <Check className="w-2.5 h-2.5 stroke-[2.5]" /> : "3"}
            </span>
            <span>Pagamento</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-[#C7C7CC] shrink-0" />

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 ${
              step === 4
                ? "bg-[#1C1C1E] text-white font-semibold shadow-sm"
                : "text-[#8E8E93]"
            }`}
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
              4
            </span>
            <span>Comprovante</span>
          </div>
        </div>

        {/* Modal Body / Active Step Screen */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* ================================================================= */}
          {/* PASSO 1: ATENDIMENTO (Cliente, Profissional, Data e Horário) */}
          {/* ================================================================= */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Cliente Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-semibold text-[#6E6E73]">
                    Cliente *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewClientName("");
                      setNewClientPhone("");
                      setNewClientEmail("");
                      setShowAddClientModal(true);
                    }}
                    className="text-[12px] font-semibold text-[#6E56CF] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar novo cliente...</span>
                  </button>
                </div>
                <select
                  value={clientId}
                  onChange={(e) => {
                    if (e.target.value === "__NEW_CLIENT__") {
                      setNewClientName("");
                      setNewClientPhone("");
                      setNewClientEmail("");
                      setShowAddClientModal(true);
                    } else {
                      setClientId(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] bg-white font-medium text-[#1C1C1E] focus:outline-none focus:border-[#6E56CF]"
                >
                  <option value="">Selecione o cliente...</option>
                  <option value="__NEW_CLIENT__" className="text-[#6E56CF] font-semibold">
                    + Cadastrar novo cliente...
                  </option>
                  {state.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>

                {/* Card de resumo do cliente selecionado */}
                {selectedClient && (
                  <div className="mt-2.5 p-3 rounded-[12px] bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center font-bold text-[12px]">
                        {selectedClient.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1C1E]">
                          {selectedClient.fullName}
                        </p>
                        <p className="text-[#6E6E73] text-[11px]">
                          {selectedClient.phone || "Sem telefone cadastrado"} · {selectedClient.email || "Sem e-mail"}
                        </p>
                      </div>
                    </div>
                    {selectedClient.packages && selectedClient.packages.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px]">
                        {selectedClient.packages.length} pacote ativo
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Profissional Selector */}
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1.5">
                  Profissional Responsável *
                </label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] bg-white font-medium text-[#1C1C1E] focus:outline-none focus:border-[#6E56CF]"
                >
                  {state.staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Data e Horário do Atendimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12px] font-semibold text-[#6E6E73]">
                      Data do Atendimento *
                    </label>
                    <span className="text-[11px] font-mono text-[#6E56CF] font-medium">
                      {formatDateBR(attendanceDate)}
                    </span>
                  </div>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono font-medium text-[#1C1C1E] bg-white focus:outline-none focus:border-[#6E56CF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1.5">
                    Horário do Atendimento *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="time"
                      value={attendanceTime}
                      onChange={(e) => setAttendanceTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono font-medium text-[#1C1C1E] bg-white focus:outline-none focus:border-[#6E56CF]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* PASSO 2: ITENS DA COMANDA (Serviços / Produtos / Pacotes / Memberships) */}
          {/* ================================================================= */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar serviços, produtos, pacotes..."
                  value={cartSearchQuery}
                  onChange={(e) => setCartSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[13.5px] bg-[#F5F5F7] focus:bg-white focus:outline-none focus:border-[#6E56CF] transition"
                />
              </div>

              {/* 4 Tabs: Services / Products / Packages / Memberships */}
              <div className="flex items-center gap-6 sm:gap-8 border-b border-[#E5E5EA] px-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setCartActiveTab("services")}
                  className={`flex items-center gap-2 pb-2.5 text-[14px] font-medium transition shrink-0 -mb-[1px] ${
                    cartActiveTab === "services"
                      ? "text-[#1C1C1E] border-b-2 border-[#1C1C1E] font-semibold"
                      : "text-[#6E6E73] hover:text-[#1C1C1E]"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Serviços</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCartActiveTab("products")}
                  className={`flex items-center gap-2 pb-2.5 text-[14px] font-medium transition shrink-0 -mb-[1px] ${
                    cartActiveTab === "products"
                      ? "text-[#1C1C1E] border-b-2 border-[#1C1C1E] font-semibold"
                      : "text-[#6E6E73] hover:text-[#1C1C1E]"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 2h4" />
                    <path d="M12 2v3" />
                    <path d="M9 5h6" />
                    <rect x="7" y="9" width="10" height="13" rx="2" />
                    <path d="M10 5v4" />
                    <path d="M14 5v4" />
                  </svg>
                  <span>Produtos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCartActiveTab("packages")}
                  className={`flex items-center gap-2 pb-2.5 text-[14px] font-medium transition shrink-0 -mb-[1px] ${
                    cartActiveTab === "packages"
                      ? "text-[#1C1C1E] border-b-2 border-[#1C1C1E] font-semibold"
                      : "text-[#6E6E73] hover:text-[#1C1C1E]"
                  }`}
                >
                  <Box className="w-4 h-4" />
                  <span>Pacotes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCartActiveTab("memberships")}
                  className={`flex items-center gap-2 pb-2.5 text-[14px] font-medium transition shrink-0 -mb-[1px] ${
                    cartActiveTab === "memberships"
                      ? "text-[#1C1C1E] border-b-2 border-[#1C1C1E] font-semibold"
                      : "text-[#6E6E73] hover:text-[#1C1C1E]"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.4 12.9 17 22l-5-3-5 3 1.6-9.1" />
                  </svg>
                  <span>Assinaturas</span>
                </button>
              </div>

              {/* Lista de Itens da Aba Ativa */}
              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                {/* ABA 1: SERVIÇOS */}
                {cartActiveTab === "services" && (
                  <>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[11.5px] font-semibold text-[#8E8E93]">
                        Catálogo de Serviços
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewServiceName("");
                          setNewServicePrice("150");
                          setNewServiceDuration("60");
                          setShowAddServiceModal(true);
                        }}
                        className="text-[11.5px] font-semibold text-[#6E56CF] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Novo serviço...</span>
                      </button>
                    </div>

                    {state.services
                      .filter((s) =>
                        s.name.toLowerCase().includes(cartSearchQuery.toLowerCase()) ||
                        s.category.toLowerCase().includes(cartSearchQuery.toLowerCase())
                      )
                      .map((s) => {
                        const isSelected = selectedCartItems.some((it) => it.id === s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() =>
                              toggleCartItem({
                                id: s.id,
                                type: "service",
                                name: s.name,
                                priceCents: s.priceCents,
                                durationMinutes: s.durationMinutes,
                                calendarColor: s.calendarColor,
                                subtitle: `${s.durationMinutes} min · ${s.category}`,
                              })
                            }
                            className={`p-3 rounded-[14px] border transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "border-[#1C1C1E] bg-[#FAFAFC] shadow-sm"
                                : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6]"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] text-[#1C1C1E] flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13.5px] font-semibold text-[#1C1C1E] truncate">
                                  {s.name}
                                </p>
                                <p className="text-[12px] text-[#6E6E73]">
                                  {s.durationMinutes} min · {formatBRL(s.priceCents)}
                                </p>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                                isSelected
                                  ? "bg-[#1C1C1E] border-[#1C1C1E] text-white"
                                  : "border-[#C7C7CC] bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                  </>
                )}

                {/* ABA 2: PRODUTOS */}
                {cartActiveTab === "products" && (
                  <>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[11.5px] font-semibold text-[#8E8E93]">
                        Produtos de Revenda
                      </span>
                    </div>

                    {state.inventory
                      .filter((p) =>
                        p.name.toLowerCase().includes(cartSearchQuery.toLowerCase()) ||
                        p.category.toLowerCase().includes(cartSearchQuery.toLowerCase())
                      )
                      .map((p) => {
                        const isSelected = selectedCartItems.some((it) => it.id === p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() =>
                              toggleCartItem({
                                id: p.id,
                                type: "product",
                                name: p.name,
                                priceCents: p.priceCents,
                                calendarColor: "#059669",
                                subtitle: `Estoque: ${p.stockQuantity} un · ${p.category}`,
                              })
                            }
                            className={`p-3 rounded-[14px] border transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "border-[#1C1C1E] bg-[#FAFAFC] shadow-sm"
                                : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6]"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] text-[#1C1C1E] flex items-center justify-center shrink-0">
                                <svg
                                  className="w-4 h-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M10 2h4" />
                                  <path d="M12 2v3" />
                                  <path d="M9 5h6" />
                                  <rect x="7" y="9" width="10" height="13" rx="2" />
                                  <path d="M10 5v4" />
                                  <path d="M14 5v4" />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13.5px] font-semibold text-[#1C1C1E] truncate">
                                  {p.name}
                                </p>
                                <p className="text-[12px] text-[#6E6E73]">
                                  Estoque: {p.stockQuantity} un · {formatBRL(p.priceCents)}
                                </p>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                                isSelected
                                  ? "bg-[#1C1C1E] border-[#1C1C1E] text-white"
                                  : "border-[#C7C7CC] bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                  </>
                )}

                {/* ABA 3: PACOTES */}
                {cartActiveTab === "packages" && (
                  <>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[11.5px] font-semibold text-[#8E8E93]">
                        Pacotes de Sessões
                      </span>
                    </div>

                    {state.packages
                      .filter((pkg) =>
                        pkg.name.toLowerCase().includes(cartSearchQuery.toLowerCase())
                      )
                      .map((pkg) => {
                        const isSelected = selectedCartItems.some((it) => it.id === pkg.id);
                        return (
                          <div
                            key={pkg.id}
                            onClick={() =>
                              toggleCartItem({
                                id: pkg.id,
                                type: "package",
                                name: pkg.name,
                                priceCents: pkg.priceCents,
                                calendarColor: "#7C3AED",
                                subtitle: `${pkg.sessionsCount} sessões`,
                              })
                            }
                            className={`p-3 rounded-[14px] border transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "border-[#1C1C1E] bg-[#FAFAFC] shadow-sm"
                                : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6]"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] text-[#1C1C1E] flex items-center justify-center shrink-0">
                                <Box className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13.5px] font-semibold text-[#1C1C1E] truncate">
                                  {pkg.name}
                                </p>
                                <p className="text-[12px] text-[#6E6E73]">
                                  {pkg.sessionsCount} sessões · {formatBRL(pkg.priceCents)}
                                </p>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                                isSelected
                                  ? "bg-[#1C1C1E] border-[#1C1C1E] text-white"
                                  : "border-[#C7C7CC] bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                  </>
                )}

                {/* ABA 4: MEMBERSHIPS */}
                {cartActiveTab === "memberships" && (
                  <>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[11.5px] font-semibold text-[#8E8E93]">
                        Planos de Assinatura Recorrente
                      </span>
                    </div>

                    {state.memberships
                      .filter((m) =>
                        m.name.toLowerCase().includes(cartSearchQuery.toLowerCase())
                      )
                      .map((m) => {
                        const isSelected = selectedCartItems.some((it) => it.id === m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() =>
                              toggleCartItem({
                                id: m.id,
                                type: "membership",
                                name: m.name,
                                priceCents: m.monthlyPriceCents,
                                calendarColor: "#D97706",
                                subtitle: `${m.includedCreditsPerMonth} créditos mensais`,
                              })
                            }
                            className={`p-3 rounded-[14px] border transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "border-[#1C1C1E] bg-[#FAFAFC] shadow-sm"
                                : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6]"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] text-[#1C1C1E] flex items-center justify-center shrink-0">
                                <svg
                                  className="w-4 h-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="8" r="6" />
                                  <path d="M15.4 12.9 17 22l-5-3-5 3 1.6-9.1" />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13.5px] font-semibold text-[#1C1C1E] truncate">
                                  {m.name}
                                </p>
                                <p className="text-[12px] text-[#6E6E73]">
                                  {formatBRL(m.monthlyPriceCents)}/mês · {m.includedCreditsPerMonth} créditos
                                </p>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                                isSelected
                                  ? "bg-[#1C1C1E] border-[#1C1C1E] text-white"
                                  : "border-[#C7C7CC] bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                  </>
                )}
              </div>

              {/* Botão para Adicionar Item ou Valor Avulso Personalizado */}
              <div className="pt-2 border-t border-[#E5E5EA]">
                {!showCustomItemInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomItemInput(true)}
                    className="text-[12px] font-semibold text-[#6E56CF] hover:underline flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar item ou valor avulso personalizado...</span>
                  </button>
                ) : (
                  <div className="p-3 bg-[#F5F5F7] rounded-[14px] space-y-2 border border-[#E5E5EA] animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[#1C1C1E]">
                        Item Avulso / Valor Personalizado
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomItemInput(false);
                          setCustomItemName("");
                          setCustomItemAmountBRL("");
                        }}
                        className="text-[11px] text-[#6E6E73] hover:text-[#1C1C1E]"
                      >
                        Cancelar
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Descrição (ex: Taxa extra)"
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        className="px-3 py-1.5 rounded-[10px] border border-[#E5E5EA] text-[12.5px] bg-white focus:outline-none focus:border-[#6E56CF]"
                      />
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#8E8E93] font-semibold">
                          R$
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={customItemAmountBRL}
                          onChange={(e) => setCustomItemAmountBRL(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-[10px] border border-[#E5E5EA] text-[12.5px] font-mono font-bold bg-white focus:outline-none focus:border-[#6E56CF]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* PASSO 3: PAGAMENTO & RESUMO */}
          {/* ================================================================= */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Card Resumo do Atendimento */}
              <div className="p-4 rounded-[16px] bg-[#F5F5F7] border border-[#E5E5EA] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E5EA]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-[#8E8E93] tracking-wider">
                      Resumo do Atendimento
                    </p>
                    <p className="text-[14px] font-bold text-[#1C1C1E]">
                      {selectedClient?.fullName || "Cliente não informado"}
                    </p>
                    <p className="text-[12px] text-[#6E6E73]">
                      Profissional: <span className="font-semibold text-[#1C1C1E]">{selectedProvider?.fullName}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full bg-white border border-[#E5E5EA] text-[11.5px] font-mono font-semibold text-[#1C1C1E]">
                      {formatDateBR(attendanceDate)} às {attendanceTime}
                    </span>
                  </div>
                </div>

                {/* Itens Listados */}
                <div className="space-y-1.5 text-[12.5px]">
                  {selectedCartItems.map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-[#1C1C1E]">
                      <span className="font-medium truncate max-w-[280px]">
                        {it.name}
                      </span>
                      <span className="font-mono font-semibold">
                        {formatBRL(it.priceCents)}
                      </span>
                    </div>
                  ))}
                  {customItemCents > 0 && (
                    <div className="flex items-center justify-between text-[#1C1C1E]">
                      <span className="font-medium truncate max-w-[280px]">
                        {customItemName.trim() || "Item Avulso"}
                      </span>
                      <span className="font-mono font-semibold">
                        {formatBRL(customItemCents)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#E5E5EA] flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#1C1C1E]">
                    Total Geral da Comanda
                  </span>
                  <span className="text-[20px] font-mono font-bold text-[#1C1C1E]">
                    {formatBRL(finalTotalCents)}
                  </span>
                </div>
              </div>

              {/* Seletor de Método de Pagamento */}
              <div>
                <label className="block text-[12px] font-semibold text-[#6E6E73] mb-2">
                  Selecione o Método de Pagamento *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(
                    [
                      { id: "Pix", label: "Pix", icon: QrCode },
                      { id: "Dinheiro", label: "Dinheiro", icon: Banknote },
                      { id: "Cartão de Crédito", label: "Cartão", icon: CreditCard },
                      { id: "Pacote", label: "Pacote", icon: Layers },
                      { id: "Vale-Presente", label: "Vale-Pres.", icon: Gift },
                    ] as const
                  ).map((m) => {
                    const IconComp = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id as any);
                          setPixPayload(null);
                        }}
                        className={`py-2.5 px-2 rounded-[14px] border text-center transition flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? "bg-[#1C1C1E] border-[#1C1C1E] text-white shadow-sm font-bold"
                            : "bg-white border-[#E5E5EA] text-[#6E6E73] hover:border-[#D1D1D6] hover:text-[#1C1C1E] font-medium"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[11.5px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-painel: DINHEIRO COM TROCO EM TEMPO REAL */}
              {paymentMethod === "Dinheiro" && (
                <div className="p-4 bg-[#F5F5F7] rounded-[16px] border border-[#E5E5EA] space-y-3 animate-in fade-in duration-150">
                  <label className="block text-[12px] font-semibold text-[#1C1C1E]">
                    Valor em Dinheiro Entregue pelo Cliente:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-[#8E8E93]">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={formatBRL(finalTotalCents).replace("R$", "").trim()}
                      value={cashGivenBRL}
                      onChange={(e) => setCashGivenBRL(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[15px] font-mono font-bold text-[#1C1C1E] bg-white focus:outline-none focus:border-[#6E56CF]"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-[12px] border border-[#E5E5EA] flex items-center justify-between text-[13px]">
                    <span className="font-semibold text-[#6E6E73]">
                      Troco a Devolver:
                    </span>
                    <span
                      className={`font-mono font-bold text-[16px] ${
                        cashGivenCents >= finalTotalCents && changeCents > 0
                          ? "text-emerald-600"
                          : "text-[#1C1C1E]"
                      }`}
                    >
                      {formatBRL(changeCents)}
                    </span>
                  </div>
                </div>
              )}

              {/* Sub-painel: PIX COM GERADOR, POLLING E ENVIO WHATSAPP */}
              {paymentMethod === "Pix" && (
                <div className="p-4 bg-[#F5F5F7] rounded-[16px] border border-[#E5E5EA] space-y-3.5 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[#6E6E73] mb-1.5">
                      Opção de Cobrança Pix:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-[12px] border border-[#E5E5EA]">
                      <button
                        type="button"
                        onClick={() => {
                          setPixAmountMode("integral");
                          setPixPayload(null);
                        }}
                        className={`py-2 px-1 rounded-[8px] text-center transition ${
                          pixAmountMode === "integral"
                            ? "bg-[#1C1C1E] text-white font-bold shadow-sm"
                            : "text-[#6E6E73] hover:text-[#1C1C1E] font-medium"
                        }`}
                      >
                        <div className="text-[11px]">Integral (100%)</div>
                        <div className="text-[11.5px] font-mono font-bold">
                          {formatBRL(finalTotalCents)}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPixAmountMode("deposit");
                          setPixPayload(null);
                        }}
                        className={`py-2 px-1 rounded-[8px] text-center transition ${
                          pixAmountMode === "deposit"
                            ? "bg-[#1C1C1E] text-white font-bold shadow-sm"
                            : "text-[#6E6E73] hover:text-[#1C1C1E] font-medium"
                        }`}
                      >
                        <div className="text-[11px]">Sinal (30%)</div>
                        <div className="text-[11.5px] font-mono font-bold">
                          {formatBRL(depositCents)}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPixAmountMode("custom");
                          setPixPayload(null);
                        }}
                        className={`py-2 px-1 rounded-[8px] text-center transition ${
                          pixAmountMode === "custom"
                            ? "bg-[#1C1C1E] text-white font-bold shadow-sm"
                            : "text-[#6E6E73] hover:text-[#1C1C1E] font-medium"
                        }`}
                      >
                        <div className="text-[11px]">Valor Livre</div>
                        <div className="text-[11.5px] font-mono font-bold text-[#6E56CF]">
                          {parsedCustomPixCents > 0 ? formatBRL(parsedCustomPixCents) : "R$ Outro"}
                        </div>
                      </button>
                    </div>

                    {pixAmountMode === "custom" && (
                      <div className="pt-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customPixBRL}
                          onChange={(e) => {
                            setCustomPixBRL(e.target.value);
                            setPixPayload(null);
                          }}
                          placeholder="Informe o valor em R$ (Ex: 50,00)"
                          className="w-full px-3 py-2 rounded-[10px] border border-[#E5E5EA] text-[13px] font-mono font-bold bg-white focus:outline-none focus:border-[#6E56CF]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Botão de Gerar ou Área do QR Code Pix */}
                  {!pixPayload || generatedAmountCents !== targetPixCents ? (
                    <button
                      type="button"
                      disabled={isGeneratingPix || targetPixCents <= 0}
                      onClick={handleGeneratePix}
                      className="w-full py-3 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] disabled:opacity-50 text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      {isGeneratingPix ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Gerando Pix Oficial no Mercado Pago...</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4" />
                          <span>Gerar QR Code Pix ({formatBRL(targetPixCents)})</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {/* Banner de Pagamento Aprovado */}
                      {isPixPaid && (
                        <div className="p-3.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-[16px] flex items-center gap-3 animate-in zoom-in-95 duration-200">
                          <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] shrink-0 shadow-2xs">
                            <Check className="w-4 h-4 stroke-[2]" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-semibold text-[#1C1C1E]">
                                Pix aprovado
                              </p>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                            </div>
                            <p className="text-[12px] text-[#6E6E73]">
                              O pagamento foi identificado e confirmado com sucesso.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* QR Code */}
                      <div className="flex flex-col items-center justify-center p-3 bg-white rounded-[16px] border border-[#E5E5EA]">
                        {pixQrBase64 ? (
                          <img
                            src={`data:image/png;base64,${pixQrBase64}`}
                            alt="QR Code Pix"
                            className="w-40 h-40 object-contain"
                          />
                        ) : (
                          <div className="w-40 h-40 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#6E56CF]">
                            <QrCode className="w-16 h-16" />
                          </div>
                        )}
                        <span className="text-[12px] font-mono font-bold text-[#1C1C1E] mt-1">
                          {formatBRL(targetPixCents)}
                        </span>
                      </div>

                      {/* Destinatário WhatsApp (Telefone do Cliente vs Outro) */}
                      <div className="p-3 bg-white rounded-[14px] border border-[#E5E5EA] space-y-2">
                        <label className="block text-[11.5px] font-semibold text-[#6E6E73]">
                          Enviar QR Code e Link de Cobrança para WhatsApp:
                        </label>
                        <div className="flex items-center gap-4 text-[12px]">
                          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#1C1C1E]">
                            <input
                              type="radio"
                              name="pixPhoneMode"
                              checked={phoneRecipientMode === "registered"}
                              onChange={() => setPhoneRecipientMode("registered")}
                              className="text-[#6E56CF] focus:ring-[#6E56CF]"
                            />
                            <span>
                              {selectedClient?.phone ? `Tel. cadastrado (${selectedClient.phone})` : "Tel. cadastrado"}
                            </span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#1C1C1E]">
                            <input
                              type="radio"
                              name="pixPhoneMode"
                              checked={phoneRecipientMode === "custom"}
                              onChange={() => setPhoneRecipientMode("custom")}
                              className="text-[#6E56CF] focus:ring-[#6E56CF]"
                            />
                            <span>Outro Número</span>
                          </label>
                        </div>

                        {phoneRecipientMode === "custom" && (
                          <input
                            type="tel"
                            placeholder="Ex: (11) 98765-4321 ou 11987654321"
                            value={customPhone}
                            onChange={(e) => setCustomPhone(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-[10px] border border-[#E5E5EA] text-[12.5px] font-mono bg-white focus:outline-none focus:border-[#6E56CF]"
                          />
                        )}

                        <button
                          type="button"
                          onClick={handleSendWhatsAppPix}
                          disabled={isSendingWhatsApp}
                          className="w-full py-2.5 rounded-full bg-[#25D366] hover:bg-[#20BD5A] disabled:opacity-50 text-white text-[12.5px] font-bold flex items-center justify-center gap-2 shadow-sm transition"
                        >
                          {isSendingWhatsApp ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Enviando pelo WhatsApp...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                              </svg>
                              <span>Enviar Cobrança por WhatsApp</span>
                            </>
                          )}
                        </button>

                        {/* Feedback Toast */}
                        {whatsAppFeedback && (
                          <div
                            className={`p-2.5 rounded-[10px] text-[12px] flex items-center gap-2 animate-in fade-in duration-150 ${
                              whatsAppFeedback.type === "success"
                                ? "bg-[#1C1C1E] text-white"
                                : whatsAppFeedback.type === "error"
                                ? "bg-rose-50 text-rose-800 border border-rose-200"
                                : "bg-[#F5F5F7] text-[#1C1C1E] border border-[#E5E5EA]"
                            }`}
                          >
                            {whatsAppFeedback.type === "success" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            )}
                            <span className="font-medium">{whatsAppFeedback.message}</span>
                          </div>
                        )}
                      </div>

                      {pixTicketUrl && (
                        <a
                          href={pixTicketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 text-[11.5px] font-medium text-[#6E56CF] hover:underline pt-0.5"
                        >
                          <span>Abrir comprovante / instruções no Mercado Pago</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* PASSO 4: COMPROVANTE & CONCLUSÃO (WhatsApp / E-mail) */}
          {/* ================================================================= */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150 py-2">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E5EA] text-[12.5px] font-medium text-[#1C1C1E] shadow-2xs mx-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                  <span>Venda finalizada</span>
                </div>
                <h3 className="font-serif text-[24px] font-normal text-[#1C1C1E] tracking-tight">
                  Pagamento confirmado
                </h3>
                <p className="text-[13px] text-[#6E6E73] max-w-sm mx-auto">
                  O atendimento foi registrado na Agenda e o recebimento foi contabilizado no fluxo de caixa.
                </p>
              </div>

              {/* Card Resumo do Comprovante */}
              <div className="p-4 rounded-[16px] bg-[#F5F5F7] border border-[#E5E5EA] space-y-2 text-[12.5px]">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E5EA]">
                  <span className="font-semibold text-[#8E8E93]">Comanda / Venda</span>
                  <span className="font-mono font-bold text-[#1C1C1E]">
                    #{Date.now().toString().slice(-6)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6E6E73]">Cliente:</span>
                  <span className="font-semibold text-[#1C1C1E]">{selectedClient?.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6E6E73]">Profissional:</span>
                  <span className="font-semibold text-[#1C1C1E]">{selectedProvider?.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6E6E73]">Data e Horário:</span>
                  <span className="font-mono font-semibold text-[#1C1C1E]">
                    {formatDateBR(attendanceDate)} às {attendanceTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6E6E73]">Método:</span>
                  <span className="font-semibold text-[#1C1C1E]">{paymentMethod}</span>
                </div>
                <div className="pt-2 border-t border-[#E5E5EA] flex items-center justify-between">
                  <span className="font-bold text-[#1C1C1E]">Valor Total Pago:</span>
                  <span className="text-[16px] font-mono font-bold text-[#1C1C1E]">
                    {formatBRL(paymentMethod === "Pix" ? targetPixCents : finalTotalCents)}
                  </span>
                </div>
              </div>

              {/* Opções de Envio de Comprovante */}
              <div className="space-y-3 pt-1">
                <p className="text-[12px] font-bold text-[#1C1C1E] uppercase tracking-wider text-[#8E8E93]">
                  Enviar Comprovante ao Cliente
                </p>

                {/* Disparo WhatsApp */}
                <div className="p-3 bg-white rounded-[14px] border border-[#E5E5EA] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-[#1C1C1E] flex items-center gap-1.5">
                      <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                      <span>WhatsApp</span>
                    </span>
                    <span className="text-[11.5px] font-mono text-[#6E6E73]">
                      {phoneRecipientMode === "registered"
                        ? selectedClient?.phone || "Não cadastrado"
                        : customPhone.trim() || "Outro"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendReceiptWhatsApp}
                    disabled={isSendingReceiptWhatsApp}
                    className="w-full py-2.5 rounded-full bg-[#25D366] hover:bg-[#20BD5A] disabled:opacity-50 text-white text-[12.5px] font-bold flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    {isSendingReceiptWhatsApp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando Comprovante via WhatsApp...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Enviar Comprovante por WhatsApp</span>
                      </>
                    )}
                  </button>

                  {/* Feedback Toast */}
                  {receiptWhatsAppFeedback && (
                    <div
                      className={`p-2.5 rounded-[10px] text-[12px] flex items-center gap-2 animate-in fade-in duration-150 ${
                        receiptWhatsAppFeedback.type === "success"
                          ? "bg-[#1C1C1E] text-white"
                          : "bg-[#F5F5F7] text-[#1C1C1E] border border-[#E5E5EA]"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-medium">{receiptWhatsAppFeedback.message}</span>
                    </div>
                  )}
                </div>

                {/* Disparo E-mail */}
                <div className="p-3 bg-white rounded-[14px] border border-[#E5E5EA] space-y-2.5">
                  <span className="text-[12.5px] font-bold text-[#1C1C1E] flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[#6E56CF]" />
                    <span>E-mail</span>
                  </span>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="email@cliente.com"
                      value={receiptEmail}
                      onChange={(e) => setReceiptEmail(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-[10px] border border-[#E5E5EA] text-[13px] bg-[#F5F5F7] focus:bg-white focus:outline-none focus:border-[#6E56CF]"
                    />
                    <button
                      type="button"
                      onClick={handleSendReceiptEmail}
                      disabled={isSendingReceiptEmail || !receiptEmail.trim()}
                      className="px-4 py-2 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] disabled:opacity-50 text-white text-[12.5px] font-semibold transition"
                    >
                      {isSendingReceiptEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Enviar</span>
                      )}
                    </button>
                  </div>

                  {receiptEmailFeedback && (
                    <div className="p-2.5 rounded-[10px] bg-[#1C1C1E] text-white text-[12px] flex items-center gap-2 animate-in fade-in duration-150">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-medium">{receiptEmailFeedback}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar / Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E5E5EA] bg-[#FAFAFC] flex items-center justify-between shrink-0">
          {/* Botão Voltar / Cancelar */}
          {step === 1 ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[13px] font-semibold text-[#6E6E73] transition"
            >
              Cancelar
            </button>
          ) : step === 4 ? (
            <button
              type="button"
              onClick={handleResetForNewSale}
              className="px-4 py-2.5 rounded-full border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[13px] font-semibold text-[#1C1C1E] transition"
            >
              Nova Venda Rápida
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as any) : 1))}
              className="px-4 py-2.5 rounded-full border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[13px] font-semibold text-[#1C1C1E] flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          )}

          {/* Botão Avançar / Concluir */}
          <div className="flex items-center gap-3">
            {step === 1 && (
              <button
                type="button"
                disabled={!clientId}
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] disabled:opacity-50 text-white text-[13px] font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <span>Avançar: Adicionar Itens</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                disabled={finalTotalCents <= 0}
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] disabled:opacity-50 text-white text-[13px] font-semibold flex items-center gap-2 shadow-sm transition"
              >
                <span>Avançar: Pagamento ({formatBRL(finalTotalCents)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={finalTotalCents <= 0 || (paymentMethod === "Pix" && targetPixCents <= 0)}
                onClick={handleConfirmCheckout}
                className={`px-6 py-2.5 rounded-full text-white text-[13.5px] font-semibold shadow-sm transition ${
                  paymentMethod === "Pix" && isPixPaid
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-[#1C1C1E] hover:bg-[#2C2C2E] disabled:opacity-50"
                }`}
              >
                {paymentMethod === "Pix" && isPixPaid
                  ? `Concluir Venda (Pix Aprovado · ${formatBRL(targetPixCents)})`
                  : `Confirmar Recebimento (${formatBRL(paymentMethod === "Pix" ? targetPixCents : finalTotalCents)})`}
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={() => {
                  onUpdateState((prev) => ({
                    ...prev,
                    calendarView: {
                      ...prev.calendarView,
                      selectedDateISO: attendanceDate,
                    },
                  }));
                  onClose();
                }}
                className="px-6 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[13px] font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Calendar className="w-4 h-4" />
                <span>Ver na Agenda</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Embutido: Cadastrar Novo Cliente sem fechar a Venda Rápida */}
        {showAddClientModal && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-[20px] shadow-2xl border border-[#E5E5EA] p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFEFF4]">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#6E56CF]" />
                  <h3 className="text-[15px] font-bold text-[#1C1C1E]">
                    Cadastrar Novo Cliente
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="w-7 h-7 rounded-full hover:bg-[#F5F5F7] flex items-center justify-center text-[#6E6E73]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-[#6E6E73] mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Beatriz Lima"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] border border-[#E5E5EA] text-[13px] outline-none focus:border-[#6E56CF]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-semibold text-[#6E6E73] mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] border border-[#E5E5EA] text-[13px] font-mono outline-none focus:border-[#6E56CF]"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-semibold text-[#6E6E73] mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@aurastudio.com.br"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] border border-[#E5E5EA] text-[13px] outline-none focus:border-[#6E56CF]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#EFEFF4]">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="flex-1 py-2 rounded-full border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[12.5px] font-semibold text-[#6E6E73]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!newClientName.trim()}
                  onClick={() => {
                    if (!newClientName.trim()) return;
                    const newId = `cli-${Date.now()}`;
                    onUpdateState((prev) =>
                      createClientProfile(prev, {
                        id: newId,
                        fullName: newClientName.trim(),
                        phone: newClientPhone.trim() || "(11) 99999-0000",
                        email: newClientEmail.trim() || "cliente@aurastudio.com.br",
                      })
                    );
                    setClientId(newId);
                    setShowAddClientModal(false);
                  }}
                  className="flex-1 py-2 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] disabled:opacity-50 text-white text-[12.5px] font-semibold transition"
                >
                  Salvar Cliente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Embutido: Cadastrar Novo Serviço sem fechar a Venda Rápida */}
        {showAddServiceModal && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-[20px] shadow-2xl border border-[#E5E5EA] p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFEFF4]">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#6E56CF]" />
                  <h3 className="text-[15px] font-bold text-[#1C1C1E]">
                    Cadastrar Novo Serviço
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="w-7 h-7 rounded-full hover:bg-[#F5F5F7] flex items-center justify-center text-[#6E6E73]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-[#6E6E73] mb-1">
                    Nome do Serviço *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Escova Modelada"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] border border-[#E5E5EA] text-[13px] outline-none focus:border-[#6E56CF]"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[#6E6E73] mb-1">
                      Preço (R$) *
                    </label>
                    <input
                      type="text"
                      placeholder="150"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-[10px] border border-[#E5E5EA] text-[13px] font-mono outline-none focus:border-[#6E56CF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-semibold text-[#6E6E73] mb-1">
                      Duração (min) *
                    </label>
                    <input
                      type="number"
                      placeholder="60"
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(e.target.value)}
                      className="w-full px-3 py-2 rounded-[10px] border border-[#E5E5EA] text-[13px] font-mono outline-none focus:border-[#6E56CF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-semibold text-[#6E6E73] mb-1">
                    Categoria
                  </label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] border border-[#E5E5EA] text-[13px] outline-none focus:border-[#6E56CF] bg-white"
                  >
                    <option value="Cabelo">Cabelo</option>
                    <option value="Estética">Estética</option>
                    <option value="Manicure">Manicure</option>
                    <option value="Sobrancelhas">Sobrancelhas</option>
                    <option value="Massagem">Massagem</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#EFEFF4]">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="flex-1 py-2 rounded-full border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[12.5px] font-semibold text-[#6E6E73]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!newServiceName.trim()}
                  onClick={() => {
                    if (!newServiceName.trim()) return;
                    const newId = `srv-${Date.now()}`;
                    const priceNum = parseFloat(newServicePrice.replace(",", ".")) || 150;
                    const priceCents = Math.round(priceNum * 100);
                    const durationMin = parseInt(newServiceDuration, 10) || 60;

                    onUpdateState((prev) =>
                      saveCatalogService(prev, {
                        id: newId,
                        name: newServiceName.trim(),
                        priceCents,
                        durationMinutes: durationMin,
                        category: newServiceCategory,
                        description: "Serviço adicionado pelo PDV Venda Rápida.",
                      })
                    );
                    toggleCartItem({
                      id: newId,
                      type: "service",
                      name: newServiceName.trim(),
                      priceCents,
                      durationMinutes: durationMin,
                      subtitle: `${durationMin} mins · ${newServiceCategory}`,
                    });
                    setShowAddServiceModal(false);
                  }}
                  className="flex-1 py-2 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] disabled:opacity-50 text-white text-[12.5px] font-semibold transition"
                >
                  Salvar Serviço
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
