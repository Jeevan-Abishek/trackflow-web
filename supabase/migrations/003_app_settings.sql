-- TrackFlow Web — Migration 003
-- Simple key/value app settings table, used by the admin Settings page
-- (branding, default theme, white-label name). Public read so the
-- landing page / layout can render current branding without auth.

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_public_read" on public.app_settings;
create policy "app_settings_public_read" on public.app_settings for select using (true);

drop policy if exists "app_settings_admin_write" on public.app_settings;
create policy "app_settings_admin_write" on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.app_settings (key, value)
values
  ('branding', '{"app_name": "TrackFlow", "primary_color": "#2563EB", "logo_url": null}'::jsonb)
on conflict (key) do nothing;
