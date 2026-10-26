// Meta Conversions API: the server copy of the browser Pixel Lead. It is sent only when the visitor granted measurement
// consent, only after the email was accepted, and with the same event id as the Pixel so Meta counts one lead.
// Contact data leaves the server only as SHA-256 hashes. Every input is optional and untrusted: anything that does not
// match its exact shape is dropped, and a failure here never reaches the visitor.
import { createHash } from 'node:crypto';

/** Graph API v26.0 was the latest version on 2026-10-26 (developers.facebook.com/docs/graph-api/changelog). */
export const DEFAULT_GRAPH_VERSION = 'v26.0';
export const CAPI_TIMEOUT_MS = 2000;

const pixelPattern = /^\d{10,20}$/;
const versionPattern = /^v\d{1,3}\.\d{1,2}$/;
// Same shape the browser generates (lib/lead.ts): a UUID or the fallback id.
const eventIdPattern = /^[A-Za-z0-9-]{16,64}$/;
// fb.<subdomain index>.<creation ms>.<random or fbclid>, as documented for the _fbp and _fbc cookies.
const fbpPattern = /^fb\.[0-2]\.\d{10,13}\.[A-Za-z0-9_.-]{1,64}$/;
const fbcPattern = /^fb\.[0-2]\.\d{10,13}\.[A-Za-z0-9_.-]{1,500}$/;
const ipPattern = /^[0-9A-Fa-f:.]{3,45}$/;
const angles = ['excel', 'tareas', 'medida'];
const interests = ['operations', 'automation', 'integrations', 'other'];

const sha256 = value => createHash('sha256').update(value).digest('hex');
const match = (value, pattern) => (typeof value === 'string' && pattern.test(value) ? value : undefined);

export const isEventId = value => match(value, eventIdPattern) !== undefined;

/** The page the lead came from, only when it is on our own origin; otherwise the site root. */
function sourceUrl(value, origin) {
  if (typeof value === 'string' && value.length <= 2000) {
    try {
      const url = new URL(value);
      if (url.origin === origin) { url.hash = ''; return url.href; }
    } catch { /* fall back to the root below */ }
  }
  return `${origin}/`;
}

function clientIp(headers) {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return match(forwarded, ipPattern) ?? match(headers.get('x-real-ip')?.trim(), ipPattern);
}

/**
 * Returns the request to send, or null when the lead must not reach Meta (no consent, no configuration or no event id
 * to deduplicate with). `lead` holds the already validated form fields plus the raw tracking fields from the body.
 */
export function buildMetaLead(lead, request, env, now = Date.now()) {
  const pixel = match(env.NEXT_PUBLIC_META_PIXEL_ID, pixelPattern);
  const token = typeof env.META_CAPI_TOKEN === 'string' ? env.META_CAPI_TOKEN.trim() : '';
  const eventId = match(lead.eventId, eventIdPattern);
  // Without the shared id the Pixel and the server event would count twice, so nothing is sent.
  if (lead.consent !== 'granted' || !pixel || !token || !eventId) return null;
  const version = match(env.META_GRAPH_VERSION, versionPattern) ?? DEFAULT_GRAPH_VERSION;
  const phone = typeof lead.phone === 'string' ? lead.phone.replace(/\D/g, '') : '';
  const userAgent = request.headers.get('user-agent') ?? '';
  const userData = Object.fromEntries(Object.entries({
    em: [sha256(lead.email.trim().toLowerCase())],
    // Digits only, as typed: the form asks for the number with its country code.
    ph: phone ? [sha256(phone)] : undefined,
    client_ip_address: clientIp(request.headers),
    client_user_agent: userAgent && userAgent.length <= 1000 ? userAgent : undefined,
    fbp: match(lead.fbp, fbpPattern),
    fbc: match(lead.fbc, fbcPattern),
  }).filter(([, value]) => value !== undefined));
  const angle = typeof lead.attribution?.angle === 'string' && angles.includes(lead.attribution.angle) ? lead.attribution.angle : undefined;
  const customData = Object.fromEntries(Object.entries({
    content_category: interests.includes(lead.interest) ? lead.interest : undefined,
    content_name: angle,
  }).filter(([, value]) => value !== undefined));
  const testCode = typeof env.META_TEST_EVENT_CODE === 'string' && /^[A-Za-z0-9]{1,40}$/.test(env.META_TEST_EVENT_CODE.trim()) ? env.META_TEST_EVENT_CODE.trim() : undefined;
  return {
    url: `https://graph.facebook.com/${version}/${pixel}/events`,
    body: {
      data: [{
        event_name: 'Lead',
        event_time: Math.floor(now / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: sourceUrl(lead.pageUrl, new URL(request.url).origin),
        user_data: userData,
        ...(Object.keys(customData).length ? { custom_data: customData } : {}),
      }],
      ...(testCode ? { test_event_code: testCode } : {}),
      access_token: token,
    },
  };
}

/** Sends the event with a short bounded wait. Never throws; logs a warning without personal data or the token. */
export async function sendMetaLead(event, transport = fetch, timeoutMs = CAPI_TIMEOUT_MS) {
  const controller = new AbortController();
  let timer;
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, timeoutMs);
    });
    const send = (async () => {
      const result = await transport(event.url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify(event.body),
      });
      if (!result.ok) throw new Error(`status ${result.status}`);
    })();
    send.catch(() => { /* reported through the race below */ });
    await Promise.race([send, timeout]);
  } catch (error) {
    const reason = controller.signal.aborted ? 'timeout' : error instanceof Error && /^status \d{3}$/.test(error.message) ? error.message : 'network';
    console.warn(`[meta-capi] lead not sent: ${reason}`);
  } finally {
    clearTimeout(timer);
  }
}
