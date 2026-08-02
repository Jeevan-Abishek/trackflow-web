-- TrackFlow Web — Phase 1 (MVP) schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Safe to re-run: guarded with IF NOT EXISTS / DROP ... IF EXISTS where sensible.

create extension if not exists "uuid-ossp";

-- =========================================================
-- PROFILES
-- One row per authenticated user, mirrors auth.users.
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- TRIPS
-- A tracking "session". is_public controls whether an active
-- share link makes the trip + its locations world-readable.
-- =========================================================
create table if not exists public.trips (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled trip',
  status text not null default 'active' check (status in ('active', 'ended')),
  is_public boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_distance_m double precision not null default 0,
  max_speed_kmh double precision not null default 0,
  avg_speed_kmh double precision not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists trips_owner_idx on public.trips (owner_id, created_at desc);

-- =========================================================
-- TRIP SHARES
-- One (or more) share links per trip. share_token is the
-- unguessable secret embedded in the public URL.
-- =========================================================
create table if not exists public.trip_shares (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  share_token text not null unique default replace(uuid_generate_v4()::text, '-', ''),
  revoked boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists trip_shares_token_idx on public.trip_shares (share_token);
create index if not exists trip_shares_trip_idx on public.trip_shares (trip_id);

-- =========================================================
-- LOCATIONS
-- Append-only GPS pings for a trip. Realtime is enabled on
-- this table so subscribers get inserts as they land.
-- =========================================================
create table if not exists public.locations (
  id bigint generated always as identity primary key,
  trip_id uuid not null references public.trips (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  speed_kmh double precision,
  heading double precision,
  accuracy_m double precision,
  recorded_at timestamptz not null default now()
);

create index if not exists locations_trip_time_idx on public.locations (trip_id, recorded_at desc);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_shares enable row level security;
alter table public.locations enable row level security;

-- Profiles: a user can read/update only their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Trips: owners have full read/write access to their own trips.
drop policy if exists "trips_owner_all" on public.trips;
create policy "trips_owner_all" on public.trips
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Trips: anyone (including anon) may read a trip while it is
-- flagged public. This is what makes the live map + realtime
-- subscription work for someone who only has the share link.
-- NOTE: this is an "anyone with the link" model, matching the
-- "Public Tracking Link" feature. Password-protected / one-time
-- links (Phase 2) will add a token-check layer on top of this.
drop policy if exists "trips_public_read" on public.trips;
create policy "trips_public_read" on public.trips
  for select using (is_public = true);

-- Trip shares: owners manage their own share links.
drop policy if exists "shares_owner_all" on public.trip_shares;
create policy "shares_owner_all" on public.trip_shares
  for all using (
    exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid())
  );

-- Trip shares: anyone may look up a non-revoked, non-expired
-- share row (needed so the public tracking page can resolve
-- share_token -> trip_id).
drop policy if exists "shares_public_read" on public.trip_shares;
create policy "shares_public_read" on public.trip_shares
  for select using (
    revoked = false and (expires_at is null or expires_at > now())
  );

-- Locations: the trip owner can insert/read their own trip's pings.
drop policy if exists "locations_owner_all" on public.locations;
create policy "locations_owner_all" on public.locations
  for all using (
    exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid())
  );

-- Locations: anyone may read pings belonging to a public trip
-- (mirrors the trips_public_read policy above).
drop policy if exists "locations_public_read" on public.locations;
create policy "locations_public_read" on public.locations
  for select using (
    exists (select 1 from public.trips t where t.id = trip_id and t.is_public = true)
  );

-- =========================================================
-- REALTIME
-- Add locations + trips to the supabase_realtime publication
-- so postgres_changes subscriptions receive inserts/updates.
-- =========================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'locations'
  ) then
    alter publication supabase_realtime add table public.locations;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'trips'
  ) then
    alter publication supabase_realtime add table public.trips;
  end if;
end $$;
