// Opt-in for Meta Pixel and GA4. Nothing loads until the visitor accepts; any doubt (no choice, blocked or corrupted
// storage) means no tracking. Everything here is pure except injectTracking, which receives the window and document.
import { isGaId, isMetaPixelId } from './campaign';

export type Consent = 'granted' | 'denied';
export type TrackingIds = { meta: string; ga: string };

export const CONSENT_KEY = 'devtecia_tracking_consent';
/** Fired by the footer "Cookies" button to show the banner again. */
export const CONSENT_OPEN_EVENT = 'devtecia:consent-open';
/** Present on <html> while the banner is on screen, so other bottom-fixed UI (the mobile sticky CTA) can step aside. */
export const CONSENT_OPEN_ATTR = 'data-consent-open';

type Store = Pick<Storage, 'getItem' | 'setItem'>;

/** Only valid ids survive, because they end up inside script URLs and calls. */
export function trackingIds(meta: unknown = process.env.NEXT_PUBLIC_META_PIXEL_ID, ga: unknown = process.env.NEXT_PUBLIC_GA_ID): TrackingIds {
  return { meta: isMetaPixelId(meta) ? meta : '', ga: isGaId(ga) ? ga : '' };
}

export const hasTracking = (ids: TrackingIds) => Boolean(ids.meta || ids.ga);

export function parseConsent(raw: unknown): Consent | null {
  return raw === 'granted' || raw === 'denied' ? raw : null;
}

export function readConsent(store: Store | undefined): Consent | null {
  try { return parseConsent(store?.getItem(CONSENT_KEY)); } catch { return null; }
}

/** Returns false when the choice could not be stored; the banner still closes and this page view follows the choice. */
export function writeConsent(store: Store | undefined, consent: Consent): boolean {
  try { store?.setItem(CONSENT_KEY, consent); return Boolean(store); } catch { return false; }
}

export const shouldLoadTracking = (consent: Consent | null, ids: TrackingIds) => consent === 'granted' && hasTracking(ids);

type Queue = ((...args: unknown[]) => void) & { queue?: unknown[]; callMethod?: (...args: unknown[]) => void; push?: unknown; loaded?: boolean; version?: string };
export type TrackerWindow = { fbq?: Queue; _fbq?: Queue; dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
type ScriptDoc = { createElement(tag: 'script'): { async: boolean; src: string }; head: { appendChild(node: unknown): unknown } };

function addScript(doc: ScriptDoc, src: string) {
  const script = doc.createElement('script');
  script.async = true;
  script.src = src;
  doc.head.appendChild(script);
}

/** Meta's documented queue stub plus gtag's dataLayer. Idempotent: a second call (or a reopened banner) adds nothing. */
export function injectTracking(ids: TrackingIds, win: TrackerWindow, doc: ScriptDoc) {
  if (ids.meta && !win.fbq) {
    const fbq: Queue = (...args) => { if (fbq.callMethod) fbq.callMethod(...args); else fbq.queue!.push(args); };
    Object.assign(fbq, { push: fbq, loaded: true, version: '2.0', queue: [] });
    win.fbq = fbq;
    if (!win._fbq) win._fbq = fbq;
    addScript(doc, 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', ids.meta);
    fbq('track', 'PageView');
  }
  if (ids.ga && !win.gtag) {
    addScript(doc, `https://www.googletagmanager.com/gtag/js?id=${ids.ga}`);
    const dataLayer = (win.dataLayer = win.dataLayer ?? []);
    // gtag.js reads the arguments object itself, not an array copy.
    win.gtag = function gtag() { dataLayer.push(arguments); };
    win.gtag('js', new Date());
    win.gtag('config', ids.ga);
  }
}
