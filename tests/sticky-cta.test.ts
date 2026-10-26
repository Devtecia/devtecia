import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HomePage from '../app/components/home-page';
import StickyCta from '../app/components/sticky-cta';
import { getDictionary } from '../app/i18n';
import { CONSENT_OPEN_ATTR } from '../lib/consent';
import { showStickyCta, STICKY_CTA_TARGET } from '../lib/sticky-cta';

const bar = (html: string) => html.match(/<div class="sticky-cta"[\s\S]*?<\/div>/)?.[0] ?? '';

test('the bar shows only when the hero cta and the form are out of view and the consent banner is closed', () => {
  assert.equal(showStickyCta({ heroInView: false, formInView: false, consentOpen: false }), true);
  for (const heroInView of [true, false]) for (const formInView of [true, false]) for (const consentOpen of [true, false]) {
    if (!heroInView && !formInView && !consentOpen) continue;
    assert.equal(showStickyCta({ heroInView, formInView, consentOpen }), false, JSON.stringify({ heroInView, formInView, consentOpen }));
  }
});

test('server html renders the bar hidden, as a real link to the form', () => {
  assert.equal(STICKY_CTA_TARGET, '#hablemos');
  const html = renderToStaticMarkup(createElement(StickyCta, { label: 'Hablemos de tu proyecto' }));
  assert.match(html, /^<div class="sticky-cta" hidden="">/);
  assert.match(html, /<a class="button" href="#hablemos">Hablemos de tu proyecto/);
});

test('both home pages carry the bar with the localized hero wording, once', () => {
  for (const locale of ['es', 'en'] as const) {
    const html = renderToStaticMarkup(createElement(HomePage, { locale }));
    assert.equal((html.match(/class="sticky-cta"/g) || []).length, 1, locale);
    const markup = bar(html);
    assert.match(markup, /hidden=""/);
    assert.ok(markup.includes(`href="#hablemos">${getDictionary(locale).hero.cta}`), `${locale}: ${markup}`);
  }
  assert.match(bar(renderToStaticMarkup(createElement(HomePage, { locale: 'en' }))), /Let’s talk about your project/);
});

test('the consent banner signals that it is open through one shared attribute', () => {
  assert.equal(CONSENT_OPEN_ATTR, 'data-consent-open');
});
