import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HOW_IT_WORKS_MENU,
  BUSINESS_MENU,
  FOOTER_LINKS,
  validateMarketingDestinations,
  resolveDemoWhatsAppUrl,
  getPrimaryCtaUrl,
  getLoginUrl,
  PLANS_CATALOG,
  FAQ_ITEMS,
  FEATURE_COMPARISON_GROUPS,
  EXCLUSIVE_BENEFITS,
} from "../marketing-content.ts";
import robots from "../../app/robots.ts";
import sitemap from "../../app/sitemap.ts";

describe("Ticket 02 — Módulo de Conteúdo do Site Institucional & Navegação", () => {
  it("valida que todo destino de menu, destaque e rodapé aponta para rota ou âncora declarada", () => {
    const errors = validateMarketingDestinations();
    assert.deepEqual(
      errors,
      [],
      `Destinos inválidos encontrados no menu ou rodapé: ${errors.join("; ")}`
    );
  });

  it("garante que o mega menu 'Como funciona' possui as 6 categorias dos módulos do produto", () => {
    const categoryIds = HOW_IT_WORKS_MENU.map((c) => c.id);
    assert.deepEqual(categoryIds, [
      "agentes",
      "agendamento",
      "marketing_crm",
      "pagamentos_pdv",
      "equipe_negocio",
      "prontuario",
    ]);

    for (const cat of HOW_IT_WORKS_MENU) {
      assert.ok(cat.label.length > 0, `Categoria sem rótulo: ${cat.id}`);
      assert.ok(cat.headline.length > 0, `Categoria sem manchete: ${cat.id}`);
      assert.ok(cat.items.length >= 2, `Categoria com poucos itens: ${cat.id}`);
      assert.ok(cat.highlight.title.length > 0, `Destaque sem título: ${cat.id}`);
      assert.ok(cat.highlight.ctaText.length > 0, `Destaque sem CTA: ${cat.id}`);
    }
  });

  it("garante que o mega menu 'Negócios' possui 'Por segmento' e 'Por porte' apontando para #para-quem-e", () => {
    const businessIds = BUSINESS_MENU.map((b) => b.id);
    assert.deepEqual(businessIds, ["segmento", "porte"]);

    for (const cat of BUSINESS_MENU) {
      assert.ok(cat.items.length >= 3, `Categoria de negócios com poucos itens: ${cat.id}`);
      for (const item of cat.items) {
        assert.equal(
          item.href,
          "/#para-quem-e",
          `Item ${item.title} deve apontar para #para-quem-e`
        );
      }
    }
  });

  it("resolve o botão de demonstração para WhatsApp com mensagem quando configurado", () => {
    const url = resolveDemoWhatsAppUrl("5511999998888");
    assert.ok(
      url.startsWith("https://wa.me/5511999998888?text="),
      "Deve gerar link para wa.me com o número formatado"
    );
    assert.ok(
      url.includes(encodeURIComponent("demonstração")),
      "Deve conter a mensagem de demonstração codificada"
    );
  });

  it("faz fallback seguro do botão de demonstração para /app quando a variável não está definida ou está vazia", () => {
    assert.equal(resolveDemoWhatsAppUrl(undefined), "/app");
    assert.equal(resolveDemoWhatsAppUrl(""), "/app");
    assert.equal(resolveDemoWhatsAppUrl("   "), "/app");
    assert.equal(resolveDemoWhatsAppUrl("() -"), "/app");
  });

  it("resolve botões de conversão primária e entrar diretamente para /app", () => {
    assert.equal(getPrimaryCtaUrl(), "/app");
    assert.equal(getLoginUrl(), "/app");
  });

  it("garante links de Termos de Uso e Política de Privacidade no rodapé", () => {
    const legalHrefs = FOOTER_LINKS.legal.map((l) => l.href);
    assert.ok(
      legalHrefs.includes("/termos-de-uso"),
      "Rodapé deve conter link para /termos-de-uso"
    );
    assert.ok(
      legalHrefs.includes("/politica-de-privacidade"),
      "Rodapé deve conter link para /politica-de-privacidade"
    );
  });
});


describe("Ticket 06 — Catálogo de Planos, Descontos e FAQ", () => {
  it("contém exatamente os 3 planos definidos (Essencial, Gold, Platinum) com preços provisórios corretos", () => {
    assert.equal(PLANS_CATALOG.length, 3, "Devem existir exatamente 3 planos");
    const ids = PLANS_CATALOG.map((p) => p.id);
    assert.deepEqual(ids, ["essencial", "gold", "platinum"]);

    const essencial = PLANS_CATALOG.find((p) => p.id === "essencial")!;
    assert.equal(essencial.monthlyPriceReais, 69);
    assert.equal(essencial.annualMonthlyPriceReais, 59);
    assert.equal(essencial.maxStaff, 1);

    const gold = PLANS_CATALOG.find((p) => p.id === "gold")!;
    assert.equal(gold.monthlyPriceReais, 149);
    assert.equal(gold.annualMonthlyPriceReais, 129);
    assert.equal(gold.maxStaff, 9);

    const platinum = PLANS_CATALOG.find((p) => p.id === "platinum")!;
    assert.equal(platinum.monthlyPriceReais, 399);
    assert.equal(platinum.annualMonthlyPriceReais, 349);
    assert.equal(platinum.maxStaff, "ilimitado");
  });

  it("garante que apenas o plano Gold exibe o selo 'Mais popular'", () => {
    const popularPlans = PLANS_CATALOG.filter((p) => p.isPopular);
    assert.equal(
      popularPlans.length,
      1,
      "Apenas um plano deve ser marcado como Mais popular"
    );
    assert.equal(popularPlans[0].id, "gold");
    assert.equal(popularPlans[0].badge, "Mais popular");

    const outros = PLANS_CATALOG.filter((p) => p.id !== "gold");
    for (const p of outros) {
      assert.notEqual(
        p.isPopular,
        true,
        `Plano ${p.id} não deve ter isPopular true`
      );
    }
  });

  it("garante que o preço anual por mês é mais barato que o mensal e condiz com o desconto de ~14%", () => {
    for (const plan of PLANS_CATALOG) {
      assert.ok(
        plan.annualMonthlyPriceReais < plan.monthlyPriceReais,
        `Preço anual de ${plan.name} deve ser menor que o mensal`
      );
      const discountPercent =
        ((plan.monthlyPriceReais - plan.annualMonthlyPriceReais) /
          plan.monthlyPriceReais) *
        100;
      // Desconto de aproximadamente 12% a 16% (meta ~14%)
      assert.ok(
        discountPercent >= 11 && discountPercent <= 16,
        `Desconto de ${plan.name} foi ${discountPercent.toFixed(1)}%, esperado ~14%`
      );
    }
  });

  it("garante FAQ com exatamente 8 perguntas completas em português sem promessas falsas", () => {
    assert.equal(FAQ_ITEMS.length, 8, "Devem existir exatamente 8 itens de FAQ");
    for (const item of FAQ_ITEMS) {
      assert.ok(item.question.endsWith("?"), `Pergunta sem interrogação: ${item.question}`);
      assert.ok(item.answer.length >= 40, `Resposta muito curta: ${item.question}`);
      assert.ok(
        !item.answer.includes("taxa zero permanente"),
        "FAQ não deve fazer promessas falsas de taxa zero"
      );
    }
  });
});


describe("Ticket 07 — Matriz de Comparação de Planos & Benefícios", () => {
  const VALID_MODULES = new Set([
    "reception",
    "scheduling",
    "payments",
    "clients",
    "team",
    "marketing",
  ]);

  const VALID_PLAN_KEYS = ["essencial", "gold", "platinum"] as const;

  it("garante exatamente 6 grupos de recursos com nomes válidos", () => {
    assert.equal(FEATURE_COMPARISON_GROUPS.length, 6);
    const groupIds = FEATURE_COMPARISON_GROUPS.map((g) => g.id);
    assert.deepEqual(groupIds, [
      "ai",
      "scheduling",
      "payments",
      "clients",
      "team",
      "marketing",
    ]);
  });

  it("valida que toda linha da matriz referencia um módulo existente do produto e planos válidos", () => {
    let totalFeatures = 0;
    for (const group of FEATURE_COMPARISON_GROUPS) {
      assert.ok(group.features.length >= 2, `Grupo com poucas features: ${group.name}`);
      for (const feat of group.features) {
        totalFeatures++;
        assert.ok(
          VALID_MODULES.has(feat.module),
          `Módulo desconhecido ou inexistente na feature "${feat.name}": ${feat.module}`
        );

        for (const planKey of VALID_PLAN_KEYS) {
          const val = feat.values[planKey];
          assert.notEqual(
            val,
            undefined,
            `Feature "${feat.name}" está sem valor para o plano ${planKey}`
          );
        }
      }
    }
    assert.ok(totalFeatures >= 15, `Esperado no mínimo 15 features na matriz, encontrado ${totalFeatures}`);
  });

  it("garante que os limites provisórios da matriz batem com o catálogo de planos", () => {
    const teamGroup = FEATURE_COMPARISON_GROUPS.find((g) => g.id === "team")!;
    const staffFeature = teamGroup.features.find((f) =>
      f.name.includes("Profissionais")
    )!;

    assert.equal(staffFeature.values.essencial, "1 profissional");
    assert.equal(staffFeature.values.gold, "Até 9 profissionais");
    assert.equal(staffFeature.values.platinum, "Ilimitado");

    const aiGroup = FEATURE_COMPARISON_GROUPS.find((g) => g.id === "ai")!;
    const aiReceptionFeature = aiGroup.features.find((f) =>
      f.name.includes("Recepção IA")
    )!;
    assert.equal(aiReceptionFeature.values.essencial, "Período de teste");
    assert.equal(aiReceptionFeature.values.gold, "500 conversas/mês");
    assert.equal(aiReceptionFeature.values.platinum, "Ilimitada");

    const marketingGroup = FEATURE_COMPARISON_GROUPS.find((g) => g.id === "marketing")!;
    const creditsFeature = marketingGroup.features.find((f) =>
      f.name.includes("Créditos")
    )!;
    assert.equal(creditsFeature.values.essencial, "0 créditos");
    assert.equal(creditsFeature.values.gold, "500 créditos/mês");
    assert.equal(creditsFeature.values.platinum, "2.500 créditos/mês");
  });

  it("garante 4 benefícios exclusivos com textos claros e focados no mercado brasileiro", () => {
    assert.equal(EXCLUSIVE_BENEFITS.length, 4);
    for (const b of EXCLUSIVE_BENEFITS) {
      assert.ok(b.title.length > 10, `Título curto: ${b.title}`);
      assert.ok(b.description.length > 20, `Descrição curta: ${b.description}`);
    }
  });
});

describe("Ticket 10 — SEO, Robots, Sitemap & Proteção da Rota /app", () => {
  it("robots() bloqueia a rota operacional /app e libera rotas públicas institucionais", () => {
    const robotsConfig = robots();
    assert.ok(robotsConfig.rules, "Robots deve conter regras");

    const rules = Array.isArray(robotsConfig.rules)
      ? robotsConfig.rules
      : [robotsConfig.rules];

    const mainRule = rules.find((r) => r.userAgent === "*" || !r.userAgent);
    assert.ok(mainRule, "Deve existir regra para userAgent *");

    const disallow = Array.isArray(mainRule.disallow)
      ? mainRule.disallow
      : [mainRule.disallow];

    assert.ok(disallow.includes("/app"), "Robots deve proibir indexação de /app");
    assert.ok(
      disallow.includes("/app/*") || disallow.includes("/app"),
      "Robots deve bloquear sub-rotas de /app"
    );

    const allow = Array.isArray(mainRule.allow)
      ? mainRule.allow
      : mainRule.allow
      ? [mainRule.allow]
      : [];

    assert.ok(allow.includes("/"), "Robots deve permitir a rota /");
    assert.ok(allow.includes("/precos"), "Robots deve permitir /precos");
    assert.ok(
      allow.includes("/termos-de-uso"),
      "Robots deve permitir /termos-de-uso"
    );
    assert.ok(
      allow.includes("/politica-de-privacidade"),
      "Robots deve permitir /politica-de-privacidade"
    );

    assert.ok(
      robotsConfig.sitemap?.toString().endsWith("/sitemap.xml"),
      "Robots deve apontar para o sitemap.xml"
    );
  });

  it("sitemap() contém exatamente as 4 rotas públicas do site e não inclui /app", () => {
    const sitemapEntries = sitemap();
    assert.equal(
      sitemapEntries.length,
      4,
      "Sitemap deve listar as 4 rotas públicas"
    );

    const urls = sitemapEntries.map((e) => e.url);

    // Nenhuma URL pode conter /app
    for (const url of urls) {
      assert.ok(
        !url.includes("/app"),
        `Sitemap não pode conter rota operacional do app: ${url}`
      );
    }

    // Deve conter homepage, precos, termos de uso e política de privacidade
    assert.ok(
      urls.some((u) => u.endsWith("/") || u.endsWith(".br")),
      "Sitemap deve conter a URL raiz"
    );
    assert.ok(
      urls.some((u) => u.endsWith("/precos")),
      "Sitemap deve conter /precos"
    );
    assert.ok(
      urls.some((u) => u.endsWith("/termos-de-uso")),
      "Sitemap deve conter /termos-de-uso"
    );
    assert.ok(
      urls.some((u) => u.endsWith("/politica-de-privacidade")),
      "Sitemap deve conter /politica-de-privacidade"
    );

    // Prioridades e frequências válidas
    const rootEntry = sitemapEntries.find(
      (e) => e.url.endsWith("/") || e.url.endsWith(".br")
    )!;
    assert.equal(rootEntry.priority, 1.0, "Homepage deve ter prioridade 1.0");

    const precosEntry = sitemapEntries.find((e) => e.url.endsWith("/precos"))!;
    assert.equal(precosEntry.priority, 0.9, "Preços deve ter prioridade 0.9");
  });
});

