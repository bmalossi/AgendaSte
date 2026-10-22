# 02 — Schema e migração: tabela tv_pairings + ADR + CONTEXT.md

Status: resolved

## What to build

A tabela `tv_pairings` no Supabase com RLS multi-tenant, o ADR documentando as decisões arquiteturais inéditas do módulo, e os novos termos de domínio no glossário. Ao final deste ticket, a infraestrutura de dados está pronta para os API routes.

## Acceptance criteria

- [x] Migração SQL cria tabela `tv_pairings` com: `id` (UUID PK), `code` (VARCHAR(6) UNIQUE), `organization_id` (FK organizations), `device_name` (VARCHAR(100)), `status` (PENDING/AUTHORIZED/EXPIRED/REVOKED), `token` (UUID), `expires_at` (TIMESTAMPTZ, default now + 10min), `created_at`, `updated_at`
- [x] RLS habilitado com policy de tenant isolation para `authenticated` e policy de INSERT anônimo restrita a `status = 'PENDING' AND organization_id IS NULL`
- [x] Trigger `handle_updated_at()` reutilizado para `tv_pairings`
- [x] ADR `docs/adr/0004-tv-kiosk-device-auth-and-polling.md` documenta: token de device em vez de Supabase Auth, polling em vez de Realtime, exclusão do middleware
- [x] `CONTEXT.md` atualizado com termos: TV Kiosk (Painel de Recepção), Pareamento de TV (TV Pairing), Token de Dispositivo (Device Token)

## Blocked by

None — can start immediately.
