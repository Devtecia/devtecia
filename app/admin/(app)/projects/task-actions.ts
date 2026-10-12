'use server';

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '../../../../lib/admin/session';
import { executeTaskArchive, executeTaskMutation, type TaskArchiveResult, type TaskMutationResult } from '../../../../lib/admin/task-workflow';
import { createClient } from '../../../../lib/supabase/server';

type Supabase = Awaited<ReturnType<typeof createClient>>;

function lookups(supabase: Supabase) {
  return {
    active: async () => (await getAdminSession()).status === 'active',
    project: async (id: string) => {
      const { data, error } = await supabase.from('projects').select('id, key, statuses').eq('id', id).is('archived_at', null).maybeSingle();
      if (error) throw error;
      return data;
    },
    task: async (id: string) => {
      const { data, error } = await supabase.from('tasks').select('id, project_id, status, version').eq('id', id).is('archived_at', null).maybeSingle();
      if (error) throw error;
      return data;
    },
  };
}

function revalidateBoard(projectKey: string) {
  revalidatePath(`/admin/projects/${projectKey}`);
  revalidatePath('/admin', 'layout');
}

export async function mutateTask(raw: unknown): Promise<TaskMutationResult> {
  const supabase = await createClient();
  const result = await executeTaskMutation(raw, {
    ...lookups(supabase),
    assignee: async id => {
      const { data, error } = await supabase.from('profiles').select('id').eq('id', id).eq('active', true).maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    rpc: async (name, args) => {
      const { data, error } = await supabase.rpc(name, args);
      return { error, data };
    },
  });
  if (result.ok && result.projectKey) revalidateBoard(result.projectKey);
  return result;
}

/** Soft-deletes a task: it stays stored (with its images) but leaves every board query. */
export async function archiveTask(raw: unknown): Promise<TaskArchiveResult> {
  const supabase = await createClient();
  const result = await executeTaskArchive(raw, {
    ...lookups(supabase),
    archive: async (id, version) => {
      const { data, error } = await supabase.from('tasks')
        .update({ archived_at: new Date().toISOString(), version: version + 1 })
        .eq('id', id).eq('version', version).is('archived_at', null)
        .select('id');
      return { error, archived: Boolean(data?.length) };
    },
  });
  if (result.ok && result.projectKey) revalidateBoard(result.projectKey);
  return result;
}
