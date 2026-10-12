import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LoginForm from '../app/admin/login/login-form';
import { loginErrorMessage, validateLogin } from '../lib/admin/auth-messages';

const action = async () => ({});
const html = (props: Partial<Parameters<typeof LoginForm>[0]> = {}) =>
  renderToStaticMarkup(createElement(LoginForm, { action, next: '/admin/projects/WEB', ...props }));

test('login form renders labelled email and password fields with the brand', () => {
  const markup = html();
  assert.match(markup, /devtecia-logo-grafito\.svg/);
  assert.match(markup, /<label[^>]*for="admin-email"[^>]*>Correo/);
  assert.match(markup, /<input[^>]*type="email"[^>]*id="admin-email"|<input[^>]*id="admin-email"[^>]*type="email"/);
  assert.match(markup, /<input[^>]*type="password"/);
  assert.match(markup, /autoComplete="current-password"|autocomplete="current-password"/i);
  assert.match(markup, /<input[^>]*type="hidden"[^>]*name="next"[^>]*value="\/admin\/projects\/WEB"/);
  assert.match(markup, />Ingresar</);
  // React appends a form replay script; only the visible copy must avoid exclamation marks.
  assert.doesNotMatch(markup.replace(/<script[\s\S]*?<\/script>/g, ''), /!/);
});

test('login form never leaks configuration secrets', () => {
  const markup = html();
  assert.doesNotMatch(markup, /SUPABASE|service_role|eyJ/i);
});

test('login form shows a notice for deactivated accounts', () => {
  assert.match(html({ notice: 'inactive' }), /role="alert"[^>]*>[^<]*desactivada/);
});

test('validation messages are specific and calm', () => {
  assert.equal(validateLogin('', 'x'), 'Escribe tu correo.');
  assert.equal(validateLogin('ana@', 'x'), 'Escribe un correo válido, por ejemplo ana@devtecia.com.');
  assert.equal(validateLogin('ana@devtecia.com', ''), 'Escribe tu contraseña.');
  assert.equal(validateLogin('ana@devtecia.com', 'secret'), null);
});

test('supabase auth errors map to spanish messages without exclamation marks', () => {
  const invalid = loginErrorMessage({ code: 'invalid_credentials', status: 400 });
  assert.match(invalid, /correo o la contraseña no coinciden/);
  assert.match(loginErrorMessage({ status: 429 }), /Demasiados intentos/);
  assert.match(loginErrorMessage({}), /No pudimos iniciar sesión/);
  for (const message of [invalid, loginErrorMessage({ status: 429 }), loginErrorMessage({})]) assert.doesNotMatch(message, /!/);
});
