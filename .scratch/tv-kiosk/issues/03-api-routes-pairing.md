# 03 — API routes de pareamento: gerar código e autorizar

Status: resolved

## What to build

Os dois endpoints que fazem o fluxo de pareamento funcionar end-to-end. Ao final deste ticket, é possível gerar um código via curl (anônimo), e depois autorizá-lo via curl (autenticado) — o registro em `tv_pairings` transita de PENDING para AUTHORIZED com `organization_id` e `token` preenchidos.

## Acceptance criteria

- [x] `POST /api/tv/pair` — acessível sem autenticação, gera código de 6 dígitos via `generatePairingCode()`, insere em `tv_pairings` com `status: PENDING`, retorna `{ code: "892437" }`
- [x] `POST /api/tv/pair` faz cleanup oportunístico de registros expirados (`status = 'PENDING' AND expires_at < now()` → `status = 'EXPIRED'`)
- [x] `GET /api/tv/pair?code=892437` — retorna status do código para polling da TV durante pareamento (3s). Quando `AUTHORIZED`, retorna `{ status: "AUTHORIZED", token: "uuid" }`
- [x] `POST /api/tv/authorize` — requer autenticação Supabase (cookies), recebe `{ code: "892437" }`, valida que o código existe e está PENDING e não expirado, atualiza para `AUTHORIZED` com `organization_id` do usuário logado
- [x] Validação: código inexistente retorna 404, código expirado retorna 410, código já autorizado retorna 409
- [x] Rate limiting: máx 10 requests/min por IP no endpoint de pair

## Blocked by

- 01 — Domínio puro: módulo tv-kiosk com funções de negócio e testes
- 02 — Schema e migração: tabela tv_pairings + ADR + CONTEXT.md
