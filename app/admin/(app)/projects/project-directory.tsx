import type { CSSProperties } from 'react';
import type { ProjectSummary } from '../../../../lib/admin/session-types';
import { directoryHref, PROJECT_PAGE_SIZE, type DirectoryQuery } from '../../../../lib/admin/project-directory';

export default function ProjectDirectory({ query, result }: { query: DirectoryQuery; result?: { projects: ProjectSummary[]; total: number } }) {
  return <>
    <form className="directory-filters" action="/admin/projects" method="get">
      <div className="field"><label htmlFor="project-search">Nombre del proyecto</label><input id="project-search" name="q" defaultValue={query.q} maxLength={100} placeholder="Buscar proyecto" /></div>
      <div className="field"><label htmlFor="project-client">Cliente</label><input id="project-client" name="client" defaultValue={query.client} maxLength={100} placeholder="Filtrar por cliente" /></div>
      <div className="field"><label htmlFor="project-sort">Orden</label><select id="project-sort" name="sort" defaultValue={query.sort}><option value="name">Nombre</option><option value="newest">Más recientes</option></select></div>
      <button className="button" type="submit">Filtrar</button><a className="button" href="/admin/projects">Limpiar</a>
    </form>
    {!result ? <div className="form-message form-message--error" role="alert">No pudimos cargar los proyectos. <a href={directoryHref(query, query.page)}>Volver a intentar</a></div> : <>
      <p className="project-meta">{result.total} proyectos</p>
      {!result.projects.length ? <div className="board-start"><h2>{result.total ? 'Esta página no tiene proyectos' : 'No hay proyectos que mostrar'}</h2><p>{query.q || query.client ? 'Prueba otros filtros o limpia la búsqueda.' : 'Crea un proyecto para organizar el trabajo del equipo.'}</p><a className="button" href={result.total ? directoryHref(query, 1) : '/admin/projects/new'}>{result.total ? 'Volver a la primera página' : 'Crear proyecto'}</a></div> : <section className="project-directory" aria-label="Proyectos">{result.projects.map(project => <article key={project.id} className="project-directory-card" style={{ '--project-color': project.color } as CSSProperties}>
        <span className="project-key">{project.key}</span><h2><a href={`/admin/projects/${project.key}`}>{project.name}</a></h2><p>{project.client || 'Sin cliente'}</p><p className="project-meta">{project.taskCount} tareas abiertas</p><a className="button" href={`/admin/projects/${project.key}`} aria-label={`Abrir ${project.name}`}>Abrir tablero</a>
      </article>)}</section>}
      <nav className="directory-pagination" aria-label="Páginas de proyectos">{query.page > 1 ? <a className="button" href={directoryHref(query, query.page - 1)}>Anterior</a> : null}<span>Página {query.page} de {Math.max(1, Math.ceil(result.total / PROJECT_PAGE_SIZE))}</span>{query.page * PROJECT_PAGE_SIZE < result.total ? <a className="button" href={directoryHref(query, query.page + 1)}>Siguiente</a> : null}</nav>
    </>}
  </>;
}
