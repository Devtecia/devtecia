// One-shot lead marker between the contact form and the thanks page. The form sets it only after the server accepted
// the message; the thanks page spends it on arrival, so a reload, a shared link or a direct visit never counts a lead.
// Everything here is pure: storage, consent and tracker ids come in as arguments.
import { isAngle } from './campaign';
import { shouldLoadTracking, type Consent, type TrackingIds } from './consent';

// Contact data only ever travels as SHA-256 hashes for Google Ads enhanced conversions; the raw email and phone are
// never stored in the marker.
export type Lead = { angle?: string; interest?: string; eventId?: string; emailHash?: string; phoneHash?: string };
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const LEAD_KEY = 'devtecia_lead_pending';
/** A marker older than this is a leftover (for example a navigation that never finished), not a fresh submission. */
export const LEAD_TTL_MS = 30 * 60 * 1000;
// Mirrors the form's four interests; anything else is dropped rather than sent to the ad platforms.
const interests = ['operations', 'automation', 'integrations', 'other'];
// Shared by the Pixel and the Conversions API so Meta counts one lead. Mirrors the server check in lib/meta-capi.mjs.
const eventIdPattern = /^[A-Za-z0-9-]{16,64}$/;

export const isEventId = (value: unknown): value is string => typeof value === 'string' && eventIdPattern.test(value);
export const isSha256Hex = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

/**
 * Google Ads normalization for enhanced conversions: trimmed, lowercase, and for gmail.com / googlemail.com the
 * periods before the domain removed. '' when it is not an address.
 */
export function adsEmail(email: string): string {
  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at < 1 || at === value.length - 1) return '';
  const [user, domain] = [value.slice(0, at), value.slice(at + 1)];
  return domain === 'gmail.com' || domain === 'googlemail.com' ? `${user.replace(/\./g, '')}@${domain}` : value;
}

/**
 * E.164 as Google Ads expects it: a plus sign and 11 to 15 characters in total. A number typed without its country
 * code cannot be converted reliably, so it returns '' and is simply not sent.
 */
export function adsPhone(phone: string): string {
  const value = phone.trim();
  if (!value.startsWith('+')) return '';
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 14 && !digits.startsWith('0') ? `+${digits}` : '';
}

type Digest = Pick<SubtleCrypto, 'digest'>;

/** Hex SHA-256 of the normalized email and phone with Web Crypto. Without it (insecure context) nothing is hashed. */
export async function hashContact(
  { email = '', phone = '' }: { email?: string; phone?: string },
  subtle: Digest | null | undefined = globalThis.crypto?.subtle,
): Promise<Pick<Lead, 'emailHash' | 'phoneHash'>> {
  if (!subtle) return {};
  const hash = async (value: string) => {
    const buffer = await subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
  };
  try {
    const found: Pick<Lead, 'emailHash' | 'phoneHash'> = {};
    const [normalizedEmail, normalizedPhone] = [adsEmail(email), adsPhone(phone)];
    if (normalizedEmail) found.emailHash = await hash(normalizedEmail);
    if (normalizedPhone) found.phoneHash = await hash(normalizedPhone);
    return found;
  } catch {
    return {};
  }
}

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
  if (isSha256Hex(lead.emailHash)) found.emailHash = lead.emailHash;
  if (isSha256Hex(lead.phoneHash)) found.phoneHash = lead.phoneHash;
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
