import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HomePage from '../app/components/home-page';
import LeadSection from '../app/components/lead-section';

const responseTime = /\b\d+\s*(h|horas|hours|día|días|day|days)\b/i;
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const lead = (locale: 'es' | 'en') => renderToStaticMarkup(createElement(LeadSection, { locale }));
const home = (locale: 'es' | 'en') => renderToStaticMarkup(createElement(HomePage, { locale }));

test('the form sits in the page right after the three starting points and before the services', () => {
  for (const locale of ['es', 'en'] as const) {
    const html = home(locale);
    const at = (needle: string) => html.indexOf(needle);
    assert.ok(at('aria-labelledby="benefits-title"') > -1 && at('id="hablemos"') > -1 && at('id="servicios"') > -1);
    assert.ok(at('aria-labelledby="benefits-title"') < at('id="hablemos"'), `${locale}: form after benefits`);
    assert.ok(at('id="hablemos"') < at('id="servicios"'), `${locale}: form before services`);
    assert.equal((html.match(/id="hablemos"/g) || []).length, 1);
  }
});

test('every contact button on the home page jumps to that form', () => {
  for (const locale of ['es', 'en'] as const) {
    const html = home(locale);
    assert.ok((html.match(/href="#hablemos"/g) || []).length >= 5, 'header, hero, ai example, faq, closing');
    assert.doesNotMatch(html.replace(/<footer[\s\S]*<\/footer>/, ''), /href="\/(en\/)?hablemos"/);
  }
});

test('the form asks for little: name and email are the only required fields', () => {
  const html = lead('es');
  const required = (html.match(/<(?:input|textarea)[^>]*\srequired[^>]*>/g) || []).map(tag => tag.match(/name="(\w+)"/)?.[1]);
  assert.deepEqual(required.sort(), ['email', 'name']);
  assert.match(html, /<textarea[^>]*id="message"/);
  assert.doesNotMatch(html.match(/<textarea[^>]*>/)?.[0] ?? '', /required|minLength/);
  assert.match(html, /<input[^>]*id="phone"[^>]*type="tel"|<input[^>]*type="tel"[^>]*id="phone"/);
  assert.match(html, /WhatsApp o teléfono <span>\(opcional\)<\/span>/);
  assert.equal((html.match(/<input[^>]*type="radio"/g) || []).length, 4);
  assert.match(html, />Cuéntanos tu caso<\/button>/);
});

test('copy is localized and promises no response time', () => {
  for (const locale of ['es', 'en'] as const) {
    assert.doesNotMatch(text(lead(locale)), responseTime);
    assert.doesNotMatch(text(home(locale)), responseTime);
  }
  assert.match(lead('es'), /Cuéntanos dónde se te<br\/>enreda la operación\./);
  assert.match(lead('en'), /Tell us where your<br\/>operation gets tangled\./);
  assert.doesNotMatch(lead('en'), /Cuéntanos|Hablemos|Enviar|opcional/);
  assert.match(lead('en'), /Tell us your case/);
});

test('whatsapp button exists only with a plausible number and carries a prefilled message', () => {
  const previous = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  try {
    delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    assert.doesNotMatch(lead('es'), /wa\.me|WhatsApp<\/a>|lead-whatsapp/);
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = 'not a number';
    assert.doesNotMatch(lead('es'), /wa\.me/);
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '+57 300 123 4567';
    const html = lead('es');
    assert.match(html, /href="https:\/\/wa\.me\/573001234567\?text=Hola%2C%20quiero%20contarles%20mi%20caso\."/);
    assert.match(html, /rel="noopener noreferrer"/);
    assert.match(html, /Prefiero escribir por WhatsApp/);
    assert.match(html, /abre en una pestaña nueva/);
    assert.match(lead('en'), /I prefer to write on WhatsApp/);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER; else process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = previous;
  }
});

test('privacy link shows only for a safe url', () => {
  const previous = process.env.NEXT_PUBLIC_PRIVACY_URL;
  try {
    delete process.env.NEXT_PUBLIC_PRIVACY_URL;
    assert.doesNotMatch(lead('es'), /Política de tratamiento de datos/);
    process.env.NEXT_PUBLIC_PRIVACY_URL = 'javascript:alert(1)';
    assert.doesNotMatch(lead('es'), /Política de tratamiento de datos|javascript:/);
    process.env.NEXT_PUBLIC_PRIVACY_URL = 'https://www.devtecia.com/privacidad';
    assert.match(lead('es'), /<a class="text-link" href="https:\/\/www\.devtecia\.com\/privacidad">Política de tratamiento de datos<\/a>/);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_PRIVACY_URL; else process.env.NEXT_PUBLIC_PRIVACY_URL = previous;
  }
});

test('each starting point carries its campaign angle', () => {
  const html = home('es');
  for (const angle of ['excel', 'tareas', 'medida']) assert.match(html, new RegExp(`class="benefit-card"[^>]*data-angle="${angle}"`));
});
