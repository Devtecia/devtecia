import ContactForm from './contact-form';
import ContactSteps from './contact-steps';
import PlatformBuild from './platform-build';
import SiteFooter from './site-footer';
import SiteHeader from './site-header';
import { getDictionary, localePath, type Locale } from '../i18n';

export default function ContactPage({ locale = 'es' }: { locale?: Locale }) {
  const dictionary = getDictionary(locale);
  const t = dictionary.contact;
  return (
    <>
      <a className="skip-link" href="#contenido">{dictionary.skipLink}</a>
      <SiteHeader locale={locale} page="contact" />
      <main id="contenido" className="contact-page">
        <section className="contact-layout container" aria-labelledby="contact-title">
          <div className="contact-intro">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 id="contact-title">{t.title}</h1>
            <p className="contact-lead">{t.intro}</p>
            <PlatformBuild locale={locale} />
            <ContactSteps locale={locale} />
            <p className="contact-direct">{t.direct} <a className="text-link" href="mailto:info@devtecia.com">info@devtecia.com <span aria-hidden="true">↗</span></a></p>
          </div>
          <ContactForm locale={locale} />
        </section>
      </main>
      <SiteFooter locale={locale} page="contact" variant="compact" />
    </>
  );
}
