// One-shot lead marker between the contact form and the thanks page. The form sets it only after the server accepted
// the message; the thanks page spends it on arrival, so a reload, a shared link or a direct visit never counts a lead.
// Everything here is pure: storage, consent and tracker ids come in as arguments.
import { isAngle } from './campaign';
import { shouldLoadTracking, type Consent, type TrackingIds } from './consent';

export type Lead = { angle?: string; interest?: string; eventId?: string };
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const LEAD_KEY = 'devtecia_lead_pending';
/** A marker older than this is a leftover (for example a navigation that never finished), not a fresh submission. */
export const LEAD_TTL_MS = 30 * 60 * 1000;
// Mirrors the form's four interests; anything else is dropped rather than sent to the ad platforms.
const interests = ['operations', 'automation', 'integrations', 'other'];
// Shared by the Pixel and the Conversions API so Meta counts one lead. Mirrors the server check in lib/meta-capi.mjs.
const eventIdPattern = /^[A-Za-z0-9-]{16,64}$/;

export const isEventId = (value: unknown): value is string => typeof value === 'string' && eventIdPattern.test(value);

type RandomSource = { randomUUID?: () => string; getRandomValues?: <T extends ArrayBufferView | null>(array: T) => T };

/** One id per submission: a UUID when available, otherwise random bytes, otherwise time plus Math.random. */
export function newEventId(source: RandomSource | undefined = globalThis.crypto): string {
  try {
    const uuid = source?.randomUUID?.();
    if (isEventId(uuid)) return uuid;
  } catch { /* insecure context or old browser */ }
  try {
    if (source?.getRandomValues) {
      const bytes = source.getRandomValues(new Uint8Array(16));
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
  } catch { /* fall through */ }
  const random = () => Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `${Date.now().toString(36)}-${random()}${random()}`;
}

function known(lead: Lead): Lead {
  const found: Lead = {};
  if (isAngle(lead.angle)) found.angle = lead.angle;
  if (typeof lead.interest === 'string' && interests.includes(lead.interest)) found.interest = lead.interest;
  if (isEventId(lead.eventId)) found.eventId = lead.eventId;
  return found;
}

export function encodeLead(lead: Lead, now: number): string {
  return JSON.stringify({ ...known(lead), at: now });
}

export function decodeLead(raw: string | null | undefined, now: number): Lead | null {
  if (!raw) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const { at, ...lead } = parsed as Lead & { at?: unknown };
  if (typeof at !== 'number' || at > now || now - at > LEAD_TTL_MS) return null;
  return known(lead);
}

/** Returns false when the marker could not be stored; the visitor still goes to the thanks page, untracked. */
export function markLead(store: Store | undefined, lead: Lead, now: number): boolean {
  try { store?.setItem(LEAD_KEY, encodeLead(lead, now)); return Boolean(store); } catch { return false; }
}

/** Reads and removes the marker in one step. */
export function consumeLead(store: Store | undefined, now: number): Lead | null {
  let raw: string | null | undefined = null;
  try { raw = store?.getItem(LEAD_KEY); } catch { return null; }
  try { store?.removeItem(LEAD_KEY); } catch { /* a marker that cannot be removed still expires */ }
  return decodeLead(raw, now);
}

/** The marker is always spent; the lead comes back only when the visitor accepted tracking and a tracker exists. */
export function settleLead(store: Store | undefined, consent: Consent | null, ids: TrackingIds, now: number): Lead | null {
  const lead = consumeLead(store, now);
  return lead && shouldLoadTracking(consent, ids) ? lead : null;
}

/** The locale's thanks path plus the current query string, so UTM and the angle survive the redirect. */
export function thanksUrl(path: string, search: string | undefined): string {
  const query = (search ?? '').replace(/^\?/, '');
  return query ? `${path}?${query}` : path;
}
