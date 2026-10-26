# PRD: Status de Presença e Confirmação do Próximo Cliente na LUVEA TV Kiosk

Status: ready-for-agent

## Problem Statement

No painel **TV Kiosk (`LUVEA TV`)**, cada coluna de **Profissional (`Provider` / `Staff`)** exibe o atendimento em andamento no topo e o próximo **Evento de Agenda (`Calendar Event`)** logo abaixo (ou no card central *"PRÓXIMO HORÁRIO"* quando o **Profissional** está disponível). Contudo, hoje o bloco do próximo horário mostra apenas o horário de início, o nome abreviado do **Cliente (`Client`)** (mascarado pela LGPD) e o serviço — sem informar ao **Profissional** em qual estágio de confirmação ou presença física aquele próximo **Cliente** se encontra.

Na rotina real de um salão ou clínica a 3–5 metros da TV, essa ausência obriga o **Profissional** a interromper o procedimento ou ir até a recepção perguntar:
1. Se o próximo **Cliente** ainda não respondeu ao lembrete (**Aguardando** confirmação);
2. Se o próximo **Cliente** já confirmou presença via WhatsApp ou na **Agenda** (**Confirmado**);
3. Ou se o próximo **Cliente** já chegou fisicamente ao estúdio e está sentado aguardando (**Na recepção**).

Além disso, a recepcionista ou gestor que opera a **Agenda (`Calendar`)** não possui um botão rápido de 1 toque no drawer de detalhes do agendamento para registrar que o **Cliente** acabou de chegar na recepção e avisar silenciosa e sonoramente (via chime acústico opcional) o **Profissional** na **TV Kiosk (`LUVEA TV`)**.

## Solution

Introduzir o **Indicador de Presença do Próximo Cliente em 3 Estados** (`Aguardando`, `Confirmado`, `Na recepção`) integrado de ponta a ponta entre a **Agenda (`Calendar`)**, a sincronização em nuvem da **Organização / Salão (`Organization`)** e o painel **TV Kiosk (`LUVEA TV`)**:

1. **Check-in Rápido de 1 Clique na Agenda (`"Cliente na recepção"`):**
   - No drawer lateral de detalhes do **Evento de Agenda (`Calendar Event`)** (para agendamentos ativos/não concluídos), adicionar um controle de check-in de recepção em 1 clique (**"Marcar na recepção"** / **"Na recepção"**), permitindo alternar instantaneamente se o **Cliente** já chegou fisicamente ao salão.
   - Ao marcar o **Cliente** como presente na recepção, o agendamento também garante o status confirmado e sincroniza imediatamente com o armazenamento local (`BroadcastChannel` / `storage` para reflexo instantâneo na mesma máquina) e com a nuvem da **Organização / Salão** (via metadados estruturados do agendamento, sem exigir migração destrutiva de banco de dados).

2. **Derivação Determinística dos 3 Estados de Presença para o TV Kiosk (`LUVEA TV`):**
   - **`Na recepção` (`arrived`):** Quando o agendamento possui check-in físico ativo (`arrivedAtReception: true`). Tem precedência máxima sobre os demais estados de presença.
   - **`Confirmado` (`confirmed`):** Quando o agendamento ainda não teve check-in físico na recepção, mas já está confirmado (`status === "confirmed"` ou resposta da **Recepção IA** `whatsappClientReply === "1_confirmed"`).
   - **`Aguardando` (`waiting`):** Quando o agendamento está pendente de confirmação (`status === "pending"` e sem check-in na recepção) ou aguarda definição de reagendamento.

3. **Micro-Badge Editorial Anti-AI Slop nas Colunas da LUVEA TV:**
   - Exibir o micro-badge de presença do próximo **Cliente** nos dois modos da coluna do **Profissional**:
     - Quando o **Profissional** está **Em Atendimento** (na seção inferior *"PRÓXIMO"* ao lado do horário do próximo **Cliente**).
     - Quando o **Profissional** está **Disponível** (no card central *"PRÓXIMO HORÁRIO"*).
   - Seguir estritamente o padrão **Editorial Clean & Luxury Salon OS (Anti-AI Slop)**:
     - Zero emojis ou caracteres Unicode soltos (`✓`, `○`, `✔`, `★`).
     - Uso exclusivo de micro-indicadores circulares (`w-1.5 h-1.5` / `w-2 h-2 rounded-full` com `ring-2`) acompanhados de copy conciso (`Aguardando`, `Confirmado`, `Na recepção`).
     - No estado **`Na recepção`**, aplicar ponto esmeralda com pulso sutil (`animate-pulse motion-reduce:animate-none`) e superfície de destaque discreta compatível com os modos Claro e Escuro da TV.

4. **Sinalização Acústica Opcional (Luxury Audio Chime no Check-in de Recepção):**
   - Quando o próximo **Cliente** de qualquer **Profissional** visível na **TV Kiosk (`LUVEA TV`)** transicionar para o estado **`Na recepção`** (`arrived`), acionar o toque acústico sutil (`playLuxuryChime`) caso o áudio da TV esteja habilitado pelo usuário, permitindo que o **Profissional** saiba que seu próximo **Cliente** chegou sem precisar olhar continuamente para a tela.

## User Stories

1. Como **Profissional**, quero olhar para minha coluna na **TV Kiosk (`LUVEA TV`)** enquanto estou realizando um atendimento e ver imediatamente se meu próximo **Cliente** está com status **`Aguardando`**, **`Confirmado`** ou **`Na recepção`**, para que eu possa gerenciar meu ritmo de finalização sem interromper o procedimento.
2. Como **Profissional**, quero ver o mesmo indicador de presença (`Aguardando`, `Confirmado` ou `Na recepção`) quando minha coluna estiver no estado **Disponível** (dentro do card *"PRÓXIMO HORÁRIO"*), para que eu saiba se o **Cliente** do próximo horário já confirmou ou já está me esperando na recepção.
3. Como **Profissional** ou recepcionista operando a **Agenda (`Calendar`)**, quero clicar em um **Evento de Agenda (`Calendar Event`)** e ter um botão rápido de 1 toque (**"Marcar na recepção"** / **"Cliente na recepção"**) no drawer de detalhes, para que eu registre a chegada física do **Cliente** em menos de um segundo.
4. Como **Profissional** ou recepcionista operando a **Agenda (`Calendar`)**, quero poder desmarcar o estado **"Na recepção"** em 1 clique caso tenha clicado por engano, retornando o agendamento ao estado **`Confirmado`**, para que o painel da TV nunca exiba informação incorreta.
5. Como **Profissional**, quero que, ao marcar um **Cliente** que estava pendente (`pending`) diretamente como **"Na recepção"**, o sistema promova automaticamente o agendamento para confirmado com presença na recepção ativa, para que eu não precise clicar em dois botões separados.
6. Como **Profissional**, quero que o badge **`Na recepção`** na **TV Kiosk (`LUVEA TV`)** tenha um micro-indicador esmeralda com pulso sutil (`animate-pulse`) e contraste superior aos estados **`Confirmado`** e **`Aguardando`**, para que a presença física do **Cliente** no salão seja perceptível a 3–5 metros de distância.
7. Como **Profissional**, quero que o badge **`Confirmado`** exiba um micro-indicador circular sólido discreto e texto sóbrio `"Confirmado"`, para que eu saiba que o **Cliente** confirmou o horário via WhatsApp ou na agenda, mas ainda não chegou ao salão.
8. Como **Profissional**, quero que o badge **`Aguardando`** exiba um micro-indicador âmbar/neutro discreto e texto `"Aguardando"`, para que eu identifique rapidamente quando o próximo horário ainda depende de confirmação do **Cliente**.
9. Como **Profissional**, quero que a **TV Kiosk (`LUVEA TV`)** toque o chime acústico suave (quando o som da TV estiver ativado no rodapé ou via tecla `M`/`S`) no exato momento em que meu próximo **Cliente** mudar para o estado **`Na recepção`**, para que eu receba um aviso sonoro elegante na recepção/salão sem alarde.
10. Como **Profissional**, quero que o chime sonoro de chegada na recepção não dispare repetidamente a cada ciclo de polling de 20 segundos para o mesmo **Cliente** já marcado como **`Na recepção`**, tocando apenas na transição de entrada nesse estado, para que o ambiente do salão permaneça silencioso e agradável.
11. Como **Profissional**, quero que o chime sonoro também não dispare no carregamento inicial da página da **TV Kiosk (`LUVEA TV`)** para **Clientes** que já estavam na recepção antes de a TV ser ligada, evitando toques falsos ao atualizar o navegador.
12. Como **Gestor da Organização / Salão**, quero que o check-in **"Na recepção"** feito no computador ou tablet da recepção seja sincronizado com a nuvem e refletido na Smart TV pareada via token de **Dispositivo TV (`TV Device`)** no ciclo de atualização, para que múltiplos dispositivos operem em sintonia.
13. Como **Profissional** testando ou usando a **TV Kiosk (`LUVEA TV`)** no mesmo navegador do painel administrativo, quero que o clique em **"Cliente na recepção"** na **Agenda (`Calendar`)** atualize a aba da TV instantaneamente via `BroadcastChannel` / `localStorage`, para que a resposta visual seja imediata.
14. Como **Gestor da Organização / Salão**, quero que os nomes dos **Clientes** exibidos junto aos badges **`Aguardando`**, **`Confirmado`** e **`Na recepção`** na **TV Kiosk (`LUVEA TV`)** continuem rigorosamente mascarados no formato `PrimeiroNome I.` (LGPD), para que a privacidade dos clientes seja preservada em áreas públicas.
15. Como usuário com sensibilidade a movimento (`prefers-reduced-motion: reduce`), quero que o pulso visual do indicador **`Na recepção`** seja desativado automaticamente (`motion-reduce:animate-none`), para que a interface respeite as preferências de acessibilidade do sistema operacional.
16. Como usuário de leitor de tela ou tecnologia assistiva, quero que o badge de status do próximo **Cliente** na **TV Kiosk (`LUVEA TV`)** possua semântica clara e texto legível indicando o estado de presença (`Na recepção`, `Confirmado` ou `Aguardando`), sem caracteres Unicode decorativos que poluam a leitura.
17. Como **Profissional**, quero que os badges de presença funcionem perfeitamente tanto no Tema Claro (`light`) quanto no Tema Escuro (`dark`) e em todas as densidades de tela da **TV Kiosk (`LUVEA TV`)** (`32"`, `43"`, `55"`), sem quebrar linha nem truncar o nome do **Cliente** ou o horário do próximo atendimento.

## Implementation Decisions

### 1. Contrato de Dados e Modelo de Presença em 3 Estados
- Definir o tipo canônico `TVClientPresenceStatus` no módulo de domínio da **TV Kiosk (`LUVEA TV`)** e estender os contratos de agendamento para transportar o estado de presença do **Cliente**:
  ```ts
  export type TVClientPresenceStatus = "waiting" | "confirmed" | "arrived";

  export interface TVAppointmentDTO {
    id: string;
    startTime: string;
    endTime: string;
    startsAt?: string;
    endsAt?: string;
    clientName: string; // Mascarado LGPD ("Mariana O.")
    serviceName: string;
    status: TVAppointmentStatus;
    presenceStatus?: TVClientPresenceStatus;
    professionalId: string;
    professionalName: string;
  }

  export interface RawTVAppointment {
    id: string;
    professional_id: string;
    client_name?: string | null;
    service_name?: string | null;
    starts_at: string;
    ends_at: string;
    status: string;
    whatsapp_client_reply?: string | null;
    arrived_at_reception?: boolean;
  }
  ```
- Estender a interface `CalendarEventItem` no módulo de estado do estúdio com a propriedade opcional `arrivedAtReception?: boolean`.

### 2. Regra de Derivação Pura (`deriveClientPresenceStatus`)
- A função pura `deriveClientPresenceStatus` no módulo de domínio da **TV Kiosk** resolve o estado de presença do **Cliente** seguindo esta ordem estrita de precedência:
  1. Se `arrived_at_reception === true` → retorna `"arrived"` (**`Na recepção`**).
  2. Se `status === "pending"` → retorna `"waiting"` (**`Aguardando`**).
  3. Caso contrário (`status === "confirmed"`, `whatsapp_client_reply === "1_confirmed"` ou agendamento confirmado padrão) → retorna `"confirmed"` (**`Confirmado`**).
- `buildTVPollingResponse` inclui `presenceStatus: deriveClientPresenceStatus(apt)` em cada `TVAppointmentDTO` gerado.

### 3. Ação de Domínio na Agenda (`toggleAppointmentReceptionArrival`)
- No módulo de estado do estúdio, expor uma função pura de transição `toggleAppointmentReceptionArrival(state, eventId, arrived?)` que:
  - Alterna (ou define explicitamente) `arrivedAtReception` no `CalendarEventItem` correspondente;
  - Quando `arrivedAtReception` passa a `true` e o agendamento estava como `pending`, promove automaticamente `status` para `"confirmed"`;
  - Registra uma mensagem de feedback concisa em `lastToastMessage` (ex.: `"Check-in realizado: Mariana na recepção."` ou `"Status de recepção removido."`).

### 4. Persistência Híbrida sem Migração de Schema (Compatibilidade Supabase)
- Na camada de sincronização com o Supabase, incluir `arrivedAtReception: Boolean(event.arrivedAtReception)` dentro do envelope JSON `__LUVEA_META__` gravado no campo `notes` do agendamento (tanto na criação quanto na atualização de agendamentos) e decodificá-lo ao carregar agendamentos da nuvem e no endpoint de polling da TV (`/api/tv/appointments`).
- Dessa forma, a sincronização entre o painel administrativo e o **Dispositivo TV (`TV Device`)** funciona imediatamente em qualquer banco Supabase existente, sem depender de `ALTER TABLE`.

### 5. Diretrizes Visuais (Anti-AI Slop) & Gatilho do Chime Acústico
- **Zero Emojis / Unicode Solto:** O micro-badge de presença do próximo **Cliente** utiliza exclusivamente um ponto circular (`w-1.5 h-1.5 rounded-full`) + texto conciso:
  - **`Na recepção` (`arrived`):** Ponto `bg-emerald-500 ring-2 ring-emerald-500/25 animate-pulse motion-reduce:animate-none`, texto `"Na recepção"`.
  - **`Confirmado` (`confirmed`):** Ponto `bg-emerald-500/80` (sem pulso), texto `"Confirmado"`, superfície neutra discreta.
  - **`Aguardando` (`waiting`):** Ponto `bg-amber-500/80`, texto `"Aguardando"`, superfície neutra discreta.
- **Gatilho Sonoro na TV:** O rastreador de transições de estado na **TV Kiosk (`LUVEA TV`)** monitora tanto a entrada de agendamentos em `in_progress` quanto a transição do próximo agendamento de qualquer **Profissional** para `presenceStatus === "arrived"`. Após a carga inicial (`initialStatusSeededRef`), qualquer transição nova para `"arrived"` ou `"in_progress"` aciona `playLuxuryChime()` se o áudio estiver habilitado (`chimeEnabled`).

## Testing Decisions

- **O que define um bom teste:** Testes devem validar exclusivamente o comportamento observável através das funções públicas dos módulos de domínio (entradas e saídas de derivação de presença, transições de estado do agendamento e montagem do payload da TV), sem testar detalhes internos de implementação ou marcação CSS.
- **Seams de teste escolhidos (módulos existentes):**
  1. **Módulo de domínio da TV Kiosk (`tv-kiosk`):**
     - `deriveClientPresenceStatus`: valida a precedência entre `"arrived"` (`Na recepção`), `"waiting"` (`Aguardando`) e `"confirmed"` (`Confirmado`).
     - `buildTVPollingResponse`: valida que cada `TVAppointmentDTO` na coluna do **Profissional** recebe o `presenceStatus` correto preservando o mascaramento LGPD e a filtragem temporal (ADR 0004).
  2. **Módulo de domínio do estúdio (`agendaste-store`):**
     - `toggleAppointmentReceptionArrival`: valida a marcação e desmarcação em 1 toque de `arrivedAtReception` em um **Evento de Agenda**, a promoção automática de `pending` para `confirmed` ao fazer check-in na recepção, e a atualização de `lastToastMessage`.
- **Arte prévia:** Suítes de teste existentes em `src/lib/__tests__/tv-kiosk.test.ts` e `src/lib/__tests__/agendaste-store.test.ts` executadas via `node --test` (`npm test`).

## Out of Scope

- Totem de autoatendimento separado para check-in feito pelo próprio **Cliente** via CPF ou QR Code na entrada do salão.
- Alteração no cálculo da barra de progresso temporal do atendimento em andamento (`in_progress`).
- Criação de novas tabelas ou migrações SQL obrigatórias no banco de dados para armazenar o estado de recepção.

## Further Notes

- Todos os textos de interface seguem rigorosamente as diretrizes **Anti-AI Slop** do projeto (`AGENTS.md`): copy conciso e editorial (`Na recepção`, `Confirmado`, `Aguardando`), micro-indicadores circulares limpos e zero ícones/símbolos Unicode decorativos em badges.
