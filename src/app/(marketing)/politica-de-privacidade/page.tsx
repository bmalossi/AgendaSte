import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import {
  Building,
  Calendar,
  Lock,
  ArrowRight,
} from "lucide-react";
import {
  DEFAULT_LEGAL_CONFIG,
  getPendingLegalFields,
  formatLegalValue,
} from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Política de Privacidade (LGPD) · AgendaSte",
  description:
    "Política de Privacidade e proteção de dados pessoais (LGPD) da plataforma AgendaSte. Saiba como dados cadastrais, prontuários de saúde e fotos são tratados com segurança.",
  alternates: {
    canonical: "/politica-de-privacidade",
  },
  openGraph: {
    title: "Política de Privacidade (LGPD) · AgendaSte",
    description:
      "Política de Privacidade e proteção de dados pessoais (LGPD) da plataforma AgendaSte. Saiba como dados cadastrais, prontuários de saúde e fotos são tratados com segurança.",
    url: "https://agendaste.com.br/politica-de-privacidade",
    siteName: "AgendaSte",
    locale: "pt_BR",
    type: "website",
  },
};

export default function PoliticaDePrivacidadePage() {
  const config = DEFAULT_LEGAL_CONFIG;
  const pendingFields = getPendingLegalFields(config);
  const isDraftReviewPending = pendingFields.length > 0;

  const sections = [
    { id: "priv-1", title: "1. Introdução, Escopo e Papéis (Controlador e Operador)" },
    { id: "priv-2", title: "2. Dados Pessoais Tratados pela Plataforma" },
    { id: "priv-3", title: "3. Tratamento Específico de Dados Sensíveis (Saúde e Fotos)" },
    { id: "priv-4", title: "4. Finalidades e Bases Legais do Tratamento" },
    { id: "priv-5", title: "5. Compartilhamento com Subprocessadores Autorizados" },
    { id: "priv-6", title: "6. Segurança da Informação e Criptografia" },
    { id: "priv-7", title: "7. Retenção, Eliminação e Portabilidade de Dados" },
    { id: "priv-8", title: "8. Direitos do Titular de Dados (Art. 18 da LGPD)" },
    { id: "priv-9", title: "9. Cookies e Tecnologias de Monitoramento" },
    { id: "priv-10", title: "10. Incidentes de Segurança e Notificação" },
    { id: "priv-11", title: "11. Encarregado de Dados (DPO) e Contato" },
  ];

  return (
    <div className="py-12 sm:py-20 bg-stone-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Document Header */}
        <div className="space-y-4 border-b border-zinc-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-zinc-200 bg-white text-zinc-700 text-[11px] font-mono uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-zinc-700" />
            <span>Conformidade LGPD (Lei nº 13.709/2018) · Versão {config.versaoDocumento}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#18181B] tracking-tight">
            Política de Privacidade da AgendaSte
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Vigência: {formatLegalValue(config.dataVigencia, "data de vigência a preencher")}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              Razão Social:{" "}
              {config.razaoSocial ? (
                config.razaoSocial
              ) : (
                <span className="px-2 py-0.5 rounded border border-zinc-300 bg-zinc-100 text-zinc-700 font-mono text-[11px]">
                  [Razão Social a preencher]
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Pre-launch Legal Counsel Notice (Minimalist Editorial Note) */}
        {isDraftReviewPending && (
          <div className="border-l-2 border-zinc-900 bg-zinc-50 pl-4 pr-3 py-3 text-xs text-zinc-700 space-y-1">
            <p className="font-semibold text-zinc-900 tracking-tight">
              Minuta de Privacidade (LGPD) · Revisão Jurídica Prévia
            </p>
            <p className="leading-relaxed text-zinc-600 font-sans">
              Esta política foi redigida sob medida para os fluxos da plataforma (fichas de anamnese, galeria de fotos, WhatsApp e pagamentos via Mercado Pago).
              Campos marcados como{" "}
              <code className="px-1.5 py-0.5 rounded border border-zinc-200 bg-white font-mono text-[11px] text-zinc-800">
                [a preencher]
              </code>{" "}
              serão formalizados junto ao Encarregado de Dados (DPO) antes da disponibilização pública definitiva.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Table of Contents */}
          <nav
            aria-label="Sumário da Política de Privacidade"
            className="lg:col-span-4 sticky top-24 rounded-2xl p-5 bg-white border border-zinc-200 shadow-2xs space-y-3"
          >
            <p className="font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500">
              Sumário de Privacidade
            </p>
            <ul className="space-y-1.5 text-xs font-sans text-zinc-600">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    className="block py-1 hover:text-black hover:underline transition-colors"
                  >
                    {sec.title}
                  </a>
                </li>
              ))}
            </ul>
            <div className="pt-3 border-t border-zinc-100">
              <Link
                href="/termos-de-uso"
                className="text-xs font-semibold text-zinc-900 hover:underline inline-flex items-center gap-1"
              >
                <span>Ver Termos de Uso da Plataforma</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </nav>

          {/* Policy Clauses Content */}
          <main className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-2xs space-y-10 text-zinc-800 text-sm sm:text-[14.5px] leading-relaxed font-sans">
            {/* Cláusula 1 */}
            <section id="priv-1" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                1. Introdução, Escopo e Papéis (Controlador e Operador)
              </h2>
              <p>
                A privacidade e a inviolabilidade dos dados de quem atende e de
                quem é atendido são princípios estruturais da AgendaSte. Esta
                Política de Privacidade descreve de forma transparente quais
                dados são coletados, como são tratados e quais medidas de
                segurança são empregadas.
              </p>
              <p>
                Para os efeitos da Lei nº 13.709/2018 (Lei Geral de Proteção de
                Dados Pessoais - LGPD), estabelecem-se com clareza os seguintes
                papéis:
              </p>
              <dl className="my-4 divide-y divide-zinc-200 border-y border-zinc-200 py-1 text-xs sm:text-[13px]">
                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-mono text-zinc-900 font-semibold uppercase tracking-wider text-[11px]">
                    Controlador (Estúdio)
                  </dt>
                  <dd className="sm:col-span-2 text-zinc-600 mt-1 sm:mt-0 leading-relaxed">
                    Pessoa física ou jurídica contratante responsável pelas decisões
                    sobre os dados pessoais de seus clientes finais (nome, telefone, prontuários, fotos e histórico de atendimentos inseridos no software).
                  </dd>
                </div>
                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-mono text-zinc-900 font-semibold uppercase tracking-wider text-[11px]">
                    Operadora (AgendaSte)
                  </dt>
                  <dd className="sm:col-span-2 text-zinc-600 mt-1 sm:mt-0 leading-relaxed">
                    Realiza o tratamento de dados pessoais em nome do Controlador,
                    exclusivamente para viabilizar a execução técnica das ferramentas contratadas (agenda, comissões, recepção IA e armazenamento seguro).
                  </dd>
                </div>
              </dl>
            </section>

            {/* Cláusula 2 */}
            <section id="priv-2" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                2. Dados Pessoais Tratados pela Plataforma
              </h2>
              <p>
                A plataforma processa dados divididos nas seguintes categorias:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Dados Cadastrais do Contratante e Equipe:</strong>{" "}
                  Nome, e-mail, telefone, cargo, percentual de comissão e
                  registros de ponto digital (Timeclock).
                </li>
                <li>
                  <strong>Dados Cadastrais dos Clientes Finais:</strong> Nome
                  completo, número de WhatsApp/celular, data de nascimento e
                  histórico de reservas.
                </li>
                <li>
                  <strong>Dados de Transações Financeiras:</strong> Valores de
                  serviços, pagamentos de Sinal Pix, comprovantes e faturas. A
                  AgendaSte <em>não coleta nem armazena números de cartão de crédito</em>;
                  todas as transações com cartão e Pix são processadas pelo
                  Mercado Pago.
                </li>
                <li>
                  <strong>Conversas da Recepção IA (WhatsApp):</strong> Registros
                  de interações no WhatsApp necessárias para consulta de
                  disponibilidade e confirmação de horários.
                </li>
                <li>
                  <strong>Dados de Acesso Técnico:</strong> Endereço IP, data e
                  hora de acesso e identificador de sessão, em cumprimento ao
                  artigo 15 do Marco Civil da Internet (Lei nº 12.965/2014).
                </li>
              </ul>
            </section>

            {/* Cláusula 3 */}
            <section id="priv-3" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                3. Tratamento Específico de Dados Sensíveis (Saúde e Fotos)
              </h2>
              <p>
                Os módulos de <strong>Fichas de Atendimento (Anamnese)</strong> e{" "}
                <strong>Galeria Auto-Organizada</strong> tratam dados pessoais
                sensíveis (artigo 5º, inciso II da LGPD):
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Fichas de Anamnese:</strong> Histórico de saúde,
                  alergias, contraindicações e observações de procedimentos
                  estéticos. O tratamento destes dados tem como base legal o
                  consentimento do titular ou a tutela da saúde em procedimentos
                  estéticos realizados por profissionais habilitados (art. 11, II,
                  &ldquo;f&rdquo; da LGPD).
                </li>
                <li>
                  <strong>Galeria de Fotos (Antes e Depois):</strong> Imagens de
                  rosto ou corpo registradas para acompanhamento técnico da
                  evolução do tratamento. O Contratante é expressamente advertido
                  de que <em>o upload de fotos depende do consentimento prévio do Cliente</em>.
                </li>
                <li>
                  <strong>Segurança e Isolamento:</strong> As imagens são
                  armazenadas em repositórios em nuvem protegidos por chaves de
                  acesso criptografadas (Cloudflare R2), com links temporários e
                  restritos ao painel do estúdio.
                </li>
              </ul>
            </section>

            {/* Cláusula 4 */}
            <section id="priv-4" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                4. Finalidades e Bases Legais do Tratamento
              </h2>
              <p>
                Todo tratamento de dados realizado pela AgendaSte possui
                finalidade legítima e base legal prevista na LGPD:
              </p>
              <div className="overflow-x-auto my-3">
                <table className="w-full text-left text-xs border border-zinc-200">
                  <thead className="bg-zinc-50 font-mono text-[11px] uppercase tracking-wider text-zinc-700">
                    <tr>
                      <th className="p-3 border-b border-zinc-200">Finalidade</th>
                      <th className="p-3 border-b border-zinc-200">Base Legal (LGPD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-800">
                    <tr>
                      <td className="p-3">Execução do contrato de agendamento e gestão do SaaS</td>
                      <td className="p-3 font-mono text-zinc-600">Art. 7º, V (Execução de Contrato)</td>
                    </tr>
                    <tr>
                      <td className="p-3">Cobrança de Sinal Pix e Venda Rápida de balcão</td>
                      <td className="p-3 font-mono text-zinc-600">Art. 7º, V (Execução de Contrato)</td>
                    </tr>
                    <tr>
                      <td className="p-3">Fichas de anamnese e fotos técnicas de procedimentos</td>
                      <td className="p-3 font-mono text-zinc-600">Art. 11, I (Consentimento) ou II, f (Tutela de Saúde)</td>
                    </tr>
                    <tr>
                      <td className="p-3">Guarda obrigatória de registros de conexão (IP e horário)</td>
                      <td className="p-3 font-mono text-zinc-600">Art. 7º, II (Cumprimento de Obrigação Legal - Marco Civil)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Cláusula 5 */}
            <section id="priv-5" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                5. Compartilhamento com Subprocessadores Autorizados
              </h2>
              <p>
                A AgendaSte não vende, aluga ou compartilha dados pessoais com
                terceiros para fins de marketing ou publicidade. O
                compartilhamento restringe-se estritamente aos subprocessadores de
                tecnologia indispensáveis à prestação dos serviços:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Mercado Pago:</strong> Processamento bancário de Pix
                  Dinâmico, cartões e emissão de cobranças.
                </li>
                <li>
                  <strong>Meta / WhatsApp Business API:</strong> Disparo de
                  confirmações de agendamento 2-way e mensagens da Recepção IA.
                </li>
                <li>
                  <strong>Cloudflare R2:</strong> Armazenamento seguro de objetos
                  em nuvem para imagens da Galeria de Fotos e arquivos de prontuário.
                </li>
                <li>
                  <strong>Vercel:</strong> Infraestrutura de hospedagem e execução
                  da aplicação web em servidores de alta disponibilidade.
                </li>
              </ul>
            </section>

            {/* Cláusula 6 */}
            <section id="priv-6" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                6. Segurança da Informação e Criptografia
              </h2>
              <p>
                Adotamos medidas técnicas e organizacionais rígidas para
                proteger os dados contra acessos não autorizados, perdas,
                alterações ou qualquer forma de tratamento inadequado:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Comunicação 100% criptografada via protocolo TLS 1.3 / HTTPS;</li>
                <li>Políticas de senhas fortes com armazenamento de hashes criptográficos seguros;</li>
                <li>Controle de acesso granular baseado em perfis (acesso restrito por profissional);</li>
                <li>Backups automatizados e testes periódicos de integridade.</li>
              </ul>
            </section>

            {/* Cláusula 7 */}
            <section id="priv-7" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                7. Retenção, Eliminação e Portabilidade de Dados
              </h2>
              <p>
                Os dados são retidos durante o período de vigência da conta do
                Contratante. Caso o Contratante opte pelo cancelamento:
              </p>
              <p>
                <strong>Portabilidade:</strong> O Contratante dispõe de
                ferramenta para exportação integral da sua base de clientes,
                atendimentos e histórico financeiro em formato estruturado (CSV
                ou JSON).
              </p>
              <p>
                <strong>Descarte Seguro:</strong> Após o encerramento do prazo de
                guarda exigido por lei (por exemplo, 6 meses para logs de conexão
                e 5 anos para documentos fiscais), os dados são expurgados de
                forma segura dos nossos servidores.
              </p>
            </section>

            {/* Cláusula 8 */}
            <section id="priv-8" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                8. Direitos do Titular de Dados (Art. 18 da LGPD)
              </h2>
              <p>
                Os titulares de dados pessoais (tanto o Contratante quanto seus
                Clientes) têm direito de solicitar a qualquer momento:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                <li>Confirmação da existência de tratamento;</li>
                <li>Acesso facilitado aos dados tratados;</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
                <li>Revogação do consentimento previamente concedido.</li>
              </ul>
              <div className="border-l-2 border-zinc-300 pl-4 py-1 text-xs text-zinc-600 leading-relaxed my-3">
                <strong className="text-zinc-900 font-semibold">Nota ao consumidor final:</strong> Quando a solicitação for formalizada por um cliente do estúdio, a demanda deve ser direcionada diretamente ao estabelecimento (Controlador), que dispõe dos controles necessários no painel para alteração ou expurgo de fichas cadastrais.
              </div>
            </section>

            {/* Cláusula 9 */}
            <section id="priv-9" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                9. Cookies e Tecnologias de Monitoramento
              </h2>
              <p>
                Utilizamos estritamente cookies necessários para autenticação e
                manutenção de sessão segura no painel operacional. Não
                utilizamos cookies de rastreamento entre sites de terceiros
                (cross-site tracking) nem vendemos perfis comportamentais.
              </p>
            </section>

            {/* Cláusula 10 */}
            <section id="priv-10" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                10. Incidentes de Segurança e Notificação
              </h2>
              <p>
                Na improvável ocorrência de incidente de segurança que possa
                acarretar risco ou dano relevante aos titulares de dados, a
                AgendaSte comunicará imediatamente os Controladores afetados e a
                Autoridade Nacional de Proteção de Dados (ANPD), nos termos do
                artigo 48 da LGPD, adotando as medidas cabíveis para conter e
                mitigar seus efeitos.
              </p>
            </section>

            {/* Cláusula 11 */}
            <section id="priv-11" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                11. Encarregado de Dados (DPO) e Contato
              </h2>
              <p>
                Para exercer seus direitos como titular de dados, esclarecer
                dúvidas sobre esta Política de Privacidade ou contatar nosso{" "}
                <strong>Encarregado de Proteção de Dados (DPO)</strong>, envie
                sua solicitação formal para:
              </p>
              <div className="divide-y divide-zinc-200 border-y border-zinc-200 py-1 text-xs sm:text-[13px] font-mono my-3">
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-zinc-500 uppercase tracking-wider text-[11px]">Encarregado de Dados (DPO)</span>
                  <span className="text-zinc-900 font-medium">
                    {formatLegalValue(config.emailEncarregadoDpo, "e-mail do encarregado a preencher")}
                  </span>
                </div>
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-zinc-500 uppercase tracking-wider text-[11px]">Suporte Operacional</span>
                  <span className="text-zinc-900 font-medium">
                    {formatLegalValue(config.emailSuporte, "e-mail de suporte a preencher")}
                  </span>
                </div>
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-zinc-500 uppercase tracking-wider text-[11px]">Foro Competente</span>
                  <span className="text-zinc-900 font-medium">
                    {formatLegalValue(config.cidadeEstadoForo, "Foro a preencher")}
                  </span>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
