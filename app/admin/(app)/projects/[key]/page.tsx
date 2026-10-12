import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { getProjectByKey } from '../../../../../lib/admin/projects';
import Topbar from '../../topbar';
import KanbanBoard from './kanban-board';

type Params = Promise<{ key: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { key } = await params;
  const project = await getProjectByKey(key);
  return { title: project ? `${project.key} ${project.name}` : 'Proyecto' };
}

export default async function ProjectPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { key } = await params;
  const query = (await searchParams).q;
  const project = await getProjectByKey(key);
  if (!project) notFound();

  const total = Object.values(project.statusCounts).reduce((sum, count) => sum + count, 0);
  return (
    <>
      <Topbar
        crumbs={[{ label: 'Proyectos', href: '/admin/projects' }, { label: project.name }]}
        search={{ action: `/admin/projects/${project.key}`, defaultValue: typeof query === 'string' ? query : undefined }}
      />
      <main className="page">
        <header className="project-head" style={{ '--project-color': project.color } as CSSProperties}>
          <p className="micro-label">
            <span className="project-key">{project.key}</span>
            {project.client ? ` ${project.client}` : null}
          </p>
          <h1>{project.name}</h1>
          <p className="project-meta">{total === 1 ? '1 tarea abierta' : `${total} tareas abiertas`}</p>
          {project.description ? <p className="project-description">{project.description}</p> : null}
        </header>
        <KanbanBoard projectId={project.id} projectKey={project.key} statuses={project.statuses}
          tasks={project.tasks} assignees={project.assignees} query={typeof query === 'string' ? query : ''} />
      </main>
    </>
  );
}
