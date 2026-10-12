import { UsersIcon } from '@phosphor-icons/react/ssr';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdminSession } from '../../../../lib/admin/session';
import Topbar from '../topbar';

export const metadata: Metadata = { title: 'Usuarios' };

export default async function UsersPage() {
  const session = await getAdminSession();
  if (session.status !== 'active' || session.profile.role !== 'admin') notFound();
  return (
    <>
      <Topbar crumbs={[{ label: 'Usuarios' }]} />
      <main className="page page--center">
        <section className="empty-state" aria-labelledby="users-title">
          <span className="empty-icon" aria-hidden="true"><UsersIcon /></span>
          <p className="micro-label">Equipo</p>
          <h1 id="users-title">Gestión de usuarios</h1>
          <p>Aquí vas a crear cuentas, asignar roles y desactivar accesos. Esta sección se habilita en la siguiente etapa.</p>
        </section>
      </main>
    </>
  );
}
