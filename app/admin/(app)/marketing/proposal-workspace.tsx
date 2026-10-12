'use client';

import { useActionState } from 'react';
import type { MarketingProposal, ProposalReviewEvent, ProposalScope, ProposalStatus } from '../../../../lib/admin/marketing/proposal-workflow';

export type ProposalActionState = { message?: string };
type FormAction = (state: ProposalActionState, formData: FormData) => Promise<ProposalActionState>;

const statusLabels: Record<ProposalStatus, string> = {
  draft: 'Borrador',
  submitted: 'En revisión',
  approved: 'Aprobada',
  revision: 'Cambios solicitados',
  archived: 'Archivada',
};

const eventLabels: Record<ProposalReviewEvent['eventType'], string> = {
  generated: 'Propuesta generada',
  revision_generated: 'Nueva versión generada',
  submitted: 'Enviada a revisión',
  approved: 'Aprobada',
  revision_requested: 'Cambios solicitados',
  archived: 'Archivada',
};

function ScopeFields({ scope }: { scope: ProposalScope }) {
  return <>
    <input type="hidden" name="client_id" value={scope.clientId} />
    <input type="hidden" name="brand_id" value={scope.brandId} />
    <input type="hidden" name="audience_id" value={scope.audienceId} />
    <input type="hidden" name="brief_id" value={scope.briefId} />
  </>;
}

function GenerateProposalForm({ scope, available, latest, action }: { scope: ProposalScope; available: boolean; latest?: MarketingProposal; action: FormAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  const canGenerate = !latest || latest.status === 'approved' || latest.status === 'revision';
  return (
    <section className="marketing-proposal-generate" aria-label="Generar propuesta">
      <p className="micro-label">Propuesta estratégica</p>
      <h4>Versiones de propuesta</h4>
      <p>La propuesta es un borrador para revisión del equipo. No publica contenido ni activa campañas.</p>
      {available ? <>
        <p className="marketing-privacy-notice">Al pulsar “Generar propuesta”, se enviarán a Google Gemini los datos del cliente, la marca, el público y el brief de campaña para elaborar una versión.</p>
        {!canGenerate ? <p className="marketing-meta">Para crear otra versión, primero solicita cambios o aprueba la versión actual.</p> : null}
        <form className="form-actions" action={formAction}>
          <ScopeFields scope={scope} />
          <button className="button button--primary" type="submit" disabled={pending || !canGenerate} aria-busy={pending}>{pending ? 'Generando…' : 'Generar propuesta'}</button>
        </form>
      </> : <p role="status" className="marketing-unavailable">La generación no está disponible. Configura GEMINI_API_KEY en el servidor para habilitarla. No se creará ninguna propuesta mientras falte la clave.</p>}
      {state.message ? <p role="status" className="form-message">{state.message}</p> : null}
    </section>
  );
}

function TransitionForm({ scope, proposal, actionName, label, action, needsFeedback = false }: {
  scope: ProposalScope;
  proposal: MarketingProposal;
  actionName: 'submit' | 'approve' | 'request_revision' | 'archive';
  label: string;
  action: FormAction;
  needsFeedback?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form className="marketing-proposal-action" action={formAction}>
      <ScopeFields scope={scope} />
      <input type="hidden" name="proposal_id" value={proposal.id} />
      <input type="hidden" name="action" value={actionName} />
      {needsFeedback ? <div className="field">
        <label htmlFor={`review-feedback-${proposal.id}`}>Comentarios para la siguiente versión</label>
        <textarea id={`review-feedback-${proposal.id}`} name="feedback" maxLength={3000} required rows={3} />
      </div> : null}
      <button className="button button--small" type="submit" disabled={pending} aria-busy={pending}>{pending ? 'Guardando…' : label}</button>
      {state.message ? <p role="status" className="form-message">{state.message}</p> : null}
    </form>
  );
}

function ProposalReviewControls({ scope, proposal, action }: { scope: ProposalScope; proposal: MarketingProposal; action: FormAction }) {
  return (
    <div className="marketing-proposal-actions" aria-label={`Acciones para la versión ${proposal.version}`}>
      {proposal.status === 'draft' ? <TransitionForm scope={scope} proposal={proposal} actionName="submit" label="Enviar a revisión" action={action} /> : null}
      {proposal.status === 'submitted' ? <>
        <TransitionForm scope={scope} proposal={proposal} actionName="approve" label="Aprobar versión" action={action} />
        <TransitionForm scope={scope} proposal={proposal} actionName="request_revision" label="Solicitar cambios" action={action} needsFeedback />
      </> : null}
      {proposal.status !== 'archived' ? <TransitionForm scope={scope} proposal={proposal} actionName="archive" label="Archivar versión" action={action} /> : null}
    </div>
  );
}

function ProposalCard({ proposal, scope, reviews, transitionAction }: { proposal: MarketingProposal; scope: ProposalScope; reviews: ProposalReviewEvent[]; transitionAction: FormAction }) {
  const entries = reviews.filter(review => review.proposalId === proposal.id);
  const content = proposal.content;
  return (
    <article className="marketing-proposal-card">
      <header className="marketing-proposal-head">
        <div>
          <p className="micro-label">Versión {proposal.version}</p>
          <h5>{content.campaignConcept.goal}</h5>
        </div>
        <span className={`marketing-status marketing-status--${proposal.status}`}>{statusLabels[proposal.status]}</span>
      </header>
      <p>{content.campaignConcept.coreMessage.value}</p>
      {proposal.parentVersion ? <p className="marketing-meta">Deriva de la versión {proposal.parentVersion}.</p> : null}
      <details className="marketing-proposal-details">
        <summary>Ver contenido de la propuesta</summary>
        <section>
          <h6>Audiencia y posicionamiento</h6>
          <p><strong>Público:</strong> {content.campaignConcept.targetAudience}</p>
          <p><strong>Promesa:</strong> {content.positioning.promise.value}</p>
          <p><strong>Problema:</strong> {content.audienceInsight.operationalProblem.value}</p>
        </section>
        <section>
          <h6>Plan de contenido</h6>
          <ul>{content.contentPlan.map((item, index) => <li key={`${item.week}-${index}`}><strong>Semana {item.week}:</strong> {item.topic} · {item.hook}</li>)}</ul>
        </section>
        <section>
          <h6>Briefs creativos</h6>
          <ul>{content.creativeBriefs.map((item, index) => <li key={`${item.format}-${index}`}>{item.format}: {item.concept.value}</li>)}</ul>
        </section>
        {content.briefRecap.missingInformation.length ? <section><h6>Información pendiente</h6><ul>{content.briefRecap.missingInformation.map((item, index) => <li key={index}>{item}</li>)}</ul></section> : null}
        {content.risksAndOpenQuestions.assumptionsToConfirm.length ? <section><h6>Supuestos para confirmar</h6><ul>{content.risksAndOpenQuestions.assumptionsToConfirm.map((item, index) => <li key={index}>{item}</li>)}</ul></section> : null}
      </details>
      <ProposalReviewControls scope={scope} proposal={proposal} action={transitionAction} />
      <section className="marketing-review-history" aria-label={`Historial de revisión de la versión ${proposal.version}`}>
        <h6>Historial de revisión</h6>
        {entries.length ? <ol>{entries.map(event => <li key={event.id}>
          <strong>{eventLabels[event.eventType]}</strong>
          <time dateTime={event.createdAt}>{event.createdAt.slice(0, 16).replace('T', ' ')}</time>
          {event.feedback ? <p>{event.feedback}</p> : null}
        </li>)}</ol> : <p className="marketing-meta">Todavía no hay acciones de revisión.</p>}
      </section>
    </article>
  );
}

export function ProposalWorkspace({ scope, available, proposals, reviews, generateAction, transitionAction }: {
  scope: ProposalScope;
  available: boolean;
  proposals: MarketingProposal[];
  reviews: ProposalReviewEvent[];
  generateAction: FormAction;
  transitionAction: FormAction;
}) {
  const latest = proposals[0];
  return (
    <section className="marketing-proposal-workspace" aria-label="Propuestas y revisión">
      <GenerateProposalForm scope={scope} available={available} latest={latest} action={generateAction} />
      {proposals.length ? <div className="marketing-proposal-list">{proposals.map(proposal => <ProposalCard key={proposal.id} proposal={proposal} scope={scope} reviews={reviews} transitionAction={transitionAction} />)}</div> : <p className="marketing-empty-inline">Aún no hay propuestas para este brief.</p>}
    </section>
  );
}
