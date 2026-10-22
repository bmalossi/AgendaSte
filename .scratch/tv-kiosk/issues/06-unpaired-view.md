# 06 — Tela de pareamento da TV: UnpairedView

Status: resolved

## What to build

A primeira tela que aparece ao acessar `/tv` numa TV não pareada. Ao final deste ticket, a gestora vê o código na TV, digita no celular, e a TV transita suavemente para o estado "pareado" (mesmo que o LiveBoardView ainda não exista — a transição pode ir para uma tela placeholder).

## Acceptance criteria

- [x] Rota `/tv` com layout standalone: fundo `#09090B`, sem navigation, sem sidebar, meta tag `noindex`
- [x] `/tv` excluída do matcher do middleware Next.js (adição de `tv` à regex de exclusão)
- [x] Componente `UnpairedView`: logo LUVEA em marca d'água, instrução editorial ("Acesse o app LUVEA → Configurações → Conectar TV"), código em 64px monoespaçado com prefixo `LUV-`, QR Code (via `qrcode.react`) apontando para deep-link de pareamento
- [x] `qrcode.react` adicionado ao `package.json`
- [x] Polling a cada 3s no `GET /api/tv/pair?code=X` para detectar autorização
- [x] Ao detectar `AUTHORIZED`, salva `tv_token` no `localStorage` e transita com fade suave para o estado pareado
- [x] Se o código expirar (10min), gera novo código automaticamente sem reload
- [x] Wake Lock API com try/catch + vídeo 1x1px invisível em loop como fallback

## Blocked by

- 03 — API routes de pareamento: gerar código e autorizar
