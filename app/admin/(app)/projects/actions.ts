'use server';

import { redirect } from 'next/navigation';
import { parseProjectInput, type ProjectInputErrors } from '../../../../lib/admin/project-input';
import { getAdminSession } from '../../../../lib/admin/session';
import { createClient } from '../../../../lib/supabase/server';

export type ProjectFormState = { errors?: ProjectInputErrors; message?: string; values?: Record<string, string> };

export async function createProject(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const raw = Object.fromEntries(['name', 'key', 'client', 'color'].map(field => [field, String(formData.get(field) ?? '')]));
  const parsed = parseProjectInput(raw);
  if (!parsed.ok) return { errors: parsed.errors, values: raw };

  const session = await getAdminSession();
  if (session.status !== 'active') redirect('/admin/login');

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from('projects')
    .insert(parsed.value)
    .select('id, key')
    .single<{ id: string; key: string }>();
  if (error?.code === '23505') return { errors: { key: `Ya existe un proyecto con la clave ${parsed.value.key}.` }, values: raw };
  if (error || !project) return { message: 'No pudimos crear el proyecto. Intenta de nuevo.', values: raw };

  await supabase.from('project_members').insert({ project_id: project.id, profile_id: session.profile.id });
  redirect(`/admin/projects/${project.key}`);
}
