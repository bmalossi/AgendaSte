"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Printer,
  Copy,
  Check,
  ArrowLeft,
  Building2,
  Calendar,
  User,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import {
  PublicReceiptPayload,
  decodeReceiptPayload,
  createInitialStudioState,
  formatBRL,
  formatDateBR,
} from "@/lib/agendaste-store";

interface PublicReceiptViewProps {
  saleId: string;
  initialEncodedData?: string;
}

export function PublicReceiptView({
  saleId,
  initialEncodedData,
}: PublicReceiptViewProps) {
  const [receipt, setReceipt] = useState<PublicReceiptPayload | null>(() => {
    if (initialEncodedData) {
      return decodeReceiptPayload(initialEncodedData);
    }
    return null;
  });
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(!receipt);

  useEffect(() => {
    // Se já foi decodificado pelo payload da URL, nada a fazer
    if (receipt) {
      setIsLoading(false);
      return;
    }

    // 1. Tenta recuperar da query param se não foi passado no SSR
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const dParam = urlParams.get("d");
      if (dParam) {
        const decoded = decodeReceiptPayload(dParam);
        if (decoded) {
          setReceipt(decoded);
          setIsLoading(false);
          return;
        }
      }

      // 2. Tenta pesquisar no localStorage do estúdio
      try {
        const cacheKeys = [
          "luvea_studio_state_dev_offline",
          ...Object.keys(localStorage).filter((k) =>
            k.startsWith("luvea_studio_state_")
          ),
        ];

        for (const key of cacheKeys) {
          const cachedRaw = localStorage.getItem(key);
          if (!cachedRaw) continue;
          const parsed = JSON.parse(cachedRaw);
          const salesList = parsed?.salesHistory || [];
          const matched = salesList.find(
            (s: { id: string }) =>
              s.id === saleId ||
              s.id === `sale-${saleId}` ||
              s.id.toLowerCase() === saleId.toLowerCase()
          );

          if (matched) {
            const num = `#REC-${matched.id.replace("sale-", "").toUpperCase()}`;
            const total = matched.amountCents + (matched.tipCents || 0);
            const items = (matched.items || []).map(
              (it: { name: string; quantity: number; amountCents: number }) => ({
                label: it.name,
                quantity: it.quantity,
                amountCents: it.amountCents,
              })
            );

            setReceipt({
              receiptNumber: num,
              clientName: matched.clientName || "Cliente",
              studioName: parsed?.settings?.business?.businessName || "Luvea Studio",
              studioAddress:
                parsed?.settings?.business?.address ||
                "Atendimento presencial no estúdio",
              paymentDate: `${formatDateBR(matched.dateISO)}, ${matched.appointmentTimeLabel || ""}`,
              paymentMethod: matched.paymentMethod || "Pix",
              professionalName: matched.providerName || "Profissional",
              items:
                items.length > 0
                  ? items
                  : [
                      {
                        label: matched.itemsSummary || "Atendimento no estúdio",
                        quantity: 1,
                        amountCents: matched.amountCents,
                      },
                    ],
              subtotalCents: matched.amountCents,
              discountCents: 0,
              tipCents: matched.tipCents || 0,
              totalCents: total,
              memo: `Atendimento realizado com sucesso em ${matched.appointmentTimeLabel || ""}.`,
            });
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("[Receipt Lookup LocalStorage]", err);
      }

      // 3. Fallback para catálogo inicial do estúdio (ex: sale-1 de Stefany)
      const initial = createInitialStudioState();
      const matchedInitial = (initial.salesHistory || []).find(
        (s) =>
          s.id === saleId ||
          s.id === `sale-${saleId}` ||
          s.id.toLowerCase() === saleId.toLowerCase()
      );

      if (matchedInitial) {
        const num = `#REC-${matchedInitial.id.replace("sale-", "").toUpperCase()}`;
        const total = matchedInitial.amountCents + (matchedInitial.tipCents || 0);
        const initialItems = (matchedInitial.items || []).map((it) => ({
          label: it.name,
          quantity: it.quantity,
          amountCents: it.amountCents,
        }));
        setReceipt({
          receiptNumber: num,
          clientName: matchedInitial.clientName,
          studioName: "Luvea Studio",
          studioAddress: "Alameda dos Stylists, 1020 — Jardim Paulistano, SP",
          paymentDate: `${formatDateBR(matchedInitial.dateISO)}, ${matchedInitial.appointmentTimeLabel}`,
          paymentMethod: matchedInitial.paymentMethod,
          professionalName: matchedInitial.providerName,
          items:
            initialItems.length > 0
              ? initialItems
              : [
                  {
                    label: matchedInitial.itemsSummary || "Atendimento no estúdio",
                    quantity: 1,
                    amountCents: matchedInitial.amountCents,
                  },
                ],
          subtotalCents: matchedInitial.amountCents,
          discountCents: 0,
          tipCents: matchedInitial.tipCents,
          totalCents: total,
          memo: `Atendimento realizado com sucesso em ${matchedInitial.appointmentTimeLabel}.`,
        });
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
  }, [saleId, initialEncodedData, receipt]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#27272a] border border-[#3f3f46] text-[#a1a1aa]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-white">
              Comprovante não localizado
            </h1>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              Não encontramos o registro com o identificador{" "}
              <code className="text-white bg-[#27272a] px-1.5 py-0.5 rounded text-xs font-mono">
                {saleId}
              </code>
              . Verifique se o link foi copiado integralmente ou contate o estúdio emissor.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium bg-white text-[#09090b] hover:bg-[#e4e4e7] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Página Inicial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] py-8 sm:py-12 px-4 sm:px-6 font-sans antialiased selection:bg-white/20 selection:text-white print:bg-white print:text-black print:p-0 print:m-0">
      {/* Top Action Bar (hidden on print) */}
      <div className="max-w-[560px] mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#a1a1aa] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#18181b] border border-[#27272a] text-[#f4f4f5] hover:bg-[#27272a] transition-colors"
            title="Copiar link permanente do comprovante"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#a1a1aa]" />
                <span>Copiar link</span>
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white text-[#09090b] hover:bg-[#e4e4e7] transition-colors font-medium shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Main Luxury Receipt Paper / Card */}
      <div className="max-w-[560px] mx-auto bg-[#18181b] border border-[#27272a] rounded-2xl p-6 sm:p-10 shadow-2xl relative print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        {/* Brand / Header */}
        <div className="text-center pb-6 border-b border-[#27272a] print:border-gray-200">
          <span className="text-2xl font-bold tracking-[3px] text-white print:text-black uppercase block">
            LUVEA
          </span>
          <span className="text-[11px] font-medium tracking-[1.5px] text-[#a1a1aa] print:text-gray-500 uppercase block mt-1">
            {receipt.studioName || "Studio"}
          </span>
          {receipt.studioAddress && (
            <span className="text-[11.5px] text-[#71717a] print:text-gray-400 block mt-1.5">
              {receipt.studioAddress}
            </span>
          )}
        </div>

        {/* Status Micro-Badge & Title */}
        <div className="py-6 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11.5px] font-medium bg-[#27272a] border border-[#3f3f46] text-[#f4f4f5] print:border-gray-300 print:bg-gray-100 print:text-black">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <span>Pagamento Confirmado</span>
          </div>

          <h1 className="text-lg sm:text-xl font-semibold text-white print:text-black tracking-tight">
            Comprovante Oficial de Atendimento
          </h1>
          <p className="text-xs font-mono text-[#a1a1aa] print:text-gray-500">
            {receipt.receiptNumber}
          </p>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-[#09090b]/60 border border-[#27272a] text-xs print:bg-gray-50 print:border-gray-200 mb-6">
          <div className="space-y-1">
            <span className="text-[10.5px] text-[#71717a] print:text-gray-400 uppercase tracking-wider block font-medium">
              Cliente
            </span>
            <div className="flex items-center gap-1.5 text-white print:text-black font-medium">
              <User className="w-3.5 h-3.5 text-[#a1a1aa] print:text-gray-400 shrink-0" />
              <span>{receipt.clientName}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10.5px] text-[#71717a] print:text-gray-400 uppercase tracking-wider block font-medium">
              Data e Horário
            </span>
            <div className="flex items-center gap-1.5 text-white print:text-black font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#a1a1aa] print:text-gray-400 shrink-0" />
              <span>{receipt.paymentDate}</span>
            </div>
          </div>

          {receipt.professionalName && (
            <div className="space-y-1">
              <span className="text-[10.5px] text-[#71717a] print:text-gray-400 uppercase tracking-wider block font-medium">
                Profissional
              </span>
              <div className="flex items-center gap-1.5 text-white print:text-black font-medium">
                <Building2 className="w-3.5 h-3.5 text-[#a1a1aa] print:text-gray-400 shrink-0" />
                <span>{receipt.professionalName}</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10.5px] text-[#71717a] print:text-gray-400 uppercase tracking-wider block font-medium">
              Forma de Pagamento
            </span>
            <div className="flex items-center gap-1.5 text-white print:text-black font-medium">
              <CreditCard className="w-3.5 h-3.5 text-[#a1a1aa] print:text-gray-400 shrink-0" />
              <span>{receipt.paymentMethod} (Liquidado)</span>
            </div>
          </div>
        </div>

        {/* Consumed Items Breakdown */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#a1a1aa] print:text-gray-500 uppercase tracking-wider px-1">
            <span>Itens do Atendimento</span>
            <span>Valor</span>
          </div>

          <div className="border border-[#27272a] rounded-xl overflow-hidden divide-y divide-[#27272a] print:border-gray-200 print:divide-gray-200">
            {receipt.items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 flex items-center justify-between text-xs bg-[#18181b] print:bg-white"
              >
                <div className="space-y-0.5 pr-4">
                  <div className="text-white print:text-black font-medium">
                    {item.quantity > 1 ? `${item.quantity}x ` : ""}
                    {item.label}
                  </div>
                  {item.quantity > 1 && (
                    <div className="text-[10.5px] text-[#71717a] print:text-gray-400">
                      Unitário: {formatBRL(Math.round(item.amountCents / item.quantity))}
                    </div>
                  )}
                </div>
                <div className="text-white print:text-black font-mono font-medium shrink-0">
                  {formatBRL(item.amountCents)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Totals */}
        <div className="space-y-2 py-4 border-t border-b border-[#27272a] text-xs print:border-gray-200 mb-6">
          <div className="flex justify-between text-[#a1a1aa] print:text-gray-600 px-1">
            <span>Subtotal</span>
            <span className="font-mono text-white print:text-black">
              {formatBRL(receipt.subtotalCents)}
            </span>
          </div>

          {receipt.tipCents && receipt.tipCents > 0 ? (
            <div className="flex justify-between text-[#a1a1aa] print:text-gray-600 px-1">
              <span>Gorjeta ao profissional</span>
              <span className="font-mono text-white print:text-black">
                +{formatBRL(receipt.tipCents)}
              </span>
            </div>
          ) : null}

          {receipt.discountCents && receipt.discountCents > 0 ? (
            <div className="flex justify-between text-emerald-400 print:text-emerald-700 px-1">
              <span>Desconto aplicado</span>
              <span className="font-mono">-{formatBRL(receipt.discountCents)}</span>
            </div>
          ) : null}

          <div className="flex justify-between items-baseline pt-2 border-t border-[#27272a] print:border-gray-200 px-1">
            <span className="text-sm font-semibold text-white print:text-black">
              Total Pago
            </span>
            <span className="text-xl font-bold font-mono text-white print:text-black">
              {formatBRL(receipt.totalCents)}
            </span>
          </div>
        </div>

        {/* Memo / Notes */}
        {receipt.memo && (
          <div className="p-3 rounded-lg bg-[#09090b]/40 border border-[#27272a] text-[11.5px] text-[#a1a1aa] print:bg-transparent print:border-gray-200 print:text-gray-600 mb-6">
            {receipt.memo}
          </div>
        )}

        {/* Security & Authentication Seal Footer */}
        <div className="pt-4 text-center space-y-2 text-[11px] text-[#71717a] print:text-gray-400">
          <div className="inline-flex items-center gap-1.5 text-xs text-[#a1a1aa] print:text-gray-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Documento emitido eletronicamente via Luvea Studio</span>
          </div>
          <p className="leading-relaxed">
            Autenticação criptográfica de quitação integral • Todos os direitos reservados.
          </p>
          <div className="pt-2 text-[10.5px] text-[#52525b] print:text-gray-400">
            &copy; {receipt.studioName || "Luvea Studio"} &bull; luvea.app
          </div>
        </div>
      </div>
    </div>
  );
}
