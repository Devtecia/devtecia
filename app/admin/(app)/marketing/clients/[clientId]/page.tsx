import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getAdminSession } from '../../../../../../lib/admin/session';
import { createClient } from '../../../../../../lib/supabase/server';
import Topbar from '../../../topbar';
import {
  createMarketingAudience,
  createMarketingBrand,
  createMarketingCampaignBrief,
  updateMarketingAudience,
  updateMarketingBrand,
  updateMarketingCampaignBrief,
  updateMarketingClient,
} from '../../actions';
import { generateMarketingProposal as generateProposalAction, transitionMarketingProposal as transitionProposalAction } from '../../proposal-actions';
import {
  AudienceForm,
  BrandForm,
  CampaignBriefForm,
  ClientForm,
  type MarketingAudience,
  type MarketingBrand,
  type MarketingCampaignBrief,
  type MarketingClient,
} from '../../marketing-forms';
import { ProposalWorkspace } from '../../proposal-workspace';
import type { MarketingProposal, ProposalReviewEvent } from '../../../../../../lib/admin/marketing/proposal-workflow';

export const metadata: Metadata = { title: 'Cliente · Marketing' };

type Params = Promise<{ clientId: string }>;

export default async function MarketingClientPage({ params }: { params: Params }) {
  const { clientId } = await params;
  const session = await getAdminSession();
  if (session.status !== 'active') redirect('/admin/login');

  const supabase = await createClient();
  const [{ data: client, error: clientError }, { data: brands, error: brandsError }] = await Promise.all([
    supabase.from('marketing_clients').select('id, name, website, summary').eq('id', clientId).maybeSingle<MarketingClient>(),
    supabase.from('marketing_brands').select('id, client_id, name, website, summary').eq('client_id', clientId).order('name', { ascending: true }).returns<MarketingBrand[]>(),
  ]);
  if (clientError || brandsError) throw new Error('Could not load Marketing client data.');
  if (!client) notFound();

  const brandIds = (brands ?? []).map((brand: MarketingBrand) => brand.id);
  const { data: audiences, error: audiencesError } = brandIds.length
    ? await supabase.from('marketing_audiences').select('id, client_id, brand_id, segment_name, geography, pains, objections, hypotheses').eq('client_id', clientId).in('brand_id', brandIds).order('segment_name', { ascending: true }).returns<MarketingAudience[]>()
    : { data: [] as MarketingAudience[], error: null };
  const audienceIds = (audiences ?? []).map((audience: MarketingAudience) => audience.id);
  const { data: briefs, error: briefsError } = audienceIds.length
    ? await supabase.from('marketing_campaign_briefs').select('id, client_id, brand_id, audience_id, objective, timeframe, value_proposition, budget_range, missing_information').eq('client_id', clientId).in('audience_id', audienceIds).returns<MarketingCampaignBrief[]>()
    : { data: [] as MarketingCampaignBrief[], error: null };
  if (audiencesError || briefsError) throw new Error('Could not load Marketing audience and brief data.');
  const briefsByAudience = new Map((briefs ?? []).map((brief: MarketingCampaignBrief) => [brief.audience_id, brief]));
  const { data: proposalRows, error: proposalsError } = (briefs ?? []).length
    ? await supabase.from('marketing_proposals').select('id, client_id, brand_id, audience_id, brief_id, thread_id, version, parent_proposal_id, parent_version, status, content, source_references, generation, created_at, updated_at, submitted_at, approved_at, approved_by').eq('client_id', clientId).order('version', { ascending: false }).returns<Array<{ id: string; client_id: string; brand_id: string; audience_id: string; brief_id: string; thread_id: string; version: number; parent_proposal_id: string | null; parent_version: number | null; status: MarketingProposal['status']; content: MarketingProposal['content']; source_references: string[]; generation: MarketingProposal['generation']; created_at: string; updated_at: string; submitted_at: string | null; approved_at: string | null; approved_by: string | null }>>()
    : { data: [] as Array<{ id: string; client_id: string; brand_id: string; audience_id: string; brief_id: string; thread_id: string; version: number; parent_proposal_id: string | null; parent_version: number | null; status: MarketingProposal['status']; content: MarketingProposal['content']; source_references: string[]; generation: MarketingProposal['generation']; created_at: string; updated_at: string; submitted_at: string | null; approved_at: string | null; approved_by: string | null }>, error: null };
  if (proposalsError) throw new Error('Could not load Marketing proposal history.');
  const proposalIds = (proposalRows ?? []).map(proposal => proposal.id);
  const { data: reviewRows, error: reviewsError } = proposalIds.length
    ? await supabase.from('marketing_review_events').select('id, client_id, brand_id, brief_id, thread_id, proposal_id, version, event_type, previous_status, next_status, actor_id, feedback, created_at').eq('client_id', clientId).in('proposal_id', proposalIds).order('created_at', { ascending: false }).returns<Array<{ id: string; client_id: string; brand_id: string; brief_id: string; thread_id: string; proposal_id: string; version: number; event_type: ProposalReviewEvent['eventType']; previous_status: ProposalReviewEvent['previousStatus']; next_status: ProposalReviewEvent['nextStatus']; actor_id: string; feedback: string | null; created_at: string }>>()
    : { data: [] as Array<{ id: string; client_id: string; brand_id: string; brief_id: string; thread_id: string; proposal_id: string; version: number; event_type: ProposalReviewEvent['eventType']; previous_status: ProposalReviewEvent['previousStatus']; next_status: ProposalReviewEvent['nextStatus']; actor_id: string; feedback: string | null; created_at: string }>, error: null };
  if (reviewsError) throw new Error('Could not load Marketing review history.');
  const proposals: MarketingProposal[] = (proposalRows ?? []).map(row => ({
    id: row.id, clientId: row.client_id, brandId: row.brand_id, audienceId: row.audience_id, briefId: row.brief_id,
    threadId: row.thread_id, version: row.version, parentProposalId: row.parent_proposal_id, parentVersion: row.parent_version,
    status: row.status, content: row.content, sourceReferences: row.source_references, generation: row.generation,
    createdAt: row.created_at, updatedAt: row.updated_at, submittedAt: row.submitted_at, approvedAt: row.approved_at, approvedBy: row.approved_by,
  }));
  const reviews: ProposalReviewEvent[] = (reviewRows ?? []).map(row => ({
    id: row.id, clientId: row.client_id, brandId: row.brand_id, briefId: row.brief_id, threadId: row.thread_id,
    proposalId: row.proposal_id, version: row.version, eventType: row.event_type, previousStatus: row.previous_status,
    nextStatus: row.next_status, actorId: row.actor_id, feedback: row.feedback, createdAt: row.created_at,
  }));

  return (
    <>
      <Topbar crumbs={[{ label: 'Marketing', href: '/admin/marketing' }, { label: client.name }]} />
      <main className="page marketing-page">
        <header className="page-head">
          <p className="micro-label">Cliente</p>
          <h1>{client.name}</h1>
          <p>Actualiza la información del cliente y administra sus marcas.</p>
        </header>
        <section className="marketing-detail-grid" aria-label="Información del cliente y marcas">
          <div className="marketing-create">
            <h2>Información del cliente</h2>
            <ClientForm action={updateMarketingClient} client={client} />
          </div>
          <div className="marketing-brands" id="marcas">
            <div className="page-head">
              <p className="micro-label">{brands?.length ?? 0} marcas</p>
              <h2>Marcas</h2>
              <p>Agrega las marcas que pertenecen a este cliente.</p>
            </div>
            {brands?.length ? (
              <div className="marketing-brand-list">
                {brands.map((brand: MarketingBrand) => {
                  const brandAudiences = (audiences ?? []).filter((audience: MarketingAudience) => audience.brand_id === brand.id);
                  return (
                    <article className="marketing-brand-card" key={brand.id}>
                      <BrandForm brand={brand} clientId={client.id} action={updateMarketingBrand} />
                      <section className="marketing-audiences" aria-label={`Públicos de ${brand.name}`}>
                        <div className="page-head">
                          <p className="micro-label">{brandAudiences.length} públicos</p>
                          <h3>Público y brief de campaña</h3>
                          <p>Define a quién se dirige la estrategia y la información que orientará sus campañas.</p>
                        </div>
                        {brandAudiences.map((audience: MarketingAudience) => {
                          const brief = briefsByAudience.get(audience.id);
                          return (
                            <div className="marketing-audience-card" key={audience.id}>
                              <div className="marketing-audience-grid">
                                <section className="marketing-create">
                                  <h4>Información del público</h4>
                                  <AudienceForm audience={audience} clientId={client.id} brandId={brand.id} action={updateMarketingAudience} />
                                </section>
                                <section className="marketing-create">
                                  <h4>Brief de campaña</h4>
                                  {brief
                                    ? <CampaignBriefForm brief={brief} clientId={client.id} brandId={brand.id} audienceId={audience.id} action={updateMarketingCampaignBrief} />
                                    : <CampaignBriefForm clientId={client.id} brandId={brand.id} audienceId={audience.id} action={createMarketingCampaignBrief} />}
                                  {brief ? <ProposalWorkspace
                                    scope={{ clientId: client.id, brandId: brand.id, audienceId: audience.id, briefId: brief.id }}
                                    available={Boolean(process.env.GEMINI_API_KEY?.trim())}
                                    proposals={proposals.filter(proposal => proposal.briefId === brief.id)}
                                    reviews={reviews.filter(review => review.briefId === brief.id)}
                                    generateAction={generateProposalAction}
                                    transitionAction={transitionProposalAction}
                                  /> : null}
                                </section>
                              </div>
                            </div>
                          );
                        })}
                        <section className="marketing-create">
                          <h4>Agregar un público</h4>
                          <AudienceForm clientId={client.id} brandId={brand.id} action={createMarketingAudience} />
                        </section>
                      </section>
                    </article>
                  );
                })}
              </div>
            ) : <p className="marketing-empty-inline">Este cliente todavía no tiene marcas.</p>}
            <section className="marketing-create" aria-labelledby="new-brand-title">
              <h3 id="new-brand-title">Agregar una marca</h3>
              <BrandForm clientId={client.id} action={createMarketingBrand} />
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
