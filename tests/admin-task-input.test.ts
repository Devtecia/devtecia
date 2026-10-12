import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTaskInput, parseTaskMutation } from '../lib/admin/task-input';
const id = '11111111-1111-4111-8111-111111111111';
const valid = { title: '  Preparar entrega  ', description: '', status: 'todo', priority: 'medium', assignee_id: '', due_date: '', estimate: '', labels: ' Sitio, sitio, Cliente ' };
test('task input trims labels and clears nullable fields', () => {
  const result = parseTaskInput(valid);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value, { ...valid, title: 'Preparar entrega', assignee_id: null, due_date: null, estimate: null, labels: ['Sitio', 'Cliente'] });
});
test('task input rejects invalid fields, impossible dates and noninteger estimates', () => {
  for (const raw of [{ ...valid, title: '' }, { ...valid, priority: 'wrong' }, { ...valid, due_date: '2026-02-30' }, { ...valid, estimate: '1.5' }, { ...valid, estimate: '1001' }, { ...valid, assignee_id: 'x' }, { ...valid, description: 'x'.repeat(20001) }, { ...valid, labels: 'x'.repeat(41) }]) assert.equal(parseTaskInput(raw).ok, false);
});
test('task mutation rejects invalid operation, ids, versions and self target', () => {
  assert.equal(parseTaskMutation({ kind: 'create', projectId: id, fields: valid }).ok, true);
  for (const raw of [{ kind: 'delete', projectId: id }, { kind: 'move', projectId: id, taskId: id, version: 0, status: 'todo' }, { kind: 'move', projectId: id, taskId: id, version: 1, status: 'todo', beforeTaskId: id }, { kind: 'update', projectId: 'x', taskId: id, version: 1, fields: valid }]) assert.equal(parseTaskMutation(raw).ok, false);
});
