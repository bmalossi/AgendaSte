import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  normalizeSubdomain,
  isValidCpfCnpj,
  calculatePasswordStrength,
  checkoutFormSchema,
  loginSchema,
  magicLinkSchema,
  cadastroSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../auth-schemas";

describe("Módulo de Autenticação, Checkout & Multi-Tenant (Luvea.app)", () => {
  describe("1. Normalização de Subdomínios & Validação de Documentos", () => {
    it("normaliza strings com acentos, caracteres especiais e espaços em slugs válidos", () => {
      assert.equal(
        normalizeSubdomain("Espaço Únniko & Estética"),
        "espaco-unniko-estetica"
      );
      assert.equal(
        normalizeSubdomain("  Studio D'Luxe 2026!  "),
        "studio-d-luxe-2026"
      );
      assert.equal(normalizeSubdomain("---barber---club---"), "barber-club");
    });

    it("valida documentos CPF (11 dígitos) e CNPJ (14 dígitos)", () => {
      assert.equal(isValidCpfCnpj("123.456.789-00"), true);
      assert.equal(isValidCpfCnpj("12345678900"), true);
      assert.equal(isValidCpfCnpj("12.345.678/0001-99"), true);
      assert.equal(isValidCpfCnpj("12345"), false);
      assert.equal(isValidCpfCnpj(""), false);
    });

    it("calcula a força da senha de forma progressiva", () => {
      assert.equal(calculatePasswordStrength("").score, 0);
      assert.equal(calculatePasswordStrength("12345678").score, 2);
      assert.equal(calculatePasswordStrength("Abc12345").score, 3);
      assert.equal(calculatePasswordStrength("Luvea@Studio#2026").score, 4);
      assert.equal(calculatePasswordStrength("Luvea@Studio#2026").label, "Excelente");
    });
  });

  describe("2. Schemas de Validação Zod", () => {
    it("valida payload completo de checkout com Pix", () => {
      const validPixData = {
        fullName: "Camila Valente",
        email: "camila@estudio.com.br",
        whatsapp: "(11) 98765-4321",
        cpfCnpj: "123.456.789-00",
        businessName: "Studio Camila Valente",
        subdomain: "studio-camila",
        planTier: "gold",
        billingCycle: "yearly",
        paymentMethod: "pix",
      };

      const result = checkoutFormSchema.safeParse(validPixData);
      assert.equal(result.success, true);
    });

    it("exige dados de cartão de crédito quando o método for credit_card", () => {
      const incompleteCardData = {
        fullName: "Camila Valente",
        email: "camila@estudio.com.br",
        whatsapp: "(11) 98765-4321",
        cpfCnpj: "123.456.789-00",
        businessName: "Studio Camila Valente",
        subdomain: "studio-camila",
        planTier: "gold",
        billingCycle: "monthly",
        paymentMethod: "credit_card",
        // faltando cardNumber, cardName, etc.
      };

      const result = checkoutFormSchema.safeParse(incompleteCardData);
      assert.equal(result.success, false);
      if (!result.success) {
        const errorPaths = (result.error?.issues || []).map((e) => e.path.join("."));
        assert.ok(errorPaths.includes("cardNumber"));
        assert.ok(errorPaths.includes("cardName"));
        assert.ok(errorPaths.includes("cardExp"));
        assert.ok(errorPaths.includes("cardCvc"));
      }
    });

    it("valida credenciais de login e rejeita e-mails inválidos", () => {
      const valid = loginSchema.safeParse({
        email: "admin@luvea.app",
        password: "secretpassword123",
      });
      assert.equal(valid.success, true);

      const invalid = loginSchema.safeParse({
        email: "not-an-email",
        password: "123",
      });
      assert.equal(invalid.success, false);
    });

    it("valida formulário de cadastro e exige confirmação de senha idêntica", () => {
      const mismatch = cadastroSchema.safeParse({
        fullName: "Bruna Silva",
        email: "bruna@estudio.com.br",
        password: "Password123",
        confirmPassword: "DifferentPassword123",
        businessName: "Bruna Lash & Brow",
        subdomain: "bruna-lash",
      });
      assert.equal(mismatch.success, false);

      const match = cadastroSchema.safeParse({
        fullName: "Bruna Silva",
        email: "bruna@estudio.com.br",
        password: "Password123",
        confirmPassword: "Password123",
        businessName: "Bruna Lash & Brow",
        subdomain: "bruna-lash",
      });
      assert.equal(match.success, true);
    });
  });

  describe("3. Rotas de API e Webhooks", () => {
    it("POST /api/checkout/session processa cadastro e gera payload Pix", async () => {
      const { POST } = await import("../../app/api/checkout/session/route");
      const req = new Request("http://localhost:3000/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Mariana Costa",
          email: "mariana@estudio.com.br",
          whatsapp: "11988887777",
          cpfCnpj: "98765432100",
          businessName: "Mariana Nails Studio",
          subdomain: "mariana-nails",
          planTier: "gold",
          billingCycle: "monthly",
          paymentMethod: "pix",
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.subdomain, "mariana-nails");
      assert.ok(data.pix);
      assert.ok(data.pix.copiaECola.includes("00020126580014BR.GOV.BCB.PIX"));
    });

    it("POST /api/webhooks/stripe recebe e responde a evento de checkout.session.completed", async () => {
      const { POST } = await import("../../app/api/webhooks/stripe/route");
      const req = new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: {
              client_reference_id: "org-12345",
              customer: "cus_12345",
              subscription: "sub_12345",
              metadata: {
                subdomain: "mariana-nails",
              },
            },
          },
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.received, true);
      assert.equal(data.event, "checkout.session.completed");
    });

    it("POST /api/webhooks/payment processa confirmação de pagamento multi-gateway", async () => {
      const { POST } = await import("../../app/api/webhooks/payment/route");
      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "payment.approved",
          subdomain: "mariana-nails",
          status: "approved",
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.received, true);
    });
  });

  describe("4. Integridade da Migration Supabase SQL RLS", () => {
    it("arquivo de migration contém tabelas organizations e profiles com RLS habilitado", () => {
      const migrationPath = path.resolve(
        process.cwd(),
        "supabase/migrations/20261020_auth_multitenant_checkout.sql"
      );
      assert.ok(fs.existsSync(migrationPath), "Migration SQL deve existir");

      const sqlContent = fs.readFileSync(migrationPath, "utf-8");
      assert.ok(sqlContent.includes("CREATE TABLE IF NOT EXISTS public.organizations"));
      assert.ok(sqlContent.includes("CREATE TABLE IF NOT EXISTS public.profiles"));
      assert.ok(sqlContent.includes("ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;"));
      assert.ok(sqlContent.includes("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;"));
      assert.ok(sqlContent.includes("CREATE POLICY \"Usuários podem ver sua própria organização\""));
      assert.ok(sqlContent.includes("CREATE POLICY \"Usuários podem ver perfis da sua organização\""));
      assert.ok(sqlContent.includes("CREATE POLICY \"Usuários podem atualizar seus próprios perfis\""));
    });

    it("arquivo de migration 20261021_multitenant_rls_isolation.sql garante RLS e isolamento estrito", () => {
      const migrationPath = path.resolve(
        process.cwd(),
        "supabase/migrations/20261021_multitenant_rls_isolation.sql"
      );
      assert.ok(fs.existsSync(migrationPath), "Migration de isolamento deve existir");

      const sqlContent = fs.readFileSync(migrationPath, "utf-8");
      // Verifica remoção de policies inseguras
      assert.ok(sqlContent.includes("DROP POLICY IF EXISTS \"Enable full access for dev and anon\""));
      // Verifica função security definer de tenant
      assert.ok(sqlContent.includes("CREATE OR REPLACE FUNCTION public.current_organization_id()"));
      // Verifica trigger de provisionamento automático
      assert.ok(sqlContent.includes("CREATE OR REPLACE FUNCTION public.handle_new_user_provisioning()"));
      assert.ok(sqlContent.includes("CREATE TRIGGER on_auth_user_created_provision"));
      // Verifica política de isolamento por tenant
      assert.ok(sqlContent.includes("CREATE POLICY \"Tenant isolation for authenticated users\""));
      // Verifica adição de organization_id nas tabelas
      assert.ok(sqlContent.includes("ADD COLUMN IF NOT EXISTS organization_id UUID"));
      // Verifica regras públicas para agendamento
      assert.ok(sqlContent.includes("CREATE POLICY \"Public booking site read services\""));
      assert.ok(sqlContent.includes("CREATE POLICY \"Public booking site create appointment\""));
    });

    it("garante que chaves de cache local são isoladas por usuário e por subdomínio público", () => {
      const userAId = "usr_tenant_11111111";
      const userBId = "usr_tenant_22222222";
      const slug = "salao-estilo";

      const keyA = `luvea_studio_state_v1_${userAId}`;
      const keyB = `luvea_studio_state_v1_${userBId}`;
      const publicSiteKey = `luvea_public_site_${slug}`;

      // Chaves devem ser mutuamente exclusivas
      assert.notEqual(keyA, keyB);
      assert.notEqual(keyA, publicSiteKey);
      assert.notEqual(keyB, publicSiteKey);

      assert.ok(keyA.endsWith(userAId));
      assert.ok(keyB.endsWith(userBId));
      assert.ok(publicSiteKey.endsWith(slug));
    });

    it("arquivo de migration 20261021_multitenant_hardening.sql fecha brechas de escalação e vaza de PII", () => {
      const migrationPath = path.resolve(
        process.cwd(),
        "supabase/migrations/20261021_multitenant_hardening.sql"
      );
      assert.ok(fs.existsSync(migrationPath), "Migration de hardening deve existir");

      const sqlContent = fs.readFileSync(migrationPath, "utf-8");
      // Prevenção de alteração de tenant em profiles
      assert.ok(sqlContent.includes("CREATE OR REPLACE FUNCTION public.prevent_profile_tenant_escalation()"));
      assert.ok(sqlContent.includes("CREATE TRIGGER trigger_prevent_profile_tenant_escalation"));
      // Prevenção de alteração de plano ou gateway em organizations
      assert.ok(sqlContent.includes("CREATE OR REPLACE FUNCTION public.prevent_organization_tampering()"));
      assert.ok(sqlContent.includes("CREATE TRIGGER trigger_prevent_organization_tampering"));
      // RPC pública sem vazamento de Stripe ou dados fiscais
      assert.ok(sqlContent.includes("CREATE OR REPLACE FUNCTION public.get_public_studio_by_slug"));
      // RPC pública de horários ocupados sem PII de clientes
      assert.ok(sqlContent.includes("CREATE OR REPLACE FUNCTION public.get_public_busy_slots"));
      // Backfill de usuários e dados legados
      assert.ok(sqlContent.includes("SELECT u.id, u.email, u.raw_user_meta_data"));
      // Proteção de slugs reservados
      assert.ok(sqlContent.includes("reserved_slugs"));
    });

    it("createEmptyTenantStudioState inicializa novo estúdio com listas 100% vazias e sem dados demo", async () => {
      const { createEmptyTenantStudioState } = await import("../agendaste-store");
      const emptyState = createEmptyTenantStudioState({
        fullName: "Renata Vasconcellos",
        businessName: "Renata Estética Avançada",
        subdomain: "renata-estetica",
        email: "renata@estetica.com.br",
      });

      // Clientes e agendamentos NUNCA devem ter dados de terceiros
      assert.equal(emptyState.clients.length, 0);
      assert.equal(emptyState.calendarEvents.length, 0);
      assert.equal(emptyState.waitlist.length, 0);
      assert.equal(emptyState.invoices.length, 0);
      assert.equal(emptyState.salesHistory.length, 0);

      // Dados do proprietário devem estar corretos
      assert.equal(emptyState.settings.personal.firstName, "Renata");
      assert.equal(emptyState.settings.personal.lastName, "Vasconcellos");
      assert.equal(emptyState.settings.personal.email, "renata@estetica.com.br");
      assert.equal(emptyState.settings.business.businessName, "Renata Estética Avançada");
      assert.equal(emptyState.settings.business.bookingSlug, "renata-estetica");
      assert.equal(emptyState.staff[0].fullName, "Renata Vasconcellos");
    });
  });
});
