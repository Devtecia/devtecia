import 'server-only';
import { cache } from 'react';
import { createClient } from '../supabase/server';
import type { ProjectStatus, ProjectSummary } from './session-types';
import type { BoardTask, TaskAssignee } from './task-board';

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
  tasks: BoardTask[];
  assignees: TaskAssignee[];
};

export const getProjectByKey = cache(async (key: string): Promise<ProjectDetail | null> => {
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, key, name, color, client, description, statuses')
    .eq('key', key.toUpperCase())
    .is('archived_at', null)
    .maybeSingle<Omit<ProjectDetail, 'statusCounts' | 'tasks' | 'assignees'>>();
  if (error) throw new Error('Could not load the project.');
  if (!project) return null;

  // Fetch all pages so reorder anchors never omit a hidden database page.
  const tasks: BoardTask[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error: tasksError } = await supabase
      .from('tasks')
      .select('id, project_id, number, title, description, status, priority, assignee_id, due_date, estimate, labels, position, version, created_at')
      .eq('project_id', project.id)
      .is('archived_at', null)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + 499)
      .returns<BoardTask[]>();
    if (tasksError) throw new Error('Could not load the project tasks.');
    tasks.push(...data ?? []);
    if (!data || data.length < 500) break;
  }

  const { data: assignees, error: assigneesError } = await supabase.from('profiles')
    .select('id, name, initials, color').eq('active', true).order('name').returns<TaskAssignee[]>();
  if (assigneesError) throw new Error('Could not load the team.');

  const statusCounts: Record<string, number> = {};
  for (const { status } of tasks ?? []) statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  return { ...project, statusCounts, tasks: tasks ?? [], assignees: assignees ?? [] };
});
