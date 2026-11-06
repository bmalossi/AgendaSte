import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseStudioProfile } from "../billing/local-studio-profile.ts";

describe("Checkout reconhece o estúdio logado via cache local do painel", () => {
  it("extrai nome, e-mail, telefone, documento, estúdio e subdomínio do estado do painel", () => {
    const profile = parseStudioProfile({
      settings: {
        personal: {
          firstName: "Bruno",
          lastName: "Fernandes",
          email: "bruno@estudio.com.br",
          phone: "(11) 98765-4321",
        },
        business: { businessName: "Espaço Bruno", taxIdCnpjCpf: "123.456.789-09" },
        website: { subdomainSlug: "Espaco-Bruno" },
      },
    });

    assert.ok(profile);
    assert.equal(profile.fullName, "Bruno Fernandes");
    assert.equal(profile.email, "bruno@estudio.com.br");
    assert.equal(profile.phone, "(11) 98765-4321");
    assert.equal(profile.cpfCnpj, "123.456.789-09");
    assert.equal(profile.businessName, "Espaço Bruno");
    assert.equal(profile.subdomain, "espaco-bruno");
  });

  it("deriva o subdomínio do nome do estúdio quando não há slug publicado", () => {
    const profile = parseStudioProfile({
      settings: {
        personal: { firstName: "Ana", lastName: "", email: "", phone: "" },
        business: { businessName: "Ateliê Ana", taxIdCnpjCpf: "" },
        website: {},
      },
    });

    assert.ok(profile);
    assert.equal(profile.subdomain, "atelie-ana");
  });

  it("retorna null para estados vazios ou inválidos", () => {
    assert.equal(parseStudioProfile(null), null);
    assert.equal(parseStudioProfile({}), null);
    assert.equal(parseStudioProfile({ settings: { personal: {}, business: {}, website: {} } }), null);
  });
});
