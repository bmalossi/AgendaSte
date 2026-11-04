-- ==============================================================================
-- MIGRATION: 20261103_saas_subscription_billing.sql
-- PROVEDOR: Luvea.app (Supabase Postgres + Row Level Security)
-- OBJETIVO: Ciclo de Plano SaaS, Faturas do Plano, Idempotência e Auditoria
-- ==============================================================================

-- 1. EXTENSÃO DA TABELA public.organizations COM CAMPOS DE CICLO E GOVERNANÇA
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_plan_tier TEXT CHECK (scheduled_plan_tier IN ('essencial', 'gold', 'platinum')),
  ADD COLUMN IF NOT EXISTS scheduled_billing_cycle TEXT CHECK (scheduled_billing_cycle IN ('monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS mp_payer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_organizations_current_period_end ON public.organizations (current_period_end);
CREATE INDEX IF NOT EXISTS idx_organizations_grace_period_ends_at ON public.organizations (grace_period_ends_at);

-- 2. TABELA DE FATURAS DO PLANO (PLAN INVOICES)
CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL CHECK (gateway IN ('stripe', 'mercadopago', 'mock')),
  external_invoice_id TEXT UNIQUE,
  external_payment_id TEXT,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('essencial', 'gold', 'platinum')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount_cents INTEGER NOT NULL,
  proration_credit_cents INTEGER NOT NULL DEFAULT 0,
  bonus_trial_days_applied INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'void', 'refunded', 'failed')),
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  pix_ticket_url TEXT,
  pix_expires_at TIMESTAMPTZ,
  hosted_invoice_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_org_id ON public.subscription_invoices (organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON public.subscription_invoices (status);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_ext_id ON public.subscription_invoices (external_invoice_id);

-- 3. TABELA DE EVENTOS DE WEBHOOK (TRAVA DE IDEMPOTÊNCIA)
CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT billing_webhook_events_gateway_event_unique UNIQUE (gateway, event_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_lookup ON public.billing_webhook_events (gateway, event_id);

-- 4. HABILITAÇÃO DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE RLS PARA subscription_invoices
-- Leitura autorizada apenas para membros 'owner' ou 'admin' da respectiva organização
DROP POLICY IF EXISTS "Membros da organização podem ver suas faturas do plano" ON public.subscription_invoices;
CREATE POLICY "Membros da organização podem ver suas faturas do plano" ON public.subscription_invoices
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Escrita restrita ao backend (service_role ignora RLS; bloqueia inserção/atualização direta de anon/auth)
DROP POLICY IF EXISTS "Apenas backend service_role pode gravar faturas do plano" ON public.subscription_invoices;
CREATE POLICY "Apenas backend service_role pode gravar faturas do plano" ON public.subscription_invoices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. POLÍTICAS DE RLS PARA billing_webhook_events
-- Acesso restrito ao backend service_role
DROP POLICY IF EXISTS "Apenas backend service_role pode acessar eventos de webhook" ON public.billing_webhook_events;
CREATE POLICY "Apenas backend service_role pode acessar eventos de webhook" ON public.billing_webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. TRIGGER AUTOMÁTICO PARA ATUALIZAR updated_at EM subscription_invoices
DROP TRIGGER IF EXISTS trigger_subscription_invoices_updated_at ON public.subscription_invoices;
CREATE TRIGGER trigger_subscription_invoices_updated_at
  BEFORE UPDATE ON public.subscription_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
