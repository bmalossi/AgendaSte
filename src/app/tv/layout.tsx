import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LUVEA TV Kiosk — Painel de Recepção",
  description: "Painel em tempo real para Smart TVs e monitores de recepção.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-screen bg-[#09090B] text-[#EDEDED] antialiased overflow-hidden select-none transition-colors duration-700 ease-in-out motion-reduce:transition-none">
      {children}
    </div>
  );
}
