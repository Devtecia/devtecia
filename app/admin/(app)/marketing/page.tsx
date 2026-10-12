import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '../../../../lib/admin/session';
import { createClient } from '../../../../lib/supabase/server';
import Topbar from '../topbar';
import { createMarketingClient } from './actions';
import { ClientForm, ClientList, type MarketingClient } from './marketing-forms';

export const metadata: Metadata = { title: 'Marketing' };

export default async function MarketingPage() {
  const session = await getAdminSession();
  if (session.status !== 'active') redirect('/admin/login');

  const supabase = await createClient();
  const { data, error } = await supabase.from('marketing_clients')
    .select('id, name, website, summary')
    .order('name', { ascending: true })
    .returns<MarketingClient[]>();

  return (
    <>
      <Topbar crumbs={[{ label: 'Marketing' }]} />
      <main className="page marketing-page">
        <header className="page-head">
          <p className="micro-label">Estrategia</p>
          <h1>Clientes y marcas</h1>
          <p>Un espacio compartido para organizar la información de cada cliente y sus marcas.</p>
        </header>
        {error ? <p role="status" className="form-message form-message--error">No pudimos cargar los clientes. Intenta actualizar la página.</p> : null}
        <ClientList clients={data ?? []} />
        <section className="marketing-create" aria-labelledby="new-client-title">
          <div className="page-head">
            <p className="micro-label">Nuevo registro</p>
            <h2 id="new-client-title">Agregar un cliente</h2>
            <p>Después podrás incluir una o varias marcas.</p>
          </div>
          <ClientForm action={createMarketingClient} />
        </section>
      </main>
    </>
  );
}
