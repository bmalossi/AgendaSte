# Ticket 02: Webhooks Criptográficos (HMAC-SHA256 + Anti-Replay + Idempotência) e Sincronização Anti-Duplicidade Pix ↔ Cartão

Status: completed

## Parent

[PRD.md](../PRD.md)

## What to build

Entregar de ponta a ponta o processamento assíncrono, criptograficamente autenticado e idempotente dos webhooks de cobrança da Stripe e do Mercado Pago, juntamente com a sincronização automática entre meios de pagamento para impedir cobrança duplicada. Qualquer notificação recebida valida a assinatura HMAC-SHA256 em tempo constante, rejeita timestamps expirados (`> 300s`), registra o evento na tabela de idempotência antes de aplicar efeitos e reconcilia o estado do **Ciclo de Plano** e da **Fatura do Plano**, incluindo o início automático do **Período de Carência (`Grace Period`)** de 3 dias em caso de falha de renovação.

## Acceptance criteria

- [x] A tabela `billing_webhook_events` armazena `(gateway, event_id)` com restrição `UNIQUE` e RLS fechado, garantindo que notificações repetidas retornem `200 OK` sem reexecutar transições de estado
- [x] O verificador de webhook da Stripe valida criptograficamente o header `stripe-signature` via HMAC-SHA256 com `timingSafeEqual` e rejeita com `401 Unauthorized` assinaturas inválidas ou com diferença de timestamp superior a 300 segundos (proteção anti-replay)
- [x] O webhook do Mercado Pago exige assinatura `x-signature` HMAC-SHA256 válida quando configurada e realiza conferência server-to-server na API oficial confirmando `status === "approved"` e igualdade exata entre o valor pago e o `amount_cents` da **Fatura do Plano** antes de ativar o **Ciclo de Plano**
- [x] Ao migrar de Pix para Cartão enquanto houver período pago vigente (`current_period_end > now`), a assinatura na Stripe ancora sua primeira cobrança (`trial_end`) exatamente em `current_period_end` e anula (`void`) **Faturas do Plano** Pix pendentes
- [x] Ao quitar uma **Fatura do Plano** via Pix enquanto houver assinatura na Stripe, a confirmação do pagamento desativa automaticamente a renovação automática na Stripe (`cancel_at_period_end = true`), muda `payment_gateway` para `"mercadopago"` e estende `current_period_end` sem cobrança dupla
- [x] Em eventos de falha de pagamento na renovação (`invoice.payment_failed` ou `past_due`), a organização transita para `subscription_status = "past_due"` com `grace_period_ends_at = now + 3 days`
- [x] Testes automatizados (`node:test`) cobrem a validação HMAC-SHA256 da Stripe e do Mercado Pago, rejeição de *replay attack* (`> 300s`), idempotência de eventos duplicados, transição para **Período de Carência** e sincronização anti-duplicidade Pix ↔ Cartão

## Blocked by

- [01-checkout-pci-dss-e-bonus-trial.md](./01-checkout-pci-dss-e-bonus-trial.md)
