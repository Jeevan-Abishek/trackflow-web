-- TrackFlow Web — Migration 006
-- Per-user locale preference, used by the i18n provider.

alter table public.profiles
  add column if not exists locale text not null default 'en' check (locale in ('en', 'hi', 'ta'));
