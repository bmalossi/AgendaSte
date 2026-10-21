"use client";

import React, { useState, Suspense, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { TurnstileWidget, type TurnstileWidgetRef } from "@/components/turnstile-widget";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/app";

  const [authMode, setAuthMode] = useState<"password" | "magic_link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Por favor, informe um endereço de e-mail válido.");
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
              action: "login",
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
          console.warn("[Turnstile login verify check]", verErr);
        }
      }

      if (authMode === "password") {
        if (!password) {
          setErrorMessage("Por favor, digite sua senha.");
          setLoading(false);
          return;
        }

        // Se Supabase estiver configurado, autentica via servidor
        if (isSupabaseConfigured()) {
          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (error) {
            setErrorMessage(
              error.message === "Invalid login credentials"
                ? "E-mail ou senha incorretos."
                : error.message
            );
            setLoading(false);
            return;
          }
        }

        // Sucesso / Mock demo: redireciona para a aplicação
        router.push(redirectPath);
      } else {
        // Modo Magic Link (sem senha)
        if (isSupabaseConfigured()) {
          const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
                redirectPath
              )}`,
            },
          });

          if (error) {
            setErrorMessage(error.message);
            setLoading(false);
            return;
          }
        }

        setMagicLinkSent(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocorreu um erro ao tentar entrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
              redirectPath
            )}`,
          },
        });

        if (error) {
          setErrorMessage(error.message);
          setGoogleLoading(false);
        }
      } else {
        // Modo demonstração
        setTimeout(() => {
          router.push(redirectPath);
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erro ao conectar com Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-[#E5E5EA] dark:border-[#27272a] p-7 sm:p-9 shadow-xs space-y-6 transition-colors">
      {/* Title & Subtitle */}
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl sm:text-[26px] font-semibold text-[#1C1C1E] dark:text-white tracking-tight">
          Acesse sua conta
        </h1>
        <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa]">
          Plataforma de gestão e agendamento para o seu estúdio
        </p>
      </div>

      {/* Google Social Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-full border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] text-[#1C1C1E] dark:text-white text-[13.5px] font-medium transition shadow-2xs disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-zinc-600 dark:text-zinc-400" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>Continuar com Google</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-[#E5E5EA] dark:border-[#27272a] w-full" />
        <span className="bg-white dark:bg-[#18181b] px-3 text-[11px] uppercase tracking-wider font-mono text-[#8E8E93] dark:text-[#71717a]">
          ou
        </span>
      </div>

      {/* Auth Mode Tabs (Password vs Magic Link) */}
      <div className="grid grid-cols-2 p-1 bg-[#F5F5F7] dark:bg-[#27272a] rounded-xl text-[12.5px] font-medium text-[#6E6E73] dark:text-[#a1a1aa]">
        <button
          type="button"
          onClick={() => {
            setAuthMode("password");
            setErrorMessage(null);
            setMagicLinkSent(false);
          }}
          className={`py-1.5 rounded-lg transition-all ${
            authMode === "password"
              ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white shadow-2xs font-semibold"
              : "hover:text-[#1C1C1E] dark:hover:text-white"
          }`}
        >
          Senha
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode("magic_link");
            setErrorMessage(null);
          }}
          className={`py-1.5 rounded-lg transition-all ${
            authMode === "magic_link"
              ? "bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white shadow-2xs font-semibold"
              : "hover:text-[#1C1C1E] dark:hover:text-white"
          }`}
        >
          Link Mágico (sem senha)
        </button>
      </div>

      {/* Magic Link Sent Feedback */}
      {magicLinkSent ? (
        <div className="p-5 rounded-2xl bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#3f3f46] text-[#1C1C1E] dark:text-white mx-auto flex items-center justify-center shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">
              Link de acesso enviado
            </h3>
            <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
              Enviamos um link de login para <strong className="text-[#1C1C1E] dark:text-white">{email}</strong>.
              Abra o e-mail no seu dispositivo para entrar instantaneamente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMagicLinkSent(false)}
            className="text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white underline pt-2"
          >
            Tentar outro método ou e-mail
          </button>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#a1a1aa]"
            >
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@estudio.com.br"
              autoComplete="email"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] dark:placeholder:text-[#71717a] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
            />
          </div>

          {/* Password Input (Only in Password mode) */}
          {authMode === "password" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#a1a1aa]"
                >
                  Senha
                </label>
                <Link
                  href="/esqueci-senha"
                  className="text-[12px] font-medium text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] dark:placeholder:text-[#71717a] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white p-1"
                  aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Remember Me Checkbox */}
          {authMode === "password" && (
            <div className="flex items-center gap-2 pt-0.5">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#D4D4D8] dark:border-[#27272a] text-[#1C1C1E] focus:ring-black accent-[#1C1C1E]"
              />
              <label
                htmlFor="remember-me"
                className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] cursor-pointer"
              >
                Lembrar de mim neste dispositivo
              </label>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3.5 rounded-xl bg-[#F5F5F7] dark:bg-[#27272a] border border-[#E5E5EA] dark:border-[#3f3f46] text-[12.5px] text-[#1C1C1E] dark:text-white flex items-center gap-2.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cloudflare Turnstile CAPTCHA */}
          <TurnstileWidget
            ref={turnstileRef}
            action="login"
            onVerify={(tok) => setTurnstileToken(tok)}
            onExpire={() => setTurnstileToken("")}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#1C1C1E] dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-[#09090b] text-[13.5px] font-semibold transition-all shadow-xs active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white dark:text-[#09090b]" />
            ) : (
              <>
                <span>
                  {authMode === "password"
                    ? "Entrar no estúdio"
                    : "Enviar link de acesso"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Footer Call to Action */}
      <div className="pt-2 text-center text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] border-t border-[#F5F5F7] dark:border-[#27272a]">
        Não tem uma conta?{" "}
        <Link
          href="/checkout"
          className="font-semibold text-[#1C1C1E] dark:text-white hover:underline"
        >
          Criar estúdio
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-[#E5E5EA] dark:border-[#27272a] p-8 shadow-xs flex items-center justify-center min-h-[360px]">
          <div className="w-6 h-6 rounded-full border-2 border-[#1C1C1E] dark:border-white border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
