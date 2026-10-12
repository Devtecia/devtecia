'use client';

import { useActionState } from 'react';

export type MarketingFormState = {
  errors?: Partial<Record<'name' | 'website' | 'summary', string>>;
  message?: string;
  values?: Record<string, string>;
};

export type MarketingClient = { id: string; name: string; website: string; summary: string };
export type MarketingBrand = { id: string; client_id: string; name: string; website: string; summary: string };
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
