# Ticket 01: Indicador de Confirmação do Próximo Cliente na LUVEA TV (`Aguardando` vs `Confirmado`)

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

Entregar de ponta a ponta a derivação e exibição do status de confirmação do próximo **Cliente (`Client`)** nas colunas de cada **Profissional (`Provider` / `Staff`)** no painel **TV Kiosk (`LUVEA TV`)**.

Ao olhar para a coluna de um **Profissional** na TV (tanto na seção inferior *"PRÓXIMO"* quando o **Profissional** está **Em Atendimento**, quanto no card central *"PRÓXIMO HORÁRIO"* quando o **Profissional** está **Disponível**), o painel exibe um micro-badge editorial indicando se aquele próximo **Cliente** está **`Confirmado`** (quando confirmou via **Recepção IA** no WhatsApp `1_confirmed` ou já consta como `confirmed` na **Agenda**) ou **`Aguardando`** (quando o agendamento ainda está `pending`).

A interface segue rigorosamente o padrão **Editorial Clean & Luxury Salon OS (Anti-AI Slop)**: zero caracteres Unicode ou emojis soltos (`✓`, `○`, `✔`), utilizando exclusivamente um micro-indicador circular (`w-1.5 h-1.5 rounded-full`) acompanhado de texto conciso (`Confirmado` ou `Aguardando`), adaptando-se aos temas Claro e Escuro e preservando o mascaramento de nome LGPD (`PrimeiroNome I.`).

```ts
export type TVClientPresenceStatus = "waiting" | "confirmed" | "arrived";
```

## Acceptance criteria

- [x] A função pura `deriveClientPresenceStatus(appointment)` no módulo de domínio da **TV Kiosk** retorna `"waiting"` para agendamentos pendentes (`status === "pending"`) e `"confirmed"` para agendamentos confirmados (`status === "confirmed"` ou `whatsapp_client_reply === "1_confirmed"`).
- [x] `buildTVPollingResponse` inclui `presenceStatus` em cada `TVAppointmentDTO` retornado para as colunas dos **Profissionais**, mantendo o nome mascarado pela LGPD (`maskNameLGPD`).
- [x] O endpoint de polling da TV e a camada de leitura local preenchem o status de confirmação do próximo **Cliente** a partir dos agendamentos do dia.
- [x] Na **TV Kiosk (`LUVEA TV`)**, quando o **Profissional** está **Em Atendimento** e possui um próximo horário, a seção inferior *"PRÓXIMO"* exibe o micro-badge **`Confirmado`** (ponto circular esmeralda sólido + texto `"Confirmado"`) ou **`Aguardando`** (ponto circular âmbar sólido + texto `"Aguardando"`), sem símbolos Unicode soltos.
- [x] Na **TV Kiosk (`LUVEA TV`)**, quando o **Profissional** está **Disponível** e possui um próximo horário no dia, o card central *"PRÓXIMO HORÁRIO"* exibe o mesmo micro-badge **`Confirmado`** ou **`Aguardando`**.
- [x] Testes automatizados de domínio validam `deriveClientPresenceStatus` e a presença de `presenceStatus` no `buildTVPollingResponse`.

## Blocked by

- None — can start immediately
