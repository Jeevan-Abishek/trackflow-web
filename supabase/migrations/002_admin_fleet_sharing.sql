-- TrackFlow Web — Migration 002
-- Adds: role-based access, vehicles, drivers, geofencing, audit logging,
-- notifications, and richer share-link controls (password, one-time, views).
-- Run AFTER supabase/schema.sql. Idempotent — safe to re-run.

create extension if not exists "pgcrypto"; -- for crypt()/gen_salt() password hashing

-- =========================================================
-- ROLES
-- =========================================================
alter table public.profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

create or replace function public.is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- =========================================================
-- VEHICLES & DRIVERS  (Fleet management)
-- =========================================================
create table if not exists public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  vehicle_type text not null default 'car' check (vehicle_type in ('car', 'bike', 'truck', 'van', 'other')),
  plate_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.drivers (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  phone text,
  license_number text,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  score numeric(4, 1) not null default 100.0 check (score between 0 and 100),
  created_at timestamptz not null default now()
);

alter table public.trips
  add column if not exists vehicle_id uuid references public.vehicles (id) on delete set null,
  add column if not exists driver_id uuid references public.drivers (id) on delete set null;

alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;

drop policy if exists "vehicles_owner_all" on public.vehicles;
create policy "vehicles_owner_all" on public.vehicles
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "vehicles_admin_read" on public.vehicles;
create policy "vehicles_admin_read" on public.vehicles for select using (public.is_admin());

drop policy if exists "drivers_owner_all" on public.drivers;
create policy "drivers_owner_all" on public.drivers
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "drivers_admin_read" on public.drivers;
create policy "drivers_admin_read" on public.drivers for select using (public.is_admin());

-- =========================================================
-- GEOFENCES
-- =========================================================
create table if not exists public.geofences (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete cascade,
  name text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  radius_m double precision not null default 200,
  created_at timestamptz not null default now()
);

alter table public.geofences enable row level security;
drop policy if exists "geofences_owner_all" on public.geofences;
create policy "geofences_owner_all" on public.geofences
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Geofence events (fired when a trip's location enters/exits a geofence)
create table if not exists public.geofence_events (
  id bigint generated always as identity primary key,
  geofence_id uuid not null references public.geofences (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  event_type text not null check (event_type in ('enter', 'exit')),
  created_at timestamptz not null default now()
);

alter table public.geofence_events enable row level security;
drop policy if exists "geofence_events_owner_read" on public.geofence_events;
create policy "geofence_events_owner_read" on public.geofence_events
  for select using (
    exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid())
  );
drop policy if exists "geofence_events_owner_insert" on public.geofence_events;
create policy "geofence_events_owner_insert" on public.geofence_events
  for insert with check (
    exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid())
  );

-- =========================================================
-- AUDIT LOGS
-- =========================================================
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;
drop policy if exists "audit_logs_admin_read" on public.audit_logs;
create policy "audit_logs_admin_read" on public.audit_logs for select using (public.is_admin());
drop policy if exists "audit_logs_self_insert" on public.audit_logs;
create policy "audit_logs_self_insert" on public.audit_logs
  for insert with check (actor_id = auth.uid());

create or replace function public.log_audit(p_action text, p_entity_type text, p_entity_id text, p_metadata jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata);
end;
$$;

-- =========================================================
-- NOTIFICATIONS  (in-app center + web-push subscriptions)
-- =========================================================
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  severity text not null default 'info' check (severity in ('info', 'warn', 'critical')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
drop policy if exists "notifications_owner_all" on public.notifications;
create policy "notifications_owner_all" on public.notifications
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
drop policy if exists "push_subs_owner_all" on public.push_subscriptions;
create policy "push_subs_owner_all" on public.push_subscriptions
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- =========================================================
-- API KEYS  (Public API access, hashed at rest)
-- =========================================================
create table if not exists public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  revoked boolean not null default false,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.api_keys enable row level security;
drop policy if exists "api_keys_owner_all" on public.api_keys;
create policy "api_keys_owner_all" on public.api_keys
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Issues a new API key. Returns the plaintext key ONCE — only the hash is stored.
create or replace function public.create_api_key(p_name text)
returns table (id uuid, plaintext_key text)
language plpgsql
security definer set search_path = public
as $$
declare
  v_secret text := encode(gen_random_bytes(24), 'hex');
  v_prefix text := substr(v_secret, 1, 8);
  v_id uuid;
begin
  insert into public.api_keys (owner_id, name, key_hash, key_prefix)
  values (auth.uid(), p_name, crypt(v_secret, gen_salt('bf')), v_prefix)
  returning public.api_keys.id into v_id;

  return query select v_id, ('tf_' || v_secret);
end;
$$;

-- Verifies `tf_<secret>` against stored hashes; returns the owning profile id or null.
create or replace function public.verify_api_key(p_key text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_secret text := replace(p_key, 'tf_', '');
  v_row record;
begin
  for v_row in select * from public.api_keys where revoked = false loop
    if v_row.key_hash = crypt(v_secret, v_row.key_hash) then
      update public.api_keys set last_used_at = now() where id = v_row.id;
      return v_row.owner_id;
    end if;
  end loop;
  return null;
end;
$$;

-- =========================================================
-- RICHER SHARE LINKS: password protection, one-time, view caps
-- =========================================================
alter table public.trip_shares
  add column if not exists password_hash text,
  add column if not exists one_time boolean not null default false,
  add column if not exists max_views integer,
  add column if not exists view_count integer not null default 0;

create or replace function public.set_share_password(p_share_id uuid, p_password text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.trip_shares s
  set password_hash = case when p_password is null or p_password = '' then null else crypt(p_password, gen_salt('bf')) end
  from public.trips t
  where s.id = p_share_id and s.trip_id = t.id and t.owner_id = auth.uid();
end;
$$;

-- Resolves a share token (+ optional password) into the trip + locations,
-- bypassing RLS via SECURITY DEFINER. This is what makes password-protected
-- and one-time links possible without exposing the trip row to anon reads.
create or replace function public.get_shared_trip(p_token text, p_password text default null)
returns table (
  trip_id uuid, title text, status text, started_at timestamptz, ended_at timestamptz,
  total_distance_m double precision, max_speed_kmh double precision, avg_speed_kmh double precision,
  requires_password boolean, ok boolean, reason text
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_share record;
  v_trip record;
begin
  select * into v_share from public.trip_shares where share_token = p_token and revoked = false;

  if v_share is null then
    return query select null, null, null, null, null, null::double precision, null::double precision, null::double precision, false, false, 'not_found';
    return;
  end if;

  if v_share.expires_at is not null and v_share.expires_at < now() then
    return query select null, null, null, null, null, null::double precision, null::double precision, null::double precision, false, false, 'expired';
    return;
  end if;

  if v_share.max_views is not null and v_share.view_count >= v_share.max_views then
    return query select null, null, null, null, null, null::double precision, null::double precision, null::double precision, false, false, 'view_limit_reached';
    return;
  end if;

  if v_share.password_hash is not null then
    if p_password is null or v_share.password_hash <> crypt(p_password, v_share.password_hash) then
      return query select null, null, null, null, null, null::double precision, null::double precision, null::double precision, true, false, 'password_required';
      return;
    end if;
  end if;

  select * into v_trip from public.trips where id = v_share.trip_id and is_public = true;
  if v_trip is null then
    return query select null, null, null, null, null, null::double precision, null::double precision, null::double precision, false, false, 'not_public';
    return;
  end if;

  update public.trip_shares set view_count = view_count + 1 where id = v_share.id;
  if v_share.one_time then
    update public.trip_shares set revoked = true where id = v_share.id;
  end if;

  return query select v_trip.id, v_trip.title, v_trip.status, v_trip.started_at, v_trip.ended_at,
    v_trip.total_distance_m, v_trip.max_speed_kmh, v_trip.avg_speed_kmh, false, true, 'ok';
end;
$$;

create or replace function public.get_shared_locations(p_token text, p_password text default null, p_since timestamptz default null)
returns setof public.locations
language plpgsql
security definer set search_path = public
as $$
declare
  v_share record;
begin
  select * into v_share from public.trip_shares where share_token = p_token and revoked = false;
  if v_share is null then return; end if;
  if v_share.expires_at is not null and v_share.expires_at < now() then return; end if;
  if v_share.password_hash is not null and (p_password is null or v_share.password_hash <> crypt(p_password, v_share.password_hash)) then
    return;
  end if;

  return query
    select l.* from public.locations l
    join public.trips t on t.id = l.trip_id
    where l.trip_id = v_share.trip_id and t.is_public = true
      and (p_since is null or l.recorded_at > p_since)
    order by l.recorded_at asc;
end;
$$;

-- =========================================================
-- ADMIN-WIDE READ ACCESS (dashboard needs cross-tenant visibility)
-- =========================================================
drop policy if exists "trips_admin_read" on public.trips;
create policy "trips_admin_read" on public.trips for select using (public.is_admin());
drop policy if exists "locations_admin_read" on public.locations;
create policy "locations_admin_read" on public.locations for select using (public.is_admin());
drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read" on public.profiles for select using (public.is_admin());
