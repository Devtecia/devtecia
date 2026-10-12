import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { LoginNotice } from '../../../lib/admin/auth-messages';
import { safeAdminPath } from '../../../lib/admin/redirect';
import { getAdminSession } from '../../../lib/admin/session';
import { signIn } from './actions';
import LoginForm from './login-form';

export const metadata: Metadata = { title: 'Ingresar' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeAdminPath(first(params.next));
  const notice: LoginNotice | undefined =
    first(params.error) === 'inactive' ? 'inactive' : first(params.error) === 'invite' ? 'invite-error' : first(params.status) === 'signed-out' ? 'signed-out' : undefined;
  const setupPassword = first(params.setup) === 'invite';

  // A missing profile table or env var must not take the login page down.
  const session = await getAdminSession().catch(() => ({ status: 'signed-out' as const }));
  if (session.status === 'active' && !setupPassword) redirect(next);

  return <LoginForm action={signIn} next={next} notice={session.status === 'inactive' ? 'inactive' : notice} setupPassword={setupPassword && session.status === 'active'} />;
}
