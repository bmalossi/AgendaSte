/**
 * Marketing Content Module & Seam for LUVEA
 * Centralizes navigation, mega menus, conversion resolvers, plans catalog,
 * and legal configuration for the public marketing site.
 */

export interface MenuItem {
  title: string;
  description: string;
  href: string;
  badge?: string;
}

export interface HighlightCard {
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
}

export interface MegaMenuCategory {
  id: string;
  label: string;
  headline: string;
  items: MenuItem[];
  highlight: HighlightCard;
}

export interface BusinessMenuCategory {
  id: string;
  label: string;
  description: string;
  items: MenuItem[];
}

/**
 * Valid destinations allowed for menu and navigation links.
 * Any link outside this list will fail validation.
 */
export const ALLOWED_NAVIGATION_TARGETS = new Set([
  "/",
  "/app",
  "/checkout",
  "/login",
  "/cadastro",
  "/esqueci-senha",
  "/redefinir-senha",
  "/precos",
  "/termos-de-uso",
  "/politica-de-privacidade",
  "/#como-funciona",
  "/#fatos",
  "/#casos-de-uso",
  "/#para-quem-e",
  "/#planos",
  "/#contato",
]);

/**
 * WhatsApp commercial demo conversation resolver.
 * When NEXT_PUBLIC_DEMO_WHATSAPP (or explicit phone parameter) is set, returns wa.me URL.
 * When absent or empty, falls back safely to "/app".
 */
export function resolveDemoWhatsAppUrl(phoneNumber?: string | null): string {
  const raw = phoneNumber ?? process.env.NEXT_PUBLIC_DEMO_WHATSAPP ?? "";
  const phone = raw.replace(/\D/g, "").trim();

  if (!phone) {
    return "/app";
  }

  const defaultMessage =
    "Olá! Gostaria de agendar uma demonstração da plataforma LUVEA para o meu negócio.";
  return `https://wa.me/${phone}?text=${encodeURIComponent(defaultMessage)}`;
}

export function getPrimaryCtaUrl(): string {
  return "/app";
}

export function getLoginUrl(): string {
  return "/app";
}

/**
 * Mega Menu "Como funciona" (6 categories)
 * Reflects real existing modules of LUVEA.
 */
export const HOW_IT_WORKS_MENU: MegaMenuCategory[] = [
  {
    id: "agentes",
    label: "Agentes & IA",
    headline: "Atendimento inteligente que nunca dorme",
    highlight: {
      title: "Recepção IA 24/7 no WhatsApp",
      description:
        "Atende clientes a qualquer hora da noite ou fim de semana, esclarece dúvidas de serviços e agenda horários automaticamente.",
      ctaText: "Ver demonstração da IA",
      ctaHref: "/#como-funciona",
    },
    items: [
      {
        title: "Recepção IA 24/7",
        description: "Atendimento e agendamento sem operador humano",
        href: "/#como-funciona",
      },
      {
        title: "Assistente de Marketing IA",
        description: "Gera textos persuasivos de campanhas em segundos",
        href: "/#como-funciona",
      },
      {
        title: "Confirmação 2-Way no WhatsApp",
        description: "Cliente responde 1 para confirmar e 2 para remarcar",
        href: "/#como-funciona",
      },
    ],
  },
  {
    id: "agendamento",
    label: "Agendamento",
    headline: "Agenda sem furos, pausas sincronizadas e reservas online",
    highlight: {
      title: "Site de Agendamento Online",
      description:
        "Página de alta conversão para o link da bio do Instagram. Seus clientes agendam em menos de 30 segundos pelo celular.",
      ctaText: "Explorar a agenda",
      ctaHref: "/#como-funciona",
    },
    items: [
      {
        title: "Agenda Inteligente & Salto de Semanas",
        description: "Visão diária/semanal e navegação rápida para o futuro",
        href: "/#como-funciona",
      },
      {
        title: "Site de Agendamento Online (Bio)",
        description: "Reserva de serviços 24 horas sem atrito",
        href: "/#como-funciona",
      },
      {
        title: "Tempo de Processamento (Encaixes)",
        description: "Atenda outro cliente durante pausas de química/coloração",
        href: "/#como-funciona",
      },
      {
        title: "Trava de Recursos Físicos",
        description: "Impede reserva dupla de aparelhos a laser, salas e macas",
        href: "/#como-funciona",
      },
      {
        title: "Lista de Espera Inteligente",
        description: "Preenche cancelamentos de última hora com 1 toque",
        href: "/#como-funciona",
      },
    ],
  },
  {
    id: "marketing_crm",
    label: "Marketing & CRM",
    headline: "Fidelização e campanhas para encher a agenda",
    highlight: {
      title: "Campanhas com Filtro de Clientes",
      description:
        "Identifique clientes que não retornam há mais de 30 ou 45 dias e envie ofertas direcionadas com créditos de mensagem.",
      ctaText: "Ver recursos de CRM",
      ctaHref: "/#como-funciona",
    },
    items: [
      {
        title: "Filtro de Clientes Ausentes (+30/45 dias)",
        description: "Reative contatos inativos com ofertas automáticas",
        href: "/#como-funciona",
      },
      {
        title: "Campanhas Segmentadas",
        description: "Mensagens em massa para aniversariantes e serviços VIP",
        href: "/#como-funciona",
      },
      {
        title: "Programa de Indicação",
        description: "Links exclusivos para suas clientes recomendarem amigas",
        href: "/#como-funciona",
      },
    ],
  },
  {
    id: "pagamentos_pdv",
    label: "Pagamentos & PDV",
    headline: "Fim dos no-shows com sinal Pix e caixa ágil",
    highlight: {
      title: "Sinal Pix Obrigatório na Reserva",
      description:
        "Elimine faltas exigindo depósito antecipado via Pix Dinâmico no momento do agendamento online.",
      ctaText: "Ver soluções de pagamento",
      ctaHref: "/#como-funciona",
    },
    items: [
      {
        title: "Venda Rápida (PDV)",
        description: "Fechamento de comanda no balcão em poucos cliques",
        href: "/#como-funciona",
      },
      {
        title: "Sinal Pix Anti-No-Show",
        description: "Cobrança de taxa de reserva com confirmação bancária",
        href: "/#como-funciona",
      },
      {
        title: "Faturas e Cobrança por Link",
        description: "Envie faturas discriminadas via WhatsApp com código Copia e Cola",
        href: "/#como-funciona",
      },
      {
        title: "Pacotes de Sessões & Assinaturas",
        description: "Receita antecipada e planos mensais recorrentes",
        href: "/#como-funciona",
      },
      {
        title: "Vale-Presentes Digitais",
        description: "Venda créditos pré-pagos para presentear no estúdio",
        href: "/#como-funciona",
      },
    ],
  },
  {
    id: "equipe_negocio",
    label: "Equipe & Gestão",
    headline: "Comissões transparentes e ponto digital",
    highlight: {
      title: "Fechamento de Repasse Automático",
      description:
        "Chega de perder horas calculando comissões no Excel. Relatórios de repasse com desconto de taxas em 1 clique.",
      ctaText: "Ver gestão de equipe",
      ctaHref: "/#como-funciona",
    },
    items: [
      {
        title: "Gestão de Profissionais",
        description: "Escalas individuais, percentuais de comissão e horários",
        href: "/#como-funciona",
      },
      {
        title: "Comissões Automatizadas",
        description: "Cálculo preciso por serviço, produto e taxas de cartão",
        href: "/#como-funciona",
      },
      {
        title: "Fechamento de Repasse (Payroll)",
        description: "Demonstrativo detalhado para prestação de contas",
        href: "/#como-funciona",
      },
      {
        title: "Folha de Ponto Digital (Timeclock)",
        description: "Registro de entradas, saídas e intervalos no sistema",
        href: "/#como-funciona",
      },
    ],
  },
  {
    id: "prontuario",
    label: "Prontuário & Fichas",
    headline: "Segurança técnica e histórico de atendimentos",
    highlight: {
      title: "Galeria de Fotos Auto-Organizada",
      description:
        "Fotos de antes e depois são organizadas automaticamente por cliente e por data de atendimento, direto da câmera do celular.",
      ctaText: "Ver prontuários",
      ctaHref: "/#como-funciona",
    },
    items: [
      {
        title: "Fichas de Anamnese Digitais",
        description: "Prontuários técnicos personalizados com consentimento",
        href: "/#como-funciona",
      },
      {
        title: "Galeria de Fotos Antes/Depois",
        description: "Upload direto organizado por sessão de atendimento",
        href: "/#como-funciona",
      },
      {
        title: "Histórico Clínico & Fórmulas",
        description: "Registro de misturas de cor, químicas e observações",
        href: "/#como-funciona",
      },
    ],
  },
];

/**
 * Mega Menu "Negócios" (Segmento e Porte)
 */
export const BUSINESS_MENU: BusinessMenuCategory[] = [
  {
    id: "segmento",
    label: "Por segmento",
    description: "Soluções adaptadas à rotina de cada nicho",
    items: [
      {
        title: "Clínicas de Estética & Biomédicas",
        description: "Fichas de anamnese, trava de macas/laser e termos de saúde",
        href: "/#para-quem-e",
      },
      {
        title: "Salões de Beleza & Coloristas",
        description: "Tempo de pausa para encaixe paralelo e comissões de equipe",
        href: "/#para-quem-e",
      },
      {
        title: "Esmalterias, Cílios & Sobrancelhas",
        description: "Sinal Pix contra faltas e agendamento ágil pelo Instagram",
        href: "/#para-quem-e",
      },
      {
        title: "Barbearias & Centros de Massagem",
        description: "Clubes de assinatura, pacotes e ponto de venda dinâmico",
        href: "/#para-quem-e",
      },
    ],
  },
  {
    id: "porte",
    label: "Por porte",
    description: "De profissionais autônomos a clínicas com equipe",
    items: [
      {
        title: "Profissionais Autônomos",
        description: "Agenda, Recepção IA no WhatsApp e pagamentos",
        href: "/#para-quem-e",
      },
      {
        title: "Estúdios & Espaços Compartilhados",
        description: "Trava de salas compartilhadas e múltiplas agendas",
        href: "/#para-quem-e",
      },
      {
        title: "Clínicas & Grandes Equipes",
        description: "Repasses automáticos, ponto digital e metas",
        href: "/#para-quem-e",
      },
    ],
  },
];

/**
 * Footer link configuration.
 */
export const FOOTER_LINKS = {
  produto: [
    { label: "Como funciona", href: "/#como-funciona" },
    { label: "Para quem é", href: "/#para-quem-e" },
    { label: "Fatos do produto", href: "/#fatos" },
    { label: "Casos de uso", href: "/#casos-de-uso" },
    { label: "Planos & Preços", href: "/precos" },
  ],
  acesso: [
    { label: "Entrar no painel", href: "/app" },
    { label: "Começar teste grátis (14 dias)", href: "/app" },
  ],
  legal: [
    { label: "Termos de Uso", href: "/termos-de-uso" },
    { label: "Política de Privacidade (LGPD)", href: "/politica-de-privacidade" },
  ],
};

/**
 * Validates that every configured navigation link points to a declared valid route or anchor.
 * Returns an array of error messages; empty array indicates all links are valid.
 */
export function validateMarketingDestinations(): string[] {
  const errors: string[] = [];

  const check = (href: string, context: string) => {
    if (!href || typeof href !== "string") {
      errors.push(`Destino vazio ou inválido em: ${context}`);
      return;
    }
    if (!ALLOWED_NAVIGATION_TARGETS.has(href)) {
      errors.push(
        `Destino não permitido ou não declarado "${href}" em: ${context}`
      );
    }
  };

  // Check How it works menu
  for (const cat of HOW_IT_WORKS_MENU) {
    check(cat.highlight.ctaHref, `Como funciona > ${cat.label} (highlight)`);
    for (const item of cat.items) {
      check(item.href, `Como funciona > ${cat.label} > ${item.title}`);
    }
  }

  // Check Business menu
  for (const cat of BUSINESS_MENU) {
    for (const item of cat.items) {
      check(item.href, `Negócios > ${cat.label} > ${item.title}`);
    }
  }

  // Check Footer
  for (const item of FOOTER_LINKS.produto) {
    check(item.href, `Rodapé > Produto > ${item.label}`);
  }
  for (const item of FOOTER_LINKS.acesso) {
    check(item.href, `Rodapé > Acesso > ${item.label}`);
  }
  for (const item of FOOTER_LINKS.legal) {
    check(item.href, `Rodapé > Legal > ${item.label}`);
  }

  return errors;
}


/**
 * Plans Catalog Definition (Single Source of Truth for Pricing)
 */
export interface PricingPlan {
  id: "essencial" | "gold" | "platinum";
  name: string;
  badge?: string;
  tagline: string;
  targetAudience: string;
  monthlyPriceReais: number;
  annualMonthlyPriceReais: number;
  isPopular?: boolean;
  maxStaff: number | "ilimitado";
  maxStaffLabel: string;
  aiReceptionLimit: string;
  marketingCredits: number;
  highlights: string[];
  ctaLabel: string;
}

export const PLANS_CATALOG: PricingPlan[] = [
  {
    id: "essencial",
    name: "Essencial",
    tagline: "Para quem atende sozinho e quer acabar com as faltas.",
    targetAudience: "Profissional autônomo individual",
    monthlyPriceReais: 69,
    annualMonthlyPriceReais: 59,
    isPopular: false,
    maxStaff: 1,
    maxStaffLabel: "1 profissional",
    aiReceptionLimit: "Período de teste incluso",
    marketingCredits: 0,
    highlights: [
      "1 profissional autônomo",
      "Site de Agendamento Online no link da bio",
      "Sinal Pix anti-no-show obrigatório",
      "Agenda Inteligente com tempo de pausa",
      "Venda Rápida (PDV) e faturas digitais",
      "Prontuários com fichas de anamnese",
      "Suporte via e-mail e WhatsApp",
    ],
    ctaLabel: "Começar teste grátis (14 dias)",
  },
  {
    id: "gold",
    name: "Gold",
    badge: "Mais popular",
    tagline: "A potência da Recepção IA para estúdios que querem acelerar.",
    targetAudience: "Estúdios e clínicas de 2 a 9 profissionais",
    monthlyPriceReais: 149,
    annualMonthlyPriceReais: 129,
    isPopular: true,
    maxStaff: 9,
    maxStaffLabel: "Até 9 profissionais",
    aiReceptionLimit: "500 conversas/mês no WhatsApp",
    marketingCredits: 500,
    highlights: [
      "Até 9 profissionais inclusos",
      "Recepção IA 24/7 no WhatsApp (500 conversas/mês)",
      "Trava automática de salas, macas e aparelhos laser",
      "Lista de espera inteligente com 1-tap rebooking",
      "Fechamento de Repasse (Payroll) e folha de ponto digital",
      "Galeria de fotos auto-organizada antes/depois",
      "500 créditos de marketing e campanhas segmentadas",
      "Suporte prioritário humanizado",
    ],
    ctaLabel: "Começar teste grátis (14 dias)",
  },
  {
    id: "platinum",
    name: "Platinum",
    badge: "Sem limites",
    tagline: "Operação completa sem limites para grandes clínicas e salões.",
    targetAudience: "Clínicas, centros de beleza e equipes com 10+ especialistas",
    monthlyPriceReais: 399,
    annualMonthlyPriceReais: 349,
    isPopular: false,
    maxStaff: "ilimitado",
    maxStaffLabel: "Profissionais ilimitados",
    aiReceptionLimit: "Conversas ilimitadas no WhatsApp",
    marketingCredits: 2500,
    highlights: [
      "Profissionais ilimitados",
      "Recepção IA ilimitada no WhatsApp dia e noite",
      "Recursos físicos e salas compartilhadas sem limite",
      "Fechamento de repasse multi-comissão avançado",
      "2.500 créditos de mensagens para campanhas em massa",
      "Assistente de Marketing IA para redação de ofertas",
      "Gerente de conta e onboarding dedicado",
    ],
    ctaLabel: "Começar teste grátis (14 dias)",
  },
];

/**
 * FAQ Items (Portuguese, neutral, honest, no false promises)
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "O que está incluso no Teste Grátis de 14 dias?",
    answer:
      "Você tem acesso irrestrito a todos os recursos da plataforma durante 14 dias corridos: agendamento online, Recepção IA, ponto de venda Pix, controle de equipe e prontuários. Não pedimos cartão de crédito para iniciar o teste.",
  },
  {
    question: "Qual a diferença entre os planos Essencial, Gold e Platinum?",
    answer:
      "A principal diferença está na quantidade de profissionais cadastrados na equipe (1 no Essencial, até 9 no Gold e ilimitados no Platinum), no volume de conversas da Recepção IA no WhatsApp (incluso no teste no Essencial, 500/mês no Gold e ilimitado no Platinum) e no pacote de créditos para campanhas de marketing.",
  },
  {
    question: "Como funciona a cobrança do Pix Dinâmico e quais são as taxas?",
    answer:
      "O sinal Pix e as cobranças de balcão são processados diretamente na sua conta integrada ao Mercado Pago. A LUVEA não retém seu dinheiro e não cobra taxa de intermediação percentual sobre suas vendas; aplicam-se apenas as taxas padrão da sua conta de pagamentos.",
  },
  {
    question: "Posso migrar meus dados de clientes e serviços de outro sistema?",
    answer:
      "Sim! O LUVEA conta com um assistente de importação que permite carregar listas de clientes e serviços a partir de planilhas CSV ou do caderno tradicional em poucos cliques.",
  },
  {
    question: "O que acontece se minha equipe aumentar?",
    answer:
      "Você pode realizar o upgrade de plano a qualquer momento diretamente pelas Configurações do seu painel. O ajuste de valor é proporcional aos dias restantes do ciclo.",
  },
  {
    question: "Como a Recepção IA funciona no meu WhatsApp?",
    answer:
      "A assistente é conectada com segurança ao número do seu estúdio e treinada com os seus serviços, preços, profissionais e regras de horário. Ela atende clientes 24 horas por dia, esclarece dúvidas e bloqueia horários na agenda assim que o sinal Pix é confirmado.",
  },
  {
    question: "Existe fidelidade ou multa se eu quiser cancelar?",
    answer:
      "Não há cláusula de fidelidade nos planos mensais. Você pode cancelar sua assinatura a qualquer momento com apenas 1 clique no painel, sem burocracia ou cobrança de multa.",
  },
  {
    question: "Meus dados e fotos de clientes estão seguros perante a LGPD?",
    answer:
      "Sim. Prontuários, fichas de anamnese e fotos de antes/depois são tratados sob rígidos padrões de segurança da informação, com controle de acesso por profissional e respeito integral aos direitos dos titulares garantidos pela LGPD.",
  },
];


/**
 * Feature Comparison Matrix Schema & Data for /precos
 */
export type FeatureValue = boolean | string;

export interface PlanFeatureRow {
  name: string;
  description?: string;
  module:
    | "reception"
    | "scheduling"
    | "payments"
    | "clients"
    | "team"
    | "marketing";
  values: {
    essencial: FeatureValue;
    gold: FeatureValue;
    platinum: FeatureValue;
  };
}

export interface FeatureGroup {
  id: string;
  name: string;
  features: PlanFeatureRow[];
}

export const FEATURE_COMPARISON_GROUPS: FeatureGroup[] = [
  {
    id: "ai",
    name: "Colegas de IA",
    features: [
      {
        name: "Recepção IA 24/7 no WhatsApp",
        description: "Atendimento automático dia e noite com fechamento de reservas",
        module: "reception",
        values: {
          essencial: "Período de teste",
          gold: "500 conversas/mês",
          platinum: "Ilimitada",
        },
      },
      {
        name: "Assistente de Marketing IA",
        description: "Geração de rascunhos persuasivos para campanhas e WhatsApp",
        module: "marketing",
        values: {
          essencial: false,
          gold: true,
          platinum: true,
        },
      },
    ],
  },
  {
    id: "scheduling",
    name: "Agendamento & Calendário",
    features: [
      {
        name: "Site de Agendamento Online (Link da Bio)",
        description: "Página pública rápida para reserva em menos de 30 segundos",
        module: "scheduling",
        values: {
          essencial: true,
          gold: true,
          platinum: true,
        },
      },
      {
        name: "Agenda Inteligente & Salto de Semanas",
        description: "Visualização ágil de horários e pulo rápido de +2 a +8 semanas",
        module: "scheduling",
        values: {
          essencial: true,
          gold: true,
          platinum: true,
        },
      },
      {
        name: "Tempo de Processamento (Pausas e Encaixes)",
        description: "Encaixes paralelos programados durante pausas químicas",
        module: "scheduling",
        values: {
          essencial: true,
          gold: true,
          platinum: true,
        },
      },
      {
        name: "Trava de Recursos Físicos (Salas, Lasers, Macas)",
        description: "Bloqueio automático contra reserva dupla de equipamentos compartilhados",
        module: "scheduling",
        values: {
          essencial: false,
          gold: true,
          platinum: true,
        },
      },
      {
        name: "Lista de Espera com 1-Tap Rebooking",
        description: "Preenchimento instantâneo de desistências de última hora",
        module: "scheduling",
        values: {
          essencial: false,
          gold: true,
          platinum: true,
        },
      },
    ],
  },
  {
    id: "payments",
    name: "Pagamentos & PDV",
    features: [
      {
        name: "Venda Rápida (PDV de Balcão)",
        description: "Fechamento de comandas de serviços e produtos em segundos",
        module: "payments",
        values: {
          essencial: true,
          gold: true,
          platinum: true,
        },
      },
      {
        name: "Sinal Pix Obrigatório Anti-No-Show",
        description: "Cobrança de taxa de reserva para eliminar faltas",
        module: "payments",
        values: {
          essencial: true,
          gold: true,
          platinum: true,
        },
      },
      {
        name: "Faturas Detalhadas & Cobrança por Link",
        description: "Envio de faturas discriminadas via WhatsApp com Copia e Cola",
        module: "payments",
        values: {
          essencial: true,
          gold: true,
          platinum: true,
        },
      },
      {
        name: "Pacotes de Sessões & Assinaturas Mensais",
        description: "Venda recorrente de planos e controle de sessões contratadas",
        module: "payments",
        values: {
          essencial: true,
          gold: true,
          platinum: true,
        },
      },
      {
        name: "Vale-Presentes Digitais",
        description: "Emissão e resgate de cartões pré-pagos no checkout",
        module: "payments",
        values: {
          essencial: true,
          gold: true,
          platinum: true,
        },
      },
    ],
  },
  {
    id: "clients",
    name: "Clientes & Prontuários",
    features: [
      {
        name: "Cadastro Completo & Histórico de Visitas",
        description: "Ficha cadastral com contatos, notas e preferências",
        module: "clients",
        values: {
          essencial: true,
          gold: true,
          platinum: true,
        },
      },
      {
        name: "Fichas de Anamnese Digitais",
        description: "Prontuários técnicos personalizados com consentimento",
        module: "clients",
        values: {
          essencial: true,
          gold: true,
          platinum: true,
        },
      },
      {
        name: "Galeria de Fotos Auto-Organizada",
        description: "Fotos de antes/depois separadas automaticamente por atendimento",
        module: "clients",
        values: {
          essencial: false,
          gold: true,
          platinum: true,
        },
      },
    ],
  },
  {
    id: "team",
    name: "Equipe & Gestão",
    features: [
      {
        name: "Limite de Profissionais",
        description: "Contas de acesso para profissionais do espaço",
        module: "team",
        values: {
          essencial: "1 profissional",
          gold: "Até 9 profissionais",
          platinum: "Ilimitado",
        },
      },
      {
        name: "Cálculo Automatizado de Comissões",
        description: "Regras por serviço, produto e desconto de taxas",
        module: "team",
        values: {
          essencial: false,
          gold: true,
          platinum: true,
        },
      },
      {
        name: "Fechamento de Repasse (Payroll)",
        description: "Demonstrativo completo de prestação de contas quinzenal ou mensal",
        module: "team",
        values: {
          essencial: false,
          gold: true,
          platinum: true,
        },
      },
      {
        name: "Folha de Ponto Digital (Timeclock)",
        description: "Registro de entradas, saídas e pausas da equipe",
        module: "team",
        values: {
          essencial: false,
          gold: true,
          platinum: true,
        },
      },
    ],
  },
  {
    id: "marketing",
    name: "Marketing & Retenção",
    features: [
      {
        name: "Filtro de Clientes Ausentes (+30/45 dias)",
        description: "Identificação rápida de contatos para reativação",
        module: "marketing",
        values: {
          essencial: true,
          gold: true,
          platinum: true,
        },
      },
      {
        name: "Créditos de Mensagens para Campanhas",
        description: "Disparo segmentado no WhatsApp direto do painel",
        module: "marketing",
        values: {
          essencial: "0 créditos",
          gold: "500 créditos/mês",
          platinum: "2.500 créditos/mês",
        },
      },
      {
        name: "Programa de Indicação Exclusivo",
        description: "Link próprio para suas clientes indicarem novas clientes",
        module: "marketing",
        values: {
          essencial: true,
          gold: true,
          platinum: true,
        },
      },
    ],
  },
];

/**
 * Exclusive Benefits Section Data
 */
export interface ExclusiveBenefit {
  title: string;
  description: string;
}

export const EXCLUSIVE_BENEFITS: ExclusiveBenefit[] = [
  {
    title: "Sem cobrança de porcentagem sobre seu faturamento",
    description:
      "Diferente de marketplaces que cobram até 20% das suas reservas, no LUVEA o seu dinheiro cai direto na sua conta sem pedágio.",
  },
  {
    title: "Recepção IA nativa com WhatsApp e Pix no Brasil",
    description:
      "Treinada para os termos reais do mercado de beleza (mechas, corte bordado, toxina botulínica, drenagem). Gera código Pix Copia e Cola instantâneo.",
  },
  {
    title: "Fotos de antes/depois sem misturar com sua galeria pessoal",
    description:
      "Tire fotos pelo celular e elas são salvas direto na ficha da cliente e na data da sessão. Nunca mais perca horas procurando fotos no rolo da câmera.",
  },
  {
    title: "Trava inteligente de salas, macas e aparelhos a laser",
    description:
      "Evite a situação embaraçosa de dois profissionais marcarem atendimento na mesma sala ou com o mesmo aparelho ao mesmo tempo.",
  },
];
