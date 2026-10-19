# Ticket 10: SEO, acessibilidade, responsividade e verificação final

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

Fechar o Site Institucional com a camada transversal de qualidade: título, descrição, Open Graph e URL canônica por página, sitemap e robots, hierarquia de títulos e landmarks, foco visível, contraste conferido, navegação completa por teclado, responsividade verificada em celular, tablet e desktop, e uma varredura de todos os links do cabeçalho, menu, rodapé e botões de conversão. O painel em `/app` não deve ser indexado. Também entrega o **checklist de pré-lançamento** do site: dados legais reais preenchidos, revisão jurídica dos Termos e da Política, número de WhatsApp comercial configurado e preços e limites dos **Planos** confirmados.

## Acceptance criteria

- [x] Cada página do Site Institucional tem título, descrição, Open Graph e URL canônica próprios.
- [x] Existem sitemap e robots, com o painel em `/app` fora da indexação.
- [x] Todos os links do cabeçalho, mega menus, rodapé e botões de conversão levam a destinos existentes (verificação manual registrada e teste de configuração passando).
- [x] Navegação completa por teclado, foco visível e contraste adequado nas 4 páginas.
- [x] Nenhuma rolagem horizontal indevida em celular, tablet e desktop.
- [x] O checklist de pré-lançamento está registrado em local visível do repositório, com status de cada item (`.scratch/site-institucional/CHECKLIST.md`).
- [x] Checagem de tipos, todos os testes e build de produção passam sem erros (46 testes passando, zero erros de tipo).
- [x] Conferência manual no navegador das 4 páginas e dos fluxos de conversão registrada (rotas `/`, `/precos`, `/termos-de-uso`, `/politica-de-privacidade`, `/app`, `/robots.txt` e `/sitemap.xml` retornando HTTP 200 OK; rota inexistente retornando 404).

## Blocked by

- 05 — Homepage — fatos do produto, casos de uso por perfil e "Para quem é"
- 07 — Preços — tabela "Comparar planos" e benefícios
- 09 — Política de Privacidade (LGPD)
