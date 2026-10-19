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
    <section className="relative overflow-hidden bg-[#141416] text-white pt-16 pb-20 lg:pt-24 lg:pb-32 border-b border-zinc-800">
      {/* Subtle ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-amber-900/10 via-emerald-950/15 to-transparent blur-3xl opacity-70" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Minimal Editorial Headline & GlossGenius Dual CTAs */}
          <div className="lg:col-span-6 space-y-8 text-left">
            {/* Main Punchy Editorial Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-normal tracking-tight leading-[1.06] text-white">
              Agendamento, pagamentos e gestão. Resolvido.
            </h1>

            {/* Single Concise 1-Sentence Subtitle */}
            <p className="max-w-xl text-base sm:text-lg text-zinc-300 font-normal leading-relaxed">
              AgendaSte é o sistema inteligente que trabalha para trazer mais clientes,
              tickets maiores e retornos automáticos.
            </p>

            {/* Conversion CTA Group: White Pill + Lime Pill (GlossGenius Authentic) */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href={primaryCtaUrl}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-black text-[14.5px] font-semibold hover:bg-zinc-100 transition-all active:scale-[0.98] shadow-sm"
              >
                <span>Começar teste grátis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex flex-col items-start gap-1 w-full sm:w-auto">
                <a
                  href={demoWhatsAppUrl}
                  target={demoWhatsAppUrl.startsWith("http") ? "_blank" : undefined}
                  rel={demoWhatsAppUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#D7FE03] hover:bg-[#cbf000] text-black text-[14.5px] font-semibold transition-all active:scale-[0.98] shadow-sm"
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

          {/* Right Column: High-Impact Visual Mockup (Stylist Holding Device) */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[540px] rounded-3xl overflow-hidden shadow-2xl border border-zinc-800/80 bg-zinc-950/60">
              <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full">
                <Image
                  src="/images/hero-phone-hand.png"
                  alt="AgendaSte no celular em atendimento"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 540px"
                />
              </div>

              {/* Floating Live Opportunity Card Badge */}
              <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 p-3.5 rounded-2xl bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D7FE03] animate-pulse" />
                  <div>
                    <p className="text-[12px] font-semibold text-white">
                      Recepção IA &amp; Sinal Pix Ativos
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Vagas confirmadas automaticamente 24 horas
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[#D7FE03] font-bold">
                  +26% receita
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
