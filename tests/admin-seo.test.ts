import assert from 'node:assert/strict';
import test from 'node:test';
import robots from '../app/robots';
import sitemap from '../app/sitemap';

test('robots keeps admin out of search engines', () => {
  const rules = [robots().rules].flat();
  const disallowed = rules.flatMap(rule => [rule.disallow ?? []].flat());
  assert.ok(disallowed.includes('/admin'), 'expected /admin to be disallowed');
  assert.ok(disallowed.includes('/api/'), 'expected /api/ to stay disallowed');
});

test('sitemap never lists admin pages', () => {
  assert.ok(sitemap().every(entry => !entry.url.includes('/admin')));
});
