import type { Metadata } from 'next';
import Topbar from '../../topbar';
import { createProject } from '../actions';
import ProjectForm from './project-form';

export const metadata: Metadata = { title: 'Nuevo proyecto' };

export default function NewProjectPage() {
  return (
    <>
      <Topbar crumbs={[{ label: 'Proyectos', href: '/admin/projects' }, { label: 'Nuevo proyecto' }]} />
      <main className="page page--narrow">
        <header className="page-head">
          <p className="micro-label">Proyectos</p>
          <h1>Nuevo proyecto</h1>
          <p>El tablero arranca con seis columnas que puedes ajustar después.</p>
        </header>
        <ProjectForm action={createProject} />
      </main>
    </>
  );
}
