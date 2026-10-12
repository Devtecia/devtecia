'use server';

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '../../../../lib/admin/session';
import { executeTaskMutation, type TaskMutationResult } from '../../../../lib/admin/task-workflow';
import { createClient } from '../../../../lib/supabase/server';

export async function mutateTask(raw: unknown): Promise<TaskMutationResult> {
  const supabase = await createClient();
  const result = await executeTaskMutation(raw, {
    active: async () => (await getAdminSession()).status === 'active',
    project: async id => {
      const { data, error } = await supabase.from('projects').select('id, key, statuses').eq('id', id).is('archived_at', null).maybeSingle();
      if (error) throw error;
      return data;
    },
    task: async id => {
      const { data, error } = await supabase.from('tasks').select('id, project_id, status, version').eq('id', id).is('archived_at', null).maybeSingle();
      if (error) throw error;
      return data;
    },
    assignee: async id => {
      const { data, error } = await supabase.from('profiles').select('id').eq('id', id).eq('active', true).maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    rpc: async (name, args) => {
      const { error } = await supabase.rpc(name, args);
      return { error };
    },
  });
  if (result.ok) {
    revalidatePath(`/admin/projects/${result.projectKey}`);
    revalidatePath('/admin', 'layout');
  }
  return result;
}
