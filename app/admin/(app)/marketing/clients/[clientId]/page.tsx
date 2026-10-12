import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getAdminSession } from '../../../../../../lib/admin/session';
import { createClient } from '../../../../../../lib/supabase/server';
import Topbar from '../../../topbar';
import { createMarketingBrand, updateMarketingBrand, updateMarketingClient } from '../../actions';
import { BrandForm, ClientForm, type MarketingBrand, type MarketingClient } from '../../marketing-forms';

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
                {brands.map((brand: MarketingBrand) => (
                  <article className="marketing-brand-card" key={brand.id}>
                    <BrandForm brand={brand} clientId={client.id} action={updateMarketingBrand} />
                  </article>
                ))}
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
