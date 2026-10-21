-- ==============================================================================
-- MIGRATION: 20261021_multitenant_rls_isolation.sql
-- PROVEDOR: Luvea.app (Supabase Postgres + Row Level Security)
-- OBJETIVO: Isolamento Multi-Tenant Estrito, RLS em todas as tabelas e Provisionamento Automático
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. GARANTIR ESTRUTURA BASE (organizations e profiles)
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

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations (slug);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles (organization_id);

-- 3. ADICIONAR organization_id EM TODAS AS 16 TABELAS DE DADOS
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'professionals', 'resources', 'services', 'packages', 'memberships',
    'clients', 'appointments', 'waitlist_entries', 'invoices', 'gift_cards',
    'pix_charges', 'sales_history', 'inventory_items', 'time_tracking_entries',
    'marketing_campaigns', 'reception_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;', t);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_organization_id ON public.%I (organization_id);', t, t);
    END IF;
  END LOOP;
END $$;

-- 4. FUNÇÃO SECURITY DEFINER PARA OBTER A ORGANIZAÇÃO DO USUÁRIO LOGADO
CREATE OR REPLACE FUNCTION public.current_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 5. TRIGGER DE PROVISIONAMENTO AUTOMÁTICO DE TENANT NO CADASTRO (auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user_provisioning()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  desired_slug TEXT;
  clean_slug TEXT;
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 1;
  org_name TEXT;
  user_full_name TEXT;
BEGIN
  -- Extrair metadados passados no signUp
  org_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'business_name'), ''), 'Meu Estúdio');
  user_full_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'Profissional');
  desired_slug := NULLIF(TRIM(NEW.raw_user_meta_data->>'subdomain'), '');

  IF desired_slug IS NULL OR desired_slug = '' THEN
    base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    IF base_slug IS NULL OR base_slug = '' THEN
      base_slug := 'studio-' || substring(NEW.id::text from 1 for 8);
    END IF;
  ELSE
    base_slug := lower(regexp_replace(desired_slug, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
  END IF;

  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  -- 1. Cria a Organização do Estúdio
  INSERT INTO public.organizations (name, slug, plan_tier, subscription_status)
  VALUES (org_name, final_slug, 'gold', 'trialing')
  RETURNING id INTO new_org_id;

  -- 2. Cria o Perfil do Usuário vinculado à Organização
  INSERT INTO public.profiles (id, organization_id, full_name, role)
  VALUES (NEW.id, new_org_id, user_full_name, 'owner')
  ON CONFLICT (id) DO UPDATE
  SET organization_id = EXCLUDED.organization_id,
      full_name = EXCLUDED.full_name;

  -- 3. Cria o Profissional Administrador padrão vinculado à Organização
  INSERT INTO public.professionals (
    organization_id,
    user_id,
    first_name,
    last_name,
    studio_name,
    slug,
    email,
    phone_whatsapp
  )
  VALUES (
    new_org_id,
    NEW.id,
    user_full_name,
    '',
    org_name,
    final_slug,
    COALESCE(NEW.email, ''),
    ''
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_provision ON auth.users;
CREATE TRIGGER on_auth_user_created_provision
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_provisioning();

-- 6. REMOVER AS POLÍTICAS INSEGURAS DE DESENVOLVIMENTO (ENABLE FULL ACCESS FOR DEV AND ANON)
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'professionals', 'resources', 'services', 'packages', 'memberships',
    'clients', 'appointments', 'waitlist_entries', 'invoices', 'gift_cards',
    'pix_charges', 'sales_history', 'inventory_items', 'time_tracking_entries',
    'marketing_campaigns', 'reception_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "Enable full access for dev and anon" ON public.%I;', t);
      EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation for authenticated users" ON public.%I;', t);
      EXECUTE format('DROP POLICY IF EXISTS "Public site read access" ON public.%I;', t);
      EXECUTE format('DROP POLICY IF EXISTS "Public site booking access" ON public.%I;', t);
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END IF;
  END LOOP;
END $$;

-- 7. APLICAR POLÍTICAS DE ISOLAMENTO RIGOROSO MULTI-TENANT PARA USUÁRIOS AUTENTICADOS
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'professionals', 'resources', 'services', 'packages', 'memberships',
    'clients', 'appointments', 'waitlist_entries', 'invoices', 'gift_cards',
    'pix_charges', 'sales_history', 'inventory_items', 'time_tracking_entries',
    'marketing_campaigns', 'reception_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('
        CREATE POLICY "Tenant isolation for authenticated users" ON public.%I
        FOR ALL
        TO authenticated
        USING (organization_id = public.current_organization_id())
        WITH CHECK (organization_id = public.current_organization_id());
      ', t);
    END IF;
  END LOOP;
END $$;

-- 8. POLÍTICAS DE ACESSO PÚBLICO SELETIVO PARA O SITE DE AGENDAMENTO (*.luvea.app)

-- Catálogo de Serviços: clientes anônimos podem visualizar apenas serviços ativos de estúdios ativos
DROP POLICY IF EXISTS "Public booking site read services" ON public.services;
CREATE POLICY "Public booking site read services" ON public.services
  FOR SELECT
  TO anon
  USING (
    active = true AND
    organization_id IN (
      SELECT id FROM public.organizations WHERE subscription_status IN ('active', 'trialing')
    )
  );

-- Profissionais: clientes anônimos podem visualizar profissionais para agendar
DROP POLICY IF EXISTS "Public booking site read professionals" ON public.professionals;
CREATE POLICY "Public booking site read professionals" ON public.professionals
  FOR SELECT
  TO anon
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE subscription_status IN ('active', 'trialing')
    )
  );

-- Recursos físicos: leitura para trava de conflitos de horário
DROP POLICY IF EXISTS "Public booking site read resources" ON public.resources;
CREATE POLICY "Public booking site read resources" ON public.resources
  FOR SELECT
  TO anon
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE subscription_status IN ('active', 'trialing')
    )
  );

-- Horários Ocupados (Appointments): clientes anônimos podem consultar horários para verificar disponibilidade
DROP POLICY IF EXISTS "Public booking site read busy appointments" ON public.appointments;
CREATE POLICY "Public booking site read busy appointments" ON public.appointments
  FOR SELECT
  TO anon
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE subscription_status IN ('active', 'trialing')
    )
  );

-- Inserção de Agendamentos Públicos: clientes anônimos podem agendar no estúdio correspondente
DROP POLICY IF EXISTS "Public booking site create appointment" ON public.appointments;
CREATE POLICY "Public booking site create appointment" ON public.appointments
  FOR INSERT
  TO anon
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE subscription_status IN ('active', 'trialing')
    )
  );

-- Inserção de Clientes Públicos: clientes anônimos podem cadastrar seus dados de contato ao agendar
DROP POLICY IF EXISTS "Public booking site create client" ON public.clients;
CREATE POLICY "Public booking site create client" ON public.clients
  FOR INSERT
  TO anon
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE subscription_status IN ('active', 'trialing')
    )
  );
