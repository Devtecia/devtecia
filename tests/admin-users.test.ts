import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InviteForm from '../app/admin/(app)/users/invite-form';
import LoginForm from '../app/admin/login/login-form';
import { isValidInvitationEmail, inviteCallbackUrl, inviteTeamMember } from '../lib/admin/invitations';

const activeAdmin = { status: 'active' as const, profile: { role: 'admin' as const } };

test('validates email addresses without accepting malformed input', () => {
  assert.equal(isValidInvitationEmail('ana@example.com'), true);
  assert.equal(isValidInvitationEmail(' ana+dev@example.co '), true);
  for (const value of ['', 'ana@', 'ana example.com', 'ana@example', 'a'.repeat(250) + '@example.com']) {
    assert.equal(isValidInvitationEmail(value), false, value);
  }
});

test('rejects unauthorized requests before creating a service-role client', async () => {
  let called = false;
  const result = await inviteTeamMember({ status: 'active', profile: { role: 'member' } }, 'ana@example.com', '/auth/callback', () => {
    called = true;
    throw new Error('must not create admin client');
  });
  assert.deepEqual(result, { error: 'No tienes permiso para invitar integrantes.' });
  assert.equal(called, false);
});

test('rejects malformed addresses before creating a service-role client', async () => {
  let called = false;
  const result = await inviteTeamMember(activeAdmin, 'not-an-email', inviteCallbackUrl('https://devtecia.com'), () => {
    called = true;
    throw new Error('must not create admin client');
  });
  assert.match(result.error ?? '', /correo válido/);
  assert.equal(called, false);
});

test('sends invite links to the SSR callback with a fixed password setup destination', () => {
  assert.equal(inviteCallbackUrl('https://devtecia.com'), 'https://devtecia.com/auth/callback?next=%2Fadmin%2Flogin%3Fsetup%3Dinvite');
});

test('invites valid emails as members and uses the supplied callback URL', async () => {
  let received: unknown;
  const result = await inviteTeamMember(activeAdmin, ' ANA@example.com ', inviteCallbackUrl('https://devtecia.com'), () => ({
    auth: { admin: { inviteUserByEmail: async (...args: unknown[]) => { received = args; return { error: null }; } } },
  }));
  assert.deepEqual(result, { success: 'Enviamos la invitación a ana@example.com.' });
  assert.deepEqual(received, ['ana@example.com', { data: { role: 'member' }, redirectTo: 'https://devtecia.com/auth/callback?next=%2Fadmin%2Flogin%3Fsetup%3Dinvite' }]);
});

test('maps provider failures to safe Spanish copy without leaking details', async () => {
  const result = await inviteTeamMember(activeAdmin, 'ana@example.com', '/auth/callback', () => ({
    auth: { admin: { inviteUserByEmail: async () => ({ error: { message: 'secret provider detail' } }) } },
  }));
  assert.deepEqual(result, { error: 'No pudimos enviar la invitación. Verifica el correo e inténtalo de nuevo.', email: 'ana@example.com' });
  assert.doesNotMatch(JSON.stringify(result), /secret provider detail/);
});

test('renders an accessible Spanish invitation form and member team list', () => {
  const html = renderToStaticMarkup(createElement(InviteForm, { action: async () => ({}), members: [
    { id: '1', name: 'Ana Pérez', email: 'ana@example.com', role: 'member', status: 'active' },
    { id: '2', name: 'Luz Rojas', email: 'luz@example.com', role: 'member', status: 'pending' },
  ] }));
  assert.match(html, /Invitar a una persona/);
  assert.match(html, /<label[^>]*for="invite-email"[^>]*>Correo/);
  assert.match(html, /type="email"/);
  assert.match(html, /Ana Pérez/);
  assert.match(html, /Miembro/);
  assert.match(html, /Activo/);
  assert.match(html, /Invitación pendiente/);
  assert.doesNotMatch(html, /SUPABASE_SERVICE_ROLE_KEY/);
});

test('renders password setup only in invite mode', () => {
  const html = renderToStaticMarkup(createElement(LoginForm, { action: async () => ({}), next: '/admin', setupPassword: true }));
  assert.match(html, /Configura tu contraseña/);
  assert.match(html, /name="intent" value="invite-setup"/);
  assert.match(html, /name="password-confirmation"/);
  assert.match(html, /Guardar contraseña/);
});
