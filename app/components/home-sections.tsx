import Image from 'next/image';
import TaglineReveal from './tagline-reveal';
import HeroMedia from './hero-media';
import AiReceiptFlow from './ai-receipt-flow';
import SiteFooter from './site-footer';
import { getDictionary, type Locale } from '../i18n';

type Props = { locale?: Locale };

export function Hero({ locale = 'es' }: Props) {
  const t = getDictionary(locale).hero;
  return (
    <section className="hero container" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 id="hero-title">{t.title[0]}<br />{t.title[1]}</h1>
        <p className="hero-description">{t.description}</p>
        <div className="hero-actions">
          <a className="button" href="#hablemos">{t.cta} <span aria-hidden="true">↗</span></a>
          <a className="text-link" href="#productos">{t.secondary} <span aria-hidden="true">↓</span></a>
        </div>
        <a className="hero-proof" href="#casos">{t.proof} <span aria-hidden="true">↗</span></a>
      </div>
      <HeroMedia locale={locale} />
    </section>
  );
}

// The three starting points double as the three campaign angles (?a=excel|tareas|medida).
const angles = ['excel', 'tareas', 'medida'];

export function Benefits({ locale = 'es' }: Props) {
  const t = getDictionary(locale).benefits;
  return (
    <section className="section mist-band" aria-labelledby="benefits-title">
      <div className="container">
        <div className="section-heading"><p className="eyebrow">{t.eyebrow}</p><h2 id="benefits-title">{t.title[0]}<br />{t.title[1]}</h2></div>
        <div className="benefit-grid">{t.items.map(([problem, title, copy], index) => (
          <article className="benefit-card" key={title} data-angle={angles[index]}><span className="card-index">0{index + 1}</span><p className="card-kicker">{problem}</p><h3>{title}</h3><p>{copy}</p></article>
        ))}</div>
      </div>
    </section>
  );
}

export function Services({ locale = 'es' }: Props) {
  const t = getDictionary(locale).services;
  return (
    <section className="section container" id="servicios" aria-labelledby="services-title">
      <div className="section-heading split-heading">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="services-title">{t.title[0]}<br />{t.title[1]}</h2>
        </div>
        <p>{t.intro}</p>
      </div>
      <div className="service-list">{t.items.map(({ name, title, copy, tags }, index) => {
        const number = `0${index + 1}`;
        return <article className="service-row" key={number}>
          <span className="service-number">{number}</span>
          <div>
            <p className="card-kicker">{name}</p>
            <h3>{title}</h3>
          </div>
          <div>
            <p>{copy}</p>
            <ul className="tag-list">{tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
          </div>
          {number === '02' && <AiExample locale={locale} />}
        </article>;
      })}</div>
    </section>
  );
}

function AiExample({ locale = 'es' }: Props) {
  const t = getDictionary(locale).services;
  return (
    <aside className="ai-example" aria-labelledby="ai-example-title">
      <div className="ai-example-copy">
        <div>
          <p className="card-kicker">{t.aiKicker}</p>
          <h4 id="ai-example-title">{t.aiTitle}</h4>
        </div>
        <div>
          <p>{t.aiCopy}</p>
          <a className="text-link" href="#hablemos">{t.aiCta} <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <AiReceiptFlow locale={locale} />
    </aside>
  );
}

export function Products({ locale = 'es' }: Props) {
  const { products: t, newTab } = getDictionary(locale);
  return (
    <>
      <TaglineReveal locale={locale} />
      <section className="section product-section" id="productos" aria-labelledby="products-title">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 id="products-title">{t.title[0]}<br />{t.title[1]}</h2>
            <p>{t.intro}</p>
          </div>
          <article className="product-card product-card-compact ventex-brand">
            <div className="product-copy">
              <span className="product-label">{t.label}</span>
              <Image className="ventex-wordmark" src="/Ventex-Branding-Modular/ventex-modular.svg" alt="Ventex" width={299} height={74} />
              <h3>{t.heading[0]}<br />{t.heading[1]}</h3>
              <p>{t.copy}</p>
              <p className="ventex-product-signature">{t.signature}</p>
              <a className="button" href="https://www.ventex.app" target="_blank" rel="noopener noreferrer">
                {t.cta} <span aria-hidden="true">↗</span>
                <span className="sr-only">{newTab}</span>
              </a>
            </div>
            <figure className="product-evidence">
              <div className="evidence-heading"><span>{t.evidenceTitle}</span><span>{t.realProduct}</span></div>
              <a className="screenshot-link" href="/images/ventex-inventory.png" target="_blank" rel="noopener noreferrer" aria-label={t.screenshotLabel}>
                <Image src="/images/ventex-inventory.png" alt={t.screenshotAlt} width={2560} height={2018} sizes="(max-width: 600px) calc(100vw - 88px), (max-width: 860px) 480px, (max-width: 1100px) 40vw, 480px" />
              </a>
              <figcaption><span>{t.caption}</span><a className="text-link" href="/images/ventex-inventory.png" target="_blank" rel="noopener noreferrer">{t.fullView}<span className="sr-only">{newTab}</span></a></figcaption>
            </figure>
          </article>
        </div>
      </section>
    </>
  );
}

export function Cases({ locale = 'es' }: Props) {
  const { cases: t, newTab } = getDictionary(locale);
  return (
    <section className="section container" id="casos" aria-labelledby="cases-title">
      <div className="section-heading split-heading">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="cases-title">{t.title[0]}<br />{t.title[1]}</h2>
        </div>
        <p>{t.intro}</p>
      </div>
      <div className="case-grid">
        <article className="case-card ventex-brand">
          <div className="ventex-case-evidence">
            <div className="evidence-heading"><Image className="ventex-wordmark" src="/Ventex-Branding-Modular/ventex-modular.svg" alt="Ventex" width={299} height={74} /><span>{t.realProduct}</span></div>
            <div className="case-thumbnail-grid">
              {t.thumbnails.map(([name, alt, view]) => (
                <figure className="case-screenshot" key={name}>
                  <a className="screenshot-link" href={`/images/ventex-${name}.png`} target="_blank" rel="noopener noreferrer" aria-label={t.thumbnailLabel(view)}>
                    <Image src={`/images/ventex-${name}.png`} alt={alt} width={2560} height={2018} sizes="(max-width: 600px) calc((100vw - 104px) / 2), (max-width: 1100px) 20vw, 250px" />
                  </a>
                  <figcaption>{view}</figcaption>
                </figure>
              ))}
            </div>
            <p className="evidence-note">{t.evidenceNote}</p>
          </div>
          <div className="case-body">
            <p className="card-kicker">{t.ventexKicker}</p>
            <h3>{t.ventexTitle}</h3>
            <p>{t.ventexCopy}</p>
            <a className="text-link" href="https://www.ventex.app" target="_blank" rel="noopener noreferrer">{t.ventexCta} <span aria-hidden="true">↗</span><span className="sr-only">{newTab}</span></a>
          </div>
        </article>
        <article className="case-card">
          <div className="ensama-case-evidence">
            <div className="evidence-heading"><Image className="ensama-case-logo" src="/ENSAMA-logo-editable/ensama-logo-sin-lema.svg" alt="ENSAMA" width={800} height={416} /><span>{t.realStore}</span></div>
            <figure className="case-screenshot">
              <a className="screenshot-link" href="/images/ensama-store.png" target="_blank" rel="noopener noreferrer" aria-label={t.storeLabel}>
                <Image src="/images/ensama-store.png" alt={t.storeAlt} width={2560} height={2018} sizes="(max-width: 600px) calc(100vw - 88px), (max-width: 1100px) 40vw, 480px" />
              </a>
              <figcaption>{t.storeCaption}</figcaption>
            </figure>
          </div>
          <div className="case-body">
            <p className="card-kicker">{t.ensamaKicker}</p>
            <h3>{t.ensamaTitle}</h3>
            <p>{t.ensamaCopy}</p>
            <a className="text-link" href="https://www.ensama.store/" target="_blank" rel="noopener noreferrer">{t.ensamaCta} <span aria-hidden="true">↗</span>
              <span className="sr-only">{newTab}</span>
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}

export function Process({ locale = 'es' }: Props) {
  const t = getDictionary(locale).process;
  return (
    <section className="section mist-band" id="proceso" aria-labelledby="process-title">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="process-title">{t.title[0]}<br />{t.title[1]}</h2>
          <p>{t.intro}</p>
        </div>
        <ol className="process-grid">{t.steps.map(([title, copy], index) => <li key={title}>
            <span className="step-index">0{index + 1}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </li>)}</ol>
      </div>
    </section>
  );
}

export function FAQ({ locale = 'es' }: Props) {
  const t = getDictionary(locale).faq;
  return (
    <section className="section container faq-section" aria-labelledby="faq-title">
      <div className="faq-intro">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2 id="faq-title">{t.title[0]}<br />{t.title[1]}</h2>
        <p>{t.different}<br />
          <a className="text-link" href="#hablemos">{t.cta} <span aria-hidden="true">↗</span>
          </a>
        </p>
      </div>
      <div className="faq-list">{t.questions.map(([question, answer]) => <details key={question}>
          <summary>{question}<span aria-hidden="true">+</span>
          </summary>
          <p>{answer}</p>
        </details>)}</div>
    </section>
  );
}

export function Closing({ locale = 'es' }: Props) {
  const t = getDictionary(locale).closing;
  return (
    <>
      <section className="closing-section" aria-labelledby="closing-title">
        <div className="container">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="closing-title">{t.title[0]}<br />{t.title[1]}</h2>
          <p>{t.copy[0]}<br />{t.copy[1]}</p>
          <a className="button button-light" href="#hablemos">{t.cta} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
      <SiteFooter locale={locale} />
    </>
  );
}
