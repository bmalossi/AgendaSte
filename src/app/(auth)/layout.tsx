import React from "react";
import Link from "next/link";
import { LuveaWordmark } from "@/components/luvea-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#1C1C1E] flex flex-col justify-between selection:bg-[#1C1C1E] selection:text-white">
      {/* Top Header */}
      <header className="w-full px-6 py-6 sm:px-10 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-lg py-1"
          aria-label="LUVEA - Página inicial"
        >
          <LuveaWordmark className="text-[20px] group-hover:opacity-80 transition-opacity" />
        </Link>

        <Link
          href="/"
          className="text-[13px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] transition-colors"
        >
          Voltar ao site
        </Link>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px] space-y-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-6 text-center text-xs text-[#8E8E93] space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/termos-de-uso"
            className="hover:text-[#1C1C1E] transition-colors"
          >
            Termos de Uso
          </Link>
          <span>•</span>
          <Link
            href="/politica-de-privacidade"
            className="hover:text-[#1C1C1E] transition-colors"
          >
            Política de Privacidade
          </Link>
        </div>
        <p>© {new Date().getFullYear()} LUVEA. Plataforma de Gestão &amp; Agendamento.</p>
      </footer>
    </div>
  );
}
