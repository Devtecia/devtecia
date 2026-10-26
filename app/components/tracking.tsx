'use client';

import { useEffect, useRef, useState } from 'react';
import { privacyUrl } from '../../lib/campaign';
import { CONSENT_OPEN_EVENT, injectTracking, readConsent, shouldLoadTracking, trackingIds, writeConsent, type Consent, type TrackerWindow } from '../../lib/consent';
import type { Dictionary } from '../i18n';

// Meta Pixel and GA4, switched on only by NEXT_PUBLIC_META_PIXEL_ID / NEXT_PUBLIC_GA_ID and loaded only after the
// visitor accepts. The server HTML never carries a tracking script or the banner: both appear after hydration, once the
// stored choice is known, so a returning visitor never sees the banner flash.
type Props = { copy: Dictionary['consent']; metaPixelId?: string; gaId?: string };

const storage = () => { try { return window.localStorage; } catch { return undefined; } };

export default function Tracking({ copy: t, metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID, gaId = process.env.NEXT_PUBLIC_GA_ID }: Props) {
  const ids = trackingIds(metaPixelId, gaId);
  const [open, setOpen] = useState(false);
  const firstButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const enabled = Boolean(ids.meta || ids.ga);

  useEffect(() => {
    if (!enabled) return;
    const consent = readConsent(storage());
    if (shouldLoadTracking(consent, ids)) injectTracking(ids, window as TrackerWindow, document);
    else if (consent === null) setOpen(true);
    const reopen = () => {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
      requestAnimationFrame(() => firstButton.current?.focus());
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
    // ids come from build-time env vars and never change while the page is open.
  }, [enabled]);

  if (!enabled || !open) return null;

  const privacy = privacyUrl(process.env.NEXT_PUBLIC_PRIVACY_URL);
  const choose = (consent: Consent) => {
    writeConsent(storage(), consent);
    // Rejecting after accepting only stops future loads; scripts already running stay until the next reload.
    if (shouldLoadTracking(consent, ids)) injectTracking(ids, window as TrackerWindow, document);
    setOpen(false);
    returnFocus.current?.focus();
    returnFocus.current = null;
  };

  return (
    <section className="consent-banner" role="dialog" aria-labelledby="consent-title" aria-describedby="consent-text">
      <h2 id="consent-title" className="consent-title">{t.title}</h2>
      <p id="consent-text" className="consent-text">{t.text}{privacy && <> <a className="text-link" href={privacy}>{t.privacy}</a></>}</p>
      {/* Same weight on purpose: rejecting must be as easy as accepting. */}
      <div className="consent-actions">
        <button ref={firstButton} type="button" className="consent-button" onClick={() => choose('denied')}>{t.reject}</button>
        <button type="button" className="consent-button" onClick={() => choose('granted')}>{t.accept}</button>
      </div>
    </section>
  );
}

/** Footer control that shows the banner again so the visitor can change their choice. */
export function ConsentSettingsButton({ label }: { label: string }) {
  return <button type="button" className="footer-link-button" onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}>{label}</button>;
}
