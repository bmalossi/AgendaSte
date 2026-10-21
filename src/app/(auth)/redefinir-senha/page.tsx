"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { calculatePasswordStrength } from "@/lib/auth-schemas";

export default function RedefinirSenhaPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordStrength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/app");
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocorreu um erro ao atualizar a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-[#E5E5EA] dark:border-[#27272a] p-7 sm:p-9 shadow-xs space-y-6 transition-colors">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl sm:text-[26px] font-semibold text-[#1C1C1E] dark:text-white tracking-tight">
          Redefinir sua senha
        </h1>
        <p className="text-[13px] text-[#6E6E73] dark:text-[#a1a1aa]">
          Escolha uma nova senha segura para acessar seu estúdio
        </p>
      </div>

      {success ? (
        <div className="p-6 rounded-2xl bg-[#F5F5F7] dark:bg-[#09090b] border border-[#E5E5EA] dark:border-[#27272a] text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] text-[#1C1C1E] dark:text-white mx-auto flex items-center justify-center shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[14px] font-semibold text-[#1C1C1E] dark:text-white">
              Senha atualizada com sucesso
            </h3>
            <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
              Redirecionando você para o painel operacional...
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="new-password"
              className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
            >
              Nova senha
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
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

            {/* Password Strength Meter */}
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

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirm-new-password"
              className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
            >
              Confirmar nova senha
            </label>
            <input
              id="confirm-new-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita sua nova senha"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#1C1C1E] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-[#09090b] text-[13.5px] font-semibold transition-all shadow-xs active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white dark:text-[#09090b]" />
            ) : (
              <>
                <span>Salvar nova senha e entrar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="pt-2 text-center text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] border-t border-[#F5F5F7] dark:border-[#27272a]">
        Lembrou sua senha antiga?{" "}
        <Link href="/login" className="font-semibold text-[#1C1C1E] dark:text-white hover:underline">
          Fazer login
        </Link>
      </div>
    </div>
  );
}
