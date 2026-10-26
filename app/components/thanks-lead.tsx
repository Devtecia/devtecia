'use client';

import { useEffect } from 'react';
import { injectTracking, readConsent, trackingIds, type TrackerWindow } from '../../lib/consent';
import { settleLead } from '../../lib/lead';
import { trackLead } from './analytics';

const store = (name: 'localStorage' | 'sessionStorage') => { try { return window[name]; } catch { return undefined; } };

/**
 * Moves focus to the thanks heading and counts the lead once. The marker is spent on every arrival, so a reload never
 * counts again. This effect runs before the layout's Tracking effect, so it loads the consented trackers itself
 * (injectTracking is idempotent) before firing; without consent nothing loads and nothing fires.
 */
export default function ThanksLead({ headingId }: { headingId: string }) {
  useEffect(() => {
    document.getElementById(headingId)?.focus({ preventScroll: true });
    const ids = trackingIds();
    const lead = settleLead(store('sessionStorage'), readConsent(store('localStorage')), ids, Date.now());
    if (!lead) return;
    injectTracking(ids, window as TrackerWindow, document);
    trackLead(lead);
  }, [headingId]);
  return null;
}
