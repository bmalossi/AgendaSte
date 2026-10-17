export type AppointmentStatus = "confirmed" | "completed" | "pending" | "risk";

export type PaymentStatus = "paid" | "deposit_paid" | "pending" | "overdue";

export interface AppointmentItem {
  id: string;
  timeSlot: string;
  endTime: string;
  durationMinutes: number;
  clientName: string;
  clientPhone: string;
  clientSince: string;
  serviceName: string;
  serviceCategory: string;
  priceCents: number;
  depositCents: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: "pix" | "card" | "cash";
  whatsappSyncState: {
    reminder24h: boolean;
    reminder2h: boolean;
    clientReply: "1_confirmed" | "2_reschedule" | "awaiting" | "none";
    lastMessageAt: string;
  };
  clinicalRecord: {
    lastVisitLabel: string;
    totalVisits: number;
    ltvCents: number;
    anamnesisSummary: string;
    protocolNotes: string;
    allergyAlert?: string;
    beforeAfterTag?: string;
    suggestedReturnDays: 15 | 30 | 45;
  };
  rebookedFor?: string | null;
  pixCode?: string;
}

export interface ReactivationLead {
  id: string;
  clientName: string;
  clientPhone: string;
  daysAbsent: number;
  lastService: string;
  averageTicketCents: number;
  preferredSlot: string;
  suggestedOffer: string;
  campaignSent?: boolean;
}

export interface WhatsAppEventLog {
  id: string;
  timestamp: string;
  clientName: string;
  direction: "inbound" | "outbound";
  badge: string;
  message: string;
  resultingAction: string;
}

export const STUDIO_PROFILE = {
  studioName: "Atelier Dra. Camila Borges",
  professionalRole: "Biomedicina Estética & Harmonização",
  bookingSlug: "veloce.app/dra-camila-borges",
  defaultDepositPercent: 30,
  whatsappInstance: "Evolution-v2 · Pareado (+55 11 99814-2209)",
  dateLabel: "Sexta-feira, 16 Out 2026",
  isDemoData: true,
};

export const INITIAL_APPOINTMENTS: AppointmentItem[] = [
  {
    id: "apt-0830",
    timeSlot: "08:30",
    endTime: "09:30",
    durationMinutes: 60,
    clientName: "Mariana Vasconcelos",
    clientPhone: "+55 11 99412-8831",
    clientSince: "Mar 2024",
    serviceName: "Bioestimulador de Colágeno (Radiesse)",
    serviceCategory: "Injetáveis",
    priceCents: 185000,
    depositCents: 55500,
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "pix",
    whatsappSyncState: {
      reminder24h: true,
      reminder2h: true,
      clientReply: "1_confirmed",
      lastMessageAt: "07:14 · Respondeu '1' no WhatsApp",
    },
    clinicalRecord: {
      lastVisitLabel: "Há 42 dias (Toxina Botulínica)",
      totalVisits: 8,
      ltvCents: 942000,
      anamnesisSummary: "Pele mista a seca, boa resposta a hidroxiapatita. Prefere anestésico tópico 25 min antes.",
      protocolNotes: "Diluição 1:2 com lidocaína · Cânula 22G em terço médio bilateral.",
      beforeAfterTag: "Comparativo 90d arquivado (2 fotos)",
      suggestedReturnDays: 30,
    },
    rebookedFor: "15 Nov · 08:30 (Avaliação 30d)",
  },
  {
    id: "apt-1000",
    timeSlot: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    clientName: "Fernanda Alencar",
    clientPhone: "+55 11 98109-4402",
    clientSince: "Ago 2025",
    serviceName: "Toxina Botulínica Full Face (50U)",
    serviceCategory: "Injetáveis",
    priceCents: 129000,
    depositCents: 38700,
    status: "confirmed",
    paymentStatus: "deposit_paid",
    paymentMethod: "pix",
    whatsappSyncState: {
      reminder24h: true,
      reminder2h: true,
      clientReply: "1_confirmed",
      lastMessageAt: "08:05 · Respondeu '1' (Confirmado auto)",
    },
    clinicalRecord: {
      lastVisitLabel: "Há 5 meses (Botox Terço Superior)",
      totalVisits: 4,
      ltvCents: 468000,
      anamnesisSummary: "Hiperidrose leve frontal. Evitar arqueamento excessivo da cauda da sobrancelha.",
      protocolNotes: "Marcação em 14 pontos frontais + glabela + orbicular dos olhos. Restante a pagar no checkout: R$ 903,00.",
      allergyAlert: "Sensibilidade a clorexidina alcoólica (usar aquosa)",
      beforeAfterTag: "Registro frontal + contração dinâmico",
      suggestedReturnDays: 15,
    },
    rebookedFor: null,
  },
  {
    id: "apt-1130",
    timeSlot: "11:30",
    endTime: "12:30",
    durationMinutes: 60,
    clientName: "Rafael Mendonça",
    clientPhone: "+55 11 97234-1900",
    clientSince: "Jan 2026",
    serviceName: "Limpeza de Pele Ultrassônica + Peeling Químico",
    serviceCategory: "Estética Facial",
    priceCents: 34000,
    depositCents: 10200,
    status: "pending",
    paymentStatus: "pending",
    whatsappSyncState: {
      reminder24h: true,
      reminder2h: false,
      clientReply: "awaiting",
      lastMessageAt: "Ontem 19:00 · Aguardando resposta (1/2) ou Sinal Pix",
    },
    clinicalRecord: {
      lastVisitLabel: "Há 38 dias (Limpeza + LED Azul)",
      totalVisits: 3,
      ltvCents: 98000,
      anamnesisSummary: "Acne grau II controlada. Suspendeu uso de ácido retinoico há 5 dias conforme orientação.",
      protocolNotes: "Sinal de reserva (R$ 102,00) ainda pendente. Horário sujeito a liberação automática.",
      beforeAfterTag: "Foto macro zona T registrada",
      suggestedReturnDays: 30,
    },
    rebookedFor: null,
  },
  {
    id: "apt-1400",
    timeSlot: "14:00",
    endTime: "15:15",
    durationMinutes: 75,
    clientName: "Patrícia Siqueira",
    clientPhone: "+55 11 99650-7123",
    clientSince: "Nov 2024",
    serviceName: "Preenchimento Labial + Hidratação Skinbooster",
    serviceCategory: "Harmonização",
    priceCents: 158000,
    depositCents: 47400,
    status: "confirmed",
    paymentStatus: "deposit_paid",
    paymentMethod: "pix",
    whatsappSyncState: {
      reminder24h: true,
      reminder2h: true,
      clientReply: "1_confirmed",
      lastMessageAt: "09:42 · Sinal Pix R$ 474 confirmado via Webhook",
    },
    clinicalRecord: {
      lastVisitLabel: "Há 8 meses (Contorno Labial 1ml)",
      totalVisits: 6,
      ltvCents: 689000,
      anamnesisSummary: "Histórico de herpes labial recorrente — iniciou profilaxia com Aciclovir 400mg ontem.",
      protocolNotes: "Ácido hialurônico reticulado 1ml (técnica russa suave) + 1ml Restylane Vital.",
      allergyAlert: "Histórico de herpes simples (profilaxia ativa)",
      beforeAfterTag: "3 ângulos labiais + perfil 45°",
      suggestedReturnDays: 30,
    },
    rebookedFor: null,
  },
  {
    id: "apt-1530",
    timeSlot: "15:30",
    endTime: "16:30",
    durationMinutes: 60,
    clientName: "Lucas Tavares",
    clientPhone: "+55 11 98841-3390",
    clientSince: "Mai 2026",
    serviceName: "Microagulhamento Capilar + Drug Delivery",
    serviceCategory: "Tricologia",
    priceCents: 62000,
    depositCents: 18600,
    status: "risk",
    paymentStatus: "overdue",
    whatsappSyncState: {
      reminder24h: true,
      reminder2h: true,
      clientReply: "2_reschedule",
      lastMessageAt: "10:18 · Sinal Pix expirado + histórico de 1 falta anterior",
    },
    clinicalRecord: {
      lastVisitLabel: "Há 52 dias (Sessão 2/4 Capilar)",
      totalVisits: 2,
      ltvCents: 124000,
      anamnesisSummary: "Alopecia androgenética moderada em região de vértex. Faltou à sessão anterior sem aviso prévio.",
      protocolNotes: "Exige cobrança imediata de sinal Pix (R$ 186,00) para manter vaga das 15:30 ou liberar para fila de espera.",
      allergyAlert: "Risco alto de No-Show (Sinal não compensado)",
      suggestedReturnDays: 30,
    },
    rebookedFor: null,
  },
  {
    id: "apt-1700",
    timeSlot: "17:00",
    endTime: "18:00",
    durationMinutes: 60,
    clientName: "Beatriz Fontenelle",
    clientPhone: "+55 11 99120-6045",
    clientSince: "Fev 2025",
    serviceName: "Drenagem Linfática Pós-Operatória + Ultrassom",
    serviceCategory: "Corporal & Pós-Op",
    priceCents: 28000,
    depositCents: 8400,
    status: "pending",
    paymentStatus: "deposit_paid",
    paymentMethod: "pix",
    whatsappSyncState: {
      reminder24h: true,
      reminder2h: false,
      clientReply: "awaiting",
      lastMessageAt: "Sinal Pix R$ 84 pago · Aguardando confirmação 2h antes",
    },
    clinicalRecord: {
      lastVisitLabel: "Há 4 dias (Sessão 5/10 Pós-Lipo HD)",
      totalVisits: 12,
      ltvCents: 336000,
      anamnesisSummary: "18º dia pós-operatório abdominal. Redução importante de edema em flancos; sem fibrose palpável.",
      protocolNotes: "Manter potência de ultrassom em 1.2 W/cm² modo pulsado.",
      beforeAfterTag: "Perimetria abdominal evolutiva (-4.2cm)",
      suggestedReturnDays: 15,
    },
    rebookedFor: null,
  },
];

export const INITIAL_REACTIVATION_LEADS: ReactivationLead[] = [
  {
    id: "lead-1",
    clientName: "Juliana Paiva Rocha",
    clientPhone: "+55 11 99301-4510",
    daysAbsent: 48,
    lastService: "Limpeza Ultrassônica + Peeling Diamante",
    averageTicketCents: 38000,
    preferredSlot: "Sextas à tarde",
    suggestedOffer: "Oi Juliana! Faz 48 dias do seu último protocolo facial. Liberamos 1 horário hoje às 15:30 com bônus de Máscara LED. Topa reservar?",
  },
  {
    id: "lead-2",
    clientName: "Carolina Drumond",
    clientPhone: "+55 11 98711-0293",
    daysAbsent: 135,
    lastService: "Toxina Botulínica Full Face",
    averageTicketCents: 129000,
    preferredSlot: "Manhã (09h–11h)",
    suggestedOffer: "Oi Carolina! Sua aplicação de Toxina completou 4 meses e meio (janela ideal de manutenção preventiva). Quer garantir horário na próxima semana?",
  },
  {
    id: "lead-3",
    clientName: "Gustavo Nogueira",
    clientPhone: "+55 11 99188-7721",
    daysAbsent: 36,
    lastService: "Microagulhamento Capilar",
    averageTicketCents: 62000,
    preferredSlot: "Final do dia (17h–19h)",
    suggestedOffer: "Fala Gustavo! Passando para lembrar da janela de 35 dias da sua sessão capilar para não perder o estímulo folicular. Agendamos seu retorno?",
  },
];

export const INITIAL_WHATSAPP_LOGS: WhatsAppEventLog[] = [
  {
    id: "wa-1",
    timestamp: "10:18",
    clientName: "Lucas Tavares",
    direction: "inbound",
    badge: "Alerta 2-Way",
    message: "Respondeu '2' (Pediu reagendamento / Sinal não pago)",
    resultingAction: "Status alterado para Vermelho (Risco / Vaga liberável)",
  },
  {
    id: "wa-2",
    timestamp: "09:42",
    clientName: "Patrícia Siqueira",
    direction: "inbound",
    badge: "Webhook Pix + Whats",
    message: "Sinal Pix R$ 474,00 compensado via Mercado Pago",
    resultingAction: "Horário 14:00 travado em Verde (Confirmado)",
  },
  {
    id: "wa-3",
    timestamp: "08:05",
    clientName: "Fernanda Alencar",
    direction: "inbound",
    badge: "Resposta '1'",
    message: "Cliente respondeu '1' ao lembrete automático de 2h",
    resultingAction: "Presença confirmada na agenda sem intervenção humana",
  },
];
