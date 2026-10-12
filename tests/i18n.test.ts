import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Closing, FAQ, Hero, Services } from '../app/components/home-sections';
import SiteHeader from '../app/components/site-header';
import TaglineReveal from '../app/components/tagline-reveal';
import { metadata as englishHome } from '../app/en/page';
import sitemap from '../app/sitemap';
import { rootMetadata } from '../app/i18n';

test('english services render english copy while keeping animation keys stable', () => {
  const html = renderToStaticMarkup(createElement(Services, { locale: 'en' }));
  assert.match(html, /Integrations, automation and AI/);
  assert.match(html, /aria-label="AI receipt reading flow"/);
  for (const phase of ['Scan', 'Detect', 'Extract', 'Ready']) assert.match(html, new RegExp(`</span>${phase}</li>`));
  for (const field of ['proveedor', 'fecha', 'total', 'moneda']) assert.match(html, new RegExp(`data-field="${field}"`));
  for (const field of ['proveedor', 'fecha', 'total']) {
    assert.match(html, new RegExp(`data-source="${field}"`));
    assert.match(html, new RegExp(`data-chip="${field}"`));
  }
  assert.match(html, />supplier<\/dt>/);
  assert.match(html, /COP/);
  assert.match(html, /href="\/en\/hablemos"/);
  assert.doesNotMatch(html, /Integraciones, automatización e IA|Escanear|Recibo de ejemplo/);
});

test('english hero, faq, closing and tagline point to english routes', () => {
  const hero = renderToStaticMarkup(createElement(Hero, { locale: 'en' }));
  assert.match(hero, /Software built around/);
  assert.match(hero, /href="\/en\/hablemos"/);
  assert.match(hero, /Ventex and ENSAMA/);
  assert.doesNotMatch(hero, /Software a la medida|Pausar|Estudio de software/);
  const faq = renderToStaticMarkup(createElement(FAQ, { locale: 'en' }));
  assert.match(faq, /Who owns the code\?/);
  const closing = renderToStaticMarkup(createElement(Closing, { locale: 'en' }));
  assert.match(closing, /href="\/en"/);
  assert.match(closing, /aria-label="Footer navigation"/);
  assert.doesNotMatch(closing, /href="\/hablemos"/);
  const tagline = renderToStaticMarkup(createElement(TaglineReveal, { locale: 'en' }));
  assert.match(tagline, />Clarity <\/span>.*>create\. <\/span>/);
});

test('spanish stays the default output', () => {
  for (const Component of [Hero, Services, FAQ, Closing]) {
    assert.equal(renderToStaticMarkup(createElement(Component)), renderToStaticMarkup(createElement(Component, { locale: 'es' })));
  }
  assert.match(renderToStaticMarkup(createElement(Hero)), /Software a la medida<br\/>de tu operación\./);
});

test('header language selector links to the equivalent page and marks the current locale', () => {
  const es = renderToStaticMarkup(createElement(SiteHeader));
  assert.match(es, /<nav[^>]*aria-label="Idioma"/);
  assert.match(es, /<a[^>]*href="\/"[^>]*aria-current="true"[^>]*>ES<\/a>|<a[^>]*aria-current="true"[^>]*href="\/"[^>]*>ES<\/a>/);
  assert.match(es, /<a[^>]*href="\/en"[^>]*hrefLang="en"[^>]*lang="en"[^>]*>EN<\/a>/);
  const en = renderToStaticMarkup(createElement(SiteHeader, { locale: 'en' }));
  assert.match(en, /<nav[^>]*aria-label="Language"/);
  assert.match(en, /<a[^>]*href="\/"[^>]*hrefLang="es"[^>]*lang="es"[^>]*>ES<\/a>/);
  assert.match(en, /<a[^>]*href="\/en"[^>]*aria-current="true"[^>]*>EN<\/a>/);
  assert.match(en, /href="\/en\/hablemos"/);
});

test('english home metadata declares hreflang alternates', () => {
  assert.equal(englishHome.alternates?.canonical, '/en');
  assert.deepEqual(englishHome.alternates?.languages, { es: '/', en: '/en', 'x-default': '/' });
  assert.equal((rootMetadata('en').openGraph as { locale?: string } | undefined)?.locale, 'en_US');
  assert.equal((rootMetadata('es').openGraph as { locale?: string } | undefined)?.locale, 'es_CO');
});

test('sitemap lists both locales with language alternates', () => {
  const entries = sitemap();
  assert.deepEqual(entries.map(entry => entry.url), [
    'https://www.devtecia.com',
    'https://www.devtecia.com/hablemos',
    'https://www.devtecia.com/en',
    'https://www.devtecia.com/en/hablemos',
  ]);
  for (const entry of entries) assert.ok(entry.alternates?.languages?.en && entry.alternates.languages.es);
});
