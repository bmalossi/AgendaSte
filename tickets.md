# Tickets: Status de Presença e Confirmação do Próximo Cliente na LUVEA TV Kiosk

Indicador de presença e confirmação em 3 estados (`Aguardando`, `Confirmado`, `Na recepção`) para o próximo **Cliente** nas colunas da **LUVEA TV**, com check-in rápido de 1 toque na **Agenda** e sinalização acústica opcional. Spec: `.scratch/tv-next-client-presence/PRD.md`.

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.

## 01 — Indicador de Confirmação do Próximo Cliente na LUVEA TV (`Aguardando` vs `Confirmado`)

**What to build:** Entregar de ponta a ponta a derivação e exibição do status de confirmação do próximo **Cliente (`Client`)** nas colunas de cada **Profissional (`Provider` / `Staff`)** no painel **TV Kiosk (`LUVEA TV`)**. Ao olhar para a coluna de um **Profissional** na TV (tanto na seção inferior *"PRÓXIMO"* quando está **Em Atendimento**, quanto no card central *"PRÓXIMO HORÁRIO"* quando está **Disponível**), o painel exibe um micro-badge editorial Anti-AI Slop indicando se o próximo **Cliente** está **`Confirmado`** (via WhatsApp `1_confirmed` ou confirmação na Agenda) ou **`Aguardando`** (pendente).

**Blocked by:** None — can start immediately.

- [x] A função pura `deriveClientPresenceStatus(appointment)` no módulo de domínio da **TV Kiosk** retorna `"waiting"` para agendamentos pendentes (`status === "pending"`) e `"confirmed"` para agendamentos confirmados (`status === "confirmed"` ou `whatsapp_client_reply === "1_confirmed"`)
- [x] `buildTVPollingResponse` inclui `presenceStatus` em cada `TVAppointmentDTO` retornado para as colunas dos **Profissionais**, mantendo o nome mascarado pela LGPD (`maskNameLGPD`)
- [x] O endpoint de polling da TV e a camada de leitura local preenchem o status de confirmação do próximo **Cliente** a partir dos agendamentos do dia
- [x] Na **TV Kiosk (`LUVEA TV`)**, quando o **Profissional** está **Em Atendimento** e possui um próximo horário, a seção inferior *"PRÓXIMO"* exibe o micro-badge **`Confirmado`** (ponto circular esmeralda sólido + texto `"Confirmado"`) ou **`Aguardando`** (ponto circular âmbar sólido + texto `"Aguardando"`), sem símbolos Unicode soltos
- [x] Na **TV Kiosk (`LUVEA TV`)**, quando o **Profissional** está **Disponível** e possui um próximo horário no dia, o card central *"PRÓXIMO HORÁRIO"* exibe o mesmo micro-badge **`Confirmado`** ou **`Aguardando`**
- [x] Testes automatizados de domínio validam `deriveClientPresenceStatus` e a presença de `presenceStatus` no `buildTVPollingResponse`

## 02 — Check-in Rápido "Na recepção" em 1 Toque na Agenda + Badge Pulsante e Chime na LUVEA TV

**What to build:** Entregar de ponta a ponta o fluxo de check-in físico do **Cliente (`Client`)** na recepção em 1 clique na **Agenda (`Calendar`)** e sua sinalização visual e sonora na **TV Kiosk (`LUVEA TV`)**. No drawer lateral de detalhes de um **Evento de Agenda (`Calendar Event`)** ativo, o **Profissional** ou recepcionista conta com um botão rápido de 1 toque (**"Marcar na recepção"** / **"Cliente na recepção"**) que alterna o estado `arrivedAtReception` do agendamento, sincroniza localmente (`BroadcastChannel` / `localStorage`) e na nuvem via `__LUVEA_META__`, exibe o micro-badge **`Na recepção`** com ponto esmeralda pulsante (`motion-reduce:animate-none`) na **LUVEA TV** e dispara o chime acústico suave (`playLuxuryChime`) quando o próximo **Cliente** chega na recepção.

**Blocked by:** 01 — Indicador de Confirmação do Próximo Cliente na LUVEA TV (`Aguardando` vs `Confirmado`).

- [x] A função de transição `toggleAppointmentReceptionArrival(state, eventId, arrived?)` no módulo de estado do estúdio alterna `arrivedAtReception` no **Evento de Agenda**, promove `status` de `"pending"` para `"confirmed"` ao marcar chegada na recepção, e atualiza `lastToastMessage`
- [x] O drawer de detalhes do agendamento na **Agenda (`Calendar`)** (para agendamentos não concluídos) exibe o botão de 1 toque para marcar/desmarcar **"Cliente na recepção"** seguindo o padrão de pílula editorial do projeto
- [x] A camada de sincronização em nuvem grava e restaura `arrivedAtReception` no envelope `__LUVEA_META__` de `notes`, e o endpoint de polling da TV repassa `arrived_at_reception` para `buildTVPollingResponse`
- [x] `deriveClientPresenceStatus` prioriza `arrived_at_reception === true` retornando `"arrived"` acima de `"waiting"` e `"confirmed"`
- [x] Na **TV Kiosk (`LUVEA TV`)**, o estado `"arrived"` renderiza o micro-badge **`Na recepção`** com ponto circular esmeralda pulsante (`ring-2 ring-emerald-500/25 animate-pulse motion-reduce:animate-none`) tanto no rodapé *"PRÓXIMO"* (**Em Atendimento**) quanto no card *"PRÓXIMO HORÁRIO"* (**Disponível**)
- [x] Quando um próximo agendamento transita para `presenceStatus === "arrived"` após o carregamento inicial da TV, `playLuxuryChime()` é executado (respeitando a preferência de som `luvea_tv_chime_v1`), sem repetir o som a cada ciclo de polling de 20s para o mesmo agendamento
- [x] Testes automatizados cobrem `toggleAppointmentReceptionArrival` no estado do estúdio e a precedência de `"arrived"` em `deriveClientPresenceStatus` / `buildTVPollingResponse`
