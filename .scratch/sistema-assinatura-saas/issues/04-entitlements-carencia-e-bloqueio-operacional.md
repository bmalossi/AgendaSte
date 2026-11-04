# Ticket 04: Motor de Entitlements, Período de Carência (3 dias) e Bloqueio Operacional (Soft-Lock) no Painel e no Site de Agendamento Online

Status: completed

## Parent

[PRD.md](../PRD.md)

## What to build

Conectar de ponta a ponta o motor de avaliação de permissões do **Ciclo de Plano** a todas as ações operacionais do painel `/app`, à store do estúdio e ao **Site de Agendamento Online** público (`[slug].luvea.app`). Durante os 3 dias de **Período de Carência (`Grace Period`)**, o estúdio opera normalmente com um aviso discreto de regularização. Quando em **Bloqueio Operacional (`Operational Soft-Lock`)**, novas reservas no painel e no **Site de Agendamento Online**, disparos da **Recepção IA** e novas **Campanhas de Marketing** são suspensos, mas o estúdio mantém acesso para exportar relatórios e **Fichas de Atendimento** (LGPD), regularizar o **Plano** e concluir na Agenda os agendamentos que já estavam confirmados antes do bloqueio (protegendo a **Cliente** final que já pagou o **Sinal** via Pix), além de respeitar os limites de **Profissionais** e recursos de cada **Plano** (`Essencial`, `Gold`, `Platinum`).

## Acceptance criteria

- [x] A função de avaliação de permissões (`evaluateOrganizationEntitlements`) deriva `full_access`, `grace_period_warning` (3 dias em `past_due`) ou `operational_soft_lock` e calcula os limites exatos do **Plano** vigente (`maxStaff`, `canUseAiReception`, `canUsePhysicalResources`, `canUsePayroll`, `marketingCredits`)
- [x] Quando em `grace_period_warning`, o topo do painel `/app` exibe um banner editorial discreto informando os dias restantes do **Período de Carência** com link direto para regularização, sem bloquear nenhuma operação
- [x] Quando em **Bloqueio Operacional** (`operational_soft_lock`), o painel exibe banner de restrição e bloqueia a criação de novos agendamentos, o disparo de **Campanhas de Marketing** e a **Recepção IA**, mas permite dar baixa/concluir agendamentos já confirmados anteriormente (`status === "confirmed"`) e exportar relatórios CSV e dados de **Clientes** / **Fichas de Atendimento** (conformidade LGPD)
- [x] Quando o estúdio está em **Bloqueio Operacional**, o **Site de Agendamento Online** (`[slug].luvea.app`) suspende a criação de novas reservas e pagamentos de **Sinal**, exibindo um aviso editorial sóbrio ao **Cliente** final com o contato direto do estúdio
- [x] Fora do **Teste Grátis**, a store operacional e a interface impedem adicionar um 2º **Profissional** no **Plano Essencial** (ou um 10º no **Plano Gold**) e bloqueiam recursos exclusivos de planos superiores, apresentando convite direto para upgrade de **Plano**
- [x] Testes automatizados (`node:test`) validam de ponta a ponta o **Período de Carência**, o **Bloqueio Operacional** (recusa de novos agendamentos e reservas online vs. permissão de conclusão de agendamentos já confirmados e exportação LGPD) e o enforcement dos limites de **Profissionais** e módulos entre **Essencial**, **Gold** e **Platinum**

## Blocked by

- [03-gestao-self-service-prorrata-e-cdc.md](./03-gestao-self-service-prorrata-e-cdc.md)
