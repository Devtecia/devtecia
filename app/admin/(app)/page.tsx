import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { listProjects } from '../../../lib/admin/projects';
import EmptyProjects from './empty-projects';
import Topbar from './topbar';

export const metadata: Metadata = { title: 'Proyectos' };

export default async function AdminHome() {
  const [first] = await listProjects();
  if (first) redirect(`/admin/projects/${first.key}`);
  return (
    <>
      <Topbar crumbs={[{ label: 'Proyectos' }]} />
      <main className="page page--center">
        <EmptyProjects />
      </main>
    </>
  );
}
