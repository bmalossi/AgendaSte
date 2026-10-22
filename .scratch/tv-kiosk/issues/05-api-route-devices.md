# 05 — API route de dispositivos: listar e revogar

Status: resolved

## What to build

Endpoints para a gestora gerenciar TVs conectadas no painel de configurações. Ao final deste ticket, é possível listar todas as TVs autorizadas da organização e revogar qualquer uma delas.

## Acceptance criteria

- [x] `GET /api/tv/devices` — requer autenticação, retorna lista de TVs com `id`, `device_name`, `status`, `created_at` para a organização do usuário logado
- [x] `DELETE /api/tv/devices` — requer autenticação, recebe `{ id: "uuid" }`, atualiza `status` para `REVOKED` (não deleta o registro)
- [x] `PATCH /api/tv/devices` — requer autenticação, recebe `{ id: "uuid", device_name: "TV Recepção" }`, atualiza o `device_name`
- [x] Apenas donos e admins da organização podem revogar/renomear TVs

## Blocked by

- 02 — Schema e migração: tabela tv_pairings + ADR + CONTEXT.md
