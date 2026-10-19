import React from "react";
import Link from "next/link";
import { FOOTER_LINKS } from "@/lib/marketing-content";

export function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-stone-50/70 text-zinc-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#1C1C1E] flex items-center justify-center text-white font-serif text-lg font-bold shadow-sm">
                A
              </div>
              <span className="font-serif text-2xl tracking-tight font-normal text-[#18181B]">
                AgendaSte
              </span>
            </Link>
            <p className="text-[13.5px] text-zinc-600 leading-relaxed max-w-sm">
              Plataforma de agendamento online, Recepção IA 24/7 no WhatsApp,
              ponto de venda Pix, fichas de atendimento e gestão financeira para
              quem vive de beleza e estética.
            </p>
            <div className="pt-2 text-[12px] font-mono text-zinc-500">
              R$, Pix Dinâmico e WhatsApp 100% integrados ao mercado brasileiro.
            </div>
          </div>

          {/* Produto Links */}
          <div className="space-y-3">
            <p className="text-[11.5px] uppercase font-mono tracking-wider font-semibold text-zinc-900">
              Produto
            </p>
            <ul className="space-y-2 text-[13px]">
              {FOOTER_LINKS.produto.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-black transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Acesso Links */}
          <div className="space-y-3">
            <p className="text-[11.5px] uppercase font-mono tracking-wider font-semibold text-zinc-900">
              Acesso
            </p>
            <ul className="space-y-2 text-[13px]">
              {FOOTER_LINKS.acesso.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-black transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <p className="text-[11.5px] uppercase font-mono tracking-wider font-semibold text-zinc-900">
              Termos &amp; LGPD
            </p>
            <ul className="space-y-2 text-[13px]">
              {FOOTER_LINKS.legal.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-black transition-colors font-medium text-zinc-700"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright & attribution bar */}
        <div className="mt-12 pt-8 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-zinc-500">
          <p>© {new Date().getFullYear()} AgendaSte. Todos os direitos reservados.</p>
          <p className="font-mono text-[11px] text-zinc-500">
            Arquitetura em produção · Sem intermediários ou taxas abusivas
          </p>
        </div>
      </div>
    </footer>
  );
}
