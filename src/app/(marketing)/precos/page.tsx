import type { Metadata } from "next";
import React from "react";
import { PricingCardsAndFaq } from "@/components/marketing/pricing-cards-and-faq";

export const metadata: Metadata = {
  title: "Planos & Preços · LUVEA",
  description:
    "Conheça os planos Essencial, Gold e Platinum da LUVEA. Comece com 14 dias de teste grátis sem cartão de crédito.",
  alternates: {
    canonical: "/precos",
  },
  openGraph: {
    title: "Planos & Preços · LUVEA",
    description:
      "Conheça os planos Essencial, Gold e Platinum da LUVEA. Comece com 14 dias de teste grátis sem cartão de crédito.",
    url: "https://luvea.app/precos",
    siteName: "LUVEA",
    locale: "pt_BR",
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <div className="flex-1 flex flex-col">
      <PricingCardsAndFaq />
    </div>
  );
}
