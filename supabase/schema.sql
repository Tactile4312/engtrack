-- EngTrack trial (single user) database.
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
--
-- Trial design: each record is stored whole as JSON (same shape as the app's types.ts),
-- owned by the signed-in user. Row Level Security means a user can only ever read or write
-- their own rows, even though the publishable key is visible in the web page.
-- The multi-user build (Phase 4) will replace this with proper tables and role rules.

create table if not exists public.projects (
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner, id)
);

create table if not exists public.clients (
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner, id)
);

create table if not exists public.people (
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner, id)
);

-- One row per user: read reminders, demo record ids, and similar small settings.
create table if not exists public.settings (
  owner uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.clients  enable row level security;
alter table public.people   enable row level security;
alter table public.settings enable row level security;

drop policy if exists "own rows" on public.projects;
drop policy if exists "own rows" on public.clients;
drop policy if exists "own rows" on public.people;
drop policy if exists "own rows" on public.settings;

create policy "own rows" on public.projects for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "own rows" on public.clients for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "own rows" on public.people for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "own rows" on public.settings for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));

-- Signed-out visitors get nothing.
revoke all on public.projects, public.clients, public.people, public.settings from anon;
grant select, insert, update, delete on public.projects, public.clients, public.people, public.settings to authenticated;
