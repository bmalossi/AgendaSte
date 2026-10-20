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
    desc: "Pausa química, encaixes e comissões.",
  },
  {
    icon: Sparkle,
    title: "Estética & Harmonização",
    desc: "Prontuário SOAP, fotos e sinal Pix.",
  },
  {
    icon: Store,
    title: "Estúdios & Esmalterias",
    desc: "PDV rápido, pacotes e assinaturas.",
  },
  {
    icon: Building2,
    title: "Clínicas com Equipe",
    desc: "Trava de salas, ponto e repasses.",
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
      {/* 1. SEÇÃO DE RESULTADOS COMPROVADOS */}
      <section
        id="fatos"
        aria-label="Resultados comprovados do produto"
        className="py-16 sm:py-24 bg-[#F5F5F7] border-b border-[#E5E5EA]"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <h2 className="text-3xl sm:text-5xl font-normal text-[#1C1C1E] tracking-tight max-w-2xl mx-auto">
            Comprovado para aumentar seu faturamento
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-8 items-start">
            <div className="space-y-1.5">
              <p className="text-6xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-[#1C1C1E]">
                26%<span className="text-4xl sm:text-5xl align-top font-light">+</span>
              </p>
              <p className="text-sm sm:text-base text-[#6E6E73] font-normal">
                mais receita no primeiro ano
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-6xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-[#1C1C1E]">
                75%<span className="text-4xl sm:text-5xl align-top font-light">+</span>
              </p>
              <p className="text-sm sm:text-base text-[#6E6E73] font-normal">
                taxa média de retorno de clientes
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-6xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-[#1C1C1E]">
                40h<span className="text-4xl sm:text-5xl align-top font-light">+</span>
              </p>
              <p className="text-sm sm:text-base text-[#6E6E73] font-normal">
                economizadas por mês em gestão
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DEPOIMENTOS DE EMPREENDEDORES */}
      <section
        id="casos-de-uso"
        aria-label="Casos reais de empreendedores"
        className="py-16 sm:py-24 bg-white border-b border-[#E5E5EA] overflow-hidden w-full"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl sm:text-5xl font-normal text-[#1C1C1E] tracking-tight leading-tight max-w-2xl">
              Resultados reais em estúdios e clínicas
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollTestimonials("prev")}
                disabled={currentIndex === 0}
                aria-label="Depoimento anterior"
                className="p-3 rounded-full border border-[#E5E5EA] bg-white text-[#1C1C1E] hover:bg-[#F5F5F7] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTestimonials("next")}
                disabled={currentIndex === TESTIMONIALS.length - 1}
                aria-label="Próximo depoimento"
                className="p-3 rounded-full border border-[#E5E5EA] bg-white text-[#1C1C1E] hover:bg-[#F5F5F7] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={testimonialContainerRef}
          className="w-full flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 pt-1 pl-4 sm:pl-6 lg:pl-8 pr-4 scrollbar-none"
        >
          {TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              className="snap-start shrink-0 w-[280px] sm:w-[320px] h-[340px] rounded-3xl p-7 bg-[#181816] text-white border border-zinc-800 flex flex-col justify-between"
            >
              <h3 className="text-xl sm:text-2xl font-normal leading-snug tracking-tight text-white">
                &ldquo;{item.quote}&rdquo;
              </h3>

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
      </section>

      {/* 3. SEÇÃO PARA QUEM É (COM CAPTURAS REAIS DO SISTEMA + SEGMENTOS CONCISOS) */}
      <section
        id="para-quem-e"
        aria-label="Para quem é a AgendaSte"
        className="py-16 sm:py-24 bg-[#FAF9F6] border-b border-[#E5E5EA]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[12px] font-sans font-medium text-[#6E6E73] uppercase tracking-wider">
                Operação na prática
              </span>
              <h2 className="text-3xl sm:text-4xl font-normal text-[#1C1C1E] tracking-tight">
                Sob medida para o seu formato de atendimento
              </h2>
            </div>
          </div>

          {/* Real System Captures: Agenda & Prontuários */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#1C1C1E]">
                  Agenda com pausas e trava de recursos
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E5E5EA] text-[11px] font-medium text-[#1C1C1E]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Encaixes automáticos
                </span>
              </div>
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-[#E5E5EA] bg-white">
                <Image
                  src="/images/real-calendar.png"
                  alt="Tela real da agenda AgendaSte com blocos de pausa e trava de salas"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 600px"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#1C1C1E]">
                  Prontuário clínico e mapeamento fotográfico
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E5E5EA] text-[11px] font-medium text-[#1C1C1E]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Padrão SOAP &amp; LGPD
                </span>
              </div>
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-[#E5E5EA] bg-white">
                <Image
                  src="/images/real-charts.png"
                  alt="Tela real de prontuários clínicos e fotos antes e depois na AgendaSte"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 600px"
                />
              </div>
            </div>
          </div>

          {/* Compact 4-Segment Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SEGMENTS.map((seg) => {
              const Icon = seg.icon;
              return (
                <div
                  key={seg.title}
                  className="p-5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[14.5px] font-semibold text-[#1C1C1E]">
                      {seg.title}
                    </h3>
                    <p className="text-[12.5px] text-[#6E6E73] leading-snug">
                      {seg.desc}
                    </p>
                  </div>
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
        className="py-16 sm:py-24 bg-[#141416] text-white text-center"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
            Comece agora em menos de 1 minuto
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href={primaryCtaUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-[14.5px] font-semibold hover:bg-zinc-100 transition-all active:scale-[0.98]"
            >
              <span>Começar teste grátis (14 dias)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={demoWhatsAppUrl}
              target={demoWhatsAppUrl.startsWith("http") ? "_blank" : undefined}
              rel={demoWhatsAppUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#D7FE03] hover:bg-[#cbf000] text-black text-[14px] font-semibold transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>Agendar demonstração</span>
            </a>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-zinc-400">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              14 dias grátis
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sem cartão de crédito
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Ativação imediata
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
