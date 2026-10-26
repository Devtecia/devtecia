import assert from 'node:assert/strict';
import test from 'node:test';
import { trackLead } from '../app/components/analytics';

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
