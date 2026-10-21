import React from "react";
import Link from "next/link";
import { LuveaWordmark } from "@/components/luvea-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFC] dark:bg-[#09090b] text-[#1C1C1E] dark:text-[#f4f4f5] flex flex-col justify-between selection:bg-[#1C1C1E] dark:selection:bg-[#27272a] selection:text-white transition-colors">
      {/* Top Header */}
      <header className="w-full px-6 py-6 sm:px-10 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white rounded-lg py-1"
          aria-label="LUVEA - Página inicial"
        >
          <LuveaWordmark className="text-[20px] group-hover:opacity-80 transition-opacity dark:text-white" />
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle variant="pill" />
          <Link
            href="/"
            className="text-[13px] font-medium text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white transition-colors"
          >
            Voltar ao site
          </Link>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px] space-y-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-6 text-center text-xs text-[#8E8E93] dark:text-[#71717a] space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/termos-de-uso"
            className="hover:text-[#1C1C1E] dark:hover:text-white transition-colors"
          >
            Termos de Uso
          </Link>
          <span>•</span>
          <Link
            href="/politica-de-privacidade"
            className="hover:text-[#1C1C1E] dark:hover:text-white transition-colors"
          >
            Política de Privacidade
          </Link>
        </div>
        <p>© {new Date().getFullYear()} LUVEA. Plataforma de Gestão &amp; Agendamento.</p>
      </footer>
    </div>
  );
}
