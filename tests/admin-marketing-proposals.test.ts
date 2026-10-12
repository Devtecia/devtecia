import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProposalWorkspace } from '../app/admin/(app)/marketing/proposal-workspace';
import { validateProposalContent } from '../lib/admin/marketing/proposal-content';
import { createGeminiProposalProvider } from '../lib/admin/marketing/gemini-provider';
import { createNextProposal, transitionProposal, type MarketingProposal, type ProposalGenerationContext, type ProposalRepository } from '../lib/admin/marketing/proposal-workflow';

const claim = (value: string) => ({ value, basis: 'hypothesis' as const });

function validProposal() {
  return {
    briefRecap: { factsUsed: ['Café de origen'], assumptionsUsed: [], missingInformation: ['Margen promedio'] },
    audienceInsight: {
      operationalProblem: claim('Baja demanda entre semana'),
      desiredOutcome: claim('Aumentar reservas'),
      likelyObjection: claim('No hay tiempo para contenido'),
      messageAngle: claim('Una pausa que vale la visita'),
    },
    positioning: {
      promise: claim('Una experiencia de café local'),
      supportingProof: [claim('Café tostado en la región')],
      wordingToAvoid: ['el mejor'],
    },
    campaignConcept: {
      goal: 'Aumentar visitas entre semana',
      targetAudience: 'Cafeterías independientes de Bogotá',
      coreMessage: claim('Haz de tu pausa un buen momento'),
      offerOrCta: claim('Reserva tu mesa'),
      channelRoles: [{ channel: 'instagram', role: 'Mostrar la experiencia' }],
      recommendedDurationWeeks: 4,
    },
    contentPlan: [1, 2, 3, 4].map(week => ({ week, purpose: 'Conectar', format: 'short_video', topic: `Tema ${week}`, hook: 'Una buena pausa', cta: 'Visítanos', requiredAsset: 'Video del local' })),
    creativeBriefs: ['short_video', 'carousel', 'static_or_story'].map(format => ({ format, concept: claim('Una historia de café local'), visualDirection: 'Luz natural en el local', onScreenText: 'Una pausa local', captionDraft: 'Conoce nuestra carta', productionChecklist: ['Confirmar fotografías'] })),
    paidPromotion: { objective: 'Visitas al local', audienceHypothesis: claim('Personas que viven cerca'), creativeToTest: ['Video de la carta'], budgetRange: null, humanChecklist: ['Definir presupuesto con el equipo'] },
    measurementPlan: { baselineNeeded: ['Visitas semanales'], reachIndicators: ['Alcance'], qualifiedInterestIndicators: ['Reservas'], reviewCadence: 'Semanal', metricDecisions: [{ metric: 'Reservas', decisionInformed: 'Ajustar el mensaje' }] },
    risksAndOpenQuestions: { unsupportedClaims: [], missingAssets: [], unclearTargeting: [], assumptionsToConfirm: ['Radio de cobertura'] },
  };
}

const scope = { clientId: 'client-a', brandId: 'brand-a', briefId: 'brief-a', audienceId: 'audience-a' };
const context: ProposalGenerationContext = { ...scope, client: { name: 'Café Aurora', website: 'https://aurora.example', summary: 'Café tostado local' }, brand: { name: 'Aurora', website: '', summary: '' }, audience: { segmentName: 'Cafeterías locales', geography: 'Bogotá', pains: ['Baja demanda entre semana'], objections: [], hypotheses: [] }, brief: { objective: 'Aumentar visitas', timeframe: 'Seis semanas', valueProposition: 'Café local', budgetRange: null, missingInformation: [] }, previousProposal: null, revisionFeedback: null };
type TestBudgetRange = { min: number; max: number; currency: string };
function proposalWithBudget(budgetRange: TestBudgetRange | null): unknown {
  const proposal = validProposal();
  return { ...proposal, paidPromotion: { ...proposal.paidPromotion, budgetRange } };
}

class MemoryProposalRepository implements ProposalRepository {
  latest: MarketingProposal | null = null;
  saved: MarketingProposal[] = [];
  context: ProposalGenerationContext = context;

  async loadContext() { return this.context; }
  async getLatest() { return this.latest; }
  async createVersion(input: Omit<MarketingProposal, 'id' | 'createdAt' | 'updatedAt' | 'submittedAt' | 'approvedAt' | 'approvedBy'>) {
    const proposal: MarketingProposal = { ...input, id: `proposal-${input.version}`, createdAt: '2026-10-12T00:00:00.000Z', updatedAt: '2026-10-12T00:00:00.000Z', submittedAt: null, approvedAt: null, approvedBy: null };
    this.saved.push(proposal);
    this.latest = proposal;
    return proposal;
  }
}

test('accepts the complete proposal schema and rejects missing required sections', () => {
  assert.equal(validateProposalContent(validProposal()).ok, true);
  const invalid = validProposal() as Record<string, unknown>;
  delete invalid.positioning;
  assert.equal(validateProposalContent(invalid).ok, false);
});

test('generates a validated first draft through an injected provider and saves version history', async () => {
  const repository = new MemoryProposalRepository();
  let providerCalls = 0;
  const result = await createNextProposal({
    repository,
    provider: { providerName: 'fake', modelId: 'fake-model', isAvailable: () => true, generate: async () => { providerCalls += 1; return validProposal(); } },
    scope,
    now: '2026-10-12T12:00:00.000Z',
  });
  if (!result.ok) throw new Error(`Expected proposal generation, got ${result.kind}.`);
  assert.equal(providerCalls, 1);
  assert.equal(repository.saved.length, 1);
  assert.equal(repository.saved[0].status, 'draft');
  assert.equal(repository.saved[0].version, 1);
});

test('missing credentials and invalid provider output persist no proposal', async () => {
  const missing = new MemoryProposalRepository();
  const unavailable = await createNextProposal({ repository: missing, provider: { providerName: 'fake', modelId: 'fake-model', isAvailable: () => false, generate: async () => validProposal() }, scope });
  assert.deepEqual(unavailable, { ok: false, kind: 'unavailable' });
  const invalid = await createNextProposal({ repository: missing, provider: { providerName: 'fake', modelId: 'fake-model', isAvailable: () => true, generate: async () => ({ invalid: true }) }, scope });
  assert.deepEqual(invalid, { ok: false, kind: 'invalid_output' });
  assert.equal(missing.saved.length, 0);
});

test('rejects a generated budget when the brief provides no budget or the amount exceeds its range', async () => {
  const noBudget = new MemoryProposalRepository();
  const withUnrequestedBudget = proposalWithBudget({ min: 100, max: 200, currency: 'COP' });
  const ungrounded = await createNextProposal({
    repository: noBudget,
    provider: { providerName: 'fake', modelId: 'fake-model', isAvailable: () => true, generate: async () => withUnrequestedBudget },
    scope,
  });
  assert.deepEqual(ungrounded, { ok: false, kind: 'invalid_output' });
  assert.equal(noBudget.saved.length, 0);

  const bounded = new MemoryProposalRepository();
  bounded.context = { ...context, brief: { ...context.brief, budgetRange: { min: 500, max: 1000, currency: 'COP' } } };
  const overBudget = proposalWithBudget({ min: 1000, max: 1200, currency: 'COP' });
  const outOfRange = await createNextProposal({
    repository: bounded,
    provider: { providerName: 'fake', modelId: 'fake-model', isAvailable: () => true, generate: async () => overBudget },
    scope,
  });
  assert.deepEqual(outOfRange, { ok: false, kind: 'invalid_output' });
  assert.equal(bounded.saved.length, 0);

  const withinRange = new MemoryProposalRepository();
  withinRange.context = { ...context, brief: { ...context.brief, budgetRange: { min: 500, max: 1000, currency: 'COP' } } };
  const grounded = proposalWithBudget({ min: 500, max: 900, currency: 'COP' });
  const accepted = await createNextProposal({
    repository: withinRange,
    provider: { providerName: 'fake', modelId: 'fake-model', isAvailable: () => true, generate: async () => grounded },
    scope,
  });
  assert.equal(accepted.ok, true);
  assert.equal(withinRange.saved.length, 1);
});

test('provides validated prior proposal content to the revision provider', async () => {
  const repository = new MemoryProposalRepository();
  const first = await createNextProposal({
    repository,
    provider: { providerName: 'fake', modelId: 'fake-model', isAvailable: () => true, generate: async () => validProposal() },
    scope,
  });
  if (!first.ok) throw new Error('Expected the first proposal version.');
  const submitted = transitionProposal(first.value, 'submit', { now: 't1', actorId: 'member-a' });
  if (!submitted.ok) throw new Error('Expected the proposal to submit.');
  const revision = transitionProposal(submitted.value, 'request_revision', { now: 't2', actorId: 'member-b', feedback: 'Mantén la promesa aprobada.' });
  if (!revision.ok) throw new Error('Expected the proposal to request revision.');
  repository.latest = revision.value;
  repository.context = { ...context, revisionFeedback: 'Mantén la promesa aprobada.' };
  const suppliedContext: { value: ProposalGenerationContext | null } = { value: null };
  const next = await createNextProposal({
    repository,
    provider: { providerName: 'fake', modelId: 'fake-model', isAvailable: () => true, generate: async (input) => { suppliedContext.value = input; return validProposal(); } },
    scope,
  });
  assert.equal(next.ok, true);
  assert.deepEqual(suppliedContext.value?.previousProposal, validateProposalContent(first.value.content).ok ? first.value.content : null);
  assert.equal(suppliedContext.value?.revisionFeedback, 'Mantén la promesa aprobada.');
});

test('enforces review transitions and creates an immutable next version after revision feedback', async () => {
  const created = await createNextProposal({ repository: new MemoryProposalRepository(), provider: { providerName: 'fake', modelId: 'fake-model', isAvailable: () => true, generate: async () => validProposal() }, scope });
  if (!created.ok) throw new Error(`Expected proposal generation, got ${created.kind}.`);
  const initial = created.value;
  assert.equal(transitionProposal(initial, 'approve', { now: 't1', actorId: 'member-a' }).ok, false);
  const submitted = transitionProposal(initial, 'submit', { now: 't1', actorId: 'member-a' });
  if (!submitted.ok) throw new Error('Expected the draft to submit.');
  const noFeedback = transitionProposal(submitted.value, 'request_revision', { now: 't2', actorId: 'member-b' });
  assert.deepEqual(noFeedback, { ok: false, kind: 'feedback_required' });
  const revision = transitionProposal(submitted.value, 'request_revision', { now: 't2', actorId: 'member-b', feedback: 'Aclarar el público principal' });
  if (!revision.ok) throw new Error(`Expected revision request, got ${revision.kind}.`);
  assert.equal(revision.value?.status, 'revision');
  const repository = new MemoryProposalRepository();
  repository.latest = revision.value!;
  const next = await createNextProposal({ repository, provider: { providerName: 'fake', modelId: 'fake-model', isAvailable: () => true, generate: async () => validProposal() }, scope, now: 't3' });
  if (!next.ok) throw new Error(`Expected revision generation, got ${next.kind}.`);
  assert.equal(next.value?.version, 2);
  assert.equal(next.value?.parentProposalId, initial.id);
  assert.equal(next.value?.status, 'draft');
  assert.equal(initial.status, 'draft');
});

test('calls the Gemini REST adapter only through an injected fetcher and keeps the key out of the URL', async () => {
  let calls = 0;
  let requestedUrl = '';
  let requestedHeaders = new Headers();
  let requestedBody: Record<string, unknown> = {};
  const provider = createGeminiProposalProvider({
    apiKey: 'fake-secret',
    model: 'models/test-model',
    fetcher: async (input, init) => {
      calls += 1;
      requestedUrl = String(input);
      requestedHeaders = new Headers(init?.headers);
      requestedBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(validProposal()) }] } }] }), { status: 200 });
    },
  });
  const result = await provider.generate(context);
  assert.equal(validateProposalContent(result).ok, true);
  assert.equal(calls, 1);
  assert.equal(requestedUrl, 'https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent');
  assert.equal(requestedUrl.includes('fake-secret'), false);
  assert.equal(requestedHeaders.get('x-goog-api-key'), 'fake-secret');
  assert.ok(((requestedBody.generationConfig as { responseFormat?: { text?: { mimeType?: string; schema?: unknown } } }).responseFormat)?.text?.schema);
  assert.equal(((requestedBody.generationConfig as { responseFormat: { text: { mimeType: string } } }).responseFormat).text.mimeType, 'application/json');
});

test('renders explicit privacy disclosure, unavailable state, proposal version and review history', () => {
  const html = renderToStaticMarkup(createElement(ProposalWorkspace, { scope, available: true, proposals: [], reviews: [], generateAction: async () => ({}), transitionAction: async () => ({}) }));
  assert.match(html, /se enviarán a Google Gemini/);
  assert.match(html, /Generar propuesta/);
  const unavailable = renderToStaticMarkup(createElement(ProposalWorkspace, { scope, available: false, proposals: [], reviews: [], generateAction: async () => ({}), transitionAction: async () => ({}) }));
  assert.match(unavailable, /no está disponible/);
});

test('renders malformed historical proposal content safely without exposing review controls', () => {
  const malformed = {
    id: 'proposal-broken', clientId: scope.clientId, brandId: scope.brandId, briefId: scope.briefId, audienceId: scope.audienceId,
    threadId: 'thread-a', version: 1, parentProposalId: null, parentVersion: null, status: 'draft', content: {}, sourceReferences: [],
    generation: { provider: 'legacy', model: 'legacy', generatedAt: '2026-10-12T00:00:00.000Z' }, createdAt: '2026-10-12T00:00:00.000Z',
    updatedAt: '2026-10-12T00:00:00.000Z', submittedAt: null, approvedAt: null, approvedBy: null,
  } as unknown as MarketingProposal;
  const html = renderToStaticMarkup(createElement(ProposalWorkspace, { scope, available: false, proposals: [malformed], reviews: [], generateAction: async () => ({}), transitionAction: async () => ({}) }));
  assert.match(html, /estructura incompleta/);
  assert.doesNotMatch(html, /Enviar a revisión/);
});

test('migration preserves shared active-member RLS, immutable review events and atomic scope checks', () => {
  const sql = readFileSync(new URL('../supabase/migrations/0004_marketing_proposals.sql', import.meta.url), 'utf8').toLowerCase();
  for (const table of ['marketing_proposal_threads', 'marketing_proposals', 'marketing_review_events']) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(sql, /for select to authenticated using \(public\.is_active_member\(\)\)/);
  }
  assert.match(sql, /unique \(client_id, brand_id, brief_id, thread_id, version\)/);
  assert.match(sql, /foreign key \(client_id, brand_id, audience_id\)\s+references public\.marketing_audiences/);
  assert.match(sql, /create or replace function public\.create_marketing_proposal_version/);
  assert.match(sql, /create or replace function public\.transition_marketing_proposal/);
  assert.match(sql, /p_audience_id uuid,[\s\S]*?where proposal\.id = p_proposal_id[\s\S]*?proposal\.audience_id = p_audience_id/);
  assert.match(sql, /v_actor uuid := auth\.uid\(\)/);
  assert.match(sql, /not public\.is_active_member\(\)/);
  assert.match(sql, /create or replace function public\.is_marketing_proposal_content_valid/);
  assert.match(sql, /if not public\.is_marketing_proposal_content_valid\(p_content\)/);
  assert.match(sql, /invalid_proposal_content/);
  assert.match(sql, /invalid_proposal_budget/);
  assert.match(sql, /v_proposal_budget->>'max'\)::numeric > \(v_brief_budget->>'max'\)::numeric/);
  assert.doesNotMatch(sql, /owner_id/);
});

test('server actions check active profiles and all scope IDs before generation or review transitions', () => {
  const actions = readFileSync(new URL('../app/admin/(app)/marketing/proposal-actions.ts', import.meta.url), 'utf8');
  assert.match(actions, /getAdminSession\(\)[\s\S]*?session\.status !== 'active'[\s\S]*?createClient\(\)/);
  assert.match(actions, /\.eq\('client_id', scope\.clientId\)[\s\S]*?\.eq\('brand_id', scope\.brandId\)[\s\S]*?\.eq\('audience_id', scope\.audienceId\)/);
  assert.match(actions, /\.eq\('audience_id', audienceId\)/);
  assert.match(actions, /transition_marketing_proposal/);
});

test('env example documents the server-only Gemini credentials and configurable model', () => {
  const example = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  assert.match(example, /GEMINI_API_KEY=/);
  assert.match(example, /GEMINI_MODEL=/);
  const adapter = readFileSync(new URL('../lib/admin/marketing/gemini-provider.ts', import.meta.url), 'utf8');
  assert.match(adapter, /x-goog-api-key/);
  assert.doesNotMatch(adapter, /NEXT_PUBLIC_GEMINI_API_KEY/);
});
