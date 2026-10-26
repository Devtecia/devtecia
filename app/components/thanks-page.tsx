import { whatsappUrl } from '../../lib/campaign';
import { getDictionary, localePath, type Locale } from '../i18n';
import SiteFooter from './site-footer';
import SiteHeader from './site-header';
import ThanksLead from './thanks-lead';
import WhatsAppLink from './whatsapp-link';

// Where the contact form lands after the server accepted a message. It reads the same on a direct visit; only a fresh
// submission (the one-shot marker in lib/lead.ts) counts as a lead. The WhatsApp link needs NEXT_PUBLIC_WHATSAPP_NUMBER.
export default function ThanksPage({ locale = 'es' }: { locale?: Locale }) {
  const dictionary = getDictionary(locale);
  const t = dictionary.thanks;
  const whatsapp = whatsappUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, t.whatsappMessage);
  return (
    <>
      <a className="skip-link" href="#contenido">{dictionary.skipLink}</a>
      <SiteHeader locale={locale} page="thanks" />
      <main id="contenido" className="thanks-page">
        <section className="thanks container" aria-labelledby="thanks-title">
          <div className="contact-sent" aria-hidden="true">
            <span className="contact-sent-card"><span /><span /><span /></span>
            <svg className="contact-sent-check" viewBox="0 0 48 48" focusable="false">
              <circle cx="24" cy="24" r="22" pathLength="1" />
              <path d="M15 24.5l6 6 12-13" pathLength="1" />
            </svg>
          </div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 id="thanks-title" tabIndex={-1}>{t.title}</h1>
          <p className="thanks-copy">{t.copy}</p>
          <div className="thanks-actions">
            <a className="button" href={localePath(locale, 'home')}>{t.home} <span aria-hidden="true">↗</span></a>
            {whatsapp && <WhatsAppLink href={whatsapp} label={t.whatsapp} newTab={dictionary.newTab} />}
          </div>
          <p className="thanks-direct">{t.direct} <a className="text-link" href="mailto:info@devtecia.com">info@devtecia.com <span aria-hidden="true">↗</span></a></p>
          <ThanksLead headingId="thanks-title" />
        </section>
      </main>
      <SiteFooter locale={locale} page="thanks" variant="compact" />
    </>
  );
}
