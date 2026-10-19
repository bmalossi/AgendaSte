"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import {
  PLANS_CATALOG,
  FAQ_ITEMS,
  getPrimaryCtaUrl,
  resolveDemoWhatsAppUrl,
} from "@/lib/marketing-content";
import { PricingComparisonTable } from "@/components/marketing/pricing-comparison-table";

export function PricingCardsAndFaq() {
  const [billingCycle, setBillingCycle] = useState<"mensal" | "anual">("anual");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const primaryCtaUrl = getPrimaryCtaUrl();
  const demoWhatsAppUrl = resolveDemoWhatsAppUrl();

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="py-12 sm:py-20 bg-stone-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        {/* Header & Billing Toggle */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-[11px] font-semibold font-mono uppercase tracking-wider">
            <span>Investimento Transparente · Sem Surpresas</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-normal text-[#18181B] tracking-tight leading-tight">
            Planos que crescem com você e seu estúdio
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 font-sans leading-relaxed">
            Comece com 14 dias de teste grátis com acesso a todos os recursos.
            Sem cartão de crédito e sem taxas abusivas de intermediação.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-2 flex items-center justify-center">
            <div className="p-1.5 rounded-full bg-white border border-zinc-300 shadow-2xs inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBillingCycle("mensal")}
                className={`px-5 py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all ${
                  billingCycle === "mensal"
                    ? "bg-[#1C1C1E] text-white shadow-xs"
                    : "text-zinc-600 hover:text-black"
                }`}
              >
                Cobrança Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("anual")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all ${
                  billingCycle === "anual"
                    ? "bg-[#1C1C1E] text-white shadow-xs"
                    : "text-zinc-600 hover:text-black"
                }`}
              >
                <span>Cobrança Anual</span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-200/80 text-zinc-800 text-[10.5px] font-mono font-bold">
                  Economize ~14%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PLANS_CATALOG.map((plan) => {
            const isPopular = plan.isPopular;
            const price =
              billingCycle === "anual"
                ? plan.annualMonthlyPriceReais
                : plan.monthlyPriceReais;
            const originalMonthly = plan.monthlyPriceReais;
            const annualSavings = (originalMonthly - price) * 12;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all ${
                  isPopular
                    ? "bg-white border-2 border-[#1C1C1E] shadow-xl lg:-translate-y-2"
                    : "bg-white border border-zinc-200/90 shadow-2xs hover:shadow-md"
                }`}
              >
                {/* Popular Pill Badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#1C1C1E] text-white font-mono text-[11px] font-bold shadow-md uppercase tracking-wider">
                    <span>Mais Popular</span>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Title & Tagline */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-3xl font-normal text-[#18181B]">
                        {plan.name}
                      </h3>
                      <span className="text-[12px] font-mono font-semibold px-2.5 py-1 rounded-md bg-stone-100 text-zinc-700">
                        {plan.maxStaffLabel}
                      </span>
                    </div>
                    <p className="text-[13px] text-zinc-600 font-sans leading-snug">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price display */}
                  <div className="pt-2 border-t border-zinc-100 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-zinc-500 font-mono">
                        R$
                      </span>
                      <span className="font-mono text-4xl sm:text-5xl font-bold text-[#18181B] tracking-tight">
                        {price}
                      </span>
                      <span className="text-xs sm:text-sm text-zinc-500 font-mono">
                        /mês
                      </span>
                    </div>

                    {/* Strikethrough monthly when annual */}
                    {billingCycle === "anual" ? (
                      <p className="text-[11.5px] font-mono text-emerald-700 font-medium">
                        <span className="line-through text-zinc-400 mr-1.5">
                          R$ {originalMonthly}/mês
                        </span>
                        Economia de R$ {annualSavings}/ano
                      </p>
                    ) : (
                      <p className="text-[11.5px] font-mono text-zinc-500">
                        Cobrado mensalmente sem fidelidade
                      </p>
                    )}
                  </div>

                  {/* Key Highlights List */}
                  <div className="pt-4 border-t border-zinc-100 space-y-3 text-xs sm:text-[13px]">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                      O que está incluso:
                    </p>
                    <ul className="space-y-2.5">
                      {plan.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                          <span className="text-zinc-700 leading-snug">
                            {highlight}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card CTA Actions */}
                <div className="pt-8 space-y-2.5">
                  <Link
                    href={primaryCtaUrl}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full text-[13.5px] font-semibold transition-all shadow-sm active:scale-[0.98] ${
                      isPopular
                        ? "bg-[#1C1C1E] text-white hover:bg-black"
                        : "bg-zinc-900 text-white hover:bg-black"
                    }`}
                  >
                    <span>{plan.ctaLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {plan.id === "platinum" && (
                    <a
                      href={demoWhatsAppUrl}
                      target={demoWhatsAppUrl.startsWith("http") ? "_blank" : undefined}
                      rel={demoWhatsAppUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-zinc-300 bg-white text-zinc-800 text-[13px] font-semibold hover:bg-zinc-50 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Falar com especialista</span>
                    </a>
                  )}

                  <p className="text-center text-[11px] text-zinc-600 font-mono">
                    14 dias grátis · Sem pedir cartão
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits & Comparison Table */}
        <PricingComparisonTable />

        {/* FAQ Accordion Section */}
        <div className="pt-12 sm:pt-20 border-t border-zinc-200 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-zinc-800 text-[12px] font-semibold font-mono">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />
              <span>Dúvidas Frequentes</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#18181B] tracking-tight">
              Perguntas frequentes sobre planos e contratação
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 font-sans leading-relaxed">
              Tudo o que você precisa saber sobre o teste grátis, formas de
              pagamento, cancelamento e segurança das suas informações.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={item.question}
                  className="rounded-2xl border border-zinc-200/90 bg-white overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-sans text-sm sm:text-base font-semibold text-[#18181B] hover:bg-stone-50/50 transition-colors"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div
                      id={`faq-answer-${idx}`}
                      role="region"
                      className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-zinc-600 font-sans leading-relaxed border-t border-zinc-100"
                    >
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Need help footer */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 text-center space-y-2">
            <p className="text-sm font-semibold text-[#18181B]">
              Ainda tem alguma dúvida sobre qual plano escolher?
            </p>
            <p className="text-xs text-zinc-600">
              Fale diretamente com nossa equipe no WhatsApp. Nós ajudamos a dimensionar o plano ideal para a sua estrutura.
            </p>
            <div className="pt-2">
              <a
                href={demoWhatsAppUrl}
                target={demoWhatsAppUrl.startsWith("http") ? "_blank" : undefined}
                rel={demoWhatsAppUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-300 text-[13px] font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Conversar no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
