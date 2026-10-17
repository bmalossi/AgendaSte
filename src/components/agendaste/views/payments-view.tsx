"use client";

import React, { useState } from "react";
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
  Sparkles,
  Copy,
  Trash2,
  DollarSign,
  Package,
} from "lucide-react";
import {
  StudioState,
  InvoiceLineItem,
  CalendarEventItem,
  SaleHistoryRecord,
  formatBRL,
  createAndSendInvoice,
  executeQuickSaleCheckout,
  issueGiftCard,
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
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm inline-block ${
                          sale.status === "Pago"
                            ? "bg-[#16A34A] text-white"
                            : sale.status === "Sinal Pago"
                            ? "bg-[#E11D8F] text-white"
                            : "bg-[#D97706] text-white"
                        }`}
                      >
                        {sale.status}
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
              <span className="px-3 py-1 rounded-full bg-[#16A34A] text-white text-[11px] font-bold shadow-sm">
                Pix &amp; Cartão Ativo
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
                    <span
                      className={`px-3 py-1 rounded-full text-white text-[11px] font-bold uppercase shadow-sm ${
                        inv.status === "paid"
                          ? "bg-[#16A34A]"
                          : inv.status === "sent"
                          ? "bg-[#E11D8F]"
                          : "bg-[#D97706]"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#6E6E73]">
                    Cliente: {inv.clientName} ({inv.clientEmail}) · Vence em{" "}
                    {inv.dueDateISO}
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

export function QuickSaleDrawer({
  open,
  onClose,
  state,
  prefillAppointment,
  onUpdateState,
}: QuickSaleDrawerProps) {
  const [clientId, setClientId] = useState(
    prefillAppointment?.clientId ?? state.clients[0]?.id ?? ""
  );
  const [providerId, setProviderId] = useState(
    prefillAppointment?.providerId ?? state.staff[0]?.id ?? ""
  );
  const [selectedServiceId, setSelectedServiceId] = useState(
    prefillAppointment?.serviceIds[0] ?? state.services[0]?.id ?? ""
  );
  const [customAmountBRL, setCustomAmountBRL] = useState<string>("");
  const [tipPercent, setTipPercent] = useState<number>(10);
  const [paymentMethod, setPaymentMethod] =
    useState<SaleHistoryRecord["paymentMethod"]>("Pix");

  if (!open) return null;

  const selectedService = state.services.find(
    (s) => s.id === selectedServiceId
  );
  const baseCents = customAmountBRL
    ? Math.max(0, parseInt(customAmountBRL, 10) * 100)
    : prefillAppointment?.totalCents ?? selectedService?.priceCents ?? 15000;
  const tipCents = Math.round(baseCents * (tipPercent / 100));
  const finalTotalCents = baseCents + tipCents;

  const selectedClient = state.clients.find((c) => c.id === clientId);
  const activeGiftCard = state.giftCards.find((g) => g.status === "active");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex justify-end">
      <div className="w-full max-w-[460px] bg-white h-full shadow-gg-drawer flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div className="px-6 py-5 border-b border-[#E5E5EA] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E56CF]">
              PDV Instantâneo · 1-Toque
            </span>
            <h2 className="text-[20px] font-bold text-[#1C1C1E]">
              Venda rápida (Quick sale)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
              Cliente
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] bg-white"
            >
              {state.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
              Serviço / Produto do Catálogo
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => {
                setSelectedServiceId(e.target.value);
                setCustomAmountBRL("");
              }}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] bg-white"
            >
              {state.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({formatBRL(s.priceCents)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1">
              Ou digite um valor personalizado (R$)
            </label>
            <input
              type="number"
              placeholder="Deixe em branco para usar o valor do serviço"
              value={customAmountBRL}
              onChange={(e) => setCustomAmountBRL(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#E5E5EA] text-[14px] font-mono"
            />
          </div>

          {/* Tip Selector */}
          <div>
            <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1.5">
              Gorjeta / Caixinha do Profissional
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTipPercent(pct)}
                  className={`py-2 rounded-full text-[12px] font-bold transition ${
                    tipPercent === pct
                      ? "bg-[#1C1C1E] text-white"
                      : "bg-[#F5F5F7] text-[#1C1C1E]"
                  }`}
                >
                  {pct === 0 ? "Sem gorjeta" : `+${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[12px] font-semibold text-[#6E6E73] mb-1.5">
              Método de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  "Pix",
                  "Cartão",
                  "Pacote",
                  "Vale-Presente",
                ] as SaleHistoryRecord["paymentMethod"][]
              ).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2.5 px-3 rounded-[12px] border text-[13px] font-semibold transition ${
                    paymentMethod === method
                      ? "border-2 border-[#1C1C1E] bg-[#1C1C1E] text-white shadow-sm"
                      : "border-[#E5E5EA] bg-white text-[#1C1C1E] hover:bg-[#F5F5F7]"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Pix QR Preview when Pix is selected */}
          {paymentMethod === "Pix" && (
            <div className="p-4 rounded-[18px] bg-[#FAFAFC] border border-[#E5E5EA] flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center shrink-0">
                <QrCode className="w-10 h-10 text-[#1C1C1E]" />
              </div>
              <div className="text-[12px]">
                <p className="font-bold text-[#1C1C1E]">
                  Pix Dinâmico Pronto para Leitura
                </p>
                <p className="text-[#6E6E73]">
                  Conciliação automática na agenda e repasse de comissão.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#E5E5EA] bg-[#FAFAFC] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#6E6E73]">Total a cobrar</span>
            <span className="text-[22px] font-mono font-bold text-[#1C1C1E]">
              {formatBRL(finalTotalCents)}
            </span>
          </div>
          <button
            onClick={() => {
              onUpdateState((prev) =>
                executeQuickSaleCheckout(prev, {
                  appointmentId: prefillAppointment?.id,
                  clientId: clientId || prev.clients[0]?.id || "",
                  providerId: providerId || prev.staff[0]?.id || "",
                  itemsSummary:
                    prefillAppointment?.serviceNames.join(" + ") ??
                    selectedService?.name ??
                    "Venda Rápida PDV",
                  amountCents: baseCents,
                  tipCents,
                  paymentMethod,
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
              onClose();
            }}
            className="w-full py-3.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[14px] font-semibold transition"
          >
            Confirmar Recebimento ({paymentMethod})
          </button>
        </div>
      </div>
    </div>
  );
}
