import React from "react";
import Link from "next/link";
import { FOOTER_LINKS } from "@/lib/marketing-content";
import { LuveaWordmark } from "@/components/luvea-logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-[#27272a] bg-stone-50/70 dark:bg-[#09090b] text-zinc-600 dark:text-[#a1a1aa] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center group" aria-label="LUVEA - Início">
              <LuveaWordmark className="text-[22px] group-hover:opacity-80 transition-opacity dark:text-white" />
            </Link>
            <p className="text-[13.5px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed max-w-sm">
              Plataforma de agendamento online, Recepção IA 24/7 no WhatsApp,
              ponto de venda Pix, fichas de atendimento e gestão financeira para
              quem vive de beleza e estética.
            </p>
            <div className="pt-2 text-[12px] font-mono text-zinc-500 dark:text-[#71717a]">
              R$, Pix Dinâmico e WhatsApp 100% integrados ao mercado brasileiro.
            </div>
          </div>

          {/* Produto Links */}
          <div className="space-y-3">
            <p className="text-[11.5px] uppercase font-mono tracking-wider font-semibold text-zinc-900 dark:text-white">
              Produto
            </p>
            <ul className="space-y-2 text-[13px]">
              {FOOTER_LINKS.produto.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-black dark:hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Acesso Links */}
          <div className="space-y-3">
            <p className="text-[11.5px] uppercase font-mono tracking-wider font-semibold text-zinc-900 dark:text-white">
              Acesso
            </p>
            <ul className="space-y-2 text-[13px]">
              {FOOTER_LINKS.acesso.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-black dark:hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <p className="text-[11.5px] uppercase font-mono tracking-wider font-semibold text-zinc-900 dark:text-white">
              Termos &amp; LGPD
            </p>
            <ul className="space-y-2 text-[13px]">
              {FOOTER_LINKS.legal.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-black dark:hover:text-white transition-colors font-medium text-zinc-700 dark:text-[#a1a1aa]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright & attribution bar */}
        <div className="mt-12 pt-8 border-t border-zinc-200/80 dark:border-[#27272a] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-zinc-500 dark:text-[#71717a]">
          <p>© {new Date().getFullYear()} LUVEA. Todos os direitos reservados.</p>
          <p className="font-mono text-[11px] text-zinc-500 dark:text-[#71717a]">
            Arquitetura em produção · Sem intermediários ou taxas abusivas
          </p>
        </div>
      </div>
    </footer>
  );
}
