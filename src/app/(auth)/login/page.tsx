"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Por favor, informe um endereço de e-mail válido.");
      return;
    }

    setLoading(true);

    try {
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
    <div className="bg-white rounded-2xl border border-[#E5E5EA] p-7 sm:p-9 shadow-xs space-y-6">
      {/* Title & Subtitle */}
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl sm:text-[26px] font-semibold text-[#1C1C1E] tracking-tight">
          Acesse sua conta
        </h1>
        <p className="text-[13px] text-[#6E6E73]">
          Plataforma de gestão e agendamento para o seu estúdio
        </p>
      </div>

      {/* Google Social Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-full border border-[#D4D4D8] bg-white hover:bg-[#F5F5F7] text-[#1C1C1E] text-[13.5px] font-medium transition shadow-2xs disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
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
        <div className="border-t border-[#E5E5EA] w-full" />
        <span className="bg-white px-3 text-[11px] uppercase tracking-wider font-mono text-[#8E8E93]">
          ou
        </span>
      </div>

      {/* Auth Mode Tabs (Password vs Magic Link) */}
      <div className="grid grid-cols-2 p-1 bg-[#F5F5F7] rounded-xl text-[12.5px] font-medium text-[#6E6E73]">
        <button
          type="button"
          onClick={() => {
            setAuthMode("password");
            setErrorMessage(null);
            setMagicLinkSent(false);
          }}
          className={`py-1.5 rounded-lg transition-all ${
            authMode === "password"
              ? "bg-white text-[#1C1C1E] shadow-2xs font-semibold"
              : "hover:text-[#1C1C1E]"
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
              ? "bg-white text-[#1C1C1E] shadow-2xs font-semibold"
              : "hover:text-[#1C1C1E]"
          }`}
        >
          Link Mágico (sem senha)
        </button>
      </div>

      {/* Magic Link Sent Feedback */}
      {magicLinkSent ? (
        <div className="p-5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-white border border-[#E5E5EA] text-[#1C1C1E] mx-auto flex items-center justify-center shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[14px] font-semibold text-[#1C1C1E]">
              Link de acesso enviado
            </h3>
            <p className="text-[12.5px] text-[#6E6E73] leading-relaxed">
              Enviamos um link de login para <strong className="text-[#1C1C1E]">{email}</strong>.
              Abra o e-mail no seu dispositivo para entrar instantaneamente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMagicLinkSent(false)}
            className="text-[12px] text-[#6E6E73] hover:text-[#1C1C1E] underline pt-2"
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
              className="block text-[12.5px] font-medium text-[#1C1C1E]"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] bg-white text-[13.5px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] transition"
            />
          </div>

          {/* Password Input (Only in Password mode) */}
          {authMode === "password" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-[12.5px] font-medium text-[#1C1C1E]"
                >
                  Senha
                </label>
                <Link
                  href="/esqueci-senha"
                  className="text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] transition-colors"
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
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#D4D4D8] bg-white text-[13.5px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1C1C1E] p-1"
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
                className="w-4 h-4 rounded border-[#D4D4D8] text-[#1C1C1E] focus:ring-black accent-[#1C1C1E]"
              />
              <label
                htmlFor="remember-me"
                className="text-[12.5px] text-[#6E6E73] cursor-pointer"
              >
                Lembrar de mim neste dispositivo
              </label>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-[12.5px] text-[#1C1C1E] flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[13.5px] font-semibold transition-all shadow-xs active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
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
      <div className="pt-2 text-center text-[12.5px] text-[#6E6E73] border-t border-[#F5F5F7]">
        Não tem uma conta?{" "}
        <Link
          href="/checkout"
          className="font-semibold text-[#1C1C1E] hover:underline"
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
        <div className="bg-white rounded-2xl border border-[#E5E5EA] p-8 shadow-xs flex items-center justify-center min-h-[360px]">
          <div className="w-6 h-6 rounded-full border-2 border-[#1C1C1E] border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
