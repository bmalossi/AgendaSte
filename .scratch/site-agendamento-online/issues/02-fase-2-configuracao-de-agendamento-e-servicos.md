# Ticket 02: Fase 2 — Configuração de Agendamento e Serviços (Endereço/Domicílio, Horários de Trabalho, Experiência Online e Sugestões de IA)

Status: resolved

## Parent

[PRD.md](../PRD.md)

## What to build

A partir do botão **"Configurar serviços e agendamento"** na tela de celebração da Fase 1 ou ao clicar no Cartão 2 (**"Adicione seus serviços"**) em Primeiros Passos, conduzir o **Profissional** pelas 4 etapas da Fase 2 (*Set up booking*):
1. **Onde você realiza seus atendimentos:** chaves seletoras (*toggles*) para **Tenho um endereço fixo** (exibindo os campos Endereço Linha 1 obrigatório, Linha 2 opcional, Cidade obrigatória, CEP obrigatório e Estado obrigatório) e **Atendo a domicílio**, com opção **Pular esta etapa** e **Avançar**.
2. **Horários de Trabalho do negócio:** grade dos 7 dias da semana (segunda a domingo) permitindo ativar/desativar cada dia e selecionar horário de início e horário de término (ex.: `08:00` às `17:00`).
3. **Experiência de agendamento online dos Clientes:** configuração de aprovação automática (**Sempre aprovar automaticamente** vs. **Aprovação manual**) e exigência de garantia para agendar online (**Sinal via Pix Dinâmico Anti-No-Show**, **Cartão obrigatório para todos os Clientes** cobrado apenas no checkout ou **Sem exigência prévia**).
4. **Quase lá, adicione seus serviços:** seção de **Serviços sugeridos por IA para você** com botão **Regenerar** e adição em 1 clique ao catálogo, listagem de **Serviços adicionados** com selo *Adicionado* e opção **"ou Criar meus próprios serviços"** que direciona à tela completa de catálogo, marcando o Cartão 2 (`add_services`) como **Tudo pronto!** (*All set!*).

## Acceptance criteria

- [x] A Etapa 5 permite ativar/desativar **Tenho um endereço fixo** (validando Linha 1, Cidade, CEP e Estado quando ativo, com Linha 2 opcional) e **Atendo a domicílio**, além de permitir pular a etapa.
- [x] A Etapa 6 exibe os 7 dias da semana com seletores de horário de início e fim e chave de dia aberto/fechado, salvando a grade de **Horários de Trabalho** no estado do estúdio.
- [x] A Etapa 7 permite configurar se agendamentos online são aprovados automaticamente e qual garantia é exigida do **Cliente** (Sinal via Pix Dinâmico, Cartão em arquivo para todos os Clientes ou sem exigência).
- [x] A Etapa 8 permite adicionar serviços sugeridos por IA em 1 clique, regenerar sugestões, visualizar a lista de serviços já adicionados com o indicador *Adicionado* e navegar para o catálogo completo em *"Criar meus próprios serviços"*.
- [x] Concluir a Fase 2 marca o passo `add_services` como concluído e exibe **Tudo pronto!** no Cartão 2 de Primeiros Passos.
- [x] Testes automatizados de domínio cobrem a persistência de endereço/domicílio, horários da semana, regras de aprovação/garantia e adição de serviços no fluxo.

## Blocked by

- [Ticket 01: Fase 1 — Criação do Site de Agendamento Online](./01-fase-1-criacao-do-site-e-subdominio.md)
