"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { TurnstileWidget, type TurnstileWidgetRef } from "@/components/turnstile-widget";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Por favor, digite um e-mail válido.");
      return;
    }

    setLoading(true);

    try {
      if (turnstileToken) {
        try {
          const isLocal =
            typeof window !== "undefined" &&
            (window.location.hostname === "localhost" ||
              window.location.hostname === "127.0.0.1" ||
              window.location.hostname.endsWith(".localhost"));

          const verifyRes = await fetch("/api/turnstile/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: turnstileToken,
              action: "forgot_password",
              isLocalhost: isLocal,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.success) {
            if (!isLocal) {
              setErrorMessage("Falha na verificação de segurança contra robôs.");
              setLoading(false);
              turnstileRef.current?.reset();
              setTurnstileToken("");
              return;
            } else {
              console.warn("[Turnstile Dev] Verificação flexibilizada em localhost:", verifyData);
            }
          }
        } catch (verErr) {
          console.warn("[Turnstile forgot password check]", verErr);
        }
      }

      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocorreu um erro ao solicitar a recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-[#E5E5EA] dark:border-[#27272a] p-7 sm:p-9 shadow-xs space-y-6 transition-colors">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl sm:text-[26px] font-semibold text-[#1C1C1E] dark:text-white tracking-tight">
          Recuperar senha
        </h1>
        <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa]">
          Enviaremos instruções seguras para redefinição no seu e-mail
        </p>
      </div>

      {submitted ? (
        <div className="p-6 rounded-2xl bg-[#F5F5F7] dark:bg-[#09090b] border border-[#E5E5EA] dark:border-[#27272a] text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] text-[#1C1C1E] dark:text-white mx-auto flex items-center justify-center shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">
              E-mail de recuperação enviado
            </h3>
            <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
              Verifique a caixa de entrada de <strong className="text-[#1C1C1E] dark:text-white">{email}</strong> para redefinir sua senha. O link expira em 1 hora.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#1C1C1E] dark:text-white hover:underline pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao login</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="recovery-email"
              className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
            >
              E-mail da sua conta
            </label>
            <input
              id="recovery-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@estudio.com.br"
              autoComplete="email"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] dark:placeholder:text-[#71717a] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
            />
          </div>

          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3.5 rounded-xl bg-[#F5F5F7] dark:bg-[#09090b] border border-[#E5E5EA] dark:border-[#27272a] text-[12.5px] text-[#1C1C1E] dark:text-[#f4f4f5] flex items-center gap-2.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cloudflare Turnstile CAPTCHA */}
          <TurnstileWidget
            ref={turnstileRef}
            action="forgot_password"
            onVerify={(tok) => setTurnstileToken(tok)}
            onExpire={() => setTurnstileToken("")}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#1C1C1E] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-[#09090b] text-[13.5px] font-semibold transition-all shadow-xs active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white dark:text-[#09090b]" />
            ) : (
              <>
                <span>Enviar link de recuperação</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para tela de login</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
