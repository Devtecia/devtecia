// One-shot lead marker between the contact form and the thanks page. The form sets it only after the server accepted
// the message; the thanks page spends it on arrival, so a reload, a shared link or a direct visit never counts a lead.
// Everything here is pure: storage, consent and tracker ids come in as arguments.
import { isAngle } from './campaign';
import { shouldLoadTracking, type Consent, type TrackingIds } from './consent';

export type Lead = { angle?: string; interest?: string };
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const LEAD_KEY = 'devtecia_lead_pending';
/** A marker older than this is a leftover (for example a navigation that never finished), not a fresh submission. */
export const LEAD_TTL_MS = 30 * 60 * 1000;
// Mirrors the form's four interests; anything else is dropped rather than sent to the ad platforms.
const interests = ['operations', 'automation', 'integrations', 'other'];

function known(lead: Lead): Lead {
  const found: Lead = {};
  if (isAngle(lead.angle)) found.angle = lead.angle;
  if (typeof lead.interest === 'string' && interests.includes(lead.interest)) found.interest = lead.interest;
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
