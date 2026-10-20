import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createInitialStudioState,
  getDefaultWebsiteBookingConfig,
  getDefaultBookingControls,
  getDefaultClientNotifications,
  updateWebsiteSetupConfig,
  updateStudioSettings,
} from "../agendaste-store.ts";

describe("Configurações Avançadas de Negócio (Settings) — LUVEA Editorial", () => {
  it("inicializa as configurações com Website Tracking, Controles de Agendamento e Notificações de Clientes", () => {
    const initial = createInitialStudioState();
    const config = initial.settings.website ?? getDefaultWebsiteBookingConfig(initial.settings.business.businessName);

    // 1. Website Tracking
    assert.ok(config.tracking);
    assert.equal(typeof config.tracking.googleAnalyticsId, "string");
    assert.equal(typeof config.tracking.metaPixelId, "string");
    assert.equal(config.tracking.enabled, false);

    // 2. Booking Controls
    assert.ok(config.bookingControls);
    assert.equal(config.bookingControls.autoApproveMode, "always");
    assert.equal(config.bookingControls.bookingIncrementsMinutes, 15);
    assert.equal(config.bookingControls.minimizeSchedulingGaps, true);
    assert.equal(config.bookingControls.requireCardOnFile, "all");
    assert.equal(config.bookingControls.advanceBookingMonths, 2);
    assert.equal(config.bookingControls.allowProcessingTimeBooking, true);
    assert.equal(config.bookingControls.askClientsForPronouns, true);
    assert.equal(config.bookingControls.cancellations.feePercent, 30);
    assert.equal(config.bookingControls.cancellations.windowHours, 24);
    assert.equal(config.bookingControls.waitlistOnlineEnabled, true);

    // 3. Client Notifications
    assert.ok(config.clientNotifications);
    assert.ok(config.clientNotifications.items.length >= 10);
    assert.ok(config.clientNotifications.googleReviewLink.includes("review"));
  });

  it("atualiza IDs de Website Tracking (Google Analytics e Meta Pixel) via updateWebsiteSetupConfig", () => {
    const initial = createInitialStudioState();
    const updated = updateWebsiteSetupConfig(initial, {
      tracking: {
        googleAnalyticsId: "G-LUVEA2026",
        metaPixelId: "987654321098765",
        enabled: true,
      },
    });

    assert.equal(updated.settings.website.tracking?.googleAnalyticsId, "G-LUVEA2026");
    assert.equal(updated.settings.website.tracking?.metaPixelId, "987654321098765");
    assert.equal(updated.settings.website.tracking?.enabled, true);
  });

  it("permite customizar Controles de Agendamento (Booking Controls), políticas de cancelamento e no-show", () => {
    const initial = createInitialStudioState();
    const controls = getDefaultBookingControls();

    controls.autoApproveMode = "manual";
    controls.bookingWindowHours = 4;
    controls.bookingIncrementsMinutes = 30;
    controls.minimizeSchedulingGaps = true;
    controls.maxGapMinutes = 30;
    controls.cancellations.feePercent = 50;
    controls.cancellations.windowHours = 48;
    controls.cancellations.policyDetails = "Taxa de 50% para cancelamentos com menos de 48h.";

    const updated = updateWebsiteSetupConfig(initial, {
      bookingControls: controls,
    });

    const saved = updated.settings.website.bookingControls!;
    assert.equal(saved.autoApproveMode, "manual");
    assert.equal(saved.bookingWindowHours, 4);
    assert.equal(saved.bookingIncrementsMinutes, 30);
    assert.equal(saved.cancellations.feePercent, 50);
    assert.equal(saved.cancellations.windowHours, 48);
    assert.equal(saved.cancellations.policyDetails, "Taxa de 50% para cancelamentos com menos de 48h.");
  });

  it("permite salvar o link do Google Reviews e personalizar templates de notificações de clientes", () => {
    const initial = createInitialStudioState();
    const notifs = getDefaultClientNotifications();

    notifs.googleReviewLink = "https://g.page/r/luveastudio-sp/review";
    const confirmItem = notifs.items.find((it) => it.id === "pre-confirm")!;
    confirmItem.templateBody = "Olá {nome}! Seu horário no {estudio} para {data} às {horario} está confirmado.";

    const updated = updateWebsiteSetupConfig(initial, {
      clientNotifications: notifs,
    });

    const savedNotifs = updated.settings.website.clientNotifications!;
    assert.equal(savedNotifs.googleReviewLink, "https://g.page/r/luveastudio-sp/review");
    const savedConfirm = savedNotifs.items.find((it) => it.id === "pre-confirm")!;
    assert.match(savedConfirm.templateBody, /Seu horário no {estudio}/);
  });

  it("permite configurar Cobrança & Checkout (taxa de tecnologia, impostos de serviços e varejo, e BNPL)", () => {
    const initial = createInitialStudioState();
    const config = initial.settings.website ?? getDefaultWebsiteBookingConfig(initial.settings.business.businessName);

    // Valores padrão
    assert.ok(config.checkoutSettings);
    assert.equal(config.checkoutSettings.technologyFeePayer, "studio");
    assert.equal(config.checkoutSettings.serviceSalesTaxPercent, 0);
    assert.equal(config.checkoutSettings.retailSalesTaxPercent, 0);
    assert.equal(config.checkoutSettings.acceptBnpl, false);
    assert.equal(config.checkoutSettings.allowTapToPay, true);

    // Atualização
    const updated = updateWebsiteSetupConfig(initial, {
      checkoutSettings: {
        acceptBnpl: true,
        bnplFeePercent: 6,
        bnplFixedFeeCents: 30,
        technologyFeePayer: "client",
        serviceSalesTaxPercent: 5,
        retailSalesTaxPercent: 18,
        allowTapToPay: true,
      },
    });

    const saved = updated.settings.website.checkoutSettings!;
    assert.equal(saved.technologyFeePayer, "client");
    assert.equal(saved.serviceSalesTaxPercent, 5);
    assert.equal(saved.retailSalesTaxPercent, 18);
    assert.equal(saved.acceptBnpl, true);
  });

  it("permite configurar Prontuários (Charting) e Assinaturas Clínicas", () => {
    const initial = createInitialStudioState();
    const config = initial.settings.website ?? getDefaultWebsiteBookingConfig(initial.settings.business.businessName);

    assert.ok(config.chartingSettings);
    assert.equal(config.chartingSettings.requireProviderSignature, false);
    assert.equal(config.chartingSettings.requireMedicalDirectorSignOff, false);

    const updated = updateWebsiteSetupConfig(initial, {
      chartingSettings: {
        requireProviderSignature: true,
        requireMedicalDirectorSignOff: true,
      },
    });

    const saved = updated.settings.website.chartingSettings!;
    assert.equal(saved.requireProviderSignature, true);
    assert.equal(saved.requireMedicalDirectorSignOff, true);
  });
});
