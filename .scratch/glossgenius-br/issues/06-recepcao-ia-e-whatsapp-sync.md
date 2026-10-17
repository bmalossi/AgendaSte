# Ticket 06: Recepção IA (`Reception`) em 3 Etapas e Motor WhatsApp QR Code 2-Way Sync

Status: ready-for-agent

## Parent

[PRD.md](../PRD.md)

## What to build

Entregar a seção `02 - Recepção IA` (`02-reception-ia.png`) unindo a apresentação editorial e demo interativa com o pareamento de WhatsApp via QR Code e o motor 2-Way Sync de confirmação automática na **Agenda**.

## Acceptance criteria

- [ ] Barra superior de 3 etapas idêntica a `02-reception-ia.png` (`Conheça a Recepção` | `Configuração rápida` | `Pronta`) com botão superior direito `Precisa de ajuda?`.
- [ ] Etapa 1 (`Conheça a Recepção`) reproduz a pílula de onda sonora (`"Toque para testar a Recepção"`), título serif `"Apresentando a Recepção"`, 3 bullets com ícones de estrela de 4 pontas e barra inferior (`Pular para configuração` e `Testar demo da Recepção`).
- [ ] Etapa 2 (`Configuração rápida`) exibe o QR Code de pareamento do WhatsApp do **Profissional**, regras de horário de atendimento da IA e configuração de lembretes automáticos de 24h e 2h antes do atendimento.
- [ ] Etapa 3 (`Pronta`) exibe o log em tempo real de mensagens enviadas e recebidas (`/api/whatsapp/send`), permitindo simular respostas do cliente (`1 = Confirmar`, `2 = Reagendar`) que atualizam imediatamente o status do agendamento na **Agenda**.

## Blocked by

- [03-agenda-inteligente-e-waitlist.md](./03-agenda-inteligente-e-waitlist.md)
