-- ==============================================================================
-- MIGRATION: 20261020_auth_multitenant_checkout.sql
-- PROVEDOR: Luvea.app (Supabase Postgres + Row Level Security)
-- OBJETIVO: Provisionamento Multi-Tenant, Perfis de Usuários, Assinaturas e RLS
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABELA DE ORGANIZAÇÕES / TENANTS (ESTÚDIOS)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan_tier TEXT NOT NULL DEFAULT 'gold' CHECK (plan_tier IN ('essencial', 'gold', 'platinum', 'solo', 'studio')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  subscription_status TEXT NOT NULL DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  payment_gateway TEXT DEFAULT 'stripe' CHECK (payment_gateway IN ('stripe', 'mercadopago', 'asaas', 'pix_manual')),
  cpf_cnpj TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  custom_domain TEXT UNIQUE,
  settings JSONB DEFAULT '{}'::jsonb,
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de consulta rápida por slug (resolução de subdomínio) e status
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations (slug);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON public.organizations (subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON public.organizations (stripe_customer_id);

-- 3. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'staff', 'receptionist')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles (organization_id);

-- 4. HABILITAÇÃO DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE RLS PARA ORGANIZATIONS
-- Usuários autenticados podem ver apenas sua própria organização
DROP POLICY IF EXISTS "Usuários podem ver sua própria organização" ON public.organizations;
CREATE POLICY "Usuários podem ver sua própria organização" ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Donos e administradores podem atualizar os dados da sua organização
DROP POLICY IF EXISTS "Donos e administradores podem atualizar sua organização" ON public.organizations;
CREATE POLICY "Donos e administradores podem atualizar sua organização" ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Leitura pública de metadados básicos para renderizar o site de agendamento online público (*.luvea.app)
DROP POLICY IF EXISTS "Leitura pública de organizações para sites de agendamento" ON public.organizations;
CREATE POLICY "Leitura pública de organizações para sites de agendamento" ON public.organizations
  FOR SELECT
  TO anon
  USING (
    subscription_status IN ('active', 'trialing')
  );

-- 6. POLÍTICAS DE RLS PARA PROFILES
-- Usuários podem ver perfis da sua organização
DROP POLICY IF EXISTS "Usuários podem ver perfis da sua organização" ON public.profiles;
CREATE POLICY "Usuários podem ver perfis da sua organização" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Usuários podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Inserção de perfil (permitida para o próprio usuário durante registro)
DROP POLICY IF EXISTS "Usuários podem criar seu perfil inicial" ON public.profiles;
CREATE POLICY "Usuários podem criar seu perfil inicial" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 7. TRIGGER AUTOMÁTICO PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_organizations_updated_at ON public.organizations;
CREATE TRIGGER trigger_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
