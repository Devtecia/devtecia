import { getDictionary, type Locale } from '../i18n';

// Static on purpose: the platform build graphic is the only looping animation on the contact page.
export default function ContactSteps({ locale = 'es' }: { locale?: Locale }) {
  const t = getDictionary(locale).contact;
  return (
    <div className="contact-next">
      <h2 id="contact-next-title">{t.nextTitle}</h2>
      <ol className="contact-steps" aria-labelledby="contact-next-title">
        {t.steps.map(([title, copy], index) => (
          <li key={title} data-contact-step={index + 1}>
            <span className="contact-step-index" aria-hidden="true">0{index + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
