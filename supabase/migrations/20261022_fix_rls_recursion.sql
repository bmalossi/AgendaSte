-- ==============================================================================
-- MIGRATION: 20261022_fix_rls_recursion.sql
-- PROVEDOR: Luvea.app (Supabase Postgres + Row Level Security)
-- OBJETIVO: 
--   1. Eliminar recursão infinita (42P17 / HTTP 500) nas políticas RLS de profiles e organizations
--   2. Garantir função SECURITY DEFINER public.current_organization_id()
--   3. Garantir tabela tv_pairings para o modo Kiosk TV
-- ==============================================================================

-- 1. FUNÇÃO SECURITY DEFINER PARA OBTER A ORGANIZAÇÃO (BYPASSA RLS DE PROFILES)
CREATE OR REPLACE FUNCTION public.current_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. CORREÇÃO DA POLÍTICA DE LEITURA EM PROFILES (SEM AUTO-SUBQUERY RECURSIVA)
DROP POLICY IF EXISTS "Usuários podem ver perfis da sua organização" ON public.profiles;
CREATE POLICY "Usuários podem ver perfis da sua organização" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR organization_id = public.current_organization_id()
  );

-- 3. CORREÇÃO DA POLÍTICA DE LEITURA EM ORGANIZATIONS (USA SECURITY DEFINER)
DROP POLICY IF EXISTS "Usuários podem ver sua própria organização" ON public.organizations;
CREATE POLICY "Usuários podem ver sua própria organização" ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id = public.current_organization_id()
  );

-- 4. TABELA DE PAREAMENTO DE TVS (LUVEA TV KIOSK) SE AINDA NÃO EXISTIR
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

CREATE INDEX IF NOT EXISTS idx_tv_pairings_code ON public.tv_pairings (code);
CREATE INDEX IF NOT EXISTS idx_tv_pairings_token ON public.tv_pairings (token);
CREATE INDEX IF NOT EXISTS idx_tv_pairings_organization_id ON public.tv_pairings (organization_id);
CREATE INDEX IF NOT EXISTS idx_tv_pairings_status ON public.tv_pairings (status);

ALTER TABLE public.tv_pairings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for tv_pairings" ON public.tv_pairings;
CREATE POLICY "Tenant isolation for tv_pairings"
  ON public.tv_pairings
  FOR ALL
  TO authenticated
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS "Anonymous TV can create pairing code" ON public.tv_pairings;
CREATE POLICY "Anonymous TV can create pairing code"
  ON public.tv_pairings
  FOR INSERT
  TO anon
  WITH CHECK (status = 'PENDING' AND organization_id IS NULL);
