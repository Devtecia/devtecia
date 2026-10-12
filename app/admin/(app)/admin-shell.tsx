'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AdminProfile } from '../../../lib/admin/session-types';
import AdminSidebar from './admin-sidebar';

type AdminShellProps = {
  profile: AdminProfile;
  signOut: () => Promise<void>;
  children: React.ReactNode;
};

export default function AdminShell({ profile, signOut, children }: AdminShellProps) {
  const pathname = usePathname() ?? '/admin';
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="admin-shell" data-nav-open={open ? 'true' : 'false'}>
      <a className="skip-link" href="#admin-main">Ir al contenido</a>
      <header className="mobile-bar">
        <a className="mobile-brand" href="/admin">Devtecia Admin</a>
        <button
          className="menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="admin-sidebar"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen(value => !value)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </header>
      <aside id="admin-sidebar" className="sidebar">
        <AdminSidebar profile={profile} pathname={pathname} signOut={signOut} />
      </aside>
      <button className="sidebar-scrim" type="button" tabIndex={-1} aria-hidden="true" onClick={() => setOpen(false)} />
      <div id="admin-main" className="workspace">{children}</div>
    </div>
  );
}
