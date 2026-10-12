import 'server-only';
import { cache } from 'react';
import { createClient } from '../supabase/server';
import type { ProjectStatus, ProjectSummary } from './session-types';

type ProjectRow = Omit<ProjectSummary, 'taskCount'> & { tasks: { count: number }[] };

/** Active projects with their open task counts, oldest first. */
export const listProjects = cache(async (): Promise<ProjectSummary[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('id, key, name, color, client, tasks(count)')
    .is('archived_at', null)
    .is('tasks.archived_at', null)
    .order('created_at', { ascending: true })
    .returns<ProjectRow[]>();
  if (error) throw new Error('Could not load projects.');
  return (data ?? []).map(({ tasks, ...project }) => ({ ...project, taskCount: tasks[0]?.count ?? 0 }));
});

export type ProjectDetail = Omit<ProjectSummary, 'taskCount'> & {
  description: string;
  statuses: ProjectStatus[];
  statusCounts: Record<string, number>;
};

export const getProjectByKey = cache(async (key: string): Promise<ProjectDetail | null> => {
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, key, name, color, client, description, statuses')
    .eq('key', key.toUpperCase())
    .is('archived_at', null)
    .maybeSingle<Omit<ProjectDetail, 'statusCounts'>>();
  if (error) throw new Error('Could not load the project.');
  if (!project) return null;

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('status')
    .eq('project_id', project.id)
    .is('archived_at', null)
    .returns<{ status: string }[]>();
  if (tasksError) throw new Error('Could not load the project tasks.');

  const statusCounts: Record<string, number> = {};
  for (const { status } of tasks ?? []) statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  return { ...project, statusCounts };
});
