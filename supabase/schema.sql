-- ================================================================
-- Lumo Supabase Schema
-- Run this in the Supabase SQL editor to set up cloud sync.
-- ================================================================

-- Enable Row Level Security (RLS) — each user only sees their own data.

-- Sources
create table if not exists lumo_sources (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);
alter table lumo_sources enable row level security;
create policy "users own sources" on lumo_sources
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Highlights
create table if not exists lumo_highlights (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);
alter table lumo_highlights enable row level security;
create policy "users own highlights" on lumo_highlights
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notes
create table if not exists lumo_notes (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);
alter table lumo_notes enable row level security;
create policy "users own notes" on lumo_notes
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Claims
create table if not exists lumo_claims (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);
alter table lumo_claims enable row level security;
create policy "users own claims" on lumo_claims
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Evidence
create table if not exists lumo_evidence (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);
alter table lumo_evidence enable row level security;
create policy "users own evidence" on lumo_evidence
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Insights
create table if not exists lumo_insights (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);
alter table lumo_insights enable row level security;
create policy "users own insights" on lumo_insights
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Deliverables
create table if not exists lumo_deliverables (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);
alter table lumo_deliverables enable row level security;
create policy "users own deliverables" on lumo_deliverables
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Projects
create table if not exists lumo_projects (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);
alter table lumo_projects enable row level security;
create policy "users own projects" on lumo_projects
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Collections
create table if not exists lumo_collections (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);
alter table lumo_collections enable row level security;
create policy "users own collections" on lumo_collections
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ================================================================
-- Done! Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
-- in .env.local, then the Lumo app will auto-sync on changes.
-- ================================================================
