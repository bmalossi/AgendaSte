import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getPendingLegalFields,
  formatLegalValue,
} from "../legal-config.ts";
import type { LegalCompanyConfig } from "../legal-config.ts";

describe("Ticket 08 — Configuração Legal e Bloqueio de Publicação", () => {
  it("detecta campos obrigatórios pendentes quando estão vazios ou com espaços", () => {
    const emptyConfig: Partial<LegalCompanyConfig> = {
      razaoSocial: "",
      cnpj: "   ",
      enderecoCompleto: "",
      cidadeEstadoForo: "São Paulo - SP",
      emailSuporte: "suporte@agendaste.com.br",
      emailEncarregadoDpo: "privacidade@agendaste.com.br",
      dataVigencia: "19 de outubro de 2026",
    };

    const pending = getPendingLegalFields(emptyConfig);
    assert.ok(
      pending.includes("razaoSocial"),
      "Deveria detectar razaoSocial pendente"
    );
    assert.ok(pending.includes("cnpj"), "Deveria detectar cnpj pendente");
    assert.ok(
      pending.includes("enderecoCompleto"),
      "Deveria detectar enderecoCompleto pendente"
    );
    assert.equal(
      pending.includes("cidadeEstadoForo"),
      false,
      "cidadeEstadoForo preenchida não deve estar pendente"
    );
  });

  it("retorna lista vazia de pendências quando todos os campos obrigatórios estão preenchidos", () => {
    const completeConfig: LegalCompanyConfig = {
      razaoSocial: "AgendaSte Tecnologia da Informação Ltda.",
      nomeFantasia: "AgendaSte",
      cnpj: "12.345.678/0001-90",
      enderecoCompleto: "Av. Paulista, 1000, Bela Vista, São Paulo - SP",
      cidadeEstadoForo: "Comarca de São Paulo - SP",
      emailSuporte: "suporte@agendaste.com.br",
      emailEncarregadoDpo: "dpo@agendaste.com.br",
      dataVigencia: "19 de outubro de 2026",
      versaoDocumento: "1.0",
    };

    const pending = getPendingLegalFields(completeConfig);
    assert.deepEqual(
      pending,
      [],
      "Configuração completa não deve ter pendências"
    );
  });

  it("formata valores legais preenchidos ou gera o marcador [a preencher]", () => {
    assert.equal(formatLegalValue("Minha Empresa Ltda"), "Minha Empresa Ltda");
    assert.equal(formatLegalValue(""), "[a preencher]");
    assert.equal(formatLegalValue("   "), "[a preencher]");
    assert.equal(formatLegalValue(null), "[a preencher]");
    assert.equal(formatLegalValue(undefined), "[a preencher]");
    assert.equal(
      formatLegalValue("", "CNPJ a preencher"),
      "[CNPJ a preencher]"
    );
  });
});
