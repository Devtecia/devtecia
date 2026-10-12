import assert from 'node:assert/strict';
import test from 'node:test';
import { parseProjectInput, suggestProjectKey } from '../lib/admin/project-input';

test('suggests an uppercase key from the project name', () => {
  assert.equal(suggestProjectKey('Sitio web Devtecia'), 'SWD');
  assert.equal(suggestProjectKey('operaciones'), 'OPER');
  assert.equal(suggestProjectKey('Año 2026 app'), 'A2A');
  assert.equal(suggestProjectKey(''), '');
});

test('accepts a valid project and normalizes its fields', () => {
  const result = parseProjectInput({ name: '  Sitio web ', key: 'web', client: ' Devtecia ', color: '#7ccbff' });
  assert.deepEqual(result, { ok: true, value: { name: 'Sitio web', key: 'WEB', client: 'Devtecia', color: '#7CCBFF' } });
});

test('rejects invalid input with specific spanish messages', () => {
  const result = parseProjectInput({ name: ' ', key: '1X', client: '', color: 'red' });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.errors.name, 'Escribe el nombre del proyecto.');
  assert.match(result.errors.key ?? '', /letra/);
  assert.match(result.errors.color ?? '', /color/);
});
