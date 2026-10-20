import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import {
  FileText,
  Building,
  Calendar,
  ArrowRight,
} from "lucide-react";
import {
  DEFAULT_LEGAL_CONFIG,
  getPendingLegalFields,
  formatLegalValue,
} from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Termos de Uso · LUVEA",
  description:
    "Termos de Uso e condições gerais de contratação da plataforma SaaS LUVEA para profissionais e estúdios de estética e beleza.",
  alternates: {
    canonical: "/termos-de-uso",
  },
  openGraph: {
    title: "Termos de Uso · LUVEA",
    description:
      "Termos de Uso e condições gerais de contratação da plataforma SaaS LUVEA para profissionais e estúdios de estética e beleza.",
    url: "https://luvea.app/termos-de-uso",
    siteName: "LUVEA",
    locale: "pt_BR",
    type: "website",
  },
};

export default function TermosDeUsoPage() {
  const config = DEFAULT_LEGAL_CONFIG;
  const pendingFields = getPendingLegalFields(config);
  const isDraftReviewPending = pendingFields.length > 0;

  const sections = [
    { id: "secao-1", title: "1. Objeto, Natureza do Serviço e Definições" },
    { id: "secao-2", title: "2. Cadastro, Acesso e Segurança da Conta" },
    { id: "secao-3", title: "3. Teste Grátis, Planos de Assinatura e Pagamentos" },
    { id: "secao-4", title: "4. Agendamento Online e Sinal Pix Anti-No-Show" },
    { id: "secao-5", title: "5. Papéis perante a LGPD: Controlador e Operador" },
    { id: "secao-6", title: "6. Fichas de Atendimento (Anamnese) e Galeria de Fotos" },
    { id: "secao-7", title: "7. Recepção IA no WhatsApp e Mensageria" },
    { id: "secao-8", title: "8. Propriedade Intelectual e Licença de Uso" },
    { id: "secao-9", title: "9. Disponibilidade, Manutenção e Limitação de Responsabilidade" },
    { id: "secao-10", title: "10. Cancelamento, Rescisão e Exportação de Dados" },
    { id: "secao-11", title: "11. Suporte Técnico, Canais de Contato e Foro" },
  ];

  return (
    <div className="py-12 sm:py-20 bg-stone-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Document Header */}
        <div className="space-y-4 border-b border-zinc-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-zinc-200 bg-white text-zinc-700 text-[11px] font-mono uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-zinc-700" />
            <span>Documento Jurídico Operacional · Versão {config.versaoDocumento}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#18181B] tracking-tight">
            Termos de Uso da Plataforma LUVEA
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Última atualização: {formatLegalValue(config.dataVigencia, "data de vigência a preencher")}
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
              Minuta Operacional · Revisão Jurídica Prévia
            </p>
            <p className="leading-relaxed text-zinc-600 font-sans">
              Esta página consolida os parâmetros contratuais da plataforma LUVEA.
              Campos marcados como{" "}
              <code className="px-1.5 py-0.5 rounded border border-zinc-200 bg-white font-mono text-[11px] text-zinc-800">
                [a preencher]
              </code>{" "}
              serão formalizados junto à assessoria jurídica societária antes do início de cobranças em produção.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Table of Contents (Desktop) */}
          <nav
            aria-label="Sumário dos Termos de Uso"
            className="lg:col-span-4 sticky top-24 rounded-2xl p-5 bg-white border border-zinc-200 shadow-2xs space-y-3"
          >
            <p className="font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500">
              Sumário dos Termos
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
                href="/politica-de-privacidade"
                className="text-xs font-semibold text-zinc-900 hover:underline inline-flex items-center gap-1"
              >
                <span>Ver Política de Privacidade (LGPD)</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </nav>

          {/* Legal Clauses Content */}
          <main className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-2xs space-y-10 text-zinc-800 text-sm sm:text-[14.5px] leading-relaxed font-sans">
            {/* Seção 1 */}
            <section id="secao-1" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                1. Objeto, Natureza do Serviço e Definições
              </h2>
              <p>
                Estes Termos de Uso regem o acesso e a utilização da plataforma
                SaaS <strong>LUVEA</strong>, de titularidade de{" "}
                <strong className="font-mono">
                  {formatLegalValue(config.razaoSocial, "Razão Social a preencher")}
                </strong>
                , inscrita no CNPJ sob o nº{" "}
                <strong className="font-mono">
                  {formatLegalValue(config.cnpj, "CNPJ a preencher")}
                </strong>
                , com sede em{" "}
                <span className="font-mono">
                  {formatLegalValue(config.enderecoCompleto, "Endereço a preencher")}
                </span>
                .
              </p>
              <p>
                A LUVEA é um software como serviço (SaaS) especializado na
                gestão operacional, agendamento online inteligente, ponto de
                venda (PDV), controle de comissões e prontuários digitais para
                estúdios, clínicas e profissionais autônomos de estética, beleza
                e bem-estar.
              </p>
              <dl className="my-4 divide-y divide-zinc-200 border-y border-zinc-200 py-1 text-xs sm:text-[13px]">
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-mono text-zinc-900 font-semibold uppercase tracking-wider text-[11px]">
                    Profissional / Contratante
                  </dt>
                  <dd className="sm:col-span-2 text-zinc-600 mt-0.5 sm:mt-0">
                    O indivíduo ou pessoa jurídica que contrata a licença de uso da plataforma SaaS.
                  </dd>
                </div>
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-mono text-zinc-900 font-semibold uppercase tracking-wider text-[11px]">
                    Cliente
                  </dt>
                  <dd className="sm:col-span-2 text-zinc-600 mt-0.5 sm:mt-0">
                    O consumidor final que agenda atendimentos e consome serviços estéticos prestados pelo Contratante.
                  </dd>
                </div>
                <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-mono text-zinc-900 font-semibold uppercase tracking-wider text-[11px]">
                    Plano
                  </dt>
                  <dd className="sm:col-span-2 text-zinc-600 mt-0.5 sm:mt-0">
                    O pacote de serviços contratado (Essencial, Gold ou Platinum), com seus respectivos limites.
                  </dd>
                </div>
              </dl>
            </section>

            {/* Seção 2 */}
            <section id="secao-2" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                2. Cadastro, Acesso e Segurança da Conta
              </h2>
              <p>
                Para utilizar a plataforma, o Contratante deve criar uma conta
                fornecendo dados cadastrais verídicos, completos e atualizados.
              </p>
              <p>
                O Contratante é o único responsável pela guarda e
                confidencialidade de suas credenciais de acesso (e-mail e senha).
                Qualquer atividade realizada por meio da sua conta será
                presumida como autorizada pelo titular. Havendo suspeita de
                acesso indevido, o Contratante deve notificar imediatamente o
                suporte da LUVEA.
              </p>
            </section>

            {/* Seção 3 */}
            <section id="secao-3" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                3. Teste Grátis, Planos de Assinatura e Pagamentos
              </h2>
              <p>
                <strong>3.1. Teste Grátis:</strong> Novos usuários têm direito a
                14 (quatorze) dias corridos de teste grátis, sem necessidade de
                informar dados de cartão de crédito. Ao término do período, o
                acesso pode ser bloqueado até a escolha de um Plano pago.
              </p>
              <p>
                <strong>3.2. Planos e Valores:</strong> Os planos disponíveis
                (Essencial, Gold e Platinum), seus valores mensais ou anuais e
                seus limites operacionais constam expressamente na página de{" "}
                <Link href="/precos" className="font-semibold underline">
                  Preços
                </Link>
                .
              </p>
              <p>
                <strong>3.3. Renovação Automática e Cancelamento:</strong> As
                assinaturas são renovadas automaticamente ao final de cada ciclo
                (mensal ou anual). O cancelamento pode ser efetuado a qualquer
                momento diretamente no painel de configurações, sem multas ou
                cláusulas de fidelidade nos planos mensais.
              </p>
              <p>
                <strong>3.4. Direito de Arrependimento (CDC):</strong> Conforme o
                artigo 49 do Código de Defesa do Consumidor, na primeira
                contratação o Contratante tem até 7 (sete) dias corridos para
                solicitar o cancelamento com reembolso integral de valores pagos.
              </p>
            </section>

            {/* Seção 4 */}
            <section id="secao-4" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                4. Agendamento Online e Sinal Pix Anti-No-Show
              </h2>
              <p>
                A LUVEA disponibiliza tecnologia para agendamento online e
                cobrança de taxa de reserva (Sinal Pix Obrigatório), com o intuito
                de mitigar o absenteísmo e as faltas de clientes (no-shows).
              </p>
              <p>
                Os valores de Sinal Pix pagos pelos Clientes são creditados
                diretamente na conta de pagamento do Contratante via gateway
                integrado (Mercado Pago). A LUVEA não realiza a intermediação
                financeira dos valores dos serviços prestados, não retém saldos e
                não é responsável por disputas comerciais ou estornos entre o
                Contratante e seus Clientes finais.
              </p>
            </section>

            {/* Seção 5 */}
            <section id="secao-5" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                5. Papéis perante a LGPD: Controlador e Operador
              </h2>
              <p>
                Em conformidade com a Lei Geral de Proteção de Dados (Lei nº
                13.709/2018 - LGPD):
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>O Contratante (Estúdio / Profissional)</strong> atua
                  como <strong>Controlador</strong> dos dados pessoais de seus
                  Clientes e colaboradores inseridos na plataforma, competindo a
                  ele definir as bases legais de tratamento e coletar o
                  consentimento quando aplicável.
                </li>
                <li>
                  <strong>A LUVEA</strong> atua como <strong>Operadora</strong>
                  , tratando os dados exclusivamente segundo as instruções do
                  Contratante e para os fins necessários à execução do software.
                </li>
              </ul>
            </section>

            {/* Seção 6 */}
            <section id="secao-6" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                6. Fichas de Atendimento (Anamnese) e Galeria de Fotos
              </h2>
              <p>
                A plataforma permite o registro de dados sensíveis de saúde e
                estética (alergias, histórico médico, procedimentos realizados)
                e o upload de imagens de &ldquo;antes e depois&rdquo;.
              </p>
              <p>
                O Contratante assume a responsabilidade exclusiva de obter a
                autorização prévia, expressa e inequívoca do Cliente final tanto
                para o tratamento de dados de saúde quanto para o registro e
                armazenamento fotográfico de sua imagem, isentando a LUVEA de
                qualquer penalidade decorrente de coleta sem consentimento.
              </p>
            </section>

            {/* Seção 7 */}
            <section id="secao-7" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                7. Recepção IA no WhatsApp e Mensageria
              </h2>
              <p>
                O módulo de Recepção IA e disparo de campanhas utiliza
                conectores com a API oficial do WhatsApp. O Contratante
                compromete-se a não utilizar a plataforma para envio de spam,
                mensagens abusivas ou em desacordo com as políticas da Meta /
                WhatsApp. O uso indevido de canais de mensageria pode acarretar a
                suspensão do módulo no painel.
              </p>
            </section>

            {/* Seção 8 */}
            <section id="secao-8" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                8. Propriedade Intelectual e Licença de Uso
              </h2>
              <p>
                Todos os direitos de propriedade intelectual sobre o software
                LUVEA, incluindo código-fonte, design de interfaces, marcas,
                algoritmos e bancos de dados pertencem exclusivamente à
                LUVEA. É concedida ao Contratante uma licença de uso
                temporária, não exclusiva e intransferível durante a vigência do
                plano contratado.
              </p>
            </section>

            {/* Seção 9 */}
            <section id="secao-9" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                9. Disponibilidade, Manutenção e Limitação de Responsabilidade
              </h2>
              <p>
                A LUVEA envida seus melhores esforços técnicos para assegurar
                disponibilidade contínua da aplicação (meta de 99,5% de uptime).
                Paradas programadas para manutenções preventivas serão anunciadas
                com antecedência razoável.
              </p>
              <p>
                A plataforma não se responsabiliza por indisponibilidades
                decorrentes de falhas em operadoras de telecomunicação,
                instabilidades no gateway Mercado Pago ou interrupções no
                serviço do WhatsApp.
              </p>
            </section>

            {/* Seção 10 */}
            <section id="secao-10" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                10. Cancelamento, Rescisão e Exportação de Dados
              </h2>
              <p>
                Em caso de cancelamento da assinatura pelo Contratante, a conta
                permanecerá ativa até o encerramento do ciclo pago. A LUVEA
                garante ao Contratante o direito de exportar seus cadastros de
                clientes, histórico de vendas e dados financeiros em formato
                aberto (CSV / JSON) antes da desativação definitiva.
              </p>
            </section>

            {/* Seção 11 */}
            <section id="secao-11" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                11. Suporte Técnico, Canais de Contato e Foro
              </h2>
              <p>
                Dúvidas, suporte técnico e solicitações relativas a estes Termos
                devem ser encaminhadas para{" "}
                <strong className="font-mono text-zinc-900">
                  {formatLegalValue(config.emailSuporte, "e-mail de suporte a preencher")}
                </strong>
                .
              </p>
              <p>
                Estes Termos são regidos pelas leis da República Federativa do
                Brasil. Para a resolução de eventuais litígios que não possam ser
                solucionados amigavelmente, fica eleito o Foro da{" "}
                <strong className="font-mono text-zinc-900">
                  {formatLegalValue(config.cidadeEstadoForo, "Comarca a preencher")}
                </strong>
                , com expressa renúncia a qualquer outro, por mais privilegiado
                que seja.
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
