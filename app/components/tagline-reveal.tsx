'use client';

import { useEffect, useRef } from 'react';
import { getDictionary, type Locale } from '../i18n';

export default function TaglineReveal({ locale = 'es' }: { locale?: Locale }) {
  const t = getDictionary(locale).tagline;
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = section.current;
    if (!element || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const words = element.querySelectorAll<HTMLElement>('[data-word]');
    element.classList.add('reveal-enhanced');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('word-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0.8 });
    words.forEach(word => observer.observe(word));
    return () => { observer.disconnect(); element.classList.remove('reveal-enhanced'); };
  }, []);

  let index = 0;
  return (
    <section className="tagline-section" ref={section} aria-labelledby="tagline-title">
      <div className="container">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2 id="tagline-title" className="tagline-text">
          {t.lines.map(line => (
            <span className="tagline-line" key={line}>{line.split(' ').map(word => (
              <span key={word} data-word style={{ transitionDelay: `${index++ * 120}ms` }}>{word}{' '}</span>
            ))}</span>
          ))}
        </h2>
        <p className="tagline-caption">{t.caption}</p>
      </div>
    </section>
  );
}
