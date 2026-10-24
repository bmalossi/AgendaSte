// =============================================================================
// LUVEA (EDIÇÃO BRASIL) — MOTOR DE DOMÍNIO & ESTADO OPERACIONAL
// Vocabulário canônico alinhado a CONTEXT.md, ADR-0001 e ADR-0002
// =============================================================================

export type NavigationSectionId =
  | "get_started"
  | "reception"
  | "calendar"
  | "payments_gift_cards"
  | "payments_invoices"
  | "payments_sales_history"
  | "clients"
  | "catalog_services"
  | "catalog_packages"
  | "catalog_memberships"
  | "catalog_resources"
  | "team_staff"
  | "team_payroll"
  | "team_commissions"
  | "team_time_tracking"
  | "marketing"
  | "insights"
  | "insights_analytics"
  | "insights_reports"
  | "inventory"
  | "charts"
  | "refer"
  | "settings";

export type CalendarEventType =
  | "appointment"
  | "personal_block"
  | "working_hours"
  | "waitlist_entry";

export type PriceType = "fixed" | "starting_at" | "hidden";

export type ResourceCategory = "equipment" | "room";

export function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

export function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Calcula os dias restantes de teste gratuito com base na data de expiração ISO.
 */
export function calculateRemainingTrialDays(trialEndsAtISO?: string | null): number {
  if (!trialEndsAtISO) return 14;
  const target = new Date(trialEndsAtISO).getTime();
  if (isNaN(target)) return 14;
  const diffMs = target - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export interface PhysicalResource {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  assignedServiceIds: string[];
}

export interface ServiceOptionItem {
  id: string;
  name: string;
  priceDeltaCents: number;
  durationDeltaMinutes: number;
}

export interface ServiceAddOnItem {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  calendarColor: string;
  imageUrl?: string;
  onlineBookingEnabled: boolean;
  priceType: PriceType;
  priceCents: number;
  requireDeposit: boolean;
  depositCents: number;
  durationMinutes: number;
  processingTimeEnabled: boolean;
  processingStartOffsetMinutes: number;
  processingDurationMinutes: number;
  blockTimeEnabled: boolean;
  blockAfterMinutes: number;
  requiredResourceIds: string[];
  options: ServiceOptionItem[];
  addOns: ServiceAddOnItem[];
}

export interface SuggestedServiceTemplate {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  durationMinutes: number;
  selected: boolean;
}

export interface PackageCatalogItem {
  id: string;
  name: string;
  description: string;
  sellOnWebsite: boolean;
  includedServiceIds: string[];
  sessionsCount: number;
  priceCents: number;
  expirationDays: number;
  termsAndConditions: string;
}

export interface MembershipPlanItem {
  id: string;
  name: string;
  description: string;
  monthlyPriceCents: number;
  includedCreditsPerMonth: number;
  discountPercentOnExtras: number;
  activeSubscribersCount: number;
}

export interface ClientPhotoGroup {
  id: string;
  appointmentId?: string;
  appointmentDateISO: string;
  serviceName: string;
  beforeLabel?: string;
  afterLabel?: string;
  photoUrls: string[];
  notes: string;
}

export interface ClientPackageCredit {
  packageId: string;
  packageName: string;
  remainingSessions: number;
  totalSessions: number;
  expiresAtISO: string;
}

export interface ClientMembershipSubscription {
  membershipId: string;
  membershipName: string;
  status: "active" | "paused";
  remainingMonthlyCredits: number;
  renewsAtISO: string;
}

export interface ClientProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarColor: string;
  createdAtISO: string;
  lastVisitISO: string | null;
  daysSinceLastVisit: number | null;
  totalSpentCents: number;
  visitsCount: number;
  noShowCount: number;
  sendAutomaticReminders: boolean;
  notesAndForms: {
    anamnesis: string;
    allergies: string;
    formulasAndPreferences: string;
    birthday: string;
  };
  autoSortedPhotos: ClientPhotoGroup[];
  packages: ClientPackageCredit[];
  memberships: ClientMembershipSubscription[];
}

export interface CalendarEventItem {
  id: string;
  eventType: CalendarEventType;
  dateISO: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  activeDurationMinutes: number;
  processingStartOffsetMinutes: number;
  processingDurationMinutes: number;
  blockAfterMinutes: number;
  providerId: string;
  providerName: string;
  clientId?: string;
  clientName: string;
  serviceIds: string[];
  serviceNames: string[];
  resourceIds: string[];
  addressOrNotes: string;
  isRepeating: boolean;
  collectDeposit: boolean;
  depositCents: number;
  depositPaid: boolean;
  totalCents: number;
  status: "confirmed" | "completed" | "pending" | "canceled" | "no_show";
  calendarColor: string;
  whatsappReminderSent: boolean;
  whatsappClientReply: "1_confirmed" | "2_reschedule" | "none";
}

export interface WaitlistEntryItem {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  providerId: string;
  providerName: string;
  serviceId: string;
  serviceName: string;
  preferredDateISO: string;
  preferredTimeWindow: string;
  notes: string;
  createdAtISO: string;
}

export interface InvoiceLineItem {
  id: string;
  label: string;
  itemType: "service" | "product" | "package" | "custom";
  amountCents: number;
  quantity: number;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  title: string;
  providerId: string;
  providerName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  memo: string;
  issuedAtISO: string;
  dueDateISO: string;
  lineItems: InvoiceLineItem[];
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  status: "draft" | "sent" | "paid" | "overdue";
  paymentLinkUrl: string;
  pixPayload?: string;
}

export interface SaleHistoryRecord {
  id: string;
  appointmentTimeLabel: string;
  dateISO: string;
  clientId: string;
  clientName: string;
  providerId: string;
  providerName: string;
  itemsSummary: string;
  status: "Pago" | "Sinal Pago" | "Pendente" | "Reembolsado";
  paymentMethod: "Pix" | "Cartão" | "Dinheiro" | "Vale-Presente" | "Pacote";
  amountCents: number;
  tipCents: number;
}

export interface GiftCardItem {
  id: string;
  code: string;
  recipientName: string;
  recipientEmail: string;
  initialBalanceCents: number;
  remainingBalanceCents: number;
  status: "active" | "redeemed";
  issuedAtISO: string;
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  role: string;
  email: string;
  phone: string;
  avatarColor: string;
  serviceCommissionPercent: number;
  productCommissionPercent: number;
  weeklyGoalCents: number;
  bookedThisWeekCents: number;
  clockInNotificationsEnabled: boolean;
  assignedServiceIds: string[];
  availableOnline?: boolean;
  matchBusinessHours?: boolean;
  customSchedule?: DayBusinessHours[];
}

export interface TimesheetLog {
  id: string;
  staffId: string;
  staffName: string;
  dateISO: string;
  checkInTime: string;
  checkOutTime: string | null;
  breakMinutes: number;
  totalWorkedSeconds: number;
  status: "clocked_in" | "on_break" | "completed";
}

export interface MarketingCampaignItem {
  id: string;
  channel: "email" | "text";
  subject: string;
  message: string;
  imageUrl?: string;
  audienceSegment: "all" | "absent_45d" | "vip" | "waitlist";
  recipientsCount: number;
  status: "sent" | "draft";
  sentAtISO: string;
}

export interface InventoryProductItem {
  id: string;
  name: string;
  sku: string;
  category: "Revenda (Retail)" | "Uso Profissional (Backbar)";
  stockQuantity: number;
  minStockAlert: number;
  priceCents: number;
  costCents: number;
}

export interface ClinicalChartMarkupPin {
  id: string;
  xPercent: number;
  yPercent: number;
  label: string;
}

export interface ClinicalChartPhotoItem {
  id: string;
  url: string;
  caption: string;
  stage: "before" | "after" | "mapping";
  pins: ClinicalChartMarkupPin[];
}

export interface ClinicalChartProductUsage {
  id: string;
  inventoryProductId?: string;
  productName: string;
  skuOrLot: string;
  quantity: string;
  notes: string;
}

export interface ClinicalChartEntry {
  id: string;
  clientId: string;
  clientName: string;
  chartName: string;
  serviceIds: string[];
  serviceNames: string[];
  providerId: string;
  providerName: string;
  status: "created" | "completed";
  version: number;
  createdDateLabel: string;
  lastModifiedLabel: string;
  photos: ClinicalChartPhotoItem[];
  productsUsed: ClinicalChartProductUsage[];
  templateType: "soap" | "aesthetic_anamnesis" | "injectables" | "free_note";
  soapNoteName: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface ReceptionAiLog {
  id: string;
  timestampLabel: string;
  clientName: string;
  clientPhone: string;
  direction: "inbound" | "outbound";
  channel: "WhatsApp 2-Way" | "Recepção Voz IA";
  messageText: string;
  outcomeBadge: string;
}

export type BookingSiteThemeId =
  | "classic"
  | "billboard"
  | "canvas"
  | "energy"
  | "organic"
  | "play";

export interface DayBusinessHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo .. 6 = Sábado
  label: string;
  isOpen: boolean;
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
}

export const DEFAULT_STAFF_SCHEDULE: DayBusinessHours[] = [
  { dayOfWeek: 0, label: "Domingo", isOpen: false, startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: 1, label: "Segunda-feira", isOpen: true, startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: 2, label: "Terça-feira", isOpen: true, startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: 3, label: "Quarta-feira", isOpen: true, startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: 4, label: "Quinta-feira", isOpen: true, startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: 5, label: "Sexta-feira", isOpen: true, startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: 6, label: "Sábado", isOpen: true, startTime: "08:00", endTime: "17:00" },
];

export interface WebsiteTrackingConfig {
  googleAnalyticsId: string;
  metaPixelId: string;
  enabled: boolean;
}

export interface SocialAccountsConfig {
  instagram: string;
  facebook: string;
  twitter: string;
  pinterest: string;
  yelp: string;
  website: string;
}

export interface WebsiteContentSettings {
  showReviews: boolean;
  showPortfolioGallery: boolean;
  displayServicesVisually: boolean;
  showTeam: boolean;
}

export interface BookingControlsConfig {
  autoApproveMode: "always" | "manual";
  bookingWindowHours: number;
  bookingIncrementsMinutes: number;
  minimizeSchedulingGaps: boolean;
  maxGapMinutes: number;
  gapProviderScope: "all" | "selected";
  requireCardOnFile: "all" | "new_clients" | "none";
  advanceBookingMonths: number;
  allowProcessingTimeBooking: boolean;
  askClientsForPronouns: boolean;
  cancellations: {
    allowOnlineCancellation: boolean;
    policyRequired: boolean;
    policyDetails: string;
    feePercent: number;
    windowHours: number;
  };
  waitlistOnlineEnabled: boolean;
}

export interface ClientNotificationItem {
  id: string;
  title: string;
  description: string;
  category: "pre_appointment" | "post_appointment";
  enabled: boolean;
  channels: Array<"email" | "sms" | "whatsapp">;
  timingLabel?: string;
  templateSubject?: string;
  templateBody: string;
  badge?: "gold" | "novo";
  requiresGoogleLink?: boolean;
}

export interface ClientNotificationsConfig {
  hipaaNoticeDismissed?: boolean;
  googleReviewLink: string;
  items: ClientNotificationItem[];
}

export interface CheckoutSettingsConfig {
  acceptBnpl: boolean;
  bnplFeePercent: number;
  bnplFixedFeeCents: number;
  technologyFeePayer: "studio" | "client";
  serviceSalesTaxPercent: number;
  retailSalesTaxPercent: number;
  allowTapToPay: boolean;
}

export interface ChartingSettingsConfig {
  requireProviderSignature: boolean;
  requireMedicalDirectorSignOff: boolean;
}

export interface WebsiteBookingSetupConfig {
  theme: BookingSiteThemeId;
  subdomainSlug: string;
  websitePublished: boolean;
  hasFixedAddress: boolean;
  doesHouseCalls: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  zipCode: string;
  state: string;
  businessHours: DayBusinessHours[];
  autoApproveAppointments: boolean;
  onlineBookingGuarantee: "pix_deposit" | "card_on_file" | "none";
  paymentsSetup: {
    payoutMethod: "pix_key" | "bank_account" | "debit_card";
    pixKeyType: "cpf_cnpj" | "email" | "phone" | "random";
    pixKeyValue: string;
    bankName: string;
    routingOrAgency: string;
    accountNumber: string;
    debitCardLast4: string;
    identityVerified: boolean;
    setupCompleted: boolean;
  };
  aboutYourBusiness?: string;
  heroImageUrl?: string;
  socialAccounts?: SocialAccountsConfig;
  contentSettings?: WebsiteContentSettings;
  tracking?: WebsiteTrackingConfig;
  bookingControls?: BookingControlsConfig;
  clientNotifications?: ClientNotificationsConfig;
  checkoutSettings?: CheckoutSettingsConfig;
  chartingSettings?: ChartingSettingsConfig;
}

export type WhatsAppProviderType = "evolution_api" | "meta_cloud" | "wa_web_manual";

export interface UserWhatsAppTemplates {
  reminder24h: string;
  reminder2h: string;
  pixDeposit: string;
  reactivation45d: string;
}

export interface EvolutionInstanceSettings {
  rejectCall: boolean;
  msgCall: string;
  groupsIgnore: boolean;
  alwaysOnline: boolean;
  readMessages: boolean;
  readStatus: boolean;
  syncFullHistory: boolean;
}

export const DEFAULT_EVOLUTION_SETTINGS: EvolutionInstanceSettings = {
  rejectCall: false,
  msgCall: "",
  groupsIgnore: true,
  alwaysOnline: false,
  readMessages: false,
  readStatus: false,
  syncFullHistory: false,
};

export interface UserWhatsAppConfig {
  provider: WhatsAppProviderType;
  phoneNumber: string;
  instanceName: string;
  apiUrl?: string;
  apiKey?: string;
  metaPhoneNumberId?: string;
  metaBusinessAccountId?: string;
  metaAccessToken?: string;
  connected: boolean;
  connectedAt?: string;
  pairingQrCode?: string;
  templates: UserWhatsAppTemplates;
  evolutionSettings?: EvolutionInstanceSettings;
}

export interface StudioState {
  onboarding: {
    steps: Array<{
      id: "booking_site" | "add_services" | "start_getting_paid";
      title: string;
      description: string;
      completed: boolean;
      actionLabel?: string;
    }>;
    importedData: boolean;
    trialDaysLeft: number;
    planTier: "Gold" | "Platinum" | "Standard" | "Essencial";
    subscriptionStatus?: "trialing" | "active" | "past_due" | "canceled";
    trialEndsAtISO?: string;
    billingCycle?: "monthly" | "yearly";
  };
  reception: {
    activeStep: "meet" | "setup" | "ready";
    whatsappConnected: boolean;
    whatsappNumber: string;
    autoReplyMissedCallsAndTexts: boolean;
    send24hReminder: boolean;
    send2hReminder: boolean;
    logs: ReceptionAiLog[];
    userConfig?: UserWhatsAppConfig;
  };
  calendarView: {
    selectedDateISO: string;
    mode: "day" | "week";
    selectedProviderId: string | "all";
  };
  services: ServiceCatalogItem[];
  suggestedServices: SuggestedServiceTemplate[];
  packages: PackageCatalogItem[];
  memberships: MembershipPlanItem[];
  resources: PhysicalResource[];
  clients: ClientProfile[];
  calendarEvents: CalendarEventItem[];
  waitlist: WaitlistEntryItem[];
  invoices: InvoiceItem[];
  salesHistory: SaleHistoryRecord[];
  giftCards: GiftCardItem[];
  staffMode: "team" | "solo";
  staff: StaffMember[];
  timeTracking: {
    enabled: boolean;
    firstBreakTypeEnabled: boolean;
    firstBreakDurationMinutes: number;
    activeClockInStaffId: string;
    activeSessionStatus: "idle" | "clocked_in" | "on_break";
    activeElapsedSeconds: number;
    logs: TimesheetLog[];
  };
  marketing: {
    smsCreditsRemaining: number;
    campaigns: MarketingCampaignItem[];
  };
  inventory: InventoryProductItem[];
  clinicalCharts?: ClinicalChartEntry[];
  settings: {
    personal: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      phoneVerified: boolean;
      licenseNumber: string;
      smsConsent: boolean;
    };
    preferences: {
      appointmentNotifications: {
        email: boolean;
        text: boolean;
        push: boolean;
      };
      notifyNewReviews: boolean;
      captureClientNotesFromMe: boolean;
      sendMeClientNotesBeforeAppointment: boolean;
      calendarSyncUrl: string;
      waitlistNotifications: {
        email: boolean;
        text: boolean;
        push: boolean;
      };
    };
    business: {
      businessName: string;
      bookingSlug: string;
      legalEntityType: string;
      taxIdCnpjCpf: string;
      address: string;
      cityState: string;
      pixKey: string;
      defaultDepositPercent: number;
      requireCardOrPixOnOnlineBooking: boolean;
      cancellationWindowHours: number;
      noShowFeePercent: number;
    };
    website: WebsiteBookingSetupConfig;
  };
  lastToastMessage: string | null;
}

// =============================================================================
// HELPERS DE TEMPO E FORMATAÇÃO
// =============================================================================

export function parseTimeMinutes(timeHHMM: string): number {
  const [hh, mm] = timeHHMM.split(":").map((n) => parseInt(n, 10));
  return (Number.isNaN(hh) ? 9 : hh) * 60 + (Number.isNaN(mm) ? 0 : mm);
}

export function formatMinutesToHHMM(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const hh = Math.floor(clamped / 60);
  const mm = clamped % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function addWeeksToDateISO(dateISO: string, weeksToAdd: number): string {
  const [y, m, d] = dateISO.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + weeksToAdd * 7);
  return dt.toISOString().slice(0, 10);
}

export function addDaysToDateISO(dateISO: string, daysToAdd: number): string {
  const [y, m, d] = dateISO.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + daysToAdd);
  return dt.toISOString().slice(0, 10);
}

export function getTodayDateISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateBR(dateISO: string): string {
  try {
    if (!dateISO) return "";
    const clean = dateISO.trim().slice(0, 10);
    const parts = clean.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      if (y && m && d && y.length === 4) {
        return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
      }
    }
    return dateISO;
  } catch {
    return dateISO;
  }
}

export function formatAppointmentDateLabel(
  dateISO: string,
  timeHHMM?: string
): string {
  try {
    const brDate = formatDateBR(dateISO);
    return timeHHMM ? `${brDate}, ${timeHHMM}` : brDate;
  } catch {
    return timeHHMM ? `${dateISO}, ${timeHHMM}` : dateISO;
  }
}

// =============================================================================
// ESTADO INICIAL REALISTA DO ESTÚDIO (LUVEA)
// =============================================================================

export function createInitialStudioState(): StudioState {
  return {
    onboarding: {
      steps: [
        {
          id: "booking_site",
          title: "Seja encontrado e agendado online",
          description:
            "Garanta sua URL personalizada e lance um site de agendamento onde clientes reservam em 30 segundos.",
          completed: false,
        },
        {
          id: "add_services",
          title: "Adicione seus serviços",
          description:
            "Defina seus preços, envie fotos e construa um menu de serviços que se vende sozinho.",
          completed: false,
        },
        {
          id: "start_getting_paid",
          title: "Comece a receber pagamentos",
          description:
            "Aceite Pix Dinâmico, cartão e faturas, aumentando a retenção de receita em até 65% em média.",
          completed: false,
        },
      ],
      importedData: false,
      trialDaysLeft: 14,
      planTier: "Gold",
      subscriptionStatus: "trialing",
      trialEndsAtISO: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      billingCycle: "monthly",
    },
    reception: {
      activeStep: "meet",
      whatsappConnected: true,
      whatsappNumber: "+55 (11) 94447-7528",
      autoReplyMissedCallsAndTexts: true,
      send24hReminder: true,
      send2hReminder: true,
      userConfig: {
        provider: "evolution_api",
        phoneNumber: "+55 (11) 94447-7528",
        instanceName: "pessoal",
        apiUrl: "https://api.automab.dev",
        apiKey: "",
        connected: true,
        connectedAt: "2026-10-17T08:00:00Z",
        evolutionSettings: {
          ...DEFAULT_EVOLUTION_SETTINGS,
        },
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
      },
      logs: [
        {
          id: "rec-log-1",
          timestampLabel: "Hoje, 08:42",
          clientName: "Stefany",
          clientPhone: "(520) 788-8522",
          direction: "outbound",
          channel: "WhatsApp 2-Way",
          messageText:
            "Olá Stefany! Lembrete do seu horário hoje às 10:00 no Luvea Studio. Responda 1 para Confirmar ou 2 para Reagendar.",
          outcomeBadge: "Entregue · Aguardando 1/2",
        },
        {
          id: "rec-log-2",
          timestampLabel: "Hoje, 08:50",
          clientName: "Isolde Quinn",
          clientPhone: "(11) 99410-2219",
          direction: "inbound",
          channel: "WhatsApp 2-Way",
          messageText: "1 — Confirmado! Estarei aí no horário.",
          outcomeBadge: "Agenda Sincronizada",
        },
        {
          id: "rec-log-3",
          timestampLabel: "Ontem, 21:15",
          clientName: "Mariana Albuquerque",
          clientPhone: "(11) 98821-7700",
          direction: "inbound",
          channel: "Recepção Voz IA",
          messageText:
            "Cliente ligou após o expediente perguntando valor de Mechas + Tratamento. Recepção IA enviou link do Luvea Studio e reservou horário.",
          outcomeBadge: "Reserva Salva (+R$ 380)",
        },
      ],
    },
    calendarView: {
      selectedDateISO: getTodayDateISO(),
      mode: "day",
      selectedProviderId: "staff-bruno",
    },
    resources: [
      {
        id: "res-laser-1",
        name: "Laser Lavieen & Ultrassom Microfocado",
        category: "equipment",
        description: "Equipamento compartilhado — trava automática contra reserva dupla.",
        assignedServiceIds: ["srv-rejuv"],
      },
      {
        id: "res-room-1",
        name: "Cabine Estética 01 (Haircut Room 2)",
        category: "room",
        description: "Sala principal climatizada para procedimentos longos.",
        assignedServiceIds: ["srv-color", "srv-rejuv"],
      },
      {
        id: "res-chair-1",
        name: "Poltrona VIP Colorimetria",
        category: "equipment",
        description: "Estação completa com lavatório ergonômico.",
        assignedServiceIds: ["srv-color", "srv-hydration"],
      },
    ],
    services: [
      {
        id: "srv-color",
        name: "Coloração Personalizada & Iluminação",
        description:
          "Diagnóstico de visagismo, aplicação de mechas/coloração com pausa assistida e finalização de salão.",
        category: "Colorimetria & Cabelo",
        calendarColor: "#E11D8F",
        onlineBookingEnabled: true,
        priceType: "fixed",
        priceCents: 38000,
        requireDeposit: true,
        depositCents: 11400,
        durationMinutes: 90,
        processingTimeEnabled: true,
        processingStartOffsetMinutes: 30,
        processingDurationMinutes: 30,
        blockTimeEnabled: true,
        blockAfterMinutes: 15,
        requiredResourceIds: ["res-room-1"],
        options: [
          {
            id: "opt-short",
            name: "Cabelo Curto / Médio",
            priceDeltaCents: 0,
            durationDeltaMinutes: 0,
          },
          {
            id: "opt-long",
            name: "Cabelo Longo / Extra Volume",
            priceDeltaCents: 7000,
            durationDeltaMinutes: 30,
          },
        ],
        addOns: [
          {
            id: "add-ampola",
            name: "Ampola Reconstrutora K-Pak",
            priceCents: 4500,
            durationMinutes: 10,
          },
          {
            id: "add-scalp",
            name: "Massagem Craniana Detox",
            priceCents: 3500,
            durationMinutes: 10,
          },
        ],
      },
      {
        id: "srv-rejuv",
        name: "Protocolo Rejuvenation & Glow",
        description:
          "Bioestimulação facial com tecnologia de ponta, máscara calmante e proteção antioxidante.",
        category: "Estética Avançada",
        calendarColor: "#6E56CF",
        onlineBookingEnabled: true,
        priceType: "starting_at",
        priceCents: 23000,
        requireDeposit: true,
        depositCents: 7000,
        durationMinutes: 60,
        processingTimeEnabled: false,
        processingStartOffsetMinutes: 0,
        processingDurationMinutes: 0,
        blockTimeEnabled: true,
        blockAfterMinutes: 10,
        requiredResourceIds: ["res-laser-1", "res-room-1"],
        options: [
          {
            id: "opt-face",
            name: "Face Completa",
            priceDeltaCents: 0,
            durationDeltaMinutes: 0,
          },
          {
            id: "opt-face-neck",
            name: "Face + Pescoço e Colo",
            priceDeltaCents: 9000,
            durationDeltaMinutes: 20,
          },
        ],
        addOns: [
          {
            id: "add-led",
            name: "Fototerapia LED Regeneradora",
            priceCents: 5000,
            durationMinutes: 15,
          },
        ],
      },
      {
        id: "srv-hydration",
        name: "Tratamento Condicionamento Profundo",
        description:
          "Reposição lipídica e selagem de cutículas para brilho espelhado imediato.",
        category: "Tratamentos Capilares",
        calendarColor: "#0D9488",
        onlineBookingEnabled: true,
        priceType: "fixed",
        priceCents: 15000,
        requireDeposit: false,
        depositCents: 0,
        durationMinutes: 45,
        processingTimeEnabled: false,
        processingStartOffsetMinutes: 0,
        processingDurationMinutes: 0,
        blockTimeEnabled: false,
        blockAfterMinutes: 0,
        requiredResourceIds: ["res-chair-1"],
        options: [],
        addOns: [],
      },
    ],
    suggestedServices: [
      {
        id: "sug-1",
        name: "Consultoria de coloração personalizada (Custom hair color consultations)",
        category: "Colorimetria & Cabelo",
        priceCents: 15000,
        durationMinutes: 45,
        selected: false,
      },
      {
        id: "sug-2",
        name: "Tratamento de condicionamento profundo (Deep conditioning treatments)",
        category: "Tratamentos Capilares",
        priceCents: 20000,
        durationMinutes: 60,
        selected: false,
      },
      {
        id: "sug-3",
        name: "Avaliação de alongamento e mega hair (Hair extension consultations)",
        category: "Alongamento",
        priceCents: 12500,
        durationMinutes: 30,
        selected: false,
      },
    ],
    packages: [
      {
        id: "pkg-rejuv-3",
        name: "Rejuvenation Package (3 Sessões)",
        description:
          "Pacote de 3 sessões do Protocolo Rejuvenation & Glow com acompanhamento fotográfico Antes & Depois.",
        sellOnWebsite: true,
        includedServiceIds: ["srv-rejuv"],
        sessionsCount: 3,
        priceCents: 59000,
        expirationDays: 180,
        termsAndConditions:
          "Válido por 6 meses a partir da compra. Cancelamentos com menos de 24h consomem 1 crédito.",
      },
    ],
    memberships: [
      {
        id: "mem-club-glow",
        name: "Luvea Glow Club Mensal",
        description:
          "2 sessões de Tratamento Capilar ou Hidratação por mês + 15% OFF em todo o catálogo.",
        monthlyPriceCents: 24900,
        includedCreditsPerMonth: 2,
        discountPercentOnExtras: 15,
        activeSubscribersCount: 12,
      },
    ],
    clients: [
      {
        id: "cli-stefany",
        fullName: "Stefany",
        email: "bfernandescorretor@gmail.com",
        phone: "(520) 788-8522",
        avatarColor: "#FBCFE8",
        createdAtISO: "2026-10-17",
        lastVisitISO: "2026-10-02",
        daysSinceLastVisit: 15,
        totalSpentCents: 61000,
        visitsCount: 4,
        noShowCount: 0,
        sendAutomaticReminders: true,
        notesAndForms: {
          anamnesis:
            "Couro cabeludo sensível; prefere oxidante de 20 volumes sem amônia. Não apresenta histórico alérgico a ácidos leves.",
          allergies: "Nenhuma alergia medicamentosa relatada.",
          formulasAndPreferences:
            "Fórmula loiro manteiga: 8.31 + 9.1 (1:1). Gosta de café expresso sem açúcar e música ambiente baixa.",
          birthday: "14/05",
        },
        autoSortedPhotos: [
          {
            id: "ph-grp-1",
            appointmentId: "evt-1",
            appointmentDateISO: "2026-10-17",
            serviceName: "Coloração Personalizada & Iluminação",
            beforeLabel: "Antes · Raiz 4cm natural",
            afterLabel: "Depois · Iluminação Avelã & Brilho",
            photoUrls: [
              "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
              "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=400&q=80",
            ],
            notes: "Fotos organizadas e rotuladas automaticamente pelo agendamento.",
          },
        ],
        packages: [
          {
            packageId: "pkg-rejuv-3",
            packageName: "Rejuvenation Package (3 Sessões)",
            remainingSessions: 2,
            totalSessions: 3,
            expiresAtISO: "2027-04-17",
          },
        ],
        memberships: [
          {
            membershipId: "mem-club-glow",
            membershipName: "Luvea Glow Club Mensal",
            status: "active",
            remainingMonthlyCredits: 1,
            renewsAtISO: "2026-11-17",
          },
        ],
      },
      {
        id: "cli-isolde",
        fullName: "Isolde Quinn",
        email: "isolde.quinn@luveastudio.app",
        phone: "(11) 99410-2219",
        avatarColor: "#DDD6FE",
        createdAtISO: "2026-06-10",
        lastVisitISO: "2026-10-10",
        daysSinceLastVisit: 7,
        totalSpentCents: 142000,
        visitsCount: 8,
        noShowCount: 0,
        sendAutomaticReminders: true,
        notesAndForms: {
          anamnesis: "Pele fototipo III, em protocolo de bioestimulação trimestral.",
          allergies: "Sensibilidade a ácidos retinóicos concentrados.",
          formulasAndPreferences: "Cabine Estética 01 aquecida; chá de camomila.",
          birthday: "22/08",
        },
        autoSortedPhotos: [],
        packages: [],
        memberships: [],
      },
      {
        id: "cli-mariana",
        fullName: "Mariana Albuquerque",
        email: "mariana.alb@gmail.com",
        phone: "(11) 98821-7700",
        avatarColor: "#BBF7D0",
        createdAtISO: "2026-04-01",
        lastVisitISO: "2026-08-25",
        daysSinceLastVisit: 53,
        totalSpentCents: 89000,
        visitsCount: 5,
        noShowCount: 1,
        sendAutomaticReminders: true,
        notesAndForms: {
          anamnesis: "Cliente ausente há 53 dias — elegível para campanha de reativação.",
          allergies: "Nenhuma.",
          formulasAndPreferences: "Prefere horários de sábado pela manhã.",
          birthday: "03/11",
        },
        autoSortedPhotos: [],
        packages: [],
        memberships: [],
      },
    ],
    calendarEvents: [
      {
        id: "evt-1",
        eventType: "appointment",
        dateISO: "2026-10-17",
        startTime: "10:00",
        endTime: "11:45",
        activeDurationMinutes: 90,
        processingStartOffsetMinutes: 30,
        processingDurationMinutes: 30,
        blockAfterMinutes: 15,
        providerId: "staff-bruno",
        providerName: "Bruno Fernandes Malossi Silva",
        clientId: "cli-stefany",
        clientName: "Stefany",
        serviceIds: ["srv-color"],
        serviceNames: ["Coloração Personalizada & Iluminação"],
        resourceIds: ["res-room-1"],
        addressOrNotes: "Cabine Estética 01 · Loiro iluminado sem amônia",
        isRepeating: false,
        collectDeposit: true,
        depositCents: 11400,
        depositPaid: true,
        totalCents: 38000,
        status: "pending",
        calendarColor: "#E11D8F",
        whatsappReminderSent: true,
        whatsappClientReply: "none",
      },
      {
        id: "evt-2",
        eventType: "appointment",
        dateISO: "2026-10-17",
        startTime: "12:30",
        endTime: "13:40",
        activeDurationMinutes: 60,
        processingStartOffsetMinutes: 0,
        processingDurationMinutes: 0,
        blockAfterMinutes: 10,
        providerId: "staff-bruno",
        providerName: "Bruno Fernandes Malossi Silva",
        clientId: "cli-isolde",
        clientName: "Isolde Quinn",
        serviceIds: ["srv-rejuv"],
        serviceNames: ["Protocolo Rejuvenation & Glow"],
        resourceIds: ["res-laser-1", "res-room-1"],
        addressOrNotes: "Haircut Room 2 · Sessão 1 do Rejuvenation Package",
        isRepeating: false,
        collectDeposit: true,
        depositCents: 7000,
        depositPaid: true,
        totalCents: 23000,
        status: "confirmed",
        calendarColor: "#6E56CF",
        whatsappReminderSent: true,
        whatsappClientReply: "1_confirmed",
      },
    ],
    waitlist: [
      {
        id: "wl-1",
        clientId: "cli-mariana",
        clientName: "Mariana Albuquerque",
        clientPhone: "(11) 98821-7700",
        providerId: "staff-bruno",
        providerName: "Bruno Fernandes Malossi Silva",
        serviceId: "srv-hydration",
        serviceName: "Tratamento Condicionamento Profundo",
        preferredDateISO: "2026-10-17",
        preferredTimeWindow: "Manhã (10:30 — 12:00)",
        notes: "Pode encaixar durante o tempo de pausa da coloração das 10:30!",
        createdAtISO: "2026-10-16",
      },
    ],
    invoices: [
      {
        id: "inv-1000948",
        invoiceNumber: "#1000948",
        title: "Rejuvenation Package",
        providerId: "staff-bruno",
        providerName: "Bruno Fernandes Malossi Silva",
        clientId: "cli-isolde",
        clientName: "Isolde Quinn",
        clientEmail: "isolde.quinn@luveastudio.app",
        memo: "Fatura referente ao protocolo facial completo no Luvea Studio.",
        issuedAtISO: "2026-10-10",
        dueDateISO: "2026-10-25",
        lineItems: [
          {
            id: "li-1",
            label: "Protocolo Rejuvenation & Glow",
            itemType: "service",
            amountCents: 23000,
            quantity: 1,
          },
        ],
        subtotalCents: 23000,
        discountCents: 0,
        taxCents: 0,
        totalCents: 23000,
        status: "sent",
        paymentLinkUrl: "https://luveastudio.luvea.app/pay/1000948",
      },
    ],
    salesHistory: [
      {
        id: "sale-1",
        appointmentTimeLabel: "17 Out 2026, 09:00",
        dateISO: "2026-10-17",
        clientId: "cli-stefany",
        clientName: "Stefany",
        providerId: "staff-bruno",
        providerName: "Bruno Fernandes Malossi Silva",
        itemsSummary: "Sinal Pix · Coloração Personalizada & Iluminação",
        status: "Sinal Pago",
        paymentMethod: "Pix",
        amountCents: 11400,
        tipCents: 0,
      },
      {
        id: "sale-2",
        appointmentTimeLabel: "10 Out 2026, 14:00",
        dateISO: "2026-10-10",
        clientId: "cli-isolde",
        clientName: "Isolde Quinn",
        providerId: "staff-bruno",
        providerName: "Bruno Fernandes Malossi Silva",
        itemsSummary: "Protocolo Rejuvenation & Glow + Ampola",
        status: "Pago",
        paymentMethod: "Pix",
        amountCents: 27500,
        tipCents: 2000,
      },
    ],
    giftCards: [
      {
        id: "gc-1",
        code: "LUVEA-GIFT-200",
        recipientName: "Stefany",
        recipientEmail: "bfernandescorretor@gmail.com",
        initialBalanceCents: 20000,
        remainingBalanceCents: 20000,
        status: "active",
        issuedAtISO: "2026-10-05",
      },
    ],
    staffMode: "team",
    staff: [
      {
        id: "staff-bruno",
        firstName: "Bruno",
        lastName: "Fernandes Malossi Silva",
        fullName: "Bruno Fernandes Malossi Silva",
        initials: "BS",
        role: "Proprietário & Especialista Master",
        email: "bfernandescorretor@gmail.com",
        phone: "+1 (520) 752-5522",
        avatarColor: "#FBCFE8",
        serviceCommissionPercent: 60,
        productCommissionPercent: 20,
        weeklyGoalCents: 580000,
        bookedThisWeekCents: 145050,
        clockInNotificationsEnabled: true,
        assignedServiceIds: ["srv-color", "srv-rejuv", "srv-hydration"],
      },
      {
        id: "staff-clara",
        firstName: "Clara",
        lastName: "Mendes",
        fullName: "Clara Mendes",
        initials: "CM",
        role: "Especialista em Estética & Laser",
        email: "clara.mendes@luveastudio.app",
        phone: "+55 (11) 99123-4567",
        avatarColor: "#DDD6FE",
        serviceCommissionPercent: 50,
        productCommissionPercent: 15,
        weeklyGoalCents: 350000,
        bookedThisWeekCents: 185000,
        clockInNotificationsEnabled: true,
        assignedServiceIds: ["srv-rejuv", "srv-hydration"],
      },
    ],
    timeTracking: {
      enabled: true,
      firstBreakTypeEnabled: false,
      firstBreakDurationMinutes: 30,
      activeClockInStaffId: "staff-bruno",
      activeSessionStatus: "clocked_in",
      activeElapsedSeconds: 15678, // 04:21:18 (exatamente como no print 06-5-catalog-team-time-tracking.png!)
      logs: [
        {
          id: "ts-1",
          staffId: "staff-bruno",
          staffName: "Bruno Fernandes Malossi Silva",
          dateISO: "2026-10-16",
          checkInTime: "09:00",
          checkOutTime: "18:15",
          breakMinutes: 45,
          totalWorkedSeconds: 30600,
          status: "completed",
        },
      ],
    },
    marketing: {
      smsCreditsRemaining: 500,
      campaigns: [],
    },
    inventory: [
      {
        id: "inv-prod-1",
        name: "Máscara Reconstrutora K-Pak Professional 500ml",
        sku: "KPAK-500",
        category: "Revenda (Retail)",
        stockQuantity: 14,
        minStockAlert: 5,
        priceCents: 18900,
        costCents: 9500,
      },
      {
        id: "inv-prod-2",
        name: "Sérum Vitamina C 20% Luvea Derm 30ml",
        sku: "LUVEA-VITC",
        category: "Revenda (Retail)",
        stockQuantity: 4,
        minStockAlert: 6,
        priceCents: 16500,
        costCents: 7200,
      },
      {
        id: "inv-prod-3",
        name: "Pó Descolorante Plex Free Dust 1kg",
        sku: "BACK-PLEX",
        category: "Uso Profissional (Backbar)",
        stockQuantity: 8,
        minStockAlert: 3,
        priceCents: 21000,
        costCents: 14000,
      },
    ],
    clinicalCharts: [
      {
        id: "chart-stefany-1",
        clientId: "cli-stefany",
        clientName: "Stefany",
        chartName: "17 de out. de 2026",
        serviceIds: [],
        serviceNames: [],
        providerId: "staff-bruno",
        providerName: "Bruno Fernandes Malossi Silva",
        status: "completed",
        version: 1,
        createdDateLabel: "17 de out. de 2026",
        lastModifiedLabel: "17 de out. de 2026 15:38",
        photos: [],
        productsUsed: [],
        templateType: "soap",
        soapNoteName: "Avaliação e Protocolo Inicial",
        subjective:
          "Cliente relata desejo de iluminação natural sem sensibilizar o couro cabeludo.",
        objective:
          "Fios com boa elasticidade, fundo natural 6.0 com 4cm de crescimento na raiz.",
        assessment:
          "Apta para protocolo de iluminação com proteção de pontes dissulfeto (Plex).",
        plan: "Realizar teste de mecha preventivo, aplicar proteção plex e agendar manutenção de gloss em 30 dias.",
      },
    ],
    settings: {
      personal: {
        firstName: "Bruno",
        lastName: "Fernandes Malossi Silva",
        email: "bfernandescorretor@gmail.com",
        phone: "+1 (520) 752-5522",
        phoneVerified: true,
        licenseNumber: "",
        smsConsent: false,
      },
      preferences: {
        appointmentNotifications: {
          email: true,
          text: true,
          push: true,
        },
        notifyNewReviews: true,
        captureClientNotesFromMe: true,
        sendMeClientNotesBeforeAppointment: true,
        calendarSyncUrl: "webcal://luveastudio.luvea.app/cal/bruno-sync.ics",
        waitlistNotifications: {
          email: true,
          text: true,
          push: true,
        },
      },
      business: {
        businessName: "Bruno Fernandes Malossi Silva",
        bookingSlug: "luvea-studio-bruno",
        legalEntityType: "Sociedade Limitada (LTDA) / Salão Parceiro",
        taxIdCnpjCpf: "48.192.301/0001-82",
        address: "Av. Brigadeiro Faria Lima, 2355 - Sala 804",
        cityState: "São Paulo, SP",
        pixKey: "pix@luveastudio.app",
        defaultDepositPercent: 30,
        requireCardOrPixOnOnlineBooking: true,
        cancellationWindowHours: 24,
        noShowFeePercent: 50,
      },
      website: getDefaultWebsiteBookingConfig("Bruno Fernandes Malossi Silva"),
    },
    lastToastMessage: null,
  };
}

/**
 * Cria o estado inicial limpo e isolado para um novo tenant/estúdio autenticado.
 * NUNCA injeta clientes ou agendamentos fictícios de demonstração.
 */
export function createEmptyTenantStudioState(meta?: {
  fullName?: string;
  businessName?: string;
  subdomain?: string;
  email?: string;
}): StudioState {
  const base = createInitialStudioState();

  const fullName = (meta?.fullName || "Profissional").trim();
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0] || "Profissional";
  const lastName = nameParts.slice(1).join(" ") || "";
  const businessName = (meta?.businessName || "Meu Estúdio").trim();
  const slug = normalizeSubdomainSlug(meta?.subdomain || businessName);
  const email = (meta?.email || "").trim();

  return {
    ...base,
    // Garante que listas de dados privados iniciem 100% vazias
    clients: [],
    calendarEvents: [],
    waitlist: [],
    invoices: [],
    salesHistory: [],
    timeTracking: {
      enabled: false,
      firstBreakTypeEnabled: false,
      firstBreakDurationMinutes: 30,
      activeClockInStaffId: "",
      activeSessionStatus: "idle",
      activeElapsedSeconds: 0,
      logs: [],
    },
    marketing: {
      smsCreditsRemaining: 50,
      campaigns: [],
    },
    staff: [
      {
        id: "staff-owner",
        firstName,
        lastName,
        fullName,
        initials: ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "LU",
        role: "Proprietário & Especialista",
        avatarColor: "#E11D8F",
        email: email,
        phone: "",
        serviceCommissionPercent: 60,
        productCommissionPercent: 20,
        weeklyGoalCents: 580000,
        bookedThisWeekCents: 0,
        clockInNotificationsEnabled: false,
        assignedServiceIds: [],
      },
    ],
    settings: {
      ...base.settings,
      personal: {
        ...base.settings.personal,
        firstName,
        lastName,
        email,
        phone: "",
      },
      business: {
        ...base.settings.business,
        businessName,
        bookingSlug: slug,
        legalEntityType: "Sociedade Limitada (LTDA) / Salão Parceiro",
        taxIdCnpjCpf: "",
        address: "",
        cityState: "",
        pixKey: "",
      },
      website: {
        ...getDefaultWebsiteBookingConfig(businessName),
        subdomainSlug: slug,
        websitePublished: false,
      },
    },
    lastToastMessage: null,
  };
}

// =============================================================================
// TICKET 01 — FUNÇÕES DE DOMÍNIO: ONBOARDING & SITE DE AGENDAMENTO ONLINE
// =============================================================================

export function normalizeSubdomainSlug(raw: string): string {
  if (!raw || typeof raw !== "string") return "meu-estudio";
  const cleaned = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // Se já contém hífens explícitos ou símbolos, preserva formato com hífen
  if (cleaned.includes("-") || /[^a-z0-9\s]/.test(cleaned)) {
    const slug = cleaned.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return slug || "meu-estudio";
  }

  // Caso seja nome alfanumérico com espaços (ex: "Bruno Fernandes Malossi Silva"), une sem espaço
  const compact = cleaned.replace(/\s+/g, "");
  return compact || "meu-estudio";
}

/**
 * Retorna a URL canônica pública do site de agendamento do estúdio.
 * Se o ambiente de execução for o navegador e estiver rodando em localhost / 127.0.0.1,
 * redireciona para `${origin}/site/${slug}` para permitir navegação e testes imediatos em desenvolvimento.
 * Em produção, retorna `https://${slug}.luvea.app`.
 */
export function getBookingSiteUrl(subdomainSlug?: string): string {
  const slug = normalizeSubdomainSlug(subdomainSlug || "meu-estudio");
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname?.toLowerCase() || "";
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1"
    ) {
      return `${window.location.origin}/site/${slug}`;
    }
  }
  return `https://${slug}.luvea.app`;
}

export function getDefaultBookingControls(): BookingControlsConfig {
  return {
    autoApproveMode: "always",
    bookingWindowHours: 2,
    bookingIncrementsMinutes: 15,
    minimizeSchedulingGaps: true,
    maxGapMinutes: 15,
    gapProviderScope: "all",
    requireCardOnFile: "all",
    advanceBookingMonths: 2,
    allowProcessingTimeBooking: true,
    askClientsForPronouns: true,
    cancellations: {
      allowOnlineCancellation: true,
      policyRequired: true,
      policyDetails:
        "Cobramos 30% de taxa de cancelamento para no-shows ou cancelamentos com menos de 24 horas de antecedência do horário agendado.",
      feePercent: 30,
      windowHours: 24,
    },
    waitlistOnlineEnabled: true,
  };
}

export function getDefaultClientNotifications(): ClientNotificationsConfig {
  return {
    hipaaNoticeDismissed: false,
    googleReviewLink: "https://g.page/r/luvea-studio/review",
    items: [
      {
        id: "pre-confirm",
        title: "Confirmation notification",
        description: "Prompt clients before their appointment to confirm.",
        category: "pre_appointment",
        enabled: true,
        channels: ["email", "whatsapp"],
        timingLabel: "72 hours before",
        templateSubject: "Confirmação de Agendamento · {estudio}",
        templateBody:
          "Olá {nome}! Confirmamos seu atendimento no {estudio} para {data} às {horario}? Responda 1 para confirmar ou 2 para reagendar.",
      },
      {
        id: "pre-reminder",
        title: "Reminder notification",
        description: "Send clients a reminder before their appointment.",
        category: "pre_appointment",
        enabled: true,
        channels: ["email", "whatsapp"],
        timingLabel: "24 hours before",
        templateSubject: "Lembrete de Horário · {estudio}",
        templateBody:
          "Oi {nome}! Lembrando do seu horário amanhã às {horario} no {estudio} ({servicos}). Estamos ansiosos para te receber!",
      },
      {
        id: "pre-new-booking",
        title: "New booking alert",
        description: "Alert clients if their appointment has been booked.",
        category: "pre_appointment",
        enabled: true,
        channels: ["email", "whatsapp"],
        timingLabel: "Imediato",
        templateSubject: "Agendamento Realizado com Sucesso · {estudio}",
        templateBody:
          "Seu horário foi agendado com sucesso no {estudio} para {data} às {horario}. Aguardamos você!",
      },
      {
        id: "pre-cancellation",
        title: "Cancellation alert",
        description: "Alert clients if their appointment needs to be canceled.",
        category: "pre_appointment",
        enabled: true,
        channels: ["email", "whatsapp"],
        timingLabel: "Imediato",
        templateSubject: "Agendamento Cancelado · {estudio}",
        templateBody:
          "Seu agendamento para {data} no {estudio} foi cancelado. Para agendar um novo momento, acesse nosso site a qualquer hora.",
      },
      {
        id: "pre-declined",
        title: "Declined alert",
        description: "Alert clients if their appointment has been declined.",
        category: "pre_appointment",
        enabled: true,
        channels: ["email", "whatsapp"],
        timingLabel: "Imediato",
        templateSubject: "Solicitação de Horário · {estudio}",
        templateBody:
          "Olá {nome}, não foi possível confirmar seu horário no {estudio} para este intervalo. Nossa equipe entrará em contato para encontrar a melhor opção para você.",
      },
      {
        id: "pre-reschedule",
        title: "Reschedule alert",
        description: "Alert clients if their appointment has been rescheduled.",
        category: "pre_appointment",
        enabled: true,
        channels: ["email", "whatsapp"],
        timingLabel: "Imediato",
        templateSubject: "Horário Reagendado · {estudio}",
        templateBody:
          "Seu atendimento no {estudio} foi reagendado com sucesso para {data} às {horario}.",
      },
      {
        id: "pre-waitlist-entry",
        title: "Waitlist entry alert",
        description: "Alert clients when they enter the waitlist.",
        category: "pre_appointment",
        enabled: true,
        channels: ["whatsapp"],
        timingLabel: "Imediato",
        templateSubject: "Lista de Espera Confirmada · {estudio}",
        templateBody:
          "Você está na lista de espera do {estudio}! Assim que um encaixe surgir para seu serviço, avisaremos você imediatamente aqui pelo WhatsApp.",
      },
      {
        id: "pre-waitlist-cancel",
        title: "Waitlist cancellation alert",
        description: "Alert clients when they are removed from the waitlist.",
        category: "pre_appointment",
        enabled: true,
        channels: ["whatsapp"],
        timingLabel: "Imediato",
        templateSubject: "Remoção da Lista de Espera · {estudio}",
        templateBody:
          "Você foi retirado da lista de espera do {estudio} conforme solicitado.",
      },
      {
        id: "post-review",
        title: "Review request",
        description: "Adds a note for clients to review you inside their receipts & follow ups.",
        category: "post_appointment",
        enabled: true,
        channels: ["email", "whatsapp"],
        timingLabel: "2 horas após",
        templateSubject: "Como foi sua experiência no {estudio}?",
        templateBody:
          "Olá {nome}! Amamos cuidar de você hoje. Se puder dedicar 30 segundos para avaliar sua experiência no Google, significará muito para nós: {google_review_link}",
        requiresGoogleLink: true,
      },
      {
        id: "post-thank-you",
        title: "Thank you note",
        description: "Send a thank you note automatically after an appointment.",
        category: "post_appointment",
        enabled: true,
        channels: ["email", "whatsapp"],
        timingLabel: "Imediato após checkout",
        templateSubject: "Obrigado por nos visitar · {estudio}",
        templateBody:
          "Muito obrigado pela sua visita hoje, {nome}! Continue seus cuidados em casa e nos vemos em breve no {estudio}.",
      },
      {
        id: "post-rebooking",
        title: "Rebooking notification",
        description: "Remind clients to book future appointments.",
        category: "post_appointment",
        enabled: true,
        channels: ["whatsapp", "sms"],
        timingLabel: "6 weeks after",
        badge: "gold",
        templateSubject: "Hora de renovar seu visual · {estudio}",
        templateBody:
          "Olá {nome}! Já se passaram 6 semanas desde seu último procedimento no {estudio}. Que tal reservar seu próximo horário para manter seus resultados impecáveis?",
      },
      {
        id: "post-birthday",
        title: "Birthday message",
        description: "Send clients a thoughtful message on their birthday.",
        category: "post_appointment",
        enabled: true,
        channels: ["email", "whatsapp"],
        timingLabel: "No dia do aniversário (09:00)",
        templateSubject: "Feliz Aniversário! Um presente especial do {estudio}",
        templateBody:
          "Parabéns, {nome}! Desejamos muitas alegrias e realizações. O {estudio} preparou uma cortesia especial para você comemorar seu dia conosco. Venha nos visitar!",
      },
    ],
  };
}

export function getDefaultCheckoutSettings(): CheckoutSettingsConfig {
  return {
    acceptBnpl: false,
    bnplFeePercent: 6,
    bnplFixedFeeCents: 30,
    technologyFeePayer: "studio",
    serviceSalesTaxPercent: 0,
    retailSalesTaxPercent: 0,
    allowTapToPay: true,
  };
}

export function getDefaultChartingSettings(): ChartingSettingsConfig {
  return {
    requireProviderSignature: false,
    requireMedicalDirectorSignOff: false,
  };
}

export function getDefaultWebsiteBookingConfig(
  businessName = "Bruno Fernandes Malossi Silva"
): WebsiteBookingSetupConfig {
  return {
    theme: "classic",
    subdomainSlug: normalizeSubdomainSlug(businessName),
    websitePublished: false,
    hasFixedAddress: true,
    doesHouseCalls: false,
    addressLine1: "Rua Mateus Cipullo, 49 casa 7",
    addressLine2: "",
    city: "Praia Grande",
    zipCode: "11724-000",
    state: "SP",
    businessHours: [
      { dayOfWeek: 0, label: "Domingo", isOpen: false, startTime: "08:00", endTime: "14:00" },
      { dayOfWeek: 1, label: "Segunda-feira", isOpen: true, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 2, label: "Terça-feira", isOpen: true, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 3, label: "Quarta-feira", isOpen: true, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 4, label: "Quinta-feira", isOpen: true, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 5, label: "Sexta-feira", isOpen: true, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 6, label: "Sábado", isOpen: true, startTime: "08:00", endTime: "17:00" },
    ],
    autoApproveAppointments: true,
    onlineBookingGuarantee: "pix_deposit",
    paymentsSetup: {
      payoutMethod: "pix_key",
      pixKeyType: "email",
      pixKeyValue: "pix@luveastudio.app",
      bankName: "Nu Pagamentos S.A. (Nubank)",
      routingOrAgency: "0001",
      accountNumber: "1234567-8",
      debitCardLast4: "4678",
      identityVerified: false,
      setupCompleted: false,
    },
    aboutYourBusiness:
      "Espaço de beleza e bem-estar especializado em tratamentos personalizados, estética avançada e cuidados com a saúde capilar.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
    socialAccounts: {
      instagram: "@luveastudio",
      facebook: "",
      twitter: "",
      pinterest: "",
      yelp: "",
      website: "https://luvea.app",
    },
    contentSettings: {
      showReviews: true,
      showPortfolioGallery: true,
      displayServicesVisually: true,
      showTeam: true,
    },
    tracking: {
      googleAnalyticsId: "",
      metaPixelId: "",
      enabled: false,
    },
    bookingControls: getDefaultBookingControls(),
    clientNotifications: getDefaultClientNotifications(),
    checkoutSettings: getDefaultCheckoutSettings(),
    chartingSettings: getDefaultChartingSettings(),
  };
}

export function claimBookingSiteSubdomain(
  state: StudioState,
  subdomainInput: string,
  theme?: BookingSiteThemeId,
  businessName?: string
): StudioState {
  const slug = normalizeSubdomainSlug(subdomainInput);
  const currentWebsite =
    state.settings.website ??
    getDefaultWebsiteBookingConfig(state.settings.business.businessName);
  const updatedWebsite: WebsiteBookingSetupConfig = {
    ...currentWebsite,
    subdomainSlug: slug,
    websitePublished: true,
    theme: theme ?? currentWebsite.theme,
  };

  return {
    ...state,
    onboarding: {
      ...state.onboarding,
      steps: state.onboarding.steps.map((s) =>
        s.id === "booking_site" ? { ...s, completed: true } : s
      ),
    },
    settings: {
      ...state.settings,
      business: {
        ...state.settings.business,
        businessName:
          businessName?.trim() || state.settings.business.businessName,
        bookingSlug: slug,
      },
      website: updatedWebsite,
    },
    lastToastMessage: "URL atualizada com sucesso",
  };
}

export function updateWebsiteSetupConfig(
  state: StudioState,
  patch: Partial<WebsiteBookingSetupConfig>
): StudioState {
  const currentWebsite =
    state.settings.website ??
    getDefaultWebsiteBookingConfig(state.settings.business.businessName);
  return {
    ...state,
    settings: {
      ...state.settings,
      website: {
        ...currentWebsite,
        ...patch,
      },
    },
  };
}

export function completeOnboardingStep(
  state: StudioState,
  stepId: "booking_site" | "add_services" | "start_getting_paid"
): StudioState {
  return {
    ...state,
    onboarding: {
      ...state.onboarding,
      steps: state.onboarding.steps.map((s) =>
        s.id === stepId ? { ...s, completed: true } : s
      ),
    },
    lastToastMessage: "Etapa de Primeiros Passos concluída!",
  };
}

export function importStudioMigrationData(
  state: StudioState,
  payload: {
    sourceName: string;
    clientsCount: number;
    servicesCount: number;
  }
): StudioState {
  const importedClients: ClientProfile[] = Array.from(
    { length: payload.clientsCount },
    (_, idx) => ({
      id: `cli-import-${Date.now()}-${idx}`,
      fullName: idx === 0 ? "Helena Vasconcelos" : `Cliente Importado ${idx + 1}`,
      email: `helena.${idx + 1}@importado.com.br`,
      phone: `(11) 99100-000${idx + 1}`,
      avatarColor: "#FBCFE8",
      createdAtISO: "2026-10-17",
      lastVisitISO: "2026-09-20",
      daysSinceLastVisit: 27,
      totalSpentCents: 32000,
      visitsCount: 2,
      noShowCount: 0,
      sendAutomaticReminders: true,
      notesAndForms: {
        anamnesis: `Dados transferidos de ${payload.sourceName}.`,
        allergies: "Nenhuma.",
        formulasAndPreferences: "Importado gratuitamente pelo assistente de migração.",
        birthday: "10/10",
      },
      autoSortedPhotos: [],
      packages: [],
      memberships: [],
    })
  );

  return {
    ...state,
    clients: [...importedClients, ...state.clients],
    onboarding: {
      ...state.onboarding,
      importedData: true,
    },
    lastToastMessage: `Dados de "${payload.sourceName}" importados com sucesso!`,
  };
}

export function checkCalendarSlotConflict(
  state: StudioState,
  params: {
    dateISO: string;
    startMin: number;
    endMin: number;
    providerId: string;
    providerFullName: string;
    requiredResourceIds: string[];
    excludeEventId?: string;
  }
):
  | { ok: true }
  | { ok: false; conflictType: "resource" | "provider"; message: string } {
  const sameDayEvents = state.calendarEvents.filter(
    (ev) =>
      ev.dateISO === params.dateISO &&
      ev.status !== "canceled" &&
      ev.eventType === "appointment" &&
      (!params.excludeEventId || ev.id !== params.excludeEventId)
  );

  for (const ev of sameDayEvents) {
    const evStart = parseTimeMinutes(ev.startTime);
    const evEnd = parseTimeMinutes(ev.endTime);
    const overlapsTotalWindow =
      params.startMin < evEnd && params.endMin > evStart;
    if (!overlapsTotalWindow) continue;

    // 1. Verifica conflito de Recurso Físico (Salas e Equipamentos)
    const sharedResourceIds = params.requiredResourceIds.filter((rId) =>
      ev.resourceIds.includes(rId)
    );
    if (sharedResourceIds.length > 0) {
      const resNames = state.resources
        .filter((r) => sharedResourceIds.includes(r.id))
        .map((r) => r.name)
        .join(", ");
      return {
        ok: false,
        conflictType: "resource",
        message: `Conflito de Recurso Físico: ${resNames} já está reservado das ${ev.startTime} às ${ev.endTime} (${ev.clientName}).`,
      };
    }

    // 2. Verifica conflito de Profissional (permitindo encaixe dentro da janela de Tempo de Processamento)
    if (ev.providerId === params.providerId) {
      const hasProcessingGap = ev.processingDurationMinutes > 0;
      const gapStart = evStart + ev.processingStartOffsetMinutes;
      const gapEnd = gapStart + ev.processingDurationMinutes;
      const fitsInProcessingGap =
        hasProcessingGap &&
        params.startMin >= gapStart &&
        params.endMin <= gapEnd;

      if (!fitsInProcessingGap) {
        return {
          ok: false,
          conflictType: "provider",
          message: `Conflito de Agenda: ${params.providerFullName} já possui atendimento ativo das ${ev.startTime} às ${ev.endTime}.`,
        };
      }
    }
  }

  return { ok: true };
}

export function bookFromPublicSite(
  state: StudioState,
  input: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    serviceId: string;
    providerId: string;
    dateISO: string;
    startTime: string;
    selectedAddOnIds: string[];
    depositPaidViaPix?: boolean;
    cardOnFile?: {
      last4: string;
      cardHolder: string;
    };
  }
): { ok: true; state: StudioState } | { ok: false; error: string } {
  const service = state.services.find((s) => s.id === input.serviceId);
  if (!service) {
    return { ok: false, error: "Serviço não encontrado." };
  }
  const provider =
    state.staff.find((p) => p.id === input.providerId) ?? state.staff[0];

  const addOnsSelected = service.addOns.filter((a) =>
    input.selectedAddOnIds.includes(a.id)
  );
  const addOnsDuration = addOnsSelected.reduce(
    (sum, a) => sum + a.durationMinutes,
    0
  );
  const addOnsPrice = addOnsSelected.reduce((sum, a) => sum + a.priceCents, 0);

  const activeDuration = service.durationMinutes + addOnsDuration;
  const blockAfter = service.blockTimeEnabled ? service.blockAfterMinutes : 0;
  const startMin = parseTimeMinutes(input.startTime);
  const endMin = startMin + activeDuration + blockAfter;
  const endTime = formatMinutesToHHMM(endMin);
  const totalCents = service.priceCents + addOnsPrice;
  const depositCents = service.requireDeposit ? service.depositCents : 0;

  // Validação de horário de funcionamento e expediente do negócio
  const websiteConfig = state.settings.website;
  if (websiteConfig?.businessHours && websiteConfig.businessHours.length > 0) {
    const [year, month, day] = input.dateISO.split("-").map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const dayOfWeek = dateObj.getUTCDay(); // 0 = Domingo, 1 = Segunda, etc.
    const daySchedule = websiteConfig.businessHours.find(
      (h) => h.dayOfWeek === dayOfWeek
    );

    if (daySchedule) {
      if (!daySchedule.isOpen) {
        return {
          ok: false,
          error: `O estúdio não realiza atendimentos em ${daySchedule.label.toLowerCase()}s.`,
        };
      }
      const openMin = parseTimeMinutes(daySchedule.startTime);
      const closeMin = parseTimeMinutes(daySchedule.endTime);
      if (startMin < openMin || endMin > closeMin) {
        return {
          ok: false,
          error: `Horário solicitado (${input.startTime} às ${endTime}) está fora do expediente de ${daySchedule.label} (${daySchedule.startTime} às ${daySchedule.endTime}).`,
        };
      }
    }
  }

  const conflictCheck = checkCalendarSlotConflict(state, {
    dateISO: input.dateISO,
    startMin,
    endMin,
    providerId: provider.id,
    providerFullName: provider.fullName,
    requiredResourceIds: service.requiredResourceIds,
  });
  if (!conflictCheck.ok) {
    return { ok: false, error: conflictCheck.message };
  }

  // Verifica se o cliente já existe ou cria novo
  let existingClient = state.clients.find(
    (c) =>
      c.email.toLowerCase() === input.clientEmail.toLowerCase() ||
      c.fullName.toLowerCase() === input.clientName.toLowerCase()
  );

  const isDepositPaid = Boolean(input.depositPaidViaPix);
  let updatedClients = state.clients;
  if (!existingClient) {
    existingClient = {
      id: `cli-online-${Date.now()}`,
      fullName: input.clientName,
      email: input.clientEmail,
      phone: input.clientPhone,
      avatarColor: "#FBCFE8",
      createdAtISO: input.dateISO,
      lastVisitISO: input.dateISO,
      daysSinceLastVisit: 0,
      totalSpentCents: isDepositPaid ? depositCents : 0,
      visitsCount: 1,
      noShowCount: 0,
      sendAutomaticReminders: true,
      notesAndForms: {
        anamnesis: "Cadastro automático via Site de Agendamento Online.",
        allergies: "A preencher na visita.",
        formulasAndPreferences: "",
        birthday: "",
      },
      autoSortedPhotos: [],
      packages: [],
      memberships: [],
    };
    updatedClients = [existingClient, ...state.clients];
  }

  const autoApprove =
    websiteConfig !== undefined ? websiteConfig.autoApproveAppointments : true;
  const guaranteeMode = websiteConfig?.onlineBookingGuarantee ?? "pix_deposit";

  let initialStatus: "confirmed" | "pending" = "pending";
  if (autoApprove) {
    if (guaranteeMode === "pix_deposit") {
      initialStatus = isDepositPaid ? "confirmed" : "pending";
    } else {
      // "card_on_file" ou "none"
      initialStatus = "confirmed";
    }
  } else {
    // Aprovação manual pelo profissional
    initialStatus = "pending";
  }

  const newEvent: CalendarEventItem = {
    id: `evt-online-${Date.now()}`,
    eventType: "appointment",
    dateISO: input.dateISO,
    startTime: input.startTime,
    endTime,
    activeDurationMinutes: activeDuration,
    processingStartOffsetMinutes: service.processingTimeEnabled
      ? service.processingStartOffsetMinutes
      : 0,
    processingDurationMinutes: service.processingTimeEnabled
      ? service.processingDurationMinutes
      : 0,
    blockAfterMinutes: blockAfter,
    providerId: provider.id,
    providerName: provider.fullName,
    clientId: existingClient.id,
    clientName: existingClient.fullName,
    serviceIds: [service.id],
    serviceNames: [service.name],
    resourceIds: service.requiredResourceIds,
    addressOrNotes: input.cardOnFile
      ? `Agendado via Site Online (Cartão final ${input.cardOnFile.last4} em arquivo)`
      : "Agendado via Site Online",
    isRepeating: false,
    collectDeposit: guaranteeMode === "pix_deposit" && service.requireDeposit,
    depositCents: guaranteeMode === "pix_deposit" ? depositCents : 0,
    depositPaid: isDepositPaid,
    totalCents,
    status: initialStatus,
    calendarColor: service.calendarColor,
    whatsappReminderSent: true,
    whatsappClientReply: initialStatus === "confirmed" ? "1_confirmed" : "none",
  };

  const toastMsg =
    initialStatus === "confirmed"
      ? `Reserva online de ${existingClient.fullName} confirmada!`
      : `Reserva online de ${existingClient.fullName} recebida para aprovação!`;

  return {
    ok: true,
    state: {
      ...state,
      clients: updatedClients,
      calendarEvents: [newEvent, ...state.calendarEvents],
      onboarding: {
        ...state.onboarding,
        steps: state.onboarding.steps.map((s) =>
          s.id === "booking_site" ? { ...s, completed: true } : s
        ),
      },
      lastToastMessage: toastMsg,
    },
  };
}

// =============================================================================
// TICKET 02 — CATÁLOGO (SERVIÇOS, PACOTES, ASSINATURAS E RECURSOS FÍSICOS)
// =============================================================================

export function toggleSuggestedService(
  state: StudioState,
  suggestionId: string
): StudioState {
  return {
    ...state,
    suggestedServices: state.suggestedServices.map((item) =>
      item.id === suggestionId ? { ...item, selected: !item.selected } : item
    ),
  };
}

export function createSelectedSuggestedServices(
  state: StudioState
): StudioState {
  const selected = state.suggestedServices.filter((s) => s.selected);
  if (selected.length === 0) return state;

  const createdServices: ServiceCatalogItem[] = selected.map((sug, idx) => ({
    id: `srv-sug-${Date.now()}-${idx}`,
    name: sug.name,
    description: generateServiceDescriptionAI(sug.name, sug.category),
    category: sug.category,
    calendarColor: idx % 2 === 0 ? "#E11D8F" : "#6E56CF",
    onlineBookingEnabled: true,
    priceType: "fixed",
    priceCents: sug.priceCents,
    requireDeposit: true,
    depositCents: Math.round(sug.priceCents * 0.3),
    durationMinutes: sug.durationMinutes,
    processingTimeEnabled: false,
    processingStartOffsetMinutes: 0,
    processingDurationMinutes: 0,
    blockTimeEnabled: true,
    blockAfterMinutes: 10,
    requiredResourceIds: [],
    options: [],
    addOns: [],
  }));

  return {
    ...state,
    services: [...createdServices, ...state.services],
    suggestedServices: state.suggestedServices.map((s) => ({
      ...s,
      selected: false,
    })),
    onboarding: {
      ...state.onboarding,
      steps: state.onboarding.steps.map((s) =>
        s.id === "add_services" ? { ...s, completed: true } : s
      ),
    },
    lastToastMessage: `${createdServices.length} serviço(s) sugerido(s) adicionado(s) ao catálogo!`,
  };
}

export function regenerateSuggestedServices(state: StudioState): StudioState {
  const alternatePool: SuggestedServiceTemplate[] = [
    {
      id: `sug-alt-1-${Date.now()}`,
      name: "Mechas Contour & Glossing Personalizado",
      category: "Colorimetria & Cabelo",
      priceCents: 42000,
      durationMinutes: 120,
      selected: false,
    },
    {
      id: `sug-alt-2-${Date.now()}`,
      name: "Detox Capilar c/ Argila Branca & Ozônio",
      category: "Terapia Capilar",
      priceCents: 18500,
      durationMinutes: 50,
      selected: false,
    },
    {
      id: `sug-alt-3-${Date.now()}`,
      name: "Design de Sobrancelhas & Brow Lamination",
      category: "Olhar & Sobrancelhas",
      priceCents: 14000,
      durationMinutes: 45,
      selected: false,
    },
  ];
  return {
    ...state,
    suggestedServices: alternatePool,
    lastToastMessage: "Novas sugestões de serviços geradas por IA!",
  };
}

export function generateServiceDescriptionAI(
  serviceName: string,
  category: string
): string {
  return `Experiência exclusiva de ${serviceName} (${category || "Estética & Beleza"}): avaliação personalizada, produtos de alta performance e acabamento impecável pensado para realçar sua beleza com conforto e durabilidade.`;
}

export function saveCatalogService(
  state: StudioState,
  input: Partial<Omit<ServiceCatalogItem, "id">> & {
    id?: string;
    name: string;
    priceCents: number;
    durationMinutes: number;
  }
): StudioState {
  const newService: ServiceCatalogItem = {
    id: input.id ?? `srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name,
    description: input.description ?? "",
    category: input.category ?? "Geral",
    calendarColor: input.calendarColor ?? "#E11D8F",
    onlineBookingEnabled: input.onlineBookingEnabled ?? true,
    priceType: input.priceType ?? "fixed",
    priceCents: input.priceCents,
    requireDeposit: input.requireDeposit ?? false,
    depositCents: input.depositCents ?? 0,
    durationMinutes: input.durationMinutes,
    processingTimeEnabled: input.processingTimeEnabled ?? false,
    processingStartOffsetMinutes: input.processingStartOffsetMinutes ?? 0,
    processingDurationMinutes: input.processingDurationMinutes ?? 0,
    blockTimeEnabled: input.blockTimeEnabled ?? false,
    blockAfterMinutes: input.blockAfterMinutes ?? 0,
    requiredResourceIds: input.requiredResourceIds ?? [],
    options: input.options ?? [],
    addOns: input.addOns ?? [],
    imageUrl: input.imageUrl,
  };

  const exists = state.services.some((s) => s.id === newService.id);
  const updatedServices = exists
    ? state.services.map((s) => (s.id === newService.id ? newService : s))
    : [newService, ...state.services];

  return {
    ...state,
    services: updatedServices,
    onboarding: {
      ...state.onboarding,
      steps: state.onboarding.steps.map((s) =>
        s.id === "add_services" ? { ...s, completed: true } : s
      ),
    },
    lastToastMessage: `Serviço "${newService.name}" salvo com sucesso!`,
  };
}

export function saveCatalogPackage(
  state: StudioState,
  input: Omit<PackageCatalogItem, "id"> & { id?: string }
): StudioState {
  const pkg: PackageCatalogItem = {
    ...input,
    id: input.id ?? `pkg-${Date.now()}`,
  };
  return {
    ...state,
    packages: [pkg, ...state.packages],
    lastToastMessage: `Pacote "${pkg.name}" salvo com sucesso!`,
  };
}

export function saveCatalogMembership(
  state: StudioState,
  input: Omit<MembershipPlanItem, "id" | "activeSubscribersCount"> & {
    id?: string;
    activeSubscribersCount?: number;
  }
): StudioState {
  const plan: MembershipPlanItem = {
    id: input.id ?? `mem-${Date.now()}`,
    name: input.name,
    description: input.description,
    monthlyPriceCents: input.monthlyPriceCents,
    includedCreditsPerMonth: input.includedCreditsPerMonth,
    discountPercentOnExtras: input.discountPercentOnExtras,
    activeSubscribersCount: input.activeSubscribersCount ?? 1,
  };
  return {
    ...state,
    memberships: [plan, ...state.memberships],
    lastToastMessage: `Assinatura "${plan.name}" criada com sucesso!`,
  };
}

export function savePhysicalResource(
  state: StudioState,
  input: Omit<PhysicalResource, "id"> & { id?: string }
): StudioState {
  const resource: PhysicalResource = {
    ...input,
    id: input.id ?? `res-${Date.now()}`,
  };
  return {
    ...state,
    resources: [resource, ...state.resources],
    lastToastMessage: `Recurso "${resource.name}" adicionado com sucesso!`,
  };
}

// =============================================================================
// TICKET 03 — AGENDA (CALENDAR), SALTO DE SEMANAS, TRAVA DE RECURSOS E ENCAIXES
// =============================================================================

export function skipCalendarByWeeks(
  state: StudioState,
  weeksToAdd: number
): StudioState {
  const nextDateISO = addWeeksToDateISO(
    state.calendarView.selectedDateISO,
    weeksToAdd
  );
  return {
    ...state,
    calendarView: {
      ...state.calendarView,
      selectedDateISO: nextDateISO,
    },
  };
}

export function validateAndCreateCalendarEvent(
  state: StudioState,
  input: {
    eventType: CalendarEventType;
    dateISO: string;
    startTime: string;
    endTime?: string;
    providerId: string;
    clientId?: string;
    newClientInline?: { fullName: string; email: string; phone: string };
    serviceIds: string[];
    addressOrNotes: string;
    isRepeating: boolean;
    collectDeposit: boolean;
  }
):
  | { ok: true; state: StudioState; createdEvent: CalendarEventItem }
  | { ok: false; conflictType: "resource" | "provider"; message: string } {
  const provider =
    (state.staff.find((s) => s.id === input.providerId) ||
      state.staff.find(
        (s) =>
          s.fullName.trim().toLowerCase() ===
          (input.providerId || "").trim().toLowerCase()
      ) ||
      state.staff.find(
        (s) =>
          s.id.toLowerCase() === (input.providerId || "").toLowerCase()
      )) ??
    state.staff[0];

  // Resolve ou cria cliente inline
  let updatedClients = state.clients;
  let client = state.clients.find((c) => c.id === input.clientId);
  if (!client && input.newClientInline?.fullName) {
    const inlineNameNorm = input.newClientInline.fullName.trim().toLowerCase();
    const existing = state.clients.find(
      (c) => c.fullName.trim().toLowerCase() === inlineNameNorm
    );
    if (existing) {
      client = existing;
    } else {
      const newClientId = generateUuid();
      client = {
        id: newClientId,
        fullName: input.newClientInline.fullName.trim(),
        email: input.newClientInline.email || "cliente@luveastudio.app",
        phone: input.newClientInline.phone || "(11) 99999-0000",
        avatarColor: "#FBCFE8",
        createdAtISO: input.dateISO,
        lastVisitISO: input.dateISO,
        daysSinceLastVisit: 0,
        totalSpentCents: 0,
        visitsCount: 1,
        noShowCount: 0,
        sendAutomaticReminders: true,
        notesAndForms: {
          anamnesis: "",
          allergies: "",
          formulasAndPreferences: "",
          birthday: "",
        },
        autoSortedPhotos: [],
        packages: [],
        memberships: [],
      };
      updatedClients = [client, ...state.clients];
    }
  }

  // Se for Entrada na Lista de Espera, adiciona também na lista de espera
  const selectedServices = state.services.filter((s) =>
    input.serviceIds.includes(s.id)
  );
  const primaryService = selectedServices[0] ?? state.services[0];

  const activeDuration =
    selectedServices.length > 0
      ? selectedServices.reduce((acc, s) => acc + s.durationMinutes, 0)
      : 60;
  const blockAfter =
    selectedServices.length > 0
      ? selectedServices.reduce(
          (acc, s) => acc + (s.blockTimeEnabled ? s.blockAfterMinutes : 0),
          0
        )
      : 0;
  const processingOffset = primaryService?.processingTimeEnabled
    ? primaryService.processingStartOffsetMinutes
    : 0;
  const processingDuration = primaryService?.processingTimeEnabled
    ? primaryService.processingDurationMinutes
    : 0;

  const startMin = parseTimeMinutes(input.startTime);
  const endMin = input.endTime
    ? parseTimeMinutes(input.endTime)
    : startMin + activeDuration + blockAfter;
  const computedEndTime = formatMinutesToHHMM(endMin);

  const requiredResourceIds = Array.from(
    new Set(selectedServices.flatMap((s) => s.requiredResourceIds))
  );

  // Validação de conflito em agendamentos existentes do mesmo dia
  if (input.eventType === "appointment") {
    const conflictCheck = checkCalendarSlotConflict(state, {
      dateISO: input.dateISO,
      startMin,
      endMin,
      providerId: provider.id,
      providerFullName: provider.fullName,
      requiredResourceIds,
    });
    if (!conflictCheck.ok) {
      return conflictCheck;
    }
  }

  const totalCents = selectedServices.reduce((acc, s) => acc + s.priceCents, 0);
  const depositCents = input.collectDeposit
    ? selectedServices.reduce(
        (acc, s) => acc + (s.depositCents || Math.round(s.priceCents * 0.3)),
        0
      )
    : 0;

  const newEvent: CalendarEventItem = {
    id: generateUuid(),
    eventType: input.eventType,
    dateISO: input.dateISO,
    startTime: input.startTime,
    endTime: computedEndTime,
    activeDurationMinutes: Math.max(15, endMin - startMin),
    processingStartOffsetMinutes: processingOffset,
    processingDurationMinutes: processingDuration,
    blockAfterMinutes: blockAfter,
    providerId: provider.id,
    providerName: provider.fullName,
    clientId: client?.id,
    clientName:
      input.eventType === "personal_block"
        ? "Bloqueio Pessoal"
        : input.eventType === "working_hours"
          ? "Ajuste de Expediente"
          : client?.fullName ?? "Cliente s/ Cadastro",
    serviceIds: selectedServices.map((s) => s.id),
    serviceNames:
      selectedServices.length > 0
        ? selectedServices.map((s) => s.name)
        : [
            input.eventType === "personal_block"
              ? "Indisponível / Pessoal"
              : "Horário Especial",
          ],
    resourceIds: requiredResourceIds,
    addressOrNotes: input.addressOrNotes,
    isRepeating: input.isRepeating,
    collectDeposit: input.collectDeposit,
    depositCents,
    depositPaid: false,
    totalCents,
    status: input.collectDeposit ? "pending" : "confirmed",
    calendarColor:
      input.eventType === "personal_block"
        ? "#64748B"
        : primaryService?.calendarColor ?? "#E11D8F",
    whatsappReminderSent: false,
    whatsappClientReply: "none",
  };

  let updatedWaitlist = state.waitlist;
  if (input.eventType === "waitlist_entry" && client) {
    updatedWaitlist = [
      {
        id: `wl-${Date.now()}`,
        clientId: client.id,
        clientName: client.fullName,
        clientPhone: client.phone,
        providerId: provider.id,
        providerName: provider.fullName,
        serviceId: primaryService.id,
        serviceName: primaryService.name,
        preferredDateISO: input.dateISO,
        preferredTimeWindow: `${input.startTime} — ${computedEndTime}`,
        notes: input.addressOrNotes || "Adicionado pelo drawer da Agenda.",
        createdAtISO: input.dateISO,
      },
      ...state.waitlist,
    ];
  }

  return {
    ok: true,
    createdEvent: newEvent,
    state: {
      ...state,
      clients: updatedClients,
      waitlist: updatedWaitlist,
      calendarEvents: [newEvent, ...state.calendarEvents],
      lastToastMessage:
        input.eventType === "appointment"
          ? `Agendamento de ${newEvent.clientName} criado às ${newEvent.startTime}!`
          : `Evento (${input.eventType}) registrado na agenda!`,
    },
  };
}

export function bookFromWaitlistEntry(
  state: StudioState,
  waitlistId: string,
  startTime: string
): StudioState {
  const entry = state.waitlist.find((w) => w.id === waitlistId);
  if (!entry) return state;

  const service =
    state.services.find((s) => s.id === entry.serviceId) ?? state.services[0];
  const startMin = parseTimeMinutes(startTime);
  const blockAfter = service.blockTimeEnabled ? service.blockAfterMinutes : 0;
  const endMin = startMin + service.durationMinutes + blockAfter;
  const endTime = formatMinutesToHHMM(endMin);

  const conflictCheck = checkCalendarSlotConflict(state, {
    dateISO: entry.preferredDateISO,
    startMin,
    endMin,
    providerId: entry.providerId,
    providerFullName: entry.providerName,
    requiredResourceIds: service.requiredResourceIds,
  });
  if (!conflictCheck.ok) {
    return {
      ...state,
      lastToastMessage: conflictCheck.message,
    };
  }

  const createdEvent: CalendarEventItem = {
    id: `evt-wl-${Date.now()}`,
    eventType: "appointment",
    dateISO: entry.preferredDateISO,
    startTime,
    endTime,
    activeDurationMinutes: service.durationMinutes,
    processingStartOffsetMinutes: service.processingTimeEnabled
      ? service.processingStartOffsetMinutes
      : 0,
    processingDurationMinutes: service.processingTimeEnabled
      ? service.processingDurationMinutes
      : 0,
    blockAfterMinutes: blockAfter,
    providerId: entry.providerId,
    providerName: entry.providerName,
    clientId: entry.clientId,
    clientName: entry.clientName,
    serviceIds: [service.id],
    serviceNames: [service.name],
    resourceIds: service.requiredResourceIds,
    addressOrNotes: `Encaixado da Lista de Espera · ${entry.notes}`,
    isRepeating: false,
    collectDeposit: service.requireDeposit,
    depositCents: service.depositCents,
    depositPaid: false,
    totalCents: service.priceCents,
    status: "confirmed",
    calendarColor: service.calendarColor,
    whatsappReminderSent: true,
    whatsappClientReply: "1_confirmed",
  };

  return {
    ...state,
    waitlist: state.waitlist.filter((w) => w.id !== waitlistId),
    calendarEvents: [createdEvent, ...state.calendarEvents],
    lastToastMessage: `${entry.clientName} movido(a) da Lista de Espera para a Agenda às ${startTime}!`,
  };
}

export function rebookAppointmentOneTap(
  state: StudioState,
  eventId: string,
  daysForward: number
): StudioState {
  const source = state.calendarEvents.find((e) => e.id === eventId);
  if (!source) return state;

  const nextDateISO = addDaysToDateISO(source.dateISO, daysForward);
  const rebookedEvent: CalendarEventItem = {
    ...source,
    id: `evt-rebook-${Date.now()}`,
    dateISO: nextDateISO,
    status: "confirmed",
    depositPaid: false,
    whatsappReminderSent: false,
    whatsappClientReply: "none",
    addressOrNotes: `Retorno +${daysForward}d agendado em 1 toque`,
  };

  return {
    ...state,
    calendarEvents: [rebookedEvent, ...state.calendarEvents],
    lastToastMessage: `Retorno de ${source.clientName} agendado para ${nextDateISO} (+${daysForward} dias)!`,
  };
}

export function rescheduleCalendarEvent(
  state: StudioState,
  input: {
    eventId: string;
    newDateISO: string;
    newStartTime: string;
    newEndTime?: string;
    newProviderId?: string;
    allowConflict?: boolean;
    notifyNote?: string;
    status?: "confirmed" | "pending";
  }
): {
  ok: boolean;
  message?: string;
  state: StudioState;
  updatedEvent?: CalendarEventItem;
} {
  const target = state.calendarEvents.find((e) => e.id === input.eventId);
  if (!target) {
    return {
      ok: false,
      message: "Agendamento não encontrado na agenda.",
      state,
    };
  }

  // Resolver duração e novo horário final
  const startMin = parseTimeMinutes(input.newStartTime);
  let endMin: number;
  if (input.newEndTime) {
    endMin = parseTimeMinutes(input.newEndTime);
  } else {
    const duration = target.activeDurationMinutes || 60;
    const block = target.blockAfterMinutes || 0;
    endMin = startMin + duration + block;
  }
  const computedEndTime = formatMinutesToHHMM(endMin);

  // Resolver profissional
  let provider = state.staff.find(
    (s) => s.id === (input.newProviderId || target.providerId)
  );
  if (!provider && input.newProviderId) {
    provider =
      state.staff.find(
        (s) =>
          s.fullName.trim().toLowerCase() ===
          input.newProviderId!.trim().toLowerCase()
      ) ||
      state.staff.find(
        (s) =>
          s.firstName.trim().toLowerCase() ===
          input.newProviderId!.trim().toLowerCase()
      );
  }
  if (!provider) {
    provider =
      state.staff.find((s) => s.id === target.providerId) || state.staff[0];
  }

  // Checagem de conflito se allowConflict não for true
  if (!input.allowConflict && target.eventType === "appointment") {
    const conflict = checkCalendarSlotConflict(state, {
      dateISO: input.newDateISO,
      startMin,
      endMin,
      providerId: provider.id,
      providerFullName: provider.fullName,
      requiredResourceIds: target.resourceIds || [],
      excludeEventId: target.id,
    });
    if (!conflict.ok) {
      return {
        ok: false,
        message: conflict.message,
        state,
      };
    }
  }

  const updatedEvent: CalendarEventItem = {
    ...target,
    dateISO: input.newDateISO,
    startTime: input.newStartTime,
    endTime: computedEndTime,
    activeDurationMinutes: Math.max(15, endMin - startMin),
    providerId: provider.id,
    providerName: provider.fullName,
    status: input.status ?? "confirmed",
    whatsappReminderSent: false,
    whatsappClientReply: "none",
    addressOrNotes: input.notifyNote
      ? `${target.addressOrNotes ? target.addressOrNotes + "\n" : ""}${input.notifyNote}`
      : target.addressOrNotes,
  };

  const updatedEvents = state.calendarEvents.map((e) =>
    e.id === target.id ? updatedEvent : e
  );

  const client = state.clients.find((c) => c.id === target.clientId);

  const newLog: ReceptionAiLog = {
    id: `rec-log-${Date.now()}`,
    timestampLabel: "Agora mesmo",
    clientName: target.clientName,
    clientPhone: client?.phone || "(11) 99888-7766",
    direction: "outbound",
    channel: "WhatsApp 2-Way",
    messageText: `Reagendamento confirmado: ${target.serviceNames.join(" + ")} movido de ${formatDateBR(target.dateISO)} ${target.startTime} para ${formatDateBR(input.newDateISO)} ${input.newStartTime} com ${provider.fullName}.`,
    outcomeBadge: "Reagendado na Agenda",
  };

  const nextState: StudioState = {
    ...state,
    calendarEvents: updatedEvents,
    calendarView: {
      ...state.calendarView,
      selectedDateISO: input.newDateISO,
    },
    reception: {
      ...state.reception,
      logs: [newLog, ...state.reception.logs],
    },
    lastToastMessage: `Agendamento de ${target.clientName} reagendado para ${formatDateBR(input.newDateISO)} às ${input.newStartTime} (${provider.fullName})!`,
  };

  return {
    ok: true,
    state: nextState,
    updatedEvent,
  };
}

// =============================================================================
// TICKET 04 — CLIENTES (CLIENTS), NOTAS/FICHAS E FOTOS AUTO-ORGANIZADAS
// =============================================================================

export function createClientProfile(
  state: StudioState,
  input: {
    id?: string;
    fullName: string;
    email: string;
    phone: string;
    birthday?: string;
    anamnesis?: string;
  }
): StudioState {
  const normName = input.fullName.trim().toLowerCase();
  const existing = state.clients.find(
    (c) => c.fullName.trim().toLowerCase() === normName
  );
  if (existing) {
    return {
      ...state,
      lastToastMessage: `Cliente ${existing.fullName} já cadastrado no estúdio.`,
    };
  }

  const palette = ["#FBCFE8", "#DDD6FE", "#BBF7D0", "#FDE68A", "#BAE6FD"];
  const newClient: ClientProfile = {
    id: input.id ?? generateUuid(),
    fullName: input.fullName.trim(),
    email: input.email || "cliente@luveastudio.app",
    phone: input.phone || "(11) 99999-0000",
    avatarColor: palette[state.clients.length % palette.length],
    createdAtISO: "2026-10-17",
    lastVisitISO: null,
    daysSinceLastVisit: null,
    totalSpentCents: 0,
    visitsCount: 0,
    noShowCount: 0,
    sendAutomaticReminders: true,
    notesAndForms: {
      anamnesis: input.anamnesis ?? "",
      allergies: "",
      formulasAndPreferences: "",
      birthday: input.birthday ?? "",
    },
    autoSortedPhotos: [],
    packages: [],
    memberships: [],
  };

  return {
    ...state,
    clients: [newClient, ...state.clients],
    lastToastMessage: `Cliente ${newClient.fullName} criado com sucesso!`,
  };
}

export function filterClientsByRetention(
  state: StudioState,
  filter: "all" | "absent_30_45" | "vip",
  query: string
): ClientProfile[] {
  const q = query.trim().toLowerCase();
  return state.clients.filter((c) => {
    const matchesSearch =
      !q ||
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (filter === "absent_30_45") {
      return (c.daysSinceLastVisit ?? 0) >= 30;
    }
    if (filter === "vip") {
      return (
        c.totalSpentCents >= 50000 ||
        c.packages.length > 0 ||
        c.memberships.length > 0
      );
    }
    return true;
  });
}

export function updateClientNotesAndForms(
  state: StudioState,
  clientId: string,
  notesAndForms: ClientProfile["notesAndForms"]
): StudioState {
  return {
    ...state,
    clients: state.clients.map((c) =>
      c.id === clientId ? { ...c, notesAndForms } : c
    ),
    lastToastMessage: "Ficha de atendimento e notas salvas com sucesso!",
  };
}

export function uploadAutoSortedClientPhoto(
  state: StudioState,
  clientId: string,
  input: {
    photoUrl: string;
    appointmentDateISO?: string;
    serviceName?: string;
    beforeLabel?: string;
    afterLabel?: string;
  }
): StudioState {
  const client = state.clients.find((c) => c.id === clientId);
  if (!client) return state;

  const latestAppointment = state.calendarEvents.find(
    (e) => e.clientId === clientId && e.eventType === "appointment"
  );
  const dateISO =
    input.appointmentDateISO ??
    latestAppointment?.dateISO ??
    "2026-10-17";
  const serviceName =
    input.serviceName ??
    latestAppointment?.serviceNames[0] ??
    "Atendimento Luvea Studio";

  const existingGroup = client.autoSortedPhotos.find(
    (g) => g.appointmentDateISO === dateISO
  );

  let updatedGroups: ClientPhotoGroup[];
  if (existingGroup) {
    updatedGroups = client.autoSortedPhotos.map((g) =>
      g.id === existingGroup.id
        ? {
            ...g,
            photoUrls: [...g.photoUrls, input.photoUrl],
            beforeLabel: input.beforeLabel ?? g.beforeLabel,
            afterLabel: input.afterLabel ?? g.afterLabel,
          }
        : g
    );
  } else {
    updatedGroups = [
      {
        id: `ph-grp-${Date.now()}`,
        appointmentId: latestAppointment?.id,
        appointmentDateISO: dateISO,
        serviceName,
        beforeLabel: input.beforeLabel ?? "Antes",
        afterLabel: input.afterLabel ?? "Depois",
        photoUrls: [input.photoUrl],
        notes: "Auto-organizada e rotulada pelo agendamento.",
      },
      ...client.autoSortedPhotos,
    ];
  }

  return {
    ...state,
    clients: state.clients.map((c) =>
      c.id === clientId ? { ...c, autoSortedPhotos: updatedGroups } : c
    ),
    lastToastMessage: `Foto de ${client.fullName} adicionada com sucesso!`,
  };
}

export function deleteClientPhoto(
  state: StudioState,
  clientId: string,
  photoUrl: string
): StudioState {
  const client = state.clients.find((c) => c.id === clientId);
  if (!client) return state;

  const updatedGroups = client.autoSortedPhotos
    .map((grp) => ({
      ...grp,
      photoUrls: grp.photoUrls.filter((url) => url !== photoUrl),
    }))
    .filter((grp) => grp.photoUrls.length > 0);

  return {
    ...state,
    clients: state.clients.map((c) =>
      c.id === clientId ? { ...c, autoSortedPhotos: updatedGroups } : c
    ),
    lastToastMessage: "Foto removida com sucesso!",
  };
}

// =============================================================================
// TICKET 05 — PAGAMENTOS (FATURAS, VENDA RÁPIDA POS E VALE-PRESENTES)
// =============================================================================

export function createAndSendInvoice(
  state: StudioState,
  input: {
    title: string;
    providerId: string;
    clientId: string;
    memo: string;
    dueDateISO: string;
    lineItems: InvoiceLineItem[];
    discountCents: number;
    taxCents: number;
  }
): StudioState {
  const provider =
    (state.staff.find((s) => s.id === input.providerId) ||
      state.staff.find(
        (s) =>
          s.fullName.trim().toLowerCase() ===
          (input.providerId || "").trim().toLowerCase()
      ) ||
      state.staff.find(
        (s) =>
          s.id.toLowerCase() === (input.providerId || "").toLowerCase()
      )) ??
    state.staff[0];
  const client =
    state.clients.find((c) => c.id === input.clientId) ?? state.clients[0];

  const subtotalCents = input.lineItems.reduce(
    (sum, item) => sum + item.amountCents * item.quantity,
    0
  );
  const totalCents = Math.max(
    0,
    subtotalCents - input.discountCents + input.taxCents
  );
  const nextNumber = `#${1000949 + state.invoices.length}`;

  const newInvoice: InvoiceItem = {
    id: `inv-${Date.now()}`,
    invoiceNumber: nextNumber,
    title: input.title || "Fatura de Serviços Luvea Studio",
    providerId: provider.id,
    providerName: provider.fullName,
    clientId: client.id,
    clientName: client.fullName,
    clientEmail: client.email,
    memo: input.memo,
    issuedAtISO: "2026-10-17",
    dueDateISO: input.dueDateISO || "2026-10-30",
    lineItems: input.lineItems,
    subtotalCents,
    discountCents: input.discountCents,
    taxCents: input.taxCents,
    totalCents,
    status: "sent",
    paymentLinkUrl: `https://luveastudio.luvea.app/pay/${nextNumber.replace("#", "")}`,
  };

  return {
    ...state,
    invoices: [newInvoice, ...state.invoices],
    onboarding: {
      ...state.onboarding,
      steps: state.onboarding.steps.map((s) =>
        s.id === "start_getting_paid" ? { ...s, completed: true } : s
      ),
    },
    lastToastMessage: `Fatura ${nextNumber} (${formatBRL(totalCents)}) enviada para ${client.fullName}!`,
  };
}

export function executeQuickSaleCheckout(
  state: StudioState,
  input: {
    appointmentId?: string;
    clientId: string;
    providerId: string;
    itemsSummary: string;
    amountCents: number;
    tipCents?: number;
    paymentMethod: SaleHistoryRecord["paymentMethod"];
    status?: SaleHistoryRecord["status"];
    dateISO?: string;
    appointmentTime?: string;
    appointmentTimeLabel?: string;
    redeemPackageId?: string;
    redeemGiftCardId?: string;
  }
): StudioState {
  const client =
    state.clients.find((c) => c.id === input.clientId) ?? state.clients[0];
  const provider =
    (state.staff.find((s) => s.id === input.providerId) ||
      state.staff.find(
        (s) =>
          s.fullName.trim().toLowerCase() ===
          (input.providerId || "").trim().toLowerCase()
      ) ||
      state.staff.find(
        (s) =>
          s.id.toLowerCase() === (input.providerId || "").toLowerCase()
      )) ??
    state.staff[0];

  const saleDateISO = input.dateISO || getTodayDateISO();
  const timeLabel =
    input.appointmentTimeLabel ||
    (input.appointmentTime
      ? formatAppointmentDateLabel(saleDateISO, input.appointmentTime)
      : formatAppointmentDateLabel(saleDateISO, "Agora"));

  const tip = input.tipCents ?? 0;
  const saleStatus = input.status ?? "Pago";
  const newSale: SaleHistoryRecord = {
    id: `sale-${Date.now()}`,
    appointmentTimeLabel: timeLabel,
    dateISO: saleDateISO,
    clientId: client.id,
    clientName: client.fullName,
    providerId: provider.id,
    providerName: provider.fullName,
    itemsSummary: input.itemsSummary,
    status: saleStatus,
    paymentMethod: input.paymentMethod,
    amountCents: input.amountCents,
    tipCents: tip,
  };

  const updatedClients = state.clients.map((c) => {
    if (c.id !== client.id) return c;
    const updatedPackages = c.packages.map((p) =>
      input.redeemPackageId && p.packageId === input.redeemPackageId
        ? { ...p, remainingSessions: Math.max(0, p.remainingSessions - 1) }
        : p
    );
    return {
      ...c,
      totalSpentCents: c.totalSpentCents + input.amountCents + tip,
      visitsCount: c.visitsCount + 1,
      lastVisitISO: saleDateISO,
      daysSinceLastVisit: 0,
      packages: updatedPackages,
    };
  });

  const updatedGiftCards = state.giftCards.map((gc) => {
    if (!input.redeemGiftCardId || gc.id !== input.redeemGiftCardId) return gc;
    const nextBalance = Math.max(0, gc.remainingBalanceCents - input.amountCents);
    return {
      ...gc,
      remainingBalanceCents: nextBalance,
      status: nextBalance === 0 ? ("redeemed" as const) : ("active" as const),
    };
  });

  let updatedEvents: CalendarEventItem[] = state.calendarEvents;
  if (input.appointmentId) {
    updatedEvents = state.calendarEvents.map((ev) =>
      ev.id === input.appointmentId
        ? {
            ...ev,
            dateISO: input.dateISO || ev.dateISO,
            startTime: input.appointmentTime || ev.startTime,
            status:
              saleStatus === "Sinal Pago"
                ? ("confirmed" as const)
                : ("completed" as const),
            depositPaid: true,
          }
        : ev
    );
  } else {
    const serviceMatch = state.services.find(
      (s) =>
        s.name.toLowerCase() === input.itemsSummary.toLowerCase() ||
        input.itemsSummary.toLowerCase().includes(s.name.toLowerCase())
    );
    const serviceNames = serviceMatch
      ? [serviceMatch.name]
      : [input.itemsSummary || "Atendimento Venda Rápida"];
    const serviceIds = serviceMatch ? [serviceMatch.id] : [];
    const duration = serviceMatch?.durationMinutes ?? 60;
    const startMin = parseTimeMinutes(input.appointmentTime || "10:00");
    const endMin = startMin + duration;
    const computedEndTime = formatMinutesToHHMM(endMin);

    const newEvent: CalendarEventItem = {
      id: `evt-qs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      eventType: "appointment",
      dateISO: saleDateISO,
      startTime: input.appointmentTime || "10:00",
      endTime: computedEndTime,
      activeDurationMinutes: duration,
      processingStartOffsetMinutes: 0,
      processingDurationMinutes: 0,
      blockAfterMinutes: 0,
      providerId: provider.id,
      providerName: provider.fullName,
      clientId: client?.id,
      clientName: client?.fullName ?? "Cliente s/ Cadastro",
      serviceIds,
      serviceNames,
      resourceIds: serviceMatch?.requiredResourceIds ?? [],
      addressOrNotes: `Venda Rápida · ${input.paymentMethod} (${saleStatus})`,
      isRepeating: false,
      collectDeposit: saleStatus === "Sinal Pago",
      depositCents: saleStatus === "Sinal Pago" ? input.amountCents : 0,
      depositPaid: true,
      totalCents: input.amountCents,
      status:
        saleStatus === "Sinal Pago"
          ? ("confirmed" as const)
          : ("completed" as const),
      calendarColor: serviceMatch?.calendarColor ?? "#1C1C1E",
      whatsappReminderSent: false,
      whatsappClientReply: "none",
    };
    updatedEvents = [newEvent, ...state.calendarEvents];
  }

  const updatedStaff = state.staff.map((s) =>
    s.id === provider.id
      ? { ...s, bookedThisWeekCents: s.bookedThisWeekCents + input.amountCents }
      : s
  );

  return {
    ...state,
    calendarView: {
      ...state.calendarView,
      selectedDateISO: saleDateISO,
    },
    clients: updatedClients,
    giftCards: updatedGiftCards,
    calendarEvents: updatedEvents,
    staff: updatedStaff,
    salesHistory: [newSale, ...state.salesHistory],
    onboarding: {
      ...state.onboarding,
      steps: state.onboarding.steps.map((s) =>
        s.id === "start_getting_paid" ? { ...s, completed: true } : s
      ),
    },
    lastToastMessage: `${
      saleStatus === "Sinal Pago" ? "Sinal" : "Venda"
    } de ${formatBRL(input.amountCents + tip)} via ${
      input.paymentMethod
    } ${saleStatus === "Sinal Pago" ? "registrado" : "concluída"}!`,
  };
}

export function issueGiftCard(
  state: StudioState,
  input: {
    recipientName: string;
    recipientEmail: string;
    initialBalanceCents: number;
  }
): StudioState {
  const code = `LUVEA-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.round(input.initialBalanceCents / 100)}`;
  const newGiftCard: GiftCardItem = {
    id: `gc-${Date.now()}`,
    code,
    recipientName: input.recipientName,
    recipientEmail: input.recipientEmail,
    initialBalanceCents: input.initialBalanceCents,
    remainingBalanceCents: input.initialBalanceCents,
    status: "active",
    issuedAtISO: "2026-10-17",
  };

  return {
    ...state,
    giftCards: [newGiftCard, ...state.giftCards],
    lastToastMessage: `Vale-presente ${code} (${formatBRL(input.initialBalanceCents)}) emitido!`,
  };
}

// =============================================================================
// TICKET 06 — RECEPÇÃO IA (RECEPTION) & WHATSAPP 2-WAY SYNC
// =============================================================================

export function processWhatsappInboundReply(
  state: StudioState,
  eventId: string,
  reply: "1_confirmed" | "2_reschedule"
): StudioState {
  const targetEvent = state.calendarEvents.find((e) => e.id === eventId);
  if (!targetEvent) return state;

  const updatedEvents = state.calendarEvents.map((e) => {
    if (e.id !== eventId) return e;
    return {
      ...e,
      whatsappReminderSent: true,
      whatsappClientReply: reply,
      status:
        reply === "1_confirmed"
          ? ("confirmed" as const)
          : ("pending" as const),
    };
  });

  const newLog: ReceptionAiLog = {
    id: `rec-log-${Date.now()}`,
    timestampLabel: "Agora mesmo",
    clientName: targetEvent.clientName,
    clientPhone: "(11) 99888-7766",
    direction: "inbound",
    channel: "WhatsApp 2-Way",
    messageText:
      reply === "1_confirmed"
        ? "1 — Confirmado! Estarei no horário combinado."
        : "2 — Preciso reagendar meu horário para mais tarde.",
    outcomeBadge:
      reply === "1_confirmed"
        ? "Confirmado na Agenda"
        : "Solicitou Reagendamento",
  };

  return {
    ...state,
    calendarEvents: updatedEvents,
    reception: {
      ...state.reception,
      logs: [newLog, ...state.reception.logs],
    },
    lastToastMessage:
      reply === "1_confirmed"
        ? `WhatsApp 2-Way: ${targetEvent.clientName} respondeu "1" e confirmou presença!`
        : `WhatsApp 2-Way: ${targetEvent.clientName} respondeu "2" solicitando reagendamento.`,
  };
}

export function formatWhatsAppMessage(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, val] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), val);
  }
  return result;
}

export function updateUserWhatsAppConfig(
  state: StudioState,
  config: Partial<UserWhatsAppConfig>
): StudioState {
  const currentConfig: UserWhatsAppConfig = state.reception.userConfig ?? {
    provider: "evolution_api",
    phoneNumber: state.reception.whatsappNumber || "+55 (11) 94447-7528",
    instanceName: "pessoal",
    apiUrl: "https://api.automab.dev",
    apiKey: "",
    connected: false,
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

  const updatedConfig: UserWhatsAppConfig = {
    ...currentConfig,
    ...config,
    evolutionSettings: {
      ...(currentConfig.evolutionSettings ?? DEFAULT_EVOLUTION_SETTINGS),
      ...(config.evolutionSettings ?? {}),
    },
    templates: {
      ...currentConfig.templates,
      ...(config.templates ?? {}),
    },
  };

  const isConnected = updatedConfig.connected;
  const phoneNumber = updatedConfig.phoneNumber || state.reception.whatsappNumber;

  return {
    ...state,
    reception: {
      ...state.reception,
      whatsappConnected: isConnected,
      whatsappNumber: phoneNumber,
      userConfig: updatedConfig,
    },
    lastToastMessage: isConnected
      ? "WhatsApp conectado e sincronizado com sucesso!"
      : "Configurações de WhatsApp salvas!",
  };
}

export function disconnectUserWhatsApp(state: StudioState): StudioState {
  const currentConfig = state.reception.userConfig;
  const updatedConfig: UserWhatsAppConfig = {
    provider: currentConfig?.provider ?? "evolution_api",
    phoneNumber: currentConfig?.phoneNumber ?? state.reception.whatsappNumber,
    instanceName: currentConfig?.instanceName ?? "",
    apiUrl: currentConfig?.apiUrl,
    apiKey: "",
    connected: false,
    connectedAt: undefined,
    pairingQrCode: undefined,
    templates: currentConfig?.templates ?? {
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

  return {
    ...state,
    reception: {
      ...state.reception,
      whatsappConnected: false,
      userConfig: updatedConfig,
    },
    lastToastMessage: "WhatsApp desconectado do estúdio.",
  };
}

// =============================================================================
// TICKET 07 — EQUIPE (TEAM): COMISSÕES, FECHAMENTO DE REPASSE E PONTO
// =============================================================================

export interface PayrollStaffSummary {
  staffId: string;
  staffName: string;
  role: string;
  bookedCents: number;
  serviceCommissionCents: number;
  productCommissionCents: number;
  tipsCents: number;
  loggedHours: number;
  totalPayoutCents: number;
}

export function calculatePayrollSummary(
  state: StudioState
): PayrollStaffSummary[] {
  return state.staff.map((member) => {
    // 1. Vendas diretas registradas no histórico
    const memberSales = state.salesHistory.filter(
      (s) => s.providerId === member.id && s.status !== "Reembolsado"
    );
    const salesSumCents = memberSales.reduce((acc, s) => acc + s.amountCents, 0);

    // 2. Agendamentos na agenda atribuídos a este profissional (cálculo dinâmico real)
    const memberEvents = state.calendarEvents.filter(
      (e) =>
        (e.providerId === member.id ||
          e.providerName?.toLowerCase() === member.fullName?.toLowerCase()) &&
        e.status !== "canceled"
    );
    const eventsSumCents = memberEvents.reduce(
      (acc, e) => acc + (e.totalCents || 0),
      0
    );

    const salesTotalCents =
      eventsSumCents + salesSumCents > 0
        ? eventsSumCents + salesSumCents
        : state.calendarEvents.length > 0
        ? 0
        : member.bookedThisWeekCents || 0;
    const tipsCents = memberSales.reduce((acc, s) => acc + s.tipCents, 0);

    const serviceCommissionCents = Math.round(
      salesTotalCents * (member.serviceCommissionPercent / 100)
    );
    const productCommissionCents = Math.round(
      salesTotalCents * 0.1 * (member.productCommissionPercent / 100)
    );

    const memberLogs = state.timeTracking.logs.filter(
      (l) => l.staffId === member.id
    );
    const totalSeconds =
      memberLogs.reduce((acc, l) => acc + l.totalWorkedSeconds, 0) +
      (state.timeTracking.activeClockInStaffId === member.id
        ? state.timeTracking.activeElapsedSeconds
        : 0);
    const loggedHours = Math.round((totalSeconds / 3600) * 10) / 10;

    return {
      staffId: member.id,
      staffName: member.fullName,
      role: member.role,
      bookedCents: salesTotalCents,
      serviceCommissionCents,
      productCommissionCents,
      tipsCents,
      loggedHours,
      totalPayoutCents:
        serviceCommissionCents + productCommissionCents + tipsCents,
    };
  });
}

export function toggleTimeclockAction(
  state: StudioState,
  action: "check_in" | "take_break" | "resume_work" | "check_out"
): StudioState {
  const activeMember =
    state.staff.find((s) => s.id === state.timeTracking.activeClockInStaffId) ??
    state.staff[0];

  if (action === "check_in") {
    return {
      ...state,
      timeTracking: {
        ...state.timeTracking,
        activeSessionStatus: "clocked_in",
        activeElapsedSeconds: 0,
      },
      lastToastMessage: `Ponto iniciado (Check in) para ${activeMember.fullName}!`,
    };
  }

  if (action === "take_break") {
    return {
      ...state,
      timeTracking: {
        ...state.timeTracking,
        activeSessionStatus: "on_break",
      },
      lastToastMessage: `Intervalo (Break) iniciado para ${activeMember.fullName}.`,
    };
  }

  if (action === "resume_work") {
    return {
      ...state,
      timeTracking: {
        ...state.timeTracking,
        activeSessionStatus: "clocked_in",
      },
      lastToastMessage: `Retorno do intervalo registrado para ${activeMember.fullName}.`,
    };
  }

  // check_out
  const newLog: TimesheetLog = {
    id: `ts-${Date.now()}`,
    staffId: activeMember.id,
    staffName: activeMember.fullName,
    dateISO: "2026-10-17",
    checkInTime: "09:00",
    checkOutTime: "13:21",
    breakMinutes: state.timeTracking.firstBreakTypeEnabled
      ? state.timeTracking.firstBreakDurationMinutes
      : 15,
    totalWorkedSeconds: state.timeTracking.activeElapsedSeconds || 15678,
    status: "completed",
  };

  return {
    ...state,
    timeTracking: {
      ...state.timeTracking,
      activeSessionStatus: "idle",
      activeElapsedSeconds: 0,
      logs: [newLog, ...state.timeTracking.logs],
    },
    lastToastMessage: `Saída (Check out) registrada e sincronizada com a Folha de Pagamento!`,
  };
}

// =============================================================================
// TICKET 08 — MARKETING (CAMPANHAS IA) & CONFIGURAÇÕES (SETTINGS)
// =============================================================================

export function generateMarketingDraftAI(
  templateKind: "absent_45d" | "installments_pix" | "special_date",
  providerFullName: string
): { subject: string; message: string } {
  if (templateKind === "installments_pix") {
    return {
      subject: "Novidade no Luvea Studio: Reserve agora com Sinal Pix ou Parcelamento!",
      message: `Olá! Aqui é ${providerFullName}. Boas notícias! Por tempo limitado, você já pode reservar seus procedimentos favoritos online em 30 segundos com confirmação imediata. Garanta seu horário desta semana clicando no botão abaixo!`,
    };
  }
  if (templateKind === "special_date") {
    return {
      subject: "Presente Especial · Dia de Cuidado & Bem-Estar no Luvea Studio",
      message: `Olá! Aqui é ${providerFullName}. Quem você ama passa o ano inteiro cuidando de todo mundo — que tal reservar um momento exclusivo de autocuidado ou enviar um Vale-Presente do Luvea Studio? Clique abaixo para agendar!`,
    };
  }
  return {
    subject: "Sentimos sua falta no Luvea Studio ✨ Seu horário especial te espera",
    message: `Olá! Aqui é ${providerFullName}. Notamos que já faz mais de 45 dias desde a sua última visita ao estúdio! Preparamos uma condição especial de retorno com hidratação de cortesia para você renovar seu visual esta semana. Toque abaixo para escolher seu horário!`,
  };
}

export function sendMarketingCampaign(
  state: StudioState,
  input: {
    channel: "email" | "text";
    subject: string;
    message: string;
    imageUrl?: string;
    audienceSegment: MarketingCampaignItem["audienceSegment"];
  }
): StudioState {
  const targetClients =
    input.audienceSegment === "absent_45d"
      ? filterClientsByRetention(state, "absent_30_45", "")
      : input.audienceSegment === "vip"
        ? filterClientsByRetention(state, "vip", "")
        : state.clients;

  const recipientsCount = Math.max(1, targetClients.length);
  const creditsUsed = input.channel === "text" ? recipientsCount : 0;

  const newCampaign: MarketingCampaignItem = {
    id: `cmp-${Date.now()}`,
    channel: input.channel,
    subject: input.subject,
    message: input.message,
    imageUrl: input.imageUrl,
    audienceSegment: input.audienceSegment,
    recipientsCount,
    status: "sent",
    sentAtISO: "17 Out 2026, Agora",
  };

  return {
    ...state,
    marketing: {
      smsCreditsRemaining: Math.max(
        0,
        state.marketing.smsCreditsRemaining - creditsUsed
      ),
      campaigns: [newCampaign, ...state.marketing.campaigns],
    },
    lastToastMessage: `Campanha enviada com sucesso para ${recipientsCount} cliente(s)!`,
  };
}

export function updateStudioSettings(
  state: StudioState,
  patch: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    licenseNumber?: string;
    smsConsent?: boolean;
    businessName?: string;
    legalEntityType?: string;
    taxIdCnpjCpf?: string;
    defaultDepositPercent?: number;
    pixKey?: string;
  }
): StudioState {
  return {
    ...state,
    settings: {
      ...state.settings,
      personal: {
        ...state.settings.personal,
        firstName: patch.firstName ?? state.settings.personal.firstName,
        lastName: patch.lastName ?? state.settings.personal.lastName,
        email: patch.email ?? state.settings.personal.email,
        phone: patch.phone ?? state.settings.personal.phone,
        licenseNumber:
          patch.licenseNumber ?? state.settings.personal.licenseNumber,
        smsConsent: patch.smsConsent ?? state.settings.personal.smsConsent,
      },
      business: {
        ...state.settings.business,
        businessName:
          patch.businessName ?? state.settings.business.businessName,
        legalEntityType:
          patch.legalEntityType ?? state.settings.business.legalEntityType,
        taxIdCnpjCpf:
          patch.taxIdCnpjCpf ?? state.settings.business.taxIdCnpjCpf,
        defaultDepositPercent:
          patch.defaultDepositPercent ??
          state.settings.business.defaultDepositPercent,
        pixKey: patch.pixKey ?? state.settings.business.pixKey,
      },
    },
    lastToastMessage: "Configurações salvas com sucesso!",
  };
}
