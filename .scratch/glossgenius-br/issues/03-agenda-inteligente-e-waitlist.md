# Ticket 03: Agenda Inteligente (`Calendar`) com Salto de Semanas (`+2` a `+8`), 4 Tipos de Evento, Trava de Recursos, Lista de Espera e Checkout em 1 Toque

Status: ready-for-agent

## Parent

[PRD.md](../PRD.md)

## What to build

Entregar a experiência completa da seção `03 - Agenda` (`03-1` a `03-4`): grade horária em modo `Dia` e `Semana` com linha e pílula magenta do horário atual, seletor de datas com popover de calendário e salto rápido `"Pular por semana"` (`+2` a `+8` semanas), filtro por **Profissional**, drawer lateral de **Lista de Espera (`Waitlist`)** (`03-3`), seleção de horário vazio com borda magenta (`03-4`) abrindo o drawer `Novo agendamento` com os 4 tipos de **Evento de Agenda** (`Agendamento`, `Bloqueio Pessoal`, `Horário de Trabalho`, `Entrada na Lista de Espera`), criação inline de cliente e serviço, validação de conflito de **Recurso Físico** e cálculo de **Tempo de Processamento**/**Tempo de Bloqueio**, além do drawer de Detalhes & Checkout em 1 Toque ao clicar em um agendamento existente.

## Acceptance criteria

- [ ] Topo da **Agenda** (`03-1`) exibe mês atual, botão de calendário, seletor de data com popover contendo mini-calendário e botões `"Pular por semana"` (`+2` a `+8`), alternador `Dia / Semana`, filtro de **Profissional**, botão `Lista de espera`, botão `Venda rápida` e botão pílula preto `Adicionar`.
- [ ] Grade exibe a linha horizontal e pílula magenta do horário atual, blocos de agendamento coloridos pela categoria do serviço (mostrando janelas de **Tempo de Processamento** e **Tempo de Bloqueio** quando aplicável) e destaca com borda superior magenta o slot vazio clicado (`03-4`).
- [ ] Drawer `Novo agendamento` (`03-4` a `03-4-event-type`) suporta os 4 tipos de **Evento de Agenda**, busca/criação inline `+ Adicionar Novo Cliente`, busca/criação inline `+ Adicionar novo serviço`, switches `Tornar este evento recorrente` e `Cobrar Sinal`, e bloqueia ou alerta conflito se o **Recurso Físico** (`Sala`/`Equipamento`) exigido já estiver ocupado no horário.
- [ ] Drawer `Lista de espera` (`03-3`) permite filtrar por **Profissional**, adicionar entradas e converter uma espera em agendamento confirmado em 1 clique.
- [ ] Clicar em um agendamento existente na grade abre o Drawer de Detalhes & Checkout em 1 Toque (Confirmar presença, Cobrar Pix/Cartão, Reagendar retorno `+15d/+30d/+45d`, Disparar lembrete WhatsApp).

## Blocked by

- [01-fundacao-editorial-e-primeiros-passos.md](./01-fundacao-editorial-e-primeiros-passos.md)
- [02-catalogo-completo-e-recursos.md](./02-catalogo-completo-e-recursos.md)
