-- ═══════════════════════════════════════════════════════
-- MAKE GREAT ZIMBABWE AGAIN - Supabase leaderboard schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ═══════════════════════════════════════════════════════

-- Leaderboard entries (mirrors the old SQLite table)
create table if not exists public.leaderboard_entries (
  id text primary key,
  player_name text not null,
  score double precision not null,
  popularity double precision not null,
  satisfaction double precision not null,
  legitimacy double precision not null,
  gdp double precision not null,
  years_in_office double precision not null,
  turns_survived integer not null,
  population integer not null,
  difficulty text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_leaderboard_difficulty_score
  on public.leaderboard_entries (difficulty, score desc, created_at asc);

-- 24h snapshot cache per difficulty (mirrors the old SQLite table)
create table if not exists public.leaderboard_snapshots (
  difficulty text primary key,
  entries_json text not null,
  last_updated_at timestamptz not null
);

-- ── Row Level Security ──────────────────────────────────
-- The game submits and reads scores through the app's own API
-- routes (server-side, anon key). Anyone can view or submit a
-- score; no auth is required for a public leaderboard.

alter table public.leaderboard_entries enable row level security;
alter table public.leaderboard_snapshots enable row level security;

drop policy if exists "entries are public readable" on public.leaderboard_entries;
drop policy if exists "entries are public insertable" on public.leaderboard_entries;
drop policy if exists "snapshots are public readable" on public.leaderboard_snapshots;
drop policy if exists "snapshots are public writable" on public.leaderboard_snapshots;
drop policy if exists "snapshots are public updatable" on public.leaderboard_snapshots;

create policy "entries are public readable" on public.leaderboard_entries
  for select to anon using (true);

create policy "entries are public insertable" on public.leaderboard_entries
  for insert to anon with check (true);

create policy "snapshots are public readable" on public.leaderboard_snapshots
  for select to anon using (true);

create policy "snapshots are public writable" on public.leaderboard_snapshots
  for insert to anon with check (true);

create policy "snapshots are public updatable" on public.leaderboard_snapshots
  for update to anon using (true) with check (true);