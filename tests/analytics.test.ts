import assert from 'node:assert/strict';
import test from 'node:test';
import { trackLead, trackWhatsApp } from '../app/components/analytics';

test('the pixel lead carries the shared event id so meta deduplicates it with the conversions api', () => {
  const calls: unknown[][] = [];
  const g = globalThis as { window?: unknown };
  const previous = g.window;
  g.window = { fbq: (...args: unknown[]) => calls.push(['fbq', ...args]), gtag: (...args: unknown[]) => calls.push(['gtag', ...args]) };
  try {
    trackLead({ angle: 'excel', interest: 'operations', eventId: '0b6f1c2e-6c39-4c0e-9a51-2f6f8d1c9e10' });
    assert.deepEqual(calls[0], ['fbq', 'track', 'Lead', { content_category: 'operations', content_name: 'excel' }, { eventID: '0b6f1c2e-6c39-4c0e-9a51-2f6f8d1c9e10' }]);
    assert.deepEqual(calls[1], ['gtag', 'event', 'generate_lead', { method: 'form', angle: 'excel', interest: 'operations', event_id: '0b6f1c2e-6c39-4c0e-9a51-2f6f8d1c9e10' }]);
    calls.length = 0;
    trackLead({ interest: 'other' });
    assert.deepEqual(calls[0], ['fbq', 'track', 'Lead', { content_category: 'other', content_name: '' }]);
    assert.deepEqual(calls[1], ['gtag', 'event', 'generate_lead', { method: 'form', interest: 'other' }]);
  } finally {
    g.window = previous;
  }
});

const adsEnv = ['NEXT_PUBLIC_GOOGLE_ADS_ID', 'NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL', 'NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL'] as const;

function withTrackers(env: Partial<Record<(typeof adsEnv)[number], string>>, run: (calls: unknown[][]) => void) {
  const calls: unknown[][] = [];
  const g = globalThis as { window?: unknown };
  const previous = { window: g.window, env: adsEnv.map(key => process.env[key]) };
  for (const key of adsEnv) { if (env[key] === undefined) delete process.env[key]; else process.env[key] = env[key]; }
  g.window = { fbq: (...args: unknown[]) => calls.push(['fbq', ...args]), gtag: (...args: unknown[]) => calls.push(['gtag', ...args]) };
  try { run(calls); } finally {
    g.window = previous.window;
    adsEnv.forEach((key, index) => { const value = previous.env[index]; if (value === undefined) delete process.env[key]; else process.env[key] = value; });
  }
}

const emailHash = 'a'.repeat(64);
const phoneHash = 'b'.repeat(64);
const eventId = '0b6f1c2e-6c39-4c0e-9a51-2f6f8d1c9e10';

test('the lead fires the google ads conversion with the shared id after setting the hashed user data', () => {
  withTrackers({ NEXT_PUBLIC_GOOGLE_ADS_ID: 'AW-123456789', NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: 'AbC-D_efG-h12' }, calls => {
    trackLead({ interest: 'operations', eventId, emailHash, phoneHash });
    // GA4 and Meta are unchanged and never see the hashes.
    assert.deepEqual(calls[1], ['gtag', 'event', 'generate_lead', { method: 'form', interest: 'operations', event_id: eventId }]);
    assert.deepEqual(calls.slice(2), [
      ['gtag', 'set', 'user_data', { sha256_email_address: emailHash, sha256_phone_number: phoneHash }],
      ['gtag', 'event', 'conversion', { send_to: 'AW-123456789/AbC-D_efG-h12', transaction_id: eventId }],
    ]);
    assert.doesNotMatch(JSON.stringify(calls.slice(0, 2)), /aaaa|bbbb/);
    calls.length = 0;
    trackLead({ eventId });
    assert.deepEqual(calls.slice(2), [['gtag', 'event', 'conversion', { send_to: 'AW-123456789/AbC-D_efG-h12', transaction_id: eventId }]]);
  });
});

test('no google ads conversion without a valid id and lead label', () => {
  for (const env of [{}, { NEXT_PUBLIC_GOOGLE_ADS_ID: 'AW-123456789' }, { NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: 'AbC-D_efG-h12' }, { NEXT_PUBLIC_GOOGLE_ADS_ID: 'AW-1', NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: 'AbC-D_efG-h12' }]) {
    withTrackers(env, calls => {
      trackLead({ eventId, emailHash });
      assert.equal(calls.length, 2, JSON.stringify(env));
    });
  }
});

test('the whatsapp click fires its own google ads conversion only when its label is set', () => {
  withTrackers({ NEXT_PUBLIC_GOOGLE_ADS_ID: 'AW-123456789', NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL: 'WhaTs_App-01' }, calls => {
    trackWhatsApp({ angle: 'excel' });
    assert.deepEqual(calls.slice(2), [['gtag', 'event', 'conversion', { send_to: 'AW-123456789/WhaTs_App-01' }]]);
  });
  withTrackers({ NEXT_PUBLIC_GOOGLE_ADS_ID: 'AW-123456789', NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: 'AbC-D_efG-h12' }, calls => {
    trackWhatsApp({});
    assert.equal(calls.length, 2);
  });
});
