import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ContactPage from '../app/components/contact-page';
import { Closing } from '../app/components/home-sections';

const responseTime = /\b\d+\s*(h|horas|hours|día|días|day|days)\b/i;
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const render = (locale: 'es' | 'en') => renderToStaticMarkup(createElement(ContactPage, { locale }));

test('contact page header only offers the way back and the language', () => {
  for (const [locale, home, other, label] of [['es', '/', '/en/hablemos', 'Volver al inicio'], ['en', '/en', '/hablemos', 'Back to home']] as const) {
    const html = render(locale);
    const header = html.match(/<header class="site-header[^"]*">[\s\S]*?<\/header>/)?.[0] ?? '';
    assert.match(header, new RegExp(`<a class="contact-back" href="${home}">[\\s\\S]*?${label}</a>`));
    assert.match(header, new RegExp(`<a[^>]*href="${other}"[^>]*hrefLang`));
    assert.doesNotMatch(header, /#servicios|#proceso|#productos|#casos|menu-toggle|button-small|devtecia-logo/);
    assert.equal((html.match(/class="contact-back"/g) || []).length, 1);
  }
  const html = render('es');
  assert.match(html, /<main id="contenido"/);
  assert.match(html, /<footer class="site-footer site-footer-compact container"/);
  assert.doesNotMatch(html, /Inter/);
});

test('left column explains what happens next without a response time', () => {
  const html = render('es');
  assert.match(html, /Qué pasa después/);
  assert.equal((html.match(/data-contact-step=/g) || []).length, 3);
  for (const step of ['Nos cuentas qué necesitas', 'Te contactamos muy pronto', 'Recibes una propuesta clara']) assert.match(html, new RegExp(step));
  assert.match(html, /href="mailto:info@devtecia\.com"/);
  for (const locale of ['es', 'en'] as const) assert.doesNotMatch(text(render(locale)), responseTime);
});

test('interest is an accessible radio group with four options', () => {
  const html = render('es');
  assert.match(html, /<fieldset[^>]*>\s*<legend[^>]*>¿En qué te ayudamos\?/);
  const radios = html.match(/<input[^>]*type="radio"[^>]*>/g) || [];
  assert.equal(radios.length, 4);
  for (const radio of radios) assert.match(radio, /name="interest"/);
  for (const value of ['operations', 'automation', 'integrations', 'other']) assert.match(html, new RegExp(`value="${value}"`));
  for (const label of ['Ordenar mi operación', 'Automatizar tareas repetitivas', 'Integrar mis herramientas o IA', 'Otra necesidad']) assert.match(html, new RegExp(`>${label}<`));
});

test('english contact page is fully in english and links to english routes', () => {
  const html = render('en');
  assert.match(html, /What happens next/);
  assert.match(html, /What do you need help with\?/);
  for (const label of ['Organize my operation', 'Automate repetitive tasks', 'Connect my tools or AI', 'Something else']) assert.match(html, new RegExp(`>${label}<`));
  assert.match(html, /<a class="contact-back" href="\/en">/);
  assert.match(html, /<a[^>]*href="\/hablemos"[^>]*hrefLang="es"[^>]*>ES<\/a>/);
  assert.match(html, /<footer class="site-footer site-footer-compact container"/);
  assert.doesNotMatch(html, /Qué pasa después|Nos cuentas|Enviar consulta|Navegación principal/);
});

test('contact page never names Ventex or ENSAMA', () => {
  for (const locale of ['es', 'en'] as const) {
    const html = render(locale);
    assert.doesNotMatch(html, /Ventex|ENSAMA/i);
    // The compact footer drops the portfolio links (products, cases) the home footer keeps.
    assert.doesNotMatch(html.slice(html.indexOf('<footer')), /#(productos|casos)"|Productos|Products|Casos|Work</);
  }
});

test('home footer keeps in page anchors', () => {
  const html = renderToStaticMarkup(createElement(Closing));
  assert.match(html, /<a href="#servicios">Servicios<\/a>/);
  assert.match(html, /<a href="#contenido">/);
});


test('platform build animation shows its phases in each locale', () => {
  const es = render('es');
  assert.match(es, /class="platform-build"/);
  for (const phase of ['Diseñar', 'Construir', 'Conectar', 'Lanzar']) assert.match(es, new RegExp(`</span>${phase}</li>`));
  assert.match(es, /app\.tuempresa\.co/);
  const en = render('en');
  for (const phase of ['Design', 'Build', 'Connect', 'Launch']) assert.match(en, new RegExp(`</span>${phase}</li>`));
  assert.match(en, /app\.yourcompany\.com/);
  assert.doesNotMatch(en, /Diseñar|Publicado/);
});
