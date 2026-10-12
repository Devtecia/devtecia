import test from 'node:test';
import assert from 'node:assert/strict';
import { executeTaskMutation, type TaskMutationPort } from '../lib/admin/task-workflow';
const projectId = '11111111-1111-4111-8111-111111111111';
const taskId = '22222222-2222-4222-8222-222222222222';
const otherId = '33333333-3333-4333-8333-333333333333';
const fields = { title: 'Entrega', status: 'todo', priority: 'high', description: '', labels: '', due_date: '', estimate: '', assignee_id: '' };
function fake(overrides: Partial<TaskMutationPort> = {}) {
  const calls: [string, Record<string, unknown>][] = [];
  const port: TaskMutationPort = {
    active: async () => true,
    project: async () => ({ id: projectId, key: 'WEB', statuses: [{ key: 'todo' }, { key: 'done' }] }),
    task: async id => ({ id, project_id: projectId, status: 'todo', version: 3 }),
    assignee: async () => true,
    rpc: async (name, args) => { calls.push([name, args]); return { error: null }; },
    ...overrides,
  };
  return { port, calls };
}
test('create validates and uses existing RPC with normalized nullable fields', async () => {
  const { port, calls } = fake();
  assert.equal((await executeTaskMutation({ kind: 'create', projectId, fields }, port)).ok, true);
  assert.equal(calls[0][0], 'create_task');
  assert.equal(calls[0][1].p_assignee_id, null);
});
test('update and move forward expected versions and anchors', async () => {
  const { port, calls } = fake();
  assert.equal((await executeTaskMutation({ kind: 'update', projectId, taskId, version: 3, fields }, port)).ok, true);
  assert.equal(calls[0][0], 'update_task');
  assert.equal(calls[0][1].p_version, 3);
  assert.equal((await executeTaskMutation({ kind: 'move', projectId, taskId, version: 3, status: 'todo', beforeTaskId: otherId }, port)).ok, true);
  assert.equal(calls[1][1].p_before_task_id, otherId);
});
test('unauthorized, archived/missing project, foreign task, invalid status/assignee are refused without RPC', async () => {
  const scenarios: [Partial<TaskMutationPort>, object][] = [
    [{ active: async () => false }, {}], [{ project: async () => null }, {}],
    [{ task: async () => ({ id: taskId, project_id: otherId, version: 3, status: 'todo' }) }, {}],
    [{}, { fields: { ...fields, status: 'bogus' } }],
    [{ assignee: async () => false }, { fields: { ...fields, assignee_id: otherId } }],
  ];
  for (const [override, raw] of scenarios) {
    const { port, calls } = fake(override);
    assert.equal((await executeTaskMutation({ kind: 'update', projectId, taskId, version: 3, fields, ...raw }, port)).ok, false);
    assert.equal(calls.length, 0);
  }
});
test('stale version and invalid move target do not write', async () => {
  const { port, calls } = fake();
  const stale = await executeTaskMutation({ kind: 'move', projectId, taskId, version: 2, status: 'todo' }, port);
  assert.equal(stale.ok, false);
  assert.match(stale.message ?? '', /actualizada/);
  const bad = fake({ task: async id => ({ id, project_id: projectId, status: id === taskId ? 'todo' : 'done', version: 3 }) });
  assert.equal((await executeTaskMutation({ kind: 'move', projectId, taskId, version: 3, status: 'todo', beforeTaskId: otherId }, bad.port)).ok, false);
  assert.equal(calls.length + bad.calls.length, 0);
});
test('database conflicts and transport errors return safe errors', async () => {
  for (const code of ['40001', '42501', 'P0002', '22023', 'XX000']) {
    const { port } = fake({ rpc: async () => ({ error: { code } }) });
    const result = await executeTaskMutation({ kind: 'create', projectId, fields }, port);
    assert.equal(result.ok, false);
    assert.ok(result.message);
  }
  const { port } = fake({ project: async () => { throw new Error('secret database detail'); } });
  const result = await executeTaskMutation({ kind: 'create', projectId, fields }, port);
  assert.equal(result.ok, false);
  assert.doesNotMatch(result.message ?? '', /secret/);
});
