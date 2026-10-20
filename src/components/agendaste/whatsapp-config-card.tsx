"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  QrCode,
  CheckCircle2,
  Send,
  RefreshCw,
  Smartphone,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import {
  StudioState,
  UserWhatsAppConfig,
  UserWhatsAppTemplates,
  updateUserWhatsAppConfig,
  disconnectUserWhatsApp,
  formatWhatsAppMessage,
} from "@/lib/agendaste-store";

interface WhatsAppConfigCardProps {
  state: StudioState;
  setState: React.Dispatch<React.SetStateAction<StudioState>>;
  onAfterSave?: () => void;
  showSaveAndContinue?: boolean;
}

export function WhatsAppConfigCard({
  state,
  setState,
  onAfterSave,
  showSaveAndContinue = true,
}: WhatsAppConfigCardProps) {
  const currentConfig: UserWhatsAppConfig = state.reception.userConfig ?? {
    provider: "evolution_api",
    phoneNumber: state.reception.whatsappNumber || "+55 (11) 94447-7528",
    instanceName: "pessoal",
    apiUrl: "https://api.automab.dev",
    apiKey: "",
    connected: state.reception.whatsappConnected ?? false,
    templates: {
      reminder24h:
        "Olá {nome}! Lembrete do seu horário amanhã às {horario} no {estudio}. Responda 1 para Confirmar ou 2 para Reagendar.",
      reminder2h:
        "Oi {nome}! Seu horário no {estudio} é daqui a 2 horas ({horario}). Estamos te esperando!",
      pixDeposit:
        "Olá {nome}! Para garantir seu horário no {estudio}, faça o pagamento do sinal de {valor_sinal} pelo Pix abaixo:\n{pix_copia_cola}",
      reactivation45d:
        "Oi {nome}! Faz tempo que não nos vemos no {estudio}. Que tal renovar seu visual com um mimo especial esta semana?",
    },
  };

  const [phoneNumber, setPhoneNumber] = useState(
    currentConfig.phoneNumber || state.reception.whatsappNumber || "+55 (11) 94447-7528"
  );
  const [isConnected, setIsConnected] = useState(currentConfig.connected);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [qrCodeText, setQrCodeText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Template settings
  const [templates, setTemplates] = useState<UserWhatsAppTemplates>(
    currentConfig.templates
  );
  const [activeTemplateTab, setActiveTemplateTab] = useState<
    keyof UserWhatsAppTemplates
  >("reminder24h");

  // Test dispatch
  const [testRecipient, setTestRecipient] = useState(phoneNumber);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    waMeUrl?: string;
  } | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Stop polling helper
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Check connection status periodically if waiting for scan
  const startPollingStatus = (phone: string) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/whatsapp/instance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "status",
            phoneNumber: phone,
          }),
        });
        const data = await res.json();
        if (data.ok && (data.connected || data.state === "open")) {
          stopPolling();
          setIsConnected(true);
          setQrCodeBase64(null);
          setQrCodeText(null);
          setIsGeneratingQr(false);

          setState((prev) =>
            updateUserWhatsAppConfig(prev, {
              phoneNumber: data.phoneNumber || phone,
              instanceName: data.instanceName || "pessoal",
              connected: true,
              templates,
            })
          );
        }
      } catch (err) {
        console.warn("Polling status error:", err);
      }
    }, 3000);
  };

  // Check initial status on mount
  useEffect(() => {
    let isMounted = true;
    async function checkCurrentStatus() {
      try {
        const res = await fetch("/api/whatsapp/instance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "status",
            phoneNumber,
          }),
        });
        const data = await res.json();
        if (isMounted && data.ok) {
          if (data.connected || data.state === "open") {
            setIsConnected(true);
            setState((prev) =>
              updateUserWhatsAppConfig(prev, {
                phoneNumber: data.phoneNumber || phoneNumber,
                instanceName: data.instanceName || "pessoal",
                connected: true,
              })
            );
          }
        }
      } catch (e) {
        console.warn("Initial status check error:", e);
      }
    }
    checkCurrentStatus();

    return () => {
      isMounted = false;
      stopPolling();
    };
  }, []);

  // Request new QR Code (Automatic instance creation and pairing)
  const handleGenerateQr = async () => {
    setIsGeneratingQr(true);
    setErrorMessage(null);
    setTestResult(null);

    try {
      const res = await fetch("/api/whatsapp/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_or_connect",
          phoneNumber,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        if (data.connected || data.state === "open") {
          setIsConnected(true);
          setQrCodeBase64(null);
          setQrCodeText(null);
          setState((prev) =>
            updateUserWhatsAppConfig(prev, {
              phoneNumber,
              instanceName: data.instanceName || "pessoal",
              connected: true,
              templates,
            })
          );
        } else {
          setIsConnected(false);
          setQrCodeBase64(data.qrCodeBase64 || null);
          setQrCodeText(data.qrCodeText || null);
          startPollingStatus(phoneNumber);
        }
      } else {
        setErrorMessage(data.error || "Não foi possível gerar o QR Code.");
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Erro de rede ao conectar com a API do WhatsApp."
      );
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    stopPolling();
    setIsConnected(false);
    setQrCodeBase64(null);
    setQrCodeText(null);

    try {
      await fetch("/api/whatsapp/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "disconnect",
          phoneNumber,
        }),
      });
    } catch (e) {
      console.warn("Disconnect error:", e);
    }

    const updatedState = disconnectUserWhatsApp(state);
    setState(updatedState);
  };

  // Save templates
  const handleSaveTemplates = () => {
    const updatedState = updateUserWhatsAppConfig(state, {
      phoneNumber,
      connected: isConnected,
      templates,
    });
    setState(updatedState);
    if (onAfterSave) onAfterSave();
  };

  // Live Test Message Dispatcher
  const handleSendTestMessage = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const templateText = templates[activeTemplateTab];
      const previewText = formatWhatsAppMessage(templateText, {
        nome: "Bruna Silva",
        estudio: state.settings.business.businessName || "Aura Studio",
        data: "20/10/2026",
        horario: "14:30",
        valor_sinal: "R$ 50,00",
        pix_copia_cola: "00020126580014BR.GOV.BCB.PIX...6304ABCD",
      });

      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: "Bruna Silva (Teste)",
          clientPhone: testRecipient || phoneNumber,
          customMessage: previewText,
          templateType: "custom",
          whatsappConfig: {
            phoneNumber,
            instanceName: currentConfig.instanceName || "pessoal",
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResult({
          ok: true,
          message: `Mensagem enviada com sucesso para ${data.recipient}!`,
          waMeUrl: data.waMeUrl,
        });
        setState((prev) => ({
          ...prev,
          lastToastMessage: `Teste de WhatsApp enviado com sucesso para ${testRecipient}!`,
        }));
      } else {
        setTestResult({
          ok: false,
          message: data.error || "Falha ao disparar mensagem no WhatsApp.",
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err?.message || "Erro de conexão ao enviar mensagem de teste.",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SEÇÃO DE CONEXÃO DO WHATSAPP (PADRÃO EDITORIAL LUXURY) */}
      <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 space-y-6 shadow-sm">
        <div className="border-b border-[#E5E5EA] pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[17px] font-bold text-[#1C1C1E]">
                WhatsApp do Estúdio
              </h3>
              <p className="text-[13px] text-[#6E6E73] mt-0.5">
                Canal oficial para envio de confirmações e lembretes automáticos da agenda.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[12px] font-medium text-[#1C1C1E]">
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  isConnected
                    ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                    : "bg-zinc-300"
                }`}
              />
              <span>{isConnected ? "Conectado" : "Desconectado"}</span>
            </div>
          </div>
        </div>

        {/* ESTADO CONECTADO: Card Editorial Fino */}
        {isConnected ? (
          <div className="p-5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] shrink-0 shadow-xs">
                <Smartphone className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-[#1C1C1E] font-mono tracking-tight">
                    {phoneNumber}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[12.5px] text-[#6E6E73]">
                  Disparos e confirmações ativos
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDisconnect}
              className="px-4 py-2 rounded-full border border-[#D4D4D8] bg-white text-[#1C1C1E] hover:bg-[#F5F5F7] text-[12.5px] font-medium transition-colors shadow-xs shrink-0"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Input do Número de WhatsApp */}
            <div className="max-w-md space-y-2">
              <label className="block text-[13px] font-semibold text-[#1C1C1E]">
                Número do WhatsApp
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setTestRecipient(e.target.value);
                  }}
                  placeholder="+55 (11) 94447-7528"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#D4D4D8] text-[14px] font-medium text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] transition"
                />
                <button
                  type="button"
                  disabled={isGeneratingQr}
                  onClick={handleGenerateQr}
                  className="px-5 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[13px] font-semibold flex items-center gap-2 disabled:opacity-60 shadow-xs transition shrink-0"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isGeneratingQr ? "animate-spin" : ""}`}
                  />
                  <span>{isGeneratingQr ? "Gerando..." : "Gerar QR Code"}</span>
                </button>
              </div>
              <p className="text-[12px] text-[#6E6E73]">
                Informe o número com DDD. Exemplo: (11) 99752-5522
              </p>
            </div>

            {/* Área de Pareamento do QR Code */}
            {isGeneratingQr ? (
              <div className="p-8 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-col items-center justify-center space-y-3 text-center">
                <RefreshCw className="w-5 h-5 text-[#1C1C1E] animate-spin" />
                <p className="text-[13px] font-medium text-[#1C1C1E]">
                  Gerando código de pareamento...
                </p>
              </div>
            ) : qrCodeBase64 ? (
              <div className="p-6 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-col items-center text-center space-y-5">
                <div className="p-4 bg-white rounded-2xl border border-[#E5E5EA] shadow-xs">
                  <img
                    src={
                      qrCodeBase64.startsWith("data:")
                        ? qrCodeBase64
                        : `data:image/png;base64,${qrCodeBase64}`
                    }
                    alt="QR Code WhatsApp"
                    className="w-56 h-56 object-contain"
                  />
                </div>

                <div className="max-w-md text-left space-y-2 bg-white p-4 rounded-xl border border-[#E5E5EA] text-[12.5px]">
                  <p className="font-semibold text-[#1C1C1E] mb-1">
                    Como conectar:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[#6E6E73]">
                    <li>Abra o <strong>WhatsApp</strong> no seu celular</li>
                    <li>
                      Acesse <strong>Aparelhos Conectados</strong>
                    </li>
                    <li>
                      Toque em <strong>Conectar um aparelho</strong> e aponte a câmera
                    </li>
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateQr}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D4D4D8] bg-white text-[12.5px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Atualizar código</span>
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] shrink-0 shadow-xs">
                    <QrCode className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-semibold text-[#1C1C1E]">
                      Nenhuma linha conectada
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      Clique em Gerar QR Code para vincular seu WhatsApp ao estúdio.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateQr}
                  className="px-5 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[13px] font-semibold transition shrink-0"
                >
                  Gerar QR Code
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. PERSONALIZAÇÃO DOS TEXTOS DAS MENSAGENS */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-sm">
        <div className="border-b border-zinc-100 pb-3">
          <h3 className="text-[16px] font-bold text-[#18181B]">
            Modelos de Mensagens do Sistema
          </h3>
          <p className="text-[12.5px] text-zinc-500 mt-0.5">
            Personalize o texto que seus clientes receberão com dados dinâmicos do agendamento.
          </p>
        </div>

        {/* Abas das mensagens */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto">
          {[
            { id: "reminder24h" as const, label: "Lembrete 24h Antes" },
            { id: "reminder2h" as const, label: "Aviso 2h Antes" },
            { id: "pixDeposit" as const, label: "Cobrança Sinal Pix" },
            { id: "reactivation45d" as const, label: "Reativação 45 Dias" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTemplateTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold whitespace-nowrap transition-colors ${
                activeTemplateTab === tab.id
                  ? "bg-[#1C1C1E] text-white"
                  : "bg-zinc-100 text-zinc-600 hover:text-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Input & Chips de Variáveis */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap text-[11.5px]">
            <span className="text-zinc-500 font-medium">Inserir variável:</span>
            {[
              "{nome}",
              "{estudio}",
              "{data}",
              "{horario}",
              "{valor_sinal}",
              "{pix_copia_cola}",
            ].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setTemplates((prev) => ({
                    ...prev,
                    [activeTemplateTab]: `${prev[activeTemplateTab]} ${v}`,
                  }));
                }}
                className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-mono text-[11px] font-semibold border border-zinc-200"
                title={`Inserir ${v}`}
              >
                + {v}
              </button>
            ))}
          </div>

          <textarea
            rows={4}
            value={templates[activeTemplateTab]}
            onChange={(e) =>
              setTemplates((prev) => ({
                ...prev,
                [activeTemplateTab]: e.target.value,
              }))
            }
            className="w-full p-3.5 rounded-xl border border-zinc-300 text-[13px] leading-relaxed text-[#18181B] focus:outline-none focus:border-[#1C1C1E]"
          />

          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-zinc-200 text-[12px] space-y-1">
            <span className="font-bold text-zinc-700">Prévia de como o cliente recebe:</span>
            <p className="text-zinc-600 italic">
              &quot;
              {formatWhatsAppMessage(templates[activeTemplateTab], {
                nome: "Bruna Silva",
                estudio: state.settings.business.businessName || "Aura Studio",
                data: "20/10/2026",
                horario: "14:30",
                valor_sinal: "R$ 50,00",
                pix_copia_cola: "00020126580014BR.GOV.BCB.PIX...6304ABCD",
              })}
              &quot;
            </p>
          </div>
        </div>
      </div>

      {/* 3. TESTE DE DISPARO AO VIVO */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-sm">
        <div>
          <h3 className="text-[16px] font-bold text-[#18181B]">
            Testar Envio no WhatsApp
          </h3>
          <p className="text-[12.5px] text-zinc-500 mt-0.5">
            Envie uma mensagem de teste para o seu próprio celular para verificar o recebimento.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            placeholder="+55 (11) 94447-7528"
            className="w-full sm:w-72 px-4 py-2.5 rounded-xl border border-zinc-300 text-[13px] focus:outline-none focus:border-[#1C1C1E]"
          />

          <button
            type="button"
            disabled={isSendingTest}
            onClick={handleSendTestMessage}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isSendingTest ? "Disparando teste..." : "Enviar Mensagem de Teste"}
            </span>
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-[12.5px] flex items-start gap-2.5 ${
              testResult.ok
                ? "bg-[#F5F5F7] border-[#E5E5EA] text-[#1C1C1E]"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            {testResult.ok ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">{testResult.message}</p>
              {testResult.waMeUrl && (
                <a
                  href={testResult.waMeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1C1C1E] underline hover:text-black"
                >
                  <span>Abrir conversa no WhatsApp Web</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Salvar Configurações */}
      {showSaveAndContinue && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleSaveTemplates}
            className="px-8 py-3 rounded-full bg-[#1C1C1E] text-white text-[13.5px] font-semibold hover:bg-black transition-colors shadow-sm"
          >
            Salvar Mensagens do WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}
