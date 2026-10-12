import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AdminSidebar from '../app/admin/(app)/admin-sidebar';
import EmptyProjects from '../app/admin/(app)/empty-projects';
import type { AdminProfile } from '../lib/admin/session-types';

const profile = (role: AdminProfile['role']): AdminProfile => ({
  id: 'u1', name: 'Luis Grajales', email: 'luis@devtecia.com', initials: 'LG', color: '#B8F23D', role, active: true,
});
const projects = [
  { id: 'p1', key: 'WEB', name: 'Sitio web', color: '#7CCBFF', client: 'Devtecia', taskCount: 12 },
  { id: 'p2', key: 'OPS', name: 'Operaciones', color: '#F4C95D', client: '', taskCount: 0 },
];
const signOut = async () => {};
const sidebar = (role: AdminProfile['role'], pathname = '/admin/projects/WEB') =>
  renderToStaticMarkup(createElement(AdminSidebar, { profile: profile(role), projects, pathname, signOut }));

test('sidebar lists projects with key chips, counts and the current page', () => {
  const html = sidebar('member');
  assert.match(html, /Devtecia Admin/);
  assert.match(html, /<a[^>]*href="\/admin\/projects\/WEB"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/admin\/projects\/WEB"/);
  assert.match(html, />WEB</);
  assert.match(html, />12</);
  assert.match(html, /href="\/admin\/projects\/OPS"/);
  assert.doesNotMatch(html, /href="\/admin\/projects\/OPS"[^>]*aria-current/);
  assert.match(html, /href="\/admin\/projects\/new"/);
});

test('only admins see the users entry', () => {
  assert.doesNotMatch(sidebar('member'), /href="\/admin\/users"/);
  assert.match(sidebar('admin'), /href="\/admin\/users"[^>]*>[\s\S]*Usuarios/);
});

test('profile footer shows initials, name, role and a logout button', () => {
  const html = sidebar('admin');
  assert.match(html, />LG</);
  assert.match(html, /Luis Grajales/);
  assert.match(html, /Administrador/);
  assert.match(sidebar('member'), /Miembro/);
  assert.match(html, /<button[^>]*aria-label="Cerrar sesión"/);
});

test('empty state invites creating the first project with a real link', () => {
  const html = renderToStaticMarkup(createElement(EmptyProjects));
  assert.match(html, /Crea tu primer proyecto/);
  assert.match(html, /<a[^>]*href="\/admin\/projects\/new"/);
});
