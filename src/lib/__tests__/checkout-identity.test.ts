import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveCheckoutIdentity } from "../billing/checkout-identity.ts";

const submitted = {
  slug: "studio-95d7eb2e",
  businessName: "Meu Estúdio",
  cpfCnpj: "",
  whatsapp: "",
};

describe("Checkout - identidade autoritativa do estúdio", () => {
  it("usuário logado com estúdio: nome e slug do banco prevalecem sobre o corpo da requisição", () => {
    const result = resolveCheckoutIdentity(submitted, {
      slug: "espacounikko",
      name: "Espaço Unikko",
      cpf_cnpj: "38802169837",
      whatsapp_number: "11944477528",
    });
    assert.equal(result.slug, "espacounikko");
    assert.equal(result.businessName, "Espaço Unikko");
    assert.equal(result.cpfCnpj, "38802169837");
    assert.equal(result.whatsapp, "11944477528");
  });

  it("CPF e WhatsApp do corpo só entram quando a organização ainda não os possui", () => {
    const result = resolveCheckoutIdentity(
      { ...submitted, cpfCnpj: "11122233344", whatsapp: "11999990000" },
      { slug: "espacounikko", name: "Espaço Unikko", cpf_cnpj: null, whatsapp_number: null, phone: null }
    );
    assert.equal(result.slug, "espacounikko");
    assert.equal(result.cpfCnpj, "11122233344");
    assert.equal(result.whatsapp, "11999990000");
  });

  it("usa phone como fallback de WhatsApp da organização", () => {
    const result = resolveCheckoutIdentity(submitted, {
      slug: "a",
      name: "A",
      phone: "11911112222",
    });
    assert.equal(result.whatsapp, "11911112222");
  });

  it("sem organização própria (cadastro novo) mantém os dados informados", () => {
    assert.deepEqual(resolveCheckoutIdentity(submitted, null), submitted);
  });
});
