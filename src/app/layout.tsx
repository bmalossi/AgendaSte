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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://luvea.app"),
  title: {
    default: "LUVEA — Plataforma de Agendamento & Gestão para Estética",
    template: "%s · LUVEA",
  },
  description:
    "Plataforma profissional de agendamento online, Recepção IA, ponto de venda Pix, catálogo inteligente, prontuários e gestão de equipe.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LUVEA",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "LUVEA — Plataforma de Agendamento & Gestão para Estética",
    description:
      "Plataforma profissional de agendamento online, Recepção IA, ponto de venda Pix, catálogo inteligente, prontuários e gestão de equipe.",
    url: "https://luvea.app",
    siteName: "LUVEA",
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var storedTheme = localStorage.getItem('luvea_theme');
                if (storedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="font-sans min-h-screen bg-white text-[#18181B] dark:bg-[#09090b] dark:text-[#f4f4f5] antialiased selection:bg-[#ECE9FE] selection:text-[#18181B] dark:selection:bg-[#27272a] dark:selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
