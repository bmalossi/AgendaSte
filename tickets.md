# Tickets: LUVEA TV Kiosk

Módulo de painel de agenda em tempo real para Smart TVs e monitores de recepção. Spec: `.scratch/tv-kiosk/PRD.md`.

Work the **frontier**: any ticket whose blockers are all done. Tickets 01 and 02 can start immediately in parallel.

## 01 — Domínio puro: módulo tv-kiosk com funções de negócio e testes

**What to build:** Um módulo de funções puras (sem I/O, sem Supabase) contendo toda a lógica de negócio do TV Kiosk, junto com uma suite de testes completa. Ao final deste ticket, é possível importar e testar toda a lógica de mascaragem LGPD, derivação de status, geração de código, filtragem, agrupamento e paginação — tudo executa sem banco de dados.

**Blocked by:** None — can start immediately.

- [x] Função `maskNameLGPD(fullName)` mascara nomes brasileiros: `"Mariana da Silva Oliveira"` → `"Mariana O."`, com skip de preposições (da, de, do, das, dos, e)
- [x] Função `deriveAppointmentStatus(appointment, now)` retorna `in_progress | next | delayed | completed | waiting` baseado em lógica temporal comparando `starts_at`/`ends_at` com `now`
- [x] Função `generatePairingCode()` retorna string de 6 dígitos numéricos
- [x] Função `filterTVAppointments(appointments)` remove registros com status `canceled` e `no_show`, mantém `confirmed`, `completed`, `pending`
- [x] Função `buildTVPollingResponse(rawAppointments, professionals, org, now)` transforma dados brutos do banco no shape `TVPollingResponse` com nomes mascarados, status derivados e agrupamento por profissional
- [x] Função `paginateProfessionals(professionals, maxPerPage)` divide em páginas de até 5 profissionais para rotação na TV
- [x] Tipos TypeScript: `TVAppointmentDTO`, `TVPollingResponse` exportados
- [x] Suite de testes em `node:test` + `node:assert/strict` cobrindo: nomes com preposições, nomes de uma só palavra, edge cases de status (exatamente no starts_at, exatamente no ends_at), filtragem, paginação com 0/1/5/8 profissionais

## 02 — Schema e migração: tabela tv_pairings + ADR + CONTEXT.md

**What to build:** A tabela `tv_pairings` no Supabase com RLS multi-tenant, o ADR documentando as decisões arquiteturais inéditas do módulo, e os novos termos de domínio no glossário. Ao final deste ticket, a infraestrutura de dados está pronta para os API routes.

**Blocked by:** None — can start immediately.

- [x] Migração SQL cria tabela `tv_pairings` com: `id` (UUID PK), `code` (VARCHAR(6) UNIQUE), `organization_id` (FK organizations), `device_name` (VARCHAR(100)), `status` (PENDING/AUTHORIZED/EXPIRED/REVOKED), `token` (UUID), `expires_at` (TIMESTAMPTZ, default now + 10min), `created_at`, `updated_at`
- [x] RLS habilitado com policy de tenant isolation para `authenticated` e policy de INSERT anônimo restrita a `status = 'PENDING' AND organization_id IS NULL`
- [x] Trigger `handle_updated_at()` reutilizado para `tv_pairings`
- [x] ADR `docs/adr/0004-tv-kiosk-device-auth-and-polling.md` documenta: token de device em vez de Supabase Auth, polling em vez de Realtime, exclusão do middleware
- [x] `CONTEXT.md` atualizado com termos: TV Kiosk (Painel de Recepção), Pareamento de TV (TV Pairing), Token de Dispositivo (Device Token)

## 03 — API routes de pareamento: gerar código e autorizar

**What to build:** Os dois endpoints que fazem o fluxo de pareamento funcionar end-to-end. Ao final deste ticket, é possível gerar um código via curl (anônimo), e depois autorizá-lo via curl (autenticado) — o registro em `tv_pairings` transita de PENDING para AUTHORIZED com `organization_id` e `token` preenchidos.

**Blocked by:** 01 — Domínio puro, 02 — Schema e migração.

- [x] `POST /api/tv/pair` — acessível sem autenticação, gera código de 6 dígitos via `generatePairingCode()`, insere em `tv_pairings` com `status: PENDING`, retorna `{ code: "892437" }`
- [x] `POST /api/tv/pair` faz cleanup oportunístico de registros expirados (`status = 'PENDING' AND expires_at < now()` → `status = 'EXPIRED'`)
- [x] `GET /api/tv/pair?code=892437` — retorna status do código para polling da TV durante pareamento (3s). Quando `AUTHORIZED`, retorna `{ status: "AUTHORIZED", token: "uuid" }`
- [x] `POST /api/tv/authorize` — requer autenticação Supabase (cookies), recebe `{ code: "892437" }`, valida que o código existe e está PENDING e não expirado, atualiza para `AUTHORIZED` com `organization_id` do usuário logado
- [x] Validação: código inexistente retorna 404, código expirado retorna 410, código já autorizado retorna 409
- [x] Rate limiting: máx 10 requests/min por IP no endpoint de pair

## 04 — API route de agendamentos: polling com token

**What to build:** O endpoint principal que a TV chama a cada 20 segundos para obter a agenda do dia. Ao final deste ticket, é possível fazer `GET /api/tv/appointments` com header `Authorization: Bearer {token}` e receber o `TVPollingResponse` completo com dados LGPD-safe.

**Blocked by:** 01 — Domínio puro, 02 — Schema e migração.

- [x] `GET /api/tv/appointments` — valida token via `tv_pairings` (`status = 'AUTHORIZED'`), resolve `organization_id`
- [x] Verifica `subscription_status` da organização — se não for `active` ou `trialing`, retorna 403 com `{ error: "subscription_inactive" }`
- [x] Query de agendamentos: filtra por `organization_id`, data de hoje (no timezone da organização via `settings->>'timezone'`), e status `confirmed/completed/pending`
- [x] Usa `buildTVPollingResponse()` para montar o response com nomes mascarados, status derivados, e agrupamento por profissional
- [x] Inclui `serverTime` (ISO 8601) e `timezone` no response
- [x] Token inválido ou revogado retorna 401 com `{ error: "unauthorized" }`

## 05 — API route de dispositivos: listar e revogar

**What to build:** Endpoints para a gestora gerenciar TVs conectadas no painel de configurações. Ao final deste ticket, é possível listar todas as TVs autorizadas da organização e revogar qualquer uma delas.

**Blocked by:** 02 — Schema e migração.

- [x] `GET /api/tv/devices` — requer autenticação, retorna lista de TVs com `id`, `device_name`, `status`, `created_at` para a organização do usuário logado
- [x] `DELETE /api/tv/devices` — requer autenticação, recebe `{ id: "uuid" }`, atualiza `status` para `REVOKED` (não deleta o registro)
- [x] `PATCH /api/tv/devices` — requer autenticação, recebe `{ id: "uuid", device_name: "TV Recepção" }`, atualiza o `device_name`
- [x] Apenas donos e admins da organização podem revogar/renomear TVs

## 06 — Tela de pareamento da TV: UnpairedView

**What to build:** A primeira tela que aparece ao acessar `/tv` numa TV não pareada. Ao final deste ticket, a gestora vê o código na TV, digita no celular, e a TV transita suavemente para o estado "pareado" (mesmo que o LiveBoardView ainda não exista — a transição pode ir para uma tela placeholder).

**Blocked by:** 03 — API routes de pareamento.

- [x] Rota `/tv` com layout standalone: fundo `#09090B`, sem navigation, sem sidebar, meta tag `noindex`
- [x] `/tv` excluída do matcher do middleware Next.js (adição de `tv` à regex de exclusão)
- [x] Componente `UnpairedView`: logo LUVEA em marca d'água, instrução editorial ("Acesse o app LUVEA → Configurações → Conectar TV"), código em 64px monoespaçado com prefixo `LUV-`, QR Code (via `qrcode.react`) apontando para deep-link de pareamento
- [x] `qrcode.react` adicionado ao `package.json`
- [x] Polling a cada 3s no `GET /api/tv/pair?code=X` para detectar autorização
- [x] Ao detectar `AUTHORIZED`, salva `tv_token` no `localStorage` e transita com fade suave para o estado pareado
- [x] Se o código expirar (10min), gera novo código automaticamente sem reload
- [x] Wake Lock API com try/catch + vídeo 1x1px invisível em loop como fallback

## 07 — Painel ao vivo da TV: LiveBoardView

**What to build:** A tela principal que exibe a agenda do dia em tempo real. Ao final deste ticket, a TV pareada exibe a grade completa de agendamentos com atualização automática, legível a 3-5 metros, com todas as proteções de resiliência e acessibilidade.

**Blocked by:** 04 — API route de agendamentos, 06 — Tela de pareamento.

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

## 08 — Seção "LUVEA TV" nas Configurações do painel

**What to build:** A interface no painel da gestora para parear novas TVs, listar TVs conectadas, renomear e revogar acesso. Ao final deste ticket, o fluxo completo funciona end-to-end: a gestora abre Configurações, digita o código da TV, e a TV ativa.

**Blocked by:** 05 — API route de dispositivos.

- [x] Nova seção "LUVEA TV" no componente de configurações, seguindo o design system existente (Editorial Clean)
- [x] Campo de input para digitar código de 6 dígitos com validação
- [x] Ao submeter código válido, chama `POST /api/tv/authorize` e exibe feedback de sucesso
- [x] Lista de TVs conectadas com nome do dispositivo, data de pareamento, e status
- [x] Botão de revogar acesso por TV (pílula secundária do projeto, sem botões vermelhos estridentes — conforme AGENTS.md)
- [x] Campo editável para renomear TV (ex: "Smart TV" → "TV Recepção")
- [x] Deep-link: quando URL contém `?action=pair-tv&code=892437`, abre Configurações e preenche o campo com o código automaticamente
- [x] Copy editorial conciso e sóbrio — zero prolixidade de IA (conforme AGENTS.md)
