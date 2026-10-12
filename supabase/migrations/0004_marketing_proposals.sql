-- Shared proposal versions and immutable review events for active team members.

create unique index if not exists marketing_campaign_briefs_client_brand_id_key
  on public.marketing_campaign_briefs (client_id, brand_id, id);

create table if not exists public.marketing_proposal_threads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  brand_id uuid not null,
  brief_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, brand_id, brief_id),
  unique (client_id, brand_id, brief_id, id),
  foreign key (client_id, brand_id, brief_id)
    references public.marketing_campaign_briefs (client_id, brand_id, id) on delete cascade
);

create table if not exists public.marketing_proposals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  brand_id uuid not null,
  audience_id uuid not null,
  brief_id uuid not null,
  thread_id uuid not null,
  version integer not null check (version > 0),
  parent_proposal_id uuid,
  parent_version integer,
  status text not null check (status in ('draft', 'submitted', 'approved', 'revision', 'archived')),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  source_references text[] not null default '{}',
  generation jsonb not null check (jsonb_typeof(generation) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id),
  unique (client_id, brand_id, brief_id, thread_id, version),
  unique (client_id, brand_id, brief_id, thread_id, id),
  check ((parent_proposal_id is null and parent_version is null) or (parent_proposal_id is not null and parent_version is not null and parent_version < version)),
  foreign key (client_id, brand_id, brief_id, thread_id)
    references public.marketing_proposal_threads (client_id, brand_id, brief_id, id) on delete cascade,
  foreign key (client_id, brand_id, brief_id, thread_id, parent_proposal_id)
    references public.marketing_proposals (client_id, brand_id, brief_id, thread_id, id),
  foreign key (client_id, brand_id, audience_id)
    references public.marketing_audiences (client_id, brand_id, id),
  foreign key (client_id, brand_id, brief_id)
    references public.marketing_campaign_briefs (client_id, brand_id, id) on delete cascade
);

create table if not exists public.marketing_review_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  brand_id uuid not null,
  brief_id uuid not null,
  thread_id uuid not null,
  proposal_id uuid not null,
  version integer not null,
  event_type text not null check (event_type in ('generated', 'revision_generated', 'submitted', 'approved', 'revision_requested', 'archived')),
  previous_status text check (previous_status in ('draft', 'submitted', 'approved', 'revision', 'archived')),
  next_status text not null check (next_status in ('draft', 'submitted', 'approved', 'revision', 'archived')),
  actor_id uuid not null references public.profiles (id),
  feedback text check (feedback is null or char_length(btrim(feedback)) between 1 and 3000),
  created_at timestamptz not null default now(),
  foreign key (client_id, brand_id, brief_id, thread_id, proposal_id)
    references public.marketing_proposals (client_id, brand_id, brief_id, thread_id, id) on delete cascade
);

create index if not exists marketing_proposals_brief_version_idx
  on public.marketing_proposals (client_id, brand_id, brief_id, version desc);
create index if not exists marketing_proposals_thread_idx
  on public.marketing_proposals (client_id, brand_id, thread_id, version);
create index if not exists marketing_review_events_proposal_idx
  on public.marketing_review_events (client_id, brand_id, proposal_id, created_at);

alter table public.marketing_proposal_threads enable row level security;
alter table public.marketing_proposals enable row level security;
alter table public.marketing_review_events enable row level security;

drop policy if exists "Active members read marketing proposal threads" on public.marketing_proposal_threads;
create policy "Active members read marketing proposal threads" on public.marketing_proposal_threads
  for select to authenticated using (public.is_active_member());
drop policy if exists "Active members read marketing proposals" on public.marketing_proposals;
create policy "Active members read marketing proposals" on public.marketing_proposals
  for select to authenticated using (public.is_active_member());
drop policy if exists "Active members read marketing review events" on public.marketing_review_events;
create policy "Active members read marketing review events" on public.marketing_review_events
  for select to authenticated using (public.is_active_member());

revoke all on public.marketing_proposal_threads, public.marketing_proposals, public.marketing_review_events from public, anon, authenticated;
grant select on public.marketing_proposal_threads, public.marketing_proposals, public.marketing_review_events to authenticated;

create or replace function public.marketing_proposal_text_valid(p_value jsonb, p_max_length integer default 2000)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    jsonb_typeof(p_value) = 'string'
      and char_length(btrim(p_value #>> '{}')) between 1 and p_max_length,
    false
  );
$$;

create or replace function public.marketing_proposal_text_list_valid(
  p_values jsonb,
  p_max_items integer default 20,
  p_max_length integer default 500
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_item jsonb;
begin
  if jsonb_typeof(p_values) is distinct from 'array' or jsonb_array_length(p_values) > p_max_items then
    return false;
  end if;
  for v_item in select value from jsonb_array_elements(p_values) loop
    if not public.marketing_proposal_text_valid(v_item, p_max_length) then
      return false;
    end if;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;

create or replace function public.marketing_proposal_claim_valid(p_claim jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_typeof(p_claim) = 'object'
    and public.marketing_proposal_text_valid(p_claim->'value')
    and p_claim->>'basis' in ('fact', 'owner_input', 'assumption', 'hypothesis')
    and (
      not (p_claim ? 'factIds')
      or public.marketing_proposal_text_list_valid(p_claim->'factIds')
    ), false);
$$;

create or replace function public.is_marketing_proposal_content_valid(p_content jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_item jsonb;
  v_week integer;
  v_format text;
  v_weeks boolean[] := array[false, false, false, false];
  v_formats boolean[] := array[false, false, false];
  v_channel_roles jsonb;
  v_budget jsonb;
  v_value jsonb;
begin
  if jsonb_typeof(p_content) is distinct from 'object' then return false; end if;

  if jsonb_typeof(p_content->'briefRecap') is distinct from 'object'
     or jsonb_typeof(p_content->'audienceInsight') is distinct from 'object'
     or jsonb_typeof(p_content->'positioning') is distinct from 'object'
     or jsonb_typeof(p_content->'campaignConcept') is distinct from 'object'
     or jsonb_typeof(p_content->'paidPromotion') is distinct from 'object'
     or jsonb_typeof(p_content->'measurementPlan') is distinct from 'object'
     or jsonb_typeof(p_content->'risksAndOpenQuestions') is distinct from 'object' then
    return false;
  end if;
  if not public.marketing_proposal_text_list_valid(p_content->'briefRecap'->'factsUsed')
     or not public.marketing_proposal_text_list_valid(p_content->'briefRecap'->'assumptionsUsed')
     or not public.marketing_proposal_text_list_valid(p_content->'briefRecap'->'missingInformation') then
    return false;
  end if;
  if not public.marketing_proposal_claim_valid(p_content->'audienceInsight'->'operationalProblem')
     or not public.marketing_proposal_claim_valid(p_content->'audienceInsight'->'desiredOutcome')
     or not public.marketing_proposal_claim_valid(p_content->'audienceInsight'->'likelyObjection')
     or not public.marketing_proposal_claim_valid(p_content->'audienceInsight'->'messageAngle')
     or not public.marketing_proposal_claim_valid(p_content->'positioning'->'promise')
     or not public.marketing_proposal_text_list_valid(p_content->'positioning'->'wordingToAvoid') then
    return false;
  end if;
  if jsonb_typeof(p_content->'positioning'->'supportingProof') is distinct from 'array'
     or jsonb_array_length(p_content->'positioning'->'supportingProof') > 20 then
    return false;
  end if;
  for v_item in select value from jsonb_array_elements(p_content->'positioning'->'supportingProof') loop
    if not public.marketing_proposal_claim_valid(v_item) then return false; end if;
  end loop;

  v_value := p_content->'campaignConcept';
  if not public.marketing_proposal_text_valid(v_value->'goal')
     or not public.marketing_proposal_text_valid(v_value->'targetAudience')
     or not public.marketing_proposal_claim_valid(v_value->'coreMessage')
     or not public.marketing_proposal_claim_valid(v_value->'offerOrCta')
     or jsonb_typeof(v_value->'recommendedDurationWeeks') is distinct from 'number'
     or (v_value->>'recommendedDurationWeeks') !~ '^[0-9]+$'
     or (v_value->>'recommendedDurationWeeks')::integer not between 1 and 52 then
    return false;
  end if;
  v_channel_roles := v_value->'channelRoles';
  if jsonb_typeof(v_channel_roles) is distinct from 'array'
     or jsonb_array_length(v_channel_roles) < 1 or jsonb_array_length(v_channel_roles) > 10 then
    return false;
  end if;
  for v_item in select value from jsonb_array_elements(v_channel_roles) loop
    if jsonb_typeof(v_item) is distinct from 'object'
       or v_item->>'channel' is null
       or v_item->>'channel' not in ('instagram', 'facebook')
       or not public.marketing_proposal_text_valid(v_item->'role') then
      return false;
    end if;
  end loop;

  if jsonb_typeof(p_content->'contentPlan') is distinct from 'array'
     or jsonb_array_length(p_content->'contentPlan') < 4
     or jsonb_array_length(p_content->'contentPlan') > 40 then
    return false;
  end if;
  for v_item in select value from jsonb_array_elements(p_content->'contentPlan') loop
    if jsonb_typeof(v_item) is distinct from 'object'
       or jsonb_typeof(v_item->'week') is distinct from 'number'
       or (v_item->>'week') !~ '^[1-4]$'
       or v_item->>'format' is null
       or v_item->>'format' not in ('short_video', 'carousel', 'static_or_story')
       or not public.marketing_proposal_text_valid(v_item->'purpose')
       or not public.marketing_proposal_text_valid(v_item->'topic')
       or not public.marketing_proposal_text_valid(v_item->'hook')
       or not public.marketing_proposal_text_valid(v_item->'cta')
       or not public.marketing_proposal_text_valid(v_item->'requiredAsset') then
      return false;
    end if;
    v_week := (v_item->>'week')::integer;
    v_weeks[v_week] := true;
  end loop;
  if false = any(v_weeks) then return false; end if;

  if jsonb_typeof(p_content->'creativeBriefs') is distinct from 'array'
     or jsonb_array_length(p_content->'creativeBriefs') < 3
     or jsonb_array_length(p_content->'creativeBriefs') > 20 then
    return false;
  end if;
  for v_item in select value from jsonb_array_elements(p_content->'creativeBriefs') loop
    if jsonb_typeof(v_item) is distinct from 'object'
       or v_item->>'format' is null
       or v_item->>'format' not in ('short_video', 'carousel', 'static_or_story')
       or not public.marketing_proposal_claim_valid(v_item->'concept')
       or not public.marketing_proposal_text_valid(v_item->'visualDirection')
       or not public.marketing_proposal_text_valid(v_item->'onScreenText')
       or not public.marketing_proposal_text_valid(v_item->'captionDraft')
       or not public.marketing_proposal_text_list_valid(v_item->'productionChecklist')
       or jsonb_array_length(v_item->'productionChecklist') < 1 then
      return false;
    end if;
    v_format := v_item->>'format';
    v_formats[array_position(array['short_video', 'carousel', 'static_or_story'], v_format)] := true;
  end loop;
  if false = any(v_formats) then return false; end if;

  v_value := p_content->'paidPromotion';
  if not public.marketing_proposal_text_valid(v_value->'objective')
     or not public.marketing_proposal_claim_valid(v_value->'audienceHypothesis')
     or not public.marketing_proposal_text_list_valid(v_value->'creativeToTest')
     or not public.marketing_proposal_text_list_valid(v_value->'humanChecklist') then
    return false;
  end if;
  v_budget := v_value->'budgetRange';
  if not (v_value ? 'budgetRange') then return false; end if;
  if jsonb_typeof(v_budget) is distinct from 'null' then
    if jsonb_typeof(v_budget) is distinct from 'object'
       or jsonb_typeof(v_budget->'min') is distinct from 'number'
       or jsonb_typeof(v_budget->'max') is distinct from 'number'
       or (v_budget->>'min')::numeric < 0
       or (v_budget->>'max')::numeric < (v_budget->>'min')::numeric
       or jsonb_typeof(v_budget->'currency') is distinct from 'string'
       or (v_budget->>'currency') !~ '^[A-Z]{3}$' then
      return false;
    end if;
  end if;

  v_value := p_content->'measurementPlan';
  if not public.marketing_proposal_text_list_valid(v_value->'baselineNeeded')
     or not public.marketing_proposal_text_list_valid(v_value->'reachIndicators')
     or not public.marketing_proposal_text_list_valid(v_value->'qualifiedInterestIndicators')
     or not public.marketing_proposal_text_valid(v_value->'reviewCadence')
     or jsonb_typeof(v_value->'metricDecisions') is distinct from 'array'
     or jsonb_array_length(v_value->'metricDecisions') < 1
     or jsonb_array_length(v_value->'metricDecisions') > 20 then
    return false;
  end if;
  for v_item in select value from jsonb_array_elements(v_value->'metricDecisions') loop
    if jsonb_typeof(v_item) is distinct from 'object'
       or not public.marketing_proposal_text_valid(v_item->'metric')
       or not public.marketing_proposal_text_valid(v_item->'decisionInformed') then
      return false;
    end if;
  end loop;

  v_value := p_content->'risksAndOpenQuestions';
  if not public.marketing_proposal_text_list_valid(v_value->'unsupportedClaims')
     or not public.marketing_proposal_text_list_valid(v_value->'missingAssets')
     or not public.marketing_proposal_text_list_valid(v_value->'unclearTargeting')
     or not public.marketing_proposal_text_list_valid(v_value->'assumptionsToConfirm') then
    return false;
  end if;
  return true;
exception when others then
  return false;
end;
$$;

revoke all on function public.marketing_proposal_text_valid(jsonb, integer) from public, anon, authenticated;
revoke all on function public.marketing_proposal_text_list_valid(jsonb, integer, integer) from public, anon, authenticated;
revoke all on function public.marketing_proposal_claim_valid(jsonb) from public, anon, authenticated;
revoke all on function public.is_marketing_proposal_content_valid(jsonb) from public, anon, authenticated;

create or replace function public.create_marketing_proposal_version(
  p_client_id uuid,
  p_brand_id uuid,
  p_audience_id uuid,
  p_brief_id uuid,
  p_content jsonb,
  p_generation jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_thread public.marketing_proposal_threads%rowtype;
  v_latest public.marketing_proposals%rowtype;
  v_proposal_id uuid;
  v_version integer;
  v_event_type text;
  v_previous_status text;
  v_brief_budget jsonb;
  v_proposal_budget jsonb;
begin
  if v_actor is null or not public.is_active_member() then
    raise exception using errcode = '42501', message = 'active_profile_required';
  end if;
  if jsonb_typeof(p_generation) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'invalid_proposal_payload';
  end if;
  if not public.is_marketing_proposal_content_valid(p_content) then
    raise exception using errcode = '22023', message = 'invalid_proposal_content';
  end if;
  select brief.budget_range into v_brief_budget
  from public.marketing_campaign_briefs brief
  join public.marketing_audiences audience
    on audience.client_id = brief.client_id and audience.brand_id = brief.brand_id and audience.id = brief.audience_id
  where brief.client_id = p_client_id and brief.brand_id = p_brand_id and brief.audience_id = p_audience_id and brief.id = p_brief_id;
  if not found then
    raise exception using errcode = '23503', message = 'proposal_scope_not_found';
  end if;
  v_proposal_budget := p_content #> '{paidPromotion,budgetRange}';
  if v_brief_budget is null or v_brief_budget = 'null'::jsonb then
    if v_proposal_budget is distinct from 'null'::jsonb then
      raise exception using errcode = '22023', message = 'invalid_proposal_budget';
    end if;
  elsif jsonb_typeof(v_proposal_budget) is distinct from 'object'
     or v_proposal_budget->>'currency' is distinct from v_brief_budget->>'currency'
     or (v_proposal_budget->>'min')::numeric < (v_brief_budget->>'min')::numeric
     or (v_proposal_budget->>'max')::numeric > (v_brief_budget->>'max')::numeric then
    raise exception using errcode = '22023', message = 'invalid_proposal_budget';
  end if;

  insert into public.marketing_proposal_threads (client_id, brand_id, brief_id)
    values (p_client_id, p_brand_id, p_brief_id)
    on conflict (client_id, brand_id, brief_id) do nothing;
  select * into v_thread from public.marketing_proposal_threads thread
    where thread.client_id = p_client_id and thread.brand_id = p_brand_id and thread.brief_id = p_brief_id
    for update;
  select * into v_latest from public.marketing_proposals proposal
    where proposal.client_id = p_client_id and proposal.brand_id = p_brand_id and proposal.brief_id = p_brief_id and proposal.thread_id = v_thread.id
    order by proposal.version desc limit 1 for update;

  if found then
    if v_latest.status not in ('approved', 'revision') then
      raise exception using errcode = '23514', message = 'invalid_proposal_transition';
    end if;
    v_version := v_latest.version + 1;
    v_previous_status := v_latest.status;
    v_event_type := 'revision_generated';
  else
    v_version := 1;
    v_previous_status := null;
    v_event_type := 'generated';
  end if;

  insert into public.marketing_proposals (
    client_id, brand_id, audience_id, brief_id, thread_id, version, parent_proposal_id, parent_version,
    status, content, generation
  ) values (
    p_client_id, p_brand_id, p_audience_id, p_brief_id, v_thread.id, v_version,
    case when v_version > 1 then v_latest.id else null end,
    case when v_version > 1 then v_latest.version else null end,
    'draft', p_content, p_generation
  ) returning id into v_proposal_id;

  insert into public.marketing_review_events (
    client_id, brand_id, brief_id, thread_id, proposal_id, version, event_type,
    previous_status, next_status, actor_id
  ) values (
    p_client_id, p_brand_id, p_brief_id, v_thread.id, v_proposal_id, v_version, v_event_type,
    v_previous_status, 'draft', v_actor
  );
  update public.marketing_proposal_threads set updated_at = now() where id = v_thread.id;
  return v_proposal_id;
end;
$$;

create or replace function public.transition_marketing_proposal(
  p_proposal_id uuid,
  p_client_id uuid,
  p_brand_id uuid,
  p_audience_id uuid,
  p_brief_id uuid,
  p_action text,
  p_feedback text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_proposal public.marketing_proposals%rowtype;
  v_next_status text;
  v_event_type text;
  v_feedback text := nullif(btrim(p_feedback), '');
begin
  if v_actor is null or not public.is_active_member() then
    raise exception using errcode = '42501', message = 'active_profile_required';
  end if;
  select * into v_proposal from public.marketing_proposals proposal
    where proposal.id = p_proposal_id and proposal.client_id = p_client_id and proposal.brand_id = p_brand_id
      and proposal.audience_id = p_audience_id and proposal.brief_id = p_brief_id
    for update;
  if not found then
    raise exception using errcode = '23503', message = 'proposal_scope_not_found';
  end if;

  if p_action = 'submit' and v_proposal.status = 'draft' then
    v_next_status := 'submitted'; v_event_type := 'submitted';
  elsif p_action = 'approve' and v_proposal.status = 'submitted' then
    v_next_status := 'approved'; v_event_type := 'approved';
  elsif p_action = 'request_revision' and v_proposal.status = 'submitted' then
    if v_feedback is null or char_length(v_feedback) > 3000 then
      raise exception using errcode = '22023', message = 'review_feedback_required';
    end if;
    v_next_status := 'revision'; v_event_type := 'revision_requested';
  elsif p_action = 'archive' and v_proposal.status <> 'archived' then
    v_next_status := 'archived'; v_event_type := 'archived';
  else
    raise exception using errcode = '23514', message = 'invalid_proposal_transition';
  end if;

  update public.marketing_proposals set
    status = v_next_status,
    updated_at = now(),
    submitted_at = case when p_action = 'submit' then now() else submitted_at end,
    approved_at = case when p_action = 'approve' then now() else approved_at end,
    approved_by = case when p_action = 'approve' then v_actor else approved_by end
  where id = v_proposal.id;
  insert into public.marketing_review_events (
    client_id, brand_id, brief_id, thread_id, proposal_id, version, event_type,
    previous_status, next_status, actor_id, feedback
  ) values (
    v_proposal.client_id, v_proposal.brand_id, v_proposal.brief_id, v_proposal.thread_id,
    v_proposal.id, v_proposal.version, v_event_type, v_proposal.status, v_next_status, v_actor,
    case when p_action = 'request_revision' then v_feedback else null end
  );
  update public.marketing_proposal_threads set updated_at = now() where id = v_proposal.thread_id;
  return v_proposal.id;
end;
$$;

revoke all on function public.create_marketing_proposal_version(uuid, uuid, uuid, uuid, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.transition_marketing_proposal(uuid, uuid, uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.create_marketing_proposal_version(uuid, uuid, uuid, uuid, jsonb, jsonb) to authenticated;
grant execute on function public.transition_marketing_proposal(uuid, uuid, uuid, uuid, uuid, text, text) to authenticated;
