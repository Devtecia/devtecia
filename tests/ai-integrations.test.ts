import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Services } from '../app/components/home-sections';

const markup = () => renderToStaticMarkup(createElement(Services));

test('services explicitly offer AI integrations backed by deployed receipt bots', () => {
  assert.match(markup(), /Integraciones, automatización e IA/);
  assert.match(markup(), /Ya hemos implementado integraciones con bots que leen recibos mediante IA/);
});

test('confidential evidence is an honestly labeled synthetic concept', () => {
  const html = markup();
  assert.match(html, /Por confidencialidad, mostramos una recreación ilustrativa del flujo/);
  assert.match(html, /<figure[^>]*aria-label="Flujo de lectura de un recibo con IA"/);
  assert.doesNotMatch(html, /Datos ficticios|<figcaption/);
  assert.match(html, /Recibo de ejemplo/);
  assert.match(html, /Bot de lectura con IA/);
  assert.match(html, /Datos estructurados/);
  assert.doesNotMatch(html, /WhatsApp|Telegram|OpenAI|ChatGPT|Gemini|ERP|99%|ahorra.*\d/i);
});

test('AI proof sits inside the AI service it supports, before the next service', () => {
  const html = markup();
  const aiService = html.indexOf('Menos transcripción. Más conexión.');
  const example = html.indexOf('De un recibo a información útil.');
  const nextService = html.indexOf('Claridad antes de construir.');
  assert.ok(aiService < example && example < nextService);
});

test('each extracted field is mapped back to its source on the receipt', () => {
  const html = markup();
  for (const field of ['proveedor', 'fecha', 'total']) {
    assert.match(html, new RegExp(`data-source="${field}"`));
    assert.match(html, new RegExp(`data-field="${field}"`));
  }
});

test('the looping flow exposes its phase timeline and travelling chips as decoration only', () => {
  const html = markup();
  assert.match(html, /<ol class="ai-flow-timeline" aria-hidden="true">/);
  for (const phase of ['Escanear', 'Detectar', 'Extraer', 'Listo']) assert.match(html, new RegExp(phase));
  assert.match(html, /<div class="ai-flow-chips" aria-hidden="true">/);
});
