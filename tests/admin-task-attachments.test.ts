import assert from 'node:assert/strict';
import test from 'node:test';
import { uploadTaskAttachment, type AttachmentPort } from '../lib/admin/task-attachments';
const taskId = '11111111-1111-4111-8111-111111111111';
const projectId = '22222222-2222-4222-8222-222222222222';
const imageId = '33333333-3333-4333-8333-333333333333';
function fake(overrides: Partial<AttachmentPort> = {}) {
  const calls: string[] = [];
  const port: AttachmentPort = {
    authorize: async () => ({ userId: imageId, projectId }),
    hasSlot: async () => { calls.push('slot'); return true; },
    process: async () => { calls.push('process'); return { bytes: Buffer.from('webp'), width: 4, height: 4, byteSize: 4 }; },
    reserve: async () => { calls.push('reserve'); return { id: imageId, objectKey: `${projectId}/${taskId}/${imageId}.webp` }; },
    upload: async () => { calls.push('upload'); },
    complete: async () => { calls.push('complete'); },
    abort: async () => { calls.push('abort'); return true; },
    remove: async () => { calls.push('remove'); },
    cancel: async () => { calls.push('cancel'); },
    ...overrides,
  };
  return { port, calls };
}
test('unauthorized task upload never processes or writes', async () => {
  const { port, calls } = fake({ authorize: async () => null, process: async () => { throw Error('must not run'); } });
  assert.equal((await uploadTaskAttachment(taskId, Buffer.from('x'), port)).ok, false);
  assert.deepEqual(calls, []);
});
test('upload reserves before object creation and completes metadata', async () => {
  const { port, calls } = fake();
  assert.equal((await uploadTaskAttachment(taskId, Buffer.from('x'), port)).ok, true);
  assert.deepEqual(calls, ['slot', 'process', 'reserve', 'upload', 'complete']);
});
test('metadata failure deletes orphan before releasing reservation', async () => {
  const { port, calls } = fake({ complete: async () => { throw Error('secret'); } });
  const result = await uploadTaskAttachment(taskId, Buffer.from('x'), port);
  assert.equal(result.ok, false);
  assert.doesNotMatch(result.message ?? '', /secret/);
  assert.deepEqual(calls, ['slot', 'process', 'reserve', 'upload', 'abort', 'remove', 'cancel']);
});
test('failed orphan cleanup retains reservation rather than granting another slot', async () => {
  const { port, calls } = fake({ complete: async () => { throw Error('db'); }, remove: async () => { calls.push('remove'); throw Error('storage'); } });
  assert.equal((await uploadTaskAttachment(taskId, Buffer.from('x'), port)).ok, false);
  assert.ok(!calls.includes('cancel'));
});

test('uncertain completion that committed never removes the saved image', async () => {
  const { port, calls } = fake({ complete: async () => { throw Error('response lost'); }, abort: async () => false });
  assert.equal((await uploadTaskAttachment(taskId, Buffer.from('x'), port)).ok, true);
  assert.deepEqual(calls, ['slot', 'process', 'reserve', 'upload']);
});

test('full task is refused before any image processing or reservation', async () => {
  const { port, calls } = fake({ hasSlot: async () => { calls.push('slot'); return false; } });
  const result = await uploadTaskAttachment(taskId, Buffer.from('x'), port);
  assert.equal(result.ok, false);
  assert.match(result.message ?? '', /5 imágenes/);
  assert.deepEqual(calls, ['slot']);
});

test('failed slot check never processes or reserves', async () => {
  const { port, calls } = fake({ hasSlot: async () => { calls.push('slot'); throw Error('db'); } });
  assert.equal((await uploadTaskAttachment(taskId, Buffer.from('x'), port)).ok, false);
  assert.deepEqual(calls, ['slot']);
});

test('migration expires stale reservations and gates storage reads on unarchived work', async () => {
  const { readFileSync } = await import('node:fs');
  const sql = readFileSync('supabase/migrations/0005_task_attachments.sql', 'utf8');
  assert.match(sql, /where task_id=t.id and \(ready or \(not abandoned and created_at >= now\(\) - interval '15 minutes'\)\)\) >= 5/);
  assert.match(sql, /create function public.release_stale_task_images\(p_task_id uuid\)/);
  assert.match(sql, /revoke all on function public.release_stale_task_images\(uuid\) from public,anon,authenticated/);
  assert.match(sql, /grant execute on function public.release_stale_task_images\(uuid\) to service_role/);
  assert.match(sql, /a.created_at >= now\(\) - interval '15 minutes'/);
  const policy = sql.slice(sql.indexOf('create policy task_image_objects_team_read'), sql.indexOf('create function'));
  assert.match(policy, /t.archived_at is null and p.archived_at is null/);
});

test('server action sweeps stale reservations and checks slots before processing', async () => {
  const { readFileSync } = await import('node:fs');
  const action = readFileSync('app/admin/(app)/projects/attachment-actions.ts', 'utf8');
  assert.match(action, /release_stale_task_images/);
  assert.match(action, /hasSlot:/);
});

test('migration restricts image writes, reserves under lock and bounds storage', async () => {
  const { readFileSync } = await import('node:fs');
  const sql = readFileSync('supabase/migrations/0005_task_attachments.sql', 'utf8');
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on public.task_attachments from public, anon, authenticated/);
  assert.match(sql, /for update/);
  assert.match(sql, /count\(\*\).*>= 5/);
  assert.match(sql, /false, 409600, array\['image\/webp'\]/);
  assert.match(sql, /grant execute on function public.reserve_task_image\(uuid,uuid\) to service_role/);
  assert.match(sql, /not a.abandoned/);
});

test('image retry keeps the saved task ID and only retries failed files', async () => {
  const { uploadImageQueue } = await import('../lib/admin/task-image-client');
  const files = ['capture-a', 'capture-b'].map(id => ({ id, name: id, file: new File(['webp'], `${id}.webp`, { type: 'image/webp' }) }));
  const attempts: string[] = [];
  const failed = await uploadImageQueue(taskId, files, async (id, file) => {
    assert.equal(id, taskId);
    attempts.push(file.name);
    return { ok: file.name !== 'capture-b.webp', message: 'Try again' };
  });
  assert.equal(failed.length, 1);
  assert.deepEqual(attempts, ['capture-a.webp', 'capture-b.webp']);
  await uploadImageQueue(taskId, failed, async (id, file) => { assert.equal(id, taskId); attempts.push(file.name); return { ok: true }; });
  assert.deepEqual(attempts, ['capture-a.webp', 'capture-b.webp', 'capture-b.webp']);
});

test('task editor skips mutation on image-only retry and transports only compressed files', async () => {
  const { readFileSync } = await import('node:fs');
  const form = readFileSync('app/admin/(app)/projects/[key]/task-form.tsx', 'utf8');
  assert.match(form, /savedTaskId \? \{ ok: true/);
  assert.match(form, /attachments.upload\(result.taskId\)/);
  const client = readFileSync('lib/admin/task-image-client.ts', 'utf8');
  assert.ok(client.indexOf('sourceImageDimensions(bytes)') < client.indexOf('createImageBitmap(file'));
  assert.match(client, /new File\(\[blob\], 'task-image.webp'/);
});
