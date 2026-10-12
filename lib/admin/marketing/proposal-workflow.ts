import { validateProposalContent, type MarketingProposalContent } from './proposal-content';

export type ProposalStatus = 'draft' | 'submitted' | 'approved' | 'revision' | 'archived';
export type ProposalAction = 'submit' | 'approve' | 'request_revision' | 'archive';
export type ProposalEventType = 'generated' | 'revision_generated' | 'submitted' | 'approved' | 'revision_requested' | 'archived';

export type ProposalScope = { clientId: string; brandId: string; briefId: string; audienceId: string };
export type ProposalGenerationContext = ProposalScope & {
  client: { name: string; website: string; summary: string };
  brand: { name: string; website: string; summary: string };
  audience: { segmentName: string; geography: string; pains: string[]; objections: string[]; hypotheses: string[] };
  brief: { objective: string; timeframe: string; valueProposition: string; budgetRange: { min: number; max: number; currency: string } | null; missingInformation: string[] };
  revisionFeedback: string | null;
};

export type MarketingProposal = ProposalScope & {
  id: string;
  threadId: string;
  version: number;
  parentProposalId: string | null;
  parentVersion: number | null;
  status: ProposalStatus;
  content: MarketingProposalContent;
  sourceReferences: string[];
  generation: { provider: string; model: string; generatedAt: string };
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
};

export type ProposalReviewEvent = {
  id: string;
  clientId: string;
  brandId: string;
  briefId: string;
  threadId: string;
  proposalId: string;
  version: number;
  eventType: ProposalEventType;
  previousStatus: ProposalStatus | null;
  nextStatus: ProposalStatus;
  actorId: string;
  feedback: string | null;
  createdAt: string;
};

export interface ProposalProvider {
  readonly providerName: string;
  readonly modelId: string;
  isAvailable(): boolean;
  generate(context: ProposalGenerationContext): Promise<unknown>;
}

export interface ProposalRepository {
  loadContext(scope: ProposalScope): Promise<ProposalGenerationContext | null>;
  getLatest(scope: ProposalScope): Promise<MarketingProposal | null>;
  createVersion(input: Omit<MarketingProposal, 'id' | 'threadId' | 'createdAt' | 'updatedAt' | 'submittedAt' | 'approvedAt' | 'approvedBy'>): Promise<MarketingProposal>;
}

export type GenerateProposalResult =
  | { ok: true; value: MarketingProposal }
  | { ok: false; kind: 'unavailable' | 'scope_not_found' | 'invalid_transition' | 'invalid_output' | 'provider_error'; message?: string };

function matchesScope(context: ProposalGenerationContext, scope: ProposalScope): boolean {
  return context.clientId === scope.clientId && context.brandId === scope.brandId && context.briefId === scope.briefId && context.audienceId === scope.audienceId;
}

export async function createNextProposal(input: {
  repository: ProposalRepository;
  provider: ProposalProvider;
  scope: ProposalScope;
  now?: string;
}): Promise<GenerateProposalResult> {
  if (!input.provider.isAvailable()) return { ok: false, kind: 'unavailable' };
  const context = await input.repository.loadContext(input.scope);
  if (!context || !matchesScope(context, input.scope)) return { ok: false, kind: 'scope_not_found' };
  const latest = await input.repository.getLatest(input.scope);
  if (latest && (latest.status !== 'approved' && latest.status !== 'revision')) return { ok: false, kind: 'invalid_transition' };

  let raw: unknown;
  try {
    raw = await input.provider.generate(context);
  } catch {
    return { ok: false, kind: 'provider_error' };
  }
  const validated = validateProposalContent(raw);
  if (!validated.ok) return { ok: false, kind: 'invalid_output' };
  const now = input.now ?? new Date().toISOString();
  try {
    const value = await input.repository.createVersion({
      ...input.scope,
      version: latest ? latest.version + 1 : 1,
      parentProposalId: latest?.id ?? null,
      parentVersion: latest?.version ?? null,
      status: 'draft',
      content: validated.value,
      sourceReferences: [],
      generation: { provider: input.provider.providerName, model: input.provider.modelId, generatedAt: now },
    });
    return { ok: true, value };
  } catch {
    return { ok: false, kind: 'provider_error' };
  }
}

export type TransitionResult =
  | { ok: true; value: MarketingProposal; event: Omit<ProposalReviewEvent, 'id' | 'createdAt'> }
  | { ok: false; kind: 'invalid_transition' | 'feedback_required' };

export function transitionProposal(proposal: MarketingProposal, action: ProposalAction, details: { now: string; actorId: string; feedback?: string }): TransitionResult {
  let status: ProposalStatus;
  let eventType: ProposalEventType;
  let feedback: string | null = null;
  if (action === 'submit' && proposal.status === 'draft') {
    status = 'submitted';
    eventType = 'submitted';
  } else if (action === 'approve' && proposal.status === 'submitted') {
    status = 'approved';
    eventType = 'approved';
  } else if (action === 'request_revision' && proposal.status === 'submitted') {
    feedback = details.feedback?.trim() ?? '';
    if (!feedback) return { ok: false, kind: 'feedback_required' };
    if (feedback.length > 3000) return { ok: false, kind: 'feedback_required' };
    status = 'revision';
    eventType = 'revision_requested';
  } else if (action === 'archive' && proposal.status !== 'archived') {
    status = 'archived';
    eventType = 'archived';
  } else {
    return { ok: false, kind: 'invalid_transition' };
  }

  const value: MarketingProposal = {
    ...proposal,
    status,
    updatedAt: details.now,
    submittedAt: action === 'submit' ? details.now : proposal.submittedAt,
    approvedAt: action === 'approve' ? details.now : proposal.approvedAt,
    approvedBy: action === 'approve' ? details.actorId : proposal.approvedBy,
  };
  return {
    ok: true,
    value,
    event: {
      clientId: proposal.clientId,
      brandId: proposal.brandId,
      briefId: proposal.briefId,
      threadId: proposal.threadId,
      proposalId: proposal.id,
      version: proposal.version,
      eventType,
      previousStatus: proposal.status,
      nextStatus: status,
      actorId: details.actorId,
      feedback,
    },
  };
}
