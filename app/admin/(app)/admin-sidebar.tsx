import { FoldersIcon, MegaphoneIcon, SignOutIcon, UsersIcon } from '@phosphor-icons/react/ssr';
import type { CSSProperties } from 'react';
import { roleLabels, type AdminProfile } from '../../../lib/admin/session-types';

type AdminSidebarProps = {
  profile: AdminProfile;
  pathname: string;
  signOut: () => Promise<void>;
};

const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
const currentProps = (current: boolean) => (current ? { 'aria-current': 'page' as const } : {});

export default function AdminSidebar({ profile, pathname, signOut }: AdminSidebarProps) {
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
        <ul className="sidebar-links">
          <li><a className="nav-item" href="/admin/projects" {...currentProps(isCurrent(pathname, '/admin/projects'))}><FoldersIcon aria-hidden="true" /><span>Proyectos</span></a></li>
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
