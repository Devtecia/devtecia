import assert from 'node:assert/strict';
import test from 'node:test';
import { initialsFrom } from '../lib/admin/initials';

test('uses the first letter of the first two words', () => {
  assert.equal(initialsFrom('Luis Grajales'), 'LG');
  assert.equal(initialsFrom('  maría   josé  pérez '), 'MJ');
});

test('uses two letters of a single word and falls back to the email', () => {
  assert.equal(initialsFrom('Camila'), 'CA');
  assert.equal(initialsFrom('', 'luis.grajales@devtecia.com'), 'LG');
  assert.equal(initialsFrom(undefined, 'ana@devtecia.com'), 'AN');
  assert.equal(initialsFrom('', ''), '?');
});
