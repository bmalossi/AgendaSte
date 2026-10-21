-- ==============================================================================
-- MIGRATION: 20261021_multitenant_hardening.sql
-- PROVEDOR: Luvea.app (Supabase Postgres + Row Level Security)
-- OBJETIVO: Fechamento de Brechas de Segurança, Prevenção de Escalação de Tenant,
--           Proteção de PII de Clientes e RPCs Públicas Restritas
-- ==============================================================================

-- 1. BACKFILL: GARANTIR QUE USUÁRIOS EXISTENTES TENHAM ORGANIZAÇÃO E PERFIL
DO $$
DECLARE
  usr RECORD;
  new_org_id UUID;
  b_slug TEXT;
  final_slug TEXT;
  counter INT;
BEGIN
  FOR usr IN
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p.id IS NULL
  LOOP
    b_slug := lower(regexp_replace(
      COALESCE(usr.raw_user_meta_data->>'subdomain', usr.raw_user_meta_data->>'business_name', 'studio-' || substring(usr.id::text from 1 for 8)),
      '[^a-zA-Z0-9]+', '-', 'g'
    ));
    b_slug := trim(both '-' from b_slug);
    IF b_slug IS NULL OR b_slug = '' OR b_slug IN ('app', 'www', 'api', 'admin', 'auth', 'site') THEN
      b_slug := 'studio-' || substring(usr.id::text from 1 for 8);
    END IF;

    final_slug := b_slug;
    counter := 1;
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
      final_slug := b_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;

    INSERT INTO public.organizations (name, slug, plan_tier, subscription_status)
    VALUES (
      COALESCE(usr.raw_user_meta_data->>'business_name', 'Meu Estúdio'),
      final_slug,
      'gold',
      'trialing'
    )
    RETURNING id INTO new_org_id;

    INSERT INTO public.profiles (id, organization_id, full_name, role)
    VALUES (
      usr.id,
      new_org_id,
      COALESCE(usr.raw_user_meta_data->>'full_name', 'Profissional'),
      'owner'
    )
    ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id;

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
      usr.id,
      COALESCE(usr.raw_user_meta_data->>'full_name', 'Profissional'),
      '',
      COALESCE(usr.raw_user_meta_data->>'business_name', 'Meu Estúdio'),
      final_slug,
      COALESCE(usr.email, ''),
      ''
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 2. VINCULAR DADOS ÓRFÃOS EXISTENTES À ORGANIZAÇÃO DO SEU PROFISSIONAL
DO $$
DECLARE
  prof RECORD;
BEGIN
  FOR prof IN
    SELECT id, organization_id FROM public.professionals WHERE organization_id IS NOT NULL
  LOOP
    UPDATE public.clients SET organization_id = prof.organization_id WHERE professional_id = prof.id AND organization_id IS NULL;
    UPDATE public.appointments SET organization_id = prof.organization_id WHERE professional_id = prof.id AND organization_id IS NULL;
    UPDATE public.services SET organization_id = prof.organization_id WHERE organization_id IS NULL;
    UPDATE public.resources SET organization_id = prof.organization_id WHERE organization_id IS NULL;
  END LOOP;
END $$;

-- 3. TRAVA DE SEGURANÇA CONTRA TROCA DE TENANT EM PROFILES (PREVENÇÃO DE ESCALAÇÃO)
CREATE OR REPLACE FUNCTION public.prevent_profile_tenant_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Impede o usuário autenticado de alterar sua própria organization_id
  IF (auth.role() = 'authenticated') THEN
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'Segurança Luvea: Não é permitido alterar a organização do seu perfil.';
    END IF;
    IF NEW.role IS DISTINCT FROM OLD.role AND OLD.role != 'owner' THEN
      RAISE EXCEPTION 'Segurança Luvea: Apenas proprietários podem alterar papéis.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_profile_tenant_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_profile_tenant_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_tenant_escalation();

-- Remove a política de inserção direta no profiles por usuários (o trigger de signup faz isso de forma segura)
DROP POLICY IF EXISTS "Usuários podem criar seu perfil inicial" ON public.profiles;

-- Atualização de profiles restrita: usuário só pode atualizar o próprio perfil mantendo o mesmo tenant
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 4. TRAVA DE SEGURANÇA EM ORGANIZATIONS (IMPEDE ALTERAÇÃO DE PLANO OU DADOS DE COBRANÇA PELO FRONTEND)
CREATE OR REPLACE FUNCTION public.prevent_organization_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.role() = 'authenticated') THEN
    IF NEW.plan_tier IS DISTINCT FROM OLD.plan_tier THEN
      RAISE EXCEPTION 'Segurança Luvea: Alteração de plano restrita ao checkout oficial.';
    END IF;
    IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
      RAISE EXCEPTION 'Segurança Luvea: Alteração de status de assinatura restrita a webhooks oficiais.';
    END IF;
    IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN
      RAISE EXCEPTION 'Segurança Luvea: Identificadores de cobrança são somente leitura.';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Segurança Luvea: O identificador da organização não pode ser modificado.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_organization_tampering ON public.organizations;
CREATE TRIGGER trigger_prevent_organization_tampering
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_organization_tampering();

-- Donos e administradores só podem atualizar os dados cadastrais da sua organização
DROP POLICY IF EXISTS "Donos e administradores podem atualizar sua organização" ON public.organizations;
CREATE POLICY "Donos e administradores podem atualizar sua organização" ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    id = public.current_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    id = public.current_organization_id()
  );

-- 5. FECHAMENTO DAS POLÍTICAS INSEGURAS DE LEITURA PÚBLICA (ANON)
-- Removemos a leitura de todas as colunas de organizations e appointments por usuários anônimos
DROP POLICY IF EXISTS "Leitura pública de organizações para sites de agendamento" ON public.organizations;
DROP POLICY IF EXISTS "Public booking site read busy appointments" ON public.appointments;

-- 6. RPC PÚBLICA SEGURA PARA O SITE DE AGENDAMENTO (ZERO VAZAMENTO DE STRIPE OU DADOS SENSÍVEIS)
CREATE OR REPLACE FUNCTION public.get_public_studio_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  subscription_status TEXT,
  custom_domain TEXT,
  settings JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    id, 
    name, 
    slug, 
    phone, 
    whatsapp_number, 
    subscription_status, 
    custom_domain,
    -- Expõe apenas configurações públicas de agendamento e tema, removendo dados fiscais ou privados
    COALESCE(settings, '{}'::jsonb) - 'stripe_customer_id' - 'tax_id'
  FROM public.organizations
  WHERE slug = lower(trim(p_slug))
    AND subscription_status IN ('active', 'trialing')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_studio_by_slug(TEXT) TO anon, authenticated;

-- 7. RPC PÚBLICA SEGURA PARA VERIFICAÇÃO DE HORÁRIOS OCUPADOS (ZERO VAZAMENTO DE CLIENTES OU PII)
CREATE OR REPLACE FUNCTION public.get_public_busy_slots(
  p_org_id UUID,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
)
RETURNS TABLE (
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  resource_ids UUID[]
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT starts_at, ends_at, resource_ids
  FROM public.appointments
  WHERE organization_id = p_org_id
    AND starts_at >= p_start
    AND ends_at <= p_end
    AND status IN ('confirmed', 'completed', 'pending');
$$;

GRANT EXECUTE ON FUNCTION public.get_public_busy_slots(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;

-- 8. TRIGGER DE PROVISIONAMENTO COM LISTA DE SLUGS RESERVADOS E PROTEÇÃO DE FALHAS
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
  reserved_slugs TEXT[] := ARRAY[
    'app', 'www', 'api', 'admin', 'auth', 'site', 'dashboard', 'login',
    'cadastro', 'checkout', 'webhook', 'webhooks', 'mail', 'support',
    'status', 'luvea', 'agendaste', 'root', 'billing', 'settings'
  ];
BEGIN
  -- Extrair metadados com fallbacks seguros
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

  -- Se for slug reservado do sistema, adiciona prefixo
  IF base_slug = ANY(reserved_slugs) THEN
    base_slug := 'studio-' || base_slug;
  END IF;

  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  -- Bloco protegido com tratamento de exceção para nunca travar a criação da conta
  BEGIN
    INSERT INTO public.organizations (name, slug, plan_tier, subscription_status)
    VALUES (org_name, final_slug, 'gold', 'trialing')
    RETURNING id INTO new_org_id;

    INSERT INTO public.profiles (id, organization_id, full_name, role)
    VALUES (NEW.id, new_org_id, user_full_name, 'owner')
    ON CONFLICT (id) DO UPDATE
    SET organization_id = EXCLUDED.organization_id,
        full_name = EXCLUDED.full_name;

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
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erro no provisionamento automático do estúdio para usuário %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
