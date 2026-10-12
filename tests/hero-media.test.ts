import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldPlayHero } from '../app/components/hero-media';

test('motion preference must be resolved before loading or playing video', () => {
  assert.equal(shouldPlayHero(null, false), false);
  assert.equal(shouldPlayHero(true, false), false);
  assert.equal(shouldPlayHero(false, false), true);
});

test('manual pause always prevents automatic playback', () => {
  assert.equal(shouldPlayHero(false, true), false);
  assert.equal(shouldPlayHero(true, true), false);
  assert.equal(shouldPlayHero(null, true), false);
});

test('server markup provides a poster without video sources or autoplay', async () => {
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: HeroMedia } = await import('../app/components/hero-media');
  const markup = renderToStaticMarkup(createElement(HeroMedia));
  assert.match(markup, /poster="\/videos\/devtecia-hero-poster.jpg"/);
  assert.match(markup, /preload="none"/);
  assert.match(markup, /playsInline=""/i);
  assert.doesNotMatch(markup, /<source|autoplay/i);
  assert.doesNotMatch(markup, /<button/);
});
