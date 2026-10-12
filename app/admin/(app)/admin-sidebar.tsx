import { MegaphoneIcon, PlusIcon, SignOutIcon, UsersIcon } from '@phosphor-icons/react/ssr';
import type { CSSProperties } from 'react';
import { roleLabels, type AdminProfile, type ProjectSummary } from '../../../lib/admin/session-types';

type AdminSidebarProps = {
  profile: AdminProfile;
  projects: ProjectSummary[];
  pathname: string;
  signOut: () => Promise<void>;
};

const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
const currentProps = (current: boolean) => (current ? { 'aria-current': 'page' as const } : {});

export default function AdminSidebar({ profile, projects, pathname, signOut }: AdminSidebarProps) {
  const isAdmin = profile.role === 'admin';
  return (
    <>
      <a className="sidebar-brand" href="/admin">
        <span className="sidebar-mark" aria-hidden="true">D</span>
        <span>
          <strong>Devtecia Admin</strong>
          <small>Proyectos y tareas</small>
        </span>
      </a>

      <nav className="sidebar-nav" aria-label="Administración">
        <div className="sidebar-section">
          <div className="sidebar-heading">
            <span className="sidebar-label">Proyectos</span>
            <a className="sidebar-add" href="/admin/projects/new" aria-label="Nuevo proyecto" {...currentProps(pathname === '/admin/projects/new')}>
              <PlusIcon aria-hidden="true" />
            </a>
          </div>
          {projects.length === 0 ? (
            <p className="sidebar-empty">Aún no hay proyectos.</p>
          ) : (
            <ul className="project-list">
              {projects.map(project => {
                const href = `/admin/projects/${project.key}`;
                return (
                  <li key={project.id}>
                    <a className="project-link" href={href} {...currentProps(isCurrent(pathname, href))}
                      style={{ '--project-color': project.color } as CSSProperties}>
                      <span className="project-key">{project.key}</span>
                      <span className="project-name">{project.name}</span>
                      <span className="project-count" aria-label={`${project.taskCount} tareas`}>{project.taskCount}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <ul className="sidebar-links">
          <li>
            <a className="nav-item" href="/admin/marketing" {...currentProps(isCurrent(pathname, '/admin/marketing'))}>
              <MegaphoneIcon aria-hidden="true" />
              <span>Marketing</span>
            </a>
          </li>
          {isAdmin ? (
            <li>
              <a className="nav-item" href="/admin/users" {...currentProps(isCurrent(pathname, '/admin/users'))}>
                <UsersIcon aria-hidden="true" />
                <span>Usuarios</span>
              </a>
            </li>
          ) : null}
        </ul>
      </nav>

      <div className="sidebar-foot">
        <span className="avatar" style={{ '--avatar-color': profile.color } as CSSProperties} aria-hidden="true">{profile.initials}</span>
        <span className="profile-text">
          <strong>{profile.name || profile.email}</strong>
          <small>{roleLabels[profile.role]}</small>
        </span>
        <form action={signOut}>
          <button className="icon-button icon-button--dark" type="submit" aria-label="Cerrar sesión" title="Cerrar sesión">
            <SignOutIcon aria-hidden="true" />
          </button>
        </form>
      </div>
    </>
  );
}
