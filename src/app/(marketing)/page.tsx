import type { Metadata } from "next";
import React from "react";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksCarousel } from "@/components/marketing/how-it-works-carousel";
import { FactsUseCasesAndAudience } from "@/components/marketing/facts-use-cases-and-audience";

export const metadata: Metadata = {
  title: "AgendaSte — Plataforma de Agendamento & Gestão para Estética",
  description:
    "Agendamento online 24/7, confirmação automática via WhatsApp com sinal Pix, prontuários digitais e gestão financeira para profissionais da beleza. 14 dias de teste grátis.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AgendaSte — Plataforma de Agendamento & Gestão para Estética",
    description:
      "Agendamento online 24/7, confirmação automática via WhatsApp com sinal Pix, prontuários digitais e gestão financeira para profissionais da beleza.",
    url: "https://agendaste.com.br",
    siteName: "AgendaSte",
    locale: "pt_BR",
    type: "website",
  },
};

export default function MarketingHomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <HeroSection />
      <HowItWorksCarousel />
      <FactsUseCasesAndAudience />
    </div>
  );
}
