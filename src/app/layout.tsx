import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://agendaste.com.br"),
  title: {
    default: "AgendaSte — Plataforma de Agendamento & Gestão para Estética",
    template: "%s · AgendaSte",
  },
  description:
    "Plataforma profissional de agendamento online, Recepção IA, ponto de venda Pix, catálogo inteligente, prontuários e gestão de equipe.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AgendaSte",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "AgendaSte — Plataforma de Agendamento & Gestão para Estética",
    description:
      "Plataforma profissional de agendamento online, Recepção IA, ponto de venda Pix, catálogo inteligente, prontuários e gestão de equipe.",
    url: "https://agendaste.com.br",
    siteName: "AgendaSte",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#1C1C1E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="font-sans min-h-screen bg-white text-[#18181B] antialiased selection:bg-[#ECE9FE] selection:text-[#18181B]"
      >
        {children}
      </body>
    </html>
  );
}
