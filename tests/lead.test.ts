import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { LEAD_KEY, LEAD_TTL_MS, adsEmail, adsPhone, consumeLead, decodeLead, encodeLead, hashContact, isEventId, isSha256Hex, markLead, newEventId, settleLead, thanksUrl } from '../lib/lead';

const memory = (initial: Record<string, string> = {}) => {
  const data: Record<string, string> = { ...initial };
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => { data[key] = value; },
    removeItem: (key: string) => { delete data[key]; },
  };
};
const broken = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('blocked'); },
  removeItem: () => { throw new Error('blocked'); },
};
const ids = { meta: '123456789012345', ga: 'G-ABC123XYZ9', ads: '' };
const now = 1_700_000_000_000;

test('the marker keeps only a known angle and interest', () => {
  assert.deepEqual(decodeLead(encodeLead({ angle: 'excel', interest: 'operations' }, now), now), { angle: 'excel', interest: 'operations' });
  assert.deepEqual(decodeLead(encodeLead({ angle: 'nope', interest: '<script>' }, now), now), {});
  assert.deepEqual(decodeLead(encodeLead({}, now), now), {});
});

test('a corrupted, foreign or stale marker never counts as a lead', () => {
  for (const raw of [null, '', 'lead', '{', '[]', 'null', '1', '{"angle":"excel"}', JSON.stringify({ at: 'yesterday' })]) assert.equal(decodeLead(raw, now), null, String(raw));
  assert.equal(decodeLead(encodeLead({}, now - LEAD_TTL_MS - 1), now), null);
  assert.equal(decodeLead(encodeLead({}, now + 60_000), now), null);
  assert.deepEqual(decodeLead(encodeLead({}, now - 1000), now), {});
});

test('the marker is consumed once: a reload or a direct visit finds nothing', () => {
  const store = memory();
  assert.equal(markLead(store, { angle: 'tareas', interest: 'automation' }, now), true);
  assert.ok(store.data[LEAD_KEY]);
  assert.deepEqual(consumeLead(store, now), { angle: 'tareas', interest: 'automation' });
  assert.equal(store.data[LEAD_KEY], undefined);
  assert.equal(consumeLead(store, now), null);
  assert.equal(consumeLead(memory(), now), null);
});

test('blocked or missing storage never throws', () => {
  assert.equal(markLead(broken, {}, now), false);
  assert.equal(markLead(undefined, {}, now), false);
  assert.equal(consumeLead(broken, now), null);
  assert.equal(consumeLead(undefined, now), null);
});

test('the lead fires only with consent and trackers, but the marker is always spent', () => {
  const granted = memory();
  markLead(granted, { angle: 'medida' }, now);
  assert.deepEqual(settleLead(granted, 'granted', ids, now), { angle: 'medida' });
  assert.equal(settleLead(granted, 'granted', ids, now), null);

  for (const [consent, trackers] of [['denied', ids], [null, ids], ['granted', { meta: '', ga: '', ads: '' }]] as const) {
    const store = memory();
    markLead(store, {}, now);
    assert.equal(settleLead(store, consent, trackers, now), null);
    assert.equal(store.data[LEAD_KEY], undefined, `${consent} keeps no marker behind`);
  }
});

test('the thanks url keeps the campaign query string', () => {
  assert.equal(thanksUrl('/gracias', '?utm_source=meta&a=excel'), '/gracias?utm_source=meta&a=excel');
  assert.equal(thanksUrl('/en/thanks', 'utm_source=google'), '/en/thanks?utm_source=google');
  assert.equal(thanksUrl('/gracias', ''), '/gracias');
  assert.equal(thanksUrl('/gracias', '?'), '/gracias');
  assert.equal(thanksUrl('/gracias', undefined), '/gracias');
});

test('the marker carries the shared event id when it is valid and stays readable without it', () => {
  const eventId = '0b6f1c2e-6c39-4c0e-9a51-2f6f8d1c9e10';
  assert.deepEqual(decodeLead(encodeLead({ angle: 'excel', eventId }, now), now), { angle: 'excel', eventId });
  assert.deepEqual(decodeLead(encodeLead({ eventId: 'bad id<script>' }, now), now), {});
  assert.deepEqual(decodeLead(JSON.stringify({ interest: 'other', at: now }), now), { interest: 'other' });
  assert.deepEqual(decodeLead(JSON.stringify({ eventId: 42, at: now }), now), {});
  const store = memory();
  markLead(store, { interest: 'automation', eventId }, now);
  assert.deepEqual(settleLead(store, 'granted', ids, now), { interest: 'automation', eventId });
});

test('event ids are unique, well formed and survive a missing randomUUID', () => {
  const uuid = newEventId({ randomUUID: () => '0b6f1c2e-6c39-4c0e-9a51-2f6f8d1c9e10' });
  assert.equal(uuid, '0b6f1c2e-6c39-4c0e-9a51-2f6f8d1c9e10');
  const fallback = newEventId({ getRandomValues: <T extends ArrayBufferView | null>(array: T) => { new Uint8Array((array as unknown as Uint8Array).buffer).fill(171); return array; } });
  assert.ok(isEventId(fallback), fallback);
  const bare = newEventId(undefined);
  assert.ok(isEventId(bare), bare);
  assert.notEqual(newEventId(undefined), bare);
  assert.ok(isEventId(newEventId(globalThis.crypto)));
  for (const bad of ['', 'short', 'a'.repeat(65), 'bad id', '<x>', 42, null]) assert.equal(isEventId(bad), false, String(bad));
});

const sha = (value: string) => createHash('sha256').update(value).digest('hex');

test('contact data is normalized the way google ads enhanced conversions expects', () => {
  assert.equal(adsEmail('  Ana.Perez@Example.COM '), 'ana.perez@example.com');
  assert.equal(adsEmail('Ana.Perez@Gmail.com'), 'anaperez@gmail.com');
  assert.equal(adsEmail('a.b.c@googlemail.com'), 'abc@googlemail.com');
  for (const bad of ['', 'no-at-sign', '@example.com', 'ana@']) assert.equal(adsEmail(bad), '', bad);
  assert.equal(adsPhone('+57 300 123 4567'), '+573001234567');
  assert.equal(adsPhone('+1 (123) 123-4567'), '+11231234567');
  // Without a country code the number cannot be put in E.164, so it is not sent.
  for (const bad of ['', '300 123 4567', '+123', '+1234567890123456', '57+3001234567']) assert.equal(adsPhone(bad), '', bad);
});

test('only sha-256 hashes of the contact data are produced, and nothing without web crypto', async () => {
  const hashes = await hashContact({ email: ' Ana@Example.com ', phone: '+57 300 123 4567' });
  assert.deepEqual(hashes, { emailHash: sha('ana@example.com'), phoneHash: sha('+573001234567') });
  assert.deepEqual(await hashContact({ email: 'ana@example.com', phone: '3001234567' }), { emailHash: sha('ana@example.com') });
  assert.deepEqual(await hashContact({ email: 'ana@example.com', phone: '' }, null), {});
  assert.deepEqual(await hashContact({ email: 'ana@example.com' }, { digest: () => Promise.reject(new Error('insecure')) }), {});
});

test('the marker stores only well formed hashes, never the raw contact data', () => {
  const emailHash = sha('ana@example.com');
  const phoneHash = sha('+573001234567');
  const raw = encodeLead({ interest: 'other', emailHash, phoneHash, email: 'ana@example.com', phone: '+573001234567' } as Parameters<typeof encodeLead>[0], now);
  assert.doesNotMatch(raw, /ana@example\.com|573001234567"/);
  assert.deepEqual(decodeLead(raw, now), { interest: 'other', emailHash, phoneHash });
  assert.deepEqual(decodeLead(JSON.stringify({ emailHash: 'ana@example.com', phoneHash: 'A'.repeat(64), at: now }), now), {});
  assert.deepEqual(decodeLead(JSON.stringify({ emailHash: emailHash.toUpperCase(), at: now }), now), {});
  assert.equal(isSha256Hex(emailHash), true);
  for (const bad of ['', 'abc', emailHash + 'a', 'g'.repeat(64), 42, undefined]) assert.equal(isSha256Hex(bad), false, String(bad));
});
