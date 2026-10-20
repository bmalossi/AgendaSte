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
  Copy,
  X,
  Sliders,
  ChevronDown,
  ChevronUp,
  Globe,
  ShieldCheck,
} from "lucide-react";
import {
  StudioState,
  UserWhatsAppConfig,
  UserWhatsAppTemplates,
  EvolutionInstanceSettings,
  DEFAULT_EVOLUTION_SETTINGS,
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

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  id,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1C1C1E] focus:ring-offset-2 ${
        checked ? "bg-[#1C1C1E]" : "bg-[#E5E5EA]"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
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
    evolutionSettings: DEFAULT_EVOLUTION_SETTINGS,
  };

  const [phoneNumber, setPhoneNumber] = useState(
    currentConfig.phoneNumber || state.reception.whatsappNumber || "+55 (11) 94447-7528"
  );
  const [isConnected, setIsConnected] = useState(currentConfig.connected);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [qrCodeText, setQrCodeText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Evolution API Instance Settings
  const [evolutionSettings, setEvolutionSettings] = useState<EvolutionInstanceSettings>(
    currentConfig.evolutionSettings ?? DEFAULT_EVOLUTION_SETTINGS
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState<string | null>(null);
  const [settingsErrorMessage, setSettingsErrorMessage] = useState<string | null>(null);
  const [showAdvancedServerConfig, setShowAdvancedServerConfig] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(
    currentConfig.apiUrl || "https://api.automab.dev"
  );
  const [customServerKey, setCustomServerKey] = useState(currentConfig.apiKey || "");
  const [activeInstanceName, setActiveInstanceName] = useState(
    currentConfig.instanceName || (phoneNumber ? `luvea_${phoneNumber.replace(/\D/g, "")}` : "")
  );

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

          if (data.instanceName) {
            setActiveInstanceName(data.instanceName);
          }

          setState((prev) =>
            updateUserWhatsAppConfig(prev, {
              phoneNumber: data.phoneNumber || phone,
              instanceName: data.instanceName,
              apiKey: data.apiKey,
              connected: true,
              templates,
              evolutionSettings,
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
          if (data.instanceName) {
            setActiveInstanceName(data.instanceName);
          }

          if (data.connected && data.state === "open") {
            setIsConnected(true);
            setState((prev) =>
              updateUserWhatsAppConfig(prev, {
                phoneNumber: data.phoneNumber || phoneNumber,
                instanceName: data.instanceName,
                apiKey: data.apiKey,
                connected: true,
              })
            );
          } else {
            setIsConnected(false);
            setState((prev) =>
              updateUserWhatsAppConfig(prev, {
                connected: false,
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

  // Fetch current Evolution settings from server whenever phone/instance changes
  useEffect(() => {
    let isMounted = true;
    async function fetchSettings() {
      try {
        const res = await fetch(
          `/api/whatsapp/settings?phoneNumber=${encodeURIComponent(phoneNumber)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.ok && data.settings) {
            setEvolutionSettings(data.settings);
            if (data.instanceName) {
              setActiveInstanceName(data.instanceName);
            }
          }
        }
      } catch (err) {
        // silent fallback to store
      }
    }

    if (phoneNumber) {
      fetchSettings();
    }

    return () => {
      isMounted = false;
    };
  }, [phoneNumber]);

  // Request new QR Code (Automatic instance connection)
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

      if (data.instanceName) {
        setActiveInstanceName(data.instanceName);
      }

      if (data.ok) {
        if (data.connected || data.state === "open") {
          setIsConnected(true);
          setQrCodeBase64(null);
          setQrCodeText(null);
          setState((prev) =>
            updateUserWhatsAppConfig(prev, {
              phoneNumber: data.phoneNumber || phoneNumber,
              instanceName: data.instanceName,
              apiKey: data.apiKey,
              connected: true,
              templates,
              evolutionSettings,
            })
          );
        } else {
          setIsConnected(false);
          setQrCodeBase64(data.qrCodeBase64 || null);
          setQrCodeText(data.qrCodeText || null);
          startPollingStatus(phoneNumber);
        }
      } else {
        setErrorMessage(data.error || "Não foi possível gerar o QR Code no momento. Tente novamente.");
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Erro de rede ao conectar com a API do WhatsApp."
      );
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Save Evolution API Instance Settings
  const handleSaveEvolutionSettings = async () => {
    setIsSavingSettings(true);
    setSettingsSuccessMessage(null);
    setSettingsErrorMessage(null);

    try {
      const res = await fetch("/api/whatsapp/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          instanceName: activeInstanceName,
          apiUrl: customServerUrl.trim() || undefined,
          apiKey: customServerKey.trim() || undefined,
          settings: evolutionSettings,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSettingsSuccessMessage(
          data.savedOnServer
            ? "Configurações sincronizadas na Evolution API com sucesso."
            : "Configurações salvas localmente para aplicação ao conectar."
        );
        setState((prev) =>
          updateUserWhatsAppConfig(prev, {
            phoneNumber,
            apiUrl: customServerUrl.trim() || undefined,
            apiKey: customServerKey.trim() || undefined,
            instanceName: data.instanceName || activeInstanceName,
            evolutionSettings,
          })
        );
        setTimeout(() => setSettingsSuccessMessage(null), 4000);
      } else {
        setSettingsErrorMessage(data.error || "Erro ao salvar na Evolution API.");
      }
    } catch (err: any) {
      setSettingsErrorMessage(err?.message || "Erro de rede ao salvar configurações.");
    } finally {
      setIsSavingSettings(false);
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
      evolutionSettings,
      instanceName: activeInstanceName,
      apiUrl: customServerUrl.trim() || undefined,
      apiKey: customServerKey.trim() || undefined,
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
        estudio: state.settings.business.businessName || "Luvea Studio",
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
          clientPhone: testRecipient,
          templateType: activeTemplateTab === "reminder24h" ? "reminder_24h" : "custom",
          customMessage: previewText,
          userConfig: {
            ...currentConfig,
            phoneNumber,
            instanceName: activeInstanceName,
            apiUrl: customServerUrl.trim() || undefined,
            apiKey: customServerKey.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setTestResult({
          ok: true,
          message: data.deliveryStatus || "Mensagem de teste enviada com sucesso!",
          waMeUrl: data.waMeUrl,
        });
      } else {
        setTestResult({
          ok: false,
          message: data.error || "Falha no envio do teste.",
          waMeUrl: data.waMeUrl,
        });
      }
    } catch (e: any) {
      setTestResult({
        ok: false,
        message: e?.message || "Erro de conexão ao enviar mensagem de teste.",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. WHATSAPP DO ESTÚDIO */}
      <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 space-y-5 shadow-sm">
        {/* Header com Status Badge Fino */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5EA] pb-4">
          <div>
            <h3 className="text-[17px] font-bold text-[#1C1C1E]">
              WhatsApp do Estúdio
            </h3>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">
              Canal oficial para envio de confirmações e lembretes automáticos da agenda.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[12.5px] font-medium text-[#1C1C1E] self-start sm:self-auto">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                  : "bg-zinc-400"
              }`}
            />
            <span>{isConnected ? "Conectado" : "Desconectado"}</span>
          </div>
        </div>

        {isConnected ? (
          /* Estado Conectado */
          <div className="p-5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] shrink-0 shadow-xs">
                <Smartphone className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1C1C1E] font-mono">
                  {phoneNumber}
                </p>
                <p className="text-[12px] text-[#6E6E73] mt-0.5">
                  Disparos e confirmações ativos
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDisconnect}
              className="px-4 py-2 rounded-full border border-[#D4D4D8] bg-white text-[12.5px] font-medium text-[#1C1C1E] hover:bg-[#F5F5F7] transition shadow-2xs"
            >
              Desconectar
            </button>
          </div>
        ) : (
          /* Estado Desconectado */
          <div className="space-y-5">
            {/* Input do Número de WhatsApp */}
            <div className="max-w-md space-y-2">
              <label
                htmlFor="whatsapp-phone-input"
                className="block text-[13px] font-semibold text-[#1C1C1E]"
              >
                Número do WhatsApp
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  id="whatsapp-phone-input"
                  aria-label="Número do WhatsApp"
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => {
                    const newPhone = e.target.value;
                    setPhoneNumber(newPhone);
                    if (isConnected) {
                      setIsConnected(false);
                      stopPolling();
                      setQrCodeBase64(null);
                      setQrCodeText(null);
                    }
                  }}
                  placeholder="+55 (13) 97827-6520"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#D4D4D8] text-[14px] font-medium text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] transition"
                />
                <button
                  type="button"
                  disabled={isGeneratingQr}
                  onClick={() => handleGenerateQr()}
                  className="px-5 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs transition shrink-0"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isGeneratingQr ? "animate-spin" : ""}`}
                  />
                  <span>{isGeneratingQr ? "Gerando..." : "Gerar QR Code"}</span>
                </button>
              </div>
              <p className="text-[12px] text-[#6E6E73]">
                Informe o número com DDD. Exemplo: (13) 97827-6520
              </p>
            </div>

            {/* Área de Pareamento do QR Code */}
            {isGeneratingQr ? (
              <div className="p-8 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-col items-center justify-center space-y-3 text-center">
                <RefreshCw className="w-5 h-5 text-[#1C1C1E] animate-spin" />
                <p className="text-[13px] font-medium text-[#1C1C1E]">
                  Gerando código de pareamento autêntico...
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
                  onClick={() => handleGenerateQr()}
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
                  onClick={() => handleGenerateQr()}
                  className="px-5 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[13px] font-semibold transition shrink-0"
                >
                  Gerar QR Code
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-[12.5px] text-[#1C1C1E] flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. CONFIGURAÇÕES DA INSTÂNCIA (EVOLUTION API) */}
      <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5EA] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] font-bold text-[#1C1C1E]">
                Configurações da Instância (Evolution API)
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                <span>Instância: {activeInstanceName}</span>
              </span>
            </div>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">
              Defina o comportamento da linha do WhatsApp para chamadas, mensagens de grupo, privacidade e sincronização.
            </p>
          </div>

          <a
            href="https://docs.evolutionfoundation.com.br/evolution-api"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] transition shrink-0"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Documentação Evolution</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* 6 Controles Oficiais da Evolution API */}
        <div className="space-y-3">
          {/* 1. Reject Calls */}
          <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[13.5px] font-semibold text-[#1C1C1E]">
                  Rejeitar chamadas recebidas (Reject Calls)
                </span>
                <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                  Recusa chamadas de voz e vídeo automaticamente no WhatsApp para manter o foco no atendimento por mensagens e na agenda online.
                </p>
              </div>
              <ToggleSwitch
                id="reject-call-switch"
                checked={evolutionSettings.rejectCall}
                onChange={(val) =>
                  setEvolutionSettings((prev) => ({ ...prev, rejectCall: val }))
                }
                label="Rejeitar chamadas recebidas"
              />
            </div>

            {evolutionSettings.rejectCall && (
              <div className="pt-2 border-t border-[#E5E5EA] space-y-1.5 animate-in fade-in-50 duration-200">
                <label
                  htmlFor="msg-call-input"
                  className="block text-[11.5px] font-medium text-[#1C1C1E]"
                >
                  Mensagem enviada automaticamente ao autor da chamada recusada (msgCall)
                </label>
                <input
                  id="msg-call-input"
                  type="text"
                  value={evolutionSettings.msgCall}
                  onChange={(e) =>
                    setEvolutionSettings((prev) => ({
                      ...prev,
                      msgCall: e.target.value,
                    }))
                  }
                  placeholder="Ex: Não recebemos chamadas neste WhatsApp. Por favor, envie uma mensagem de texto ou utilize nosso agendamento online."
                  className="w-full px-3 py-2 rounded-xl border border-[#D4D4D8] bg-white text-[12.5px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] transition"
                />
              </div>
            )}
          </div>

          {/* 2. Ignore Groups */}
          <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[13.5px] font-semibold text-[#1C1C1E]">
                Ignorar mensagens de grupos (Ignore Groups)
              </span>
              <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                Ignora todas as mensagens e menções vindas de grupos para que apenas conversas individuais de clientes sejam processadas.
              </p>
            </div>
            <ToggleSwitch
              id="ignore-groups-switch"
              checked={evolutionSettings.groupsIgnore}
              onChange={(val) =>
                setEvolutionSettings((prev) => ({ ...prev, groupsIgnore: val }))
              }
              label="Ignorar mensagens de grupos"
            />
          </div>

          {/* 3. Always Online */}
          <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[13.5px] font-semibold text-[#1C1C1E]">
                Sempre online (Always Online)
              </span>
              <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                Mantém o perfil do WhatsApp com indicador online contínuo para transmitir prontidão e atendimento ativo.
              </p>
            </div>
            <ToggleSwitch
              id="always-online-switch"
              checked={evolutionSettings.alwaysOnline}
              onChange={(val) =>
                setEvolutionSettings((prev) => ({ ...prev, alwaysOnline: val }))
              }
              label="Manter status sempre online"
            />
          </div>

          {/* 4. Read Messages */}
          <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[13.5px] font-semibold text-[#1C1C1E]">
                Marcar mensagens como lidas (Read Messages)
              </span>
              <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                Confirma a leitura das mensagens recebidas assim que são processadas pelo sistema.
              </p>
            </div>
            <ToggleSwitch
              id="read-messages-switch"
              checked={evolutionSettings.readMessages}
              onChange={(val) =>
                setEvolutionSettings((prev) => ({ ...prev, readMessages: val }))
              }
              label="Marcar mensagens como lidas"
            />
          </div>

          {/* 5. Sync Full History */}
          <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[13.5px] font-semibold text-[#1C1C1E]">
                Sincronizar histórico completo (Sync Full History)
              </span>
              <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                Sincroniza o histórico integral de conversas anteriores ao parear pelo QR Code no aparelho.
              </p>
            </div>
            <ToggleSwitch
              id="sync-full-history-switch"
              checked={evolutionSettings.syncFullHistory}
              onChange={(val) =>
                setEvolutionSettings((prev) => ({ ...prev, syncFullHistory: val }))
              }
              label="Sincronizar histórico completo"
            />
          </div>

          {/* 6. Read Status */}
          <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[13.5px] font-semibold text-[#1C1C1E]">
                Visualizar status dos contatos (Read Status)
              </span>
              <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                Marca as publicações de status (stories) dos seus contatos como visualizadas automaticamente.
              </p>
            </div>
            <ToggleSwitch
              id="read-status-switch"
              checked={evolutionSettings.readStatus}
              onChange={(val) =>
                setEvolutionSettings((prev) => ({ ...prev, readStatus: val }))
              }
              label="Visualizar status dos contatos automaticamente"
            />
          </div>
        </div>

        {/* Configurações Avançadas do Servidor Evolution API (Accordion) */}
        <div className="border border-[#E5E5EA] rounded-xl overflow-hidden bg-[#FAFAFC]">
          <button
            type="button"
            onClick={() => setShowAdvancedServerConfig(!showAdvancedServerConfig)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#F5F5F7] transition"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#6E6E73]" />
              <span className="text-[13px] font-semibold text-[#1C1C1E]">
                Conexão do Servidor Evolution API (Avançado)
              </span>
            </div>
            {showAdvancedServerConfig ? (
              <ChevronUp className="w-4 h-4 text-[#6E6E73]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6E6E73]" />
            )}
          </button>

          {showAdvancedServerConfig && (
            <div className="p-4 border-t border-[#E5E5EA] space-y-4 bg-white text-[12.5px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="custom-server-url"
                    className="block font-medium text-[#1C1C1E]"
                  >
                    URL do Servidor Evolution API
                  </label>
                  <input
                    id="custom-server-url"
                    type="text"
                    value={customServerUrl}
                    onChange={(e) => setCustomServerUrl(e.target.value)}
                    placeholder="https://api.automab.dev"
                    className="w-full px-3 py-2 rounded-xl border border-[#D4D4D8] font-mono text-[12px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="active-instance-name"
                    className="block font-medium text-[#1C1C1E]"
                  >
                    Nome da Instância
                  </label>
                  <input
                    id="active-instance-name"
                    type="text"
                    value={activeInstanceName}
                    onChange={(e) => setActiveInstanceName(e.target.value)}
                    placeholder="luvea_5513978276520"
                    className="w-full px-3 py-2 rounded-xl border border-[#D4D4D8] font-mono text-[12px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="custom-server-key"
                  className="block font-medium text-[#1C1C1E]"
                >
                  Chave Global / Token (Opcional se já configurada no ambiente)
                </label>
                <input
                  id="custom-server-key"
                  type="password"
                  value={customServerKey}
                  onChange={(e) => setCustomServerKey(e.target.value)}
                  placeholder="AUTHENTICATION_API_KEY do servidor..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D4D4D8] font-mono text-[12px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Feedback Messages */}
        {settingsSuccessMessage && (
          <div className="p-3 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-[12.5px] text-[#1C1C1E] flex items-center gap-2 animate-in fade-in duration-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
            <span>{settingsSuccessMessage}</span>
          </div>
        )}

        {settingsErrorMessage && (
          <div className="p-3 bg-[#FFF5F5] border border-[#FEE2E2] rounded-xl text-[12.5px] text-[#991B1B] flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{settingsErrorMessage}</span>
          </div>
        )}

        {/* Botão de Salvar Configurações da Evolution API */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            disabled={isSavingSettings}
            onClick={handleSaveEvolutionSettings}
            className="px-6 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[13px] font-semibold flex items-center gap-2 disabled:opacity-60 shadow-xs transition"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSavingSettings ? "animate-spin" : ""}`}
            />
            <span>
              {isSavingSettings
                ? "Aplicando na Evolution API..."
                : "Salvar Configurações da Evolution API"}
            </span>
          </button>
        </div>
      </div>

      {/* 3. MODELOS DE MENSAGENS DO SISTEMA */}
      <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 space-y-5 shadow-sm">
        <div className="border-b border-[#E5E5EA] pb-3">
          <h3 className="text-[17px] font-bold text-[#1C1C1E]">
            Modelos de Mensagens do Sistema
          </h3>
          <p className="text-[13px] text-[#6E6E73] mt-0.5">
            Personalize o texto que seus clientes receberão com dados dinâmicos do agendamento.
          </p>
        </div>

        {/* Abas das mensagens */}
        <div className="flex items-center gap-2 border-b border-[#E5E5EA] pb-3 overflow-x-auto">
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
              className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium whitespace-nowrap transition-colors ${
                activeTemplateTab === tab.id
                  ? "bg-[#1C1C1E] text-white"
                  : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#EBEBED]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Input & Chips de Variáveis */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap text-[11.5px]">
            <span className="text-[#6E6E73] font-medium">Inserir variável:</span>
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
                className="px-2.5 py-1 rounded-md bg-[#F5F5F7] hover:bg-[#EBEBED] text-[#1C1C1E] font-mono text-[11.5px] font-medium border border-[#E5E5EA] transition-colors"
                title={`Inserir ${v}`}
              >
                + {v}
              </button>
            ))}
          </div>

          <textarea
            id="template-message-input"
            aria-label="Modelo de mensagem do WhatsApp"
            rows={4}
            value={templates[activeTemplateTab]}
            onChange={(e) =>
              setTemplates((prev) => ({
                ...prev,
                [activeTemplateTab]: e.target.value,
              }))
            }
            className="w-full p-3.5 rounded-xl border border-[#D4D4D8] text-[13.5px] leading-relaxed text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] transition"
          />

          <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5EA] text-[12.5px] space-y-1.5">
            <span className="font-semibold text-[#1C1C1E]">Prévia de como o cliente recebe:</span>
            <p className="text-[#6E6E73] italic">
              &quot;
              {formatWhatsAppMessage(templates[activeTemplateTab], {
                nome: "Bruna Silva",
                estudio: state.settings.business.businessName || "Luvea Studio",
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

      {/* 4. TESTAR ENVIO NO WHATSAPP */}
      <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6 space-y-5 shadow-sm">
        <div>
          <h3 className="text-[17px] font-bold text-[#1C1C1E]">
            Testar Envio no WhatsApp
          </h3>
          <p className="text-[13px] text-[#6E6E73] mt-0.5">
            Envie uma mensagem de teste para o seu próprio celular para verificar o recebimento.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            id="test-recipient-input"
            aria-label="Número para teste de envio do WhatsApp"
            type="text"
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            placeholder="+55 (11) 94447-7528"
            className="w-full sm:w-72 px-4 py-2.5 rounded-xl border border-[#D4D4D8] text-[13.5px] font-medium text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] transition"
          />

          <button
            type="button"
            disabled={isSendingTest}
            onClick={handleSendTestMessage}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[13px] font-medium flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs transition-colors"
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
                : "bg-[#FFF5F5] border-[#FEE2E2] text-[#991B1B]"
            }`}
          >
            {testResult.ok ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 mt-1.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
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
