import Image from 'next/image';
import { getDictionary, localePath, type Locale, type PageKey } from '../i18n';

// The compact variant keeps only what helps a visitor finish contacting us: no portfolio links.
export default function SiteFooter({ locale = 'es', page = 'home', variant = 'full' }: { locale?: Locale; page?: PageKey; variant?: 'full' | 'compact' }) {
  const f = getDictionary(locale).footer;
  // Section anchors live on the home page; other pages link back to them.
  const anchorBase = page === 'home' ? '' : localePath(locale, 'home');
  if (variant === 'compact') {
    return (
      <footer className="site-footer site-footer-compact container">
        <div className="footer-main">
          <a href={localePath(locale, 'home')} aria-label={f.logoLabel}>
            <Image src="/brand/devtecia-logo-grafito.svg" alt="Devtecia" width={180} height={36} />
          </a>
          <a className="text-link" href="mailto:info@devtecia.com">info@devtecia.com <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Devtecia</span>
          <a href="#contenido">{f.backToTop}</a>
        </div>
      </footer>
    );
  }
  return (
    <footer className="site-footer container">
      <div className="footer-main">
        <a href={localePath(locale, 'home')} aria-label={f.logoLabel}>
          <Image src="/brand/devtecia-logo-grafito.svg" alt="Devtecia" width={180} height={36} />
        </a>
        <p>{f.tagline[0]}<br />{f.tagline[1]}</p>
        <a className="text-link" href="mailto:info@devtecia.com">info@devtecia.com <span aria-hidden="true">↗</span>
        </a>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Devtecia</span>
        <nav aria-label={f.navLabel}>
          {f.links.map(([label, href]) => <a key={href} href={`${anchorBase}${href}`}>{label}</a>)}
          <a href={localePath(locale, 'contact')} aria-current={page === 'contact' ? 'page' : undefined}>{f.contact}</a>
        </nav>
        <a href="#contenido">{f.backToTop}</a>
      </div>
    </footer>
  );
}
