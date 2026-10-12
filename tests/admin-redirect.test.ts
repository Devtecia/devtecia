import assert from 'node:assert/strict';
import test from 'node:test';
import { safeAdminPath } from '../lib/admin/redirect';

test('keeps same origin admin paths with their query', () => {
  assert.equal(safeAdminPath('/admin'), '/admin');
  assert.equal(safeAdminPath('/admin/projects/WEB'), '/admin/projects/WEB');
  assert.equal(safeAdminPath('/admin/projects/WEB?task=7'), '/admin/projects/WEB?task=7');
});

test('rejects open redirects and paths outside admin', () => {
  for (const value of ['//evil.com', '//evil.com/admin', 'https://evil.com/admin', '/', '/hablemos', '/adminx',
    '/admin/../hablemos', '/\\evil.com', 'javascript:alert(1)', '', '   ', '/admin\n/x', '/admin/login', '/admin/login?next=/admin']) {
    assert.equal(safeAdminPath(value), '/admin', `expected fallback for ${JSON.stringify(value)}`);
  }
});

test('falls back for non string values and honors a custom fallback', () => {
  assert.equal(safeAdminPath(undefined), '/admin');
  assert.equal(safeAdminPath(null, '/admin/users'), '/admin/users');
});
