import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LUVEA · Painel de Gestão e Agendamento",
  description:
    "Painel operacional da LUVEA para controle de agenda, clientes, vendas, recepção IA e equipe.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
