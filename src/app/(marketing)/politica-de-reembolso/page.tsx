import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building,
  Calendar,
  ArrowRight,
  RefreshCcw,
} from "lucide-react";
import {
  DEFAULT_LEGAL_CONFIG,
  getPendingLegalFields,
  formatLegalValue,
} from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Política de Reembolso e Cancelamento · LUVEA",
  description:
    "Política de Reembolso, Cancelamento e Devoluções da plataforma LUVEA em conformidade com o Código de Defesa do Consumidor (CDC) e a legislação brasileira.",
  alternates: {
    canonical: "/politica-de-reembolso",
  },
  openGraph: {
    title: "Política de Reembolso e Cancelamento · LUVEA",
    description:
      "Política de Reembolso, Cancelamento e Devoluções da plataforma LUVEA em conformidade com o Código de Defesa do Consumidor (CDC) e a legislação brasileira.",
    url: "https://luvea.app/politica-de-reembolso",
    siteName: "LUVEA",
    locale: "pt_BR",
    type: "website",
  },
};

export default function PoliticaDeReembolsoPage() {
  const config = DEFAULT_LEGAL_CONFIG;
  const pendingFields = getPendingLegalFields(config);
  const isDraftReviewPending = pendingFields.length > 0;

  const sections = [
    { id: "reemb-1", title: "1. Objeto, Escopo e Legislação Aplicável" },
    { id: "reemb-2", title: "2. Distinção das Duas Camadas de Relação Contratual" },
    { id: "reemb-3", title: "3. Assinatura SaaS LUVEA: Período de Teste e Arrependimento (CDC Art. 49)" },
    { id: "reemb-4", title: "4. Cancelamento de Planos Mensais e Anuais da Plataforma" },
    { id: "reemb-5", title: "5. Agendamentos Online e Sinal Pix Anti-No-Show" },
    { id: "reemb-6", title: "6. Pacotes de Sessões e Procedimentos Recorrentes" },
    { id: "reemb-7", title: "7. Vale-Presentes Digitais (Gift Cards)" },
    { id: "reemb-8", title: "8. Falhas Técnicas, Indisponibilidade de SLA e Vício de Serviço" },
    { id: "reemb-9", title: "9. Prazos, Meios de Restituição Bancária e Taxas" },
    { id: "reemb-10", title: "10. Procedimento de Solicitação, Suporte e Foro" },
  ];

  return (
    <div className="py-12 sm:py-20 bg-stone-50/50 dark:bg-[#09090b]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Document Header */}
        <div className="space-y-4 border-b border-zinc-200 dark:border-[#27272a] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 text-[11px] font-mono uppercase tracking-wider">
            <RefreshCcw className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
            <span>Código de Defesa do Consumidor · Versão {config.versaoDocumento}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#18181B] dark:text-white tracking-tight">
            Política de Reembolso e Cancelamento
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
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Lei nº 8.078/1990 (CDC) &amp; Dec. nº 7.962/2013
            </span>
          </div>
        </div>

        {/* Pre-launch Legal Counsel Notice (Minimalist Editorial Note) */}
        {isDraftReviewPending && (
          <div className="border-l-2 border-zinc-900 bg-zinc-50 pl-4 pr-3 py-3 text-xs text-zinc-700 space-y-1">
            <p className="font-semibold text-zinc-900 tracking-tight">
              Minuta Operacional · Conformidade com a Legislação Brasileira
            </p>
            <p className="leading-relaxed text-zinc-600 font-sans">
              Esta política foi estruturada rigorosamente sob os ditames da Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor), Decreto Federal nº 7.962/2013 (Comércio Eletrônico) e Resoluções do Banco Central do Brasil para arranjos Pix.
              Campos marcados como{" "}
              <code className="px-1.5 py-0.5 rounded border border-zinc-200 bg-white font-mono text-[11px] text-zinc-800">
                [a preencher]
              </code>{" "}
              serão formalizados junto à assessoria jurídica societária antes do início das cobranças em produção.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Table of Contents (Desktop) */}
          <nav
            aria-label="Sumário da Política de Reembolso"
            className="lg:col-span-4 lg:sticky lg:top-24 rounded-2xl p-5 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] shadow-sm space-y-3"
          >
            <p className="font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
              Sumário da Política
            </p>
            <ul className="space-y-1.5 text-xs font-sans text-zinc-600 dark:text-zinc-300">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    className="block py-1 hover:text-black dark:hover:text-white hover:underline transition-colors"
                  >
                    {sec.title}
                  </a>
                </li>
              ))}
            </ul>
            <div className="pt-3 border-t border-zinc-100 dark:border-[#27272a] space-y-2">
              <Link
                href="/termos-de-uso"
                className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline flex items-center justify-between"
              >
                <span>Termos de Uso</span>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
              </Link>
              <Link
                href="/politica-de-privacidade"
                className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline flex items-center justify-between"
              >
                <span>Política de Privacidade (LGPD)</span>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
              </Link>
            </div>
          </nav>

          {/* Legal Clauses Content */}
          <main className="lg:col-span-8 bg-white dark:bg-[#18181b] rounded-3xl p-6 sm:p-10 border border-zinc-200 dark:border-[#27272a] shadow-sm space-y-10 text-zinc-800 dark:text-zinc-300 text-sm sm:text-[14.5px] leading-relaxed font-sans">
            {/* Cláusula 1 */}
            <section id="reemb-1" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                1. Objeto, Escopo e Legislação Aplicável
              </h2>
              <p>
                A presente <strong>Política de Reembolso e Cancelamento</strong> estabelece os princípios, prazos e procedimentos operacionais aplicáveis a estornos, rescisões contratuais, devoluções de pagamentos e cancelamentos no âmbito do ecossistema <strong>LUVEA</strong>, de titularidade de{" "}
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
                Este instrumento é regido integralmente pela legislação da República Federativa do Brasil, em especial:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-[13.5px] text-zinc-700 dark:text-zinc-300">
                <li>
                  <strong>Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor - CDC)</strong>, notadamente os artigos 20, 35, 42 e 49;
                </li>
                <li>
                  <strong>Decreto Federal nº 7.962/2013 (Decreto do Comércio Eletrônico)</strong>, que regulamenta a contratação no comércio eletrônico e o dever de facilitação do direito de arrependimento;
                </li>
                <li>
                  <strong>Lei Federal nº 10.406/2002 (Código Civil Brasileiro)</strong>, com ênfase na boa-fé objetiva (art. 422) e vedação ao enriquecimento sem causa (art. 884);
                </li>
                <li>
                  <strong>Resoluções do Banco Central do Brasil (BCB)</strong> atinentes ao arranjo de pagamentos instantâneos Pix e ao Mecanismo Especial de Devolução (MED);
                </li>
                <li>
                  <strong>Lei Federal nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD)</strong>, quanto à guarda e expurgo de dados transacionais.
                </li>
              </ul>
            </section>

            {/* Cláusula 2 */}
            <section id="reemb-2" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                2. Distinção das Duas Camadas de Relação Contratual
              </h2>
              <p>
                Para assegurar transparência irrestrita e precisão técnica, as regras de reembolso distinguem de forma inequívoca dois níveis de contratação operados no software:
              </p>
              <dl className="my-4 divide-y divide-zinc-200 border-y border-zinc-200 py-1 text-xs sm:text-[13px]">
                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold uppercase tracking-wider text-[11px]">
                    Camada A · SaaS LUVEA (B2B / B2Pro)
                  </dt>
                  <dd className="sm:col-span-2 text-zinc-600 dark:text-zinc-300">
                    Contratação da licença de uso do software como serviço firmada entre a <strong>LUVEA</strong> e o <strong>Contratante</strong> (profissional autônomo, clínica, salão ou estúdio de beleza). Abrange mensalidades, planos anuais, créditos de IA e módulos da plataforma.
                  </dd>
                </div>
                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold uppercase tracking-wider text-[11px]">
                    Camada B · Atendimentos nos Estúdios (B2C)
                  </dt>
                  <dd className="sm:col-span-2 text-zinc-600 dark:text-zinc-300">
                    Relação de prestação de serviços estéticos e venda de produtos estabelecida diretamente entre o <strong>Estúdio/Profissional</strong> e seu <strong>Cliente Final</strong>. A LUVEA atua exclusivamente como provedora de tecnologia e facilitadora de checkout (Sinal Pix, faturas e agendamento online).
                  </dd>
                </div>
              </dl>
            </section>

            {/* Cláusula 3 */}
            <section id="reemb-3" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                3. Assinatura SaaS LUVEA: Período de Teste e Arrependimento (CDC Art. 49)
              </h2>
              <p>
                A LUVEA disponibiliza a todos os novos usuários um <strong>período de teste gratuito (free trial) de 14 (quatorze) dias corridos</strong> para experimentação completa das funcionalidades da plataforma, sem necessidade de pagamento prévio e sem cobrança automática surpresa ao final do período.
              </p>
              <p>
                Após a contratação de um plano pago (mensal ou anual), é assegurado ao Contratante o <strong>direito de arrependimento no prazo de 7 (sete) dias corridos</strong> a contar da data da assinatura inicial ou da aprovação do primeiro pagamento, nos termos expressos do <strong>artigo 49 do Código de Defesa do Consumidor</strong> e do Decreto Federal nº 7.962/2013.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-[13.5px]">
                <li>
                  <strong>Reembolso Integral (100%):</strong> Durante o prazo de 7 dias, a solicitação de cancelamento resultará na devolução de 100% dos valores pagos pela assinatura, monetariamente atualizados, sem qualquer incidência de taxa administrativa, multa ou retenção.
                </li>
                <li>
                  <strong>Sem Ônus ou Burocracia:</strong> O exercício do direito de arrependimento pode ser realizado com 1 clique diretamente pelo painel administrativo da conta ou mediante simples mensagem enviada aos canais oficiais de suporte.
                </li>
              </ul>
            </section>

            {/* Cláusula 4 */}
            <section id="reemb-4" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                4. Cancelamento de Planos Mensais e Anuais da Plataforma
              </h2>
              <p>
                Decorrido o prazo legal de 7 dias de arrependimento, as rescisões de planos da plataforma observarão as seguintes diretrizes contratuais:
              </p>
              <div className="space-y-3 text-xs sm:text-[13.5px]">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-[#27272a] space-y-1.5">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                    Planos Mensais
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-300">
                    O Contratante pode cancelar a renovação da assinatura a qualquer instante através das configurações do painel. O cancelamento interrompe cobranças futuras imediatamente. O acesso à plataforma permanece ativo até o último dia do ciclo mensal já quitado, não havendo reembolso retroativo proporcional de frações de dias do ciclo em curso.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-[#27272a] space-y-1.5">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                    Planos Anuais
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-300">
                    Em caso de cancelamento antecipado de plano anual com pagamento antecipado, é vedada qualquer cláusula confiscatória que retenha a totalidade das mensalidades futuras não fruídas. O Contratante terá direito à <strong>restituição proporcional (pro-rata temporis)</strong> calculada sobre os meses integrais vincendos, deduzindo-se apenas a diferença entre o desconto concedido na anuidade e a tarifa mensal avulsa dos meses já utilizados, em perfeita harmonia com o art. 884 do Código Civil.
                  </p>
                </div>
              </div>
            </section>

            {/* Cláusula 5 */}
            <section id="reemb-5" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                5. Agendamentos Online e Sinal Pix Anti-No-Show
              </h2>
              <p>
                O sistema LUVEA disponibiliza tecnologia para cobrança de <strong>Sinal Pix (Taxa de Reserva de Horário)</strong> com confirmação bancária em tempo real, visando mitigar o absenteísmo e as faltas sem aviso prévio (no-show) que causam prejuízos severos à grade dos profissionais.
              </p>
              <p>
                As condições de reembolso do sinal obedecem aos preceitos da boa-fé objetiva (art. 422 do Código Civil) e da transparência informativa:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-[13.5px]">
                <li>
                  <strong>Cancelamento com Antecedência pelo Cliente:</strong> Quando o cliente cancelar ou solicitar reagendamento respeitando a janela mínima estipulada pelo estabelecimento (padrão de 24 a 48 horas de antecedência, informada ostensivamente antes do pagamento no checkout público), o valor pago como sinal Pix será <strong>reembolsado integralmente (100%)</strong> ou convertido em crédito para nova data, conforme escolha do cliente.
                </li>
                <li>
                  <strong>Cancelamento Tardio ou Não Comparecimento Injustificado (No-Show):</strong> Caso o cliente não compareça ao horário reservado ou cancele sem a antecedência mínima pactuada, a retenção do sinal pago possui natureza de arras penitenciais compensatórias (art. 420 do Código Civil), destinando-se a cobrir a ociosidade do profissional e os custos de mobilização de sala ou aparelho reservados com exclusividade.
                </li>
                <li>
                  <strong>Cancelamento Iniciado pelo Profissional ou Estúdio:</strong> Se o estúdio ou o profissional precisar desmarcar ou remarcar o atendimento por motivos de força maior ou imprevisto técnico, o cliente final terá direito ao <strong>estorno imediato e integral de 100%</strong> do sinal pago, acrescido da opção de reagendamento em horário prioritário.
                </li>
              </ul>
            </section>

            {/* Cláusula 6 */}
            <section id="reemb-6" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                6. Pacotes de Sessões e Procedimentos Recorrentes
              </h2>
              <p>
                Para pacotes de múltiplas sessões (ex.: tratamentos estéticos de 5 ou 10 sessões) ou clubes de assinatura de procedimentos adquiridos no estúdio:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-[13.5px]">
                <li>
                  Em caso de desistência antes do início de qualquer atendimento, assiste ao consumidor o direito ao estorno integral no prazo legal do art. 49 do CDC.
                </li>
                <li>
                  Em caso de desistência no decorrer do tratamento com sessões parciais já executadas, a apuração do saldo reembolsável considerará o valor regular das sessões individuais usufruídas, sendo restituído o saldo financeiro remanescente ao cliente, vedada a imposição de cláusula penal superior a 10% do saldo a devolver.
                </li>
                <li>
                  Em caso de interrupção motivada por razões médicas comprovadas por laudo (ex.: reação adversa, gravidez superveniente ou recomendação clínica), o reembolso das sessões não realizadas será <strong>100% integral</strong>, sem aplicação de qualquer taxa de retenção.
                </li>
              </ul>
            </section>

            {/* Cláusula 7 */}
            <section id="reemb-7" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                7. Vale-Presentes Digitais (Gift Cards)
              </h2>
              <p>
                Os Vale-Presentes gerados pelo sistema contam com código único e prazo de validade especificado no momento da emissão:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-[13.5px]">
                <li>
                  O adquirente do vale-presente poderá exercer o direito de arrependimento em até 7 (sete) dias corridos da compra online, desde que o voucher <strong>não tenha sido resgatado ou utilizado</strong> no estabelecimento.
                </li>
                <li>
                  Uma vez decorrido o prazo de arrependimento ou havendo consumo parcial do saldo, o valor restante permanece como crédito utilizável em serviços ou produtos do estúdio emissor durante o período de validade contratual.
                </li>
              </ul>
            </section>

            {/* Cláusula 8 */}
            <section id="reemb-8" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                8. Falhas Técnicas, Indisponibilidade de SLA e Vício de Serviço
              </h2>
              <p>
                Nos termos do <strong>artigo 20 do Código de Defesa do Consumidor</strong>, o fornecedor de serviços responde pelos vícios de qualidade que os tornem impróprios ao uso:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-[13.5px]">
                <li>
                  <strong>Indisponibilidade Crítica da Plataforma LUVEA:</strong> Caso a plataforma sofra interrupção operacional imprevista por período superior a 24 horas consecutivas decorrente de falha atribuível aos servidores da LUVEA, o Contratante terá direito a crédito compensatório pro-rata abatido na mensalidade seguinte ou estorno correspondente.
                </li>
                <li>
                  <strong>Cobranças Indevidas ou Duplicadas:</strong> Quaisquer débitos cobrados em duplicidade por instabilidade de gateway bancário ou inconsistência técnica serão estornados de imediato com prioridade máxima, no valor integral cobrado a maior.
                </li>
              </ul>
            </section>

            {/* Cláusula 9 */}
            <section id="reemb-9" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                9. Prazos, Meios de Restituição Bancária e Taxas
              </h2>
              <p>
                Após a aprovação formal do pedido de cancelamento ou estorno, os prazos de processamento financeiro seguirão as regras dos arranjos bancários regulados pelo Banco Central do Brasil:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-[#27272a] space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                    Pix Dinâmico
                  </div>
                  <div className="text-lg font-serif font-normal text-zinc-900 dark:text-zinc-100">
                    24h a 48h úteis
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Estorno automático processado diretamente para a conta bancária de origem da chave Pix pagadora.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-[#27272a] space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-blue-700 dark:text-blue-400 font-semibold">
                    Cartão de Crédito
                  </div>
                  <div className="text-lg font-serif font-normal text-zinc-900 dark:text-zinc-100">
                    3 a 5 dias úteis
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Comunicação à credenciadora. O crédito constará em 1 a 2 faturas subsequentes do emissor do cartão.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-[#27272a] space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-400 font-semibold">
                    Boleto Bancário
                  </div>
                  <div className="text-lg font-serif font-normal text-zinc-900 dark:text-zinc-100">
                    Até 5 dias úteis
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Transferência bancária em conta corrente de mesma titularidade e CPF/CNPJ do pagador cadastrado.
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 font-mono">
                A LUVEA não aplica qualquer cobrança de taxas de processamento para cancelamentos solicitados tempestivamente dentro dos prazos legais do CDC.
              </p>
            </section>

            {/* Cláusula 10 */}
            <section id="reemb-10" className="space-y-3 scroll-mt-28">
              <h2 className="font-serif text-2xl font-normal text-[#18181B] border-b border-zinc-100 pb-2">
                10. Procedimento de Solicitação, Suporte e Foro
              </h2>
              <p>
                Para exercer o direito de arrependimento, cancelamento de plano ou solicitação de estorno operacional, o Contratante ou usuário poderá acionar um dos canais oficiais:
              </p>
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-[#27272a] space-y-3 text-xs sm:text-[13.5px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-[#27272a] pb-3">
                  <span className="font-mono text-zinc-500 uppercase tracking-wider text-[11px]">
                    Canal Principal de Suporte
                  </span>
                  <a
                    href={`mailto:${config.emailSuporte}`}
                    className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold hover:underline"
                  >
                    {formatLegalValue(config.emailSuporte, "suporte@luvea.app")}
                  </a>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-[#27272a] pb-3">
                  <span className="font-mono text-zinc-500 uppercase tracking-wider text-[11px]">
                    Prazo Máximo de Resposta
                  </span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100">
                    Até 48 horas úteis para análise e protocolo
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-mono text-zinc-500 uppercase tracking-wider text-[11px]">
                    Comarca e Foro de Eleição
                  </span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100">
                    {formatLegalValue(config.cidadeEstadoForo, "São Paulo - SP")}
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Nos litígios que envolvam consumidores finais (CDC), aplica-se a prerrogativa legal de ajuizamento da ação no foro do domicílio do consumidor (art. 101, I do CDC).
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
