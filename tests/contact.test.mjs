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
