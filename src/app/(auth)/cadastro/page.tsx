"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  normalizeSubdomain,
  calculatePasswordStrength,
} from "@/lib/auth-schemas";
import { TurnstileWidget, type TurnstileWidgetRef } from "@/components/turnstile-widget";

export default function CadastroPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [userEditedSubdomain, setUserEditedSubdomain] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  const passwordStrength = calculatePasswordStrength(password);

  const handleBusinessNameChange = (val: string) => {
    setBusinessName(val);
    if (!userEditedSubdomain) {
      setSubdomain(normalizeSubdomain(val));
    }
  };

  const handleSubdomainChange = (val: string) => {
    setUserEditedSubdomain(true);
    setSubdomain(normalizeSubdomain(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("As senhas digitadas não coincidem.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (!subdomain || subdomain.length < 3) {
      setErrorMessage("Informe um subdomínio válido com pelo menos 3 caracteres.");
      return;
    }

    setLoading(true);

    try {
      // Validação de segurança Cloudflare Turnstile
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
              action: "signup",
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
          console.warn("[Turnstile verification check]", verErr);
        }
      }

      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              business_name: businessName.trim(),
              subdomain: subdomain.trim(),
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        // Se a confirmação de e-mail estiver ativa, redireciona ou avisa
        if (data?.user && !data.session) {
          router.push(`/login?emailConfirmation=true&email=${encodeURIComponent(email)}`);
          return;
        }
      }

      // Redireciona para o painel operacional da Luvea
      router.push("/app");
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocorreu um erro ao criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-[#E5E5EA] dark:border-[#27272a] p-7 sm:p-9 shadow-xs space-y-6 transition-colors">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl sm:text-[26px] font-semibold text-[#1C1C1E] dark:text-white tracking-tight">
          Crie seu estúdio
        </h1>
        <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa]">
          Comece agora com 14 dias de teste grátis da plataforma LUVEA
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="cadastro-name"
            className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
          >
            Nome completo
          </label>
          <input
            id="cadastro-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ana Paula Ribeiro"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] dark:placeholder:text-[#71717a] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
          />
        </div>

        {/* Business Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="cadastro-business"
            className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
          >
            Nome do seu estúdio ou clínica
          </label>
          <input
            id="cadastro-business"
            type="text"
            value={businessName}
            onChange={(e) => handleBusinessNameChange(e.target.value)}
            placeholder="Studio Ana Paula Visagismo"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] dark:placeholder:text-[#71717a] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
          />
        </div>

        {/* Dynamic Subdomain Slug Preview */}
        <div className="space-y-1.5">
          <label
            htmlFor="cadastro-subdomain"
            className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
          >
            Seu link de agendamento online
          </label>
          <div className="flex items-center rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] px-3.5 py-2.5 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition">
            <input
              id="cadastro-subdomain"
              type="text"
              value={subdomain}
              onChange={(e) => handleSubdomainChange(e.target.value)}
              placeholder="estudio-ana"
              required
              className="flex-1 bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] dark:placeholder:text-[#71717a] focus:outline-none font-mono"
            />
            <span className="text-[12.5px] font-mono text-[#8E8E93] dark:text-[#71717a] shrink-0 pl-1">
              .luvea.app
            </span>
          </div>
          <p className="text-[11.5px] text-[#6E6E73] dark:text-[#71717a]">
            Este será o endereço público do seu site de agendamento.
          </p>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="cadastro-email"
            className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
          >
            E-mail
          </label>
          <input
            id="cadastro-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ana@estudio.com.br"
            autoComplete="email"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] dark:placeholder:text-[#71717a] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="cadastro-password"
            className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
          >
            Senha
          </label>
          <div className="relative">
            <input
              id="cadastro-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              required
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] dark:placeholder:text-[#71717a] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] dark:text-[#71717a] hover:text-[#1C1C1E] dark:hover:text-white p-1"
              aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Minimalist Password Strength Meter */}
          {password && (
            <div className="space-y-1 pt-1">
              <div
                role="progressbar"
                aria-label="Força da senha"
                aria-valuenow={passwordStrength.score}
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuetext={passwordStrength.label}
                className="grid grid-cols-4 gap-1.5 h-1"
              >
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    aria-hidden="true"
                    className={`rounded-full transition-all duration-200 ${
                      passwordStrength.score >= step
                        ? passwordStrength.colorClass
                        : "bg-zinc-100 dark:bg-[#27272a]"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#71717a] font-medium" aria-hidden="true">
                Força da senha:{" "}
                <span className="text-[#1C1C1E] dark:text-white">{passwordStrength.label}</span>
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="cadastro-confirm-password"
            className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
          >
            Confirmar senha
          </label>
          <input
            id="cadastro-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita sua senha"
            autoComplete="new-password"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] dark:placeholder:text-[#71717a] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
          />
        </div>

        {/* Error Banner */}
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
          action="signup"
          onVerify={(tok) => setTurnstileToken(tok)}
          onExpire={() => setTurnstileToken("")}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#1C1C1E] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-[#09090b] text-[13.5px] font-semibold transition-all shadow-xs active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white dark:text-[#09090b]" />
          ) : (
            <>
              <span>Iniciar teste grátis de 14 dias</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-2 text-center text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] border-t border-[#F5F5F7] dark:border-[#27272a]">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-semibold text-[#1C1C1E] dark:text-white hover:underline">
          Fazer login
        </Link>
      </div>
    </div>
  );
}
