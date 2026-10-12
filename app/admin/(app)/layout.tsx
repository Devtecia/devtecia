import { redirect } from 'next/navigation';
import { getAdminSession } from '../../../lib/admin/session';
import { signOut } from '../actions';
import AdminShell from './admin-shell';

export default async function AdminAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getAdminSession();
  if (session.status === 'signed-out') redirect('/admin/login');
  if (session.status === 'inactive') redirect('/admin/login?error=inactive');

  return (
    <AdminShell profile={session.profile} signOut={signOut}>
      {children}
    </AdminShell>
  );
}
