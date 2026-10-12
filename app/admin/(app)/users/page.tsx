import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdminSession } from '../../../../lib/admin/session';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { createClient } from '../../../../lib/supabase/server';
import Topbar from '../topbar';
import InviteForm, { type TeamMember } from './invite-form';
import { inviteMember } from './actions';

export const metadata: Metadata = { title: 'Usuarios' };

type AuthUserSummary = { id: string; email_confirmed_at?: string | null };
type AuthUserAdminClient = {
  auth: {
    admin: {
      listUsers: (options: { page: number; perPage: number }) => Promise<{
        data: { users: AuthUserSummary[] };
        error: unknown | null;
      }>;
    };
  };
};

async function listAllAuthUsers(admin: AuthUserAdminClient): Promise<AuthUserSummary[]> {
  const perPage = 1000;
  const users: AuthUserSummary[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error('Could not load Auth users.');
    users.push(...data.users);
    if (data.users.length < perPage) return users;
    page += 1;
  }
}

export default async function UsersPage() {
  const session = await getAdminSession();
  if (session.status !== 'active' || session.profile.role !== 'admin') notFound();

  const supabase = await createClient();
  let members: TeamMember[] = [];
  let listError: string | undefined;
  try {
    const admin = createAdminClient();
    const [{ data: profiles, error: profileError }, authUsers] = await Promise.all([
      supabase.from('profiles').select('id, name, email, role, active').order('name', { ascending: true }),
      listAllAuthUsers(admin),
    ]);
    if (profileError) throw new Error('Could not load team members.');
    const confirmed = new Set(authUsers.filter(user => user.email_confirmed_at).map(user => user.id));
    members = (profiles ?? []).map(profile => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      status: !profile.active ? 'inactive' : confirmed.has(profile.id) ? 'active' : 'pending',
    }));
  } catch {
    listError = 'No pudimos cargar la lista del equipo. Intenta actualizar la página.';
  }

  return (
    <>
      <Topbar crumbs={[{ label: 'Usuarios' }]} />
      <main className="page users-page">
        <InviteForm
          action={inviteMember}
          members={members}
          listError={listError}
        />
      </main>
    </>
  );
}
