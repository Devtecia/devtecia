'use client';

import { useEffect, useRef } from 'react';
import { getDictionary, type Locale } from '../i18n';

// Field keys drive the data-source / data-field / data-chip hooks and stay identical across locales.
const fieldKeys = [
  { key: 'proveedor', marker: '1' },
  { key: 'fecha', marker: '2' },
  { key: 'total', marker: '3' },
  { key: 'moneda' },
] as const;

const travellingKeys = fieldKeys.filter(field => 'marker' in field).map(field => field.key);

const phaseIds = ['scan', 'detect', 'extract', 'done'];

type Phase = 'intro' | 'scan' | 'detect' | 'extract' | 'done' | 'reset';

export default function AiReceiptFlow({ locale = 'es' }: { locale?: Locale }) {
  const figure = useRef<HTMLElement>(null);
  const t = getDictionary(locale).receipt;
  const values: Record<string, string> = { proveedor: t.merchant, fecha: t.values.fecha, total: t.values.total, moneda: 'COP' };
  const extractedFields = fieldKeys.map(field => ({ key: field.key, label: t.fields[field.key], value: values[field.key], marker: 'marker' in field ? field.marker : undefined }));
  const travellingFields = extractedFields.filter(field => field.marker);

  useEffect(() => {
    const element = figure.current;
    if (!element || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = element;
    let cycleId = 0;
    const timers = new Set<number>();
    const animations = new Set<Animation>();

    const setPhase = (phase: Phase) => { root.dataset.phase = phase; };
    const rows = () => root.querySelectorAll<HTMLElement>('[data-field]');
    const wait = (ms: number, id: number) => new Promise<boolean>(resolve => {
      const timer = window.setTimeout(() => { timers.delete(timer); resolve(id === cycleId); }, ms);
      timers.add(timer);
    });

    const center = (target: Element, origin: DOMRect) => {
      const rect = target.getBoundingClientRect();
      return { x: rect.left - origin.left + rect.width / 2, y: rect.top - origin.top + rect.height / 2 };
    };

    const flyChip = (key: string, delay: number) => {
      const chip = root.querySelector<HTMLElement>(`[data-chip="${key}"]`);
      const source = root.querySelector(`[data-source="${key}"]`);
      const target = root.querySelector(`[data-field="${key}"] dd`);
      const reader = root.querySelector('.ai-bot-mark');
      const row = root.querySelector<HTMLElement>(`[data-field="${key}"]`);
      if (!chip || !source || !target || !reader || !row) return Promise.resolve();
      const origin = root.getBoundingClientRect();
      const from = center(source, origin);
      const via = center(reader, origin);
      const to = center(target, origin);
      const at = ({ x, y }: { x: number; y: number }, scale: number) =>
        `translate(${x - chip.offsetWidth / 2}px, ${y - chip.offsetHeight / 2}px) scale(${scale})`;
      const animation = chip.animate([
        { transform: at(from, 0.9), opacity: 0 },
        { transform: at(from, 1.05), opacity: 1, offset: 0.12 },
        { transform: at(via, 0.55), opacity: 1, offset: 0.48 },
        { transform: at(via, 0.55), opacity: 1, offset: 0.56 },
        { transform: at(to, 1), opacity: 1, offset: 0.9 },
        { transform: at(to, 1), opacity: 0 },
      ], { duration: 1500, delay, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' });
      animations.add(animation);
      const landing = window.setTimeout(() => { timers.delete(landing); row.classList.add('is-filled'); }, delay + 1350);
      timers.add(landing);
      return animation.finished.catch(() => undefined).finally(() => animations.delete(animation));
    };

    const stop = () => {
      cycleId += 1;
      timers.forEach(timer => window.clearTimeout(timer));
      timers.clear();
      animations.forEach(animation => animation.cancel());
      animations.clear();
    };

    const run = async () => {
      const id = ++cycleId;
      while (id === cycleId) {
        rows().forEach(row => row.classList.remove('is-filled'));
        setPhase('intro');
        if (!await wait(700, id)) return;
        setPhase('scan');
        if (!await wait(1700, id)) return;
        setPhase('detect');
        if (!await wait(1300, id)) return;
        setPhase('extract');
        await Promise.all(travellingKeys.map((key, index) => flyChip(key, index * 260)));
        if (id !== cycleId) return;
        root.querySelector('[data-field="moneda"]')?.classList.add('is-filled');
        if (!await wait(350, id)) return;
        setPhase('done');
        if (!await wait(2600, id)) return;
        setPhase('reset');
        if (!await wait(800, id)) return;
      }
    };

    root.classList.add('flow-enhanced');
    setPhase('intro');
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) run();
      else stop();
    }, { threshold: 0.2 });
    observer.observe(root);

    return () => {
      observer.disconnect();
      stop();
      root.classList.remove('flow-enhanced');
      delete root.dataset.phase;
      rows().forEach(row => row.classList.remove('is-filled'));
    };
  }, []);

  return (
    <figure className="ai-flow" ref={figure} aria-label={t.label}>
      <ol className="ai-flow-timeline" aria-hidden="true">{phaseIds.map((id, index) => (
        <li key={id} data-step={id}><span>0{index + 1}</span>{t.phases[index]}</li>
      ))}</ol>
      <ol className="ai-flow-steps">
        <li className="ai-flow-step ai-receipt">
          <span className="ai-step-label">{t.documentStep}</span>
          <strong>{t.documentTitle}</strong>
          <div className="receipt-stage">
            <span className="scan-frame" aria-hidden="true"><span /><span /><span /><span /></span>
            <div className="receipt-paper">
              <span className="receipt-scan" aria-hidden="true" />
              <p className="receipt-merchant"><mark data-source="proveedor"><span className="field-marker" aria-hidden="true">1</span>{t.merchant}</mark></p>
              <p className="receipt-meta">{t.meta}</p>
              <p className="receipt-meta"><mark data-source="fecha"><span className="field-marker" aria-hidden="true">2</span>{t.date}</mark> · {t.time}</p>
              <ul className="receipt-items">{t.items.map(([item, price]) => (
                <li key={item}><span>{item}</span><span>{price}</span></li>
              ))}</ul>
              <p className="receipt-total"><span>{t.total}</span><mark data-source="total"><span className="field-marker" aria-hidden="true">3</span>{t.totalValue}</mark></p>
            </div>
          </div>
        </li>
        <li className="ai-flow-step ai-bot">
          <span className="ai-step-label">{t.readStep}</span>
          <span className="ai-bot-mark" aria-hidden="true"><span className="ai-bot-orbit" /><span className="ai-bot-core">{t.botCore}</span></span>
          <strong>{t.botTitle}</strong>
          <span className="ai-bot-detail">{t.botDetail}</span>
          <span className="ai-bot-track" aria-hidden="true"><span /><span /><span /></span>
        </li>
        <li className="ai-flow-step ai-output">
          <span className="ai-step-label">{t.outputStep}</span>
          <strong>{t.outputTitle}</strong>
          <dl>{extractedFields.map(({ key, label, value, marker }) => (
            <div key={key} data-field={key}>
              <dt>{marker ? <span className="field-marker" aria-hidden="true">{marker}</span> : <span className="field-marker field-marker-inferred" aria-hidden="true" />}{label}</dt>
              <dd><span>{value}</span></dd>
            </div>
          ))}</dl>
          <p className="ai-output-status"><span aria-hidden="true" />{t.status}</p>
        </li>
      </ol>
      <div className="ai-flow-chips" aria-hidden="true">{travellingFields.map(({ key, value, marker }) => (
        <span key={key} data-chip={key}><span className="field-marker">{marker}</span>{value}</span>
      ))}</div>
    </figure>
  );
}
