import { CaretRightIcon, MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';

type Crumb = { label: string; href?: string };
type TopbarProps = { crumbs: Crumb[]; search?: { action: string; defaultValue?: string; placeholder?: string } };

export default function Topbar({ crumbs, search }: TopbarProps) {
  return (
    <header className="topbar">
      <nav className="breadcrumbs" aria-label="Ruta">
        <ol>
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li key={`${crumb.label}-${index}`}>
                {crumb.href && !last ? <a href={crumb.href}>{crumb.label}</a> : <span aria-current={last ? 'page' : undefined}>{crumb.label}</span>}
                {last ? null : <CaretRightIcon aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>
      {search ? (
        <form className="global-search" role="search" action={search.action}>
          <MagnifyingGlassIcon aria-hidden="true" />
          <label className="visually-hidden" htmlFor="admin-search">Buscar tareas</label>
          <input id="admin-search" name="q" type="search" defaultValue={search.defaultValue} placeholder={search.placeholder ?? 'Buscar tareas'} autoComplete="off" />
        </form>
      ) : null}
    </header>
  );
}
