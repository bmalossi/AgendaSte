-- ==============================================================================
-- MIGRATION: 20261105_subscription_pause_cancel_reason.sql
-- OBJETIVO: Suporte a Pausa de Assinatura (Modo Hibernação) e motivo de cancelamento
-- Corrige: colunas paused_until / cancel_reason inexistentes e CHECK sem 'paused'
-- ==============================================================================

-- 1. Novas colunas em public.organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS paused_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 2. Amplia o CHECK de subscription_status para aceitar 'paused'
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'organizations'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%subscription_status%'
  LOOP
    EXECUTE format('ALTER TABLE public.organizations DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_subscription_status_check
  CHECK (subscription_status IN ('trialing', 'active', 'paused', 'past_due', 'canceled', 'incomplete'));

CREATE INDEX IF NOT EXISTS idx_organizations_paused_until ON public.organizations (paused_until);
