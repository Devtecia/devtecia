// Campaign plumbing shared by the form, the tracking snippet and the WhatsApp button.
// Everything here is pure except readAttribution, which touches the URL and sessionStorage.

/** Landing angles an ad can point at with `?a=`. They mirror the three starting points on the home page. */
export const ANGLES = ['excel', 'tareas', 'medida'] as const;
export type Angle = (typeof ANGLES)[number];

// Each angle preselects one of the form's existing interests; the angle itself still travels to the email.
const interestByAngle: Record<Angle, string> = { excel: 'operations', tareas: 'automation', medida: 'other' };

export const attributionKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'angle', 'referrer', 'landing'] as const;
export type Attribution = Partial<Record<(typeof attributionKeys)[number], string>>;

const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'angle'] as const;
const clean = (value: string) => value.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 200);

export function isAngle(value: unknown): value is Angle {
  return typeof value === 'string' && (ANGLES as readonly string[]).includes(value);
}

export function angleInterest(angle: unknown): string | undefined {
  return isAngle(angle) ? interestByAngle[angle] : undefined;
}

export function parseAttribution(search: string, referrer: string, landing: string, ownHost: string): Attribution {
  const params = new URLSearchParams(search);
  const found: Attribution = {};
  for (const key of campaignKeys) {
    const raw = params.get(key === 'angle' ? 'a' : key);
    const value = raw === null ? '' : clean(raw);
    if (value === '') continue;
    if (key === 'angle' && !isAngle(value)) continue;
    found[key] = value;
  }
  try {
    if (referrer && new URL(referrer).hostname !== ownHost) found.referrer = clean(referrer);
  } catch { /* an unparseable referrer is simply not recorded */ }
  const path = clean(landing);
  if (path) found.landing = path;
  return found;
}

/** A visit that carries campaign data (UTM, click id or angle). A referrer alone does not count. */
export function hasCampaignData(attribution: Attribution): boolean {
  return campaignKeys.some(key => Boolean(attribution[key]));
}

/** The latest campaign wins; a plain visit (for example the next page of the same session) keeps what was stored. */
export function mergeAttribution(stored: Attribution | undefined, fresh: Attribution): Attribution {
  return stored && !hasCampaignData(fresh) ? stored : fresh;
}

const STORE = 'devtecia_attribution';

export function readAttribution(): Attribution {
  const fresh = parseAttribution(location.search, document.referrer, location.pathname, location.hostname);
  let stored: Attribution | undefined;
  try {
    const raw = sessionStorage.getItem(STORE);
    stored = raw ? JSON.parse(raw) : undefined;
  } catch { /* storage can be blocked or corrupted; the lead is still sent */ }
  const merged = mergeAttribution(stored, fresh);
  try { sessionStorage.setItem(STORE, JSON.stringify(merged)); } catch { /* ignore */ }
  return merged;
}

export function whatsappUrl(number: string | undefined, message: string): string {
  const digits = (number ?? '').replace(/[\s+().-]/g, '');
  return /^\d{8,15}$/.test(digits) ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : '';
}

/** One cookie value from a `document.cookie` string, or '' when it is missing. */
export function readCookie(cookie: string, name: string): string {
  for (const part of cookie.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      try { return decodeURIComponent(rest.join('=')); } catch { return ''; }
    }
  }
  return '';
}

const fbclidPattern = /^[A-Za-z0-9_-]{1,500}$/;

/**
 * Meta's browser ids for the Conversions API. The Pixel sets `_fbp` and `_fbc`; when `_fbc` is missing (for example
 * the Pixel loaded after the ad click) it is rebuilt from the click id as fb.1.<ms>.<fbclid>, Meta's documented format.
 * The server validates both shapes again.
 */
export function metaBrowserIds(cookie: string, search: string, storedFbclid: string | undefined, now: number): { fbp?: string; fbc?: string } {
  const found: { fbp?: string; fbc?: string } = {};
  const fbp = readCookie(cookie, '_fbp');
  if (fbp) found.fbp = fbp;
  const fbc = readCookie(cookie, '_fbc');
  const fbclid = new URLSearchParams(search).get('fbclid') ?? storedFbclid ?? '';
  if (fbc) found.fbc = fbc;
  else if (fbclidPattern.test(fbclid)) found.fbc = `fb.1.${now}.${fbclid}`;
  return found;
}

// IDs end up inside inline scripts, so only the exact shapes are accepted.
export const isMetaPixelId = (value: unknown): value is string => typeof value === 'string' && /^\d{10,20}$/.test(value);
export const isGaId = (value: unknown): value is string => typeof value === 'string' && /^G-[A-Z0-9]{6,14}$/.test(value);

export function privacyUrl(value: string | undefined): string {
  return typeof value === 'string' && (/^https:\/\/[^\s<>"']+$/.test(value) || /^\/(?!\/)[^\s<>"']*$/.test(value)) ? value : '';
}
