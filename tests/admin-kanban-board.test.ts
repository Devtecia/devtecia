import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { columnTasks, filterTasks, reorderTarget, type BoardTask } from '../lib/admin/task-board';
const tasks = [
  { id: 'a', title: 'Entrega', status: 'todo', position: 1024, number: 1, priority: 'high', labels: ['Sitio'], created_at: '2026-01-01' },
  { id: 'b', title: 'Revisar', status: 'todo', position: 2048, number: 2, priority: 'low', labels: [], created_at: '2026-01-01' },
  { id: 'c', title: 'Publicar', status: 'todo', position: 3072, number: 3, priority: 'high', labels: [], created_at: '2026-01-01' },
] as BoardTask[];
test('column order is stable and filters match titles, numbers, labels and priority', () => {
  assert.deepEqual(columnTasks([...tasks].reverse(), 'todo').map(t => t.id), ['a', 'b', 'c']);
  assert.deepEqual(filterTasks(tasks, 'sitio', 'all', 'WEB').map(t => t.id), ['a']);
  assert.deepEqual(filterTasks(tasks, 'web 2', 'all', 'WEB').map(t => t.id), ['b']);
  assert.deepEqual(filterTasks(tasks, '', 'high', 'WEB').map(t => t.id), ['a', 'c']);
});
test('accessible reorder uses full column including hidden tasks', () => {
  assert.equal(reorderTarget(tasks, 'c', 'up'), 'b');
  assert.equal(reorderTarget(tasks, 'a', 'down'), 'c');
  assert.equal(reorderTarget(tasks, 'b', 'down'), null);
  assert.equal(reorderTarget(tasks, 'a', 'up'), undefined);
});
test('board uses native modal, accessible move controls and server refresh', () => {
  const board = readFileSync('app/admin/(app)/projects/[key]/kanban-board.tsx', 'utf8');
  const form = readFileSync('app/admin/(app)/projects/[key]/task-form.tsx', 'utf8');
  const actions = readFileSync('app/admin/(app)/projects/task-actions.ts', 'utf8');
  assert.match(board, /showModal\(/);
  assert.match(board, /onCancel/);
  assert.match(board, /reorderTarget\(/);
  assert.match(form, /aria-invalid/);
  assert.match(actions, /revalidatePath\('\/admin', 'layout'\)/);
  assert.doesNotMatch(actions, /supabase\/admin/);
});
