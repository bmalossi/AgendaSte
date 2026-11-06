# Stripe Integration Setup & Checklist

This document is the single source of truth for the Stripe Checkout integration in this project.

## Values to Replace

The parameters below are configured in the codebase. Verify and replace any placeholder environment variables with your live/test keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys).

**Files containing configuration and environment references:**
- [src/lib/billing/stripe.ts](src/lib/billing/stripe.ts)
- [src/app/api/checkout/session/route.ts](src/app/api/checkout/session/route.ts)
- [src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts)
- [.env.local](.env.local)

| Field | Current Value / Source | What to Set |
|-------|------------------------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (Configurado em `.env.local`) | Chave secreta de teste configurada e ativa. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (Configurado em `.env.local`) | Chave pública de teste configurada e ativa. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (Configurado em `.env.local`) | Segredo do webhook registrado em `we_1UY4LXREks0i7na0f12tcYO3`. |
| `line_items` (Essencial Mensal) | `price_1UYTjHREks0i7na06v3yplV2` | R$ 69,00 / mês (Criado no Stripe) |
| `line_items` (Essencial Anual) | `price_1UYTjHREks0i7na0sW59lEfc` | R$ 708,00 / ano (Criado no Stripe) |
| `line_items` (Gold Mensal) | `price_1UYTjIREks0i7na0V17H5v4p` | R$ 149,00 / mês (Criado no Stripe) |
| `line_items` (Gold Anual) | `price_1UYTjIREks0i7na0JxwKSQzO` | R$ 1.548,00 / ano (Criado no Stripe) |
| `line_items` (Platinum Mensal) | `price_1UYTjIREks0i7na02c52d8HH` | R$ 399,00 / mês (Criado no Stripe) |
| `line_items` (Platinum Anual) | `price_1UYTjJREks0i7na0nEQ7QxWl` | R$ 4.188,00 / ano (Criado no Stripe) |
| `mode` | `subscription` | Kept as `subscription` for recurring salon SaaS plans. |
| `success_url` | `${baseUrl}/app?checkout_success=true&session_id={CHECKOUT_SESSION_ID}...` | Dynamic post-payment redirect URL preserving `{CHECKOUT_SESSION_ID}`. |
| `cancel_url` | `${baseUrl}/checkout?canceled=true...` | Return page URL when the client cancels or goes back. |

---

## Configured Parameters

These parameters were configured in Checkout Studio and are already set in [src/lib/billing/stripe.ts](src/lib/billing/stripe.ts).

**Files containing these parameters:**
- [src/lib/billing/stripe.ts](src/lib/billing/stripe.ts)

| Parameter | Value |
|-----------|-------|
| `ui_mode` | `hosted_page` *(SDK version 21.0.0+ / Stripe API 2024-09+ standard)* |
| `mode` | `subscription` |
| `billing_address_collection` | `auto` |
| `phone_number_collection[enabled]` | `true` |
| `automatic_tax[enabled]` | `false` |
| `allow_promotion_codes` | `true` |
| `payment_method_collection` | `always` |
| `submit_type` | `auto` |
| `name_collection[individual][enabled]` | `true` |
| `integration_identifier` | `hosted_web_0001` |
| `origin_context` | `web` |

---

## Setup and Next Steps

### 1. Environment Variables & API Keys
Add the following keys to your `.env.local` file:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. How the Integration Works
1. **Initiate Checkout**: When a studio owner selects a plan in `/checkout`, the app sends a request to `/api/checkout/session`.
2. **Session Creation**: The server calls Stripe API (`POST /v1/checkout/sessions`) with all parameters specified above, applying 14-day free trial, BRL currency, and customer linking.
3. **Hosted Redirection**: The browser redirects to `checkout.stripe.com`, where Stripe securely renders Apple Pay, Google Pay, and Credit Cards with 3DS2.
4. **Webhook Processing**: Upon completion, Stripe sends `checkout.session.completed` to `/api/webhooks/stripe`, which activates the organization's subscription in the database.

### 3. Testing with Test Cards
In test mode (`pk_test_...` and `sk_test_...`), use official Stripe test cards:
- **Success Card**: `4242 4242 4242 4242`, any future MM/YY, any 3-digit CVC, any 5-digit ZIP.
- **3D Secure (3DS2)**: `4000 0027 6000 3184` to test two-factor authentication.
- **Declined Card**: `4000 0560 0000 0000` to test card failure and grace periods.

### 4. Next Steps
- Verify your webhook endpoint `https://luvea.app/api/webhooks/stripe` in the [Stripe Workbench](https://dashboard.stripe.com/workbench/webhooks) and ensure events `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, and `customer.subscription.deleted` are selected.
- Switch keys to live mode (`pk_live_...` and `sk_live_...`) when ready to accept real payments.

### 5. Resources
- [Stripe Support](https://support.stripe.com)
- [Stripe Checkout Documentation](https://docs.stripe.com/checkout)
- [Stripe Model Context Protocol (MCP)](https://docs.stripe.com/mcp)
