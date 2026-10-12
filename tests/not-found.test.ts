import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import NotFoundPage, { notFoundMetadata as metadata } from '../app/components/not-found-page';

const html = () => renderToStaticMarkup(createElement(NotFoundPage));

test('global 404 is a full branded document in spanish with an english way out', () => {
  const markup = html();
  assert.match(markup, /^<html lang="es"/);
  assert.match(markup, /<body/);
  assert.match(markup, /devtecia-logo-grafito\.svg/);
  assert.match(markup, /404/);
  assert.match(markup, /<a[^>]*class="button"[^>]*href="\/"/);
  assert.match(markup, /href="\/hablemos"/);
  assert.match(markup, /<a[^>]*href="\/en"[^>]*hrefLang="en"/);
  assert.match(markup, /aria-hidden="true"[^>]*class="not-found-route"|class="not-found-route"[^>]*aria-hidden="true"/);
});

test('global 404 exposes its own metadata', () => {
  assert.equal(typeof metadata.title, 'string');
  assert.match(String(metadata.title), /404/);
});
