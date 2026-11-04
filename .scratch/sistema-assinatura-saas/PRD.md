# PRD: Sistema de Ciclo de Plano SaaS End-to-End, Checkout PCI-DSS SAQ-A e Bloqueio Operacional

Status: ready-for-agent

## Problem Statement

Hoje a contratação e a gestão de **Planos** da LUVEA (**Essencial**, **Gold** e **Platinum**) operam sobre um fluxo prototipado que apresenta lacunas graves de segurança, conformidade financeira e controle operacional. Do ponto de vista do gestor do estúdio, não há uma jornada real de ponta a ponta que permita iniciar o **Teste Grátis** de 14 dias sem cartão, contratar um **Ciclo de Plano** com segurança bancária via Cartão de Crédito ou Pix sem perder os dias restantes da avaliação, realizar upgrades imediatos com cálculo transparente de prorrata, agendar downgrades sem perder recursos já pagos, migrar entre Pix e Cartão sem risco de cobrança duplicada ou exercer o direito legal de arrependimento em 7 dias (CDC Art. 49).

Além disso, o fluxo atual de checkout coleta dados brutos de cartão (número, validade e CVV) diretamente no estado da interface e os envia ao servidor — violando o padrão **PCI-DSS SAQ-A** —, gera um QR Code Pix estático sem liquidação real para o **Plano**, não valida criptograficamente a assinatura dos webhooks da Stripe, permite sobrescrita não autenticada de dados de organizações existentes pelo slug e não aplica os limites contratados por **Plano** nem o **Bloqueio Operacional** quando o **Período de Carência** de inadimplência se encerra.

## Solution

Construir o sistema completo de **Ciclo de Plano** SaaS B2B da LUVEA de ponta a ponta, unindo uma máquina de estados canônica no banco de dados a dois provedores oficiais de pagamento (**Stripe Billing** para Cartão de Crédito recorrente e **Mercado Pago Oficial** para **Faturas do Plano** via Pix mensal e anual), sob as regras mais rígidas de segurança do mercado:

- **Teste Grátis de 14 dias sem cartão e Bônus de Contratação Antecipada**: O estúdio pode criar sua conta e operar por 14 dias sem informar cartão. Caso contrate qualquer **Plano** antes do fim do **Teste Grátis**, os dias gratuitos restantes são somados integralmente ao término do primeiro período pago (tanto no Cartão quanto no Pix).
- **Checkout Transparente PCI-DSS SAQ-A**: Remoção total de campos brutos de cartão do estado da aplicação e do servidor. Pagamentos via cartão utilizam o componente isolado em iframe criptografado da Stripe (com autenticação 3DS2 antifraude), enquanto pagamentos via Pix emitem uma **Fatura do Plano** com QR Code dinâmico e código Copia e Cola reais no Mercado Pago, com ativação automática via webhook autenticado.
- **Gestão Self-Service Híbrida na estética Editorial Clean**: Na aba de **Plano** nas Configurações do painel, o gestor visualiza o estado real do seu **Ciclo de Plano**, realiza upgrades imediatos com cobrança apenas da diferença proporcional (prorrata), agenda downgrades para o fim do ciclo vigente (desde que a quantidade atual de **Profissionais** respeite o limite do novo **Plano**), alterna entre Pix e Cartão com trava automática contra cobrança dupla, acessa o histórico de **Faturas do Plano**, abre o portal seguro da Stripe para trocar cartão/baixar recibos fiscais e cancela com 1 clique (agendando para o fim do período pago ou acionando reembolso integral automático se estiver nos primeiros 7 dias do primeiro pagamento histórico, nos termos do CDC Art. 49).
- **Período de Carência (3 dias) e Bloqueio Operacional (Soft-Lock)**: Em caso de falha na renovação, o estúdio entra em **Período de Carência** por 3 dias corridos mantendo 100% da operação com um aviso discreto no painel. Se o **Teste Grátis** expirar sem contratação ou o **Período de Carência** vencer sem pagamento, o estúdio entra em **Bloqueio Operacional**: novas reservas no painel e no **Site de Agendamento Online** são suspensas, mas o gestor mantém acesso de leitura para exportar todos os dados e **Fichas de Atendimento** (conformidade LGPD), regularizar o **Plano** e concluir na agenda os atendimentos já confirmados antes do bloqueio (protegendo a **Cliente** final que já pagou o **Sinal** via Pix).
- **Enforcement Real de Limites por Plano**: O motor valida no backend e na interface os limites de **Profissionais** (`1` no **Essencial**, até `9` no **Gold** e `ilimitados` no **Platinum**), franquia da **Recepção IA**, créditos de **Campanha de Marketing** e módulos exclusivos (**Recurso Físico** e **Fechamento de Repasse**).

## User Stories

1. Como **Proprietário de Estúdio**, quero iniciar meu **Teste Grátis** de 14 dias sem precisar digitar dados de cartão de crédito, para que eu avalie a plataforma sem atrito ou compromisso financeiro imediato.
2. Como **Proprietário de Estúdio**, quero visualizar no painel quantos dias restam do meu **Teste Grátis**, para que eu saiba exatamente quando meu período de avaliação termina.
3. Como **Proprietário de Estúdio** em **Teste Grátis**, quero que, ao contratar e pagar meu **Plano** no 6º dia de avaliação, os 8 dias gratuitos restantes sejam somados ao final do meu primeiro ciclo pago (totalizando 38 dias no mensal ou 373 dias no anual), para que eu não seja penalizado por assinar antecipadamente.
4. Como **Proprietário de Estúdio**, quero escolher entre o **Plano Essencial**, **Gold** ou **Platinum** nos ciclos mensal ou anual durante o checkout, para que eu contrate a modalidade adequada ao porte da minha equipe.
5. Como **Proprietário de Estúdio**, quero que os preços exibidos e cobrados no checkout sejam calculados exclusivamente no servidor a partir da tabela oficial (`Essencial` R$ 69/mês ou R$ 59/mês no anual; `Gold` R$ 149/mês ou R$ 129/mês no anual; `Platinum` R$ 399/mês ou R$ 349/mês no anual), para que haja integridade absoluta no valor faturado.
6. Como **Proprietário de Estúdio**, quero pagar meu **Ciclo de Plano** com Cartão de Crédito dentro do próprio ambiente da LUVEA através de um componente seguro isolado por iframe (PCI-DSS SAQ-A) com suporte a 3DS2, para que os dados do meu cartão nunca transitem pelo servidor da aplicação.
7. Como **Proprietário de Estúdio**, quero pagar meu **Ciclo de Plano** via Pix (mensal ou anual) recebendo um QR Code dinâmico e código Copia e Cola reais do Mercado Pago na tela de checkout, para que meu **Plano** seja ativado instantaneamente sem cartão de crédito.
8. Como **Proprietário de Estúdio** pagando via Pix, quero que a tela de checkout detecte automaticamente a confirmação do pagamento em tempo real e libere meu acesso ao painel operacional sem que eu precise enviar comprovantes manualmente.
9. Como **Proprietário de Estúdio**, quero que ninguém consiga sobrescrever os dados cadastrais, CNPJ/CPF ou **Plano** do meu subdomínio enviando requisições não autenticadas ao endpoint de checkout, para que minha organização esteja protegida contra sequestro de conta.
10. Como **Proprietário de Estúdio**, quero acessar a aba de **Plano** nas Configurações do painel e ver um badge editorial limpo (sem emoticons avulsos) indicando o status atual do meu **Ciclo de Plano** (`Avaliação Ativa`, `Plano Ativo`, `Pagamento Pendente` ou `Bloqueio Operacional`), a data da próxima renovação e o método de pagamento vinculado.
11. Como **Proprietário de Estúdio** no **Plano Essencial**, quero fazer upgrade para o **Plano Gold** ou **Platinum** no meio do meu ciclo vigente e ter os novos limites e a **Recepção IA** liberados imediatamente, pagando apenas a diferença proporcional (prorrata) dos dias restantes do ciclo atual.
12. Como **Proprietário de Estúdio**, quero ver uma prévia transparente do valor proporcional (prorrata) antes de confirmar um upgrade de **Plano**, para que eu aprove a cobrança sem surpresas.
13. Como **Proprietário de Estúdio** no **Plano Gold** ou **Platinum**, quero solicitar downgrade para um **Plano** inferior e ter essa mudança agendada para o final do meu período já pago, para que eu continue usufruindo dos recursos pelos quais já paguei até o último dia do ciclo atual.
14. Como **Proprietário de Estúdio**, quero ser avisado e impedido de agendar um downgrade para o **Plano Essencial** caso meu estúdio possua atualmente mais de 1 **Profissional** ativo cadastrado (ou mais de 9 ao tentar ir do **Platinum** para o **Gold**), para que eu saiba que preciso ajustar minha equipe antes de reduzir o **Plano**.
15. Como **Proprietário de Estúdio** com downgrade agendado para o fim do ciclo, quero poder cancelar esse agendamento de downgrade com 1 clique antes da data de renovação, para que eu mantenha meu **Plano** atual caso mude de ideia.
16. Como **Proprietário de Estúdio** que contratou o **Ciclo de Plano** via Pix, quero poder migrar para Cartão de Crédito recorrente antes do vencimento sem sofrer cobrança duplicada, tendo a primeira cobrança do cartão ancorada exatamente na data de término do período Pix já pago.
17. Como **Proprietário de Estúdio** que contratou o **Ciclo de Plano** via Cartão de Crédito, quero poder quitar minha renovação via Pix e ter a cobrança automática da Stripe desativada automaticamente assim que o Pix for confirmado, para que eu nunca seja cobrado duas vezes no mesmo ciclo.
18. Como **Proprietário de Estúdio** assinante via Pix, quero visualizar no painel a **Fatura do Plano** com QR Code de renovação gerada nos últimos 5 dias antes do vencimento do meu ciclo, para que eu renove meu **Plano** sem interrupção operacional.
19. Como **Proprietário de Estúdio**, quero cancelar meu **Ciclo de Plano** diretamente pelo painel usando um botão secundário sóbrio (sem bordas vermelhas estridentes de alerta barato) e manter meu acesso ativo até o último dia do período já pago, para que eu encerre a renovação sem burocracia e sem perder os dias contratados.
20. Como **Proprietário de Estúdio** que agendou o cancelamento para o fim do ciclo, quero poder reativar a renovação automática com 1 clique enquanto meu período pago ainda estiver vigente, para que eu reverta o cancelamento sem precisar refazer o checkout.
21. Como **Proprietário de Estúdio** nos primeiros 7 dias corridos após o primeiro pagamento histórico da minha organização, quero ter a opção de solicitar o cancelamento imediato com reembolso integral automático (conforme o Art. 49 do CDC), para que meu estorno seja processado diretamente no gateway (Stripe ou Mercado Pago) sem depender de chamado manual.
22. Como **Proprietário de Estúdio**, quero abrir o portal de faturamento da Stripe a partir das Configurações do painel, para que eu atualize meu cartão de crédito salvo e baixe notas/recibos oficiais com segurança.
23. Como **Proprietário de Estúdio**, quero visualizar na aba de **Plano** a lista das minhas **Faturas do Plano** (com data, **Plano**, ciclo, valor, método e status `Paga`, `Pendente` ou `Reembolsada`), para que eu controle o histórico financeiro do estúdio.
24. Como **Proprietário de Estúdio** cujo cartão falhou na renovação automática, quero dispor de um **Período de Carência** de 3 dias corridos com operação 100% normal e um aviso discreto no topo do painel, para que meu salão não pare de funcionar no meio do expediente enquanto atualizo o meio de pagamento.
25. Como **Proprietário de Estúdio** cujo **Teste Grátis** expirou ou cujo **Período de Carência** de 3 dias terminou sem regularização, quero ainda conseguir fazer login no painel em estado de **Bloqueio Operacional**, para que eu possa exportar meus relatórios, dados de **Clientes** e **Fichas de Atendimento** (exercendo a portabilidade garantida pela LGPD) ou pagar uma nova **Fatura do Plano** para reativar tudo imediatamente.
26. Como **Proprietário de Estúdio** em **Bloqueio Operacional**, quero que os agendamentos que já estavam confirmados antes do bloqueio (especialmente aqueles em que a **Cliente** já pagou o **Sinal** via Pix) continuem visíveis e possam ser concluídos na agenda, para que nenhuma **Cliente** final seja lesada.
27. Como **Cliente** acessando o **Site de Agendamento Online** de um estúdio que está em **Bloqueio Operacional**, quero ver uma mensagem elegante informando que novos agendamentos online estão temporariamente indisponíveis e oferecendo o contato direto do estúdio, para que eu não pague um **Sinal** em uma agenda suspensa.
28. Como **Proprietário de Estúdio** no **Plano Essencial**, quero que o sistema me impeça de adicionar um 2º **Profissional**, de cadastrar travas de **Recurso Físico** ou de disparar a **Recepção IA** após o **Teste Grátis**, apresentando um convite editorial de upgrade para o **Plano Gold**, para que os limites do meu **Plano** sejam claros e acionáveis.
29. Como **Proprietário de Estúdio** no **Plano Gold**, quero poder cadastrar até 9 **Profissionais**, utilizar até 500 conversas mensais da **Recepção IA** e 500 créditos de **Campanha de Marketing**, sendo convidado a fazer upgrade para o **Plano Platinum** apenas se precisar ultrapassar esses limites.
30. Como **Administrador da Plataforma LUVEA**, quero que todos os webhooks da Stripe e do Mercado Pago validem obrigatoriamente a assinatura criptográfica HMAC-SHA256 em tempo constante, rejeitem timestamps com mais de 5 minutos (anti-replay), verifiquem o valor efetivamente pago na API de origem e registrem o identificador único do evento em uma tabela de idempotência antes de alterar o banco, para que o sistema seja imune a notificações forjadas ou duplicadas.

## Implementation Decisions

1. **Máquina de Estados Canônica do Ciclo de Plano**:
   - A organização mantém o estado autoritativo do **Ciclo de Plano** com os campos: `plan_tier` (`essencial` | `gold` | `platinum`), `billing_cycle` (`monthly` | `yearly`), `subscription_status` (`trialing` | `active` | `past_due` | `canceled` | `incomplete`), `trial_ends_at`, `current_period_start`, `current_period_end`, `first_paid_at`, `cancel_at_period_end`, `canceled_at`, `grace_period_ends_at`, `scheduled_plan_tier`, `scheduled_billing_cycle`, `payment_gateway` (`stripe` | `mercadopago`), `stripe_customer_id`, `stripe_subscription_id` e `mp_payer_id`.
   - O estado derivado de acesso obedece à seguinte transição determinística:

```ts
type AccessLevel = "full_access" | "grace_period_warning" | "operational_soft_lock";

// Regras de avaliação em tempo de execução (agora = now):
// 1. Se subscription_status === "active" e (!current_period_end || now < current_period_end) -> "full_access"
// 2. Se subscription_status === "trialing" e now < trial_ends_at -> "full_access"
// 3. Se subscription_status === "past_due" e grace_period_ends_at e now < grace_period_ends_at -> "grace_period_warning" (mantém permissões operacionais ativas + exibe alerta de regularização)
// 4. Em qualquer outro caso (trial expirado, past_due após 3 dias de carência, canceled ou active com current_period_end vencido) -> "operational_soft_lock"
```

2. **Tabelas de Auditoria Financeira e Idempotência**:
   - **Tabela de Faturas do Plano (`subscription_invoices`)**: Armazena cada cobrança de ciclo ou prorrata (`id`, `organization_id`, `gateway`, `external_invoice_id`, `external_payment_id`, `plan_tier`, `billing_cycle`, `amount_cents`, `proration_credit_cents`, `bonus_trial_days_applied`, `status` em `pending | paid | void | refunded | failed`, `pix_qr_code`, `pix_qr_code_base64`, `pix_ticket_url`, `pix_expires_at`, `hosted_invoice_url`, `period_start`, `period_end`, `paid_at`, `refunded_at`).
   - **Tabela de Eventos de Webhook (`billing_webhook_events`)**: Registra `(gateway, event_id)` com restrição `UNIQUE` antes de processar qualquer transição de estado. Se o evento já constar registrado, o endpoint encerra imediatamente com `200 OK` (idempotência exata).
   - **Row Level Security (RLS)**: Escrita em `subscription_invoices` e `billing_webhook_events` restrita exclusivamente ao papel de serviço do backend; leitura de `subscription_invoices` permitida somente a usuários autenticados com papel `owner` ou `admin` na respectiva organização.

3. **Orquestrador de Ciclo de Plano e Resolução Server-Side de Preços**:
   - Um módulo profundo de domínio concentra toda a matemática financeira, resolução de preços, elegibilidade de planos e avaliação de permissões, sem jamais confiar em valores monetários vindos do cliente.
   - Tabela canônica em centavos:
     - `essencial`: `6900` (mensal) | `70800` (anual, equivalente a 12x R$ 59,00).
     - `gold`: `14900` (mensal) | `154800` (anual, equivalente a 12x R$ 129,00).
     - `platinum`: `39900` (mensal) | `418800` (anual, equivalente a 12x R$ 349,00).
   - **Bônus de Dias Restantes do Teste Grátis**: Quando uma organização em `trialing` com `trial_ends_at > now` realiza seu primeiro pagamento (`first_paid_at IS NULL`), os dias inteiros restantes (`ceil((trial_ends_at - now) / 1 dia)`) são adicionados ao `current_period_end` do primeiro período contratado (30 dias + dias restantes no mensal, ou 365 dias + dias restantes no anual).

4. **Regras de Upgrade, Downgrade e Sincronização Anti-Duplicidade entre Gateways**:
   - **Upgrade** (mudança para um **Plano** superior ou do ciclo mensal para anual no mesmo **Plano**): Calculado por prorrata dos dias restantes do período atual (`crédito proporcional dos dias não utilizados do plano atual` abatido do valor do novo plano). No Cartão (Stripe), atualiza a subscription imediatamente com cobrança da diferença; no Pix, gera uma **Fatura do Plano** complementar com o saldo líquido e promove o **Plano** assim que paga.
   - **Downgrade** (mudança para um **Plano** inferior ou do ciclo anual para mensal): Primeiro valida se a quantidade atual de **Profissionais** cadastrados cabe no limite `maxStaff` do **Plano** de destino (retornando erro claro caso exceda). Se válido, grava `scheduled_plan_tier` e `scheduled_billing_cycle` para entrarem em vigor apenas no término de `current_period_end`, preservando todos os benefícios atuais até o fim do período já pago.
   - **Migração Pix → Cartão**: Se a organização possui período pago vigente (`current_period_end > now`) e vincula um Cartão de Crédito na Stripe, a assinatura na Stripe é criada ancorando o início da cobrança (`trial_end`) exatamente em `current_period_end`, e eventuais **Faturas do Plano** via Pix ainda `pending` são marcadas como `void`.
   - **Migração Cartão → Pix**: Se a organização possui uma assinatura na Stripe e quita uma **Fatura do Plano** via Pix, a confirmação do webhook Pix aciona a desativação da renovação automática na Stripe (`cancel_at_period_end = true`), define `payment_gateway = 'mercadopago'` e estende `current_period_end`.

5. **Direito de Arrependimento (CDC Art. 49) vs. Cancelamento no Fim do Ciclo**:
   - Quando a organização solicita cancelamento, o orquestrador verifica se `first_paid_at` ocorreu há no máximo 7 dias corridos (`now - first_paid_at <= 7 dias`) e se o assinante optou por `immediateRefund: true`.
   - Em caso afirmativo, dispara a API de reembolso integral no gateway correspondente (`POST /v1/refunds` na Stripe ou `POST /v1/payments/{id}/refunds` no Mercado Pago), marca a **Fatura do Plano** como `refunded`, define `subscription_status = 'canceled'` e coloca a organização em **Bloqueio Operacional**.
   - Após os 7 dias iniciais (ou quando o usuário escolhe manter até o fim do período), define `cancel_at_period_end = true`, preservando `subscription_status = 'active'` até `current_period_end` e permitindo reativação instantânea (`cancel_at_period_end = false`).

6. **Conformidade PCI-DSS SAQ-A e Segurança de Webhooks**:
   - Os esquemas de validação de checkout deixam de aceitar `cardNumber`, `cardName`, `cardExp` e `cardCvc`.
   - No modo Cartão, o endpoint de sessão retorna um `clientSecret` de intenção de pagamento/assinatura da Stripe para renderização do componente isolado de pagamento (com fallback seguro de tokenização simulada apenas em desenvolvimento local quando `STRIPE_SECRET_KEY` não estiver configurada, bloqueado de forma estrita quando `NODE_ENV === "production"`).
   - O verificador de webhook da Stripe valida o cabeçalho `stripe-signature` extraindo `t` e `v1`, rejeitando diferenças de tempo superiores a 300 segundos e comparando o HMAC-SHA256 de `${t}.${rawBody}` via `timingSafeEqual`.
   - O webhook do Mercado Pago valida o cabeçalho `x-signature` via HMAC-SHA256, consulta o recurso na API oficial do Mercado Pago e comprova que `status === 'approved'` e que o valor pago em centavos corresponde exatamente ao `amount_cents` da **Fatura do Plano** antes de ativar o ciclo.

7. **Comportamento do Bloqueio Operacional (Soft-Lock) e Limites de Plano**:
   - Quando o estúdio está em **Bloqueio Operacional**:
     - Bloqueia a criação de novos **Eventos de Agenda** do tipo agendamento, o envio de novas **Campanhas de Marketing**, o disparo de respostas automáticas da **Recepção IA** e novas reservas no **Site de Agendamento Online** público.
     - Mantém liberados: o login no painel `/app`, a exportação de relatórios CSV e dados de **Clientes** / **Fichas de Atendimento** (LGPD), a visualização e conclusão (checkout/baixa) de agendamentos que já estavam com status `confirmed` antes do bloqueio, e o acesso integral à aba de **Plano** para reativação.
   - Limites por **Plano** aplicados na store operacional e nas APIs:
     - `essencial`: máximo de 1 **Profissional**, 0 créditos mensais de **Campanha de Marketing**, **Recepção IA** e trava de **Recurso Físico** restritos ao período de **Teste Grátis**.
     - `gold`: máximo de 9 **Profissionais**, 500 conversas/mês na **Recepção IA**, 500 créditos/mês de **Campanha de Marketing**, trava de **Recurso Físico** e **Fechamento de Repasse** liberados.
     - `platinum`: **Profissionais** ilimitados, **Recepção IA** ilimitada e 2.500 créditos/mês de **Campanha de Marketing**.

## Testing Decisions

- **O que define um bom teste**: Os testes devem validar exclusivamente o comportamento observável externo através da costura pública de domínio (entradas de comando/webhook -> estado resultante da organização, faturas, permissões e efeitos na store operacional), sem acoplar a detalhes internos de implementação ou mocks frágeis de banco de dados.
- **Costura Única de Alto Nível Testada**:
  1. **Orquestrador de Ciclo de Plano & Segurança de Webhooks**:
     - Resolução server-side de preços em centavos para todos os **Planos** e ciclos e rejeição de qualquer tentativa de adulteração de preço pelo cliente.
     - Contratação durante o **Teste Grátis** somando os dias restantes ao `current_period_end` do primeiro ciclo pago.
     - Verificação criptográfica HMAC-SHA256 de webhooks da Stripe e do Mercado Pago (aceitação de assinatura válida, rejeição de assinatura inválida, rejeição de *replay attack* com timestamp `> 300s` e garantia de idempotência contra eventos duplicados).
     - Cálculo de prorrata em upgrades imediatos e agendamento de downgrades para o fim do ciclo (`scheduled_plan_tier`), incluindo o bloqueio de downgrade quando a equipe atual excede o `maxStaff` do **Plano** de destino.
     - Sincronização anti-duplicidade na migração Pix ↔ Cartão (ancoragem de `trial_end` no `current_period_end` e cancelamento de renovação automática).
     - Cancelamento dentro da janela de 7 dias do CDC Art. 49 (gerando reembolso integral e encerramento imediato) versus cancelamento após 7 dias (`cancel_at_period_end = true` mantendo acesso até o vencimento) e reativação.
     - Transição para **Período de Carência** (3 dias em `past_due` mantendo acesso operacional) e queda para **Bloqueio Operacional** após o vencimento da carência.
  2. **Integração com a Store Operacional**:
     - Durante o **Bloqueio Operacional**, tentativa de criar novo agendamento ou reservar pelo **Site de Agendamento Online** é recusada, enquanto a conclusão de um agendamento já confirmado anteriormente (com **Sinal** pago) e a exportação de dados permanecem permitidas.
     - Bloqueio ao tentar adicionar o 2º **Profissional** no **Plano Essencial** (ou o 10º no **Plano Gold**) fora do **Teste Grátis**.
- **Prior Art no Repositório**: Segue exatamente o padrão da suíte existente em `node:test` e `node:assert/strict` (executada via `npm test`), que testa funções puras e transições de estado de domínio de ponta a ponta sem dependências externas instáveis.

## Out of Scope

- Alterações no módulo de **Assinatura (Membership)** voltado aos **Clientes** finais do salão (créditos mensais de serviços de beleza/estética), que permanece isolado em seu próprio fluxo.
- Emissão automática de Nota Fiscal de Serviços Eletrônica (NFS-e) municipal pela prefeitura, sendo os recibos fiscais e faturas emitidos via Stripe Billing / Mercado Pago.
- Armazenamento de dados de cartão de crédito (PAN, CVV, data de validade) em tabelas próprias do banco de dados.

## Further Notes

- Toda a interface de checkout e a aba de **Plano** nas Configurações devem obedecer rigorosamente às diretrizes **Anti-AI Slop** do projeto: indicadores de status com ponto circular minimalista (`w-2 h-2 rounded-full` com `ring-2`), superfícies em `#F5F5F7` / `#18181b` com bordas sutis, botões de cancelamento na pílula secundária neutra do sistema (nunca com bordas vermelhas estridentes) e redação editorial concisa.
