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
    process: async () => ({ bytes: Buffer.from('webp'), width: 4, height: 4, byteSize: 4 }),
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
  assert.deepEqual(calls, ['reserve', 'upload', 'complete']);
});
test('metadata failure deletes orphan before releasing reservation', async () => {
  const { port, calls } = fake({ complete: async () => { throw Error('secret'); } });
  const result = await uploadTaskAttachment(taskId, Buffer.from('x'), port);
  assert.equal(result.ok, false);
  assert.doesNotMatch(result.message ?? '', /secret/);
  assert.deepEqual(calls, ['reserve', 'upload', 'abort', 'remove', 'cancel']);
});
test('failed orphan cleanup retains reservation rather than granting another slot', async () => {
  const { port, calls } = fake({ complete: async () => { throw Error('db'); }, remove: async () => { calls.push('remove'); throw Error('storage'); } });
  assert.equal((await uploadTaskAttachment(taskId, Buffer.from('x'), port)).ok, false);
  assert.ok(!calls.includes('cancel'));
});

test('uncertain completion that committed never removes the saved image', async () => {
  const { port, calls } = fake({ complete: async () => { throw Error('response lost'); }, abort: async () => false });
  assert.equal((await uploadTaskAttachment(taskId, Buffer.from('x'), port)).ok, true);
  assert.deepEqual(calls, ['reserve', 'upload']);
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
