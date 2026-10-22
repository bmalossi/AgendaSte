-- ==============================================================================
-- MIGRATION: 20261022_tv_kiosk.sql
-- PROVEDOR: Luvea.app (Supabase Postgres + Row Level Security)
-- OBJETIVO: Tabela tv_pairings para o modo Kiosk TV e Pareamento de Telas
-- ==============================================================================

-- 1. TABELA DE PAREAMENTO DE TVS (LUVEA TV KIOSK)
CREATE TABLE IF NOT EXISTS public.tv_pairings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  device_name VARCHAR(100) DEFAULT 'Smart TV',
  status VARCHAR(20) DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'AUTHORIZED', 'EXPIRED', 'REVOKED')),
  token UUID DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_tv_pairings_code ON public.tv_pairings (code);
CREATE INDEX IF NOT EXISTS idx_tv_pairings_token ON public.tv_pairings (token);
CREATE INDEX IF NOT EXISTS idx_tv_pairings_organization_id ON public.tv_pairings (organization_id);
CREATE INDEX IF NOT EXISTS idx_tv_pairings_status ON public.tv_pairings (status);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.tv_pairings ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE RLS
-- Gestores e membros autenticados gerenciam apenas as TVs do seu estúdio
DROP POLICY IF EXISTS "Tenant isolation for tv_pairings" ON public.tv_pairings;
CREATE POLICY "Tenant isolation for tv_pairings"
  ON public.tv_pairings
  FOR ALL
  TO authenticated
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

-- TV não autenticada pode criar código de pareamento temporário pendente
DROP POLICY IF EXISTS "Anonymous TV can create pairing code" ON public.tv_pairings;
CREATE POLICY "Anonymous TV can create pairing code"
  ON public.tv_pairings
  FOR INSERT
  TO anon
  WITH CHECK (status = 'PENDING' AND organization_id IS NULL);

-- 4. TRIGGER PARA ATUALIZAR updated_at
DROP TRIGGER IF EXISTS trigger_tv_pairings_updated_at ON public.tv_pairings;
CREATE TRIGGER trigger_tv_pairings_updated_at
  BEFORE UPDATE ON public.tv_pairings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
