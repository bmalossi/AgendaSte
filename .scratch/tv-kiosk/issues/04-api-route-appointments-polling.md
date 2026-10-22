# 04 — API route de agendamentos: polling com token

Status: resolved

## What to build

O endpoint principal que a TV chama a cada 20 segundos para obter a agenda do dia. Ao final deste ticket, é possível fazer `GET /api/tv/appointments` com header `Authorization: Bearer {token}` e receber o `TVPollingResponse` completo com dados LGPD-safe.

## Acceptance criteria

- [x] `GET /api/tv/appointments` — valida token via `tv_pairings` (`status = 'AUTHORIZED'`), resolve `organization_id`
- [x] Verifica `subscription_status` da organização — se não for `active` ou `trialing`, retorna 403 com `{ error: "subscription_inactive" }`
- [x] Query de agendamentos: filtra por `organization_id`, data de hoje (no timezone da organização via `settings->>'timezone'`), e status `confirmed/completed/pending`
- [x] Usa `buildTVPollingResponse()` para montar o response com nomes mascarados, status derivados, e agrupamento por profissional
- [x] Inclui `serverTime` (ISO 8601) e `timezone` no response
- [x] Token inválido ou revogado retorna 401 com `{ error: "unauthorized" }`

## Blocked by

- 01 — Domínio puro: módulo tv-kiosk com funções de negócio e testes
- 02 — Schema e migração: tabela tv_pairings + ADR + CONTEXT.md
