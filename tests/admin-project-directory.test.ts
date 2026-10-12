import assert from 'node:assert/strict';
import test from 'node:test';
import { parseProjectDirectory, directoryHref } from '../lib/admin/project-directory';

test('directory bounds and normalizes filters and pagination', () => {
  assert.deepEqual(parseProjectDirectory({ q: '  tienda  ', client: ' A ', page: '-5', sort: 'bad' }), { q: 'tienda', client: 'A', page: 1, sort: 'name', offset: 0 });
  assert.equal(parseProjectDirectory({ page: '2' }).offset, 24);
  assert.equal(parseProjectDirectory({ page: '1e9' }).page, 1);
  assert.equal(parseProjectDirectory({ page: '999999999999999' }).page, 1);
  assert.equal(parseProjectDirectory({ q: ['ignored'], sort: 'newest' }).sort, 'newest');
});
test('pagination preserves filters with encoded parameters', () => {
  assert.match(directoryHref(parseProjectDirectory({ q: 'a&b', client: 'store' }), 2), /q=a%26b/);
  assert.match(directoryHref(parseProjectDirectory({}), 2), /page=2/);
});
