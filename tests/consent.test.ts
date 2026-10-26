import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SiteFooter from '../app/components/site-footer';
import { getDictionary } from '../app/i18n';
import { CONSENT_KEY, injectTracking, parseConsent, readConsent, shouldLoadTracking, trackingIds, writeConsent } from '../lib/consent';

const memory = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  return { data, getItem: (key: string) => data[key] ?? null, setItem: (key: string, value: string) => { data[key] = value; } };
};
const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
const both = { meta: '123456789012345', ga: 'G-ABC123XYZ9' };

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
  assert.equal(shouldLoadTracking('granted', { meta: '', ga: 'G-ABC123XYZ9' }), true);
  assert.equal(shouldLoadTracking('denied', both), false);
  assert.equal(shouldLoadTracking(null, both), false);
  assert.equal(shouldLoadTracking('granted', { meta: '', ga: '' }), false);
  assert.deepEqual(trackingIds("1');alert(1);//", 'UA-123'), { meta: '', ga: '' });
  assert.deepEqual(trackingIds(both.meta, both.ga), both);
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
  injectTracking({ meta: '', ga: both.ga }, gaOnly, doc);
  assert.equal(gaOnly.fbq, undefined);
  assert.equal(scripts.length, 1);
});

test('the footer offers the cookies control only when tracking is configured', () => {
  const previous = { meta: process.env.NEXT_PUBLIC_META_PIXEL_ID, ga: process.env.NEXT_PUBLIC_GA_ID };
  const restore = (key: 'NEXT_PUBLIC_META_PIXEL_ID' | 'NEXT_PUBLIC_GA_ID', value: string | undefined) => { if (value === undefined) delete process.env[key]; else process.env[key] = value; };
  try {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    delete process.env.NEXT_PUBLIC_GA_ID;
    assert.doesNotMatch(renderToStaticMarkup(createElement(SiteFooter)), />Cookies</);
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
  }
});

test('consent copy exists in both languages with equal-weight choices', () => {
  const es = getDictionary('es').consent;
  const en = getDictionary('en').consent;
  assert.deepEqual([es.accept, es.reject], ['Aceptar', 'Rechazar']);
  assert.deepEqual([en.accept, en.reject], ['Accept', 'Reject']);
  for (const copy of [es, en]) for (const value of Object.values(copy)) assert.ok(value.length > 0);
});
