import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../supabase/migrations/0001_admin_kanban.sql', import.meta.url), 'utf8').toLowerCase();
const functionBody = (name: string) => {
  const start = sql.indexOf(`function public.${name}(`);
  assert.ok(start >= 0, `missing function ${name}`);
  return sql.slice(start, sql.indexOf('$$;', sql.indexOf('$$', start) + 2));
};

test('every table enables row level security', () => {
  for (const table of ['profiles', 'projects', 'project_members', 'tasks']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }
});

test('definer helpers pin the search path and data functions run as invoker', () => {
  for (const name of ['is_active_member', 'is_admin', 'handle_new_user']) {
    const body = functionBody(name);
    assert.match(body, /security definer/);
    assert.match(body, /set search_path = ''/);
  }
  for (const name of ['create_task', 'move_task', 'update_task', 'remove_status']) {
    const body = functionBody(name);
    assert.match(body, /security invoker/);
    assert.match(body, /set search_path = ''/);
  }
});

test('optimistic locking raises a serialization conflict code', () => {
  for (const name of ['move_task', 'update_task']) assert.match(functionBody(name), /errcode = '40001'/);
});

test('profiles only let members edit their name, initials and color', () => {
  assert.match(sql, /revoke update on public\.profiles from authenticated/);
  assert.match(sql, /grant update \(name, initials, color\) on public\.profiles to authenticated/);
  assert.doesNotMatch(sql, /create policy[^;]*on public\.profiles\s+for (insert|delete|all)/);
});

test('ships the six default statuses in spanish', () => {
  for (const label of ['backlog', 'por hacer', 'en curso', 'revisión', 'bloqueado', 'terminado']) assert.ok(sql.includes(`"${label}"`), label);
});
