import type { Metadata } from 'next';
import { getProjectDirectory } from '../../../../lib/admin/projects';
import { parseProjectDirectory } from '../../../../lib/admin/project-directory';
import Topbar from '../topbar';
import ProjectDirectory from './project-directory';

export const metadata: Metadata = { title: 'Proyectos' };
export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseProjectDirectory(await searchParams);
  let result;
  try { result = await getProjectDirectory(query); } catch { /* Show an actionable local error without breaking navigation. */ }
  return <><Topbar crumbs={[{ label: 'Proyectos' }]} /><main className="page">
    <header className="directory-head"><div><p className="micro-label">Espacio de trabajo</p><h1>Proyectos</h1><p>Encuentra el proyecto y continúa con tu equipo.</p></div><a className="button button--primary" href="/admin/projects/new">Nuevo proyecto</a></header>
    <ProjectDirectory query={query} result={result} />
  </main></>;
}
