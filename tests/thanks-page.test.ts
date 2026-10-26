import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ThanksPage from '../app/components/thanks-page';
import { metadata as spanishThanks } from '../app/(es)/gracias/page';
import { metadata as englishThanks } from '../app/en/thanks/page';
import { localePath } from '../app/i18n';
import sitemap from '../app/sitemap';

const responseTime = /\b\d+\s*(h|horas|hours|día|días|day|days)\b/i;
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const render = (locale: 'es' | 'en') => renderToStaticMarkup(createElement(ThanksPage, { locale }));

test('thanks routes exist per locale', () => {
  assert.equal(localePath('es', 'thanks'), '/gracias');
  assert.equal(localePath('en', 'thanks'), '/en/thanks');
});

test('thanks pages are kept out of search engines and the sitemap', () => {
  for (const metadata of [spanishThanks, englishThanks]) {
    assert.ok(metadata.title && metadata.description);
    assert.deepEqual(metadata.robots, { index: false, follow: true });
  }
  assert.ok(sitemap().every(entry => !/gracias|thanks/.test(entry.url)));
});

test('thanks page has a focusable heading, a way home and the compact chrome', () => {
  for (const [locale, home] of [['es', '/'], ['en', '/en']] as const) {
    const html = render(locale);
    assert.match(html, /<h1 id="thanks-title" tabindex="-1">/i);
    assert.match(html, /<main id="contenido"/);
    assert.match(html, new RegExp(`<a class="button" href="${home}">`));
    assert.match(html, /<header class="site-header site-header-minimal">/);
    assert.match(html, /<footer class="site-footer site-footer-compact container"/);
    assert.doesNotMatch(text(html), responseTime);
  }
  assert.doesNotMatch(render('en'), /Gracias|Volver al inicio|Recibimos/);
});

test('whatsapp only appears when a plausible number is configured', () => {
  const previous = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  try {
    delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    assert.doesNotMatch(render('es'), /wa\.me/);
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '+57 300 123 4567';
    assert.match(render('es'), /href="https:\/\/wa\.me\/573001234567\?text=/);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    else process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = previous;
  }
});

test('the form hands the lead to the thanks page instead of counting it in place', () => {
  const source = readFileSync(new URL('../app/components/contact-form.tsx', import.meta.url), 'utf8');
  assert.match(source, /markLead\(/);
  assert.match(source, /thanksUrl\(localePath\(locale, 'thanks'\)/);
  assert.doesNotMatch(source, /trackLead|contact-success/);
});
