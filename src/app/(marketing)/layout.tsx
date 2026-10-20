import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "LUVEA · Plataforma Completa de Agendamento & Gestão",
  description:
    "Plataforma profissional de agendamento online, Recepção IA, ponto de venda Pix, catálogo inteligente, prontuários e gestão de equipe.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#18181B] selection:bg-zinc-200 selection:text-[#18181B]">
      <MarketingHeader />
      <main className="flex-1 flex flex-col">{children}</main>
      <MarketingFooter />
    </div>
  );
}
