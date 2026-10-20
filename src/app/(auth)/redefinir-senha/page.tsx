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
    <div className="bg-white rounded-2xl border border-[#E5E5EA] p-7 sm:p-9 shadow-xs space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl sm:text-[26px] font-semibold text-[#1C1C1E] tracking-tight">
          Redefinir sua senha
        </h1>
        <p className="text-[13px] text-[#6E6E73]">
          Escolha uma nova senha segura para acessar seu estúdio
        </p>
      </div>

      {success ? (
        <div className="p-6 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-white border border-[#E5E5EA] text-[#1C1C1E] mx-auto flex items-center justify-center shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[14px] font-semibold text-[#1C1C1E]">
              Senha atualizada com sucesso
            </h3>
            <p className="text-[12.5px] text-[#6E6E73]">
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
              className="block text-[12.5px] font-medium text-[#1C1C1E]"
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

            {/* Password Strength Meter */}
            {password && (
              <div className="space-y-1 pt-1">
                <div className="grid grid-cols-4 gap-1.5 h-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`rounded-full transition-all duration-200 ${
                        passwordStrength.score >= step
                          ? passwordStrength.colorClass
                          : "bg-zinc-100"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-[#6E6E73] font-medium">
                  Força da senha:{" "}
                  <span className="text-[#1C1C1E]">{passwordStrength.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirm-new-password"
              className="block text-[12.5px] font-medium text-[#1C1C1E]"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] bg-white text-[13.5px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] transition"
            />
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-[12.5px] text-[#1C1C1E] flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[13.5px] font-semibold transition-all shadow-xs active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Salvar nova senha e entrar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="pt-2 text-center text-[12.5px] text-[#6E6E73] border-t border-[#F5F5F7]">
        Lembrou sua senha antiga?{" "}
        <Link href="/login" className="font-semibold text-[#1C1C1E] hover:underline">
          Fazer login
        </Link>
      </div>
    </div>
  );
}
