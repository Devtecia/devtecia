import { KanbanIcon, PlusIcon } from '@phosphor-icons/react/ssr';

export default function EmptyProjects() {
  return (
    <section className="empty-state" aria-labelledby="empty-projects-title">
      <span className="empty-icon" aria-hidden="true"><KanbanIcon /></span>
      <p className="micro-label">Primeros pasos</p>
      <h1 id="empty-projects-title">Crea tu primer proyecto</h1>
      <p>Cada proyecto tiene su propio tablero con columnas, tareas numeradas y responsables. Empieza por uno y suma al equipo después.</p>
      <a className="button button--primary" href="/admin/projects/new">
        <PlusIcon aria-hidden="true" />
        Crear proyecto
      </a>
    </section>
  );
}
