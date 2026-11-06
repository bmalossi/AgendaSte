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
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { resolvePlanPriceCents } from "@/lib/billing/pricing";
import { readLocalStudioProfile } from "@/lib/billing/local-studio-profile";
import { validateSubdomainFormat } from "@/lib/subdomain";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const planParam = searchParams.get("plano") || searchParams.get("plan") || "gold";
  const cycleParam = searchParams.get("ciclo") || searchParams.get("cycle") || "monthly";
  const initialPlanTier: "essencial" | "gold" | "platinum" =
    planParam === "essencial" || planParam === "platinum" ? planParam : "gold";
  const initialBillingCycle: "monthly" | "yearly" = cycleParam === "yearly" ? "yearly" : "monthly";

  // Step state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // User session state
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    fullName?: string;
    subdomain?: string;
    businessName?: string;
  } | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [userEditedSubdomain, setUserEditedSubdomain] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<
    "idle" | "checking" | "available" | "unavailable" | "current"
  >("idle");
  const [subdomainFeedback, setSubdomainFeedback] = useState("");
  const subdomainDebounceRef = useRef<number | null>(null);

  // Estúdio já vinculado à conta (fonte: servidor). Quando presente, nome e subdomínio são somente leitura.
  const [accountOrg, setAccountOrg] = useState<{ slug: string; name: string } | null>(null);
  // Sessão presente no navegador, mas não reconhecida pelo servidor
  const [sessionInvalid, setSessionInvalid] = useState(false);
  const SESSION_INVALID_MESSAGE =
    "Não foi possível validar sua sessão. Entre novamente para continuar a assinatura.";

  // Plan & Payment Selection
  const [planTier, setPlanTier] = useState<"essencial" | "gold" | "platinum">(
    initialPlanTier
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    initialBillingCycle
  );
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix">("credit_card");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    description: string;
    discountPercent?: number;
    discountAmountOffCents?: number;
    discountCents: number;
    finalPriceCents: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Validation & Loading
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  // Verificação de disponibilidade imediata do subdomínio com debounce
  const checkAvailability = React.useCallback((candidate: string) => {
    if (subdomainDebounceRef.current) {
      window.clearTimeout(subdomainDebounceRef.current);
    }

    const trimmed = candidate.trim().toLowerCase();
    if (!trimmed) {
      setSubdomainStatus("idle");
      setSubdomainFeedback("");
      return;
    }

    const format = validateSubdomainFormat(trimmed);
    if (!format.valid) {
      setSubdomainStatus("unavailable");
      setSubdomainFeedback(format.message || "Subdomínio inválido");
      return;
    }

    setSubdomainStatus("checking");
    setSubdomainFeedback("Verificando disponibilidade...");

    subdomainDebounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/subdomain/check?slug=${encodeURIComponent(format.normalized)}`
        );
        if (!res.ok) {
          setSubdomainStatus("idle");
          setSubdomainFeedback("");
          return;
        }
        const data = await res.json();
        if (data.available) {
          if (data.isCurrent) {
            setSubdomainStatus("current");
            setSubdomainFeedback("Subdomínio atual do seu estúdio");
          } else {
            setSubdomainStatus("available");
            setSubdomainFeedback("Subdomínio disponível para reserva");
          }
          setErrors((prev) => {
            if (!prev.subdomain) return prev;
            const next = { ...prev };
            delete next.subdomain;
            return next;
          });
        } else {
          setSubdomainStatus("unavailable");
          setSubdomainFeedback(data.message || "Este subdomínio já está em uso.");
        }
      } catch {
        setSubdomainStatus("idle");
        setSubdomainFeedback("");
      }
    }, 280);
  }, []);

  // Limpa debounce ao desmontar
  useEffect(() => {
    return () => {
      if (subdomainDebounceRef.current) {
        window.clearTimeout(subdomainDebounceRef.current);
      }
    };
  }, []);

  // Carrega e hidrata dados da conta autenticada automaticamente.
  // Prioridade dos dados: organização no banco > metadados do usuário > cache local do painel.
  useEffect(() => {
    let isMounted = true;

    async function loadAuthSession() {
      try {
        let userId: string | null = null;
        let uEmail = "";
        let uName = "";
        let metaBusiness = "";
        let metaSubdomain = "";

        let orgSlug = "";
        let orgName = "";
        let phoneVal = "";
        let cpfVal = "";
        let serverConfirmedOrg = false;
        let hasClientSession = false;

        if (isSupabaseConfigured()) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            const user = session.user;
            hasClientSession = true;
            userId = user.id;
            uEmail = user.email || "";
            uName = user.user_metadata?.full_name || user.user_metadata?.name || "";
            metaBusiness = user.user_metadata?.business_name || "";
            metaSubdomain = user.user_metadata?.subdomain || "";

            // O servidor é a fonte da verdade da identidade. Se ele não reconhecer a sessão
            // (ou falhar), o checkout nunca segue com dados de cache local: evita cobrar a conta errada.
            let serverOk = false;
            try {
              const subRes = await fetch("/api/billing/subscription", { cache: "no-store" });
              if (subRes.ok) {
                serverOk = true;
                const subData = await subRes.json();
                const org = subData.organization;
                if (org) {
                  serverConfirmedOrg = true;
                  orgSlug = org.slug || "";
                  orgName = org.name || "";
                  phoneVal = org.whatsapp_number || org.phone || "";
                  cpfVal = org.cpf_cnpj || "";
                }
                if (!uName && subData.user?.fullName) uName = subData.user.fullName;
              } else if (subRes.status === 404) {
                // Conta autenticada ainda sem estúdio: segue o fluxo de criação com metadados do usuário
                serverOk = true;
              }
            } catch (fetchErr) {
              console.warn("[Checkout load subscription info error]:", fetchErr);
            }

            if (!serverOk) {
              if (isMounted) {
                setSessionInvalid(true);
                setCurrentUser({ id: userId, email: uEmail, fullName: uName || undefined });
              }
              return;
            }
          }
        }

        // Fallback de cache local apenas em modo demonstração (sem Supabase / sem sessão real)
        const local = hasClientSession ? null : readLocalStudioProfile(userId);

        if (!userId && !local) return;
        if (!isMounted) return;

        const resolvedEmail = uEmail || local?.email || "";
        const resolvedName = uName || local?.fullName || "Profissional";
        const resolvedBusiness = serverConfirmedOrg
          ? orgName
          : orgName || metaBusiness || local?.businessName || "";
        const resolvedSubdomain = serverConfirmedOrg
          ? orgSlug
          : orgSlug || metaSubdomain || local?.subdomain || "";
        const resolvedPhone = phoneVal || local?.phone || "";
        const resolvedCpf = cpfVal || local?.cpfCnpj || "";

        setCurrentUser({
          id: userId || "local",
          email: resolvedEmail,
          fullName: resolvedName,
          subdomain: resolvedSubdomain,
          businessName: resolvedBusiness,
        });

        setFullName((prev) => prev || resolvedName);
        setEmail((prev) => prev || resolvedEmail);
        if (resolvedPhone) setWhatsapp((prev) => prev || resolvedPhone);
        if (resolvedCpf) setCpfCnpj((prev) => prev || resolvedCpf);
        if (serverConfirmedOrg && orgSlug) {
          setAccountOrg({ slug: orgSlug, name: orgName });
          setBusinessName(orgName);
          setSubdomain(orgSlug);
          setUserEditedSubdomain(true);
          setSubdomainStatus("current");
          setSubdomainFeedback("Subdomínio atual do seu estúdio");
        } else {
          if (resolvedBusiness) setBusinessName((prev) => prev || resolvedBusiness);
          if (resolvedSubdomain) {
            setSubdomain((prev) => prev || resolvedSubdomain);
            setUserEditedSubdomain(true);
            checkAvailability(resolvedSubdomain);
          }
        }

        // Se os dados cadastrais já estão completos, avança direto para o Passo 2 (plano e pagamento)
        const completeness = checkoutFormSchema.safeParse({
          fullName: resolvedName,
          email: resolvedEmail,
          whatsapp: resolvedPhone,
          cpfCnpj: resolvedCpf,
          businessName: resolvedBusiness,
          subdomain: resolvedSubdomain,
          planTier: initialPlanTier,
          billingCycle: initialBillingCycle,
          paymentMethod: "credit_card",
        });
        if (completeness.success) {
          setCurrentStep(2);
        }
      } catch (authErr) {
        console.warn("[Checkout loadAuthSession]:", authErr);
      }
    }

    loadAuthSession();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revalida cupom automaticamente caso o usuário troque o plano ou ciclo
  useEffect(() => {
    if (!appliedCoupon?.code) return;
    let isMounted = true;
    fetch("/api/billing/validate-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        couponCode: appliedCoupon.code,
        planTier,
        billingCycle,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid && isMounted) {
          setAppliedCoupon(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [planTier, billingCycle]);

  // Pix Payload & Polling
  const [pixPayload, setPixPayload] = useState<{
    invoiceId?: string;
    amountCents?: number;
    qrCode?: string;
    qrCodeBase64?: string;
    copiaECola?: string;
    ticketUrl?: string;
  } | null>(null);

  // Sync business name to subdomain slug
  const handleBusinessNameChange = (val: string) => {
    setBusinessName(val);
    if (!userEditedSubdomain) {
      const generated = normalizeSubdomain(val);
      setSubdomain(generated);
      checkAvailability(generated);
    }
  };

  const handleSubdomainChange = (val: string) => {
    setUserEditedSubdomain(true);
    // Permite digitação contínua mantendo apenas caracteres válidos
    const sanitized = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSubdomain(sanitized);
    checkAvailability(sanitized);
  };

  // Selected Plan Object
  const selectedPlan =
    PLANS_CATALOG.find((p) => p.id === planTier) || PLANS_CATALOG[1];

  const priceReais =
    billingCycle === "yearly"
      ? selectedPlan.annualMonthlyPriceReais
      : selectedPlan.monthlyPriceReais;

  const fullCyclePriceCents = resolvePlanPriceCents(planTier, billingCycle);
  const fullCyclePriceReais = fullCyclePriceCents / 100;
  const effectivePriceCents = appliedCoupon
    ? appliedCoupon.finalPriceCents
    : fullCyclePriceCents;
  const effectivePriceReais = effectivePriceCents / 100;
  const effectiveMonthlyEquivalentReais =
    billingCycle === "yearly" ? effectivePriceReais / 12 : effectivePriceReais;

  const formatBRL = (val: number) =>
    val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const trialEndDateFormatted = new Date(
    Date.now() + 14 * 86400000
  ).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Validate Step 1
  const handleProceedToStep2 = () => {
    setErrors({});
    if (sessionInvalid) {
      setErrors({ general: SESSION_INVALID_MESSAGE });
      return;
    }
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

    if (subdomainStatus === "checking") {
      setErrors({ subdomain: "Aguarde a verificação de disponibilidade do subdomínio..." });
      return;
    }
    if (subdomainStatus === "unavailable") {
      setErrors({ subdomain: subdomainFeedback || "Subdomínio indisponível para reserva." });
      return;
    }

    setCurrentStep(2);
  };

  // Quick Start Free Trial (14 days without payment method)
  const handleStartFreeTrialOnly = async () => {
    setErrors({});
    if (sessionInvalid) {
      setErrors({ general: SESSION_INVALID_MESSAGE });
      return;
    }
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

  // Aplicação e remoção de cupom de desconto
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/billing/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          planTier,
          billingCycle,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.error || "Cupom inválido ou expirado.");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data);
        setCouponError("");
      }
    } catch {
      setCouponError("Erro ao validar cupom.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // Final Submit for Payment Activation
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (sessionInvalid) {
      setErrors({ general: SESSION_INVALID_MESSAGE });
      return;
    }

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
      couponCode: appliedCoupon?.code || undefined,
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
          amountCents: data.amountCents,
          qrCode: data.pix.qrCode,
          qrCodeBase64: data.pix.qrCodeBase64,
          copiaECola: data.pix.copiaECola || data.pix.qrCode,
          ticketUrl: data.pix.ticketUrl,
        });
        setIsSubmitting(false);
        return;
      }

      // Cartão de Crédito via Stripe Checkout Session Oficial (Opção A)
      if (data.paymentMethod === "credit_card") {
        if (data.checkoutUrl) {
          // Redireciona imediatamente para o ambiente oficial seguro e criptografado da Stripe
          window.location.href = data.checkoutUrl;
          return;
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
            href={currentUser ? "/app?view=settings&tab=subscription" : "/precos"}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white transition-colors min-h-[44px] py-2 px-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{currentUser ? "Voltar ao painel" : "Voltar para planos"}</span>
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
        {/* Banner de Conta Conectada e Identificação de Estúdio */}
        {currentUser && (
          <div className="max-w-3xl mb-6 px-4 py-3 rounded-2xl bg-[#F5F5F7] dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[13px] transition-colors shadow-2xs">
            <div className="flex items-center gap-2.5 text-[#1C1C1E] dark:text-[#f4f4f5]">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  sessionInvalid
                    ? "bg-zinc-400 ring-2 ring-zinc-400/20"
                    : "bg-emerald-500 ring-2 ring-emerald-500/20"
                }`}
              />
              {sessionInvalid ? (
                <span className="break-words" role="alert">
                  Sessão não reconhecida
                  <span className="text-[#6E6E73] dark:text-[#a1a1aa] block sm:inline sm:ml-1 mt-0.5 sm:mt-0">
                    &bull; Entre novamente para assinar na sua conta
                  </span>
                </span>
              ) : (
              <span className="break-words">
                Conectado como <strong className="font-semibold">{currentUser.email}</strong>
                {subdomain && (
                  <span className="text-[#6E6E73] dark:text-[#a1a1aa] block sm:inline sm:ml-1 mt-0.5 sm:mt-0">
                    &bull; Subdomínio: <span className="font-mono font-medium text-[#1C1C1E] dark:text-white">{subdomain}.luvea.app</span>
                  </span>
                )}
              </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[12.5px] pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E5EA] dark:border-[#27272a] w-full sm:w-auto justify-end">
              {sessionInvalid && (
                <Link
                  href={`/login?redirect=${encodeURIComponent(
                    `/checkout?plan=${initialPlanTier}&cycle=${initialBillingCycle}&source=app`
                  )}`}
                  className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-full border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#202023] text-[12.5px] font-medium transition-colors"
                >
                  Entrar novamente
                </Link>
              )}
              {currentStep === 2 && !sessionInvalid && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white transition-colors underline-offset-4 hover:underline px-3 py-2 cursor-pointer active:scale-[0.98]"
                >
                  Alterar dados
                </button>
              )}
              <Link
                href="/login?switchAccount=true"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[#6E6E73] dark:text-[#a1a1aa] hover:text-[#1C1C1E] dark:hover:text-white transition-colors underline-offset-4 hover:underline px-3 py-2 active:scale-[0.98]"
              >
                Trocar de conta
              </Link>
            </div>
          </div>
        )}

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
              ? currentUser
                ? "Confirme seus dados de faturamento"
                : "Crie sua conta e reserve seu subdomínio"
              : "Escolha seu plano e ative sua operação"}
          </h1>
          <p className="text-[13.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
            {currentStep === 1
              ? currentUser
                ? "Seu estúdio já está criado. Complete os dados abaixo para ativar a assinatura."
                : "14 dias de teste grátis com acesso total a todas as ferramentas. Sem cartão de crédito."
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#6E6E73] dark:placeholder:text-[#a1a1aa] placeholder:opacity-100 focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#6E6E73] dark:placeholder:text-[#a1a1aa] placeholder:opacity-100 focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#6E6E73] dark:placeholder:text-[#a1a1aa] placeholder:opacity-100 focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#6E6E73] dark:placeholder:text-[#a1a1aa] placeholder:opacity-100 focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition"
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
                      readOnly={Boolean(accountOrg)}
                      aria-readonly={Boolean(accountOrg)}
                      aria-invalid={Boolean(errors.businessName)}
                      aria-describedby={errors.businessName ? "checkout-business-error" : undefined}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#09090b] text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#6E6E73] dark:placeholder:text-[#a1a1aa] placeholder:opacity-100 focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition read-only:bg-[#F5F5F7] dark:read-only:bg-[#18181b] read-only:cursor-default"
                    />
                    {errors.businessName && (
                      <p id="checkout-business-error" role="alert" className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                        {errors.businessName}
                      </p>
                    )}
                  </div>

                  {/* Subdomínio Personalizado (Alterável com checagem imediata) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="checkout-subdomain"
                        className="block text-[12.5px] font-medium text-[#1C1C1E] dark:text-[#f4f4f5]"
                      >
                        Subdomínio do seu site de agendamento online
                      </label>

                      {/* Micro-indicador de disponibilidade (Anti-AI Slop & Editorial Clean) */}
                      {subdomainStatus === "checking" && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] text-[#6E6E73] dark:text-[#a1a1aa]">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                          <span>Verificando...</span>
                        </div>
                      )}
                      {subdomainStatus === "available" && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] text-[#1C1C1E] dark:text-zinc-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                          <span>Disponível</span>
                        </div>
                      )}
                      {subdomainStatus === "current" && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] text-[#1C1C1E] dark:text-zinc-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                          <span>Subdomínio atual</span>
                        </div>
                      )}
                      {subdomainStatus === "unavailable" && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 text-rose-700 dark:text-rose-400">
                          <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
                          <span>Indisponível</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center rounded-xl border border-[#D4D4D8] dark:border-[#27272a] bg-[#F5F5F7] dark:bg-[#09090b] px-3.5 py-2.5 focus-within:border-[#1C1C1E] dark:focus-within:border-white focus-within:bg-white dark:focus-within:bg-[#09090b] transition">
                      <span className="text-[12px] font-mono text-[#6E6E73] dark:text-[#a1a1aa] pr-1 select-none">
                        https://
                      </span>
                      <input
                        id="checkout-subdomain"
                        type="text"
                        value={subdomain}
                        onChange={(e) => handleSubdomainChange(e.target.value)}
                        placeholder="espaco-unniko"
                        required
                        readOnly={Boolean(accountOrg)}
                        aria-readonly={Boolean(accountOrg)}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        aria-invalid={Boolean(errors.subdomain || subdomainStatus === "unavailable")}
                        aria-describedby={
                          errors.subdomain || (subdomainStatus === "unavailable" && subdomainFeedback)
                            ? "checkout-subdomain-error"
                            : "checkout-subdomain-hint"
                        }
                        className="flex-1 bg-transparent text-[13.5px] text-[#1C1C1E] dark:text-white placeholder:text-[#6E6E73] dark:placeholder:text-[#a1a1aa] placeholder:opacity-100 focus:outline-none font-mono"
                      />
                      <span className="text-[12.5px] font-mono font-semibold text-[#1C1C1E] dark:text-white shrink-0 pl-1 select-none">
                        .luvea.app
                      </span>
                    </div>

                    {errors.subdomain ? (
                      <p id="checkout-subdomain-error" role="alert" className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                        {errors.subdomain}
                      </p>
                    ) : subdomainStatus === "unavailable" && subdomainFeedback ? (
                      <p id="checkout-subdomain-error" role="alert" className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                        {subdomainFeedback}
                      </p>
                    ) : (
                      <p id="checkout-subdomain-hint" className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa]">
                        {accountOrg
                          ? "Endereço do seu estúdio. Para alterá-lo, use Configurações > Negócio."
                          : subdomainStatus === "available" || subdomainStatus === "current"
                          ? (subdomainFeedback || "Endereço exclusivo para divulgação no link da bio e confirmação de horários.")
                          : "Endereço exclusivo para divulgação no link da bio e confirmação de horários."}
                      </p>
                    )}
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
                    className={`${currentUser ? "hidden" : "inline-flex"} items-center justify-center gap-2 px-5 py-3.5 rounded-full border border-[#D4D4D8] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#1C1C1E] dark:text-white text-[13px] font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#202023] transition-all`}
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

                    <div className="p-4 rounded-xl bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#F5F5F7] dark:bg-[#27272a] flex items-center justify-center text-[#1C1C1E] dark:text-white shrink-0">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div className="text-[12px]">
                          <p className="font-semibold text-[#1C1C1E] dark:text-white">
                            Ambiente Seguro Stripe Checkout
                          </p>
                          <p className="text-[#6E6E73] dark:text-[#a1a1aa]">
                            Crédito e Débito &bull; Apple Pay &bull; Google Pay &bull; 3DS2
                          </p>
                        </div>
                      </div>
                      <p className="text-[11.5px] text-[#6E6E73] dark:text-[#a1a1aa] leading-relaxed pt-1">
                        Ao clicar no botão abaixo, você será redirecionado para a página oficial da Stripe para inserir os dados do seu cartão. O teste de 14 dias é ativado imediatamente com <strong className="text-[#1C1C1E] dark:text-white">cobrança de R$ 0,00 hoje</strong>.
                      </p>
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

                    {/* Pre-generation explicit price card */}
                    {!pixPayload && (
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6E73] dark:text-[#a1a1aa] block">
                            Valor da cobrança Pix
                          </span>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-[18px] font-bold font-mono text-[#1C1C1E] dark:text-white">
                              R$ {formatBRL(effectivePriceReais)}
                            </span>
                            <span className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa] font-sans">
                              ({billingCycle === "yearly" ? "ciclo anual de 12 meses" : "ciclo mensal"})
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            +14 dias de bônus
                          </span>
                        </div>
                      </div>
                    )}

                    {pixPayload ? (
                      <div className="space-y-4 text-center">
                        {/* Prominent Price Chip above QR Code */}
                        <div className="p-3 rounded-xl bg-white dark:bg-[#18181b] border border-[#E5E5EA] dark:border-[#27272a] max-w-xs mx-auto">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6E73] dark:text-[#a1a1aa] block">
                            Valor exato a transferir
                          </span>
                          <span className="text-2xl font-bold font-mono text-[#1C1C1E] dark:text-white">
                            R$ {formatBRL((pixPayload.amountCents ?? effectivePriceCents) / 100)}
                          </span>
                          <p className="text-[11px] text-[#6E6E73] dark:text-[#a1a1aa] mt-0.5">
                            Plano {selectedPlan.name} &bull; {billingCycle === "yearly" ? "Ciclo Anual (12 meses)" : "Ciclo Mensal"}
                          </p>
                        </div>

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
                            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#09090b] text-[12.5px] font-semibold shadow-xs active:scale-[0.98] transition cursor-pointer"
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
                        Ao gerar a cobrança, o QR Code no valor de <strong className="font-semibold text-[#1C1C1E] dark:text-white font-mono">R$ {formatBRL(effectivePriceReais)}</strong> será exibido com chave Copia e Cola para quitação imediata. O estúdio é ativado na confirmação bancária e os 14 dias de teste são creditados como dias adicionais de bônus.
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
                              ? "Redirecionando para a Stripe..."
                              : "Gerando Pix Dinâmico..."}
                          </span>
                        </div>
                      ) : (
                        <>
                          <span>
                            {paymentMethod === "credit_card"
                              ? "Concluir assinatura com Cartão"
                              : `Gerar QR Code Pix de R$ ${formatBRL(effectivePriceReais)} e ativar`}
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
                    R$ {billingCycle === "yearly" ? formatBRL(fullCyclePriceReais) : formatBRL(priceReais)}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-[#a1a1aa] font-sans">
                    {billingCycle === "yearly"
                      ? `/ano (equiv. R$ ${formatBRL(selectedPlan.annualMonthlyPriceReais)}/mês)`
                      : "/mês"}
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

              {/* Cupom de Desconto */}
              <div className="pt-3 border-t border-zinc-800 dark:border-[#27272a] space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <label
                    htmlFor="checkout-coupon"
                    className="font-mono uppercase tracking-wider text-zinc-400 dark:text-[#a1a1aa] cursor-pointer"
                  >
                    Cupom de desconto
                  </label>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[12px] text-zinc-400 hover:text-white underline transition-colors cursor-pointer py-1 px-3 active:scale-[0.98]"
                    >
                      Remover
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div
                    role="status"
                    aria-label="Cupom de desconto aplicado"
                    className="min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[12.5px] text-emerald-400"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="font-mono font-semibold">{appliedCoupon.code}</span>
                      <span className="text-[11.5px] text-emerald-300">
                        {appliedCoupon.discountPercent
                          ? `(-${appliedCoupon.discountPercent}%)`
                          : `(-R$ ${formatBRL(appliedCoupon.discountCents / 100)})`}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                      - R$ {formatBRL(appliedCoupon.discountCents / 100)}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      id="checkout-coupon"
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      placeholder="CÓDIGO DO CUPOM"
                      aria-invalid={Boolean(couponError)}
                      aria-describedby={couponError ? "checkout-coupon-error" : undefined}
                      className="min-h-[44px] flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 dark:bg-[#09090b] border border-zinc-800 dark:border-[#27272a] text-[16px] sm:text-[12.5px] uppercase font-mono tracking-wider text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-400 placeholder:opacity-100 focus:outline-none focus:ring-1 focus:ring-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="min-h-[44px] min-w-[84px] px-4 sm:px-5 py-2.5 rounded-xl bg-white dark:bg-[#f4f4f5] text-[#1C1C1E] dark:text-[#09090b] text-[12.5px] font-semibold hover:bg-zinc-200 disabled:opacity-40 transition-all cursor-pointer inline-flex items-center justify-center active:scale-[0.98]"
                    >
                      {couponLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Aplicar"
                      )}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p
                    id="checkout-coupon-error"
                    role="alert"
                    aria-live="polite"
                    className="text-[11.5px] text-rose-400 font-medium leading-tight"
                  >
                    {couponError}
                  </p>
                )}
              </div>

              {/* Total & Resumo de Valores */}
              <div className="pt-3 border-t border-zinc-800 dark:border-[#27272a] space-y-2">
                {/* Linha base do ciclo */}
                <div className="flex justify-between text-[12px] text-zinc-400">
                  <span>
                    {billingCycle === "yearly"
                      ? "Valor do ciclo anual (12 meses):"
                      : "Valor do ciclo mensal:"}
                  </span>
                  <span
                    className={`font-mono ${
                      appliedCoupon ? "line-through text-zinc-500" : "text-zinc-200"
                    }`}
                  >
                    R$ {formatBRL(fullCyclePriceReais)}
                  </span>
                </div>

                {/* Detalhamento de desconto de cupom quando aplicado */}
                {appliedCoupon && (
                  <>
                    <div className="flex justify-between text-[12px] text-emerald-400">
                      <span>Desconto ({appliedCoupon.code}):</span>
                      <span className="font-mono">
                        - R$ {formatBRL(appliedCoupon.discountCents / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[12.5px] text-zinc-200 font-medium">
                      <span>
                        {paymentMethod === "credit_card"
                          ? "Subtotal após 14 dias de teste:"
                          : "Subtotal com desconto:"}
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        R$ {formatBRL(effectivePriceReais)}/{billingCycle === "yearly" ? "ano" : "mês"}
                      </span>
                    </div>
                    {billingCycle === "yearly" && (
                      <div className="flex justify-end text-[11px] text-zinc-400">
                        <span>(equiv. R$ {formatBRL(effectiveMonthlyEquivalentReais)}/mês)</span>
                      </div>
                    )}
                  </>
                )}

                {/* Se não houver cupom e for ciclo anual, destaca a equivalência mensal */}
                {!appliedCoupon && billingCycle === "yearly" && (
                  <div className="flex justify-between text-[11.5px] text-zinc-400">
                    <span>Mensalidade equivalente:</span>
                    <span className="font-mono text-zinc-300">
                      R$ {formatBRL(selectedPlan.annualMonthlyPriceReais)}/mês (15% off incluso)
                    </span>
                  </div>
                )}

                {/* Linha de Total / Cobrança Hoje */}
                <div className="flex items-center justify-between text-[14px] pt-1.5 border-t border-zinc-800/80 dark:border-[#27272a]">
                  <span className="text-zinc-300 dark:text-[#a1a1aa] font-medium">
                    {paymentMethod === "credit_card"
                      ? "Total a pagar hoje no cartão:"
                      : "Cobrança gerada hoje (Pix):"}
                  </span>
                  <span className="font-bold text-white font-mono text-xl">
                    {paymentMethod === "credit_card"
                      ? "R$ 0,00"
                      : `R$ ${formatBRL(effectivePriceReais)}`}
                  </span>
                </div>
              </div>

              {/* Explicação contextual clara e transparente */}
              <div className="p-3 rounded-xl bg-zinc-900/80 dark:bg-[#09090b] border border-zinc-800 dark:border-[#27272a] text-[11.5px] text-zinc-300 dark:text-[#a1a1aa] leading-relaxed">
                {paymentMethod === "credit_card" ? (
                  <span>
                    Cobrança de <strong className="text-white font-mono font-semibold">R$ 0,00</strong> hoje. O valor de{" "}
                    <strong className="text-white font-mono font-semibold">R$ {formatBRL(effectivePriceReais)}</strong> ({billingCycle === "yearly" ? "anual" : "mensal"}) será faturado no cartão somente em{" "}
                    <strong className="text-white font-semibold">{trialEndDateFormatted}</strong> caso mantenha o plano ativo. Cancele quando quiser sem fidelidade.
                  </span>
                ) : (
                  <span>
                    No Pix, o QR Code de <strong className="text-white font-mono font-semibold">R$ {formatBRL(effectivePriceReais)}</strong> é gerado para quitação imediata do ciclo {billingCycle === "yearly" ? "anual" : "mensal"}. Seus 14 dias de teste grátis são creditados como{" "}
                    <strong className="text-emerald-400 font-semibold">+14 dias bônus</strong> adicionados ao fim do seu período.
                  </span>
                )}
              </div>
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
