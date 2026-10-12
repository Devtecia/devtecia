-- Admin kanban: profiles, projects, members, tasks, row level security and task functions.
-- Safe to run more than once: tables use IF NOT EXISTS, functions use CREATE OR REPLACE,
-- policies and triggers are dropped before being created again.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 120),
  email text not null default '',
  initials varchar(4) not null default '',
  color text not null default '#B8F23D' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  role text not null default 'member' check (role in ('admin', 'member')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[A-Z][A-Z0-9_-]{1,7}$'),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  client text not null default '' check (char_length(client) <= 120),
  description text not null default '' check (char_length(description) <= 2000),
  color text not null default '#B8F23D' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  statuses jsonb not null default '[
    {"key": "backlog", "label": "Backlog", "short": "BK", "color": "#E4E5DE"},
    {"key": "todo", "label": "Por hacer", "short": "PH", "color": "#E4E5DE"},
    {"key": "in_progress", "label": "En curso", "short": "EC", "color": "#D9EFFC"},
    {"key": "review", "label": "Revisión", "short": "RV", "color": "#FFF0BD"},
    {"key": "blocked", "label": "Bloqueado", "short": "BL", "color": "#FFDED7"},
    {"key": "done", "label": "Terminado", "short": "OK", "color": "#DFF3AB"}
  ]'::jsonb check (jsonb_typeof(statuses) = 'array' and jsonb_array_length(statuses) > 0),
  card_fields jsonb not null default '["priority", "assignee", "due_date", "labels"]'::jsonb
    check (jsonb_typeof(card_fields) = 'array'),
  next_number integer not null default 1 check (next_number > 0),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (project_id, profile_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  number integer not null check (number > 0),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 20000),
  status text not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_id uuid references public.profiles (id) on delete set null,
  due_date date,
  estimate integer check (estimate between 0 and 1000),
  labels text[] not null default '{}',
  position double precision not null default 0,
  version integer not null default 1,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (project_id, number)
);

create index if not exists tasks_board_idx on public.tasks (project_id, status, position) where archived_at is null;
create index if not exists tasks_assignee_idx on public.tasks (assignee_id) where archived_at is null;
create index if not exists project_members_profile_idx on public.project_members (profile_id);

-- ---------------------------------------------------------------------------
-- Helpers (definer, so policies can read profiles without recursion)
-- ---------------------------------------------------------------------------

create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active and role = 'admin');
$$;

create or replace function public.initials_from(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  with words as (
    select regexp_split_to_array(btrim(regexp_replace(coalesce(p_name, ''), '[\s._-]+', ' ', 'g')), ' ') as w
  )
  select case
    when coalesce(w[1], '') = '' then '?'
    when array_length(w, 1) >= 2 then upper(left(w[1], 1) || left(w[2], 1))
    else upper(left(w[1], 2))
  end
  from words;
$$;

create or replace function public.normalize_labels(p_labels text[])
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(label order by first_seen), '{}')
  from (
    select left(btrim(item), 40) as label, min(ord) as first_seen
    from unnest(coalesce(p_labels, '{}')) with ordinality as u (item, ord)
    where btrim(item) <> ''
    group by left(btrim(item), 40)
  ) as cleaned;
$$;

create or replace function public.status_exists(p_statuses jsonb, p_status text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select exists (select 1 from jsonb_array_elements(p_statuses) as s where s ->> 'key' = p_status);
$$;

-- ---------------------------------------------------------------------------
-- Profile bootstrap: every new auth user gets a member profile
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1), '');
  v_initials text := upper(left(nullif(btrim(new.raw_user_meta_data ->> 'initials'), ''), 4));
begin
  insert into public.profiles (id, name, email, initials)
  values (new.id, left(v_name, 120), coalesce(new.email, ''), coalesce(v_initials, public.initials_from(v_name)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users that existed before this migration.
insert into public.profiles (id, name, email, initials)
select u.id,
       left(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'name'), ''), split_part(u.email, '@', 1), ''), 120),
       coalesce(u.email, ''),
       public.initials_from(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'name'), ''), split_part(u.email, '@', 1)))
from auth.users as u
on conflict (id) do nothing;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tasks_touch_updated_at on public.tasks;
create trigger tasks_touch_updated_at
  before update on public.tasks
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "Active members read profiles" on public.profiles;
create policy "Active members read profiles" on public.profiles
  for select to authenticated using (public.is_active_member());

drop policy if exists "Members update their own profile" on public.profiles;
create policy "Members update their own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid() and public.is_active_member())
  with check (id = auth.uid());

-- Role, active and email change only through the service role.
revoke all on public.profiles from anon;
revoke insert, delete on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (name, initials, color) on public.profiles to authenticated;

drop policy if exists "Active members manage projects" on public.projects;
create policy "Active members manage projects" on public.projects
  for all to authenticated using (public.is_active_member()) with check (public.is_active_member());

drop policy if exists "Active members manage project members" on public.project_members;
create policy "Active members manage project members" on public.project_members
  for all to authenticated using (public.is_active_member()) with check (public.is_active_member());

drop policy if exists "Active members manage tasks" on public.tasks;
create policy "Active members manage tasks" on public.tasks
  for all to authenticated using (public.is_active_member()) with check (public.is_active_member());

revoke all on public.projects, public.project_members, public.tasks from anon;
grant select, insert, update, delete on public.projects, public.project_members, public.tasks to authenticated;

-- ---------------------------------------------------------------------------
-- Task functions (invoker, so row level security applies to the caller)
-- Errors: P0002 not found, 22023 invalid input, 40001 stale version.
-- ---------------------------------------------------------------------------

create or replace function public.create_task(
  p_project_id uuid,
  p_title text,
  p_status text default null,
  p_description text default '',
  p_priority text default 'medium',
  p_assignee_id uuid default null,
  p_due_date date default null,
  p_estimate integer default null,
  p_labels text[] default '{}'
)
returns public.tasks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_number integer;
  v_statuses jsonb;
  v_status text;
  v_position double precision;
  v_task public.tasks;
begin
  update public.projects
     set next_number = next_number + 1
   where id = p_project_id and archived_at is null
  returning next_number - 1, statuses into v_number, v_statuses;

  if not found then
    raise exception 'project_not_found' using errcode = 'P0002';
  end if;

  v_status := coalesce(nullif(p_status, ''), v_statuses -> 0 ->> 'key');
  if not public.status_exists(v_statuses, v_status) then
    raise exception 'invalid_status' using errcode = '22023', detail = v_status;
  end if;

  select coalesce(max(position), 0) + 1024 into v_position
    from public.tasks
   where project_id = p_project_id and status = v_status and archived_at is null;

  insert into public.tasks (project_id, number, title, description, status, priority,
                            assignee_id, due_date, estimate, labels, position)
  values (p_project_id, v_number, btrim(p_title), coalesce(p_description, ''), v_status,
          coalesce(p_priority, 'medium'), p_assignee_id, p_due_date, p_estimate,
          public.normalize_labels(p_labels), v_position)
  returning * into v_task;

  return v_task;
end;
$$;

-- Places a task in p_status right before p_before_task_id, or at the end of the column.
-- p_version sits before the optional argument because Postgres requires defaults last;
-- PostgREST calls it by name, so the order does not matter to clients.
create or replace function public.move_task(
  p_task_id uuid,
  p_status text,
  p_version integer,
  p_before_task_id uuid default null
)
returns public.tasks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_task public.tasks;
  v_statuses jsonb;
  v_before double precision;
  v_previous double precision;
  v_position double precision;
begin
  select * into v_task from public.tasks where id = p_task_id and archived_at is null for update;
  if not found then
    raise exception 'task_not_found' using errcode = 'P0002';
  end if;
  if v_task.version <> p_version then
    raise exception 'version_conflict' using errcode = '40001', detail = v_task.version::text;
  end if;

  select statuses into v_statuses from public.projects where id = v_task.project_id;
  if not public.status_exists(v_statuses, p_status) then
    raise exception 'invalid_status' using errcode = '22023', detail = p_status;
  end if;

  if p_before_task_id is null then
    select coalesce(max(position), 0) + 1024 into v_position
      from public.tasks
     where project_id = v_task.project_id and status = p_status and archived_at is null and id <> p_task_id;
  else
    for attempt in 1..2 loop
      select position into v_before
        from public.tasks
       where id = p_before_task_id and project_id = v_task.project_id and status = p_status
         and archived_at is null and id <> p_task_id;
      if not found then
        raise exception 'invalid_before_task' using errcode = '22023';
      end if;

      select max(position) into v_previous
        from public.tasks
       where project_id = v_task.project_id and status = p_status and archived_at is null
         and id <> p_task_id and position < v_before;

      v_position := case when v_previous is null then v_before - 1024 else (v_previous + v_before) / 2 end;
      exit when v_previous is null or (v_before - v_previous) > 1e-6;

      -- The gap is too small to split: spread the column out again and retry once.
      with ordered as (
        select id, row_number() over (order by position, created_at) as rn
          from public.tasks
         where project_id = v_task.project_id and status = p_status and archived_at is null and id <> p_task_id
      )
      update public.tasks as t set position = ordered.rn * 1024 from ordered where t.id = ordered.id;
    end loop;
  end if;

  update public.tasks
     set status = p_status, position = v_position, version = version + 1
   where id = p_task_id
  returning * into v_task;

  return v_task;
end;
$$;

-- Applies a partial update. Allowed keys: title, description, status, priority,
-- assignee_id, due_date, estimate, labels. A status change appends to the new column.
create or replace function public.update_task(
  p_task_id uuid,
  p_version integer,
  p_fields jsonb
)
returns public.tasks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_task public.tasks;
  v_unknown text;
  v_statuses jsonb;
  v_status text;
  v_position double precision;
begin
  if p_fields is null or jsonb_typeof(p_fields) <> 'object' then
    raise exception 'invalid_fields' using errcode = '22023';
  end if;

  select key into v_unknown
    from jsonb_object_keys(p_fields) as key
   where key not in ('title', 'description', 'status', 'priority', 'assignee_id', 'due_date', 'estimate', 'labels')
   limit 1;
  if v_unknown is not null then
    raise exception 'invalid_field' using errcode = '22023', detail = v_unknown;
  end if;

  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then
    raise exception 'task_not_found' using errcode = 'P0002';
  end if;
  if v_task.version <> p_version then
    raise exception 'version_conflict' using errcode = '40001', detail = v_task.version::text;
  end if;

  v_status := v_task.status;
  v_position := v_task.position;
  if p_fields ? 'status' and (p_fields ->> 'status') is distinct from v_task.status then
    v_status := p_fields ->> 'status';
    select statuses into v_statuses from public.projects where id = v_task.project_id;
    if not public.status_exists(v_statuses, v_status) then
      raise exception 'invalid_status' using errcode = '22023', detail = v_status;
    end if;
    select coalesce(max(position), 0) + 1024 into v_position
      from public.tasks
     where project_id = v_task.project_id and status = v_status and archived_at is null and id <> p_task_id;
  end if;

  update public.tasks set
    title = case when p_fields ? 'title' then btrim(p_fields ->> 'title') else title end,
    description = case when p_fields ? 'description' then coalesce(p_fields ->> 'description', '') else description end,
    priority = case when p_fields ? 'priority' then p_fields ->> 'priority' else priority end,
    assignee_id = case when p_fields ? 'assignee_id' then (p_fields ->> 'assignee_id')::uuid else assignee_id end,
    due_date = case when p_fields ? 'due_date' then (p_fields ->> 'due_date')::date else due_date end,
    estimate = case when p_fields ? 'estimate' then (p_fields ->> 'estimate')::integer else estimate end,
    labels = case
      when not p_fields ? 'labels' then labels
      when jsonb_typeof(p_fields -> 'labels') = 'array'
        then public.normalize_labels(array(select jsonb_array_elements_text(p_fields -> 'labels')))
      else '{}'
    end,
    status = v_status,
    position = v_position,
    version = version + 1
  where id = p_task_id
  returning * into v_task;

  return v_task;
end;
$$;

-- Removes a column and moves its tasks to the end of the first remaining column.
create or replace function public.remove_status(
  p_project_id uuid,
  p_status_key text
)
returns public.projects
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_project public.projects;
  v_remaining jsonb;
  v_target text;
  v_base double precision;
begin
  select * into v_project from public.projects where id = p_project_id for update;
  if not found then
    raise exception 'project_not_found' using errcode = 'P0002';
  end if;
  if not public.status_exists(v_project.statuses, p_status_key) then
    raise exception 'status_not_found' using errcode = 'P0002', detail = p_status_key;
  end if;
  if jsonb_array_length(v_project.statuses) <= 1 then
    raise exception 'last_status' using errcode = '22023';
  end if;

  select jsonb_agg(s order by ord) into v_remaining
    from jsonb_array_elements(v_project.statuses) with ordinality as e (s, ord)
   where s ->> 'key' <> p_status_key;
  v_target := v_remaining -> 0 ->> 'key';

  select coalesce(max(position), 0) into v_base
    from public.tasks where project_id = p_project_id and status = v_target;

  with moved as (
    select id, row_number() over (order by position, created_at) as rn
      from public.tasks
     where project_id = p_project_id and status = p_status_key
  )
  update public.tasks as t
     set status = v_target, position = v_base + moved.rn * 1024, version = t.version + 1
    from moved
   where t.id = moved.id;

  update public.projects set statuses = v_remaining where id = p_project_id
  returning * into v_project;

  return v_project;
end;
$$;

-- ---------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_active_member() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_active_member() to authenticated;
grant execute on function public.is_admin() to authenticated;

revoke execute on function public.create_task(uuid, text, text, text, text, uuid, date, integer, text[]) from public, anon;
revoke execute on function public.move_task(uuid, text, integer, uuid) from public, anon;
revoke execute on function public.update_task(uuid, integer, jsonb) from public, anon;
revoke execute on function public.remove_status(uuid, text) from public, anon;
grant execute on function public.create_task(uuid, text, text, text, text, uuid, date, integer, text[]) to authenticated;
grant execute on function public.move_task(uuid, text, integer, uuid) to authenticated;
grant execute on function public.update_task(uuid, integer, jsonb) to authenticated;
grant execute on function public.remove_status(uuid, text) to authenticated;
