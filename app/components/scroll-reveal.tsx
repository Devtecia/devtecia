'use client';

import { useEffect } from 'react';

// Blocks that fade up as they enter the viewport. Siblings in the same group stagger.
const targets = [
  '.section-heading',
  '.benefit-card',
  '.service-row',
  '.product-card',
  '.case-card',
  '.process-grid > li',
  '.faq-intro',
  '.faq-list > details',
  '.closing-section .container > *',
].join(', ');

export default function ScrollReveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    const elements = [...document.querySelectorAll<HTMLElement>(targets)];
    const groups = new Map<Element | null, number>();
    for (const element of elements) {
      const index = groups.get(element.parentElement) ?? 0;
      groups.set(element.parentElement, index + 1);
      element.dataset.reveal = '';
      element.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 90}ms`);
    }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    root.classList.add('reveal-ready');
    elements.forEach(element => observer.observe(element));
    return () => {
      observer.disconnect();
      root.classList.remove('reveal-ready');
      for (const element of elements) {
        delete element.dataset.reveal;
        element.classList.remove('is-revealed');
        element.style.removeProperty('--reveal-delay');
      }
    };
  }, []);
  return null;
}
