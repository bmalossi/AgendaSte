# Ticket 01: Fundação Editorial AgendaSte, Navegação Multinível, Primeiros Passos (`0/3 Get Started`) e Site de Agendamento Online (`Aura Studio`)

Status: ready-for-agent

## Parent

[PRD.md](../PRD.md)

## What to build

Substituir a casca visual anterior pelo Design System Editorial do AgendaSte (títulos em serif editorial, sans-serif geométrica, superfícies brancas/lilás, botões pílula `#1C1C1E`, switches roxos/rosa e toasts escuros flutuantes), entregando a barra lateral retrátil com submenus expansíveis idêntica a `01-get-started.png`, a tela `0/3 Primeiros Passos` com progresso dinâmico (`0/3` a `3/3`), modal de `"Importar meus dados"`, card de avaliação Gold (`14 dias restantes`), motor central de estado do domínio (`Domain Store`) e o **Site de Agendamento Online (`Aura Studio`)** interativo onde o **Cliente** escolhe um serviço, seleciona horário e paga o **Sinal / Taxa de Reserva** via Pix Dinâmico.

## Acceptance criteria

- [ ] `DESIGN.md` e `PRODUCT.md` atualizados refletindo fielmente a estética editorial, tipografia, cores e componentes pílula do AgendaSte.
- [ ] Barra lateral esquerda retrátil com perfil do **Profissional**, contador `X/3 Primeiros Passos`, grupo `Colegas de IA` (`Recepção`), grupo `Negócio` (`Agenda`, `Pagamentos` expansível, `Clientes`, `Catálogo` expansível, `Equipe` expansível, `Marketing`, `Relatórios` expansível, `Estoque`, `Prontuários`) e rodapé (`Indique e ganhe R$ 150`, `Configurações`, `Ajuda`).
- [ ] Tela `0/3 Primeiros Passos` idêntica a `01-get-started.png` e `01-1-get-started.png` com os 3 cartões ilustrados (`Seja encontrado e agendado online`, `Adicione seus serviços`, `Comece a receber pagamentos`), card `"Importe seus dados gratuitamente"`, card `"Seu teste gratuito — 14 dias restantes [Gold]"` e card de preview `"AURA STUDIO"`.
- [ ] **Site de Agendamento Online (`Aura Studio`)** acessível pelo botão `"Meu site de agendamento ↗"` no topo direito, permitindo ao **Cliente** escolher serviço, data/hora e gerar cobrança de **Sinal** via Pix (`/api/pix/create`), confirmando o agendamento no estado global.

## Blocked by

- None — can start immediately
