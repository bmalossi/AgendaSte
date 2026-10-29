"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  Minus,
  ChevronDown,
  ShieldCheck,
  Percent,
  MessageSquare,
  Camera,
  Calendar,
  ArrowRight,
} from "lucide-react";
import {
  FEATURE_COMPARISON_GROUPS,
  EXCLUSIVE_BENEFITS,
  getPrimaryCtaUrl,
  type FeatureValue,
} from "@/lib/marketing-content";

export function PricingComparisonTable() {
  const primaryCtaUrl = getPrimaryCtaUrl();

  // Control expanded/collapsed state for each feature group (all open by default)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    {}
  );

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const renderCell = (val: FeatureValue, isGold = false) => {
    if (typeof val === "boolean") {
      if (val) {
        return (
          <div className="flex justify-center">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isGold
                  ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b]"
                  : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
        );
      }
      return (
        <div className="flex justify-center text-zinc-300 dark:text-zinc-600">
          <Minus className="w-4 h-4 stroke-[2]" />
        </div>
      );
    }

    // Text limit
    return (
      <span
        className={`inline-block px-2.5 py-1 rounded-md text-[11.5px] font-mono font-semibold ${
          isGold
            ? "bg-zinc-100 dark:bg-[#18181b] text-zinc-900 dark:text-white border border-zinc-300 dark:border-[#27272a]"
            : "bg-stone-100 dark:bg-[#27272a] text-zinc-700 dark:text-zinc-200"
        }`}
      >
        {val}
      </span>
    );
  };

  const getBenefitIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return <Percent className="w-5 h-5 text-zinc-800" />;
      case 1:
        return <MessageSquare className="w-5 h-5 text-zinc-800" />;
      case 2:
        return <Camera className="w-5 h-5 text-zinc-800" />;
      case 3:
        return <Calendar className="w-5 h-5 text-zinc-800" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-zinc-800" />;
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 py-8">
      {/* 1. BENEFÍCIOS EXCLUSIVOS DO PRODUTO */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-zinc-200 text-[11px] font-semibold font-mono uppercase tracking-wider">
            <span>Vantagens Competitivas</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#18181B] dark:text-white tracking-tight">
            Benefícios que você não encontra em outro lugar
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
            Feito para quem vive do negócio no Brasil, com foco em segurança
            financeira e zero burocracia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {EXCLUSIVE_BENEFITS.map((b, idx) => (
            <div
              key={b.title}
              className="p-6 rounded-3xl bg-white dark:bg-[#18181b] border border-zinc-200/90 dark:border-[#27272a] shadow-2xs space-y-3 flex flex-col justify-between transition-colors"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-[#09090b] border border-zinc-200/80 dark:border-[#27272a] flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                  {getBenefitIcon(idx)}
                </div>
                <h3 className="font-serif text-lg font-normal text-[#18181B] dark:text-white leading-tight">
                  {b.title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-[#a1a1aa] font-sans leading-relaxed">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. TABELA COMPARAR PLANOS */}
      <section id="comparar-planos" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-zinc-300 text-[11px] font-semibold font-mono uppercase tracking-wider">
            <span>Matriz Completa</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#18181B] dark:text-white tracking-tight">
            Compare os recursos de cada plano
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-[#a1a1aa] font-sans leading-relaxed">
            Veja em detalhes o que cada plano libera para a sua operação.
          </p>
        </div>

        {/* Scrollable Container with Sticky Table Headers */}
        <div className="border border-zinc-200/90 dark:border-[#27272a] rounded-3xl bg-white dark:bg-[#18181b] shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-20 bg-white dark:bg-[#18181b] border-b border-zinc-200 dark:border-[#27272a] shadow-2xs">
                <tr>
                  <th className="p-5 sm:p-6 w-[40%] bg-stone-50/80 dark:bg-[#09090b] text-[12px] uppercase font-mono tracking-wider text-zinc-500 dark:text-[#a1a1aa] font-semibold align-bottom">
                    Módulos &amp; Recursos
                  </th>
                  {/* Essencial Header */}
                  <th className="p-5 sm:p-6 w-[20%] text-center align-bottom border-l border-zinc-100 dark:border-[#27272a]">
                    <p className="font-serif text-xl font-normal text-[#18181B] dark:text-white">
                      Essencial
                    </p>
                    <p className="font-mono text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
                      R$ 69/mês
                    </p>
                    <div className="mt-3">
                      <Link
                        href={primaryCtaUrl}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-zinc-300 dark:border-[#27272a] text-xs font-semibold text-zinc-800 dark:text-white hover:bg-zinc-50 dark:hover:bg-[#27272a] transition-colors w-full"
                      >
                        Começar
                      </Link>
                    </div>
                  </th>
                  {/* Gold Header (Highlighted) */}
                  <th className="p-5 sm:p-6 w-[20%] text-center align-bottom bg-zinc-50 dark:bg-[#09090b] border-x border-zinc-200 dark:border-[#27272a] relative">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[10px] font-mono font-bold uppercase tracking-wider">
                      Mais Popular
                    </div>
                    <p className="font-serif text-xl font-normal text-[#18181B] dark:text-white mt-2">
                      Gold
                    </p>
                    <p className="font-mono text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
                      R$ 149/mês
                    </p>
                    <div className="mt-3">
                      <Link
                        href={primaryCtaUrl}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-xs font-semibold hover:bg-black dark:hover:bg-zinc-200 transition-colors w-full shadow-2xs"
                      >
                        Começar
                      </Link>
                    </div>
                  </th>
                  {/* Platinum Header */}
                  <th className="p-5 sm:p-6 w-[20%] text-center align-bottom border-l border-zinc-100 dark:border-[#27272a]">
                    <p className="font-serif text-xl font-normal text-[#18181B] dark:text-white">
                      Platinum
                    </p>
                    <p className="font-mono text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
                      R$ 399/mês
                    </p>
                    <div className="mt-3">
                      <Link
                        href={primaryCtaUrl}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-zinc-300 dark:border-[#27272a] text-xs font-semibold text-zinc-800 dark:text-white hover:bg-zinc-50 dark:hover:bg-[#27272a] transition-colors w-full"
                      >
                        Começar
                      </Link>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body by Groups */}
              <tbody className="divide-y divide-zinc-100 dark:divide-[#27272a] text-xs sm:text-[13px] font-sans">
                {FEATURE_COMPARISON_GROUPS.map((group) => {
                  const isCollapsed = collapsedGroups[group.id] || false;
                  return (
                    <React.Fragment key={group.id}>
                      {/* Group Header Row (Collapsible) */}
                      <tr className="bg-stone-50/70 dark:bg-[#09090b] border-t border-b border-zinc-200 dark:border-[#27272a]">
                        <td colSpan={4} className="p-0">
                          <button
                            type="button"
                            aria-expanded={!isCollapsed}
                            aria-controls={`group-${group.id}`}
                            onClick={() => toggleGroup(group.id)}
                            className="w-full px-5 sm:px-6 py-3.5 text-left flex items-center justify-between font-serif text-base sm:text-lg font-normal text-[#18181B] dark:text-white hover:bg-stone-100 dark:hover:bg-[#27272a]/50 transition-colors"
                          >
                            <span className="font-semibold">{group.name}</span>
                            <ChevronDown
                              className={`w-4 h-4 text-zinc-500 dark:text-[#a1a1aa] transition-transform duration-200 ${
                                isCollapsed ? "-rotate-90" : ""
                              }`}
                            />
                          </button>
                        </td>
                      </tr>

                      {/* Group Feature Rows */}
                      {!isCollapsed &&
                        group.features.map((feat) => (
                          <tr
                            key={feat.name}
                            className="hover:bg-zinc-50/70 dark:hover:bg-[#27272a]/40 transition-colors"
                          >
                            <td className="p-4 sm:p-5 pr-6">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {feat.name}
                              </p>
                              {feat.description && (
                                <p className="text-[11.5px] text-zinc-500 dark:text-[#a1a1aa] mt-0.5">
                                  {feat.description}
                                </p>
                              )}
                            </td>
                            {/* Essencial */}
                            <td className="p-4 sm:p-5 text-center border-l border-zinc-100 dark:border-[#27272a]">
                              {renderCell(feat.values.essencial, false)}
                            </td>
                            {/* Gold (Highlighted Column) */}
                            <td className="p-4 sm:p-5 text-center bg-zinc-50/70 dark:bg-[#09090b]/50 border-x border-zinc-200 dark:border-[#27272a]">
                              {renderCell(feat.values.gold, true)}
                            </td>
                            {/* Platinum */}
                            <td className="p-4 sm:p-5 text-center border-l border-zinc-100 dark:border-[#27272a]">
                              {renderCell(feat.values.platinum, false)}
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-center space-y-4 transition-colors">
          <h3 className="font-serif text-2xl sm:text-3xl text-[#18181B] dark:text-white font-normal">
            Ainda na dúvida? Comece pelo Gold por 14 dias sem pagar nada.
          </h3>
          <p className="text-zinc-600 dark:text-[#a1a1aa] text-xs sm:text-sm max-w-md mx-auto font-sans leading-relaxed">
            Se durante o teste você preferir o plano Essencial ou precisar migrar
            para o Platinum, você altera com 1 clique no painel.
          </p>
          <div className="pt-2">
            <Link
              href={primaryCtaUrl}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[13.5px] font-semibold hover:bg-black dark:hover:bg-zinc-200 transition-all shadow-sm"
            >
              <span>Começar teste grátis (14 dias)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
