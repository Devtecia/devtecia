// Conversion events. Safe to call when no pixel is installed: it simply does nothing.
type Tracker = Window & { fbq?: (...args: unknown[]) => void; gtag?: (...args: unknown[]) => void };
type Details = { angle?: string; interest?: string };
type LeadDetails = Details & { eventId?: string };

const compact = (details: Details): Record<string, string> =>
  Object.fromEntries(Object.entries(details).filter((entry): entry is [string, string] => Boolean(entry[1])));

function send(metaEvent: string, metaData: Record<string, string>, gaEvent: string, gaData: Record<string, string>, eventId?: string) {
  const w = window as Tracker;
  // The event id lets Meta deduplicate this Pixel event against the Conversions API copy sent by the server.
  try { if (eventId) w.fbq?.('track', metaEvent, metaData, { eventID: eventId }); else w.fbq?.('track', metaEvent, metaData); } catch { /* tracking must never break the form */ }
  try { w.gtag?.('event', gaEvent, gaData); } catch { /* idem */ }
}

/** The form was accepted by the server. Fire this only on success, never on click. */
export function trackLead({ eventId, ...details }: LeadDetails) {
  const data = compact(details);
  send('Lead', { content_category: data.interest ?? '', content_name: data.angle ?? '' }, 'generate_lead',
    { method: 'form', ...data, ...(eventId ? { event_id: eventId } : {}) }, eventId);
}

export function trackWhatsApp(details: Details) {
  const data = compact(details);
  send('Contact', { content_name: data.angle ?? '' }, 'whatsapp_click', data);
}
