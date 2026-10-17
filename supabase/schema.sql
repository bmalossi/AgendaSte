-- =============================================================================
-- GLOSSGENIUS (EDIÇÃO BRASIL) — SUPABASE POSTGRESQL SCHEMA (RLS READY)
-- Alinhado a CONTEXT.md, ADR-0001 e ADR-0002
-- =============================================================================

create extension if not exists "uuid-ossp";

-- 1. ESTÚDIOS & PROFISSIONAIS (PROVIDERS / STAFF)
create table if not exists public.professionals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null default '',
  studio_name text not null,
  slug text unique not null,
  legal_entity_type text not null default 'Sociedade Limitada (LTDA) / Salão Parceiro',
  tax_id_cnpj_cpf text,
  role text not null default 'Proprietário & Especialista',
  email text not null,
  phone_whatsapp text not null,
  phone_verified boolean not null default true,
  avatar_color text not null default '#FBCFE8',
  pix_key text,
  default_deposit_percent integer not null default 30 check (default_deposit_percent between 0 and 100),
  service_commission_percent integer not null default 60 check (service_commission_percent between 0 and 100),
  product_commission_percent integer not null default 20 check (product_commission_percent between 0 and 100),
  weekly_goal_cents integer not null default 580000,
  whatsapp_session_status text not null default 'connected' check (whatsapp_session_status in ('connected', 'qr_pending', 'disconnected')),
  created_at timestamptz not null default now()
);

-- 2. RECURSOS FÍSICOS (SALAS E EQUIPAMENTOS — ADR-0002)
create table if not exists public.resources (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  name text not null,
  category text not null check (category in ('equipment', 'room')),
  description text,
  created_at timestamptz not null default now()
);

-- 3. CATÁLOGO DE SERVIÇOS (COM DURAÇÃO SEGMENTADA: PROCESSAMENTO + BLOQUEIO)
create table if not exists public.services (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  name text not null,
  description text,
  category text not null,
  calendar_color text not null default '#E11D8F',
  online_booking_enabled boolean not null default true,
  price_type text not null default 'fixed' check (price_type in ('fixed', 'starting_at', 'hidden')),
  price_cents integer not null,
  require_deposit boolean not null default false,
  deposit_cents integer not null default 0,
  duration_minutes integer not null default 60,
  processing_time_enabled boolean not null default false,
  processing_start_offset_minutes integer not null default 0,
  processing_duration_minutes integer not null default 0,
  block_time_enabled boolean not null default false,
  block_after_minutes integer not null default 0,
  required_resource_ids uuid[] not null default '{}',
  options jsonb not null default '[]'::jsonb,
  add_ons jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. PACOTES E ASSINATURAS (PACKAGES & MEMBERSHIPS)
create table if not exists public.packages (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  name text not null,
  description text,
  sell_on_website boolean not null default true,
  included_service_ids uuid[] not null default '{}',
  sessions_count integer not null default 3,
  price_cents integer not null,
  expiration_days integer not null default 180,
  terms_and_conditions text,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  name text not null,
  description text,
  monthly_price_cents integer not null,
  included_credits_per_month integer not null default 2,
  discount_percent_on_extras integer not null default 15,
  created_at timestamptz not null default now()
);

-- 5. CLIENTES, FICHA DE ATENDIMENTO E FOTOS AUTO-ORGANIZADAS
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  full_name text not null,
  email text,
  phone_whatsapp text not null,
  avatar_color text not null default '#FBCFE8',
  anamnesis_notes text,
  allergies_warnings text,
  preferences_notes text,
  birthday text,
  send_automatic_reminders boolean not null default true,
  last_visit_at timestamptz,
  total_spent_cents integer not null default 0,
  visits_count integer not null default 0,
  no_show_count integer not null default 0,
  auto_sorted_photos jsonb not null default '[]'::jsonb,
  package_credits jsonb not null default '[]'::jsonb,
  membership_subscriptions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 6. EVENTOS DE AGENDA (APPOINTMENT, PERSONAL BLOCK, WORKING HOURS, WAITLIST)
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  service_ids uuid[] not null default '{}',
  resource_ids uuid[] not null default '{}',
  event_type text not null default 'appointment' check (event_type in ('appointment', 'personal_block', 'working_hours', 'waitlist_entry')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active_duration_minutes integer not null default 60,
  processing_start_offset_minutes integer not null default 0,
  processing_duration_minutes integer not null default 0,
  block_after_minutes integer not null default 0,
  is_repeating boolean not null default false,
  status text not null default 'pending' check (status in ('confirmed', 'completed', 'pending', 'canceled', 'no_show')),
  total_cents integer not null default 0,
  deposit_cents integer not null default 0,
  deposit_paid boolean not null default false,
  payment_method text check (payment_method in ('pix', 'card', 'cash', 'package', 'gift_card')),
  whatsapp_reminder_sent boolean not null default false,
  whatsapp_client_reply text not null default 'none' check (whatsapp_client_reply in ('1_confirmed', '2_reschedule', 'none')),
  notes text,
  created_at timestamptz not null default now()
);

-- 7. LISTA DE ESPERA (WAITLIST)
create table if not exists public.waitlist_entries (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  preferred_date date not null,
  preferred_time_window text not null,
  notes text,
  created_at timestamptz not null default now()
);

-- 8. FATURAS (INVOICES), VALE-PRESENTES (GIFT CARDS) E COBRANÇAS PIX
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_number text not null,
  title text not null,
  memo text,
  due_date date not null,
  line_items jsonb not null default '[]'::jsonb,
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  status text not null default 'sent' check (status in ('draft', 'sent', 'paid', 'overdue')),
  payment_link_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.gift_cards (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  code text unique not null,
  recipient_name text not null,
  recipient_email text not null,
  initial_balance_cents integer not null,
  remaining_balance_cents integer not null,
  status text not null default 'active' check (status in ('active', 'redeemed')),
  created_at timestamptz not null default now()
);

create table if not exists public.pix_charges (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  provider text not null default 'mercadopago' check (provider in ('mercadopago', 'asaas')),
  external_reference text not null,
  amount_cents integer not null,
  qr_code_payload text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired')),
  paid_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- 9. CONTROLE DE PONTO (TIME TRACKING) E CAMPANHAS DE MARKETING
create table if not exists public.time_tracking_entries (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  work_date date not null default current_date,
  check_in_time text not null,
  check_out_time text,
  break_minutes integer not null default 0,
  total_worked_seconds integer not null default 0,
  status text not null default 'completed' check (status in ('clocked_in', 'on_break', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.marketing_campaigns (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  channel text not null check (channel in ('email', 'text')),
  subject text not null,
  message_body text not null,
  image_url text,
  audience_segment text not null default 'all',
  recipients_count integer not null default 1,
  status text not null default 'sent' check (status in ('draft', 'sent')),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
alter table public.professionals enable row level security;
alter table public.resources enable row level security;
alter table public.services enable row level security;
alter table public.packages enable row level security;
alter table public.memberships enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.invoices enable row level security;
alter table public.gift_cards enable row level security;
alter table public.pix_charges enable row level security;
alter table public.time_tracking_entries enable row level security;
alter table public.marketing_campaigns enable row level security;
