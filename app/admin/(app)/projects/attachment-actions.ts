'use server';

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '../../../../lib/admin/session';
import { processTaskImage } from '../../../../lib/admin/task-image-processor';
import { uploadTaskAttachment } from '../../../../lib/admin/task-attachments';
import { MAX_IMAGE_BYTES, TASK_IMAGE_BUCKET, type TaskAttachment } from '../../../../lib/admin/task-images';
import { createClient } from '../../../../lib/supabase/server';
import { createAdminClient } from '../../../../lib/supabase/admin';

async function authorizedTask(taskId: string) {
  const session = await getAdminSession();
  if (session.status !== 'active') return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from('tasks').select('id,project_id,projects!inner(key,archived_at)').eq('id', taskId).is('archived_at', null).is('projects.archived_at', null).maybeSingle();
  if (error || !data) return null;
  return { userId: session.profile.id, projectId: data.project_id };
}
export async function addTaskImage(taskId: string, form: FormData) {
  const file = form.get('image');
  if (!(file instanceof File) || file.size > MAX_IMAGE_BYTES || !file.size) return { ok: false, message: 'La imagen debe optimizarse antes de subirla (máximo 400 KiB).' };
  // Creating a service client occurs only after user-bound task authorization.
  let admin: ReturnType<typeof createAdminClient>;
  const result = await uploadTaskAttachment(taskId, new Uint8Array(await file.arrayBuffer()), {
    authorize: async id => {
      const context = await authorizedTask(id);
      if (context) admin = createAdminClient();
      return context;
    },
    process: processTaskImage,
    reserve: async (id, actor) => {
      const { data, error } = await admin.rpc('reserve_task_image', { p_task_id: id, p_actor: actor });
      if (error || !data?.id || !data?.object_key) throw new Error('Could not reserve image.');
      return { id: data.id as string, objectKey: data.object_key as string };
    },
    upload: async (key, bytes) => {
      const { error } = await admin.storage.from(TASK_IMAGE_BUCKET).upload(key, bytes, { contentType: 'image/webp', upsert: false });
      if (error) throw error;
    },
    complete: async (id, actor, image) => {
      const { error } = await admin.rpc('complete_task_image', { p_id: id, p_actor: actor, p_bytes: image.byteSize, p_width: image.width, p_height: image.height });
      if (error) throw error;
    },
    abort: async (id, actor) => { const { data, error } = await admin.rpc('abort_task_image', { p_id: id, p_actor: actor }); if (error || typeof data !== 'boolean') throw error ?? new Error('Uncertain cleanup.'); return data; },
    remove: async key => { const { error } = await admin.storage.from(TASK_IMAGE_BUCKET).remove([key]); if (error) throw error; },
    cancel: async (id, actor) => { const { error } = await admin.rpc('cancel_task_image', { p_id: id, p_actor: actor }); if (error) throw error; },
  });
  if (result.ok) revalidatePath('/admin/projects', 'layout');
  return result;
}

export async function getTaskImages(taskId: string): Promise<{ ok: boolean; images: TaskAttachment[] }> {
  try {
    if (!await authorizedTask(taskId)) return { ok: false, images: [] };
    const supabase = await createClient();
    const { data, error } = await supabase.from('task_attachments').select('id,task_id,object_key,width,height,byte_size,created_at').eq('task_id', taskId).eq('ready', true).order('created_at').limit(5);
    if (error) return { ok: false, images: [] };
    const images: TaskAttachment[] = [];
    for (const row of data ?? []) {
      const { data: signed, error: signError } = await supabase.storage.from(TASK_IMAGE_BUCKET).createSignedUrl(row.object_key, 300);
      if (signError || !signed) return { ok: false, images: [] };
      images.push({ id: row.id, task_id: row.task_id, width: row.width, height: row.height, byte_size: row.byte_size, created_at: row.created_at, url: signed.signedUrl });
    }
    return { ok: true, images };
  } catch { return { ok: false, images: [] }; }
}
