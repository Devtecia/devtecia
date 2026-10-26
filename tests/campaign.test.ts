import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Tracking from '../app/components/tracking';
import { getDictionary } from '../app/i18n';
import { angleInterest, googleAdsSendTo, hasCampaignData, isGaId, isGoogleAdsId, isGoogleAdsLabel, isMetaPixelId, mergeAttribution, metaBrowserIds, parseAttribution, privacyUrl, readCookie, whatsappUrl } from '../lib/campaign';

test('parses campaign parameters, the angle and an external referrer', () => {
  const found = parseAttribution('?utm_source=meta&utm_medium=paid_social&utm_campaign=excel-oct&utm_content=video1&fbclid=AbC123&a=excel', 'https://l.instagram.com/', '/', 'www.devtecia.com');
  assert.deepEqual(found, { utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'excel-oct', utm_content: 'video1', fbclid: 'AbC123', angle: 'excel', referrer: 'https://l.instagram.com/', landing: '/' });
});

test('ignores unknown parameters, bad angles and the site’s own referrer', () => {
  const found = parseAttribution('?utm_source=x&foo=bar&a=hack&utm_medium=', 'https://www.devtecia.com/hablemos', '/en', 'www.devtecia.com');
  assert.deepEqual(found, { utm_source: 'x', landing: '/en' });
});

test('values are trimmed, stripped of control characters and capped', () => {
  const found = parseAttribution(`?utm_source=${encodeURIComponent('  a\r\nb  ')}&utm_campaign=${'z'.repeat(400)}`, '', '/', 'www.devtecia.com');
  assert.equal(found.utm_source, 'ab');
  assert.equal(found.utm_campaign?.length, 200);
});

test('a visit with campaign data replaces the stored one; a plain visit keeps it', () => {
  const stored = { utm_source: 'meta', utm_campaign: 'excel-oct', landing: '/', referrer: 'https://l.instagram.com/' };
  assert.equal(hasCampaignData({ landing: '/' }), false);
  assert.equal(hasCampaignData({ angle: 'tareas' }), true);
  assert.deepEqual(mergeAttribution(stored, { landing: '/hablemos' }), stored);
  assert.deepEqual(mergeAttribution(stored, { utm_source: 'google', landing: '/' }), { utm_source: 'google', landing: '/' });
  assert.deepEqual(mergeAttribution(undefined, { landing: '/' }), { landing: '/' });
});

test('each angle preselects an existing interest', () => {
  assert.equal(angleInterest('excel'), 'operations');
  assert.equal(angleInterest('tareas'), 'automation');
  assert.equal(angleInterest('medida'), 'other');
  assert.equal(angleInterest('nope'), undefined);
  assert.equal(angleInterest(undefined), undefined);
});

test('whatsapp link needs a plausible number and encodes the message', () => {
  assert.equal(whatsappUrl('+57 300 123 4567', 'Hola, quiero contarles mi caso.'), 'https://wa.me/573001234567?text=Hola%2C%20quiero%20contarles%20mi%20caso.');
  for (const bad of [undefined, '', 'abc', '123', '+57 300 123 4567 89012345', '57<script>']) assert.equal(whatsappUrl(bad, 'x'), '');
});

test('analytics ids and the privacy url are validated before use', () => {
  assert.equal(isMetaPixelId('123456789012345'), true);
  for (const bad of ['', '123', "1');alert(1);//", 'abc1234567890', undefined]) assert.equal(isMetaPixelId(bad), false);
  assert.equal(isGaId('G-ABC123XYZ9'), true);
  for (const bad of ['', 'UA-123', "G-X');alert(1)", 'G-', undefined]) assert.equal(isGaId(bad), false);
  assert.equal(privacyUrl('https://devtecia.com/privacidad'), 'https://devtecia.com/privacidad');
  assert.equal(privacyUrl('/privacidad'), '/privacidad');
  for (const bad of ['javascript:alert(1)', '//evil.test', 'http://x.test', '', undefined]) assert.equal(privacyUrl(bad), '');
});

test('tracking never puts a script or the banner in the server html, even with valid ids', () => {
  const copy = getDictionary('es').consent;
  for (const props of [{}, { metaPixelId: "1');alert(1);//", gaId: 'G-";alert(1)' }, { metaPixelId: '123456789012345', gaId: 'G-ABC123XYZ9' }]) {
    const html = renderToStaticMarkup(createElement(Tracking, { copy, ...props }));
    assert.equal(html, '');
  }
});

test('meta browser ids come from the _fbp and _fbc cookies, building fbc from fbclid when the cookie is missing', () => {
  const now = 1_700_000_000_000;
  assert.equal(readCookie('a=1; _fbp=fb.1.1690000000000.123456; _fbc=fb.1.1690000000000.AbC', '_fbp'), 'fb.1.1690000000000.123456');
  assert.equal(readCookie('x_fbp=nope', '_fbp'), '');
  assert.equal(readCookie('', '_fbc'), '');
  assert.deepEqual(metaBrowserIds('_fbp=fb.1.1690000000000.123456; _fbc=fb.1.1690000000000.AbC', '?fbclid=Other', undefined, now), { fbp: 'fb.1.1690000000000.123456', fbc: 'fb.1.1690000000000.AbC' });
  assert.deepEqual(metaBrowserIds('', '?fbclid=IwAR_x-1', undefined, now), { fbc: `fb.1.${now}.IwAR_x-1` });
  assert.deepEqual(metaBrowserIds('', '', 'Stored123', now), { fbc: `fb.1.${now}.Stored123` });
  assert.deepEqual(metaBrowserIds('', '?fbclid=%3Cscript%3E', undefined, now), {});
  assert.deepEqual(metaBrowserIds('', '', undefined, now), {});
});

test('google ads ids and conversion labels are validated before they reach gtag', () => {
  assert.equal(isGoogleAdsId('AW-123456789'), true);
  for (const bad of ['', 'AW-', 'AW-12345', 'aw-123456789', 'G-ABC123XYZ9', "AW-123456789');alert(1)//", 'AW-1234567890123456', undefined, 123456789]) assert.equal(isGoogleAdsId(bad), false, String(bad));
  assert.equal(isGoogleAdsLabel('AbC-D_efG-h12'), true);
  for (const bad of ['', 'short', 'a'.repeat(41), 'AbC/def123', 'AbC def123', "x');alert(1)", undefined]) assert.equal(isGoogleAdsLabel(bad), false, String(bad));
  assert.equal(googleAdsSendTo('AW-123456789', 'AbC-D_efG-h12'), 'AW-123456789/AbC-D_efG-h12');
  assert.equal(googleAdsSendTo('AW-123456789', ''), '');
  assert.equal(googleAdsSendTo('', 'AbC-D_efG-h12'), '');
  assert.equal(googleAdsSendTo('AW-123456789', 'bad label'), '');
});
