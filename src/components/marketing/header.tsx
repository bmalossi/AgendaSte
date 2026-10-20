"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  MessageCircle,
  Calendar,
  CreditCard,
  Users,
  FileText,
  HeartHandshake,
  Building2,
  UserCheck,
} from "lucide-react";
import {
  HOW_IT_WORKS_MENU,
  BUSINESS_MENU,
  resolveDemoWhatsAppUrl,
  getPrimaryCtaUrl,
  getLoginUrl,
} from "@/lib/marketing-content";
import { LuveaWordmark } from "@/components/luvea-logo";

export function MarketingHeader() {
  const [activeDropdown, setActiveDropdown] = useState<"how" | "business" | null>(
    null
  );
  const [activeHowCategory, setActiveHowCategory] = useState<string>("agentes");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileHowOpen, setMobileHowOpen] = useState(false);
  const [mobileBusinessOpen, setMobileBusinessOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const howTriggerRef = useRef<HTMLButtonElement>(null);
  const businessTriggerRef = useRef<HTMLButtonElement>(null);

  // Close menus on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (activeDropdown) {
          const prev = activeDropdown;
          setActiveDropdown(null);
          if (prev === "how") howTriggerRef.current?.focus();
          if (prev === "business") businessTriggerRef.current?.focus();
        }
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown, mobileMenuOpen]);

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const currentHowData =
    HOW_IT_WORKS_MENU.find((cat) => cat.id === activeHowCategory) ||
    HOW_IT_WORKS_MENU[0];

  const demoWhatsAppUrl = resolveDemoWhatsAppUrl();
  const primaryCtaUrl = getPrimaryCtaUrl();
  const loginUrl = getLoginUrl();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Brand Logo — Wordmark de alta-costura (LUVEA) */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-lg py-1"
              aria-label="LUVEA - Início"
            >
              <LuveaWordmark className="text-[20px] sm:text-[22px] group-hover:opacity-80 transition-opacity" />
            </Link>

            {/* Desktop Navigation */}
            <nav
              ref={navRef}
              aria-label="Navegação Principal"
              className="hidden lg:flex items-center gap-1"
            >
              {/* "Como funciona" Mega Menu Trigger */}
              <div className="relative">
                <button
                  ref={howTriggerRef}
                  type="button"
                  aria-expanded={activeDropdown === "how"}
                  aria-haspopup="true"
                  aria-controls="mega-menu-how"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "how" ? null : "how")
                  }
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13.5px] font-medium transition-colors ${
                    activeDropdown === "how"
                      ? "bg-zinc-100 text-[#18181B]"
                      : "text-zinc-600 hover:text-[#18181B] hover:bg-zinc-50"
                  }`}
                >
                  <span>Como funciona</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
                      activeDropdown === "how" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* "Como funciona" Mega Menu Panel */}
                {activeDropdown === "how" && (
                  <div
                    id="mega-menu-how"
                    role="region"
                    aria-label="Menu Como Funciona"
                    className="absolute left-0 top-full mt-3 w-[840px] rounded-2xl bg-white border border-zinc-200 shadow-2xl p-6 grid grid-cols-12 gap-6 animate-in fade-in-0 zoom-in-95 duration-150"
                  >
                    {/* Left Column: Categories List */}
                    <div className="col-span-4 border-r border-zinc-100 pr-4 space-y-1">
                      <p className="text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-600 px-3 py-1.5">
                        Categorias
                      </p>
                      {HOW_IT_WORKS_MENU.map((cat) => {
                        const isSelected = activeHowCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveHowCategory(cat.id)}
                            onMouseEnter={() => setActiveHowCategory(cat.id)}
                            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-left text-[13.5px] transition-all ${
                              isSelected
                                ? "bg-zinc-100 text-[#18181B] font-semibold"
                                : "text-zinc-500 hover:bg-zinc-50 hover:text-[#18181B] font-normal"
                            }`}
                          >
                            <span>{cat.label}</span>
                            {isSelected && (
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-900" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Middle Column: Items for selected category */}
                    <div className="col-span-4 space-y-2">
                      <p className="text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-600 px-1 py-1.5">
                        {currentHowData.label}
                      </p>
                      <div className="space-y-1">
                        {currentHowData.items.map((item) => (
                          <Link
                            key={item.title}
                            href={item.href}
                            onClick={() => setActiveDropdown(null)}
                            className="block p-2.5 rounded-xl hover:bg-zinc-50 transition-colors group"
                          >
                            <p className="text-[13px] font-semibold text-[#18181B] group-hover:text-black">
                              {item.title}
                            </p>
                            <p className="text-[11.5px] text-zinc-500 leading-snug mt-0.5">
                              {item.description}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: Editorial Highlight Card */}
                    <div className="col-span-4 pl-2 flex flex-col justify-between">
                      <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-200/80 text-[10px] font-mono font-semibold text-zinc-800 mb-3 uppercase tracking-wider">
                            <span>Destaque</span>
                          </div>
                          <h4 className="font-serif text-lg font-normal text-[#18181B] leading-tight mb-1.5">
                            {currentHowData.highlight.title}
                          </h4>
                          <p className="text-[12px] text-zinc-600 leading-relaxed font-sans">
                            {currentHowData.highlight.description}
                          </p>
                        </div>

                        <Link
                          href={currentHowData.highlight.ctaHref}
                          onClick={() => setActiveDropdown(null)}
                          className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#18181B] hover:gap-2 transition-all"
                        >
                          <span>{currentHowData.highlight.ctaText}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* "Negócios" Mega Menu Trigger */}
              <div className="relative">
                <button
                  ref={businessTriggerRef}
                  type="button"
                  aria-expanded={activeDropdown === "business"}
                  aria-haspopup="true"
                  aria-controls="mega-menu-business"
                  onClick={() =>
                    setActiveDropdown(
                      activeDropdown === "business" ? null : "business"
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13.5px] font-medium transition-colors ${
                    activeDropdown === "business"
                      ? "bg-zinc-100 text-[#18181B]"
                      : "text-zinc-600 hover:text-[#18181B] hover:bg-zinc-50"
                  }`}
                >
                  <span>Negócios</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
                      activeDropdown === "business" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* "Negócios" Mega Menu Panel */}
                {activeDropdown === "business" && (
                  <div
                    id="mega-menu-business"
                    role="region"
                    aria-label="Menu Negócios"
                    className="absolute left-0 top-full mt-3 w-[680px] rounded-2xl bg-white border border-zinc-200 shadow-2xl p-6 grid grid-cols-2 gap-6 animate-in fade-in-0 zoom-in-95 duration-150"
                  >
                    {BUSINESS_MENU.map((col) => (
                      <div key={col.id} className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                          {col.id === "segmento" ? (
                            <Building2 className="w-4 h-4 text-zinc-700" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-zinc-700" />
                          )}
                          <p className="text-[12px] uppercase font-mono tracking-wider font-semibold text-zinc-800">
                            {col.label}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {col.items.map((item) => (
                            <Link
                              key={item.title}
                              href={item.href}
                              onClick={() => setActiveDropdown(null)}
                              className="block p-2.5 rounded-xl hover:bg-zinc-50 transition-colors group"
                            >
                              <p className="text-[13px] font-semibold text-[#18181B] group-hover:text-black">
                                {item.title}
                              </p>
                              <p className="text-[11.5px] text-zinc-500 leading-snug mt-0.5">
                                {item.description}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Preços link */}
              <Link
                href="/precos"
                className="px-3.5 py-2 rounded-full text-[13.5px] font-medium text-zinc-600 hover:text-[#18181B] hover:bg-zinc-50 transition-colors"
              >
                Preços
              </Link>
            </nav>
          </div>

          {/* Desktop Right CTA Action Buttons */}
          <div className="hidden lg:flex items-center gap-2.5">
            <Link
              href={loginUrl}
              className="px-4 py-2 text-[13px] font-semibold text-zinc-700 hover:text-black transition-colors"
            >
              Entrar
            </Link>

            <a
              href={demoWhatsAppUrl}
              target={demoWhatsAppUrl.startsWith("http") ? "_blank" : undefined}
              rel={demoWhatsAppUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-zinc-200 hover:border-zinc-300 bg-white text-[13px] font-semibold text-[#18181B] hover:bg-zinc-50 transition-colors shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Agendar demonstração</span>
            </a>

            <Link
              href={primaryCtaUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-semibold hover:bg-black transition-all shadow-sm active:scale-[0.98]"
            >
              <span>Começar teste grátis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href={primaryCtaUrl}
              className="px-3.5 py-2 rounded-full bg-[#1C1C1E] text-white text-[12px] font-semibold"
            >
              Testar Grátis
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileMenuOpen}
              className="p-2.5 rounded-xl text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-black"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Full-Screen / Sliding Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-18 bottom-0 bg-white z-50 overflow-y-auto border-t border-zinc-200 px-6 py-6 space-y-6">
          <div className="space-y-4">
            {/* Como funciona (Mobile Accordion) */}
            <div className="border-b border-zinc-100 pb-3">
              <button
                type="button"
                onClick={() => setMobileHowOpen(!mobileHowOpen)}
                className="w-full flex items-center justify-between text-left py-2 font-serif text-xl text-[#18181B]"
              >
                <span>Como funciona</span>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-500 transition-transform ${
                    mobileHowOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {mobileHowOpen && (
                <div className="pl-3 pt-2 space-y-3">
                  {HOW_IT_WORKS_MENU.map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <p className="text-[12px] font-semibold text-zinc-800 uppercase tracking-wide font-mono">
                        {cat.label}
                      </p>
                      {cat.items.map((item) => (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1 text-[13px] text-zinc-600 hover:text-black"
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Negócios (Mobile Accordion) */}
            <div className="border-b border-zinc-100 pb-3">
              <button
                type="button"
                onClick={() => setMobileBusinessOpen(!mobileBusinessOpen)}
                className="w-full flex items-center justify-between text-left py-2 font-serif text-xl text-[#18181B]"
              >
                <span>Negócios</span>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-500 transition-transform ${
                    mobileBusinessOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {mobileBusinessOpen && (
                <div className="pl-3 pt-2 space-y-3">
                  {BUSINESS_MENU.map((col) => (
                    <div key={col.id} className="space-y-1">
                      <p className="text-[12px] font-semibold text-zinc-800 uppercase tracking-wide font-mono">
                        {col.label}
                      </p>
                      {col.items.map((item) => (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1 text-[13px] text-zinc-600 hover:text-black"
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preços (Mobile Direct Link) */}
            <div className="border-b border-zinc-100 pb-3">
              <Link
                href="/precos"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 font-serif text-xl text-[#18181B]"
              >
                Preços
              </Link>
            </div>
          </div>

          {/* Mobile Bottom Action Buttons */}
          <div className="pt-4 space-y-3">
            <Link
              href={primaryCtaUrl}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#1C1C1E] text-white text-[14px] font-semibold shadow-sm"
            >
              <span>Começar teste grátis (14 dias)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={demoWhatsAppUrl}
              onClick={() => setMobileMenuOpen(false)}
              target={demoWhatsAppUrl.startsWith("http") ? "_blank" : undefined}
              rel={demoWhatsAppUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-zinc-300 bg-white text-[13.5px] font-semibold text-[#18181B]"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Agendar demonstração via WhatsApp</span>
            </a>

            <Link
              href={loginUrl}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full block text-center py-2 text-[13.5px] font-semibold text-zinc-600 hover:text-black"
            >
              Já sou cliente · Entrar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
