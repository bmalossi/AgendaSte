-- =============================================================================
-- VELOCE AGENDA & RETENÇÃO OPERACIONAL — SUPABASE POSTGRESQL SCHEMA (RLS READY)
-- Módulos:
--   A. Agenda Inteligente & Checkout Rápido (1-Tap Rebooking)
--   B. Motor de Robô WhatsApp 2-Way Sync (QR Code Baileys / Evolution API)
--   C. Máquina Anti-No-Show (Taxa de Reserva via Pix Dinâmico)
--   D. Financeiro Proativo & CRM (Prontuário, Anamnese, Fotos Antes & Depois)
-- =============================================================================

create extension if not exists "uuid-ossp";

-- 1. PERFIS DE PROFISSIONAIS / ESTÚDIOS (TENANTS)
create table if not exists public.professionals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  studio_name text not null,
  slug text unique not null,
  specialty text not null default 'Estética & Bem-Estar',
  phone_whatsapp text not null,
  pix_key text,
  default_deposit_percent integer not null default 30 check (default_deposit_percent between 0 and 100),
  whatsapp_session_status text not null default 'connected' check (whatsapp_session_status in ('connected', 'qr_pending', 'disconnected')),
  whatsapp_last_sync_at timestamptz default now(),
  created_at timestamptz not null default now()
);

-- 2. CATÁLOGO DE SERVIÇOS E PROTOCOLOS
create table if not exists public.services (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  name text not null,
  category text not null,
  duration_minutes integer not null default 60,
  price_cents integer not null,
  deposit_cents integer not null default 0,
  suggested_return_days integer not null default 30,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. CLIENTES & PRONTUÁRIO (CRM + ANAMNESE + REATIVAÇÃO)
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  full_name text not null,
  phone_whatsapp text not null,
  anamnesis_notes text,
  allergies_warnings text,
  preferences_notes text,
  last_visit_at timestamptz,
  total_spent_cents integer not null default 0,
  visits_count integer not null default 0,
  no_show_count integer not null default 0,
  before_photo_url text,
  after_photo_url text,
  created_at timestamptz not null default now()
);

-- 4. AGENDAMENTOS (BLOCOS HORÁRIOS + STATUS SEMÂNTICO + SINAL PIX + WHATSAPP 2-WAY)
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- Status semântico funcional:
  -- 'confirmed' (Verde: Confirmado / Sinal Pago)
  -- 'completed' (Verde: Concluído & Pago no Checkout)
  -- 'pending'   (Amarelo: Aguardando resposta no WhatsApp ou Sinal Pix)
  -- 'risk'      (Vermelho: Falta / No-show / Inadimplente / Cancelado em cima da hora)
  status text not null default 'pending' check (status in ('confirmed', 'completed', 'pending', 'risk')),
  total_cents integer not null,
  deposit_cents integer not null default 0,
  deposit_paid boolean not null default false,
  payment_status text not null default 'pending' check (payment_status in ('paid', 'deposit_paid', 'pending', 'overdue')),
  payment_method text check (payment_method in ('pix', 'card', 'cash')),
  whatsapp_reminder_24h_sent boolean not null default false,
  whatsapp_reminder_2h_sent boolean not null default false,
  whatsapp_client_reply text check (whatsapp_client_reply in ('1_confirmed', '2_reschedule', 'none')),
  rebooked_next_appointment_id uuid references public.appointments(id) on delete set null,
  clinical_session_notes text,
  created_at timestamptz not null default now()
);

-- 5. COBRANÇAS PIX DINÂMICAS (MÁQUINA ANTI-NO-SHOW)
create table if not exists public.pix_charges (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  provider text not null default 'mercadopago' check (provider in ('mercadopago', 'asaas')),
  external_reference text not null,
  amount_cents integer not null,
  qr_code_payload text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired')),
  paid_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- 6. LOGS DE AUTOMAÇÃO WHATSAPP 2-WAY SYNC
create table if not exists public.whatsapp_Dispatch_logs (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  direction text not null check (direction in ('outbound', 'inbound')),
  template_type text not null check (template_type in ('reminder_24h', 'reminder_2h', 'pix_deposit', 'reactivation_45d', 'rebooking_confirmation', 'inbound_reply')),
  message_body text not null,
  delivery_status text not null default 'delivered' check (delivery_status in ('queued', 'sent', 'delivered', 'read', 'replied')),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
alter table public.professionals enable row level security;
alter table public.services enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.pix_charges enable row level security;
alter table public.whatsapp_Dispatch_logs enable row level security;

create policy "Profissional acessa próprio perfil"
  on public.professionals for all
  using (auth.uid() = user_id);

create policy "Profissional gerencia próprios serviços"
  on public.services for all
  using (professional_id in (select id from public.professionals where user_id = auth.uid()));

create policy "Profissional gerencia próprios clientes"
  on public.clients for all
  using (professional_id in (select id from public.professionals where user_id = auth.uid()));

create policy "Profissional gerencia própria agenda"
  on public.appointments for all
  using (professional_id in (select id from public.professionals where user_id = auth.uid()));
