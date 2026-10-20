import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  resolveDemoWhatsAppUrl,
  getPrimaryCtaUrl,
} from "@/lib/marketing-content";

export function HeroSection() {
  const primaryCtaUrl = getPrimaryCtaUrl();
  const demoWhatsAppUrl = resolveDemoWhatsAppUrl();

  return (
    <section className="relative overflow-hidden bg-[#141416] text-white pt-14 pb-20 lg:pt-20 lg:pb-28 border-b border-zinc-800">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Minimal Editorial Headline & Conversion CTAs */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[12px] font-medium text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span>Recepção IA &amp; Sinal Pix ativos</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-normal tracking-tight leading-[1.05] text-white">
              Agendamento, pagamentos e gestão. Resolvido.
            </h1>

            <p className="max-w-md text-base text-zinc-300 font-normal leading-relaxed">
              Agenda, Recepção IA no WhatsApp, sinal Pix e repasses em um só lugar.
            </p>

            <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
              <Link
                href={primaryCtaUrl}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-black text-[14.5px] font-semibold hover:bg-zinc-100 transition-all active:scale-[0.98]"
              >
                <span>Começar teste grátis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex flex-col items-start gap-1 w-full sm:w-auto">
                <a
                  href={demoWhatsAppUrl}
                  target={demoWhatsAppUrl.startsWith("http") ? "_blank" : undefined}
                  rel={demoWhatsAppUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#D7FE03] hover:bg-[#cbf000] text-black text-[14.5px] font-semibold transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Agendar demonstração</span>
                </a>
                <span className="text-[11px] text-zinc-400 pl-3 font-mono">
                  Equipes de 2+
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Real System Screenshot Frame */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-[#1C1C1E]">
              <div className="px-4 py-2.5 border-b border-zinc-800 bg-[#18181B] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  app.luvea.app
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  Ao vivo
                </span>
              </div>
              <div className="relative aspect-[16/10] w-full bg-white">
                <Image
                  src="/images/real-app-overview.png"
                  alt="Painel real da LUVEA com agenda, recepção IA e pagamentos"
                  fill
                  priority
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 720px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
