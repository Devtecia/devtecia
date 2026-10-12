-- Audience and campaign brief inputs are shared across active team members.
-- Composite foreign keys keep each record attached to its actual brand/client.

create unique index if not exists marketing_brands_client_id_id_key
  on public.marketing_brands (client_id, id);

create table if not exists public.marketing_audiences (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  brand_id uuid not null,
  segment_name text not null check (char_length(btrim(segment_name)) between 1 and 120),
  geography text not null check (char_length(btrim(geography)) between 1 and 180),
  pains text[] not null default '{}',
  objections text[] not null default '{}',
  hypotheses text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, brand_id, id),
  check (cardinality(pains) <= 12),
  check (cardinality(objections) <= 12),
  check (cardinality(hypotheses) <= 12),
  foreign key (client_id, brand_id) references public.marketing_brands (client_id, id) on delete cascade
);

create index if not exists marketing_audiences_client_brand_idx
  on public.marketing_audiences (client_id, brand_id, segment_name);

create table if not exists public.marketing_campaign_briefs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  brand_id uuid not null,
  audience_id uuid not null unique,
  objective text not null check (char_length(btrim(objective)) between 1 and 2000),
  timeframe text not null check (char_length(btrim(timeframe)) between 1 and 2000),
  value_proposition text not null check (char_length(btrim(value_proposition)) between 1 and 2000),
  budget_range jsonb,
  missing_information text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(missing_information) <= 10),
  check (
    budget_range is null or case
      when jsonb_typeof(budget_range) = 'object'
        and jsonb_typeof(budget_range->'min') = 'number'
        and jsonb_typeof(budget_range->'max') = 'number'
        and jsonb_typeof(budget_range->'currency') = 'string'
        and budget_range - 'min' - 'max' - 'currency' = '{}'::jsonb
      then (budget_range->>'min')::numeric between 1 and 1000000000
        and (budget_range->>'max')::numeric between (budget_range->>'min')::numeric and 1000000000
        and (budget_range->>'currency') ~ '^[A-Z]{3}$'
      else false
    end
  ),
  foreign key (client_id, brand_id) references public.marketing_brands (client_id, id) on delete cascade,
  foreign key (client_id, brand_id, audience_id)
    references public.marketing_audiences (client_id, brand_id, id) on delete cascade
);

create index if not exists marketing_campaign_briefs_brand_idx
  on public.marketing_campaign_briefs (client_id, brand_id, audience_id);

alter table public.marketing_audiences enable row level security;
alter table public.marketing_campaign_briefs enable row level security;

drop policy if exists "Active members manage marketing audiences" on public.marketing_audiences;
create policy "Active members manage marketing audiences" on public.marketing_audiences
  for all to authenticated using (public.is_active_member()) with check (public.is_active_member());

drop policy if exists "Active members manage marketing campaign briefs" on public.marketing_campaign_briefs;
create policy "Active members manage marketing campaign briefs" on public.marketing_campaign_briefs
  for all to authenticated using (public.is_active_member()) with check (public.is_active_member());

revoke all on public.marketing_audiences, public.marketing_campaign_briefs from anon, authenticated;
grant select, insert, update on public.marketing_audiences, public.marketing_campaign_briefs to authenticated;
