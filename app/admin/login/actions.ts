'use server';

import { redirect } from 'next/navigation';
import { INACTIVE_MESSAGE, PROFILE_ERROR_MESSAGE, loginErrorMessage, validateLogin, type LoginState } from '../../../lib/admin/auth-messages';
import { safeAdminPath } from '../../../lib/admin/redirect';
import { createClient } from '../../../lib/supabase/server';

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = safeAdminPath(formData.get('next'));

  const invalid = validateLogin(email, password);
  if (invalid) return { error: invalid, email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: loginErrorMessage(error ?? {}), email };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('active')
    .eq('id', data.user.id)
    .maybeSingle<{ active: boolean }>();
  if (profileError || !profile?.active) {
    await supabase.auth.signOut();
    return { error: profileError ? PROFILE_ERROR_MESSAGE : INACTIVE_MESSAGE, email };
  }

  redirect(next);
}
