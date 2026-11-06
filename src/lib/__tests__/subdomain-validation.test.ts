import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSubdomain,
  validateSubdomainFormat,
  RESERVED_SUBDOMAINS,
} from "../subdomain.ts";

describe("Subdomínio - Normalização, Validação e Governança", () => {
  it("normaliza nomes com acentos, espaços e caracteres especiais para slug limpo", () => {
    assert.equal(normalizeSubdomain("Espaço Bruno Valente"), "espaco-bruno-valente");
    assert.equal(normalizeSubdomain("Clínica Estética & Spa"), "clinica-estetica-spa");
    assert.equal(normalizeSubdomain("---estudio-teste---"), "estudio-teste");
    assert.equal(normalizeSubdomain("B.Malossi"), "b-malossi");
  });

  it("rejeita subdomínios com menos de 3 caracteres", () => {
    const res = validateSubdomainFormat("ab");
    assert.equal(res.valid, false);
    assert.equal(res.reason, "too_short");
  });

  it("rejeita subdomínios com mais de 30 caracteres", () => {
    const res = validateSubdomainFormat("estudio-com-nome-extremamente-longo-que-ultrapassa-trinta-chars");
    assert.equal(res.valid, false);
    assert.equal(res.reason, "too_long");
  });

  it("rejeita subdomínios reservados pela plataforma Luvea", () => {
    for (const reserved of ["admin", "api", "app", "billing", "checkout", "login", "tv", "www", "luvea"]) {
      const res = validateSubdomainFormat(reserved);
      assert.equal(res.valid, false);
      assert.equal(res.reason, "reserved");
    }
  });

  it("aceita subdomínios válidos personalizados de profissionais e clínicas", () => {
    const validNames = ["bmalossi", "espaco-bruno", "clinica-valente", "studio-95d7eb2e", "salao-chic"];
    for (const name of validNames) {
      const res = validateSubdomainFormat(name);
      assert.equal(res.valid, true);
      assert.equal(res.normalized, name);
    }
  });
});
