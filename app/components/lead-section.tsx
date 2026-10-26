import { whatsappUrl } from '../../lib/campaign';
import { getDictionary, type Locale } from '../i18n';
import ContactForm from './contact-form';
import ContactSteps from './contact-steps';
import WhatsAppLink from './whatsapp-link';

// The contact form on the home page itself, right after the three starting points: that is where a visitor
// who just recognised their situation is most willing to write. `/hablemos` stays for direct links and SEO.
// The WhatsApp button only exists when NEXT_PUBLIC_WHATSAPP_NUMBER is set to a plausible number.
export default function LeadSection({ locale = 'es' }: { locale?: Locale }) {
  const { lead: t, newTab } = getDictionary(locale);
  const whatsapp = whatsappUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, t.whatsappMessage);
  return (
    <section className="section container lead-section" id="hablemos" aria-labelledby="lead-title">
      <div className="lead-layout">
        <div className="lead-intro">
          <div className="section-heading">
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 id="lead-title">{t.title[0]}<br />{t.title[1]}</h2>
            <p>{t.intro}</p>
          </div>
          <ContactSteps locale={locale} />
          {whatsapp && <p className="lead-alt"><WhatsAppLink href={whatsapp} label={t.whatsapp} newTab={newTab} /></p>}
          <a className="hero-proof" href="#casos">{t.proof} <span aria-hidden="true">↗</span></a>
        </div>
        <ContactForm locale={locale} />
      </div>
    </section>
  );
}
