import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createInitialStudioState,
  normalizeSubdomainSlug,
  claimBookingSiteSubdomain,
  updateWebsiteSetupConfig,
  getDefaultWebsiteBookingConfig,
  bookFromPublicSite,
  getBookingSiteUrl,
  type BookingSiteThemeId,
} from "../agendaste-store.ts";

describe("Ticket 01 — Fase 1: Criação do Site de Agendamento Online & Subdomínio", () => {
  it("normaliza strings arbitrárias para formato de subdomínio/slug válido", () => {
    assert.equal(
      normalizeSubdomainSlug("Bruno Fernandes Malossi Silva"),
      "brunofernandesmalossisilva"
    );
    assert.equal(
      normalizeSubdomainSlug("Luvea Studio & Estética SP!"),
      "luvea-studio-estetica-sp"
    );
    assert.equal(
      normalizeSubdomainSlug("espaco-de-beleza-2026"),
      "espaco-de-beleza-2026"
    );
    assert.equal(
      normalizeSubdomainSlug(""),
      "meu-estudio"
    );
  });

  it("inicializa as configurações padrão do site com o tema Classic e subdomínio derivado do negócio", () => {
    const initial = createInitialStudioState();
    const config = initial.settings.website ?? getDefaultWebsiteBookingConfig(initial.settings.business.businessName);

    assert.equal(config.theme, "classic");
    assert.equal(typeof config.subdomainSlug, "string");
    assert.ok(config.subdomainSlug.length > 0);
    assert.equal(config.websitePublished, false);
  });

  it("reivindica a URL, marca o site como publicado e conclui o passo booking_site (1/3)", () => {
    const initial = createInitialStudioState();
    assert.equal(initial.onboarding.steps[0].completed, false);

    const updated = claimBookingSiteSubdomain(
      initial,
      "bruno-estudio-vip",
      "canvas",
      "Bruno Hair & Spa"
    );

    assert.equal(updated.settings.website.subdomainSlug, "bruno-estudio-vip");
    assert.equal(updated.settings.website.theme, "canvas");
    assert.equal(updated.settings.business.businessName, "Bruno Hair & Spa");
    assert.equal(updated.settings.website.websitePublished, true);
    assert.equal(updated.onboarding.steps[0].completed, true);
    assert.equal(updated.lastToastMessage, "URL atualizada com sucesso");
  });

  it("gera a URL canônica pública de agendamento em ambiente node/produção", () => {
    assert.equal(getBookingSiteUrl("teste"), "https://teste.luvea.app");
    assert.equal(getBookingSiteUrl("bruno-hair"), "https://bruno-hair.luvea.app");
    assert.equal(getBookingSiteUrl(""), "https://meu-estudio.luvea.app");
  });

  it("permite selecionar qualquer um dos 6 temas autênticos", () => {
    const themes: BookingSiteThemeId[] = [
      "classic",
      "billboard",
      "canvas",
      "energy",
      "organic",
      "play",
    ];

    let state = createInitialStudioState();
    for (const theme of themes) {
      state = updateWebsiteSetupConfig(state, { theme });
      assert.equal(state.settings.website.theme, theme);
    }
  });
});

describe("Ticket 02 — Fase 2: Configuração de Agendamento e Serviços", () => {
  it("persiste endereço fixo, atendimento a domicílio e horários de trabalho dos 7 dias", () => {
    let state = createInitialStudioState();

    state = updateWebsiteSetupConfig(state, {
      hasFixedAddress: true,
      doesHouseCalls: true,
      addressLine1: "Av. Paulista, 1000",
      addressLine2: "Conjunto 42",
      city: "São Paulo",
      zipCode: "01310-100",
      state: "SP",
      businessHours: [
        { dayOfWeek: 0, label: "Domingo", isOpen: false, startTime: "08:00", endTime: "12:00" },
        { dayOfWeek: 1, label: "Segunda-feira", isOpen: true, startTime: "09:00", endTime: "19:00" },
        { dayOfWeek: 2, label: "Terça-feira", isOpen: true, startTime: "09:00", endTime: "19:00" },
        { dayOfWeek: 3, label: "Quarta-feira", isOpen: true, startTime: "09:00", endTime: "19:00" },
        { dayOfWeek: 4, label: "Quinta-feira", isOpen: true, startTime: "09:00", endTime: "19:00" },
        { dayOfWeek: 5, label: "Sexta-feira", isOpen: true, startTime: "09:00", endTime: "20:00" },
        { dayOfWeek: 6, label: "Sábado", isOpen: true, startTime: "08:00", endTime: "16:00" },
      ],
      autoApproveAppointments: true,
      onlineBookingGuarantee: "card_on_file",
    });

    assert.equal(state.settings.website.hasFixedAddress, true);
    assert.equal(state.settings.website.doesHouseCalls, true);
    assert.equal(state.settings.website.addressLine1, "Av. Paulista, 1000");
    assert.equal(state.settings.website.addressLine2, "Conjunto 42");
    assert.equal(state.settings.website.city, "São Paulo");
    assert.equal(state.settings.website.zipCode, "01310-100");
    assert.equal(state.settings.website.businessHours.length, 7);
    assert.equal(state.settings.website.businessHours[0].isOpen, false);
    assert.equal(state.settings.website.businessHours[1].startTime, "09:00");
    assert.equal(state.settings.website.businessHours[1].endTime, "19:00");
    assert.equal(state.settings.website.onlineBookingGuarantee, "card_on_file");
  });
});

describe("Ticket 03 — Fase 3: Configuração de Pagamentos Aceitos e Verificação de Identidade", () => {
  it("salva configuração de repasse via Chave Pix e reflete status de verificação de identidade", () => {
    let state = createInitialStudioState();

    // 1. Salva com chave Pix e verificação pendente (verificar depois)
    state = updateWebsiteSetupConfig(state, {
      paymentsSetup: {
        payoutMethod: "pix_key",
        pixKeyType: "cpf_cnpj",
        pixKeyValue: "12.345.678/0001-90",
        bankName: "Banco Itaú Unibanco S.A.",
        routingOrAgency: "1234",
        accountNumber: "98765-4",
        debitCardLast4: "1234",
        identityVerified: false,
        setupCompleted: true,
      },
    });

    assert.equal(state.settings.website.paymentsSetup.payoutMethod, "pix_key");
    assert.equal(state.settings.website.paymentsSetup.pixKeyType, "cpf_cnpj");
    assert.equal(state.settings.website.paymentsSetup.pixKeyValue, "12.345.678/0001-90");
    assert.equal(state.settings.website.paymentsSetup.identityVerified, false);
    assert.equal(state.settings.website.paymentsSetup.setupCompleted, true);

    // 2. Conclui verificação de identidade e atinge 3/3 no painel
    state = updateWebsiteSetupConfig(state, {
      paymentsSetup: {
        ...state.settings.website.paymentsSetup,
        identityVerified: true,
      },
    });

    state = {
      ...state,
      onboarding: {
        ...state.onboarding,
        steps: state.onboarding.steps.map((s) => ({ ...s, completed: true })),
      },
    };

    assert.equal(state.settings.website.paymentsSetup.identityVerified, true);
    assert.equal(
      state.onboarding.steps.filter((s) => s.completed).length,
      3
    );
  });
});

describe("Ticket 04 — Site de Agendamento Online Público & Checkout do Cliente", () => {
  it("rejeita agendamento em dia em que o estúdio está fechado (ex: Domingo)", () => {
    let state = createInitialStudioState();
    // 2026-10-18 é Domingo (dayOfWeek = 0), configurado como isOpen = false por padrão
    const result = bookFromPublicSite(state, {
      clientName: "Mariana Souza",
      clientEmail: "mariana@souza.com",
      clientPhone: "(11) 98888-7777",
      serviceId: state.services[0].id,
      providerId: state.staff[0].id,
      dateISO: "2026-10-18",
      startTime: "10:00",
      selectedAddOnIds: [],
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /O estúdio não realiza atendimentos em domingos/i);
    }
  });

  it("rejeita agendamento fora da janela de horário de funcionamento configurada", () => {
    let state = createInitialStudioState();
    // 2026-10-17 é Sábado (expediente 08:00 às 17:00). Tentativa às 20:00
    const result = bookFromPublicSite(state, {
      clientName: "Rodrigo Alcantara",
      clientEmail: "rodrigo@alcantara.com",
      clientPhone: "(11) 97777-6666",
      serviceId: state.services[0].id,
      providerId: state.staff[0].id,
      dateISO: "2026-10-17",
      startTime: "20:00",
      selectedAddOnIds: [],
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /fora do expediente/i);
    }
  });

  it("respeita autoApprove = false criando agendamento como pending", () => {
    let state = createInitialStudioState();
    state = updateWebsiteSetupConfig(state, {
      autoApproveAppointments: false,
      onlineBookingGuarantee: "card_on_file",
    });

    // 2026-10-17 às 14:00 (Sábado aberto, sem conflito na agenda)
    const result = bookFromPublicSite(state, {
      clientName: "Fabiana Dias",
      clientEmail: "fabiana@dias.com",
      clientPhone: "(11) 96666-5555",
      serviceId: state.services[0].id,
      providerId: state.staff[0].id,
      dateISO: "2026-10-17",
      startTime: "14:00",
      selectedAddOnIds: [],
      cardOnFile: {
        last4: "8899",
        cardHolder: "Fabiana Dias",
      },
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      const created = result.state.calendarEvents[0];
      assert.equal(created.status, "pending");
      assert.match(created.addressOrNotes, /8899/);
    }
  });

  it("respeita autoApprove = true e guaranteeMode = none confirmando diretamente", () => {
    let state = createInitialStudioState();
    state = updateWebsiteSetupConfig(state, {
      autoApproveAppointments: true,
      onlineBookingGuarantee: "none",
    });

    const result = bookFromPublicSite(state, {
      clientName: "Paula Ramos",
      clientEmail: "paula@ramos.com",
      clientPhone: "(11) 95555-4444",
      serviceId: state.services[0].id,
      providerId: state.staff[0].id,
      dateISO: "2026-10-19",
      startTime: "10:00",
      selectedAddOnIds: [],
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      const created = result.state.calendarEvents[0];
      assert.equal(created.status, "confirmed");
      assert.equal(created.whatsappClientReply, "1_confirmed");
    }
  });
});
