-- Private task images. Originals never reach Storage; server normalizes WebP bytes.
create table public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  bucket_id text not null default 'task-images' check (bucket_id = 'task-images'),
  object_key text not null unique,
  mime_type text not null default 'image/webp' check (mime_type = 'image/webp'),
  byte_size integer check (byte_size between 1 and 409600),
  width integer check (width between 1 and 1600),
  height integer check (height between 1 and 1600),
  ready boolean not null default false,
  abandoned boolean not null default false,
  created_at timestamptz not null default now(),
  check (not ready or (byte_size is not null and width is not null and height is not null)),
  check (object_key = project_id::text || '/' || task_id::text || '/' || id::text || '.webp')
);
create index task_attachments_task_idx on public.task_attachments(task_id);
alter table public.task_attachments enable row level security;
revoke all on public.task_attachments from public, anon, authenticated;
grant select on public.task_attachments to authenticated;
grant all on public.task_attachments to service_role;
create policy task_images_team_read on public.task_attachments for select to authenticated
using (ready and public.is_active_member() and exists (
  select 1 from public.tasks t join public.projects p on p.id=t.project_id
  where t.id=task_id and t.project_id=task_attachments.project_id and t.archived_at is null and p.archived_at is null
));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('task-images', 'task-images', false, 409600, array['image/webp']);
-- Authenticated users can read only completed images of unarchived work. No INSERT/UPDATE/DELETE policy.
create policy task_image_objects_team_read on storage.objects for select to authenticated
using (bucket_id='task-images' and public.is_active_member() and exists (
  select 1 from public.task_attachments a
  join public.tasks t on t.id=a.task_id and t.project_id=a.project_id
  join public.projects p on p.id=t.project_id
  where a.bucket_id=storage.objects.bucket_id and a.object_key=storage.objects.name and a.ready
  and t.archived_at is null and p.archived_at is null
));

-- Only the trusted server can reserve slots; its actor must still be active.
-- The task row lock serializes concurrent reservations, including pending uploads.
-- Unfinished reservations stop counting after 15 minutes; they can no longer complete.
create function public.reserve_task_image(p_task_id uuid, p_actor uuid)
returns public.task_attachments language plpgsql security definer set search_path='' as $$
declare t public.tasks; a public.task_attachments; image_id uuid := gen_random_uuid();
begin
  if not exists(select 1 from public.profiles where id=p_actor and active) then raise exception 'Inactive actor' using errcode='42501'; end if;
  select * into t from public.tasks where id=p_task_id and archived_at is null for update;
  if not found or not exists(select 1 from public.projects where id=t.project_id and archived_at is null) then raise exception 'Task unavailable' using errcode='P0002'; end if;
  if (select count(*) from public.task_attachments where task_id=t.id and (ready or (not abandoned and created_at >= now() - interval '15 minutes'))) >= 5 then raise exception 'Image limit reached' using errcode='22023'; end if;
  insert into public.task_attachments(id,task_id,project_id,uploaded_by,object_key)
  values(image_id,t.id,t.project_id,p_actor,t.project_id::text||'/'||t.id::text||'/'||image_id::text||'.webp') returning * into a;
  return a;
end; $$;

create function public.complete_task_image(p_id uuid, p_actor uuid, p_bytes integer, p_width integer, p_height integer)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.profiles where id=p_actor and active) then raise exception 'Inactive actor' using errcode='42501'; end if;
  update public.task_attachments a set byte_size=p_bytes,width=p_width,height=p_height,ready=true
  where a.id=p_id and a.uploaded_by=p_actor and not a.ready and not a.abandoned
  and a.created_at >= now() - interval '15 minutes' and exists (
    select 1 from public.tasks t join public.projects p on p.id=t.project_id
    where t.id=a.task_id and t.project_id=a.project_id and t.archived_at is null and p.archived_at is null
  ) and exists(select 1 from storage.objects o where o.bucket_id=a.bucket_id and o.name=a.object_key);
  if not found then raise exception 'Image unavailable' using errcode='P0002'; end if;
end; $$;

-- Abort locks the same metadata row as completion. An ambiguous completion can
-- never race orphan cleanup: a committed image returns false and is preserved.
create function public.abort_task_image(p_id uuid, p_actor uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare a public.task_attachments;
begin
  select * into a from public.task_attachments where id=p_id and uploaded_by=p_actor for update;
  if not found then raise exception 'Image unavailable' using errcode='P0002'; end if;
  if a.ready then return false; end if;
  update public.task_attachments set abandoned=true where id=p_id;
  return true;
end; $$;

-- Cleanup is server-only and can release a failed pending reservation after object removal.
create function public.cancel_task_image(p_id uuid, p_actor uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  delete from public.task_attachments a where a.id=p_id and a.uploaded_by=p_actor and not a.ready
  and not exists(select 1 from storage.objects o where o.bucket_id=a.bucket_id and o.name=a.object_key);
end; $$;
-- Server-only sweep. Expired reservations become abandoned (never completable); abandoned rows
-- whose object is already gone are deleted; keys of remaining objects are returned for removal,
-- and the next sweep deletes those rows. Ready images are never touched.
create function public.release_stale_task_images(p_task_id uuid)
returns setof text language plpgsql security definer set search_path='' as $$
begin
  update public.task_attachments a set abandoned=true
  where a.task_id=p_task_id and not a.ready and not a.abandoned and a.created_at < now() - interval '15 minutes';
  delete from public.task_attachments a where a.task_id=p_task_id and a.abandoned and not a.ready
  and not exists(select 1 from storage.objects o where o.bucket_id=a.bucket_id and o.name=a.object_key);
  return query select a.object_key from public.task_attachments a where a.task_id=p_task_id and a.abandoned and not a.ready;
end; $$;
revoke all on function public.reserve_task_image(uuid,uuid) from public,anon,authenticated;
revoke all on function public.complete_task_image(uuid,uuid,integer,integer,integer) from public,anon,authenticated;
revoke all on function public.cancel_task_image(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reserve_task_image(uuid,uuid) to service_role;
grant execute on function public.complete_task_image(uuid,uuid,integer,integer,integer) to service_role;
grant execute on function public.cancel_task_image(uuid,uuid) to service_role;

revoke all on function public.abort_task_image(uuid,uuid) from public,anon,authenticated;
grant execute on function public.abort_task_image(uuid,uuid) to service_role;
revoke all on function public.release_stale_task_images(uuid) from public,anon,authenticated;
grant execute on function public.release_stale_task_images(uuid) to service_role;
