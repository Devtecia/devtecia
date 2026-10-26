// Conversion events. Safe to call when no pixel is installed: it simply does nothing.
import { googleAdsSendTo } from '../../lib/campaign';

type Tracker = Window & { fbq?: (...args: unknown[]) => void; gtag?: (...args: unknown[]) => void };
type Details = { angle?: string; interest?: string };
type LeadDetails = Details & { eventId?: string; emailHash?: string; phoneHash?: string };

const compact = (details: Details): Record<string, string> =>
  Object.fromEntries(Object.entries(details).filter((entry): entry is [string, string] => Boolean(entry[1])));

function send(metaEvent: string, metaData: Record<string, string>, gaEvent: string, gaData: Record<string, string>, eventId?: string) {
  const w = window as Tracker;
  // The event id lets Meta deduplicate this Pixel event against the Conversions API copy sent by the server.
  try { if (eventId) w.fbq?.('track', metaEvent, metaData, { eventID: eventId }); else w.fbq?.('track', metaEvent, metaData); } catch { /* tracking must never break the form */ }
  try { w.gtag?.('event', gaEvent, gaData); } catch { /* idem */ }
}

// Literal process.env reads so Next inlines the public values in the browser bundle.
const adsSendTo = (label: string | undefined) => googleAdsSendTo(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID, label);

/**
 * Google Ads conversion through the shared gtag. The hashed contact data is set right before it, as enhanced
 * conversions require, and the transaction id is the form's event id so a repeated hit is not counted twice.
 */
function adsConversion(sendTo: string, transactionId?: string, user?: { emailHash?: string; phoneHash?: string }) {
  const w = window as Tracker;
  if (!sendTo || !w.gtag) return;
  try {
    const userData = {
      ...(user?.emailHash ? { sha256_email_address: user.emailHash } : {}),
      ...(user?.phoneHash ? { sha256_phone_number: user.phoneHash } : {}),
    };
    if (Object.keys(userData).length) w.gtag('set', 'user_data', userData);
    w.gtag('event', 'conversion', { send_to: sendTo, ...(transactionId ? { transaction_id: transactionId } : {}) });
  } catch { /* tracking must never break the page */ }
}

/** The form was accepted by the server. Fire this only on success, never on click. */
export function trackLead({ eventId, emailHash, phoneHash, ...details }: LeadDetails) {
  const data = compact(details);
  send('Lead', { content_category: data.interest ?? '', content_name: data.angle ?? '' }, 'generate_lead',
    { method: 'form', ...data, ...(eventId ? { event_id: eventId } : {}) }, eventId);
  adsConversion(adsSendTo(process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL), eventId, { emailHash, phoneHash });
}

export function trackWhatsApp(details: Details) {
  const data = compact(details);
  send('Contact', { content_name: data.angle ?? '' }, 'whatsapp_click', data);
  adsConversion(adsSendTo(process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL));
}
