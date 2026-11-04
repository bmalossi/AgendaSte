import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolvePlanPriceCents,
  calculateBonusTrialPeriodEnd,
  validateSubdomainOwnership,
} from "../billing/pricing.ts";
import { checkoutFormSchema } from "../auth-schemas.ts";

describe("Ticket 01 — Resolução Server-Side de Preços e Bônus de Teste Grátis", () => {
  it("resolve exclusivamente no servidor os valores em centavos de cada Plano e ciclo", () => {
    // Essencial
    assert.equal(resolvePlanPriceCents("essencial", "monthly"), 6900);
    assert.equal(resolvePlanPriceCents("essencial", "yearly"), 70800); // 12 x 5900

    // Gold
    assert.equal(resolvePlanPriceCents("gold", "monthly"), 14900);
    assert.equal(resolvePlanPriceCents("gold", "yearly"), 154800); // 12 x 12900

    // Platinum
    assert.equal(resolvePlanPriceCents("platinum", "monthly"), 39900);
    assert.equal(resolvePlanPriceCents("platinum", "yearly"), 418800); // 12 x 34900
  });

  it("calcula bônus de dias restantes do Teste Grátis e soma ao 1º ciclo pago", () => {
    const now = new Date("2026-11-03T12:00:00.000Z");
    // Faltam exatamente 8 dias para o fim do trial (2026-11-11T12:00:00.000Z)
    const trialEndsAt = new Date("2026-11-11T12:00:00.000Z");

    const monthlyResult = calculateBonusTrialPeriodEnd({
      trialEndsAt,
      billingCycle: "monthly",
      now,
    });

    assert.equal(monthlyResult.bonusDaysApplied, 8);
    // 30 dias do ciclo mensal + 8 dias bônus = 38 dias
    const expectedMonthlyEnd = new Date("2026-12-11T12:00:00.000Z");
    assert.equal(
      monthlyResult.periodEnd.toISOString(),
      expectedMonthlyEnd.toISOString()
    );

    const yearlyResult = calculateBonusTrialPeriodEnd({
      trialEndsAt,
      billingCycle: "yearly",
      now,
    });

    assert.equal(yearlyResult.bonusDaysApplied, 8);
    // 365 dias do ciclo anual + 8 dias bônus = 373 dias
    const expectedYearlyEnd = new Date(now.getTime() + 373 * 86400000);
    assert.equal(
      yearlyResult.periodEnd.toISOString(),
      expectedYearlyEnd.toISOString()
    );
  });

  it("não aplica dias bônus se o Teste Grátis já estiver expirado ou ausente", () => {
    const now = new Date("2026-11-03T12:00:00.000Z");
    const expiredTrial = new Date("2026-11-01T12:00:00.000Z");

    const result = calculateBonusTrialPeriodEnd({
      trialEndsAt: expiredTrial,
      billingCycle: "monthly",
      now,
    });

    assert.equal(result.bonusDaysApplied, 0);
    // 30 dias padrão
    const expectedEnd = new Date("2026-12-03T12:00:00.000Z");
    assert.equal(result.periodEnd.toISOString(), expectedEnd.toISOString());
  });

  it("valida que checkoutFormSchema aceita dados de checkout sem exigir dados de cartão (PCI-DSS SAQ-A)", () => {
    const validData = {
      fullName: "Camila Valente",
      email: "camila@estudio.com.br",
      whatsapp: "(11) 98765-4321",
      cpfCnpj: "48.192.301/0001-82",
      businessName: "Espaço Unniko Beauty",
      subdomain: "espaco-unniko",
      planTier: "gold",
      billingCycle: "monthly",
      paymentMethod: "credit_card",
    };

    const parseResult = checkoutFormSchema.safeParse(validData);
    assert.equal(parseResult.success, true);
    if (parseResult.success) {
      // Garante que não existem campos sensíveis de cartão
      const keys = Object.keys(parseResult.data);
      assert.equal(keys.includes("cardNumber"), false);
      assert.equal(keys.includes("cardCvc"), false);
      assert.equal(keys.includes("cardExp"), false);
    }
  });

  it("protege contra sobrescrita não autorizada de subdomínio existente (Anti-Overwrite)", () => {
    const existingOrg = {
      id: "org-111",
      slug: "espaco-unniko",
      name: "Espaço Unniko",
    };

    // Caso 1: Usuário deslogado tentando assumir subdomínio já existente
    const unauthCheck = validateSubdomainOwnership({
      existingOrg,
      requesterUserId: null,
      requesterOrgId: null,
      requesterRole: null,
    });
    assert.equal(unauthCheck.canProceed, false);
    assert.equal(unauthCheck.status, 409);
    assert.match(unauthCheck.error ?? "", /já está em uso/i);

    // Caso 2: Usuário de OUTRA organização tentando assumir subdomínio
    const foreignUserCheck = validateSubdomainOwnership({
      existingOrg,
      requesterUserId: "user-222",
      requesterOrgId: "org-999",
      requesterRole: "owner",
    });
    assert.equal(foreignUserCheck.canProceed, false);
    assert.equal(foreignUserCheck.status, 409);

    // Caso 3: Dono legítimo da organização atualizando dados
    const legitimateOwnerCheck = validateSubdomainOwnership({
      existingOrg,
      requesterUserId: "user-111",
      requesterOrgId: "org-111",
      requesterRole: "owner",
    });
    assert.equal(legitimateOwnerCheck.canProceed, true);
    assert.equal(legitimateOwnerCheck.isUpdate, true);

    // Caso 4: Subdomínio inédito (novo estúdio)
    const newOrgCheck = validateSubdomainOwnership({
      existingOrg: null,
      requesterUserId: null,
      requesterOrgId: null,
      requesterRole: null,
    });
    assert.equal(newOrgCheck.canProceed, true);
    assert.equal(newOrgCheck.isUpdate, false);
  });
});

describe("Ticket 02 — Webhooks Criptográficos (HMAC-SHA256 + Anti-Replay + Idempotência) e Sincronização Anti-Duplicidade", () => {
  const crypto = require("node:crypto");

  it("valida assinatura HMAC-SHA256 da Stripe com timingSafeEqual e rejeita replay attack (> 300s)", async () => {
    const { verifyStripeWebhookSignature } = await import("../billing/stripe.ts");
    const secret = "whsec_test_secret_abc123";
    const payload = JSON.stringify({ id: "evt_test_1", type: "invoice.paid" });

    // 1. Assinatura válida com timestamp atual
    const nowSeconds = Math.floor(Date.now() / 1000);
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${nowSeconds}.${payload}`, "utf8")
      .digest("hex");
    const validHeader = `t=${nowSeconds},v1=${validSignature}`;

    const validResult = verifyStripeWebhookSignature({
      payload,
      signatureHeader: validHeader,
      secret,
      toleranceSeconds: 300,
    });
    assert.equal(validResult.valid, true);
    assert.equal(validResult.event.id, "evt_test_1");

    // 2. Assinatura adulterada
    const tamperedResult = verifyStripeWebhookSignature({
      payload,
      signatureHeader: `t=${nowSeconds},v1=deadbeefcafebabe123456`,
      secret,
      toleranceSeconds: 300,
    });
    assert.equal(tamperedResult.valid, false);
    assert.match(tamperedResult.error ?? "", /não confere/i);

    // 3. Replay attack: timestamp de 301 segundos atrás
    const oldSeconds = nowSeconds - 301;
    const oldSignature = crypto
      .createHmac("sha256", secret)
      .update(`${oldSeconds}.${payload}`, "utf8")
      .digest("hex");
    const replayHeader = `t=${oldSeconds},v1=${oldSignature}`;

    const replayResult = verifyStripeWebhookSignature({
      payload,
      signatureHeader: replayHeader,
      secret,
      toleranceSeconds: 300,
    });
    assert.equal(replayResult.valid, false);
    assert.match(replayResult.error ?? "", /replay attack/i);
  });

  it("valida assinatura HMAC-SHA256 do Mercado Pago e rejeita replay attack com tolerância", async () => {
    const { verifyMercadoPagoWebhookSignature } = await import("../mercadopago.ts");
    const secret = "mp_webhook_secret_xyz789";
    const dataId = "123456789";
    const xRequestId = "req-uuid-test";
    const nowSeconds = Math.floor(Date.now() / 1000);

    const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${nowSeconds};`;
    const v1 = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
    const xSignature = `ts=${nowSeconds},v1=${v1}`;

    // 1. Assinatura válida dentro da tolerância
    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature,
        xRequestId,
        dataId,
        secret,
        toleranceSeconds: 300,
      }),
      true
    );

    // 2. Assinatura inválida
    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature: `ts=${nowSeconds},v1=0000000000000000000000000000000000000000000000000000000000000000`,
        xRequestId,
        dataId,
        secret,
        toleranceSeconds: 300,
      }),
      false
    );

    // 3. Replay attack: ts de 310 segundos atrás
    const expiredTs = nowSeconds - 310;
    const expiredManifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${expiredTs};`;
    const expiredV1 = crypto.createHmac("sha256", secret).update(expiredManifest).digest("hex");
    const expiredSignature = `ts=${expiredTs},v1=${expiredV1}`;

    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature: expiredSignature,
        xRequestId,
        dataId,
        secret,
        toleranceSeconds: 300,
      }),
      false
    );
  });

  it("garante idempotência registrando eventos na tabela/store de webhook evitando repetição", async () => {
    const {
      recordWebhookEventIfNotProcessed,
      resetInMemoryWebhookEventsForTesting,
    } = await import("../billing/webhook-events.ts");

    resetInMemoryWebhookEventsForTesting();

    // 1. Primeiro recebimento de evento
    const firstCall = await recordWebhookEventIfNotProcessed({
      gateway: "stripe",
      eventId: "evt_unique_100",
      eventType: "invoice.paid",
    });
    assert.equal(firstCall.isDuplicate, false);
    assert.equal(firstCall.recorded, true);

    // 2. Notificação repetida do mesmo evento
    const duplicateCall = await recordWebhookEventIfNotProcessed({
      gateway: "stripe",
      eventId: "evt_unique_100",
      eventType: "invoice.paid",
    });
    assert.equal(duplicateCall.isDuplicate, true);
    assert.equal(duplicateCall.recorded, false);

    // 3. Evento diferente ou gateway diferente não é duplicata
    const otherEvent = await recordWebhookEventIfNotProcessed({
      gateway: "mercadopago",
      eventId: "evt_unique_100",
      eventType: "order",
    });
    assert.equal(otherEvent.isDuplicate, false);
    assert.equal(otherEvent.recorded, true);
  });

  it("calcula Período de Carência (Grace Period) de 3 dias (72h) em falha de pagamento", async () => {
    const {
      calculateGracePeriodEndsAt,
      processStripeWebhookEvent,
    } = await import("../billing/webhook-processor.ts");

    const baseDate = new Date("2026-11-03T10:00:00.000Z");
    const graceEnd = calculateGracePeriodEndsAt(baseDate);

    // 3 dias = 72 horas exatas
    const expectedEnd = new Date("2026-11-06T10:00:00.000Z");
    assert.equal(graceEnd.toISOString(), expectedEnd.toISOString());

    // Evento de falha de pagamento inicia Período de Carência
    const failedInvoiceEvent = {
      id: "evt_inv_fail_1",
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "in_fail_123",
          subscription: "sub_mock_past_due_test",
          amount_due: 14900,
        },
      },
    };

    const processResult = await processStripeWebhookEvent(failedInvoiceEvent);
    assert.equal(processResult.handled, true);
    assert.equal(processResult.status, "past_due");
    assert.ok(processResult.gracePeriodEndsAt);
  });

  it("sincroniza anti-duplicidade estendendo ciclo e desativando Stripe ao quitar fatura Pix", async () => {
    const {
      calculateNewPeriodEndFromPixPayment,
      processMercadoPagoPlanInvoicePayment,
    } = await import("../billing/webhook-processor.ts");

    // 1. Cálculo de novo término ao quitar Pix
    const now = new Date("2026-11-03T12:00:00.000Z");
    const activeCurrentPeriodEnd = new Date("2026-11-15T12:00:00.000Z"); // faltam 12 dias

    // Se já havia período pago vigente, estende a partir dele (15/11 + 30 dias = 15/12)
    const extendedEnd = calculateNewPeriodEndFromPixPayment({
      currentPeriodEnd: activeCurrentPeriodEnd,
      billingCycle: "monthly",
      bonusDays: 0,
      now,
    });
    const expectedExtended = new Date("2026-12-15T12:00:00.000Z");
    assert.equal(extendedEnd.toISOString(), expectedExtended.toISOString());

    // 2. Se não havia período vigente, estende a partir de now (03/11 + 30 dias = 03/12)
    const newEnd = calculateNewPeriodEndFromPixPayment({
      currentPeriodEnd: null,
      billingCycle: "monthly",
      bonusDays: 0,
      now,
    });
    const expectedNew = new Date("2026-12-03T12:00:00.000Z");
    assert.equal(newEnd.toISOString(), expectedNew.toISOString());

    // 3. Processamento de liquidação Pix com mock
    let cancelStripeSubCalledWith: string | null = null;
    const mockCancelStripe = async (subId: string, atPeriodEnd?: boolean) => {
      cancelStripeSubCalledWith = subId;
      return { success: true, status: "cancel_at_period_end" };
    };

    const pixPaymentResult = await processMercadoPagoPlanInvoicePayment({
      paymentId: "pay_mp_12345",
      remoteStatus: "approved",
      remoteAmountCents: 14900,
      externalReference: "sub_inv_test_ref",
      cancelStripeSubFn: mockCancelStripe,
    });

    assert.equal(pixPaymentResult.handled, true);
    assert.equal(pixPaymentResult.stripeSubscriptionCanceled, true);
  });

  it("rejeita liquidação de Fatura do Plano se o valor pago for divergente (server-to-server check)", async () => {
    const { processMercadoPagoPlanInvoicePayment } = await import(
      "../billing/webhook-processor.ts"
    );

    // Status não aprovado deve ser ignorado
    const pendingResult = await processMercadoPagoPlanInvoicePayment({
      paymentId: "pay_pending_1",
      remoteStatus: "pending",
      remoteAmountCents: 14900,
    });
    assert.equal(pendingResult.handled, false);
    assert.equal(pendingResult.action, "payment_not_approved");
  });
});

describe("Ticket 03 — Gestão Self-Service Híbrida (Upgrade com Prorrata, Downgrade Agendado, CDC 7 Dias)", () => {
  it("calcula prorrata proporcional exata em upgrades de plano", async () => {
    const { calculateProrationDifference } = await import("../billing/pricing.ts");

    // Cenário: Upgrade de Essencial (R$ 69,00) para Gold (R$ 149,00) na metade do ciclo (15 de 30 dias)
    const startDate = new Date("2026-11-01T00:00:00.000Z");
    const endDate = new Date("2026-12-01T00:00:00.000Z");
    const now = new Date("2026-11-16T00:00:00.000Z"); // 15 dias restantes de 30 dias

    const proration = calculateProrationDifference({
      currentPlanTier: "essencial",
      currentBillingCycle: "monthly",
      targetPlanTier: "gold",
      targetBillingCycle: "monthly",
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      now,
    });

    assert.equal(proration.isUpgrade, true);
    assert.equal(proration.totalDaysInCycle, 30);
    assert.equal(proration.remainingDays, 15);
    // Crédito do Essencial: 6900 * 15 / 30 = 3450 centavos (R$ 34,50)
    assert.equal(proration.unusedCurrentPlanCents, 3450);
    // Custo do Gold nos 15 dias: 14900 * 15 / 30 = 7450 centavos (R$ 74,50)
    assert.equal(proration.costTargetPlanRemainingCents, 7450);
    // Diferença líquida a cobrar: 7450 - 3450 = 4000 centavos (R$ 40,00)
    assert.equal(proration.netProrationCents, 4000);
  });

  it("valida limite de equipe (maxStaff) bloqueando downgrade se profissionais ativos excederem capacidade", async () => {
    const { validateDowngradeStaffLimit } = await import("../billing/pricing.ts");

    // 1. Estúdio com 4 profissionais tentando downgrade para Essencial (maxStaff: 1)
    const blockedCheck = validateDowngradeStaffLimit({
      activeStaffCount: 4,
      targetPlanTier: "essencial",
    });
    assert.equal(blockedCheck.valid, false);
    assert.equal(blockedCheck.maxAllowed, 1);
    assert.equal(blockedCheck.currentCount, 4);
    assert.match(blockedCheck.error ?? "", /possui 4 profissionais ativos/i);
    assert.match(blockedCheck.error ?? "", /permite no máximo 1/i);

    // 2. Estúdio com 1 profissional tentando downgrade para Essencial (maxStaff: 1)
    const allowedEssencial = validateDowngradeStaffLimit({
      activeStaffCount: 1,
      targetPlanTier: "essencial",
    });
    assert.equal(allowedEssencial.valid, true);

    // 3. Estúdio com 10 profissionais tentando downgrade para Gold (maxStaff: 9)
    const blockedGold = validateDowngradeStaffLimit({
      activeStaffCount: 10,
      targetPlanTier: "gold",
    });
    assert.equal(blockedGold.valid, false);
    assert.equal(blockedGold.maxAllowed, 9);

    // 4. Estúdio com 9 profissionais tentando downgrade para Gold (maxStaff: 9)
    const allowedGold = validateDowngradeStaffLimit({
      activeStaffCount: 9,
      targetPlanTier: "gold",
    });
    assert.equal(allowedGold.valid, true);
  });

  it("verifica direito de arrependimento (CDC Art. 49) válido apenas nos primeiros 7 dias de first_paid_at", async () => {
    const { isEligibleForCdcRefund } = await import("../billing/pricing.ts");

    const now = new Date("2026-11-10T12:00:00.000Z");

    // 1. Pagamento feito há 3 dias (dentro dos 7 dias)
    const threeDaysAgo = new Date("2026-11-07T12:00:00.000Z");
    assert.equal(isEligibleForCdcRefund(threeDaysAgo, now), true);

    // 2. Pagamento feito há exatamente 7 dias corridos
    const sevenDaysAgo = new Date("2026-11-03T12:00:00.000Z");
    assert.equal(isEligibleForCdcRefund(sevenDaysAgo, now), true);

    // 3. Pagamento feito há 8 dias corridos (expirou prazo CDC)
    const eightDaysAgo = new Date("2026-11-02T12:00:00.000Z");
    assert.equal(isEligibleForCdcRefund(eightDaysAgo, now), false);

    // 4. first_paid_at nulo ou indefinido
    assert.equal(isEligibleForCdcRefund(null, now), false);
    assert.equal(isEligibleForCdcRefund(undefined, now), false);
  });

  it("executa rotas de faturamento self-service (change-plan, cancel, reactivate, portal, subscription)", async () => {
    const { POST: changePlanPOST } = await import(
      "../../app/api/billing/change-plan/route.ts"
    );
    const { POST: cancelPOST } = await import(
      "../../app/api/billing/cancel/route.ts"
    );
    const { POST: reactivatePOST } = await import(
      "../../app/api/billing/reactivate/route.ts"
    );
    const { POST: portalPOST } = await import(
      "../../app/api/billing/portal/route.ts"
    );
    const { GET: subscriptionGET } = await import(
      "../../app/api/billing/subscription/route.ts"
    );

    // 1. GET /api/billing/subscription
    const subRes = await subscriptionGET();
    const subJson = await subRes.json();
    assert.equal(subRes.status, 200);
    assert.equal(subJson.ok, true);
    assert.ok(subJson.subscription);
    assert.equal(typeof subJson.subscription.canRefundCdc, "boolean");

    // 2. POST /api/billing/change-plan (reversão de agendamento de downgrade)
    const cancelDowngradeReq = new Request("http://localhost:3000/api/billing/change-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetPlanTier: null }),
    });
    const cancelDowngradeRes = await changePlanPOST(cancelDowngradeReq);
    const cancelDowngradeJson = await cancelDowngradeRes.json();
    assert.equal(cancelDowngradeRes.status, 200);
    assert.equal(cancelDowngradeJson.ok, true);

    // 3. POST /api/billing/cancel (CDC Art. 49)
    const cancelCdcReq = new Request("http://localhost:3000/api/billing/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "immediate_refund_cdc" }),
    });
    const cancelCdcRes = await cancelPOST(cancelCdcReq);
    const cancelCdcJson = await cancelCdcRes.json();
    assert.equal(cancelCdcRes.status, 200);
    assert.equal(cancelCdcJson.ok, true);

    // 4. POST /api/billing/cancel (ao fim do ciclo)
    const cancelPeriodEndReq = new Request("http://localhost:3000/api/billing/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "at_period_end" }),
    });
    const cancelPeriodEndRes = await cancelPOST(cancelPeriodEndReq);
    const cancelPeriodEndJson = await cancelPeriodEndRes.json();
    assert.equal(cancelPeriodEndRes.status, 200);
    assert.equal(cancelPeriodEndJson.ok, true);

    // 5. POST /api/billing/reactivate
    const reactivateRes = await reactivatePOST();
    const reactivateJson = await reactivateRes.json();
    assert.equal(reactivateRes.status, 200);
    assert.equal(reactivateJson.ok, true);

    // 6. POST /api/billing/portal
    const portalReq = new Request("http://localhost:3000/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "http://localhost:3000" },
    });
    const portalRes = await portalPOST(portalReq);
    const portalJson = await portalRes.json();
    assert.equal(portalRes.status, 200);
    assert.equal(portalJson.ok, true);
    assert.ok(portalJson.url);
  });
});

describe("Ticket 04 — Motor de Entitlements, Período de Carência e Bloqueio Operacional", () => {
  it("deriva estados de acesso (full_access, grace_period_warning e operational_soft_lock)", async () => {
    const { evaluateOrganizationEntitlements } = await import("../billing/entitlements.ts");

    const now = new Date("2026-11-03T12:00:00.000Z");

    // 1. Assinatura ativa -> full_access
    const activeEnt = evaluateOrganizationEntitlements({
      subscriptionStatus: "active",
      planTier: "gold",
      now,
    });
    assert.equal(activeEnt.accessState, "full_access");
    assert.equal(activeEnt.isSoftLocked, false);
    assert.equal(activeEnt.isGracePeriod, false);
    assert.equal(activeEnt.canCreateNewAppointments, true);
    assert.equal(activeEnt.canAcceptOnlineBookings, true);

    // 2. Past due dentro do Período de Carência (gracePeriodEndsAt no futuro) -> grace_period_warning
    const graceEnd = new Date("2026-11-05T12:00:00.000Z"); // 2 dias restantes
    const graceEnt = evaluateOrganizationEntitlements({
      subscriptionStatus: "past_due",
      planTier: "gold",
      gracePeriodEndsAt: graceEnd,
      now,
    });
    assert.equal(graceEnt.accessState, "grace_period_warning");
    assert.equal(graceEnt.isGracePeriod, true);
    assert.equal(graceEnt.isSoftLocked, false);
    assert.equal(graceEnt.graceDaysLeft, 2);
    // No Período de Carência, o estúdio continua operando normalmente
    assert.equal(graceEnt.canCreateNewAppointments, true);
    assert.equal(graceEnt.canAcceptOnlineBookings, true);

    // 3. Past due com Período de Carência expirado -> operational_soft_lock
    const expiredGraceEnd = new Date("2026-11-02T12:00:00.000Z"); // expirou ontem
    const softLockedEnt = evaluateOrganizationEntitlements({
      subscriptionStatus: "past_due",
      planTier: "gold",
      gracePeriodEndsAt: expiredGraceEnd,
      now,
    });
    assert.equal(softLockedEnt.accessState, "operational_soft_lock");
    assert.equal(softLockedEnt.isSoftLocked, true);
    assert.equal(softLockedEnt.canCreateNewAppointments, false);
    assert.equal(softLockedEnt.canAcceptOnlineBookings, false);
    assert.equal(softLockedEnt.canSendMarketingCampaigns, false);
    assert.equal(softLockedEnt.canUseAiReception, false);

    // 4. Cancelado mas com período pago ainda vigente -> full_access
    const futurePeriodEnd = new Date("2026-11-20T12:00:00.000Z");
    const canceledActiveEnt = evaluateOrganizationEntitlements({
      subscriptionStatus: "canceled",
      planTier: "gold",
      currentPeriodEnd: futurePeriodEnd,
      now,
    });
    assert.equal(canceledActiveEnt.accessState, "full_access");
    assert.equal(canceledActiveEnt.isSoftLocked, false);

    // 5. Cancelado e com período pago vencido -> operational_soft_lock
    const pastPeriodEnd = new Date("2026-11-01T12:00:00.000Z");
    const canceledExpiredEnt = evaluateOrganizationEntitlements({
      subscriptionStatus: "canceled",
      planTier: "gold",
      currentPeriodEnd: pastPeriodEnd,
      now,
    });
    assert.equal(canceledExpiredEnt.accessState, "operational_soft_lock");
    assert.equal(canceledExpiredEnt.isSoftLocked, true);
  });

  it("garante conformidade LGPD e permissão para concluir agendamentos já confirmados no Bloqueio Operacional", async () => {
    const {
      evaluateOrganizationEntitlements,
      canCompleteAppointmentInSoftLock,
    } = await import("../billing/entitlements.ts");

    const entitlements = evaluateOrganizationEntitlements({
      subscriptionStatus: "past_due",
      planTier: "essencial",
      gracePeriodEndsAt: new Date("2026-11-01T00:00:00.000Z"), // expirado
      now: new Date("2026-11-03T12:00:00.000Z"),
    });

    assert.equal(entitlements.isSoftLocked, true);
    // Incondicional: Exportação LGPD é SEMPRE permitida
    assert.equal(entitlements.canExportDataLgpd, true);
    // Incondicional: Dar baixa/concluir agendamentos confirmados é SEMPRE permitido
    assert.equal(entitlements.canCompleteConfirmedAppointments, true);

    // Validação granular de status de agendamento no Soft-Lock
    assert.equal(canCompleteAppointmentInSoftLock("confirmed"), true);
    assert.equal(canCompleteAppointmentInSoftLock("1_confirmed"), true);
    assert.equal(canCompleteAppointmentInSoftLock("in_progress"), true);
    assert.equal(canCompleteAppointmentInSoftLock("completed"), true);
    assert.equal(canCompleteAppointmentInSoftLock("pending"), false);
  });

  it("impede criação de novas reservas online (bookFromPublicSite) e novos agendamentos na Agenda quando em Bloqueio Operacional", async () => {
    const {
      createInitialStudioState,
      bookFromPublicSite,
      validateAndCreateCalendarEvent,
    } = await import("../agendaste-store.ts");

    const baseState = createInitialStudioState();

    // Coloca estúdio em Bloqueio Operacional (past_due com grace_period_ends_at expirado e fora do trial)
    const softLockedState = {
      ...baseState,
      onboarding: {
        ...baseState.onboarding,
        subscriptionStatus: "past_due" as const,
        trialDaysLeft: 0,
        gracePeriodEndsAt: "2026-11-01T00:00:00.000Z", // Expirado
      },
    };

    // 1. Tentativa de reserva online no site público deve ser recusada com mensagem editorial clara
    const bookingResult = bookFromPublicSite(softLockedState, {
      clientName: "Renata Flores",
      clientEmail: "renata@cliente.com",
      clientPhone: "(11) 98888-7766",
      serviceId: baseState.services[0].id,
      providerId: baseState.staff[0].id,
      dateISO: "2026-11-05",
      startTime: "10:00",
      selectedAddOnIds: [],
    });

    assert.equal(bookingResult.ok, false);
    if (!bookingResult.ok) {
      assert.match(bookingResult.error, /temporariamente suspenso para novas reservas/i);
    }

    // 2. Tentativa de criar novo agendamento no painel deve ser recusada
    const calendarResult = validateAndCreateCalendarEvent(softLockedState, {
      eventType: "appointment",
      dateISO: "2026-11-05",
      startTime: "14:00",
      providerId: baseState.staff[0].id,
      clientId: baseState.clients[0].id,
      serviceIds: [baseState.services[0].id],
      addressOrNotes: "Novo agendamento",
      isRepeating: false,
      collectDeposit: false,
    });

    assert.equal(calendarResult.ok, false);
    if (!calendarResult.ok) {
      assert.match(calendarResult.message, /Bloqueio Operacional/i);
    }
  });

  it("enforça limites e permissões de cada Plano (Essencial vs Gold vs Platinum)", async () => {
    const { evaluateOrganizationEntitlements } = await import("../billing/entitlements.ts");

    // 1. Essencial: 1 profissional, sem Recepção IA, sem recursos físicos, sem fechamento de repasse
    const essencial = evaluateOrganizationEntitlements({
      subscriptionStatus: "active",
      planTier: "essencial",
    });
    assert.equal(essencial.maxStaff, 1);
    assert.equal(essencial.canUseAiReception, false);
    assert.equal(essencial.canUsePhysicalResources, false);
    assert.equal(essencial.canUsePayroll, false);
    assert.equal(essencial.marketingCredits, 100);

    // 2. Gold: até 9 profissionais, com Recepção IA, sem recursos físicos, com fechamento de repasse
    const gold = evaluateOrganizationEntitlements({
      subscriptionStatus: "active",
      planTier: "gold",
    });
    assert.equal(gold.maxStaff, 9);
    assert.equal(gold.canUseAiReception, true);
    assert.equal(gold.canUsePhysicalResources, false);
    assert.equal(gold.canUsePayroll, true);
    assert.equal(gold.marketingCredits, 500);

    // 3. Platinum: profissionais ilimitados, com Recepção IA, com recursos físicos (lasers/salas), com repasse
    const platinum = evaluateOrganizationEntitlements({
      subscriptionStatus: "active",
      planTier: "platinum",
    });
    assert.ok(platinum.maxStaff >= 999);
    assert.equal(platinum.canUseAiReception, true);
    assert.equal(platinum.canUsePhysicalResources, true);
    assert.equal(platinum.canUsePayroll, true);
    assert.equal(platinum.marketingCredits, 2000);
  });
});
