# 08 — Seção "LUVEA TV" nas Configurações do painel

Status: resolved

## What to build

A interface no painel da gestora para parear novas TVs, listar TVs conectadas, renomear e revogar acesso. Ao final deste ticket, o fluxo completo funciona end-to-end: a gestora abre Configurações, digita o código da TV, e a TV ativa.

## Acceptance criteria

- [x] Nova seção "LUVEA TV" no componente de configurações, seguindo o design system existente (Editorial Clean)
- [x] Campo de input para digitar código de 6 dígitos com validação
- [x] Ao submeter código válido, chama `POST /api/tv/authorize` e exibe feedback de sucesso
- [x] Lista de TVs conectadas com nome do dispositivo, data de pareamento, e status
- [x] Botão de revogar acesso por TV (pílula secundária do projeto, sem botões vermelhos estridentes — conforme AGENTS.md)
- [x] Campo editável para renomear TV (ex: "Smart TV" → "TV Recepção")
- [x] Deep-link: quando URL contém `?action=pair-tv&code=892437`, abre Configurações e preenche o campo com o código automaticamente
- [x] Copy editorial conciso e sóbrio — zero prolixidade de IA (conforme AGENTS.md)

## Blocked by

- 05 — API route de dispositivos: listar e revogar
