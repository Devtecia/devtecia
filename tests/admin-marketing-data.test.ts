import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AdminSidebar from '../app/admin/(app)/admin-sidebar';
import { BrandForm, ClientForm, ClientList } from '../app/admin/(app)/marketing/marketing-forms';
import type { AdminProfile } from '../lib/admin/session-types';
import { parseBrandInput, parseClientInput } from '../lib/admin/marketing/inputs';

const profile: AdminProfile = { id: 'u1', name: 'Ana García', email: 'ana@example.com', initials: 'AG', color: '#B8F23D', role: 'member', active: true };
const signOut = async () => {};
const clientAction = async () => ({});
const brandAction = async () => ({});

test('normalizes and validates shared client details', () => {
  assert.deepEqual(parseClientInput({ name: '  Acme Studio  ', website: 'https://acme.example', summary: ' Equipo interno ' }), {
    ok: true,
    value: { name: 'Acme Studio', website: 'https://acme.example/', summary: 'Equipo interno' },
  });
  assert.equal(parseClientInput({ name: '  ', website: 'javascript:alert(1)' }).ok, false);
  assert.equal(parseClientInput({ name: 'x'.repeat(121) }).ok, false);
});

test('normalizes and validates brand details', () => {
  assert.deepEqual(parseBrandInput({ name: '  Marca Norte ', website: '' }), {
    ok: true,
    value: { name: 'Marca Norte', website: '', summary: '' },
  });
  assert.equal(parseBrandInput({ name: '', website: 'ftp://brand.example' }).ok, false);
  assert.equal(parseBrandInput({ name: 'Marca', summary: 'x'.repeat(1201) }).ok, false);
});

test('shows the Marketing navigation item to every active profile role', () => {
  const adminHtml = renderToStaticMarkup(createElement(AdminSidebar, { profile: { ...profile, role: 'admin' }, pathname: '/admin/marketing', signOut }));
  const memberHtml = renderToStaticMarkup(createElement(AdminSidebar, { profile, pathname: '/admin/marketing/clients/c1', signOut }));
  assert.match(adminHtml, /href="\/admin\/marketing"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/admin\/marketing"/);
  assert.match(adminHtml, />Marketing</);
  assert.match(memberHtml, /href="\/admin\/marketing"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/admin\/marketing"/);
});

test('provides a real client setup path and renders client records', () => {
  const empty = renderToStaticMarkup(createElement(ClientList, { clients: [] }));
  assert.match(empty, /Aún no hay clientes/);
  assert.match(empty, /href="#nuevo-cliente"/);
  const withClient = renderToStaticMarkup(createElement(ClientList, { clients: [{ id: 'c1', name: 'Acme Studio', website: 'https://acme.example/', summary: 'Brand partner' }] }));
  assert.match(withClient, /href="\/admin\/marketing\/clients\/c1"/);
  assert.match(withClient, /Acme Studio/);
});

test('renders labelled create and edit forms for clients and brands', () => {
  const createClient = renderToStaticMarkup(createElement(ClientForm, { action: clientAction }));
  const editClient = renderToStaticMarkup(createElement(ClientForm, { action: clientAction, client: { id: 'c1', name: 'Acme', website: '', summary: '' } }));
  const createBrand = renderToStaticMarkup(createElement(BrandForm, { action: brandAction, clientId: 'c1' }));
  const editBrand = renderToStaticMarkup(createElement(BrandForm, { action: brandAction, clientId: 'c1', brand: { id: 'b1', client_id: 'c1', name: 'Norte', website: '', summary: '' } }));
  assert.match(createClient, /Crear cliente/);
  assert.match(editClient, /Guardar cambios/);
  assert.match(createBrand, /Crear marca/);
  assert.match(editBrand, /Guardar cambios/);
  assert.match(createClient, /for="client-name"/);
  assert.match(createBrand, /for="brand-name-new"/);
});

test('migration uses shared active-member RLS for client and brand data', () => {
  const sql = readFileSync(new URL('../supabase/migrations/0002_admin_marketing.sql', import.meta.url), 'utf8').toLowerCase();
  for (const table of ['marketing_clients', 'marketing_brands']) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(sql, new RegExp(`for all to authenticated using \\(public\\.is_active_member\\(\\)\\) with check \\(public\\.is_active_member\\(\\)\\)`));
  }
  assert.match(sql, /grant select, insert, update on public\.marketing_clients, public\.marketing_brands to authenticated/);
  assert.match(sql, /references public\.marketing_clients\s*\(id\) on delete cascade/);
  assert.doesNotMatch(sql, /owner_id|auth\.uid\(\)\s*=/);
});
