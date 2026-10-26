import test from 'node:test';
import assert from 'node:assert/strict';
import { handleContact } from '../lib/contact.mjs';
const env = { RESEND_API_KEY: 'test', CONTACT_FROM_EMAIL: 'Devtecia <contact@devtecia.com>' };
const lead = { name: 'Ana', email: 'ana@example.com', company: '', message: 'Necesitamos conectar nuestro inventario.', website: '' };
const request = (body = lead, headers = {}) => new Request('https://devtecia.com/api/contact', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://devtecia.com', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const ok = async () => Response.json({ id: 'email-test' });
test('accepts only valid leads and fixes recipient', async () => {
  let payload;
  const response = await handleContact(request(), env, async (_, options) => { payload = JSON.parse(options.body); return ok(); });
  assert.equal(response.status, 202);
  assert.deepEqual(payload.to, ['info@devtecia.com']);
  assert.equal(payload.reply_to, lead.email);
});
test('rejects invalid input and header injection', async () => {
  for (const patch of [{ email: 'invalid' }, { name: 'Ana\r\nBcc: bad' }, { message: 'short' }, { website: 'bot' }, { company: 123 }]) {
    assert.equal((await handleContact(request({ ...lead, ...patch }), env, ok)).status, 400);
  }
});
test('missing or unsafe config never accepts', async () => {
  assert.equal((await handleContact(request(), {}, ok)).status, 503);
  assert.equal((await handleContact(request(), { ...env, CONTACT_FROM_EMAIL: 'x\r\ny' }, ok)).status, 503);
});
test('provider failure, malformed success and network failure never accept', async () => {
  for (const transport of [async () => new Response('', { status: 429 }), async () => Response.json({}), async () => { throw new Error('network'); }]) {
    assert.equal((await handleContact(request(), env, transport)).status, 502);
  }
});
test('timeout aborts the transport and returns failure', async () => {
  let signal;
  const response = await handleContact(request(), env, (_, options) => { signal = options.signal; return new Promise(() => {}); }, 5);
  assert.equal(response.status, 504);
  assert.equal(signal.aborted, true);
});
test('handler enforces content type, same origin and JSON boundaries', async () => {
  assert.equal((await handleContact(request(lead, { origin: 'https://evil.example' }), env, ok)).status, 403);
  const missingOrigin = request(); missingOrigin.headers.delete('origin');
  assert.equal((await handleContact(missingOrigin, env, ok)).status, 403);
  assert.equal((await handleContact(request(lead, { 'content-type': 'text/plain' }), env, ok)).status, 415);
  assert.equal((await handleContact(request('{'), env, ok)).status, 400);
  assert.equal((await handleContact(request('x'.repeat(17000)), env, ok)).status, 413);
  assert.equal((await handleContact(request(lead, { 'content-length': '17000' }), env, ok)).status, 413);
});
test('messages follow the requested locale and default to spanish', async () => {
  const english = new Request('https://devtecia.com/api/contact?lang=en', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://devtecia.com' }, body: JSON.stringify({ ...lead, email: 'invalid' }) });
  assert.match((await (await handleContact(english, env, ok)).json()).message, /^Check the fields/);
  assert.match((await (await handleContact(request({ ...lead, email: 'invalid' }), env, ok)).json()).message, /^Revisa los campos/);
});
test('interest is optional, whitelisted and reaches the email', async () => {
  let payload;
  const capture = async (_, options) => { payload = JSON.parse(options.body); return ok(); };
  assert.equal((await handleContact(request({ ...lead, interest: 'integrations' }), env, capture)).status, 202);
  assert.match(payload.text, /Interés: Integrar mis herramientas o IA/);
  await handleContact(request({ ...lead, interest: 'automation' }), env, capture);
  assert.match(payload.text, /Interés: Automatizar tareas repetitivas/);
  assert.equal((await handleContact(request(lead), env, capture)).status, 202);
  assert.match(payload.text, /Interés: No indicado/);
  for (const interest of ['ventex', 'saas', 'crypto', 42, '']) {
    assert.equal((await handleContact(request({ ...lead, interest }), env, ok)).status, 400);
  }
});
const capture = () => { const seen = {}; return [seen, async (_, options) => { seen.payload = JSON.parse(options.body); return ok(); }]; };
test('message is optional, but a short one is still rejected', async () => {
  const [seen, transport] = capture();
  const { message: _drop, ...withoutMessage } = lead;
  for (const body of [withoutMessage, { ...lead, message: '' }, { ...lead, message: '   ' }]) {
    assert.equal((await handleContact(request(body), env, transport)).status, 202);
    assert.match(seen.payload.text, /\(sin mensaje\)/);
  }
  for (const message of ['short', 'corto', 123, null]) {
    assert.equal((await handleContact(request({ ...lead, message }), env, ok)).status, 400);
  }
  assert.equal((await handleContact(request({ ...lead, message: 'x'.repeat(4001) }), env, ok)).status, 400);
});
test('phone is optional, validated and reaches the email', async () => {
  const [seen, transport] = capture();
  assert.equal((await handleContact(request({ ...lead, phone: '+57 300 123 4567' }), env, transport)).status, 202);
  assert.match(seen.payload.text, /WhatsApp o teléfono: \+57 300 123 4567/);
  await handleContact(request(lead), env, transport);
  assert.match(seen.payload.text, /WhatsApp o teléfono: No indicado/);
  for (const phone of ['abc', '123', '+57 300\r\nBcc: x', 'x'.repeat(40), 5, '++++++++', '() - . -']) {
    assert.equal((await handleContact(request({ ...lead, phone }), env, ok)).status, 400, String(phone));
  }
});
test('campaign attribution reaches the email and is sanitized, never blocking the lead', async () => {
  const [seen, transport] = capture();
  const attribution = { utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'excel-oct', angle: 'excel', fbclid: 'abc123', landing: '/', referrer: 'https://l.instagram.com/' };
  assert.equal((await handleContact(request({ ...lead, attribution }), env, transport)).status, 202);
  for (const line of ['utm_source: meta', 'utm_medium: paid_social', 'utm_campaign: excel-oct', 'angle: excel', 'fbclid: abc123']) assert.match(seen.payload.text, new RegExp(line));
  // Garbage must never cost a lead: wrong types are dropped, control characters stripped, long values cut, unknown keys ignored.
  const dirty = { utm_source: 'x\r\nBcc: bad@evil.test', utm_medium: 5, utm_campaign: 'y'.repeat(500), evil: 'z', angle: ['a'] };
  assert.equal((await handleContact(request({ ...lead, attribution: dirty }), env, transport)).status, 202);
  assert.doesNotMatch(seen.payload.text, /\n\s*Bcc/);   // no line break survives, so no header-like line can be forged
  assert.doesNotMatch(seen.payload.text, /^evil:/m);      // unknown key ignored
  assert.doesNotMatch(seen.payload.text, /utm_medium/);   // wrong type dropped
  assert.match(seen.payload.text, /utm_source: xBcc: bad@evil\.test/);
  assert.ok(seen.payload.text.match(/utm_campaign: (y+)/)[1].length <= 200);
  for (const attribution of ['texto', 42, null, ['a'], true]) {
    assert.equal((await handleContact(request({ ...lead, attribution }), env, transport)).status, 202);
  }
  await handleContact(request(lead), env, transport);
  assert.doesNotMatch(seen.payload.text, /Origen/);
  assert.equal(seen.payload.subject, 'Nueva consulta desde Devtecia'); // user data never reaches headers
});
// Meta Conversions API: a server Lead that mirrors the browser Pixel Lead, only with consent and only after the email.
const { createHash } = await import('node:crypto');
const sha = value => createHash('sha256').update(value).digest('hex');
const metaEnv = { ...env, NEXT_PUBLIC_META_PIXEL_ID: '123456789012345', META_CAPI_TOKEN: 'capi-token' };
const eventId = '0b6f1c2e-6c39-4c0e-9a51-2f6f8d1c9e10';
const tracked = { ...lead, email: 'Ana@Example.COM', phone: '+57 300 123 4567', interest: 'automation', attribution: { angle: 'tareas' }, eventId, consent: 'granted', fbp: 'fb.1.1700000000000.1234567890', fbc: 'fb.1.1700000000000.AbC123_x-Y', pageUrl: 'https://devtecia.com/?a=tareas#contacto' };
const metaRequest = (body = tracked) => request(body, { 'x-forwarded-for': '203.0.113.7, 10.0.0.1', 'user-agent': 'TestAgent/1.0' });
const router = () => {
  const calls = [];
  return [calls, async (url, options) => { calls.push({ url, body: options.body, payload: JSON.parse(options.body) }); return url.startsWith('https://graph.facebook.com/') ? Response.json({ events_received: 1 }) : ok(); }];
};
const capiCalls = calls => calls.filter(call => call.url.startsWith('https://graph.facebook.com/'));
test('no conversions api call without consent, token or pixel', async () => {
  for (const [body, config] of [[{ ...tracked, consent: 'denied' }, metaEnv], [{ ...tracked, consent: undefined }, metaEnv], [tracked, { ...metaEnv, META_CAPI_TOKEN: '' }], [tracked, { ...metaEnv, NEXT_PUBLIC_META_PIXEL_ID: 'abc' }], [tracked, env]]) {
    const [calls, transport] = router();
    assert.equal((await handleContact(metaRequest(body), config, transport)).status, 202);
    assert.equal(capiCalls(calls).length, 0);
    assert.equal(calls.length, 1);
  }
});
test('conversions api lead carries the shared event id, hashed contact data and the test code', async () => {
  const [calls, transport] = router();
  assert.equal((await handleContact(metaRequest(), { ...metaEnv, META_TEST_EVENT_CODE: 'TEST123' }, transport)).status, 202);
  const [capi] = capiCalls(calls);
  assert.ok(capi, 'a conversions api request was sent');
  assert.equal(calls[0].url, 'https://api.resend.com/emails', 'the email goes first');
  assert.match(capi.url, /^https:\/\/graph\.facebook\.com\/v\d+\.\d+\/123456789012345\/events$/);
  assert.equal(capi.payload.access_token, 'capi-token');
  assert.equal(capi.payload.test_event_code, 'TEST123');
  const [event] = capi.payload.data;
  assert.equal(event.event_name, 'Lead');
  assert.equal(event.event_id, eventId);
  assert.equal(event.action_source, 'website');
  assert.equal(event.event_source_url, 'https://devtecia.com/?a=tareas');
  assert.ok(Math.abs(event.event_time - Date.now() / 1000) < 60);
  assert.deepEqual(event.user_data, { em: [sha('ana@example.com')], ph: [sha('573001234567')], client_ip_address: '203.0.113.7', client_user_agent: 'TestAgent/1.0', fbp: tracked.fbp, fbc: tracked.fbc });
  assert.deepEqual(event.custom_data, { content_category: 'automation', content_name: 'tareas' });
});
test('the graph version is configurable and the phone and test code are optional', async () => {
  const [calls, transport] = router();
  const { phone: _phone, ...withoutPhone } = tracked;
  await handleContact(metaRequest(withoutPhone), { ...metaEnv, META_GRAPH_VERSION: 'v25.0' }, transport);
  const [capi] = capiCalls(calls);
  assert.match(capi.url, /\/v25\.0\/123456789012345\/events$/);
  assert.equal(capi.payload.test_event_code, undefined);
  assert.equal(capi.payload.data[0].user_data.ph, undefined);
  const [bad, badTransport] = router();
  await handleContact(metaRequest(), { ...metaEnv, META_GRAPH_VERSION: '../x' }, badTransport);
  assert.match(capiCalls(bad)[0].url, /^https:\/\/graph\.facebook\.com\/v\d+\.\d+\/123456789012345\/events$/);
});
test('raw email and phone never reach the conversions api body', async () => {
  const [calls, transport] = router();
  await handleContact(metaRequest(), metaEnv, transport);
  const [capi] = capiCalls(calls);
  assert.doesNotMatch(capi.body, /ana@example\.com|Ana@Example|300 123 4567|573001234567|Ana"/i);
});
test('invalid event id skips the conversions api; invalid fbc, fbp and foreign page urls are dropped', async () => {
  for (const bad of ['', 'x', 'a'.repeat(200), 'bad id<script>', 42]) {
    const [calls, transport] = router();
    assert.equal((await handleContact(metaRequest({ ...tracked, eventId: bad }), metaEnv, transport)).status, 202);
    assert.equal(capiCalls(calls).length, 0, String(bad));
  }
  const [calls, transport] = router();
  assert.equal((await handleContact(metaRequest({ ...tracked, fbc: 'fb.1.x.<script>', fbp: 'nope', pageUrl: 'https://evil.example/' }), metaEnv, transport)).status, 202);
  const [event] = capiCalls(calls)[0].payload.data;
  assert.equal(event.user_data.fbc, undefined);
  assert.equal(event.user_data.fbp, undefined);
  assert.equal(event.event_source_url, 'https://devtecia.com/');
});
test('tracking fields never reject a lead', async () => {
  for (const patch of [{ eventId: { x: 1 } }, { consent: 42 }, { fbc: ['x'] }, { pageUrl: null }]) {
    assert.equal((await handleContact(metaRequest({ ...tracked, ...patch }), metaEnv, ok)).status, 202);
  }
});
test('a failing or hanging conversions api never changes the accepted response', async () => {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    for (const fail of [async () => new Response('', { status: 400 }), async () => { throw new Error('network'); }]) {
      const transport = async (url, options) => url.startsWith('https://graph.facebook.com/') ? fail() : ok();
      assert.equal((await handleContact(metaRequest(), metaEnv, transport)).status, 202);
    }
    const started = Date.now();
    let signal;
    const hanging = async (url, options) => { if (!url.startsWith('https://graph.facebook.com/')) return ok(); signal = options.signal; return new Promise(() => {}); };
    assert.equal((await handleContact(metaRequest(), metaEnv, hanging)).status, 202);
    assert.ok(Date.now() - started < 4000, 'the wait is bounded');
    assert.equal(signal.aborted, true);
    assert.ok(warnings.length >= 3);
    for (const warning of warnings) assert.doesNotMatch(warning, /ana@example|capi-token|203\.0\.113\.7/i);
  } finally {
    console.warn = originalWarn;
  }
});
test('with a scheduler the conversions api runs after the response, never before the email is accepted', async () => {
  const jobs = [];
  const [calls, transport] = router();
  const response = await handleContact(metaRequest(), metaEnv, transport, 8000, job => jobs.push(job));
  assert.equal(response.status, 202);
  assert.equal(capiCalls(calls).length, 0);
  assert.equal(jobs.length, 1);
  await jobs[0]();
  assert.equal(capiCalls(calls).length, 1);
  const failedJobs = [];
  const failing = async () => new Response('', { status: 500 });
  assert.equal((await handleContact(metaRequest(), metaEnv, failing, 8000, job => failedJobs.push(job))).status, 502);
  assert.equal(failedJobs.length, 0);
});
