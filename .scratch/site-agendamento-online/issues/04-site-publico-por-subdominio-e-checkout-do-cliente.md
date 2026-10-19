# Ticket 04: Site de Agendamento Online Público por Subdomínio (`/site/[slug]`) com Temas, Filtro de Expediente e Checkout do Cliente

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

Entregar a página pública real do **Site de Agendamento Online** do estúdio para envio aos **Clientes**, acessível pela rota pública compartilhável `/site/[slug]` (representando `<subdominio>.agendaste.com.br`), pelo botão **"Visualizar site"** do assistente e pelo botão **"Meu site de agendamento"** no topo do painel operacional:
1. **Vitrine personalizada com o tema escolhido:** renderiza a página pública aplicando a estética do tema configurado (*Billboard*, *Canvas*, *Classic*, *Energy*, *Organic* ou *Play*), exibindo o nome do negócio, navegação (*Sobre*, *Serviços*, *Contato*, *Agendar agora*), o endereço fixo cadastrado e/ou selo de **Atendimento a domicílio**, a grade de **Horários de Trabalho** e os meios de pagamento aceitos (Pix Dinâmico e Cartão).
2. **Menu de serviços e disponibilidade por expediente:** lista os serviços habilitados para agendamento online com duração e preço em `R$`; ao selecionar uma data, exibe apenas horários dentro da janela `startTime`–`endTime` configurada para aquele dia da semana, ou informa que o estúdio está fechado caso `isOpen` seja `false`.
3. **Checkout do Cliente respeitando aprovação e garantia:** solicita os dados do **Cliente** (nome, WhatsApp e e-mail), aplica a garantia configurada na Fase 2 (**Sinal via Pix Dinâmico** com QR Code / Copia e Cola, **Cartão obrigatório em arquivo** cobrado apenas no checkout ou confirmação direta sem exigência prévia) e grava o **Evento de Agenda** no calendário do **Profissional** com status `confirmed` (quando aprovação automática está ativa) ou `pending` (quando aprovação manual está ativa), mantendo a trava de **Recurso Físico** e **Tempo de Processamento** (ADR 0002).

## Acceptance criteria

- [x] Acessar `/site/[slug]` ou abrir a visualização do site público renderiza a página do estúdio com o tema escolhido (*Billboard*, *Canvas*, *Classic*, *Energy*, *Organic*, *Play*), o endereço/domicílio e os **Horários de Trabalho** configurados.
- [x] O seletor de horários do **Cliente** oferece apenas horários contidos no expediente do dia da semana selecionado e bloqueia datas cujo dia da semana esteja marcado como fechado.
- [x] O checkout do **Site de Agendamento Online** exige **Sinal via Pix Dinâmico**, **Cartão em arquivo** ou nenhum pré-requisito exatamente conforme a opção `onlineBookingGuarantee` configurada pelo **Profissional**.
- [x] Ao confirmar a reserva pública (`bookFromPublicSite`), o agendamento é criado na agenda do **Profissional** com status `confirmed` se `autoApproveAppointments` for `true` ou `pending` se `false`, respeitando a trava de **Recurso Físico** (ADR 0002).
- [x] Tentativas de agendar pelo site público em dias fechados ou fora do horário de funcionamento configurado são rejeitadas pela função de domínio com mensagem clara.
- [x] Testes automatizados de domínio validam o filtro de expediente por dia da semana, o bloqueio em dias fechados, o status de aprovação automática/manual e a modalidade de garantia registrada no agendamento.

## Blocked by

- [Ticket 01: Fase 1 — Criação do Site de Agendamento Online](./01-fase-1-criacao-do-site-e-subdominio.md)
- [Ticket 02: Fase 2 — Configuração de Agendamento e Serviços](./02-fase-2-configuracao-de-agendamento-e-servicos.md)
- [Ticket 03: Fase 3 — Configuração de Pagamentos Aceitos](./03-fase-3-configuracao-de-pagamentos-e-pix.md)
