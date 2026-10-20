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
  });
});
