-- TrackFlow Web — Migration 004
-- Public API support (functions the API route handlers call using a
-- verified API key) + webhooks fired from Postgres via pg_net when a
-- trip starts or ends.

create extension if not exists pg_net; -- outbound HTTP calls from Postgres, free on Supabase

-- =========================================================
-- PUBLIC API — reads scoped to the owner of a verified API key
-- =========================================================
create or replace function public.api_list_trips(p_key text)
returns setof public.trips
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid := public.verify_api_key(p_key);
begin
  if v_owner is null then return; end if;
  return query select * from public.trips where owner_id = v_owner order by created_at desc;
end;
$$;

create or replace function public.api_get_trip_locations(p_key text, p_trip_id uuid)
returns setof public.locations
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid := public.verify_api_key(p_key);
begin
  if v_owner is null then return; end if;
  return query
    select l.* from public.locations l
    join public.trips t on t.id = l.trip_id
    where l.trip_id = p_trip_id and t.owner_id = v_owner
    order by l.recorded_at asc;
end;
$$;

-- =========================================================
-- WEBHOOKS
-- =========================================================
create table if not exists public.webhooks (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  event text not null check (event in ('trip.started', 'trip.ended', 'geofence.enter', 'geofence.exit')),
  secret text not null default encode(gen_random_bytes(16), 'hex'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.webhooks enable row level security;
drop policy if exists "webhooks_owner_all" on public.webhooks;
create policy "webhooks_owner_all" on public.webhooks
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Fires all active webhooks matching `p_event` for a trip's owner via pg_net.
-- Best-effort / fire-and-forget: failures are swallowed so they never block
-- the write that triggered them.
create or replace function public.fire_webhooks(p_event text, p_owner_id uuid, p_payload jsonb)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_hook record;
begin
  for v_hook in select * from public.webhooks where owner_id = p_owner_id and event = p_event and active loop
    begin
      perform net.http_post(
        url := v_hook.url,
        headers := jsonb_build_object('Content-Type', 'application/json', 'X-TrackFlow-Secret', v_hook.secret),
        body := p_payload
      );
    exception when others then
      -- Swallow delivery errors — webhooks are best-effort.
      null;
    end;
  end loop;
end;
$$;

create or replace function public.handle_trip_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'active' then
    perform public.fire_webhooks('trip.started', new.owner_id, to_jsonb(new));
  elsif tg_op = 'UPDATE' and old.status = 'active' and new.status = 'ended' then
    perform public.fire_webhooks('trip.ended', new.owner_id, to_jsonb(new));
  end if;
  return new;
end;
$$;

drop trigger if exists on_trip_status_change on public.trips;
create trigger on_trip_status_change
  after insert or update on public.trips
  for each row execute procedure public.handle_trip_status_change();

create or replace function public.handle_geofence_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner from public.trips where id = new.trip_id;
  perform public.fire_webhooks(
    case new.event_type when 'enter' then 'geofence.enter' else 'geofence.exit' end,
    v_owner,
    to_jsonb(new)
  );
  return new;
end;
$$;

drop trigger if exists on_geofence_event on public.geofence_events;
create trigger on_geofence_event
  after insert on public.geofence_events
  for each row execute procedure public.handle_geofence_event();
