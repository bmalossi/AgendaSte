# Ticket 03: Homepage — hero

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

A homepage ganha o hero em tela cheia: foto de fundo gerada (ambiente de estúdio de beleza, tons quentes, desfocada, sem texto e sem rostos reconhecíveis), título editorial em Instrument Serif, subtítulo, os botões **Começar teste grátis** e **Agendar demonstração**, uma nota de que o **Teste Grátis** dura 14 dias sem cartão e o celular do produto desenhado em código por cima da foto, mostrando uma tela real da AgendaSte (com o Aura Studio como estúdio de exemplo). Se a foto não carregar ou ainda não existir, o hero cai automaticamente em um gradiente escuro editorial, sem layout quebrado.

## Acceptance criteria

- [x] O hero ocupa a primeira dobra com título, subtítulo e os dois botões de conversão funcionando conforme o ticket 02.
- [x] A foto de fundo gerada é aprovada visualmente pelo responsável; se estiver artificial, o hero usa o fallback em gradiente.
- [x] O celular em código exibe texto em português, valores em R$ e referências a Pix e WhatsApp.
- [x] O texto do hero mantém contraste suficiente sobre a foto e sobre o gradiente de fallback.
- [x] Em celular, tablet e desktop o hero não gera rolagem horizontal e mantém os botões visíveis.
- [x] A imagem tem texto alternativo adequado ou é marcada como decorativa.
- [x] Checagem de tipos e build de produção passam.

## Blocked by

- 02 — Header com mega menu, rodapé e botões de conversão
