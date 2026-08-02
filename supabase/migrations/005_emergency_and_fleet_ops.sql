-- TrackFlow Web — Migration 005
-- Emergency contacts (for SOS alerts) and fleet operations logs:
-- fuel, maintenance reminders, expenses, vehicle health checks.

create table if not exists public.emergency_contacts (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

alter table public.emergency_contacts enable row level security;
drop policy if exists "emergency_contacts_owner_all" on public.emergency_contacts;
create policy "emergency_contacts_owner_all" on public.emergency_contacts
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table if not exists public.fuel_logs (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  liters numeric(8, 2) not null,
  cost numeric(10, 2) not null,
  odometer_km numeric(10, 1),
  logged_at timestamptz not null default now()
);

create table if not exists public.maintenance_reminders (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  title text not null,
  due_date date,
  due_odometer_km numeric(10, 1),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.expense_logs (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  category text not null default 'other' check (category in ('fuel', 'maintenance', 'toll', 'parking', 'other')),
  amount numeric(10, 2) not null,
  note text,
  logged_at timestamptz not null default now()
);

create table if not exists public.vehicle_health_logs (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  odometer_km numeric(10, 1),
  tire_condition text check (tire_condition in ('good', 'worn', 'needs_replacement')),
  engine_status text check (engine_status in ('good', 'warning', 'critical')),
  notes text,
  logged_at timestamptz not null default now()
);

alter table public.fuel_logs enable row level security;
alter table public.maintenance_reminders enable row level security;
alter table public.expense_logs enable row level security;
alter table public.vehicle_health_logs enable row level security;

drop policy if exists "fuel_logs_owner_all" on public.fuel_logs;
create policy "fuel_logs_owner_all" on public.fuel_logs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "maintenance_owner_all" on public.maintenance_reminders;
create policy "maintenance_owner_all" on public.maintenance_reminders
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "expenses_owner_all" on public.expense_logs;
create policy "expenses_owner_all" on public.expense_logs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "vehicle_health_owner_all" on public.vehicle_health_logs;
create policy "vehicle_health_owner_all" on public.vehicle_health_logs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
