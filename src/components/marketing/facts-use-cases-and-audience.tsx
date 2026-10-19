"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Sparkle,
  Store,
  Building2,
} from "lucide-react";
import {
  getPrimaryCtaUrl,
  resolveDemoWhatsAppUrl,
} from "@/lib/marketing-content";

interface TestimonialCard {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatarSrc: string;
}

const TESTIMONIALS: TestimonialCard[] = [
  {
    id: "t1",
    quote: "Faturamento de R$ 50 mil/mês atendendo apenas 3 dias por semana",
    name: "Rodrigo Costa",
    role: "Studio Hair & Visagismo",
    avatarSrc: "/images/avatar-wayne.jpg",
  },
  {
    id: "t2",
    quote: "75%+ de taxa de retorno após adotar o sinal Pix obrigatório",
    name: "Camila Moraes",
    role: "Lash & Brow Design",
    avatarSrc: "/images/avatar-emmett.jpg",
  },
  {
    id: "t3",
    quote: "Zero mensagens perdidas no WhatsApp enquanto estou em procedimento",
    name: "Débora Silveira",
    role: "Estética Avançada",
    avatarSrc: "/images/avatar-dior.jpg",
  },
  {
    id: "t4",
    quote: "Dobrei a meta do estúdio em 6 meses com o site próprio na bio",
    name: "Mariana Ramos",
    role: "Aura Beauty Lounge",
    avatarSrc: "/images/avatar-destiny.jpg",
  },
  {
    id: "t5",
    quote: "Repasse de comissões da equipe pronto em 1 clique sem planilhas",
    name: "Lucas Ferreira",
    role: "Barber Club",
    avatarSrc: "/images/avatar-legend.jpg",
  },
];

const SEGMENTS = [
  {
    icon: Scissors,
    title: "Cabeleireiros & Barbeiros",
    desc: "Agendamento rápido, tempo de pausa química e controle de comissões por serviço.",
  },
  {
    icon: Sparkle,
    title: "Estética, Cílios & Sobrancelhas",
    desc: "Prontuário com fotos antes/depois, anamnese LGPD e sinal Pix anti-no-show.",
  },
  {
    icon: Store,
    title: "Estúdios & Esmalterias",
    desc: "Venda rápida no balcão, controle de produtos, pacotes e vale-presentes.",
  },
  {
    icon: Building2,
    title: "Clínicas com Equipe",
    desc: "Trava inteligente de salas e aparelhos, ponto digital e fechamento de repasse.",
  },
];

export function FactsUseCasesAndAudience() {
  const primaryCtaUrl = getPrimaryCtaUrl();
  const demoWhatsAppUrl = resolveDemoWhatsAppUrl();

  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonialContainerRef = useRef<HTMLDivElement>(null);

  const scrollTestimonials = (direction: "prev" | "next") => {
    if (!testimonialContainerRef.current) return;
    const container = testimonialContainerRef.current;
    const cardWidth = 320;
    const nextScroll =
      direction === "prev"
        ? container.scrollLeft - cardWidth
        : container.scrollLeft + cardWidth;

    container.scrollTo({ left: nextScroll, behavior: "smooth" });
    const newIdx =
      direction === "prev"
        ? Math.max(0, currentIndex - 1)
        : Math.min(TESTIMONIALS.length - 1, currentIndex + 1);
    setCurrentIndex(newIdx);
  };

  return (
    <div className="space-y-0">
      {/* 1. SEÇÃO DE RESULTADOS COMPROVADOS (GLOSSGENIUS BLOCK 03) */}
      <section
        id="fatos"
        aria-label="Resultados comprovados do produto"
        className="py-20 sm:py-32 bg-[#F3F7F5] border-b border-zinc-200/80"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-16">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-normal text-[#18181B] tracking-tight">
              Comprovado para aumentar seu faturamento
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 font-normal">
              Resultados reais medidos na rotina de estúdios e clínicas de estética.
            </p>
          </div>

          {/* Huge Typography Numbers (GlossGenius Authentic) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-8 items-start">
            <div className="space-y-2">
              <p className="text-6xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-[#18181B]">
                26%<span className="text-4xl sm:text-5xl align-top font-light">+</span>
              </p>
              <p className="text-sm sm:text-base text-zinc-600 font-normal">
                mais receita no primeiro ano
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-6xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-[#18181B]">
                75%<span className="text-4xl sm:text-5xl align-top font-light">+</span>
              </p>
              <p className="text-sm sm:text-base text-zinc-600 font-normal">
                taxa média de retorno de clientes
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-6xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-[#18181B]">
                40h<span className="text-4xl sm:text-5xl align-top font-light">+</span>
              </p>
              <p className="text-sm sm:text-base text-zinc-600 font-normal">
                economizadas por mês em gestão
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DEPOIMENTOS DE EMPREENDEDORES (GLOSSGENIUS BLOCK 04) */}
      <section
        id="casos-de-uso"
        aria-label="Casos reais de empreendedores"
        className="py-20 sm:py-28 bg-white border-b border-zinc-200/80 overflow-hidden w-full"
      >
        {/* Header: Edge-to-edge */}
        <div className="w-full px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl sm:text-5xl font-normal text-[#18181B] tracking-tight leading-tight max-w-2xl">
              Esteja à frente como outros empreendedores
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollTestimonials("prev")}
                disabled={currentIndex === 0}
                aria-label="Depoimento anterior"
                className="p-3 rounded-full border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTestimonials("next")}
                disabled={currentIndex === TESTIMONIALS.length - 1}
                aria-label="Próximo depoimento"
                className="p-3 rounded-full border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dark Cards Carousel: Edge-to-edge bleed with NO right indentation */}
        <div
          ref={testimonialContainerRef}
          className="w-full flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 pt-2 pl-4 sm:pl-6 lg:pl-8 pr-0 scrollbar-none"
        >
            {TESTIMONIALS.map((item) => (
              <div
                key={item.id}
                className="snap-start shrink-0 w-[280px] sm:w-[320px] h-[360px] rounded-3xl p-7 bg-[#181816] text-white border border-zinc-800 flex flex-col justify-between shadow-lg"
              >
                {/* Punchy statement without walls of text */}
                <h3 className="text-xl sm:text-2xl font-normal leading-snug tracking-tight text-white">
                  &ldquo;{item.quote}&rdquo;
                </h3>

                {/* Bottom Row: Name + Thumbnail Photo */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                  <div className="space-y-0.5">
                    <p className="text-[13px] font-semibold text-zinc-200">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      {item.role}
                    </p>
                  </div>

                  <div className="relative w-12 h-14 rounded-xl overflow-hidden border border-zinc-700/80 bg-zinc-800 shrink-0">
                    <Image
                      src={item.avatarSrc}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 30-Day Difference Banner (GlossGenius Authentic CTA) */}
          <div className="mt-16 text-center space-y-4 max-w-xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-normal text-[#18181B] tracking-tight">
              Veja a diferença que 30 dias fazem
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed font-normal">
              Descubra como acelerar agendamentos, aumentar a retenção e faturar mais.
              Você começará a ver resultados no primeiro mês.
            </p>
            <div className="pt-2">
              <a
                href={demoWhatsAppUrl}
                target={demoWhatsAppUrl.startsWith("http") ? "_blank" : undefined}
                rel={demoWhatsAppUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full border border-zinc-300 hover:border-black bg-white text-[#18181B] text-sm font-semibold transition-all shadow-2xs active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-[#8BA400]" />
                <span>Agendar demonstração</span>
              </a>
            </div>
          </div>
      </section>

      {/* 3. SEÇÃO PARA QUEM É (DESTINO DO MEGA MENU NEGÓCIOS - COMPACTO E ELEGANTE) */}
      <section
        id="para-quem-e"
        aria-label="Para quem é a AgendaSte"
        className="py-16 sm:py-24 bg-[#FAF9F6] border-b border-zinc-200/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-[12px] font-sans font-medium text-zinc-500 uppercase tracking-wider">
              Segmentos &amp; Portes
            </span>
            <h2 className="text-3xl sm:text-4xl font-normal text-[#18181B] tracking-tight">
              Feito sob medida para o seu formato de trabalho
            </h2>
          </div>

          {/* Visual 4-Card Grid: Minimal, Icon-Driven, No Wordiness */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SEGMENTS.map((seg) => {
              const Icon = seg.icon;
              return (
                <div
                  key={seg.title}
                  className="p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-2xs space-y-3 hover:border-zinc-300 transition-all"
                >
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#18181B]">
                    {seg.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed font-normal">
                    {seg.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. CHAMADA FINAL DE CONVERSÃO */}
      <section
        id="chamada-final"
        aria-label="Comece a usar a AgendaSte"
        className="py-20 sm:py-28 bg-[#141416] text-white text-center"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
            Pronto para transformar seu negócio?
          </h2>

          <p className="max-w-lg mx-auto text-base text-zinc-300 font-normal leading-relaxed">
            Elimine faltas com o sinal Pix, deixe a Recepção IA agendar dia e noite
            e tenha relatórios de comissão prontos em 1 clique.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link
              href={primaryCtaUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-[14.5px] font-semibold hover:bg-zinc-100 transition-all shadow-md active:scale-[0.98]"
            >
              <span>Começar teste grátis (14 dias)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={demoWhatsAppUrl}
              target={demoWhatsAppUrl.startsWith("http") ? "_blank" : undefined}
              rel={demoWhatsAppUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#D7FE03] hover:bg-[#cbf000] text-black text-[14px] font-semibold transition-all shadow-2xs active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>Agendar demonstração</span>
            </a>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-zinc-400">
            <span>14 dias grátis</span>
            <span>•</span>
            <span>Sem cartão de crédito</span>
            <span>•</span>
            <span>Ativação em menos de 1 minuto</span>
          </div>
        </div>
      </section>
    </div>
  );
}
