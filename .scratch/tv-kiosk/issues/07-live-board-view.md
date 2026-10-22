# 07 — Painel ao vivo da TV: LiveBoardView

Status: resolved

## What to build

A tela principal que exibe a agenda do dia em tempo real. Ao final deste ticket, a TV pareada exibe a grade completa de agendamentos com atualização automática, legível a 3-5 metros, com todas as proteções de resiliência e acessibilidade.

## Acceptance criteria

- [x] Header fixo: logo + nome do estúdio (esquerda), relógio HH:MM:SS + data por extenso em pt-BR (centro), badge de status de conexão (direita)
- [x] Relógio sincronizado via `serverTime` do polling, ticking local a cada 1s entre polls
- [x] Grid de colunas por Profissional: cada coluna com nome do profissional no topo, lista de cards de agendamento ordenados por horário
- [x] Card de agendamento: horário em destaque, nome do cliente (LGPD-safe), nome do serviço, badge de status com cores semânticas de alto contraste (emerald/sky/amber/zinc sobre fundo dark)
- [x] Layout adaptativo: 1-5 profissionais = colunas iguais; 6+ = paginação automática em grupos de 5, rotação a cada 20s com fade, indicador "página N/M" no rodapé
- [x] Polling a cada 20s; highlight suave (ring/pulse CSS) no card que mudou
- [x] Estado vazio: "Sem agendamentos hoje" ou "Agenda do dia concluída" centrado, tipografia `text-zinc-500` 24px
- [x] Resiliência de rede: mantém última resposta renderizada, exibe aviso "Sem conexão. Reconectando..." no topo, retry com backoff exponencial
- [x] Se token for revogado (401) ou assinatura inativa (403), volta para `UnpairedView` limpando localStorage
- [x] Proteção burn-in: micro-movimentação de 1px a cada 10 minutos via CSS transform
- [x] Escala tipográfica para distância: profissional 28-32px, cliente/horário 22-26px, serviço/status 16-18px
- [x] Animações CSS puro: `transition-opacity duration-300` para cards, `transition-colors duration-300` para badges
- [x] DOM enxuto com memoização (React.memo / useMemo / useCallback) para evitar re-renders desnecessários

## Blocked by

- 04 — API route de agendamentos: polling com token
- 06 — Tela de pareamento da TV: UnpairedView
