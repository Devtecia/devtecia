'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '../../../../lib/admin/session';
import { isMarketingRecordId } from '../../../../lib/admin/marketing/inputs';
import { getGeminiProposalProvider } from '../../../../lib/admin/marketing/gemini-provider';
import { createNextProposal, type MarketingProposal, type ProposalGenerationContext, type ProposalRepository, type ProposalScope, type ProposalStatus } from '../../../../lib/admin/marketing/proposal-workflow';
import { createClient } from '../../../../lib/supabase/server';
import type { ProposalActionState } from './proposal-workspace';

type ProposalRow = {
  id: string;
  client_id: string;
  brand_id: string;
  audience_id: string;
  brief_id: string;
  thread_id: string;
  version: number;
  parent_proposal_id: string | null;
  parent_version: number | null;
  status: ProposalStatus;
  content: MarketingProposal['content'];
  source_references: string[];
  generation: MarketingProposal['generation'];
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
};

const proposalColumns = 'id, client_id, brand_id, audience_id, brief_id, thread_id, version, parent_proposal_id, parent_version, status, content, source_references, generation, created_at, updated_at, submitted_at, approved_at, approved_by';
const activeSupabase = async () => {
  const session = await getAdminSession();
  if (session.status !== 'active') redirect('/admin/login');
  return await createClient();
};

function mapProposal(row: ProposalRow): MarketingProposal {
  return {
    id: row.id,
    clientId: row.client_id,
    brandId: row.brand_id,
    audienceId: row.audience_id,
    briefId: row.brief_id,
    threadId: row.thread_id,
    version: row.version,
    parentProposalId: row.parent_proposal_id,
    parentVersion: row.parent_version,
    status: row.status,
    content: row.content,
    sourceReferences: row.source_references ?? [],
    generation: row.generation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
  };
}

function proposalRepository(supabase: Awaited<ReturnType<typeof createClient>>): ProposalRepository {
  async function getLatest(scope: ProposalScope): Promise<MarketingProposal | null> {
    const { data, error } = await supabase.from('marketing_proposals').select(proposalColumns)
      .eq('client_id', scope.clientId).eq('brand_id', scope.brandId).eq('audience_id', scope.audienceId).eq('brief_id', scope.briefId)
      .order('version', { ascending: false }).limit(1).maybeSingle<ProposalRow>();
    if (error) throw new Error('Could not load proposal history.');
    return data ? mapProposal(data) : null;
  }

  return {
    async loadContext(scope) {
      const [clientResult, brandResult, audienceResult, briefResult] = await Promise.all([
        supabase.from('marketing_clients').select('id, name, website, summary').eq('id', scope.clientId).maybeSingle(),
        supabase.from('marketing_brands').select('id, client_id, name, website, summary').eq('id', scope.brandId).eq('client_id', scope.clientId).maybeSingle(),
        supabase.from('marketing_audiences').select('id, client_id, brand_id, segment_name, geography, pains, objections, hypotheses').eq('id', scope.audienceId).eq('client_id', scope.clientId).eq('brand_id', scope.brandId).maybeSingle(),
        supabase.from('marketing_campaign_briefs').select('id, client_id, brand_id, audience_id, objective, timeframe, value_proposition, budget_range, missing_information').eq('id', scope.briefId).eq('client_id', scope.clientId).eq('brand_id', scope.brandId).eq('audience_id', scope.audienceId).maybeSingle(),
      ]);
      if (clientResult.error || brandResult.error || audienceResult.error || briefResult.error) throw new Error('Could not load proposal inputs.');
      const client = clientResult.data;
      const brand = brandResult.data;
      const audience = audienceResult.data;
      const brief = briefResult.data;
      if (!client || !brand || !audience || !brief) return null;
      const latest = await getLatest(scope);
      let revisionFeedback: string | null = null;
      if (latest?.status === 'revision') {
        const { data: review, error } = await supabase.from('marketing_review_events').select('feedback')
          .eq('client_id', scope.clientId).eq('brand_id', scope.brandId).eq('brief_id', scope.briefId).eq('proposal_id', latest.id).eq('event_type', 'revision_requested')
          .order('created_at', { ascending: false }).limit(1).maybeSingle<{ feedback: string | null }>();
        if (error) throw new Error('Could not load review feedback.');
        revisionFeedback = review?.feedback ?? null;
      }
      return {
        ...scope,
        client: { name: client.name, website: client.website, summary: client.summary },
        brand: { name: brand.name, website: brand.website, summary: brand.summary },
        audience: { segmentName: audience.segment_name, geography: audience.geography, pains: audience.pains, objections: audience.objections, hypotheses: audience.hypotheses },
        brief: { objective: brief.objective, timeframe: brief.timeframe, valueProposition: brief.value_proposition, budgetRange: brief.budget_range, missingInformation: brief.missing_information },
        revisionFeedback,
      } satisfies ProposalGenerationContext;
    },
    getLatest,
    async createVersion(input) {
      const { data: proposalId, error: rpcError } = await supabase.rpc('create_marketing_proposal_version', {
        p_client_id: input.clientId,
        p_brand_id: input.brandId,
        p_audience_id: input.audienceId,
        p_brief_id: input.briefId,
        p_content: input.content,
        p_generation: input.generation,
      });
      if (rpcError || typeof proposalId !== 'string') throw new Error('Could not save the proposal.');
      const { data, error } = await supabase.from('marketing_proposals').select(proposalColumns).eq('id', proposalId)
        .eq('client_id', input.clientId).eq('brand_id', input.brandId).eq('audience_id', input.audienceId).eq('brief_id', input.briefId)
        .single<ProposalRow>();
      if (error || !data) throw new Error('Could not load the saved proposal.');
      return mapProposal(data);
    },
  };
}

function safeMessage(kind: string): string {
  if (kind === 'unavailable') return 'La generación no está disponible. Configura la clave de Gemini en el servidor.';
  if (kind === 'scope_not_found') return 'No encontramos este público y brief para la marca seleccionada.';
  if (kind === 'invalid_transition') return 'Genera una nueva versión solo después de solicitar cambios o aprobar la versión actual.';
  if (kind === 'invalid_output') return 'Gemini devolvió una propuesta incompleta. No se guardó ninguna versión.';
  return 'No pudimos generar la propuesta. Intenta de nuevo más tarde.';
}

export async function generateMarketingProposal(_previous: ProposalActionState, formData: FormData): Promise<ProposalActionState> {
  const clientId = formData.get('client_id');
  const brandId = formData.get('brand_id');
  const audienceId = formData.get('audience_id');
  const briefId = formData.get('brief_id');
  if (!isMarketingRecordId(clientId) || !isMarketingRecordId(brandId) || !isMarketingRecordId(audienceId) || !isMarketingRecordId(briefId)) {
    return { message: 'No encontramos el brief para esta marca.' };
  }
  const scope: ProposalScope = { clientId, brandId, audienceId, briefId };
  const supabase = await activeSupabase();
  const result = await createNextProposal({ repository: proposalRepository(supabase), provider: getGeminiProposalProvider(), scope });
  if (!result.ok) return { message: safeMessage(result.kind) };
  revalidatePath(`/admin/marketing/clients/${scope.clientId}`);
  return { message: `Se creó la versión ${result.value.version} como borrador.` };
}

export async function transitionMarketingProposal(_previous: ProposalActionState, formData: FormData): Promise<ProposalActionState> {
  const proposalId = formData.get('proposal_id');
  const clientId = formData.get('client_id');
  const brandId = formData.get('brand_id');
  const audienceId = formData.get('audience_id');
  const briefId = formData.get('brief_id');
  const action = formData.get('action');
  const feedback = String(formData.get('feedback') ?? '').trim();
  const actions = ['submit', 'approve', 'request_revision', 'archive'] as const;
  if (!isMarketingRecordId(proposalId) || !isMarketingRecordId(clientId) || !isMarketingRecordId(brandId) || !isMarketingRecordId(audienceId) || !isMarketingRecordId(briefId) || typeof action !== 'string' || !actions.includes(action as typeof actions[number])) {
    return { message: 'No pudimos validar el cambio de estado.' };
  }
  if (action === 'request_revision' && (!feedback || feedback.length > 3000)) return { message: 'Escribe comentarios de revisión de máximo 3000 caracteres.' };
  const supabase = await activeSupabase();
  const { data: proposal, error: lookupError } = await supabase.from('marketing_proposals').select('id, client_id, brand_id, audience_id, brief_id, status')
    .eq('id', proposalId).eq('client_id', clientId).eq('brand_id', brandId).eq('audience_id', audienceId).eq('brief_id', briefId)
    .maybeSingle<{ id: string; client_id: string; brand_id: string; audience_id: string; brief_id: string; status: ProposalStatus }>();
  if (lookupError || !proposal) return { message: 'No encontramos esta versión de propuesta.' };
  const { error } = await supabase.rpc('transition_marketing_proposal', {
    p_proposal_id: proposalId,
    p_client_id: clientId,
    p_brand_id: brandId,
    p_audience_id: audienceId,
    p_brief_id: briefId,
    p_action: action,
    p_feedback: action === 'request_revision' ? feedback : null,
  });
  if (error) return { message: 'Ese cambio no está permitido para el estado actual de la propuesta.' };
  revalidatePath(`/admin/marketing/clients/${clientId}`);
  return { message: 'El estado y el historial de revisión se actualizaron.' };
}
