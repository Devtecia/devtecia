import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SiteFooter from '../app/components/site-footer';
import { getDictionary } from '../app/i18n';
import { CONSENT_KEY, consentPlatforms, consentText, hasTracking, injectTracking, parseConsent, readConsent, shouldLoadTracking, trackingIds, writeConsent } from '../lib/consent';

const memory = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  return { data, getItem: (key: string) => data[key] ?? null, setItem: (key: string, value: string) => { data[key] = value; } };
};
const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
const both = { meta: '123456789012345', ga: 'G-ABC123XYZ9', ads: '' };
const none = { meta: '', ga: '', ads: '' };

test('only the two known choices are accepted from storage', () => {
  assert.equal(parseConsent('granted'), 'granted');
  assert.equal(parseConsent('denied'), 'denied');
  for (const bad of [null, undefined, '', 'yes', 'GRANTED', ' granted', '{"granted":true}', 1]) assert.equal(parseConsent(bad), null);
});

test('reading and writing the choice fails closed when storage is missing or blocked', () => {
  assert.equal(readConsent(memory({ [CONSENT_KEY]: 'granted' })), 'granted');
  assert.equal(readConsent(memory({ [CONSENT_KEY]: 'tampered' })), null);
  assert.equal(readConsent(memory()), null);
  assert.equal(readConsent(broken), null);
  assert.equal(readConsent(undefined), null);
  const store = memory();
  assert.equal(writeConsent(store, 'granted'), true);
  assert.equal(writeConsent(store, 'denied'), true);
  assert.equal(store.data[CONSENT_KEY], 'denied');
  assert.equal(writeConsent(broken, 'granted'), false);
  assert.equal(writeConsent(undefined, 'granted'), false);
});

test('tracking loads only with an explicit acceptance and at least one valid id', () => {
  assert.equal(shouldLoadTracking('granted', both), true);
  assert.equal(shouldLoadTracking('granted', { ...none, ga: 'G-ABC123XYZ9' }), true);
  assert.equal(shouldLoadTracking('denied', both), false);
  assert.equal(shouldLoadTracking(null, both), false);
  assert.equal(shouldLoadTracking('granted', none), false);
  assert.deepEqual(trackingIds("1');alert(1);//", 'UA-123', "AW-1');x"), none);
  assert.deepEqual(trackingIds(both.meta, both.ga, ''), both);
});

test('accepting injects each configured tracker once with its id', () => {
  const scripts: { async: boolean; src: string }[] = [];
  const doc = { createElement: () => ({ async: false, src: '' }), head: { appendChild: (node: unknown) => scripts.push(node as { async: boolean; src: string }) } };
  const win: Parameters<typeof injectTracking>[1] = {};
  injectTracking(both, win, doc);
  injectTracking(both, win, doc);
  assert.deepEqual(scripts.map(s => s.src), ['https://connect.facebook.net/en_US/fbevents.js', 'https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ9']);
  assert.ok(scripts.every(s => s.async));
  assert.deepEqual(win.fbq?.queue, [['init', '123456789012345'], ['track', 'PageView']]);
  assert.deepEqual(win.dataLayer?.slice(1).map(entry => Array.from(entry as ArrayLike<unknown>)), [['config', 'G-ABC123XYZ9']]);

  const gaOnly: Parameters<typeof injectTracking>[1] = {};
  scripts.length = 0;
  injectTracking({ ...none, ga: both.ga }, gaOnly, doc);
  assert.equal(gaOnly.fbq, undefined);
  assert.equal(scripts.length, 1);
});

test('the footer offers the cookies control only when tracking is configured', () => {
  const previous = { meta: process.env.NEXT_PUBLIC_META_PIXEL_ID, ga: process.env.NEXT_PUBLIC_GA_ID, ads: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID };
  const restore = (key: 'NEXT_PUBLIC_META_PIXEL_ID' | 'NEXT_PUBLIC_GA_ID' | 'NEXT_PUBLIC_GOOGLE_ADS_ID', value: string | undefined) => { if (value === undefined) delete process.env[key]; else process.env[key] = value; };
  try {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    delete process.env.NEXT_PUBLIC_GA_ID;
    delete process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    assert.doesNotMatch(renderToStaticMarkup(createElement(SiteFooter)), />Cookies</);
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = 'AW-123456789';
    assert.match(renderToStaticMarkup(createElement(SiteFooter)), />Cookies<\/button>/, 'google ads alone is something to consent to');
    delete process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    process.env.NEXT_PUBLIC_META_PIXEL_ID = 'not-an-id';
    assert.doesNotMatch(renderToStaticMarkup(createElement(SiteFooter)), />Cookies</);
    process.env.NEXT_PUBLIC_META_PIXEL_ID = both.meta;
    for (const variant of ['full', 'compact'] as const) {
      assert.match(renderToStaticMarkup(createElement(SiteFooter, { variant })), /<button type="button" class="footer-link-button">Cookies<\/button>/);
    }
    assert.match(renderToStaticMarkup(createElement(SiteFooter, { locale: 'en' })), />Cookies<\/button>/);
  } finally {
    restore('NEXT_PUBLIC_META_PIXEL_ID', previous.meta);
    restore('NEXT_PUBLIC_GA_ID', previous.ga);
    restore('NEXT_PUBLIC_GOOGLE_ADS_ID', previous.ads);
  }
});

test('consent copy exists in both languages with equal-weight choices', () => {
  const es = getDictionary('es').consent;
  const en = getDictionary('en').consent;
  assert.deepEqual([es.accept, es.reject], ['Aceptar', 'Rechazar']);
  assert.deepEqual([en.accept, en.reject], ['Accept', 'Reject']);
  for (const copy of [es, en]) for (const value of Object.values(copy)) assert.ok(value.length > 0);
});

test('google ads alone counts as tracking and is loaded only after acceptance', () => {
  const adsOnly = { ...none, ads: 'AW-123456789' };
  assert.equal(hasTracking(adsOnly), true);
  assert.equal(shouldLoadTracking('granted', adsOnly), true);
  assert.equal(shouldLoadTracking('denied', adsOnly), false);
  assert.equal(shouldLoadTracking(null, adsOnly), false);
  assert.deepEqual(trackingIds('', '', 'AW-123456789'), adsOnly);
});

test('google ads shares one gtag.js with ga4 and each destination is configured once', () => {
  const scripts: { src: string }[] = [];
  const doc = { createElement: () => ({ async: false, src: '' }), head: { appendChild: (node: unknown) => scripts.push(node as { src: string }) } };
  const configs = (win: Parameters<typeof injectTracking>[1]) => (win.dataLayer ?? []).map(entry => Array.from(entry as ArrayLike<unknown>)).filter(args => args[0] === 'config');

  const adsOnly: Parameters<typeof injectTracking>[1] = {};
  injectTracking({ ...none, ads: 'AW-123456789' }, adsOnly, doc);
  injectTracking({ ...none, ads: 'AW-123456789' }, adsOnly, doc);
  assert.deepEqual(scripts.map(s => s.src), ['https://www.googletagmanager.com/gtag/js?id=AW-123456789']);
  assert.deepEqual(configs(adsOnly), [['config', 'AW-123456789']]);
  assert.equal(adsOnly.fbq, undefined);

  scripts.length = 0;
  const gaAndAds: Parameters<typeof injectTracking>[1] = {};
  injectTracking({ ...none, ga: 'G-ABC123XYZ9', ads: 'AW-123456789' }, gaAndAds, doc);
  injectTracking({ ...none, ga: 'G-ABC123XYZ9', ads: 'AW-123456789' }, gaAndAds, doc);
  assert.deepEqual(scripts.map(s => s.src), ['https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ9']);
  assert.deepEqual(configs(gaAndAds), [['config', 'G-ABC123XYZ9'], ['config', 'AW-123456789']]);
});

test('the consent text names only the platforms that are configured', () => {
  for (const locale of ['es', 'en'] as const) {
    const copy = getDictionary(locale).consent;
    assert.match(copy.text, /\{platforms\}/);
    const all = consentText(copy.text, { meta: '1234567890', ga: 'G-ABC123XYZ9', ads: 'AW-123456789' }, copy.and);
    assert.match(all, /Meta Pixel, Google Analytics (y|and) Google Ads/);
    assert.doesNotMatch(all, /\{platforms\}/);
    const adsOnly = consentText(copy.text, { ...none, ads: 'AW-123456789' }, copy.and);
    assert.match(adsOnly, /Google Ads/);
    assert.doesNotMatch(adsOnly, /Meta Pixel|Google Analytics/);
    assert.match(consentText(copy.text, { ...none, meta: '1234567890', ads: 'AW-123456789' }, copy.and), /Meta Pixel (y|and) Google Ads/);
  }
  assert.deepEqual(consentPlatforms(none), []);
});

test('consent copy keeps identical keys in both languages', () => {
  assert.deepEqual(Object.keys(getDictionary('es').consent).sort(), Object.keys(getDictionary('en').consent).sort());
});
