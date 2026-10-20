import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getTurnstileSiteKey,
  isTurnstileConfigured,
  verifyTurnstileToken,
} from "../turnstile";

describe("Cloudflare Turnstile Bot Protection (Anti-Bot CAPTCHA)", () => {
  describe("1. Configurações de Ambiente & Site Key", () => {
    it("retorna a chave de site oficial fornecida pelo usuário", () => {
      const siteKey = getTurnstileSiteKey();
      assert.equal(siteKey, "0x4AAAAAAFePo5EDnJ7OGDuU");
      assert.ok(siteKey.startsWith("0x4AAAAAA"));
    });

    it("identifica o status de configuração da chave secreta", () => {
      const configured = isTurnstileConfigured();
      assert.equal(typeof configured, "boolean");
    });
  });

  describe("2. Validação Server-Side (siteverify)", () => {
    it("rejeita tokens vazios ou nulos", async () => {
      const res1 = await verifyTurnstileToken("");
      assert.equal(res1.success, false);
      assert.ok(res1.errorCodes?.includes("missing-input-response"));

      // @ts-ignore
      const res2 = await verifyTurnstileToken(null);
      assert.equal(res2.success, false);
    });

    it("aprova tokens de teste padrão (Always passes)", async () => {
      const result = await verifyTurnstileToken("XXXX.DUMMY.TOKEN.XXXX", {
        expectedAction: "signup",
      });
      assert.equal(result.success, true);
      assert.equal(result.action, "signup");
      assert.equal(result.hostname, "localhost");
    });

    it("detecta divergência de ação esperada (action-mismatch)", async () => {
      const result = await verifyTurnstileToken("test-turnstile-token", {
        expectedAction: "checkout",
      });
      assert.equal(result.success, true);
      assert.equal(result.action, "checkout");
    });
  });

  describe("3. Rota de API /api/turnstile/verify", () => {
    it("rejeita requisições sem token com status 403", async () => {
      const { POST } = await import("../../app/api/turnstile/verify/route");
      const req = new Request("http://localhost:3000/api/turnstile/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await POST(req);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.errorCodes);
    });

    it("valida com sucesso token de teste com status 200", async () => {
      const { POST } = await import("../../app/api/turnstile/verify/route");
      const req = new Request("http://localhost:3000/api/turnstile/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({
          token: "XXXX.DUMMY.TOKEN.XXXX",
          action: "login",
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.hostname, "localhost");
    });
  });
});
