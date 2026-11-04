# Ticket 01: Checkout Transparente PCI-DSS SAQ-A, Proteção Anti-Overwrite e Contratação com Bônus de Teste Grátis (Cartão Stripe & Pix Mercado Pago)

Status: ready-for-agent

## Parent

[PRD.md](../PRD.md)

## What to build

Entregar de ponta a ponta a jornada inicial de contratação e ativação do **Ciclo de Plano (`Plan Subscription`)** em conformidade estrita com **PCI-DSS SAQ-A**. O proprietário do estúdio pode iniciar os 14 dias de **Teste Grátis (`Free Trial`)** sem cartão ou contratar imediatamente qualquer **Plano (`Essencial`, `Gold`, `Platinum`)** nos ciclos mensal ou anual via Cartão de Crédito (através de container isolado por iframe da Stripe, sem nenhum campo bruto de PAN/CVV no estado da aplicação ou no servidor) ou via Pix (emitindo uma **Fatura do Plano (`Plan Invoice`)** com QR Code dinâmico e Copia e Cola reais no Mercado Pago e detecção de pagamento em tempo real). Caso a contratação ocorra durante o **Teste Grátis**, os dias gratuitos restantes são somados automaticamente ao término do primeiro período pago (`current_period_end`), e subdomínios existentes ficam blindados contra sobrescrita não autenticada.

## Acceptance criteria

- [ ] A evolução do schema de banco de dados expande a tabela de organizações com os campos de ciclo (`current_period_start`, `current_period_end`, `first_paid_at`, `cancel_at_period_end`, `canceled_at`, `grace_period_ends_at`, `scheduled_plan_tier`, `scheduled_billing_cycle`, `mp_payer_id`) e cria a tabela de **Faturas do Plano** (`subscription_invoices`) com RLS estrito
- [ ] O módulo de domínio resolve exclusivamente no servidor os preços em centavos de cada **Plano** e ciclo (`essencial`: `6900`/`70800`; `gold`: `14900`/`154800`; `platinum`: `39900`/`418800`), ignorando qualquer valor monetário enviado pelo cliente
- [ ] Quando uma organização em **Teste Grátis** vigente realiza seu primeiro pagamento, os dias inteiros restantes do teste são somados ao `current_period_end` do primeiro ciclo pago (`30 + dias restantes` no mensal ou `365 + dias restantes` no anual), tanto no Cartão quanto no Pix
- [ ] Os campos brutos `cardNumber`, `cardName`, `cardExp` e `cardCvc` são integralmente removidos do schema de validação de checkout e do estado React da página de checkout (conformidade **PCI-DSS SAQ-A**)
- [ ] O endpoint de sessão de checkout rejeita com `409 Conflict` qualquer tentativa de atualizar uma organização cujo subdomínio já exista quando o requisitante não estiver autenticado como `owner` ou `admin` daquela organização
- [ ] No Passo 2 do checkout, a aba Cartão apresenta o container isolado **Stripe Payment Element** (com suporte a 3DS2 e modo seguro de homologação local sem tráfego de PAN), e a aba Pix gera uma **Fatura do Plano** via Mercado Pago exibindo QR Code real, código Copia e Cola e polling de confirmação em tempo real
- [ ] Testes automatizados (`node:test`) validam a resolução server-side de preços, o cálculo de dias bônus do **Teste Grátis**, a rejeição de campos brutos de cartão e a proteção anti-overwrite de organização

## Blocked by

- None — can start immediately
