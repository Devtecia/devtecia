'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { getDictionary, type Locale } from '../i18n';

type Phase = 'intro' | 'design' | 'build' | 'connect' | 'launch' | 'reset';

// Phase order, its timeline step and how long it holds. The cycle lasts about 9.5 seconds.
const cycle: [Phase, number, number][] = [
  ['intro', 0, 300],
  ['design', 1, 1700],
  ['build', 2, 2600],
  ['connect', 3, 1900],
  ['launch', 4, 2200],
  ['reset', 0, 600],
];

const bars = [38, 52, 46, 64, 58, 76, 88];

// de-DE groups four digit numbers ("1.284"), which es-CO formatting does not; en-US matches the English copy.
const numberLocale: Record<Locale, string> = { es: 'de-DE', en: 'en-US' };

export default function PlatformBuild({ locale = 'es' }: { locale?: Locale }) {
  const figure = useRef<HTMLElement>(null);
  const t = getDictionary(locale).contact.platform;

  useEffect(() => {
    const element = figure.current;
    if (!element || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = element;
    const decimal = locale === 'es' ? ',' : '.';
    let cycleId = 0;
    let timer = 0;
    let frame = 0;

    const counters = () => Array.from(root.querySelectorAll<HTMLElement>('[data-count]'));
    const setPhase = (phase: Phase, step: number) => {
      root.dataset.phase = phase;
      root.dataset.step = String(step);
    };

    const countUp = (id: number) => {
      const targets = counters().map(node => {
        const target = node.dataset.count ?? '';
        const suffix = target.replace(/[\d.,]/g, '');
        const [whole, fraction = ''] = target.replace(suffix, '').split(decimal);
        const value = Number(`${whole.replace(/[.,]/g, '')}.${fraction || '0'}`);
        const format = new Intl.NumberFormat(numberLocale[locale], { minimumFractionDigits: fraction.length, maximumFractionDigits: fraction.length });
        return { node, target, suffix, value, format };
      });
      const start = performance.now();
      const step = (now: number) => {
        if (id !== cycleId) return;
        const progress = Math.min((now - start) / 1400, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        for (const { node, target, suffix, value, format } of targets) {
          node.textContent = progress === 1 ? target : `${format.format(value * eased)}${suffix}`;
        }
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const run = (id: number, index = 0) => {
      if (id !== cycleId) return;
      const [phase, step, hold] = cycle[index];
      setPhase(phase, step);
      if (phase === 'build') countUp(id);
      timer = window.setTimeout(() => run(id, (index + 1) % cycle.length), hold);
    };

    const stop = () => {
      cycleId += 1;
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      counters().forEach(node => { node.textContent = node.dataset.count ?? ''; });
    };

    root.classList.add('pb-enhanced');
    setPhase('intro', 0);
    const observer = new IntersectionObserver(([entry]) => {
      stop();
      if (entry.isIntersecting) run(cycleId);
      else setPhase('intro', 0);
    }, { threshold: 0.3 });
    observer.observe(root);

    return () => {
      observer.disconnect();
      stop();
      root.classList.remove('pb-enhanced');
      delete root.dataset.phase;
      delete root.dataset.step;
    };
  }, [locale]);

  return (
    <figure className="platform-build" ref={figure} aria-label={t.label}>
      <div className="pb-window" aria-hidden="true">
        <div className="pb-bar">
          <span className="pb-dots"><span /><span /><span /></span>
          <span className="pb-url">{t.url}</span>
          <span className="pb-live">
            <svg viewBox="0 0 16 16" focusable="false"><path d="M3.5 8.5l3 3 6-7" /></svg>
            {t.live}
          </span>
        </div>
        <div className="pb-app">
          <div className="pb-block pb-side">
            <strong className="pb-fill">{t.title}</strong>
            <ul>{t.nav.map((item, index) => (
              <li className="pb-fill" key={item} style={{ '--i': index + 1 } as CSSProperties}>{item}</li>
            ))}</ul>
          </div>
          <div className="pb-main">
            <div className="pb-kpis">{t.kpis.map(([label, value], index) => (
              <div className="pb-block pb-kpi" key={label}>
                <span className="pb-fill" style={{ '--i': index } as CSSProperties}>{label}</span>
                <strong className="pb-fill" data-count={value} style={{ '--i': index } as CSSProperties}>{value}</strong>
              </div>
            ))}</div>
            <div className="pb-block pb-chart">
              <span className="pb-fill">{t.chart}</span>
              <div className="pb-bars">{bars.map((height, index) => (
                <span key={index} style={{ '--h': `${height}%`, '--i': index } as CSSProperties} />
              ))}</div>
            </div>
            <div className="pb-connect">
              <div className="pb-block pb-table">{t.rows.map(([name, status], index) => (
                <div className="pb-row" key={name} style={{ '--i': index } as CSSProperties}>
                  <span>{name}</span><span className="pb-status">{status}</span>
                </div>
              ))}</div>
              <span className="pb-link"><span /></span>
              <span className="pb-node">{t.node}</span>
            </div>
          </div>
        </div>
      </div>
      <ol className="pb-timeline" aria-hidden="true">{t.phases.map((phase, index) => (
        <li key={phase}><span>0{index + 1}</span>{phase}</li>
      ))}</ol>
    </figure>
  );
}
