# Ticket 03: Gestão Self-Service Híbrida nas Configurações (Upgrade com Prorrata, Downgrade Agendado, Reembolso CDC 7 Dias e Histórico de Faturas do Plano)

Status: completed

## Parent

[PRD.md](../PRD.md)

## What to build

Entregar de ponta a ponta o autoatendimento completo do **Ciclo de Plano** na aba **Plano** nas Configurações do painel (`SettingsView`) e nas rotas de faturamento da API, seguindo rigorosamente a estética **Editorial Clean & Luxury Salon OS (Anti-AI Slop)**. O proprietário do estúdio visualiza seu status e próxima renovação, realiza **Upgrades** imediatos com prévia transparente de prorrata, agenda **Downgrades** para o fim do ciclo (com trava caso a equipe atual exceda o limite do plano menor), cancela a renovação mantendo os dias pagos ou aciona o reembolso integral automático nos primeiros 7 dias corridos do 1º pagamento histórico (CDC Art. 49), consulta o histórico de **Faturas do Plano**, gera QR Code de renovação Pix nos últimos 5 dias do ciclo e abre o **Stripe Customer Portal**.

## Acceptance criteria

- [x] As rotas `/api/billing/subscription`, `/api/billing/change-plan`, `/api/billing/cancel`, `/api/billing/reactivate` e `/api/billing/portal` operam autenticadas e conectadas ao orquestrador de domínio e à store do painel
- [x] Na solicitação de **Upgrade** (para **Plano** superior ou do ciclo mensal para anual), o sistema exibe a prévia de prorrata dos dias restantes, processa a diferença proporcional e libera os novos recursos imediatamente
- [x] Na solicitação de **Downgrade**, o sistema valida se a quantidade atual de **Profissionais** ativos é menor ou igual ao `maxStaff` do **Plano** de destino (bloqueando com mensagem clara caso exceda); se válido, agenda `scheduled_plan_tier` e `scheduled_billing_cycle` para o fim de `current_period_end` e permite cancelar o agendamento de downgrade com 1 clique
- [x] Nos primeiros 7 dias corridos após `first_paid_at`, o modal de cancelamento oferece a escolha entre encerrar ao fim do ciclo (`cancel_at_period_end = true`) ou cancelar imediatamente com reembolso integral automático (CDC Art. 49), executando o estorno no gateway e marcando a **Fatura do Plano** como `refunded`
- [x] Após 7 dias de `first_paid_at`, o cancelamento agenda `cancel_at_period_end = true` preservando o acesso até `current_period_end`, e exibe botão de 1 clique para reativar a renovação automática antes do vencimento
- [x] A aba **Plano** nas Configurações exibe o histórico de **Faturas do Plano**, o QR Code Pix de renovação quando faltarem 5 dias ou menos para o vencimento, atalho para o **Stripe Customer Portal** e componentes 100% aderentes ao padrão **Anti-AI Slop** (micro-indicadores circulares `w-2 h-2 rounded-full`, zero emoticons soltos e botão de cancelamento em pílula secundária neutra sem bordas vermelhas estridentes)
- [x] Testes automatizados (`node:test`) cobrem o cálculo de prorrata em upgrades, o agendamento e reversão de downgrade, o bloqueio de downgrade quando a equipe excede `maxStaff` e o cancelamento com reembolso CDC 7 dias vs. cancelamento ao fim do ciclo

## Blocked by

- [02-webhooks-criptograficos-e-anti-duplicidade.md](./02-webhooks-criptograficos-e-anti-duplicidade.md)
