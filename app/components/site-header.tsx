'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { getDictionary, localePath, type Locale, type PageKey } from '../i18n';
import LanguageSwitch from './language-switch';

export default function SiteHeader({ locale = 'es', page = 'home' }: { locale?: Locale; page?: PageKey }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const t = getDictionary(locale).header;
  // Section anchors live on the home page; other pages link back to them.
  const anchorBase = page === 'home' ? '' : localePath(locale, 'home');

  useEffect(() => {
    if (!open) return;
    // Keep the page behind the open mobile menu from scrolling.
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener('keydown', escape);
    // The menu only exists on narrow screens; leaving that breakpoint closes it and releases the lock.
    const mobile = window.matchMedia('(max-width: 860px)');
    const leaveMobile = (event: MediaQueryListEvent) => { if (!event.matches) setOpen(false); };
    mobile.addEventListener('change', leaveMobile);
    return () => {
      document.removeEventListener('keydown', escape);
      mobile.removeEventListener('change', leaveMobile);
      root.style.overflow = previousOverflow;
    };
  }, [open]);

  // The contact page keeps the visitor focused: only the way back and the language.
  if (page === 'contact') return (
    <header className="site-header site-header-minimal">
      <nav className="site-nav container" aria-label={t.navLabel}>
        <a className="contact-back" href={localePath(locale, 'home')}><span aria-hidden="true">←</span>{getDictionary(locale).contact.back}</a>
        <LanguageSwitch locale={locale} page={page} />
      </nav>
    </header>
  );

  return (
    <header className="site-header">
      <nav className="site-nav container" aria-label={t.navLabel}>
        <a className="site-logo" href={localePath(locale, 'home')} aria-label={t.logoLabel} aria-current={page === 'home' ? 'page' : undefined} onClick={() => setOpen(false)}>
          <Image src="/brand/devtecia-logo-grafito.svg" alt="Devtecia" width={160} height={32} priority />
        </a>
        <button ref={toggle} className="menu-toggle" type="button" aria-expanded={open} aria-controls="site-menu" aria-label={open ? t.closeMenu : t.openMenu} onClick={() => setOpen(!open)}>
          <span /><span />
        </button>
        <div className={`site-menu${open ? ' is-open' : ''}`} id="site-menu">
          {t.links.map(([label, href]) => <a key={href} href={`${anchorBase}${href}`} onClick={() => setOpen(false)}>{label}</a>)}
          <LanguageSwitch locale={locale} page={page} onNavigate={() => setOpen(false)} />
          <a className="button button-small" href={localePath(locale, 'contact')} onClick={() => setOpen(false)}>{t.cta} <span aria-hidden="true">↗</span></a>
        </div>
      </nav>
    </header>
  );
}
