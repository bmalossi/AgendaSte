import type { Metadata, Viewport } from "next";
import { Public_Sans, Chivo_Mono } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public-sans",
  display: "swap",
});

const chivoMono = Chivo_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-chivo-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Veloce · Agenda Inteligente & Retenção em 1 Toque",
  description:
    "Terminal operacional de agendamento, checkout rápido, trava anti-no-show via Pix e sincronização WhatsApp 2-Way para profissionais autônomos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#121514",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${publicSans.variable} ${chivoMono.variable}`}>
      <body className="font-sans min-h-screen bg-canvas text-ink antialiased selection:bg-status-confirmed-bg selection:text-status-confirmed-fg">
        {children}
      </body>
    </html>
  );
}
