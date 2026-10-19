import type { Metadata } from "next";
import { AgendaSteApp } from "@/components/agendaste/agendaste-app";
import { NavigationSectionId } from "@/lib/agendaste-store";

export const metadata: Metadata = {
  title: "AgendaSte · Painel de Gestão e Agendamento",
  description:
    "Painel operacional da AgendaSte para controle de agenda, clientes, vendas, recepção IA e equipe.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const initialSection = (resolved?.view as NavigationSectionId) || "get_started";

  return <AgendaSteApp initialSection={initialSection} />;
}
