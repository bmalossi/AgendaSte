"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CreditCard,
  QrCode,
  ShieldCheck,
  Building,
  Loader2,
  Lock,
  Copy,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { LuveaWordmark } from "@/components/luvea-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  checkoutFormSchema,
  normalizeSubdomain,
  type CheckoutFormData,
} from "@/lib/auth-schemas";
import { PLANS_CATALOG } from "@/lib/marketing-content";
import { TurnstileWidget, type TurnstileWidgetRef } from "@/components/turnstile-widget";
import { QRCodeSVG } from "qrcode.react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const planParam = searchParams.get("plano") || searchParams.get("plan") || "gold";
  const cycleParam = searchParams.get("ciclo") || searchParams.get("cycle") || "monthly";

  // Step state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [userEditedSubdomain, setUserEditedSubdomain] = useState(false);

  // Plan & Payment Selection
  const [planTier, setPlanTier] = useState<"essencial" | "gold" | "platinum">(
    planParam === "essencial" || planParam === "platinum" ? planParam : "gold"
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    cycleParam === "yearly" ? "yearly" : "monthly"
  );
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix">("credit_card");

  // Validation & Loading
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  // Pix Payload & Polling
  const [pixPayload, setPixPayload] = useState<{
    invoiceId?: string;
    qrCode?: string;
    qrCodeBase64?: string;
    copiaECola?: string;
    ticketUrl?: string;
  } | null>(null);

  // Sync business name to subdomain slug
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

  // Selected Plan Object
  const selectedPlan =
    PLANS_CATALOG.find((p) => p.id === planTier) || PLANS_CATALOG[1];

  const priceReais =
    billingCycle === "yearly"
      ? selectedPlan.annualMonthlyPriceReais
      : selectedPlan.monthlyPriceReais;

  // Validate Step 1
  const handleProceedToStep2 = () => {
    setErrors({});
    const validationResult = checkoutFormSchema.safeParse({
      fullName,
      email,
      whatsapp,
      cpfCnpj,
      businessName,
      subdomain,
      planTier,
      billingCycle,
      paymentMethod,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        if (
          field === "fullName" ||
          field === "email" ||
          field === "whatsapp" ||
          field === "cpfCnpj" ||
          field === "businessName" ||
          field === "subdomain"
        ) {
          fieldErrors[field] = err.message;
        }
      });
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }
    }

    setCurrentStep(2);
  };

  // Quick Start Free Trial (14 days without payment method)
  const handleStartFreeTrialOnly = async () => {
    setErrors({});
    const validationResult = checkoutFormSchema.safeParse({
      fullName,
      email,
      whatsapp,
      cpfCnpj,
      businessName,
      subdomain,
      planTier,
      billingCycle,
      paymentMethod: "pix",
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          whatsapp,
          cpfCnpj,
          businessName,
          subdomain,
          planTier,
          billingCycle,
          paymentMethod: "pix",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrors({ general: data.error || "Não foi possível iniciar o teste grátis." });
        setIsSubmitting(false);
        return;
      }

      router.push(`/app?trial_started=true&subdomain=${encodeURIComponent(subdomain)}`);
    } catch (err: any) {
      setErrors({
        general: err?.message || "Erro de rede ao iniciar o teste gratuito.",
      });
      setIsSubmitting(false);
    }
  };

  // Final Submit for Payment Activation
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formDataToValidate: CheckoutFormData = {
      fullName,
      email,
      whatsapp,
      cpfCnpj,
      businessName,
      subdomain,
      planTier,
      billingCycle,
      paymentMethod,
    };

    const validationResult = checkoutFormSchema.safeParse(formDataToValidate);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

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
              action: "checkout",
              isLocalhost: isLocal,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.success) {
            if (!isLocal) {
              setErrors({ general: "Falha na verificação de segurança contra robôs." });
              setIsSubmitting(false);
              turnstileRef.current?.reset();
              setTurnstileToken("");
              return;
            }
          }
        } catch (verErr) {
          console.warn("[Turnstile checkout verify check]", verErr);
        }
      }

      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDataToValidate),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrors({ general: data.error || "Não foi possível concluir o checkout." });
        setIsSubmitting(false);
        return;
      }

      // Se for Pix, exibe QR Code real na tela e inicia polling
      if (data.paymentMethod === "pix" && data.pix) {
        setPixPayload({
          invoiceId: data.invoiceId,
          qrCode: data.pix.qrCode,
          qrCodeBase64: data.pix.qrCodeBase64,
          copiaECola: data.pix.copiaECola || data.pix.qrCode,
          ticketUrl: data.pix.ticketUrl,
        });
        setIsSubmitting(false);
        return;
      }

      // Cartão de Crédito via Stripe Payment Element
      if (data.paymentMethod === "credit_card") {
        if (
          typeof window !== "undefined" &&
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
          data.clientSecret &&
          !data.clientSecret.startsWith("pi_mock_") &&
          !data.clientSecret.startsWith("sim_secret_")
        ) {
          try {
            const { loadStripe } = await import("@stripe/stripe-js");
            const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
            if (stripe) {
              const { error: stripeError } = await stripe.handleNextAction({
                clientSecret: data.clientSecret,
              });
              if (stripeError) {
                setErrors({
                  general:
                    stripeError.message ||
                    "Falha na autenticação do cartão pelo banco emissor (3DS2). Verifique os dados com sua instituição financeira.",
                });
                setIsSubmitting(false);
                return;
              }
            }
          } catch (stripeInitErr: any) {
            console.warn("[Stripe 3DS2 handleNextAction exception]:", stripeInitErr);
          }
        } else {
          // Em homologação local / simulação segura sem chaves de produção, aguarda feedback visual
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        router.push(
          `/app?checkout_success=true&subdomain=${encodeURIComponent(subdomain)}&plan=${planTier}&payment_method=card`
        );
        return;
      }

      router.push(`/app?checkout_success=true&subdomain=${encodeURIComponent(subdomain)}`);
    } catch (err: any) {
      setErrors({
        general: err?.message || "Erro de rede ao conectar com o serviço de checkout.",
      });
      setIsSubmitting(false);
    }
  };

  // Polling automático para confirmação do Pix
  useEffect(() => {
    if (!pixPayload?.invoiceId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const checkRes = await fetch(
          `/api/billing/subscription-status?invoiceId=${encodeURIComponent(
            pixPayload.invoiceId!
          )}`
        );
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.paid && isMounted) {
            clearInterval(interval);
            router.push(
              `/app?checkout_success=true&subdomain=${encodeURIComponent(
                subdomain
              )}&paid=true`
            );
          }
        }
      } catch {
        // Ignora falha transitória de polling
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pixPayload, router, subdomain]);

  const copyPixCode = () => {
    if (!pixPayload?.copiaECola) return;
    navigator.clipboard.writeText(pixPayload.copiaECola);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] dark:bg-[#09090b] text-[#1C1C1E] dark:text-[#f4f4f5] selection:bg-[#1C1C1E] dark:selection:bg-[#27272a] selection:text-white transition-colors">
      {/* Checkout Sub-bar */}
      <div className="border-b border-[#E5E5EA] dark:border-[#27272a] bg-zinc-50/70 dark:bg-[#18181b]/70 py-3 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/precos"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white transition-colors min-h-[44px] py-2 px-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para planos</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono text-[#6E6E73] dark:text-[#a1a1aa]">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Ambiente Criptografado PCI-DSS SAQ-A</span>
            <span className="sm:hidden">Segurança PCI-DSS</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Step Indicator Header */}
        <div className="max-w-3xl mb-8 space-y-2">
          <div className="flex items-center gap-3">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                currentStep === 1
                  ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b]"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
            </span>
            <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
              Dados do seu Estúdio
            </span>
            <span className="text-zinc-300 dark:text-[#27272a]">/</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                currentStep === 2
                  ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b]"
                  : "bg-zinc-200 dark:bg-[#27272a] text-zinc-600 dark:text-[#a1a1aa]"
              }`}
            >
              2
            </span>
            <span
              className={`text-[13px] ${
                currentStep === 2
                  ? "text-[#1C1C1E] dark:text-white font-semibold"
                  : "text-[#6E6E73] dark:text-[#a1a1aa]"
              }`}
            >
              Plano &amp; Ativação
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1C1C1E] dark:text-white tracking-tight">
            {currentStep === 1
              ? "Crie sua conta e reserve seu subdomínio"
              : "Escolha seu plano e ative sua operação"}
          </h1>
          <p className="text-[13.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
            {currentStep === 1
              ? "14 dias de teste grátis com acesso total a todas as ferramentas. Sem cartão de crédito."
              : "Ativação instantânea com proteção antifraude e garantia total de cancelamento sem fidelidade."}
          </p>
        </div>

        {/* Global Error Alert */}
        {errors.general && (
          <div
            role="alert"
            aria-live="assertive"
            className="max-w-3xl mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 text-[13px] text-rose-700 dark:text-rose-400 flex items-start gap-2.5"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-500/20 shrink-0 mt-1.5" />
            <p className="leading-relaxed">{errors.general}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Form Steps */}
          <div className="lg:col-span-7 bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-xs">
            {currentStep === 1 ? (
              /* =========================================================================
                 STEP 1: DADOS DO ESTÚDIO
              ========================================================================= */
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome Completo */}
                  <div className="space-y-1 sm:col-span-2">
                    <label
                      htmlFor="checkout-name"
                      className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
                    >
                      Seu nome completo
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Camila Valente"
                      required
                      aria-invalid={Boolean(errors.fullName)}
                      aria-describedby={errors.fullName ? "checkout-name-error" : undefined}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#6E6E73] dark:placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
                    />
                    {errors.fullName && (
                      <p id="checkout-name-error" role="alert" className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* E-mail */}
                  <div className="space-y-1">
                    <label
                      htmlFor="checkout-email"
                      className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
                    >
                      E-mail profissional / pessoal
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="camila@estudio.com.br"
                      required
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "checkout-email-error" : undefined}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#6E6E73] dark:placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
                    />
                    {errors.email && (
                      <p id="checkout-email-error" role="alert" className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <label
                      htmlFor="checkout-whatsapp"
                      className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
                    >
                      WhatsApp com DDD
                    </label>
                    <input
                      id="checkout-whatsapp"
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="(11) 98765-4321"
                      required
                      aria-invalid={Boolean(errors.whatsapp)}
                      aria-describedby={errors.whatsapp ? "checkout-whatsapp-error" : undefined}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#6E6E73] dark:placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
                    />
                    {errors.whatsapp && (
                      <p id="checkout-whatsapp-error" role="alert" className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                        {errors.whatsapp}
                      </p>
                    )}
                  </div>

                  {/* CPF / CNPJ */}
                  <div className="space-y-1 sm:col-span-2">
                    <label
                      htmlFor="checkout-cpf-cnpj"
                      className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
                    >
                      CPF ou CNPJ (para faturamento e segurança)
                    </label>
                    <input
                      id="checkout-cpf-cnpj"
                      type="text"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                      placeholder="000.000.000-00 ou 00.000.000/0001-00"
                      required
                      aria-invalid={Boolean(errors.cpfCnpj)}
                      aria-describedby={errors.cpfCnpj ? "checkout-cpf-cnpj-error" : undefined}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#6E6E73] dark:placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
                    />
                    {errors.cpfCnpj && (
                      <p id="checkout-cpf-cnpj-error" role="alert" className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                        {errors.cpfCnpj}
                      </p>
                    )}
                  </div>

                  {/* Nome do Estúdio */}
                  <div className="space-y-1 sm:col-span-2">
                    <label
                      htmlFor="checkout-business"
                      className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
                    >
                      Nome do seu estúdio ou clínica
                    </label>
                    <input
                      id="checkout-business"
                      type="text"
                      value={businessName}
                      onChange={(e) => handleBusinessNameChange(e.target.value)}
                      placeholder="Espaço Unniko Beauty"
                      required
                      aria-invalid={Boolean(errors.businessName)}
                      aria-describedby={errors.businessName ? "checkout-business-error" : undefined}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#6E6E73] dark:placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
                    />
                    {errors.businessName && (
                      <p id="checkout-business-error" role="alert" className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                        {errors.businessName}
                      </p>
                    )}
                  </div>

                  {/* Subdomínio Personalizado */}
                  <div className="space-y-1 sm:col-span-2">
                    <label
                      htmlFor="checkout-subdomain"
                      className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
                    >
                      Subdomínio do seu site de agendamento online
                    </label>
                    <div className="flex items-center rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-[#F5F5F7] dark:bg-[#09090b] px-3.5 py-2.5 focus-within:border-[#1C1C1E] dark:focus-within:border-white focus-within:bg-white dark:focus-within:bg-[#09090b] transition">
                      <span className="text-[12px] font-mono text-[#6E6E73] dark:text-[#a1a1aa] pr-1">
                        https://
                      </span>
                      <input
                        id="checkout-subdomain"
                        type="text"
                        value={subdomain}
                        onChange={(e) => handleSubdomainChange(e.target.value)}
                        placeholder="espaco-unniko"
                        required
                        aria-invalid={Boolean(errors.subdomain)}
                        aria-describedby={errors.subdomain ? "checkout-subdomain-error" : "checkout-subdomain-hint"}
                        className="flex-1 bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#6E6E73] dark:placeholder:text-[#a1a1aa] focus:outline-none font-mono"
                      />
                      <span className="text-[12.5px] font-mono font-semibold text-[#1C1C1E] dark:text-white shrink-0 pl-1">
                        .luvea.app
                      </span>
                    </div>
                    {errors.subdomain && (
                      <p id="checkout-subdomain-error" role="alert" className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                        {errors.subdomain}
                      </p>
                    )}
                    <p id="checkout-subdomain-hint" className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
                      Endereço exclusivo para divulgação no link da bio e confirmação de horários.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#1C1C1E] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-[#09090b] text-[13.5px] font-semibold transition-all shadow-xs active:scale-[0.99]"
                  >
                    <span>Continuar para escolha do plano</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleStartFreeTrialOnly}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white text-[13px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#202023] transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Iniciar teste grátis (14 dias)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* =========================================================================
                 STEP 2: PLANO & PAGAMENTO (PCI-DSS SAQ-A & MERCADO PAGO PIX)
              ========================================================================= */
              <form onSubmit={handleFinalSubmit} className="space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1.5 text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white mb-2 transition min-h-[44px] py-2 px-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar para dados cadastrais</span>
                  </button>
                  <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white tracking-tight">
                    Plano e ativação
                  </h2>
                  <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                    14 dias de teste grátis com acesso total. Cancele quando quiser sem fidelidade.
                  </p>
                </div>

                {/* Billing Cycle Switcher */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F7] dark:bg-[#09090b] border border-[#E5E5EA] dark:border-[#27272a]">
                  <span id="billing-cycle-label" className="text-[13px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]">
                    Ciclo de faturamento
                  </span>
                  <div
                    role="group"
                    aria-labelledby="billing-cycle-label"
                    className="flex items-center gap-1 bg-white dark:bg-[#18181b] p-1 rounded-full border border-[#D4D4D8] dark:border-[#27272a] text-[12px]"
                  >
                    <button
                      type="button"
                      aria-pressed={billingCycle === "monthly"}
                      onClick={() => setBillingCycle("monthly")}
                      className={`min-h-[44px] px-4 py-2 rounded-full transition flex items-center justify-center ${
                        billingCycle === "monthly"
                          ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] font-semibold"
                          : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white"
                      }`}
                    >
                      Mensal
                    </button>
                    <button
                      type="button"
                      aria-pressed={billingCycle === "yearly"}
                      onClick={() => setBillingCycle("yearly")}
                      className={`min-h-[44px] px-4 py-2 rounded-full transition flex items-center justify-center gap-1.5 ${
                        billingCycle === "yearly"
                          ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] font-semibold"
                          : "text-[#6E6E73] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white"
                      }`}
                    >
                      <span>Anual</span>
                      <span
                        className={`text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full ${
                          billingCycle === "yearly"
                            ? "bg-emerald-400/20 text-emerald-300 dark:bg-emerald-100 dark:text-emerald-800"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        }`}
                      >
                        -15%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Plan Tier Selection Cards */}
                <div className="space-y-2.5">
                  <span id="plan-selection-label" className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]">
                    Selecione o plano desejado
                  </span>
                  <div
                    role="radiogroup"
                    aria-labelledby="plan-selection-label"
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {PLANS_CATALOG.map((plan) => {
                      const isSelected = planTier === plan.id;
                      const pPrice =
                        billingCycle === "yearly"
                          ? plan.annualMonthlyPriceReais
                          : plan.monthlyPriceReais;

                      return (
                        <button
                          key={plan.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() =>
                            setPlanTier(plan.id as "essencial" | "gold" | "platinum")
                          }
                          className={`p-4 rounded-xl text-left border transition relative flex flex-col justify-between ${
                            isSelected
                              ? "border-[#1C1C1E] dark:border-white bg-[#F5F5F7] dark:bg-[#09090b] ring-1 ring-[#1C1C1E] dark:ring-white"
                              : "border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:border-[#D4D4D8] dark:hover:border-[#3f3f46]"
                          }`}
                        >
                          {plan.badge && (
                            <span className="text-[10px] font-mono uppercase font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/40 px-2 py-0.5 rounded-full inline-block mb-1">
                              {plan.badge}
                            </span>
                          )}
                          <p className="text-[14px] font-bold text-[#1C1C1E] dark:text-white">
                            {plan.name}
                          </p>
                          <p className="text-[18px] font-semibold text-[#1C1C1E] dark:text-white mt-1 font-mono">
                            R$ {pPrice}
                            <span className="text-[11px] font-sans text-[#6E6E73] dark:text-[#a1a1aa] font-normal">
                              /mês
                            </span>
                          </p>
                          <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa] mt-1 leading-tight">
                            {plan.maxStaffLabel}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2.5 pt-2">
                  <span id="payment-method-label" className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]">
                    Forma de pagamento
                  </span>
                  <div
                    role="radiogroup"
                    aria-labelledby="payment-method-label"
                    className="grid grid-cols-2 gap-3"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === "credit_card"}
                      aria-pressed={paymentMethod === "credit_card"}
                      onClick={() => {
                        setPaymentMethod("credit_card");
                        setPixPayload(null);
                      }}
                      className={`min-h-[44px] p-3.5 rounded-xl border flex items-center justify-center gap-2 text-[13px] font-semibold transition ${
                        paymentMethod === "credit_card"
                          ? "border-[#1C1C1E] dark:border-white bg-[#F5F5F7] dark:bg-[#09090b] ring-1 ring-[#1C1C1E] dark:ring-white text-[#1C1C1E] dark:text-white"
                          : "border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#09090b] text-[#1C1C1E] dark:text-white"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Cartão de Crédito</span>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === "pix"}
                      aria-pressed={paymentMethod === "pix"}
                      onClick={() => setPaymentMethod("pix")}
                      className={`min-h-[44px] p-3.5 rounded-xl border flex items-center justify-center gap-2 text-[13px] font-semibold transition ${
                        paymentMethod === "pix"
                          ? "border-[#1C1C1E] dark:border-white bg-[#F5F5F7] dark:bg-[#09090b] ring-1 ring-[#1C1C1E] dark:ring-white text-[#1C1C1E] dark:text-white"
                          : "border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:bg-[#F5F5F7] dark:hover:bg-[#09090b] text-[#1C1C1E] dark:text-white"
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Pix Recorrente</span>
                    </button>
                  </div>
                </div>

                {/* Credit Card PCI-DSS SAQ-A Secure Container */}
                {paymentMethod === "credit_card" && (
                  <div className="p-5 rounded-2xl bg-[#F5F5F7] dark:bg-[#09090b] border border-[#E5E5EA] dark:border-[#27272a] space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#27272a]">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                          Checkout Criptografado Stripe
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#6E6E73] dark:text-[#a1a1aa]">
                        PCI-DSS SAQ-A
                      </span>
                    </div>

                    <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                      Seus dados de pagamento são criptografados de ponta a ponta e processados em ambiente isolado com autenticação biométrica/3DS2. Nenhum dado do seu cartão é armazenado nos servidores da LUVEA.
                    </p>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#F5F5F7] dark:bg-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="text-[12px]">
                        <p className="font-semibold text-[#1C1C1E] dark:text-white">
                          Stripe Payment Elements
                        </p>
                        <p className="text-[#6E6E73] dark:text-[#a1a1aa]">
                          Tokenização segura &bull; Débito e Crédito aceitos
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pix Modal / View */}
                {paymentMethod === "pix" && (
                  <div className="p-5 rounded-2xl bg-[#F5F5F7] dark:bg-[#09090b] border border-[#E5E5EA] dark:border-[#27272a] space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#27272a]">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[13px] font-semibold text-[#1C1C1E] dark:text-white">
                          Pix Instantâneo Mercado Pago
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        Baixa Automática
                      </span>
                    </div>

                    {pixPayload ? (
                      <div className="space-y-4 text-center">
                        <div className="inline-block p-3 rounded-2xl bg-white dark:bg-white border border-[#E5E5EA] shadow-xs">
                          {pixPayload.qrCodeBase64 ? (
                            <img
                              src={pixPayload.qrCodeBase64}
                              alt="QR Code Pix"
                              className="w-44 h-44 mx-auto object-contain"
                            />
                          ) : pixPayload.copiaECola || pixPayload.qrCode ? (
                            <QRCodeSVG
                              value={pixPayload.copiaECola || pixPayload.qrCode || ""}
                              size={176}
                              level="M"
                              className="mx-auto"
                              aria-label="QR Code Pix Dinâmico"
                            />
                          ) : (
                            <div className="w-44 h-44 flex items-center justify-center text-xs font-mono text-[#1C1C1E]">
                              QR Code Pix
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={copyPixCode}
                            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[12.5px] font-semibold shadow-xs active:scale-[0.98] transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{isCopied ? "Código Pix Copiado!" : "Copiar Código Pix Copia e Cola"}</span>
                          </button>

                          <div className="flex items-center justify-center gap-2 text-[12px] text-[#6E6E73] dark:text-[#a1a1aa] pt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse" />
                            <span>Aguardando confirmação do banco...</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[12.5px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed">
                        Ao clicar no botão abaixo, geraremos a cobrança com QR Code dinâmico e código Copia e Cola. O sistema ativará seu plano automaticamente assim que a transferência for concluída.
                      </p>
                    )}
                  </div>
                )}

                {/* Cloudflare Turnstile CAPTCHA */}
                <TurnstileWidget
                  ref={turnstileRef}
                  action="checkout"
                  onVerify={(tok) => setTurnstileToken(tok)}
                  onExpire={() => setTurnstileToken("")}
                />

                {/* Submit Action */}
                {!pixPayload && (
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#1C1C1E] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-[#09090b] text-[13.5px] font-semibold transition-all shadow-xs active:scale-[0.99] disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-white dark:text-[#09090b]" />
                          <span>
                            {paymentMethod === "credit_card"
                              ? "Processando e autenticando 3DS2..."
                              : "Gerando Pix Dinâmico..."}
                          </span>
                        </div>
                      ) : (
                        <>
                          <span>
                            {paymentMethod === "credit_card"
                              ? "Concluir assinatura com Cartão"
                              : "Gerar cobrança Pix e ativar"}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#1C1C1E] dark:bg-[#18181b] text-white rounded-2xl p-6 sm:p-7 space-y-5 border border-zinc-800 dark:border-[#27272a] shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 dark:border-[#27272a]">
                <div>
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-[#a1a1aa] uppercase tracking-wider">
                    Plano Selecionado
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    LUVEA {selectedPlan.name}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono text-white">
                    R$ {priceReais}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-[#a1a1aa] font-sans">
                    /mês ({billingCycle === "yearly" ? "anual" : "mensal"})
                  </p>
                </div>
              </div>

              {/* Subdomain Reservation Badge */}
              <div className="p-3.5 rounded-xl bg-zinc-900 dark:bg-[#09090b] border border-zinc-800 dark:border-[#27272a] flex items-center justify-between">
                <span className="text-[12px] text-zinc-400 dark:text-[#a1a1aa]">Subdomínio reservado:</span>
                <span className="text-[12.5px] font-mono font-semibold text-emerald-400">
                  {subdomain ? `${subdomain}.luvea.app` : "seu-estudio.luvea.app"}
                </span>
              </div>

              {/* Features Included */}
              <div className="space-y-2.5 pt-1">
                <p className="text-[12px] uppercase font-mono tracking-wider font-semibold text-zinc-400 dark:text-[#a1a1aa]">
                  Incluso na sua assinatura
                </p>
                <ul className="space-y-2 text-[12.5px] text-zinc-300 dark:text-[#d4d4d8]">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Site de Agendamento Online no link da bio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Recepção IA no WhatsApp 24 horas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Sinal Pix obrigatório anti-no-show</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Trava automática de salas e aparelhos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{selectedPlan.maxStaffLabel}</span>
                  </li>
                </ul>
              </div>

              {/* Today Cost: R$ 0.00 (14 days free trial) */}
              <div className="pt-4 border-t border-zinc-800 dark:border-[#27272a] flex items-center justify-between text-[14px]">
                <span className="text-zinc-300 dark:text-[#a1a1aa]">Total a pagar hoje:</span>
                <span className="font-bold text-white font-mono text-xl">
                  R$ 0,00
                </span>
              </div>
              <p className="text-[11.5px] text-zinc-400 dark:text-[#a1a1aa] leading-relaxed">
                Você terá 14 dias de acesso completo sem cobrança. Se contratar antecipadamente, os dias restantes são somados ao primeiro período pago.
              </p>
            </div>

            {/* Trust Badges */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] space-y-2 text-xs text-[#6E6E73] dark:text-[#a1a1aa] transition-colors">
              <div className="flex items-center gap-2 text-[#1C1C1E] dark:text-white font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Garantia de Satisfação &bull; CDC Art. 49</span>
              </div>
              <p>
                Sem fidelidade e sem burocracia. Cancele com 1 clique a qualquer momento diretamente pelas configurações do painel.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFC] dark:bg-[#09090b] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#1C1C1E] dark:border-white border-t-transparent animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
