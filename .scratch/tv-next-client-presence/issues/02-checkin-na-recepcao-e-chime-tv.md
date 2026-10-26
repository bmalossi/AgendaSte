# Ticket 02: Check-in Rápido "Na recepção" em 1 Toque na Agenda + Badge Pulsante e Chime na LUVEA TV

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

Entregar de ponta a ponta o fluxo de check-in físico do **Cliente (`Client`)** na recepção em 1 clique na **Agenda (`Calendar`)** e sua sinalização visual e sonora na **TV Kiosk (`LUVEA TV`)**.

No drawer lateral de detalhes de um **Evento de Agenda (`Calendar Event`)** ativo, o **Profissional** ou recepcionista conta com um botão rápido de 1 toque (**"Marcar na recepção"** / **"Cliente na recepção"**) que alterna o estado `arrivedAtReception` do agendamento (promovendo automaticamente agendamentos `pending` para `confirmed` quando marcado). O estado é sincronizado imediatamente no armazenamento local (`BroadcastChannel` / `localStorage`) e persistido na nuvem da **Organização / Salão (`Organization`)** dentro do envelope de metadados do agendamento (sem exigir migração SQL destrutiva).

Na **TV Kiosk (`LUVEA TV`)**, quando o próximo **Cliente** de um **Profissional** está com `arrivedAtReception` ativo, `deriveClientPresenceStatus` resolve `"arrived"` com precedência máxima, exibindo o micro-badge **`Na recepção`** com ponto esmeralda pulsante (`animate-pulse motion-reduce:animate-none`) tanto na seção *"PRÓXIMO"* quanto no card *"PRÓXIMO HORÁRIO"*. Além disso, no momento em que o próximo **Cliente** de qualquer **Profissional** visível transita para `"arrived"` (após a carga inicial da página), a TV toca o chime acústico suave (`playLuxuryChime`) se o áudio da TV estiver habilitado.

## Acceptance criteria

- [x] A função de transição `toggleAppointmentReceptionArrival(state, eventId, arrived?)` no módulo de estado do estúdio alterna `arrivedAtReception` no **Evento de Agenda**, promove `status` de `"pending"` para `"confirmed"` ao marcar chegada na recepção, e atualiza `lastToastMessage`.
- [x] O drawer de detalhes do agendamento na **Agenda (`Calendar`)** (para agendamentos não concluídos) exibe o botão de 1 toque para marcar/desmarcar **"Cliente na recepção"** seguindo o padrão de pílula editorial do projeto (zero ícones gigantes ou caixas berrantes).
- [x] A camada de sincronização em nuvem grava e restaura `arrivedAtReception` no envelope `__LUVEA_META__` de `notes`, e o endpoint de polling da TV repassa `arrived_at_reception` para `buildTVPollingResponse`.
- [x] `deriveClientPresenceStatus` prioriza `arrived_at_reception === true` retornando `"arrived"` acima de `"waiting"` e `"confirmed"`.
- [x] Na **TV Kiosk (`LUVEA TV`)**, o estado `"arrived"` renderiza o micro-badge **`Na recepção`** com ponto circular esmeralda pulsante (`ring-2 ring-emerald-500/25 animate-pulse motion-reduce:animate-none`) tanto no rodapé *"PRÓXIMO"* (**Em Atendimento**) quanto no card *"PRÓXIMO HORÁRIO"* (**Disponível**).
- [x] Quando um próximo agendamento transita para `presenceStatus === "arrived"` após o carregamento inicial da TV, `playLuxuryChime()` é executado (respeitando a preferência de som `luvea_tv_chime_v1`), sem repetir o som a cada ciclo de polling de 20s para o mesmo agendamento.
- [x] Testes automatizados cobrem `toggleAppointmentReceptionArrival` no estado do estúdio e a precedência de `"arrived"` em `deriveClientPresenceStatus` / `buildTVPollingResponse`.

## Blocked by

- [Ticket 01: Indicador de Confirmação do Próximo Cliente na LUVEA TV (`Aguardando` vs `Confirmado`)](./01-indicador-confirmacao-proximo-cliente-tv.md)
