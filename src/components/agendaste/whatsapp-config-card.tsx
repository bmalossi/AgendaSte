"use client";

import React, { useState } from "react";
import {
  QrCode,
  CheckCircle2,
  Send,
  RefreshCw,
  Key,
  Globe,
  Radio,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  StudioState,
  WhatsAppProviderType,
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
    phoneNumber: state.reception.whatsappNumber || "+55 (11) 99752-5522",
    instanceName: "aurastudio-whatsapp",
    apiUrl: "https://api.agendaste.com/evolution",
    apiKey: "",
    connected: state.reception.whatsappConnected ?? true,
    connectedAt: "2026-10-17T08:00:00Z",
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

  const [provider, setProvider] = useState<WhatsAppProviderType>(
    currentConfig.provider || "evolution_api"
  );
  const [phoneNumber, setPhoneNumber] = useState(
    currentConfig.phoneNumber || state.reception.whatsappNumber || "+55 (11) 99752-5522"
  );
  const [instanceName, setInstanceName] = useState(
    currentConfig.instanceName || "aurastudio-whatsapp"
  );
  const [apiUrl, setApiUrl] = useState(
    currentConfig.apiUrl || "https://api.agendaste.com/evolution"
  );
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || "");

  // Meta Cloud API
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState(
    currentConfig.metaPhoneNumberId || ""
  );
  const [metaBusinessAccountId, setMetaBusinessAccountId] = useState(
    currentConfig.metaBusinessAccountId || ""
  );
  const [metaAccessToken, setMetaAccessToken] = useState(
    currentConfig.metaAccessToken || ""
  );

  // Templates
  const [templates, setTemplates] = useState<UserWhatsAppTemplates>(
    currentConfig.templates
  );
  const [activeTemplateTab, setActiveTemplateTab] = useState<
    keyof UserWhatsAppTemplates
  >("reminder24h");

  // Pair / Status
  const [isConnected, setIsConnected] = useState(currentConfig.connected);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(
    currentConfig.pairingQrCode || null
  );

  // Test send state
  const [testRecipient, setTestRecipient] = useState(
    currentConfig.phoneNumber || "+55 (11) 99752-5522"
  );
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    waMeUrl?: string;
  } | null>(null);

  // Save changes
  const handleSave = () => {
    const updatedState = updateUserWhatsAppConfig(state, {
      provider,
      phoneNumber,
      instanceName,
      apiUrl,
      apiKey,
      metaPhoneNumberId,
      metaBusinessAccountId,
      metaAccessToken,
      connected: isConnected,
      templates,
    });
    setState(updatedState);
    if (onAfterSave) onAfterSave();
  };

  // Disconnect
  const handleDisconnect = () => {
    setIsConnected(false);
    setQrCodeData(null);
    const updatedState = disconnectUserWhatsApp(state);
    setState(updatedState);
  };

  // Generate / Pair QR Code (Evolution / Baileys)
  const handleGeneratePairing = () => {
    setIsGeneratingQr(true);
    setTestResult(null);

    setTimeout(() => {
      // Gera payload simulado com formato autêntico de pairing string
      const simulatedQr = `2@AgendasteEvolution${Date.now()},${Math.random()
        .toString(36)
        .slice(2, 10)}`;
      setQrCodeData(simulatedQr);
      setIsConnected(true);
      setIsGeneratingQr(false);

      const updatedState = updateUserWhatsAppConfig(state, {
        provider,
        phoneNumber,
        instanceName,
        apiUrl,
        apiKey,
        connected: true,
        connectedAt: new Date().toISOString(),
        pairingQrCode: simulatedQr,
        templates,
      });
      setState(updatedState);
    }, 1200);
  };

  // Send Live Test Message
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
          clientPhone: testRecipient,
          customMessage: previewText,
          templateType: "custom",
          whatsappConfig: {
            provider,
            phoneNumber,
            instanceName,
            apiUrl,
            apiKey,
            metaPhoneNumberId,
            metaBusinessAccountId,
            metaAccessToken,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResult({
          ok: true,
          message: `Mensagem enviada com sucesso via ${data.engine}! Recipiente: ${data.recipient}`,
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
        message: err?.message || "Erro de rede ao conectar com o serviço de envio.",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Selector Cards */}
      <div className="space-y-3">
        <label className="block text-[13px] font-bold text-[#18181B]">
          1. Escolha como conectar seu WhatsApp
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Option 1: Evolution API / Baileys */}
          <button
            type="button"
            onClick={() => {
              setProvider("evolution_api");
              setTestResult(null);
            }}
            className={`p-4 rounded-xl border text-left transition-all ${
              provider === "evolution_api"
                ? "border-[#1C1C1E] bg-[#F5F5F7] ring-1 ring-[#1C1C1E]"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-[#1C1C1E] text-white flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </span>
              {provider === "evolution_api" && (
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              )}
            </div>
            <p className="text-[13.5px] font-bold text-[#18181B]">
              Conectar via QR Code
            </p>
            <p className="text-[12px] text-zinc-500 mt-1 leading-snug">
              Evolution API / Baileys. Pareie seu número atual como &quot;Aparelho Conectado&quot; em 15 segundos.
            </p>
          </button>

          {/* Option 2: Meta Cloud API */}
          <button
            type="button"
            onClick={() => {
              setProvider("meta_cloud");
              setTestResult(null);
            }}
            className={`p-4 rounded-xl border text-left transition-all ${
              provider === "meta_cloud"
                ? "border-[#1C1C1E] bg-[#F5F5F7] ring-1 ring-[#1C1C1E]"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </span>
              {provider === "meta_cloud" && (
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              )}
            </div>
            <p className="text-[13.5px] font-bold text-[#18181B]">
              Meta Cloud API Oficial
            </p>
            <p className="text-[12px] text-zinc-500 mt-1 leading-snug">
              WhatsApp Business API oficial com token permanente e número empresarial verificado.
            </p>
          </button>

          {/* Option 3: wa.me Manual Web */}
          <button
            type="button"
            onClick={() => {
              setProvider("wa_web_manual");
              setTestResult(null);
            }}
            className={`p-4 rounded-xl border text-left transition-all ${
              provider === "wa_web_manual"
                ? "border-[#1C1C1E] bg-[#F5F5F7] ring-1 ring-[#1C1C1E]"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-[#6E56CF] text-white flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </span>
              {provider === "wa_web_manual" && (
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              )}
            </div>
            <p className="text-[13.5px] font-bold text-[#18181B]">
              Link Web Direto (wa.me)
            </p>
            <p className="text-[12px] text-zinc-500 mt-1 leading-snug">
              Zero configuração de servidor. Abre conversas diretamente no seu celular ou computador.
            </p>
          </button>
        </div>
      </div>

      {/* Provider Details & Credentials Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#18181B]">
              2. Dados do seu WhatsApp &amp; Conexão
            </h3>
            <p className="text-[12.5px] text-zinc-500 mt-0.5">
              Informe o número do estúdio que receberá e enviará as confirmações aos clientes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                isConnected
                  ? "bg-[#DCFCE7] text-[#166534]"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {isConnected ? "✓ WhatsApp Conectado" : "○ Não Conectado"}
            </span>

            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-[11.5px] font-medium text-red-600 hover:underline px-2"
              >
                Desconectar
              </button>
            )}
          </div>
        </div>

        {/* Input Phone Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
              Número de WhatsApp do Estúdio
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+55 (11) 99752-5522"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-[13.5px] focus:outline-none focus:border-[#1C1C1E]"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Formato nacional ou internacional com DDD: +55 (XX) 9XXXX-XXXX
            </p>
          </div>

          {provider === "evolution_api" && (
            <div>
              <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                Nome da Instância (Instance Name)
              </label>
              <input
                type="text"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="aurastudio-whatsapp"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-[13.5px] focus:outline-none focus:border-[#1C1C1E]"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Identificador exclusivo da sua sessão no gateway
              </p>
            </div>
          )}
        </div>

        {/* Evolution API Custom Server Options */}
        {provider === "evolution_api" && (
          <div className="pt-2 border-t border-zinc-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  URL da API (Evolution API Gateway)
                </label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.agendaste.com/evolution"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-[13px] font-mono focus:outline-none focus:border-[#1C1C1E]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  Chave de API (API Key / Token Secreto)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Deixe em branco para usar chave padrão"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-[13px] font-mono focus:outline-none focus:border-[#1C1C1E]"
                />
              </div>
            </div>

            {/* QR Code Action Box */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-xl bg-[#1C1C1E] text-white flex items-center justify-center shrink-0">
                  <QrCode className="w-9 h-9" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#18181B]">
                    {isConnected
                      ? "Aparelho Conectado ao WhatsApp"
                      : "Pareamento via QR Code"}
                  </p>
                  <p className="text-[12px] text-zinc-500 mt-0.5">
                    Abra o WhatsApp no celular &gt; Aparelhos Conectados &gt; Conectar um Aparelho.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isGeneratingQr}
                onClick={handleGeneratePairing}
                className="px-5 py-2.5 rounded-full bg-[#1C1C1E] hover:bg-black text-white text-[12.5px] font-semibold disabled:opacity-60 flex items-center gap-2 shrink-0 shadow-sm"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isGeneratingQr ? "animate-spin" : ""}`}
                />
                <span>
                  {isGeneratingQr
                    ? "Gerando sessão..."
                    : isConnected
                    ? "Reconectar / Novo QR Code"
                    : "Gerar QR Code de Pareamento"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Meta Cloud API Form */}
        {provider === "meta_cloud" && (
          <div className="pt-2 border-t border-zinc-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  Phone Number ID (Meta Graph API)
                </label>
                <input
                  type="text"
                  value={metaPhoneNumberId}
                  onChange={(e) => setMetaPhoneNumberId(e.target.value)}
                  placeholder="Ex: 104592837482910"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-[13px] font-mono focus:outline-none focus:border-[#1C1C1E]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  WhatsApp Business Account ID (WABA)
                </label>
                <input
                  type="text"
                  value={metaBusinessAccountId}
                  onChange={(e) => setMetaBusinessAccountId(e.target.value)}
                  placeholder="Ex: 293847582910293"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-[13px] font-mono focus:outline-none focus:border-[#1C1C1E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                Token de Acesso Permanente (Permanent System User Token)
              </label>
              <input
                type="password"
                value={metaAccessToken}
                onChange={(e) => setMetaAccessToken(e.target.value)}
                placeholder="EAABw..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-[13px] font-mono focus:outline-none focus:border-[#1C1C1E]"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Gerado no Meta Business Suite em Usuários do Sistema &gt; Tokens
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Template Customization Section */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-sm">
        <div>
          <h3 className="text-[15px] font-bold text-[#18181B]">
            3. Personalização das Mensagens Automáticas
          </h3>
          <p className="text-[12.5px] text-zinc-500 mt-0.5">
            Defina o texto exato que seus clientes receberão com variáveis dinâmicas.
          </p>
        </div>

        {/* Template Tabs */}
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

        {/* Template Input & Variable Chips */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap text-[11.5px]">
            <span className="text-zinc-500 font-medium">Variáveis disponíveis:</span>
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
            <span className="font-bold text-zinc-700">Prévia como o cliente verá:</span>
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

      {/* 4. Live Test Dispatcher */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-sm">
        <div>
          <h3 className="text-[15px] font-bold text-[#18181B]">
            4. Teste de Disparo ao Vivo
          </h3>
          <p className="text-[12.5px] text-zinc-500 mt-0.5">
            Envie uma mensagem de teste imediata para o seu celular e valide a integração.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            placeholder="+55 (11) 99752-5522"
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
                ? "bg-green-50 border-green-200 text-green-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
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
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-green-700 hover:underline"
                >
                  <span>Abrir conversa no WhatsApp Web ↗</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save & Continue Bar */}
      {showSaveAndContinue && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-8 py-3 rounded-full bg-[#1C1C1E] text-white text-[13.5px] font-semibold hover:bg-black transition-colors shadow-sm"
          >
            Salvar Configurações de WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}
