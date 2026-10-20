"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPrimaryCtaUrl } from "@/lib/marketing-content";

interface CarouselCard {
  id: string;
  badgeId?: string;
  title: string;
  subtitle: string;
  bgClass: string;
  textClass: string;
  imageSrc: string;
  imageAlt: string;
}

const CAROUSEL_CARDS: CarouselCard[] = [
  {
    id: "como-funciona-marketing_crm",
    badgeId: "como-funciona",
    title: "Receita recuperada",
    subtitle: "Painel diário com metas, agenda e oportunidades de retorno.",
    bgClass: "bg-[#F5F5F7]",
    textClass: "text-[#1C1C1E]",
    imageSrc: "/images/real-overview.png",
    imageAlt: "Painel operacional e primeiros passos para faturamento na LUVEA",
  },
  {
    id: "como-funciona-pagamentos_pdv",
    title: "Pagamentos sem atrito",
    subtitle: "Sinal Pix antecipado, comanda rápida e histórico conciliado.",
    bgClass: "bg-[#D7FE03]",
    textClass: "text-black",
    imageSrc: "/images/real-payments.png",
    imageAlt: "Gestão de pagamentos, sinal Pix e histórico de vendas na LUVEA",
  },
  {
    id: "como-funciona-agentes",
    title: "Todas as mensagens atendidas",
    subtitle: "Recepção IA no WhatsApp confirmando horários 24 horas.",
    bgClass: "bg-[#1C1C1E]",
    textClass: "text-white",
    imageSrc: "/images/real-reception.png",
    imageAlt: "Recepção IA 24 horas no WhatsApp com sincronização de agendamentos",
  },
  {
    id: "como-funciona-agendamento",
    title: "Site próprio de agendamento",
    subtitle: "Link na bio para reservas online em 30 segundos.",
    bgClass: "bg-[#F5F5F7]",
    textClass: "text-[#1C1C1E]",
    imageSrc: "/images/real-storefront.png",
    imageAlt: "Site de agendamento online público personalizado",
  },
  {
    id: "como-funciona-equipe_negocio",
    badgeId: "como-funciona-prontuario",
    title: "Repasses e ponto digital",
    subtitle: "Cálculo automático de comissões (Salão-Parceiro) e folha de ponto.",
    bgClass: "bg-[#EFEFF4]",
    textClass: "text-[#1C1C1E]",
    imageSrc: "/images/real-payroll.png",
    imageAlt: "Fechamento de folha de pagamento e repasses de comissões por profissional",
  },
];

export function HowItWorksCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    const cards = containerRef.current.children;
    if (cards[index]) {
      (cards[index] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      setCurrentIndex(index);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < CAROUSEL_CARDS.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollLeft = container.scrollLeft;
        const cardWidth = container.clientWidth;
        if (cardWidth > 0) {
          const newIdx = Math.round(scrollLeft / (cardWidth * 0.75));
          const clamped = Math.max(0, Math.min(CAROUSEL_CARDS.length - 1, newIdx));
          setCurrentIndex(clamped);
        }
      }, 50);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const primaryCtaUrl = getPrimaryCtaUrl();

  return (
    <section
      id="como-funciona"
      aria-label="Como funciona a LUVEA"
      className="py-16 sm:py-24 bg-white border-b border-zinc-200/80 overflow-hidden w-full"
    >
      {/* Header: Edge-to-edge full width without max-w-7xl constraint */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 sm:mb-12">
          <div className="space-y-2">
            <span className="text-[12px] font-sans font-medium text-zinc-500 uppercase tracking-wider">
              Como Funciona
            </span>
            <h2 className="text-3xl sm:text-5xl font-normal text-[#18181B] tracking-tight leading-tight">
              Um sistema inteligente que faz você faturar mais
            </h2>
          </div>

          {/* Navigation Controls: subtle rounded buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              aria-label="Módulo anterior"
              className="p-3 rounded-full border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === CAROUSEL_CARDS.length - 1}
              aria-label="Próximo módulo"
              className="p-3 rounded-full border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Track: Edge-to-edge full width bleed */}
      <div
        ref={containerRef}
        role="region"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") handlePrev();
          if (e.key === "ArrowRight") handleNext();
        }}
        className="w-full flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 pt-2 px-4 sm:px-6 lg:px-8 focus:outline-none scrollbar-none"
      >
        {CAROUSEL_CARDS.map((card) => (
          <div
            key={card.id}
            id={card.id}
            className={`snap-start shrink-0 w-[88vw] sm:w-[680px] lg:w-[780px] rounded-3xl p-6 sm:p-10 ${card.bgClass} ${card.textClass} flex flex-col justify-between space-y-6 shadow-sm overflow-hidden transition-all`}
          >
            {card.badgeId && <div id={card.badgeId} className="hidden" aria-hidden="true" />}
            
            {/* Minimal headline + 1 sentence subtitle */}
            <div className="space-y-2 max-w-xl">
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {card.title}
              </h3>
              <p className="text-sm sm:text-base opacity-90 leading-relaxed font-normal">
                {card.subtitle}
              </p>
            </div>

            {/* Real Project Screenshot Container */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden shadow-md border border-black/5 bg-white">
              <Image
                src={card.imageSrc}
                alt={card.imageAlt}
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 780px"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA Pill */}
      <div className="mt-10 flex justify-center w-full px-4">
        <Link
          href={primaryCtaUrl}
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#18181B] text-white text-[14px] font-medium hover:bg-black transition-all shadow-sm active:scale-[0.98]"
        >
          <span>Explorar o sistema completo</span>
        </Link>
      </div>
    </section>
  );
}
