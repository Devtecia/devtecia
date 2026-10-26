'use client';

import { useEffect, useRef, useState } from 'react';
import { CONSENT_OPEN_ATTR } from '../../lib/consent';
import { showStickyCta, STICKY_CTA_HERO, STICKY_CTA_TARGET, STICKY_OFFSET_VAR, type StickyCtaState } from '../../lib/sticky-cta';

// The server HTML ships the bar hidden, so nothing flashes before hydration; without IntersectionObserver it stays
// hidden. CSS only lets it appear at phone widths, and while it is on screen it reserves its own height at the bottom
// of the page (through --sticky-offset) so the last content and the form's submit are never covered.
export default function StickyCta({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = document.querySelector(STICKY_CTA_HERO);
    const form = document.querySelector(STICKY_CTA_TARGET);
    if (!('IntersectionObserver' in window) || !hero || !form) return;
    const root = document.documentElement;
    const state: StickyCtaState = { heroInView: true, formInView: false, consentOpen: root.hasAttribute(CONSENT_OPEN_ATTR) };
    const update = () => setVisible(showStickyCta(state));
    const watch = (target: Element, key: 'heroInView' | 'formInView') => {
      const observer = new IntersectionObserver(([entry]) => { state[key] = entry.isIntersecting; update(); });
      observer.observe(target);
      return observer;
    };
    const observers = [watch(hero, 'heroInView'), watch(form, 'formInView')];
    const consent = new MutationObserver(() => { state.consentOpen = root.hasAttribute(CONSENT_OPEN_ATTR); update(); });
    consent.observe(root, { attributes: true, attributeFilter: [CONSENT_OPEN_ATTR] });
    return () => {
      observers.forEach(observer => observer.disconnect());
      consent.disconnect();
    };
  }, []);

  // offsetHeight is 0 when CSS keeps the bar off (wider screens), so only phones get the extra room.
  useEffect(() => {
    const bar = barRef.current;
    if (!visible || !bar) return;
    const root = document.documentElement;
    const reserve = () => {
      if (bar.offsetHeight) root.style.setProperty(STICKY_OFFSET_VAR, `${bar.offsetHeight}px`);
      else root.style.removeProperty(STICKY_OFFSET_VAR);
    };
    reserve();
    const observer = new ResizeObserver(reserve);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty(STICKY_OFFSET_VAR);
    };
  }, [visible]);

  return (
    <div className="sticky-cta" hidden={!visible} ref={barRef}>
      <a className="button" href={STICKY_CTA_TARGET}>{label} <span aria-hidden="true">↗</span></a>
    </div>
  );
}
