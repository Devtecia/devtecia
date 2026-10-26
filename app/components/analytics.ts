// Conversion events. Safe to call when no pixel is installed: it simply does nothing.
type Tracker = Window & { fbq?: (...args: unknown[]) => void; gtag?: (...args: unknown[]) => void };
type Details = { angle?: string; interest?: string };

const compact = (details: Details): Record<string, string> =>
  Object.fromEntries(Object.entries(details).filter((entry): entry is [string, string] => Boolean(entry[1])));

function send(metaEvent: string, metaData: Record<string, string>, gaEvent: string, gaData: Record<string, string>) {
  const w = window as Tracker;
  try { w.fbq?.('track', metaEvent, metaData); } catch { /* tracking must never break the form */ }
  try { w.gtag?.('event', gaEvent, gaData); } catch { /* idem */ }
}

/** The form was accepted by the server. Fire this only on success, never on click. */
export function trackLead(details: Details) {
  const data = compact(details);
  send('Lead', { content_category: data.interest ?? '', content_name: data.angle ?? '' }, 'generate_lead', { method: 'form', ...data });
}

export function trackWhatsApp(details: Details) {
  const data = compact(details);
  send('Contact', { content_name: data.angle ?? '' }, 'whatsapp_click', data);
}
