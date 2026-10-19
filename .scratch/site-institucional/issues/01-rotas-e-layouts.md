# Ticket 01: Rotas e layouts separados para o Site Institucional e o painel

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

Separar a aplicação em duas áreas com layouts próprios, conforme o ADR 0003: o **Site Institucional** passa a ocupar a raiz do domínio e o painel operacional (`AgendaSteApp`) passa a abrir em `/app`, com a mesma sidebar, estado e funcionalidades de hoje. A raiz exibe temporariamente uma página institucional mínima (título e botões que levam a `/app`), para que a estrutura seja demonstrável antes do conteúdo real. Esta é a refatoração preparatória: tudo que o painel já faz deve continuar funcionando, só mudando de endereço.

## Acceptance criteria

- [x] Abrir o endereço raiz mostra uma página institucional mínima, sem a sidebar do painel.
- [x] Abrir `/app` mostra o painel completo, com o mesmo comportamento anterior (navegação, Venda Rápida, Agenda abrindo no dia corrente).
- [x] Links internos, redirecionamentos e a configuração de PWA/manifest que apontavam para a raiz passam a apontar para `/app`.
- [x] O painel e o Site Institucional têm layouts independentes (um não herda cabeçalho ou rodapé do outro).
- [x] A página 404 continua funcionando nas duas áreas.
- [x] Checagem de tipos, testes existentes e build de produção passam sem regressão.

## Blocked by

- None — can start immediately
