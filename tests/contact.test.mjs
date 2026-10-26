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
