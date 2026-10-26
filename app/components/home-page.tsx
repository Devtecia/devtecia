import ScrollReveal from './scroll-reveal';
import LeadSection from './lead-section';
import SiteHeader from './site-header';
import StickyCta from './sticky-cta';
import { Benefits, Cases, Closing, FAQ, Hero, Process, Products, Services } from './home-sections';
import { getDictionary, siteUrl, type Locale } from '../i18n';

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Devtecia',
  url: siteUrl,
  logo: `${siteUrl}/brand/devtecia-logo-grafito.svg`,
  email: 'info@devtecia.com',
};

export default function HomePage({ locale = 'es' }: { locale?: Locale }) {
  return (
    <>
      <a className="skip-link" href="#contenido">{getDictionary(locale).skipLink}</a>
      <SiteHeader locale={locale} />
      <main id="contenido">
        <Hero locale={locale} />
        <Benefits locale={locale} />
        <LeadSection locale={locale} />
        <Services locale={locale} />
        <Products locale={locale} />
        <Cases locale={locale} />
        <Process locale={locale} />
        <FAQ locale={locale} />
      </main>
      <Closing locale={locale} />
      <StickyCta label={getDictionary(locale).hero.cta} />
      <ScrollReveal />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
    </>
  );
}
