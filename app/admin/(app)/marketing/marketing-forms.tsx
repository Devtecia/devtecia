'use client';

import { useActionState } from 'react';

export type MarketingFormState = {
  errors?: Record<string, string>;
  message?: string;
  values?: Record<string, string>;
};

export type MarketingClient = { id: string; name: string; website: string; summary: string };
export type MarketingBrand = { id: string; client_id: string; name: string; website: string; summary: string };
export type MarketingAudience = {
  id: string;
  client_id: string;
  brand_id: string;
  segment_name: string;
  geography: string;
  pains: string[];
  objections: string[];
  hypotheses: string[];
};
export type MarketingCampaignBrief = {
  id: string;
  client_id: string;
  brand_id: string;
  audience_id: string;
  objective: string;
  timeframe: string;
  value_proposition: string;
  budget_range: { min: number; max: number; currency: string } | null;
  missing_information: string[];
};
type MarketingAction = (state: MarketingFormState, formData: FormData) => Promise<MarketingFormState>;

export function ClientList({ clients }: { clients: MarketingClient[] }) {
  if (!clients.length) {
    return (
      <section className="marketing-empty" aria-labelledby="marketing-empty-title">
        <p className="micro-label">Clientes</p>
        <h2 id="marketing-empty-title">Aún no hay clientes</h2>
        <p>Registra el primer cliente para empezar a organizar sus marcas y estrategia.</p>
        <a className="button button--primary" href="#nuevo-cliente">Crear primer cliente</a>
      </section>
    );
  }

  return (
    <ul className="marketing-client-list">
      {clients.map(client => (
        <li className="panel marketing-client-card" key={client.id}>
          <div>
            <p className="micro-label">Cliente</p>
            <h2><a href={`/admin/marketing/clients/${client.id}`}>{client.name}</a></h2>
            {client.website ? <p className="marketing-meta">{client.website}</p> : null}
            {client.summary ? <p>{client.summary}</p> : null}
          </div>
          <a className="button button--small" href={`/admin/marketing/clients/${client.id}`}>Ver marcas</a>
        </li>
      ))}
    </ul>
  );
}

export function ClientForm({ action, client }: { action: MarketingAction; client?: MarketingClient }) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.errors ?? {};
  return (
    <form className="panel form-grid marketing-form" action={formAction} id={client ? undefined : 'nuevo-cliente'}>
      {client ? <input type="hidden" name="id" value={client.id} /> : null}
      <div className="field">
        <label htmlFor="client-name">Nombre del cliente</label>
        <input id="client-name" name="name" maxLength={120} required defaultValue={state.values?.name ?? client?.name} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? 'client-name-error' : undefined} />
        {errors.name ? <p className="field-error" id="client-name-error">{errors.name}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="client-website">Sitio web</label>
        <input id="client-website" name="website" type="url" maxLength={2048} placeholder="https://ejemplo.com" defaultValue={state.values?.website ?? client?.website} aria-invalid={errors.website ? true : undefined} aria-describedby={errors.website ? 'client-website-error' : undefined} />
        {errors.website ? <p className="field-error" id="client-website-error">{errors.website}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="client-summary">Descripción</label>
        <textarea id="client-summary" name="summary" maxLength={1200} rows={4} defaultValue={state.values?.summary ?? client?.summary} aria-invalid={errors.summary ? true : undefined} aria-describedby={errors.summary ? 'client-summary-error' : undefined} />
        {errors.summary ? <p className="field-error" id="client-summary-error">{errors.summary}</p> : null}
      </div>
      {state.message ? <p role="alert" className="form-message form-message--error">{state.message}</p> : null}
      <div className="form-actions">
        <button className="button button--primary" type="submit" disabled={pending} aria-busy={pending}>
          {pending ? 'Guardando…' : client ? 'Guardar cambios' : 'Crear cliente'}
        </button>
      </div>
    </form>
  );
}

export function BrandForm({ action, clientId, brand }: { action: MarketingAction; clientId: string; brand?: MarketingBrand }) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.errors ?? {};
  const suffix = brand ? `-${brand.id}` : '-new';
  const nameId = `brand-name${suffix}`;
  const websiteId = `brand-website${suffix}`;
  const summaryId = `brand-summary${suffix}`;
  return (
    <form className="panel form-grid marketing-form" action={formAction}>
      <input type="hidden" name="client_id" value={clientId} />
      {brand ? <input type="hidden" name="id" value={brand.id} /> : null}
      <div className="field">
        <label htmlFor={nameId}>Nombre de la marca</label>
        <input id={nameId} name="name" maxLength={120} required defaultValue={state.values?.name ?? brand?.name} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? `${nameId}-error` : undefined} />
        {errors.name ? <p className="field-error" id={`${nameId}-error`}>{errors.name}</p> : null}
      </div>
      <div className="field">
        <label htmlFor={websiteId}>Sitio web</label>
        <input id={websiteId} name="website" type="url" maxLength={2048} placeholder="https://ejemplo.com" defaultValue={state.values?.website ?? brand?.website} aria-invalid={errors.website ? true : undefined} aria-describedby={errors.website ? `${websiteId}-error` : undefined} />
        {errors.website ? <p className="field-error" id={`${websiteId}-error`}>{errors.website}</p> : null}
      </div>
      <div className="field">
        <label htmlFor={summaryId}>Descripción</label>
        <textarea id={summaryId} name="summary" maxLength={1200} rows={3} defaultValue={state.values?.summary ?? brand?.summary} aria-invalid={errors.summary ? true : undefined} aria-describedby={errors.summary ? `${summaryId}-error` : undefined} />
        {errors.summary ? <p className="field-error" id={`${summaryId}-error`}>{errors.summary}</p> : null}
      </div>
      {state.message ? <p role="alert" className="form-message form-message--error">{state.message}</p> : null}
      <div className="form-actions">
        <button className="button button--primary" type="submit" disabled={pending} aria-busy={pending}>
          {pending ? 'Guardando…' : brand ? 'Guardar cambios' : 'Crear marca'}
        </button>
      </div>
    </form>
  );
}

export function AudienceForm({ action, clientId, brandId, audience }: { action: MarketingAction; clientId: string; brandId: string; audience?: MarketingAudience }) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.errors ?? {};
  const suffix = audience ? `-${audience.id}` : `-${brandId}-new`;
  const fieldId = (name: string) => `audience-${name}${suffix}`;
  const initial = (name: string, value: string) => state.values?.[name] ?? value;
  return (
    <form className="panel form-grid marketing-form" action={formAction}>
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="brand_id" value={brandId} />
      {audience ? <input type="hidden" name="id" value={audience.id} /> : null}
      <div className="field">
        <label htmlFor={fieldId('segmentName')}>Público objetivo</label>
        <input id={fieldId('segmentName')} name="segmentName" maxLength={120} required defaultValue={initial('segmentName', audience?.segment_name ?? '')} aria-invalid={errors.segmentName ? true : undefined} aria-describedby={errors.segmentName ? `${fieldId('segmentName')}-error` : undefined} />
        {errors.segmentName ? <p className="field-error" id={`${fieldId('segmentName')}-error`}>{errors.segmentName}</p> : null}
      </div>
      <div className="field">
        <label htmlFor={fieldId('geography')}>Ubicación</label>
        <input id={fieldId('geography')} name="geography" maxLength={180} required defaultValue={initial('geography', audience?.geography ?? '')} aria-invalid={errors.geography ? true : undefined} aria-describedby={errors.geography ? `${fieldId('geography')}-error` : undefined} />
        {errors.geography ? <p className="field-error" id={`${fieldId('geography')}-error`}>{errors.geography}</p> : null}
      </div>
      {([
        ['pains', 'Necesidades', audience?.pains],
        ['objections', 'Objeciones', audience?.objections],
        ['hypotheses', 'Hipótesis', audience?.hypotheses],
      ] as const).map(([name, label, values]) => (
        <div className="field" key={name}>
          <label htmlFor={fieldId(name)}>{label}</label>
          <textarea id={fieldId(name)} name={name} maxLength={3611} rows={3} defaultValue={initial(name, values?.join('\n') ?? '')} aria-invalid={errors[name] ? true : undefined} aria-describedby={errors[name] ? `${fieldId(name)}-error` : undefined} />
          <p className="marketing-meta">Un elemento por línea, hasta 12 elementos y 300 caracteres por elemento.</p>
          {errors[name] ? <p className="field-error" id={`${fieldId(name)}-error`}>{errors[name]}</p> : null}
        </div>
      ))}
      {state.message ? <p role="alert" className="form-message form-message--error">{state.message}</p> : null}
      <div className="form-actions">
        <button className="button button--primary" type="submit" disabled={pending} aria-busy={pending}>{pending ? 'Guardando…' : audience ? 'Guardar público' : 'Crear público'}</button>
      </div>
    </form>
  );
}

export function CampaignBriefForm({ action, clientId, brandId, audienceId, brief }: { action: MarketingAction; clientId: string; brandId: string; audienceId: string; brief?: MarketingCampaignBrief }) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.errors ?? {};
  const suffix = `-${audienceId}`;
  const fieldId = (name: string) => `brief-${name}${suffix}`;
  const initial = (name: string, value: string) => state.values?.[name] ?? value;
  return (
    <form className="panel form-grid marketing-form" action={formAction}>
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="brand_id" value={brandId} />
      <input type="hidden" name="audience_id" value={audienceId} />
      {brief ? <input type="hidden" name="id" value={brief.id} /> : null}
      {([
        ['objective', 'Objetivo de campaña', brief?.objective ?? ''],
        ['timeframe', 'Periodo de campaña', brief?.timeframe ?? ''],
        ['valueProposition', 'Propuesta de valor', brief?.value_proposition ?? ''],
      ] as const).map(([name, label, value]) => (
        <div className="field" key={name}>
          <label htmlFor={fieldId(name)}>{label}</label>
          <textarea id={fieldId(name)} name={name} maxLength={2000} rows={3} required defaultValue={initial(name, value)} aria-invalid={errors[name] ? true : undefined} aria-describedby={errors[name] ? `${fieldId(name)}-error` : undefined} />
          {errors[name] ? <p className="field-error" id={`${fieldId(name)}-error`}>{errors[name]}</p> : null}
        </div>
      ))}
      <fieldset className="marketing-budget">
        <legend>Presupuesto opcional</legend>
        <div className="marketing-budget-grid">
          <div className="field">
            <label htmlFor={fieldId('budgetMin')}>Mínimo</label>
            <input id={fieldId('budgetMin')} name="budgetMin" type="number" min={1} max={1000000000} step={1} defaultValue={initial('budgetMin', brief?.budget_range?.min.toString() ?? '')} aria-invalid={errors.budgetMin ? true : undefined} aria-describedby={errors.budgetMin ? `${fieldId('budgetMin')}-error` : undefined} />
            {errors.budgetMin ? <p className="field-error" id={`${fieldId('budgetMin')}-error`}>{errors.budgetMin}</p> : null}
          </div>
          <div className="field">
            <label htmlFor={fieldId('budgetMax')}>Máximo</label>
            <input id={fieldId('budgetMax')} name="budgetMax" type="number" min={1} max={1000000000} step={1} defaultValue={initial('budgetMax', brief?.budget_range?.max.toString() ?? '')} aria-invalid={errors.budgetMax ? true : undefined} aria-describedby={errors.budgetMax ? `${fieldId('budgetMax')}-error` : undefined} />
            {errors.budgetMax ? <p className="field-error" id={`${fieldId('budgetMax')}-error`}>{errors.budgetMax}</p> : null}
          </div>
          <div className="field">
            <label htmlFor={fieldId('currency')}>Moneda</label>
            <input id={fieldId('currency')} name="currency" maxLength={3} placeholder="COP" defaultValue={initial('currency', brief?.budget_range?.currency ?? '')} aria-invalid={errors.currency ? true : undefined} aria-describedby={errors.currency ? `${fieldId('currency')}-error` : undefined} />
            {errors.currency ? <p className="field-error" id={`${fieldId('currency')}-error`}>{errors.currency}</p> : null}
          </div>
        </div>
        <p className="marketing-meta">Completa los tres campos o déjalos vacíos.</p>
      </fieldset>
      <div className="field">
        <label htmlFor={fieldId('missingInformation')}>Información pendiente</label>
        <textarea id={fieldId('missingInformation')} name="missingInformation" maxLength={3010} rows={3} defaultValue={initial('missingInformation', brief?.missing_information.join('\n') ?? '')} aria-invalid={errors.missingInformation ? true : undefined} aria-describedby={errors.missingInformation ? `${fieldId('missingInformation')}-error` : undefined} />
        <p className="marketing-meta">Un elemento por línea, hasta 10 elementos y 300 caracteres por elemento.</p>
        {errors.missingInformation ? <p className="field-error" id={`${fieldId('missingInformation')}-error`}>{errors.missingInformation}</p> : null}
      </div>
      {state.message ? <p role="alert" className="form-message form-message--error">{state.message}</p> : null}
      <div className="form-actions">
        <button className="button button--primary" type="submit" disabled={pending} aria-busy={pending}>{pending ? 'Guardando…' : brief ? 'Guardar brief' : 'Crear brief'}</button>
      </div>
    </form>
  );
}
