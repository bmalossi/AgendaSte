# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + React + TypeScript + Tailwind CSS + Lucide Icons + Shadcn UI (customizado e refinado), Supabase (PostgreSQL com RLS, Auth, Realtime, Storage), Node.js (Baileys / Evolution API para pareamento WhatsApp via QR Code), Mercado Pago / Asaas API (Pix dinâmico para taxa de reserva), preparado para deploy na Vercel.

## Users

Profissionais autônomos e pequenos estúdios de beleza, estética, saúde e bem-estar (barbeiros, cabeleireiros, esteticistas, biomédicos, fisioterapeutas, massoterapeutas, dentistas, personal trainers) no Brasil.
- **Situação real de uso:** Operam com uma mão ocupada entre um atendimento e outro pelo smartphone (PWA/Mobile) em iluminação variada de consultório/salão, ou consultam/fecham caixa em painel de balcão/desktop na recepção.
- **Job principal:** Manter a agenda cheia sem furos (no-shows), confirmar horários sem perder tempo digitando no WhatsApp, receber sinais/pagamentos instantaneamente e fazer o cliente remarcar o próximo retorno antes de sair da sala.

## Product Purpose

Plataforma operacional de agendamento, checkout e retenção de receita (nome provisório: **Veloce**) desenhada para eliminar o trabalho administrativo manual do autônomo. Sucesso significa:
1. Qualquer ação operacional crítica (confirmar presença, dar baixa em pagamento, acionar WhatsApp ou remarcar retorno) concluída em **no máximo 1 a 2 toques (1-Tap Workflows)**.
2. Redução drástica de faltas (no-shows) via cobrança automática de taxa de reserva (sinal via Pix) e confirmação ativa 2-Way Sync no WhatsApp pessoal do profissional.
3. Aumento de LTV com reagendamento imediato no pós-atendimento (1-Tap Rebooking) e reativação ativa de clientes ausentes há 30/45 dias.

## Positioning

Enquanto agendas tradicionais funcionam como calendários passivos que exigem dezenas de cliques em modais e deixam o profissional refém de faltas e mensagens manuais, o **Veloce** opera como um **terminal de fluxo de caixa e retenção em 1 toque**: une grade horária de leitura imediata por status semântico, automação 2-Way Sync no próprio WhatsApp do profissional (via QR Code) que atualiza a agenda sozinha quando o cliente responde "1" ou "2", trava anti-no-show via sinal Pix na reserva online e checkout com reagendamento de retorno em um único gesto.

## Operating Context

- **Ritual diário do profissional:** Bater o olho na grade do dia logo cedo para ver o que já está confirmado/pago (Verde), quem ainda não respondeu o lembrete ou tem sinal pendente (Amarelo) e onde há risco ou falta/inadimplência (Vermelho).
- **Ritual entre atendimentos (30 segundos em pé, pelo celular):** Tocar no card do cliente que acabou de sair → concluir o atendimento com baixa de pagamento em 1 toque → engatar o reagendamento de retorno (+15, +30 ou +45 dias) em 1 toque.
- **Ritual de balcão / fim de dia (Desktop/Web):** Conferir a receita realizada vs. prevista do dia/semana, checar status do pareamento do robô WhatsApp, revisar prontuários/anamnese (com fotos Antes & Depois) e disparar ofertas de reativação para clientes sumidos há mais de 30/45 dias.

## Capabilities and Constraints

- **Módulo A — Agenda Inteligente & Checkout Rápido:** Grade diária por blocos de horários com indicador visual imediato de status; card expansível inline (evitando modais desnecessários) com cliente, serviço, valor, histórico recente e ações rápidas de 1 toque; finalização com "Reagendamento de Retorno" automático (1-Tap Rebooking).
- **Módulo B — Motor de Robô WhatsApp (QR Code):** Painel de conexão via leitura de QR Code (Baileys / Evolution API); automação 2-Way Sync com lembretes automáticos 24h e 2h antes do atendimento (`1 = Confirmar`, `2 = Reagendar`) e atualização em tempo real do status na agenda.
- **Módulo C — Máquina Anti-No-Show (Taxa de Reserva):** Link público de agendamento para bio do Instagram/WhatsApp com cobrança automática de sinal via Pix dinâmico (Mercado Pago / Asaas) para travar o horário.
- **Módulo D — Financeiro Proativo & CRM:** Resumo de Receita do Dia/Semana, Previsão de Entradas, Taxa de Confirmação e Inadimplência; Prontuário do Cliente (histórico, notas de preferências/anamnese, fotos Antes & Depois); Reativação Inteligente (alertas de clientes ausentes há 30/45+ dias com disparo de oferta via WhatsApp em 1 toque).
- **Restrições duráveis de UX/Design:**
  - Proibição de clichês genéricos de IA (sem gradientes roxos/azuis pesados no topo, sem botões flutuantes sem contexto, sem cards aninhados dentro de cards, sem modais preguiçosos para ações simples).
  - Paleta semântica funcional estrita para leitura rápida de status: Verde = Confirmado/Pago, Amarelo/Âmbar = Pendente/Aguardando Sinal ou Resposta, Vermelho = Falta/No-Show/Inadimplente.
  - Layout adaptativo: Bottom Navigation ergonômica para o polegar no Mobile e Sidebar minimalista de acesso rápido no Desktop/Web.
- **Fatos em aberto:** Nome comercial definitivo da marca (usando **Veloce** como identidade provisória de trabalho); credenciais reais de produção do Supabase, Evolution API e gateway Pix (estruturados com schemas SQL prontos e rotas `/api/whatsapp/send` e `/api/pix/create` simuladas para validação imediata).

## Brand Commitments

- **Nome de trabalho:** Veloce (Agenda & Retenção Operacional).
- **Tom de voz:** Direto, pragmático, confiável e orientado a ação e receita (fala a língua do profissional autônomo brasileiro: "Sinal Pix pago", "Confirmado no Whats", "Retorno em 30d", sem jargão corporativo).
- **Compromisso visual vinculante do brief:** Tipografia limpa de altíssima legibilidade, ausência total de gradientes roxos de IA, hierarquia guiada por status funcional (Verde, Amarelo, Vermelho) sobre base tátil de alto contraste.

## Evidence on Hand

- Repositório greenfield recém-inicializado.
- Dados operacionais demonstrativos (agendamentos do dia, clientes, prontuários, status de WhatsApp e cobranças Pix) são sintéticos/mockados para validação do fluxo de 1 toque e devidamente identificados na camada de dados.

## Product Principles

1. **Regra do Polegar (1-Tap First):** Nenhuma tarefa recorrente de atendimento (confirmar, cobrar/dar baixa, chamar no WhatsApp ou remarcar retorno) pode exigir mais de 1 a 2 toques ou abrir formulários modais complexos.
2. **Status como Arquitetura, Não Enfeite:** A cor na interface existe para responder em meio segundo se o horário está garantido (Verde), exige atenção (Amarelo) ou representa perda/inadimplência (Vermelho).
3. **Zero Horário Vazio sem Ação:** Todo cancelamento, janela livre ou cliente ausente há 30+ dias deve apresentar imediatamente o gatilho de recuperação de receita (disparo de fila de espera ou reativação via WhatsApp).
4. **Continuidade Bolso-Balcão:** A mesma densidade informacional que funciona com uma mão no smartphone se expande em visão de comando lateral no desktop sem esconder ações essenciais.

## Accessibility & Inclusion

- Contraste rigoroso (WCAG AA mínimo: ≥4.5:1 para texto normal, ≥3:1 para texto grande e indicadores) pensado para leitura rápida sob iluminação forte de consultórios, salões e clínicas.
- Áreas de toque generosas (mínimo 44x44px no mobile) para operação rápida com uma só mão, além de suporte completo a navegação por teclado e estados de foco claros no desktop.
- Status nunca depende exclusivamente de cor: todo estado (Confirmado/Pago, Pendente, Falta/Inadimplente) combina cor semântica + ícone distinto + rótulo textual explícito + números tabulares (`tabular-nums`) para valores e horários.
