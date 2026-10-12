import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Products, Cases } from '../app/components/home-sections';

test('product presents real inventory with demo disclosure and full-size access', () => {
  const markup = renderToStaticMarkup(createElement(Products));
  assert.match(markup, /ventex-inventory\.png/);
  assert.match(markup, /alt="Inventario de Ventex con filtros, tipos de producto y estados de stock"/);
  assert.match(markup, /Datos de demostración/);
  assert.match(markup, /href="\/images\/ventex-inventory\.png"/);
  assert.match(markup, /loading="lazy"/);
  assert.doesNotMatch(markup, /product-map|Vista conceptual|Contextos de la identidad/);
});

test('case presents calendar and dashboard alongside the real ecommerce evidence', () => {
  const markup = renderToStaticMarkup(createElement(Cases));
  for (const name of ['calendar', 'dashboard']) {
    assert.match(markup, new RegExp(`ventex-${name}\\.png`));
    assert.match(markup, new RegExp(`href="/images/ventex-${name}\\.png"`));
  }
  assert.match(markup, /alt="Calendario de Ventex/);
  assert.match(markup, /alt="Dashboard de Ventex/);
  assert.match(markup, /width="2560" height="2018"/);
  assert.match(markup, /ensama-store\.png/);
  assert.match(markup, /ensama\.store/);
  assert.doesNotMatch(markup, /case-art-ventex/);
});


test('Devtecia retains hierarchy through compact product and peer portfolio cards', () => {
  const product = renderToStaticMarkup(createElement(Products));
  const cases = renderToStaticMarkup(createElement(Cases));
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  assert.match(product, /product-card product-card-compact/);
  assert.equal((cases.match(/class="case-card/g) || []).length, 2);
  assert.doesNotMatch(cases, /ventex-case-intro|El producto se entiende/);
  assert.match(css, /\.case-grid \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});
