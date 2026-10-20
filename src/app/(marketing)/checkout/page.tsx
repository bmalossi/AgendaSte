"use client";

import React, { useState, useEffect, Suspense } from "react";
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
} from "lucide-react";
import { LuveaWordmark } from "@/components/luvea-logo";
import {
  checkoutFormSchema,
  normalizeSubdomain,
  type CheckoutFormData,
} from "@/lib/auth-schemas";
import { PLANS_CATALOG } from "@/lib/marketing-content";

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

  // Card Fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Validation & Loading
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pixPayload, setPixPayload] = useState<{
    qrCodeBase64?: string;
    copiaECola?: string;
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

  // Format Card Expiration Date (MM/AA)
  const handleExpChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) {
      setCardExp(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCardExp(cleaned);
    }
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
      paymentMethod: "pix", // ignora validação de cartão no passo 1
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

  // Final Submit
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formDataToValidate = {
      fullName,
      email,
      whatsapp,
      cpfCnpj,
      businessName,
      subdomain,
      planTier,
      billingCycle,
      paymentMethod,
      cardNumber: paymentMethod === "credit_card" ? cardNumber : undefined,
      cardName: paymentMethod === "credit_card" ? cardName : undefined,
      cardExp: paymentMethod === "credit_card" ? cardExp : undefined,
      cardCvc: paymentMethod === "credit_card" ? cardCvc : undefined,
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

      // Se o gateway retornou redirecionamento para Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Se o método foi Pix, exibe QR Code
      if (data.paymentMethod === "pix" && data.pix) {
        setPixPayload(data.pix);
        setIsSubmitting(false);
        return;
      }

      // Checkout concluído com provisionamento automático
      router.push(`/app?checkout_success=true&subdomain=${encodeURIComponent(subdomain)}`);
    } catch (err: any) {
      setErrors({
        general: err?.message || "Erro de rede ao conectar com o serviço de checkout.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#1C1C1E] selection:bg-[#1C1C1E] selection:text-white">
      {/* Top Simple Header */}
      <header className="border-b border-[#E5E5EA] bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center group py-1" aria-label="LUVEA - Início">
            <LuveaWordmark className="text-[20px] group-hover:opacity-80 transition-opacity" />
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono text-[#6E6E73]">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Ambiente Seguro &amp; Criptografado</span>
            <span className="sm:hidden">Seguro</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Step Indicator Header */}
        <div className="max-w-3xl mb-8 space-y-2">
          <div className="flex items-center gap-3">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                currentStep === 1
                  ? "bg-[#1C1C1E] text-white"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
            </span>
            <span className="text-[13px] font-semibold text-[#1C1C1E]">
              Dados do seu Estúdio
            </span>
            <span className="text-zinc-300">/</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                currentStep === 2
                  ? "bg-[#1C1C1E] text-white"
                  : "bg-zinc-200 text-zinc-600"
              }`}
            >
              2
            </span>
            <span
              className={`text-[13px] font-medium ${
                currentStep === 2 ? "text-[#1C1C1E] font-semibold" : "text-[#8E8E93]"
              }`}
            >
              Plano &amp; Pagamento
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Form Steps */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E5EA] p-6 sm:p-9 shadow-xs space-y-6">
            {errors.general && (
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-[12.5px] text-[#1C1C1E] flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Pix Qr Code Screen (when generated) */}
            {pixPayload ? (
              <div className="space-y-6 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] mx-auto flex items-center justify-center">
                  <QrCode className="w-6 h-6 stroke-[1.75]" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[#1C1C1E]">
                    Pague o sinal do plano com Pix
                  </h2>
                  <p className="text-[13px] text-[#6E6E73] max-w-md mx-auto">
                    Escaneie o QR Code abaixo no app do seu banco ou copie a chave Pix para ativar sua conta instantaneamente.
                  </p>
                </div>

                {pixPayload.qrCodeBase64 && (
                  <div className="p-4 bg-white rounded-2xl border border-[#E5E5EA] inline-block shadow-xs">
                    <img
                      src={
                        pixPayload.qrCodeBase64.startsWith("data:")
                          ? pixPayload.qrCodeBase64
                          : `data:image/png;base64,${pixPayload.qrCodeBase64}`
                      }
                      alt="QR Code Pix"
                      className="w-56 h-56 object-contain mx-auto"
                    />
                  </div>
                )}

                {pixPayload.copiaECola && (
                  <div className="max-w-md mx-auto space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(pixPayload.copiaECola || "");
                        alert("Código Pix Copia e Cola copiado!");
                      }}
                      className="w-full px-5 py-3 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[13px] font-semibold transition"
                    >
                      Copiar Código Pix
                    </button>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href={`/app?subdomain=${encodeURIComponent(subdomain)}`}
                    className="text-[13px] font-semibold text-[#1C1C1E] hover:underline"
                  >
                    Já efetuei o pagamento, ir para o estúdio →
                  </Link>
                </div>
              </div>
            ) : currentStep === 1 ? (
              /* =========================================================================
                 STEP 1: DADOS CADASTRAIS & SUBDOMÍNIO
              ========================================================================= */
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-[#1C1C1E] tracking-tight">
                    Informações do titular e do estúdio
                  </h2>
                  <p className="text-[12.5px] text-[#6E6E73] mt-0.5">
                    Seus dados serão vinculados à sua organização multi-tenant na LUVEA.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome Completo */}
                  <div className="space-y-1 sm:col-span-2">
                    <label
                      htmlFor="checkout-name"
                      className="block text-[12.5px] font-medium text-[#1C1C1E]"
                    >
                      Nome completo
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Camila Valente"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] text-[13.5px] focus:outline-none focus:border-[#1C1C1E] transition"
                    />
                    {errors.fullName && (
                      <p className="text-[11px] text-amber-600">{errors.fullName}</p>
                    )}
                  </div>

                  {/* E-mail */}
                  <div className="space-y-1">
                    <label
                      htmlFor="checkout-email"
                      className="block text-[12.5px] font-medium text-[#1C1C1E]"
                    >
                      E-mail corporativo / pessoal
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="camila@estudio.com.br"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] text-[13.5px] focus:outline-none focus:border-[#1C1C1E] transition"
                    />
                    {errors.email && (
                      <p className="text-[11px] text-amber-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Telefone / WhatsApp */}
                  <div className="space-y-1">
                    <label
                      htmlFor="checkout-whatsapp"
                      className="block text-[12.5px] font-medium text-[#1C1C1E]"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] text-[13.5px] focus:outline-none focus:border-[#1C1C1E] transition"
                    />
                    {errors.whatsapp && (
                      <p className="text-[11px] text-amber-600">{errors.whatsapp}</p>
                    )}
                  </div>

                  {/* CPF / CNPJ */}
                  <div className="space-y-1 sm:col-span-2">
                    <label
                      htmlFor="checkout-cpf-cnpj"
                      className="block text-[12.5px] font-medium text-[#1C1C1E]"
                    >
                      CPF ou CNPJ (para emissão e faturamento)
                    </label>
                    <input
                      id="checkout-cpf-cnpj"
                      type="text"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                      placeholder="000.000.000-00 ou 00.000.000/0001-00"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] text-[13.5px] focus:outline-none focus:border-[#1C1C1E] transition"
                    />
                    {errors.cpfCnpj && (
                      <p className="text-[11px] text-amber-600">{errors.cpfCnpj}</p>
                    )}
                  </div>

                  {/* Nome do Estúdio */}
                  <div className="space-y-1 sm:col-span-2">
                    <label
                      htmlFor="checkout-business"
                      className="block text-[12.5px] font-medium text-[#1C1C1E]"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4D8] text-[13.5px] focus:outline-none focus:border-[#1C1C1E] transition"
                    />
                    {errors.businessName && (
                      <p className="text-[11px] text-amber-600">
                        {errors.businessName}
                      </p>
                    )}
                  </div>

                  {/* Subdomínio Personalizado */}
                  <div className="space-y-1 sm:col-span-2">
                    <label
                      htmlFor="checkout-subdomain"
                      className="block text-[12.5px] font-medium text-[#1C1C1E]"
                    >
                      Subdomínio do seu site de agendamento online
                    </label>
                    <div className="flex items-center rounded-xl border border-[#D4D4D8] bg-[#F5F5F7] px-3.5 py-2.5 focus-within:border-[#1C1C1E] focus-within:bg-white transition">
                      <span className="text-[12px] font-mono text-[#8E8E93] pr-1">
                        https://
                      </span>
                      <input
                        id="checkout-subdomain"
                        type="text"
                        value={subdomain}
                        onChange={(e) => handleSubdomainChange(e.target.value)}
                        placeholder="espaco-unniko"
                        required
                        className="flex-1 bg-transparent text-[13.5px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none font-mono"
                      />
                      <span className="text-[12.5px] font-mono font-semibold text-[#1C1C1E] shrink-0 pl-1">
                        .luvea.app
                      </span>
                    </div>
                    {errors.subdomain && (
                      <p className="text-[11px] text-amber-600">{errors.subdomain}</p>
                    )}
                    <p className="text-[11.5px] text-[#6E6E73]">
                      Endereço exclusivo para divulgação no Instagram e agendamento dos seus clientes.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[13.5px] font-semibold transition-all shadow-xs active:scale-[0.99]"
                  >
                    <span>Continuar para escolha do plano e pagamento</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* =========================================================================
                 STEP 2: PLANO & PAGAMENTO
              ========================================================================= */
              <form onSubmit={handleFinalSubmit} className="space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1.5 text-[12px] text-[#6E6E73] hover:text-[#1C1C1E] mb-2 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar para dados cadastrais</span>
                  </button>
                  <h2 className="text-xl font-semibold text-[#1C1C1E] tracking-tight">
                    Plano e forma de pagamento
                  </h2>
                  <p className="text-[12.5px] text-[#6E6E73] mt-0.5">
                    14 dias de teste grátis com garantia total. Cancele quando quiser.
                  </p>
                </div>

                {/* Billing Cycle Switcher */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA]">
                  <span className="text-[13px] font-medium text-[#1C1C1E]">
                    Ciclo de faturamento
                  </span>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#D4D4D8] text-[12px]">
                    <button
                      type="button"
                      onClick={() => setBillingCycle("monthly")}
                      className={`px-3 py-1 rounded-full transition ${
                        billingCycle === "monthly"
                          ? "bg-[#1C1C1E] text-white font-semibold"
                          : "text-[#6E6E73] hover:text-black"
                      }`}
                    >
                      Mensal
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle("yearly")}
                      className={`px-3 py-1 rounded-full transition ${
                        billingCycle === "yearly"
                          ? "bg-[#1C1C1E] text-white font-semibold"
                          : "text-[#6E6E73] hover:text-black"
                      }`}
                    >
                      Anual (~14% off)
                    </button>
                  </div>
                </div>

                {/* Plan Tier Selection Cards */}
                <div className="space-y-2.5">
                  <label className="block text-[12.5px] font-medium text-[#1C1C1E]">
                    Selecione o plano desejado
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                          onClick={() =>
                            setPlanTier(plan.id as "essencial" | "gold" | "platinum")
                          }
                          className={`p-4 rounded-xl text-left border transition relative flex flex-col justify-between ${
                            isSelected
                              ? "border-[#1C1C1E] bg-[#F5F5F7] ring-1 ring-[#1C1C1E]"
                              : "border-[#E5E5EA] bg-white hover:border-[#D4D4D8]"
                          }`}
                        >
                          {plan.badge && (
                            <span className="text-[10px] font-mono uppercase font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1">
                              {plan.badge}
                            </span>
                          )}
                          <p className="text-[14px] font-bold text-[#1C1C1E]">
                            {plan.name}
                          </p>
                          <p className="text-[18px] font-semibold text-[#1C1C1E] mt-1 font-mono">
                            R$ {pPrice}
                            <span className="text-[11px] font-sans text-[#6E6E73] font-normal">
                              /mês
                            </span>
                          </p>
                          <p className="text-[11px] text-[#6E6E73] mt-1 leading-tight">
                            {plan.maxStaffLabel}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2.5 pt-2">
                  <label className="block text-[12.5px] font-medium text-[#1C1C1E]">
                    Forma de pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("credit_card")}
                      className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-[13px] font-semibold transition ${
                        paymentMethod === "credit_card"
                          ? "border-[#1C1C1E] bg-[#F5F5F7] ring-1 ring-[#1C1C1E]"
                          : "border-[#E5E5EA] bg-white hover:bg-[#F5F5F7]"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Cartão de Crédito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pix")}
                      className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-[13px] font-semibold transition ${
                        paymentMethod === "pix"
                          ? "border-[#1C1C1E] bg-[#F5F5F7] ring-1 ring-[#1C1C1E]"
                          : "border-[#E5E5EA] bg-white hover:bg-[#F5F5F7]"
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Pix Recorrente</span>
                    </button>
                  </div>
                </div>

                {/* Credit Card Inputs (Only when Credit Card is selected) */}
                {paymentMethod === "credit_card" && (
                  <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="card-number"
                        className="block text-[12px] font-medium text-[#1C1C1E]"
                      >
                        Número do cartão
                      </label>
                      <input
                        id="card-number"
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        className="w-full px-3 py-2 rounded-lg border border-[#D4D4D8] bg-white text-[13px] font-mono focus:outline-none focus:border-[#1C1C1E]"
                      />
                      {errors.cardNumber && (
                        <p className="text-[11px] text-amber-600">
                          {errors.cardNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="card-name"
                        className="block text-[12px] font-medium text-[#1C1C1E]"
                      >
                        Nome como está no cartão
                      </label>
                      <input
                        id="card-name"
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="CAMILA V SILVA"
                        className="w-full px-3 py-2 rounded-lg border border-[#D4D4D8] bg-white text-[13px] uppercase focus:outline-none focus:border-[#1C1C1E]"
                      />
                      {errors.cardName && (
                        <p className="text-[11px] text-amber-600">{errors.cardName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label
                          htmlFor="card-exp"
                          className="block text-[12px] font-medium text-[#1C1C1E]"
                        >
                          Validade
                        </label>
                        <input
                          id="card-exp"
                          type="text"
                          value={cardExp}
                          onChange={(e) => handleExpChange(e.target.value)}
                          placeholder="MM/AA"
                          maxLength={5}
                          className="w-full px-3 py-2 rounded-lg border border-[#D4D4D8] bg-white text-[13px] font-mono focus:outline-none focus:border-[#1C1C1E]"
                        />
                        {errors.cardExp && (
                          <p className="text-[11px] text-amber-600">{errors.cardExp}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="card-cvc"
                          className="block text-[12px] font-medium text-[#1C1C1E]"
                        >
                          CVC / CVV
                        </label>
                        <input
                          id="card-cvc"
                          type="password"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-3 py-2 rounded-lg border border-[#D4D4D8] bg-white text-[13px] font-mono focus:outline-none focus:border-[#1C1C1E]"
                        />
                        {errors.cardCvc && (
                          <p className="text-[11px] text-amber-600">{errors.cardCvc}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pix Explanation */}
                {paymentMethod === "pix" && (
                  <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-1 text-[12.5px] text-[#6E6E73]">
                    <p className="font-semibold text-[#1C1C1E]">
                      Pix Recorrente Instantâneo
                    </p>
                    <p>
                      Após a confirmação, geraremos o Pix Copia e Cola. O provisionamento do seu subdomínio e estúdio ocorre em menos de 10 segundos.
                    </p>
                  </div>
                )}

                {/* Final Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[13.5px] font-semibold transition-all shadow-xs active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Concluir assinatura e ativar estúdio</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Order Summary (Editorial Luxury Surface) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#1C1C1E] text-white rounded-2xl p-6 sm:p-7 space-y-5 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div>
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
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
                  <p className="text-[11px] text-zinc-400 font-sans">
                    /mês ({billingCycle === "yearly" ? "anual" : "mensal"})
                  </p>
                </div>
              </div>

              {/* Subdomain Reservation Badge */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <span className="text-[12px] text-zinc-400">Subdomínio reservado:</span>
                <span className="text-[12.5px] font-mono font-semibold text-emerald-400">
                  {subdomain ? `${subdomain}.luvea.app` : "seu-estudio.luvea.app"}
                </span>
              </div>

              {/* Features Included */}
              <div className="space-y-2.5 pt-1">
                <p className="text-[12px] uppercase font-mono tracking-wider font-semibold text-zinc-400">
                  Incluso na sua assinatura
                </p>
                <ul className="space-y-2 text-[12.5px] text-zinc-300">
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
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-[14px]">
                <span className="text-zinc-300">Total a pagar hoje:</span>
                <span className="font-bold text-white font-mono text-xl">
                  R$ 0,00
                </span>
              </div>
              <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                Você terá 14 dias de acesso completo sem cobrança. A primeira mensalidade será cobrada apenas ao término do período de avaliação.
              </p>
            </div>

            {/* Trust Badges */}
            <div className="p-4 rounded-xl bg-white border border-[#E5E5EA] space-y-2 text-xs text-[#6E6E73]">
              <div className="flex items-center gap-2 text-[#1C1C1E] font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Garantia de Satisfação Total</span>
              </div>
              <p>
                Sem fidelidade e sem multas. Você pode cancelar sua assinatura com 1 clique a qualquer momento no painel de configurações.
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
        <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#1C1C1E] border-t-transparent animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
