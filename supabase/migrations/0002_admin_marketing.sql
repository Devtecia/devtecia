-- Shared Marketing workspace. Active team members have the same access to every record.

create table if not exists public.marketing_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  website text not null default '' check (char_length(website) <= 2048),
  summary text not null default '' check (char_length(summary) <= 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_brands (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.marketing_clients (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  website text not null default '' check (char_length(website) <= 2048),
  summary text not null default '' check (char_length(summary) <= 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_brands_client_idx on public.marketing_brands (client_id, name);

alter table public.marketing_clients enable row level security;
alter table public.marketing_brands enable row level security;

drop policy if exists "Active members manage marketing clients" on public.marketing_clients;
create policy "Active members manage marketing clients" on public.marketing_clients
  for all to authenticated using (public.is_active_member()) with check (public.is_active_member());

drop policy if exists "Active members manage marketing brands" on public.marketing_brands;
create policy "Active members manage marketing brands" on public.marketing_brands
  for all to authenticated using (public.is_active_member()) with check (public.is_active_member());

revoke all on public.marketing_clients, public.marketing_brands from anon, authenticated;
grant select, insert, update on public.marketing_clients, public.marketing_brands to authenticated;
