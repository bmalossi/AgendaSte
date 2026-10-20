import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { render } from "@react-email/render";
import { resend, isResendConfigured, getSenderEmail, getAppBaseUrl } from "../resend";
import {
  WelcomeEmail,
  ResetPasswordEmail,
  AppointmentConfirmationEmail,
} from "../../emails";
import { checkLuveaDomainStatus } from "../resend-domain";

describe("Integração Oficial do Resend & Templates de E-mail de Luxo (Luvea.app)", () => {
  describe("1. Cliente Singleton do Resend & Utilitários de Ambiente", () => {
    it("inicializa a instância do Resend com métodos de envio", () => {
      assert.ok(resend);
      assert.equal(typeof resend.emails.send, "function");
    });

    it("retorna remetente padrão oficial e URL da aplicação", () => {
      const sender = getSenderEmail();
      assert.ok(sender.includes("Luvea"));
      assert.ok(sender.includes("@luvea.app"));

      const baseUrl = getAppBaseUrl();
      assert.ok(baseUrl.startsWith("http"));
    });

    it("verifica se a chave do Resend está configurada de forma segura", () => {
      const configured = isResendConfigured();
      assert.equal(typeof configured, "boolean");
    });
  });

  describe("2. Templates React Email de Luxo (Design Editorial & Anti-AI Slop)", () => {
    it("renderiza WelcomeEmail com URL do subdomínio e sem caracteres Unicode proibidos", async () => {
      const html = await render(
        WelcomeEmail({
          name: "Camila Valente",
          subdomain: "studio-camila",
          businessName: "Studio Camila Valente",
          planTier: "gold",
        })
      );

      assert.ok(html.includes("LUVEA"));
      assert.ok(html.includes("Camila Valente"));
      assert.ok(html.includes("https://studio-camila.luvea.app"));
      assert.ok(html.includes("Plano Gold"));

      // Diretrizes Anti-AI Slop: Proibido caracteres avulsos como ✓ ○ ✔ ★ ✦ ↗
      assert.ok(!html.includes("✓"));
      assert.ok(!html.includes("✔"));
      assert.ok(!html.includes("★"));
      assert.ok(!html.includes("✦"));
      assert.ok(!html.includes("↗"));
    });

    it("renderiza ResetPasswordEmail com link seguro e prazo de expiração", async () => {
      const resetLink = "https://luvea.app/redefinir-senha?token=abc12345";
      const html = await render(
        ResetPasswordEmail({
          name: "Camila Valente",
          resetUrl: resetLink,
          expiresInMinutes: 45,
        })
      );

      assert.ok(html.includes("Redefinição de Senha"));
      assert.ok(html.includes("Camila Valente"));
      assert.ok(html.includes("Expira em"));
      assert.ok(html.includes("45"));
      assert.ok(html.includes(resetLink));

      // Anti-AI Slop
      assert.ok(!html.includes("✓"));
      assert.ok(!html.includes("✔"));
    });

    it("renderiza AppointmentConfirmationEmail com valores em reais e garantia de agendamento", async () => {
      const html = await render(
        AppointmentConfirmationEmail({
          clientName: "Isabela Rossi",
          studioName: "Studio Camila Valente",
          serviceName: "Design de Sobrancelhas + Lash Lifting",
          professionalName: "Camila Valente",
          formattedDate: "28/10/2026",
          formattedTime: "16:30",
          totalCents: 22000,
          depositCents: 5000,
          studioAddress: "Rua Oscar Freire, 1200 - Jardins, São Paulo",
        })
      );

      assert.ok(html.includes("Tudo pronto"));
      assert.ok(html.includes("Isabela Rossi"));
      assert.ok(html.includes("Studio Camila Valente"));
      assert.ok(html.includes("Design de Sobrancelhas + Lash Lifting"));
      assert.ok(html.includes("28/10/2026"));
      assert.ok(html.includes("16:30"));
      assert.ok(html.includes("Sinal Pix antecipado"));
      assert.ok(html.includes("R$"));

      // Anti-AI Slop
      assert.ok(!html.includes("✓"));
      assert.ok(!html.includes("✔"));
    });
  });

  describe("3. Rota de API /api/send-email (Disparo Genérico com Zod)", () => {
    it("rejeita requisição com dados ausentes ou inválidos", async () => {
      const { POST } = await import("../../app/api/send-email/route");
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Falta "to" e "subject"
          type: "welcome",
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(json.details);
    });

    it("processa com sucesso o disparo do template WelcomeEmail", async () => {
      const { POST } = await import("../../app/api/send-email/route");
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "camila@estudio.com.br",
          subject: "Boas-vindas ao Luvea Studio",
          type: "welcome",
          name: "Camila",
          subdomain: "camila-estudio",
          businessName: "Camila Estúdio",
          planTier: "gold",
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data?.id);
    });

    it("processa com sucesso o disparo do template AppointmentConfirmationEmail", async () => {
      const { POST } = await import("../../app/api/send-email/route");
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "cliente@gmail.com",
          subject: "Seu agendamento está confirmado",
          type: "appointment_confirmation",
          clientName: "Beatriz",
          studioName: "Studio Luvea",
          serviceName: "Hidratação & Escova",
          formattedDate: "25/10/2026",
          formattedTime: "14:00",
          totalCents: 15000,
          depositCents: 4000,
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
    });
  });

  describe("4. Hook de E-mail do Supabase Auth (/api/auth/email-hook)", () => {
    it("intercepta evento de recuperação de senha (recovery) do Supabase", async () => {
      const { POST } = await import("../../app/api/auth/email-hook/route");
      const req = new Request("http://localhost:3000/api/auth/email-hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            id: "user-123",
            email: "bruno@luvea.app",
            user_metadata: { full_name: "Bruno Fernandes" },
          },
          email_data: {
            email_action_type: "recovery",
            token_hash: "hash_secret_token",
            redirect_to: "https://luvea.app/redefinir-senha",
          },
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.ok, true);
    });

    it("intercepta evento de boas-vindas / signup do Supabase", async () => {
      const { POST } = await import("../../app/api/auth/email-hook/route");
      const req = new Request("http://localhost:3000/api/auth/email-hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            id: "user-456",
            email: "mariana@salao.com.br",
            user_metadata: {
              full_name: "Mariana",
              subdomain: "mariana-salao",
              business_name: "Mariana Salon",
            },
          },
          email_data: {
            email_action_type: "signup",
            token_hash: "signup_hash",
            redirect_to: "https://luvea.app/auth/callback",
          },
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.ok, true);
    });
  });

  describe("5. Verificação de Registros DNS Cloudflare (SPF, DKIM, DMARC)", () => {
    it("retorna os apontamentos de DNS oficiais para luvea.app", async () => {
      const status = await checkLuveaDomainStatus();
      assert.equal(status.domain, "luvea.app");
      assert.ok(Array.isArray(status.records));

      const dkim = status.records.find((r) => r.record === "DKIM");
      assert.ok(dkim, "Deve conter registro DKIM");
      assert.equal(dkim.type, "TXT");

      const spf = status.records.find((r) => r.record === "SPF" && r.type === "TXT");
      assert.ok(spf, "Deve conter registro SPF TXT");
      assert.ok(spf.value.includes("v=spf1"));

      const dmarc = status.records.find((r) => r.record === "DMARC");
      assert.ok(dmarc, "Deve conter registro DMARC");
      assert.ok(dmarc.value.includes("v=DMARC1"));
    });
  });
});
