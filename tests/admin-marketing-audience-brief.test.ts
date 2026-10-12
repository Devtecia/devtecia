import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AudienceForm, CampaignBriefForm } from '../app/admin/(app)/marketing/marketing-forms';
import { parseAudienceInput, parseCampaignBriefInput } from '../lib/admin/marketing/inputs';

const action = async () => ({});

test('normalizes audience details and bounded strategy lists', () => {
  assert.deepEqual(parseAudienceInput({
    segmentName: '  Cafeterías independientes ',
    geography: ' Bogotá, Colombia ',
    pains: ' Poco tráfico entre semana\nDependencia de domicilios ',
    objections: ' No tenemos tiempo para crear contenido ',
    hypotheses: 'Buscan diferenciar su carta\nValoran proveedores locales',
  }), {
    ok: true,
    value: {
      segmentName: 'Cafeterías independientes',
      geography: 'Bogotá, Colombia',
      pains: ['Poco tráfico entre semana', 'Dependencia de domicilios'],
      objections: ['No tenemos tiempo para crear contenido'],
      hypotheses: ['Buscan diferenciar su carta', 'Valoran proveedores locales'],
    },
  });
  assert.equal(parseAudienceInput({ segmentName: '', geography: 'Bogotá' }).ok, false);
  assert.equal(parseAudienceInput({ segmentName: 'Cafeterías', geography: 'Bogotá', pains: Array(13).fill('Necesidad').join('\n') }).ok, false);
  assert.equal(parseAudienceInput({ segmentName: 'Cafeterías', geography: 'Bogotá', hypotheses: 'x'.repeat(301) }).ok, false);
});

test('validates campaign brief fields and only accepts complete ordered budgets', () => {
  assert.deepEqual(parseCampaignBriefInput({
    objective: 'Aumentar reservas de lunes a jueves',
    timeframe: 'Durante las próximas seis semanas',
    valueProposition: 'Café de origen con panadería horneada cada mañana',
    budgetMin: '1200000',
    budgetMax: '2400000',
    currency: 'cop',
    missingInformation: 'Margen promedio por bebida\nCapacidad máxima por turno',
  }), {
    ok: true,
    value: {
      objective: 'Aumentar reservas de lunes a jueves',
      timeframe: 'Durante las próximas seis semanas',
      valueProposition: 'Café de origen con panadería horneada cada mañana',
      budgetRange: { min: 1200000, max: 2400000, currency: 'COP' },
      missingInformation: ['Margen promedio por bebida', 'Capacidad máxima por turno'],
    },
  });
  assert.equal(parseCampaignBriefInput({ objective: 'A', timeframe: 'B', valueProposition: 'C', budgetMin: '100', budgetMax: '', currency: '' }).ok, false);
  assert.equal(parseCampaignBriefInput({ objective: 'A', timeframe: 'B', valueProposition: 'C', budgetMin: '500', budgetMax: '100', currency: 'COP' }).ok, false);
  assert.equal(parseCampaignBriefInput({ objective: 'A', timeframe: 'B', valueProposition: 'C', budgetMin: '', budgetMax: '', currency: 'COP' }).ok, false);
  assert.equal(parseCampaignBriefInput({ objective: '', timeframe: 'B', valueProposition: 'C' }).ok, false);
  assert.equal(parseCampaignBriefInput({ objective: 'A', timeframe: 'B', valueProposition: 'C', missingInformation: Array(11).fill('Falta').join('\n') }).ok, false);
});

test('renders labelled audience and campaign brief edit forms', () => {
  const audience = renderToStaticMarkup(createElement(AudienceForm, { action, clientId: 'client-id', brandId: 'brand-id' }));
  const brief = renderToStaticMarkup(createElement(CampaignBriefForm, { action, clientId: 'client-id', brandId: 'brand-id', audienceId: 'audience-id' }));
  assert.match(audience, /Público objetivo/);
  assert.match(audience, /name="brand_id" value="brand-id"/);
  assert.match(audience, /name="pains"/);
  assert.match(brief, /Objetivo de campaña/);
  assert.match(brief, /name="audience_id" value="audience-id"/);
  assert.match(brief, /name="budgetMax"/);
});

test('persists audience and brief with shared active-member RLS and composite brand scope', () => {
  const sql = readFileSync(new URL('../supabase/migrations/0003_marketing_audiences_briefs.sql', import.meta.url), 'utf8').toLowerCase();
  for (const table of ['marketing_audiences', 'marketing_campaign_briefs']) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(sql, /for all to authenticated using \(public\.is_active_member\(\)\) with check \(public\.is_active_member\(\)\)/);
  }
  assert.match(sql, /foreign key \(client_id, brand_id\) references public\.marketing_brands \(client_id, id\)/);
  assert.match(sql, /foreign key \(client_id, brand_id, audience_id\)\s+references public\.marketing_audiences \(client_id, brand_id, id\)/);
  assert.match(sql, /unique \(client_id, brand_id, id\)/);
  assert.doesNotMatch(sql, /owner_id|auth\.uid\(\)\s*=/);
});

test('server mutations check active profile and reject cross-brand client scope', () => {
  const actions = readFileSync(new URL('../app/admin/(app)/marketing/actions.ts', import.meta.url), 'utf8');
  assert.match(actions, /async function activeSupabase\(\)[\s\S]*?getAdminSession\(\)[\s\S]*?session\.status !== 'active'[\s\S]*?createClient\(\)/);
  assert.match(actions, /marketing_brands'[\s\S]*?\.eq\('id', brandId\)[\s\S]*?\.eq\('client_id', clientId\)/);
  assert.match(actions, /marketing_audiences'[\s\S]*?\.eq\('id', audienceId\)[\s\S]*?\.eq\('client_id', clientId\)[\s\S]*?\.eq\('brand_id', brandId\)/);
  assert.match(actions, /marketing_campaign_briefs'[\s\S]*?\.eq\('audience_id', audienceId\)[\s\S]*?\.eq\('client_id', clientId\)[\s\S]*?\.eq\('brand_id', brandId\)/);
});
