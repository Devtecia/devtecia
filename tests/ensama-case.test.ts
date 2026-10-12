import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Cases, Hero } from '../app/components/home-sections';

test('Ensama replaces the concept with real compact storefront evidence', () => {
  const markup = renderToStaticMarkup(createElement(Cases));
  assert.match(markup, /ENSAMA · Ecommerce/);
  assert.match(markup, /src="\/ENSAMA-logo-editable\/ensama-logo-sin-lema\.svg"/);
  assert.match(markup, /alt="ENSAMA"/);
  assert.match(markup, /class="ensama-case-logo"/);
  assert.match(markup, /ensama-store\.png/);
  assert.match(markup, /href="https:\/\/www\.ensama\.store\/"/);
  assert.match(markup, /alt="Tienda ENSAMA con categorías de muebles y productos destacados"/);
  assert.match(markup, /href="\/images\/ensama-store\.png"/);
  assert.match(markup, /loading="lazy"/);
  assert.doesNotMatch(markup, /megaservices|megastore|Concepto de catálogo/i);
  assert.equal((markup.match(/class="case-card/g) || []).length, 2);
  assert.match(markup, /ventex-calendar\.png/);
  assert.match(markup, /ventex-dashboard\.png/);
  const image = readFileSync(new URL('../public/images/ensama-store.png', import.meta.url));
  assert.equal(image.subarray(1, 4).toString(), 'PNG');
  assert.equal(image.readUInt32BE(16), 2560);
  assert.equal(image.readUInt32BE(20), 2018);
});

test('hero proof names the current portfolio without changing Devtecia positioning', () => {
  const markup = renderToStaticMarkup(createElement(Hero));
  assert.match(markup, /Ventex y ENSAMA/);
  assert.match(markup, /Software a la medida/);
  assert.doesNotMatch(markup, /megaservices|megastore/i);
});
