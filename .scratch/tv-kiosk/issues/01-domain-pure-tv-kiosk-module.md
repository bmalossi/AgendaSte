# 01 — Domínio puro: módulo tv-kiosk com funções de negócio e testes

Status: resolved

## What to build

Um módulo de funções puras (sem I/O, sem Supabase) contendo toda a lógica de negócio do TV Kiosk, junto com uma suite de testes completa. Ao final deste ticket, é possível importar e testar toda a lógica de mascaragem LGPD, derivação de status, geração de código, filtragem, agrupamento e paginação — tudo executa sem banco de dados.

## Acceptance criteria

- [x] Função `maskNameLGPD(fullName)` mascara nomes brasileiros: `"Mariana da Silva Oliveira"` → `"Mariana O."`, com skip de preposições (da, de, do, das, dos, e)
- [x] Função `deriveAppointmentStatus(appointment, now)` retorna `in_progress | next | delayed | completed | waiting` baseado em lógica temporal comparando `starts_at`/`ends_at` com `now`
- [x] Função `generatePairingCode()` retorna string de 6 dígitos numéricos
- [x] Função `filterTVAppointments(appointments)` remove registros com status `canceled` e `no_show`, mantém `confirmed`, `completed`, `pending`
- [x] Função `buildTVPollingResponse(rawAppointments, professionals, org, now)` transforma dados brutos do banco no shape `TVPollingResponse` com nomes mascarados, status derivados e agrupamento por profissional
- [x] Função `paginateProfessionals(professionals, maxPerPage)` divide em páginas de até 5 profissionais para rotação na TV
- [x] Tipos TypeScript: `TVAppointmentDTO`, `TVPollingResponse` exportados
- [x] Suite de testes em `node:test` + `node:assert/strict` cobrindo: nomes com preposições, nomes de uma só palavra, edge cases de status (exatamente no starts_at, exatamente no ends_at), filtragem, paginação com 0/1/5/8 profissionais

## Blocked by

None — can start immediately.
