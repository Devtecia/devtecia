'use server';

import { redirect } from 'next/navigation';
import { INACTIVE_MESSAGE, PROFILE_ERROR_MESSAGE, loginErrorMessage, validateLogin, type LoginState } from '../../../lib/admin/auth-messages';
import { safeAdminPath } from '../../../lib/admin/redirect';
import { getAdminSession } from '../../../lib/admin/session';
import { createClient } from '../../../lib/supabase/server';

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (formData.get('intent') === 'invite-setup') {
    const password = String(formData.get('password') ?? '');
    const confirmation = String(formData.get('password-confirmation') ?? '');
    if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' };
    if (password !== confirmation) return { error: 'Las contraseñas no coinciden.' };

    const session = await getAdminSession();
    if (session.status !== 'active') return { error: 'El enlace de invitación no es válido o ya venció. Pide una nueva invitación.' };
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: 'No pudimos guardar la contraseña. Intenta de nuevo.' };
    redirect('/admin');
  }

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
