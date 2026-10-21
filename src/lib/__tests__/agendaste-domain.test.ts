import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createInitialStudioState,
  completeOnboardingStep,
  importStudioMigrationData,
  bookFromPublicSite,
  toggleSuggestedService,
  createSelectedSuggestedServices,
  regenerateSuggestedServices,
  generateServiceDescriptionAI,
  saveCatalogService,
  saveCatalogPackage,
  saveCatalogMembership,
  savePhysicalResource,
  skipCalendarByWeeks,
  validateAndCreateCalendarEvent,
  bookFromWaitlistEntry,
  rebookAppointmentOneTap,
  createClientProfile,
  filterClientsByRetention,
  updateClientNotesAndForms,
  uploadAutoSortedClientPhoto,
  deleteClientPhoto,
  createAndSendInvoice,
  executeQuickSaleCheckout,
  issueGiftCard,
  formatDateBR,
  getTodayDateISO,
  processWhatsappInboundReply,
  calculatePayrollSummary,
  toggleTimeclockAction,
  generateMarketingDraftAI,
  sendMarketingCampaign,
  updateStudioSettings,
  updateUserWhatsAppConfig,
  disconnectUserWhatsApp,
  formatWhatsAppMessage,
  isValidUuid,
} from "../agendaste-store.ts";

describe("Ticket 01 — Primeiros Passos (Get Started) & Site de Agendamento Online (Luvea Studio)", () => {
  it("tracks 0/3 Primeiros Passos progress and increments as onboarding steps are completed", () => {
    const initial = createInitialStudioState();
    assert.equal(initial.onboarding.steps.length, 3);
    const completedInitial = initial.onboarding.steps.filter((s) => s.completed).length;
    assert.equal(completedInitial, 0);

    const afterStep1 = completeOnboardingStep(initial, "booking_site");
    assert.equal(
      afterStep1.onboarding.steps.filter((s) => s.completed).length,
      1
    );

    const afterStep2 = completeOnboardingStep(afterStep1, "add_services");
    const afterStep3 = completeOnboardingStep(afterStep2, "start_getting_paid");
    assert.equal(
      afterStep3.onboarding.steps.filter((s) => s.completed).length,
      3
    );
  });

  it("imports external studio data (pen & paper / CSV migration) and populates clients and services", () => {
    const initial = createInitialStudioState();
    const beforeClients = initial.clients.length;
    const updated = importStudioMigrationData(initial, {
      sourceName: "Planilha Salão Antigo",
      clientsCount: 2,
      servicesCount: 1,
    });
    assert.equal(updated.clients.length, beforeClients + 2);
    assert.equal(updated.onboarding.importedData, true);
    assert.match(updated.lastToastMessage ?? "", /importados com sucesso/i);
  });

  it("books an appointment from the public Site de Agendamento Online (Luvea Studio) with Sinal Pix", () => {
    const initial = createInitialStudioState();
    const service = initial.services[0];
    const provider = initial.staff[0];

    const result = bookFromPublicSite(initial, {
      clientName: "Camila Vasconcelos",
      clientEmail: "camila@vasconcelos.com.br",
      clientPhone: "(11) 99812-3344",
      serviceId: service.id,
      providerId: provider.id,
      dateISO: "2026-10-17",
      startTime: "15:00",
      selectedAddOnIds: [],
      depositPaidViaPix: true,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(
        result.state.calendarEvents.length,
        initial.calendarEvents.length + 1
      );
      const createdEvent = result.state.calendarEvents[0];
      assert.equal(createdEvent.eventType, "appointment");
      assert.equal(createdEvent.clientName, "Camila Vasconcelos");
      assert.equal(createdEvent.depositPaid, true);
      assert.equal(createdEvent.status, "confirmed");
    }
  });
});

describe("Ticket 02 — Catálogo Completo (Serviços, Pacotes, Assinaturas e Recursos Físicos)", () => {
  it("selects AI suggested services, creates them in 1 click, and can regenerate suggestions", () => {
    const initial = createInitialStudioState();
    const firstSuggestionId = initial.suggestedServices[0].id;
    const toggled = toggleSuggestedService(initial, firstSuggestionId);
    assert.equal(
      toggled.suggestedServices.find((s) => s.id === firstSuggestionId)?.selected,
      true
    );

    const afterCreate = createSelectedSuggestedServices(toggled);
    assert.equal(afterCreate.services.length, initial.services.length + 1);
    assert.equal(
      afterCreate.onboarding.steps.find((s) => s.id === "add_services")?.completed,
      true
    );

    const regenerated = regenerateSuggestedServices(afterCreate);
    assert.equal(regenerated.suggestedServices.length, 3);
    assert.notEqual(
      regenerated.suggestedServices[0].name,
      initial.suggestedServices[0].name
    );
  });

  it("saves a Service with segmented duration (Processing Time + Block Time), Resources, Options and Add-ons", () => {
    const initial = createInitialStudioState();
    const aiDesc = generateServiceDescriptionAI("Lifting de Cílios & Nutrição", "Estética");
    assert.ok(aiDesc.length > 25);

    const updated = saveCatalogService(initial, {
      name: "Lifting de Cílios & Nutrição",
      description: aiDesc,
      category: "Olhar & Sobrancelhas",
      calendarColor: "#0D9488",
      onlineBookingEnabled: true,
      priceType: "starting_at",
      priceCents: 19000,
      requireDeposit: true,
      depositCents: 6000,
      durationMinutes: 60,
      processingTimeEnabled: true,
      processingStartOffsetMinutes: 20,
      processingDurationMinutes: 20,
      blockTimeEnabled: true,
      blockAfterMinutes: 10,
      requiredResourceIds: ["res-room-1"],
      options: [
        { id: "opt-1", name: "Com Tintura Especial", priceDeltaCents: 3000, durationDeltaMinutes: 15 },
      ],
      addOns: [
        { id: "add-1", name: "Spa Labial Hidratante", priceCents: 2500, durationMinutes: 10 },
      ],
    });

    const created = updated.services[0];
    assert.equal(created.name, "Lifting de Cílios & Nutrição");
    assert.equal(created.processingDurationMinutes, 20);
    assert.equal(created.blockAfterMinutes, 10);
    assert.deepEqual(created.requiredResourceIds, ["res-room-1"]);
  });

  it("creates Packages, Memberships, and Physical Resources (Equipment & Rooms)", () => {
    let state = createInitialStudioState();
    state = saveCatalogPackage(state, {
      name: "Pacote Noiva Glow (4 Sessões)",
      description: "Preparação completa facial e capilar.",
      sellOnWebsite: true,
      includedServiceIds: ["srv-color", "srv-rejuv"],
      sessionsCount: 4,
      priceCents: 98000,
      expirationDays: 120,
      termsAndConditions: "Uso pessoal e intransferível.",
    });
    assert.equal(state.packages[0].name, "Pacote Noiva Glow (4 Sessões)");

    state = saveCatalogMembership(state, {
      name: "VIP Hair Club",
      description: "4 escovas + 1 hidratação mensal.",
      monthlyPriceCents: 34900,
      includedCreditsPerMonth: 5,
      discountPercentOnExtras: 20,
    });
    assert.equal(state.memberships[0].name, "VIP Hair Club");

    state = savePhysicalResource(state, {
      name: "Cabine VIP 02",
      category: "room",
      description: "Sala reservada para estética corporal.",
      assignedServiceIds: ["srv-rejuv"],
    });
    assert.equal(state.resources[0].name, "Cabine VIP 02");
    assert.equal(state.resources[0].category, "room");
  });
});

describe("Ticket 03 — Agenda Inteligente (Calendar), Salto de Semanas, Trava de Recursos e Tempo de Processamento", () => {
  it("skips calendar date forward by +2 to +8 weeks", () => {
    const initial = createInitialStudioState();
    assert.equal(initial.calendarView.selectedDateISO, getTodayDateISO());
    const baseState = {
      ...initial,
      calendarView: { ...initial.calendarView, selectedDateISO: "2026-10-17" },
    };
    const jumped2 = skipCalendarByWeeks(baseState, 2);
    assert.equal(jumped2.calendarView.selectedDateISO, "2026-10-31");
    const jumped4 = skipCalendarByWeeks(baseState, 4);
    assert.equal(jumped4.calendarView.selectedDateISO, "2026-11-14");
  });

  it("blocks double booking when a required Physical Resource (Laser/Room) is already in use", () => {
    const initial = createInitialStudioState();
    // evt-2 uses res-laser-1 and res-room-1 on 2026-10-17 from 12:30 to 13:40
    // Try booking Clara Mendes (different provider!) at 12:45 with srv-rejuv (which requires res-laser-1)
    const conflictResult = validateAndCreateCalendarEvent(initial, {
      eventType: "appointment",
      dateISO: "2026-10-17",
      startTime: "12:45",
      providerId: "staff-clara",
      clientId: "cli-mariana",
      serviceIds: ["srv-rejuv"],
      addressOrNotes: "Tentativa de uso simultâneo do Laser",
      isRepeating: false,
      collectDeposit: false,
    });

    assert.equal(conflictResult.ok, false);
    if (!conflictResult.ok) {
      assert.equal(conflictResult.conflictType, "resource");
      assert.match(conflictResult.message, /Laser Lavieen|Cabine Estética 01/i);
    }
  });

  it("allows parallel fit-in booking for the same Provider inside a Processing Time window", () => {
    const initial = createInitialStudioState();
    // evt-1 is on 2026-10-17 from 10:00 to 11:45 for staff-bruno.
    // Its processing window is [10:30, 11:00] (offset 30m, duration 30m).
    // Let's create a 30-min express service that uses res-chair-1 (no room conflict) and fit it at 10:30!
    const stateWithExpress = saveCatalogService(initial, {
      name: "Corte Franja Express",
      description: "Acabamento rápido durante pausa.",
      category: "Cortes",
      calendarColor: "#10B981",
      onlineBookingEnabled: true,
      priceType: "fixed",
      priceCents: 6000,
      requireDeposit: false,
      depositCents: 0,
      durationMinutes: 30,
      processingTimeEnabled: false,
      processingStartOffsetMinutes: 0,
      processingDurationMinutes: 0,
      blockTimeEnabled: false,
      blockAfterMinutes: 0,
      requiredResourceIds: ["res-chair-1"],
      options: [],
      addOns: [],
    });
    const expressServiceId = stateWithExpress.services[0].id;

    const fitInResult = validateAndCreateCalendarEvent(stateWithExpress, {
      eventType: "appointment",
      dateISO: "2026-10-17",
      startTime: "10:30",
      providerId: "staff-bruno",
      clientId: "cli-mariana",
      serviceIds: [expressServiceId],
      addressOrNotes: "Encaixe na janela de processamento das 10:30",
      isRepeating: false,
      collectDeposit: false,
    });

    assert.equal(fitInResult.ok, true);
  });

  it("converts a Waitlist entry into a confirmed appointment and supports 1-Tap Rebooking", () => {
    const initial = createInitialStudioState();
    const wlId = initial.waitlist[0].id;
    const afterWaitlistBook = bookFromWaitlistEntry(initial, wlId, "15:00");
    assert.equal(afterWaitlistBook.waitlist.length, 0);
    assert.equal(
      afterWaitlistBook.calendarEvents.length,
      initial.calendarEvents.length + 1
    );

    const rebooked = rebookAppointmentOneTap(afterWaitlistBook, "evt-1", 30);
    assert.equal(
      rebooked.calendarEvents.length,
      afterWaitlistBook.calendarEvents.length + 1
    );
    assert.equal(rebooked.calendarEvents[0].dateISO, "2026-11-16");
  });

  it("creates an inline client with a valid UUID and reuses existing client without creating duplicates", () => {
    const initial = createInitialStudioState();
    const initialClientCount = initial.clients.length;

    // 1. Cria agendamento com cliente inline inédito
    const result1 = validateAndCreateCalendarEvent(initial, {
      eventType: "appointment",
      dateISO: "2026-10-18",
      startTime: "14:00",
      providerId: "staff-bruno",
      newClientInline: {
        fullName: "Fernanda Soares",
        email: "fernanda@soares.com",
        phone: "(11) 98765-1122",
      },
      serviceIds: ["srv-rejuv"],
      addressOrNotes: "Primeiro atendimento",
      isRepeating: false,
      collectDeposit: false,
    });

    assert.equal(result1.ok, true);
    if (!result1.ok) return;

    assert.equal(result1.state.clients.length, initialClientCount + 1);
    const createdClient = result1.state.clients[0];
    assert.equal(createdClient.fullName, "Fernanda Soares");
    assert.equal(isValidUuid(createdClient.id), true);
    assert.equal(result1.createdEvent.clientId, createdClient.id);
    assert.equal(isValidUuid(result1.createdEvent.id), true);

    // 2. Cria segundo agendamento com o mesmo cliente inline: deve reaproveitar sem duplicar
    const result2 = validateAndCreateCalendarEvent(result1.state, {
      eventType: "appointment",
      dateISO: "2026-10-19",
      startTime: "14:00",
      providerId: "staff-bruno",
      newClientInline: {
        fullName: "Fernanda Soares",
        email: "fernanda@soares.com",
        phone: "(11) 98765-1122",
      },
      serviceIds: ["srv-rejuv"],
      addressOrNotes: "Segundo atendimento",
      isRepeating: false,
      collectDeposit: false,
    });

    assert.equal(result2.ok, true);
    if (!result2.ok) return;

    // O número de clientes não deve aumentar novamente (zero duplicidade)
    assert.equal(result2.state.clients.length, initialClientCount + 1);
    assert.equal(result2.createdEvent.clientId, createdClient.id);
  });
});

describe("Ticket 04 — Clientes (Clients), Drawer 5 Abas, Notas/Fichas e Fotos Auto-organizadas", () => {
  it("creates a client with the exact LUVEA toast and filters absent +30/45d clients", () => {
    const initial = createInitialStudioState();
    const afterCreate = createClientProfile(initial, {
      fullName: "Beatriz Monteiro",
      email: "beatriz@monteiro.com",
      phone: "(11) 99222-8811",
    });

    assert.equal(afterCreate.clients[0].fullName, "Beatriz Monteiro");
    assert.equal(
      afterCreate.lastToastMessage,
      "Cliente Beatriz Monteiro criado com sucesso!"
    );

    const absentClients = filterClientsByRetention(afterCreate, "absent_30_45", "");
    assert.equal(absentClients.length, 1);
    assert.equal(absentClients[0].fullName, "Mariana Albuquerque");
  });

  it("prevents duplicate client creation when adding a client with an existing name", () => {
    const initial = createInitialStudioState();
    const countBefore = initial.clients.length;

    // Tenta criar cliente que já existe no estado inicial (ex: Stefany)
    const afterDuplicate = createClientProfile(initial, {
      fullName: "Stefany",
      email: "stefany.nova@gmail.com",
      phone: "(11) 91234-5678",
    });

    assert.equal(afterDuplicate.clients.length, countBefore);
    assert.match(afterDuplicate.lastToastMessage || "", /já cadastrado/i);
  });

  it("updates Notes/Forms (Ficha de Atendimento) and auto-sorts uploaded photos by appointment", () => {
    let state = createInitialStudioState();
    state = updateClientNotesAndForms(state, "cli-stefany", {
      anamnesis: "Sensibilidade leve atualizada.",
      allergies: "Nenhuma.",
      formulasAndPreferences: "Tonalizante 9.89 com emulsão 6 vol.",
      birthday: "14/05",
    });
    const stefany = state.clients.find((c) => c.id === "cli-stefany")!;
    assert.match(stefany.notesAndForms.formulasAndPreferences, /9\.89/);

    state = uploadAutoSortedClientPhoto(state, "cli-stefany", {
      photoUrl: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400",
      beforeLabel: "Antes",
      afterLabel: "Depois · Brilho Espelhado",
    });
    const updatedStefany = state.clients.find((c) => c.id === "cli-stefany")!;
    assert.equal(updatedStefany.autoSortedPhotos[0].photoUrls.length, 3);
  });

  it("deletes an uploaded client photo from autoSortedPhotos and updates toast", () => {
    let state = createInitialStudioState();
    const photoUrl = "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400";
    state = uploadAutoSortedClientPhoto(state, "cli-stefany", {
      photoUrl,
      beforeLabel: "Antes",
      afterLabel: "Depois",
    });
    let stefany = state.clients.find((c) => c.id === "cli-stefany")!;
    assert.ok(stefany.autoSortedPhotos.some((g) => g.photoUrls.includes(photoUrl)));

    state = deleteClientPhoto(state, "cli-stefany", photoUrl);
    stefany = state.clients.find((c) => c.id === "cli-stefany")!;
    assert.ok(!stefany.autoSortedPhotos.some((g) => g.photoUrls.includes(photoUrl)));
    assert.match(state.lastToastMessage ?? "", /Foto removida com sucesso/i);
  });
});

describe("Ticket 05 — Pagamentos (Payments): Venda Rápida POS, Faturas (Invoices) e Vale-Presentes", () => {
  it("builds and sends an itemized Invoice with discount and tax", () => {
    const initial = createInitialStudioState();
    const updated = createAndSendInvoice(initial, {
      title: "Pacote Rejuvenescimento + Home Care",
      providerId: "staff-bruno",
      clientId: "cli-stefany",
      memo: "Pagamento via link Pix ou Cartão até o vencimento.",
      dueDateISO: "2026-10-30",
      lineItems: [
        { id: "li-a", label: "Protocolo Rejuvenation", itemType: "service", amountCents: 23000, quantity: 1 },
        { id: "li-b", label: "Sérum Vitamina C", itemType: "product", amountCents: 16500, quantity: 1 },
      ],
      discountCents: 3500,
      taxCents: 0,
    });

    assert.equal(updated.invoices.length, initial.invoices.length + 1);
    assert.equal(updated.invoices[0].totalCents, 36000);
    assert.equal(updated.invoices[0].status, "sent");
    assert.equal(
      updated.onboarding.steps.find((s) => s.id === "start_getting_paid")?.completed,
      true
    );
  });

  it("processes Quick Sale checkout with Package session redemption and Gift Card issuance", () => {
    let state = createInitialStudioState();
    const stefanyBefore = state.clients.find((c) => c.id === "cli-stefany")!;
    assert.equal(stefanyBefore.packages[0].remainingSessions, 2);

    state = executeQuickSaleCheckout(state, {
      clientId: "cli-stefany",
      providerId: "staff-bruno",
      itemsSummary: "Sessão 2 · Rejuvenation Package",
      amountCents: 23000,
      tipCents: 0,
      paymentMethod: "Pacote",
      redeemPackageId: "pkg-rejuv-3",
    });

    const stefanyAfter = state.clients.find((c) => c.id === "cli-stefany")!;
    assert.equal(stefanyAfter.packages[0].remainingSessions, 1);
    assert.equal(state.salesHistory[0].paymentMethod, "Pacote");

    state = issueGiftCard(state, {
      recipientName: "Isolde Quinn",
      recipientEmail: "isolde.quinn@luveastudio.app",
      initialBalanceCents: 30000,
    });
    assert.equal(state.giftCards[0].initialBalanceCents, 30000);
  });

  it("registers appointment on calendar and navigates calendarView when Quick Sale is completed without existing appointment", () => {
    const initial = createInitialStudioState();
    const prevEventsCount = initial.calendarEvents.length;

    const updated = executeQuickSaleCheckout(initial, {
      clientId: "cli-stefany",
      providerId: "staff-bruno",
      itemsSummary: "Protocolo Rejuvenation Laser",
      amountCents: 18000,
      paymentMethod: "Pix",
      status: "Pago",
      dateISO: "2026-10-19",
      appointmentTime: "14:30",
    });

    assert.equal(updated.calendarEvents.length, prevEventsCount + 1);
    const newEvent = updated.calendarEvents[0];
    assert.equal(newEvent.eventType, "appointment");
    assert.equal(newEvent.dateISO, "2026-10-19");
    assert.equal(newEvent.startTime, "14:30");
    assert.equal(newEvent.status, "completed");
    assert.equal(newEvent.depositPaid, true);
    assert.equal(newEvent.clientName, "Stefany");
    assert.equal(updated.calendarView.selectedDateISO, "2026-10-19");
  });

  it("formats dates in Brazilian DD/MM/YYYY format with formatDateBR", () => {
    assert.equal(formatDateBR("2026-10-19"), "19/10/2026");
    assert.equal(formatDateBR("2026-05-03"), "03/05/2026");
    assert.equal(formatDateBR("2026-10-19T10:15:00.000Z"), "19/10/2026");
    assert.equal(formatDateBR(""), "");
  });
});

describe("Ticket 06 — Recepção IA (Reception) & WhatsApp 2-Way Sync", () => {
  it("processes inbound WhatsApp '1' confirmation and updates calendar appointment status", () => {
    const initial = createInitialStudioState();
    assert.equal(
      initial.calendarEvents.find((e) => e.id === "evt-1")?.status,
      "pending"
    );

    const synced = processWhatsappInboundReply(initial, "evt-1", "1_confirmed");
    const updatedEvent = synced.calendarEvents.find((e) => e.id === "evt-1")!;
    assert.equal(updatedEvent.status, "confirmed");
    assert.equal(updatedEvent.whatsappClientReply, "1_confirmed");
    assert.match(synced.reception.logs[0].messageText, /1/);
  });

  it("allows studio owner to configure their own WhatsApp instance, number and templates", () => {
    let state = createInitialStudioState();
    assert.equal(state.reception.userConfig?.connected, true);

    // Atualiza configurações personalizadas do WhatsApp do usuário
    state = updateUserWhatsAppConfig(state, {
      provider: "evolution_api",
      phoneNumber: "+55 (11) 98765-4321",
      instanceName: "meuestudio-oficial",
      apiUrl: "https://minha-api.com",
      templates: {
        reminder24h: "Olá {nome}, confirmamos seu horário no {estudio} para {data} às {horario}?",
        reminder2h: "Oi {nome}, faltam 2h para seu horário às {horario}!",
        pixDeposit: "Olá {nome}, seu sinal é {valor_sinal}.",
        reactivation45d: "Oi {nome}, saudades do {estudio}!",
      },
      connected: true,
    });

    assert.equal(state.reception.whatsappNumber, "+55 (11) 98765-4321");
    assert.equal(state.reception.userConfig?.instanceName, "meuestudio-oficial");
    assert.equal(state.reception.userConfig?.apiUrl, "https://minha-api.com");

    // Formata mensagem com variáveis dinâmicas
    const formatted = formatWhatsAppMessage(
      state.reception.userConfig!.templates.reminder24h,
      {
        nome: "Mariana",
        estudio: "Luvea Studio",
        data: "21/10/2026",
        horario: "15:00",
      }
    );
    assert.equal(
      formatted,
      "Olá Mariana, confirmamos seu horário no Luvea Studio para 21/10/2026 às 15:00?"
    );

    // Desconecta o WhatsApp
    state = disconnectUserWhatsApp(state);
    assert.equal(state.reception.whatsappConnected, false);
    assert.equal(state.reception.userConfig?.connected, false);
    // Preserva templates após desconectar
    assert.match(state.reception.userConfig!.templates.reminder24h, /confirmamos/);
  });

  it("persists Evolution API instance settings in userConfig", () => {
    let state = createInitialStudioState();
    assert.equal(state.reception.userConfig?.evolutionSettings?.rejectCall, false);
    assert.equal(state.reception.userConfig?.evolutionSettings?.groupsIgnore, true);

    state = updateUserWhatsAppConfig(state, {
      evolutionSettings: {
        rejectCall: true,
        msgCall: "Atendimento exclusivo por texto.",
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: false,
        syncFullHistory: false,
      },
    });

    assert.equal(state.reception.userConfig?.evolutionSettings?.rejectCall, true);
    assert.equal(state.reception.userConfig?.evolutionSettings?.msgCall, "Atendimento exclusivo por texto.");
    assert.equal(state.reception.userConfig?.evolutionSettings?.alwaysOnline, true);
    assert.equal(state.reception.userConfig?.evolutionSettings?.readMessages, true);
  });
});

describe("Ticket 07 — Equipe (Team): Comissões, Fechamento de Repasse (Payroll) e Timeclock", () => {
  it("calculates Payroll summary per staff member and logs Timeclock check-out", () => {
    const initial = createInitialStudioState();
    const payroll = calculatePayrollSummary(initial);
    assert.equal(payroll.length, 2);
    const brunoPayroll = payroll.find((p) => p.staffId === "staff-bruno")!;
    assert.ok(brunoPayroll.serviceCommissionCents > 0);
    assert.ok(brunoPayroll.totalPayoutCents >= brunoPayroll.serviceCommissionCents);

    const afterBreak = toggleTimeclockAction(initial, "take_break");
    assert.equal(afterBreak.timeTracking.activeSessionStatus, "on_break");

    const afterCheckout = toggleTimeclockAction(afterBreak, "check_out");
    assert.equal(afterCheckout.timeTracking.activeSessionStatus, "idle");
    assert.equal(
      afterCheckout.timeTracking.logs.length,
      initial.timeTracking.logs.length + 1
    );
  });
});

describe("Ticket 08 — Marketing (Campanhas IA) & Configurações (Settings)", () => {
  it("generates AI marketing draft, sends campaign deducting text credits, and saves Settings", () => {
    let state = createInitialStudioState();
    const draft = generateMarketingDraftAI("absent_45d", "Bruno Fernandes Malossi Silva");
    assert.ok(draft.subject.length > 5);
    assert.ok(draft.message.length > 20);

    const beforeCredits = state.marketing.smsCreditsRemaining;
    state = sendMarketingCampaign(state, {
      channel: "text",
      subject: draft.subject,
      message: draft.message,
      audienceSegment: "absent_45d",
    });

    assert.equal(state.marketing.campaigns.length, 1);
    assert.ok(state.marketing.smsCreditsRemaining < beforeCredits);

    state = updateStudioSettings(state, {
      businessName: "Luvea Studio Higienópolis",
      defaultDepositPercent: 40,
    });
    assert.equal(state.settings.business.businessName, "Luvea Studio Higienópolis");
    assert.equal(state.settings.business.defaultDepositPercent, 40);
  });
});

describe("API Route Integration & Public Site Resource Lock (ADR-0001 & ADR-0002)", () => {
  it("POST /api/pix/create generates a valid Pix Copia e Cola payload for depositCents or totalCents", async () => {
    const { POST: createPixPOST } = await import("../../app/api/pix/create/route.ts");
    const req = new Request("http://localhost:3000/api/pix/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: "evt-pix-test",
        clientName: "Stefany Malossi",
        depositCents: 6500,
      }),
    });
    const res = await createPixPOST(req);
    assert.equal(res.status, 200);
    const json = (await res.json()) as {
      ok: boolean;
      depositCents: number;
      pixCopiaECola: string;
      qrCodePayload: string;
    };
    assert.equal(json.ok, true);
    assert.equal(json.depositCents, 6500);
    assert.match(json.pixCopiaECola, /BR\.GOV\.BCB\.PIX/);
    assert.equal(json.qrCodePayload, json.pixCopiaECola);
  });

  it("POST /api/whatsapp/send dispatches 2-way WhatsApp template and listens for webhook reply", async () => {
    const { POST: sendWhatsAppPOST } = await import("../../app/api/whatsapp/send/route.ts");
    const req = new Request("http://localhost:3000/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: "evt-1",
        clientName: "Stefany Malossi",
        clientPhone: "(11) 99876-5432",
        templateType: "reminder_24h",
      }),
    });
    const res = await sendWhatsAppPOST(req);
    assert.equal(res.status, 200);
    const json = (await res.json()) as {
      ok: boolean;
      twoWayWebhookListening: boolean;
      previewMessage: string;
    };
    assert.equal(json.ok, true);
    assert.equal(json.twoWayWebhookListening, true);
    assert.match(json.previewMessage, /Stefany Malossi/);
  });

  it("POST /api/whatsapp/send supports custom per-user whatsappConfig and manual wa.me link", async () => {
    const { POST: sendWhatsAppPOST } = await import("../../app/api/whatsapp/send/route.ts");
    const req = new Request("http://localhost:3000/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: "Bruna Silva",
        clientPhone: "(11) 98888-9999",
        customMessage: "Olá Bruna, seu atendimento está agendado!",
        whatsappConfig: {
          provider: "wa_web_manual",
          phoneNumber: "+55 (11) 97777-8888",
        },
      }),
    });
    const res = await sendWhatsAppPOST(req);
    assert.equal(res.status, 200);
    const json = (await res.json()) as {
      ok: boolean;
      engine: string;
      waMeUrl?: string;
      recipient: string;
    };
    assert.equal(json.ok, true);
    assert.equal(json.engine, "wa_web_manual");
    assert.ok(json.waMeUrl?.includes("https://wa.me/5511988889999"));
  });

  it("enforces ADR-0002 Resource Lock on bookFromPublicSite when a shared resource is busy", () => {
    const initial = createInitialStudioState();
    // evt-2 uses res-laser-1 on 2026-10-17 from 12:30 to 13:40
    const blocked = bookFromPublicSite(initial, {
      clientName: "Cliente Online Conflito",
      clientEmail: "conflito@teste.com",
      clientPhone: "(11) 97777-6666",
      serviceId: "srv-rejuv",
      providerId: "staff-clara",
      dateISO: "2026-10-17",
      startTime: "12:45",
      selectedAddOnIds: [],
      depositPaidViaPix: true,
    });
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.match(blocked.error, /Laser Lavieen|Cabine Estética 01/i);
    }
  });

  it("checks Cloudflare R2 configuration helper and graceful upload fallback", async () => {
    const { isR2Configured } = await import("../cloudflare-r2.ts");
    // In test environment without cloudflare env vars set, isR2Configured returns false
    const configured = isR2Configured();
    assert.equal(typeof configured, "boolean");

    const { POST } = await import("../../app/api/upload/route.ts");
    const formData = new FormData();
    const blob = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
    formData.append("file", blob, "foto-teste.jpg");
    formData.append("folder", "prontuarios");

    const req = new Request("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const json = (await res.json()) as { success?: boolean; configured?: boolean };
    assert.equal(res.status, 200);
    if (!configured) {
      assert.equal(json.configured, false);
      assert.equal(json.success, false);
    }
  });

  it("validates Mercado Pago webhook HMAC signature and processes order notifications", async () => {
    const crypto = await import("node:crypto");
    const {
      verifyMercadoPagoWebhookSignature,
      splitFullName,
    } = await import("../mercadopago.ts");

    assert.deepEqual(splitFullName("Stefany Malossi Silva"), {
      firstName: "Stefany",
      lastName: "Malossi Silva",
    });

    const secret = "mp_test_webhook_secret_123";
    const dataId = "ORD01HRYFWNYRE1MR1E60MW3X0T2P";
    const xRequestId = "req-998877";
    const ts = "1704908010";
    const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
    const v1 = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature: `ts=${ts},v1=${v1}`,
        xRequestId,
        dataId,
        secret,
      }),
      true
    );

    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature: `ts=${ts},v1=deadbeef`,
        xRequestId,
        dataId,
        secret,
      }),
      false
    );

    const { POST: webhookPOST } = await import(
      "../../app/api/webhooks/mercadopago/route.ts"
    );
    const req = new Request(
      `http://localhost:3000/api/webhooks/mercadopago?data.id=${dataId}&type=order`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "order.processed",
          type: "order",
          data: { id: dataId },
        }),
      }
    );
    const res = await webhookPOST(req);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      topic: string;
      resourceId: string;
    };
    assert.equal(body.ok, true);
    assert.equal(body.topic, "order");
    assert.equal(body.resourceId, dataId);
  });

  it("GET /api/pix/status checks payment status or falls back gracefully", async () => {
    const { GET: statusGET } = await import("../../app/api/pix/status/route.ts");
    const req = new Request("http://localhost:3000/api/pix/status?paymentId=test-pay-123");
    const res = await statusGET(req);
    assert.equal(res.status, 200);
    const json = (await res.json()) as { ok: boolean; status?: string };
    assert.equal(json.ok, true);
  });

  it("POST /api/whatsapp/instance manages automated instance creation, status and disconnect", async () => {
    const { POST: instancePOST } = await import("../../app/api/whatsapp/instance/route.ts");

    // 1. Status check
    const statusReq = new Request("http://localhost:3000/api/whatsapp/instance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "status",
        phoneNumber: "+55 (11) 94447-7528",
      }),
    });
    const statusRes = await instancePOST(statusReq);
    assert.equal(statusRes.status, 200);
    const statusJson = (await statusRes.json()) as {
      ok: boolean;
      connected: boolean;
      instanceName: string;
      state: string;
    };
    assert.equal(statusJson.ok, true);
    assert.ok(statusJson.instanceName);

    // 2. Create or connect (generates QR code or returns open state)
    const connectReq = new Request("http://localhost:3000/api/whatsapp/instance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_or_connect",
        phoneNumber: "+55 (11) 98765-4321",
      }),
    });
    const connectRes = await instancePOST(connectReq);
    assert.equal(connectRes.status, 200);
    const connectJson = (await connectRes.json()) as {
      ok: boolean;
      instanceName: string;
      qrCodeBase64?: string;
      connected?: boolean;
    };
    assert.equal(connectJson.ok, true);
    assert.ok(connectJson.instanceName);

    // 3. Disconnect action
    const disconnectReq = new Request("http://localhost:3000/api/whatsapp/instance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "disconnect",
        phoneNumber: "+55 (11) 98765-4321",
      }),
    });
    const disconnectRes = await instancePOST(disconnectReq);
    assert.equal(disconnectRes.status, 200);
    const disconnectJson = (await disconnectRes.json()) as {
      ok: boolean;
      disconnected: boolean;
      instanceName: string;
    };
    assert.equal(disconnectJson.ok, true);
    assert.equal(disconnectJson.disconnected, true);
  });

  it("GET and POST /api/whatsapp/settings retrieves and persists Evolution API settings", async () => {
    const { GET: settingsGET, POST: settingsPOST } = await import(
      "../../app/api/whatsapp/settings/route.ts"
    );

    // 1. GET settings
    const getReq = new Request(
      "http://localhost:3000/api/whatsapp/settings?phoneNumber=%2B5513978276520",
      { method: "GET" }
    );
    const getRes = await settingsGET(getReq);
    assert.equal(getRes.status, 200);
    const getJson = (await getRes.json()) as { ok: boolean; settings: any };
    assert.equal(getJson.ok, true);
    assert.ok(typeof getJson.settings.groupsIgnore === "boolean");

    // 2. POST settings
    const postReq = new Request("http://localhost:3000/api/whatsapp/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: "+55 (13) 97827-6520",
        settings: {
          rejectCall: true,
          msgCall: "Nosso estúdio atende apenas por mensagem de texto.",
          groupsIgnore: true,
          alwaysOnline: true,
          readMessages: false,
          readStatus: false,
          syncFullHistory: false,
        },
      }),
    });
    const postRes = await settingsPOST(postReq);
    assert.equal(postRes.status, 200);
    const postJson = (await postRes.json()) as {
      ok: boolean;
      settings: any;
      instanceName: string;
    };
    assert.equal(postJson.ok, true);
    assert.equal(postJson.settings.rejectCall, true);
    assert.equal(
      postJson.settings.msgCall,
      "Nosso estúdio atende apenas por mensagem de texto."
    );
    assert.ok(
      postJson.instanceName === "luvea_5513978276520" ||
        postJson.instanceName === "agendaste_5513978276520",
      `Nome da instância inesperado: ${postJson.instanceName}`
    );
  });
});



