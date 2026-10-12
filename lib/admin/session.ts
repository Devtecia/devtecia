import 'server-only';
import { cache } from 'react';
import { createClient } from '../supabase/server';
import type { AdminProfile } from './session-types';

export type { AdminProfile, AdminRole } from './session-types';

export type AdminSession =
  | { status: 'signed-out' }
  | { status: 'inactive' }
  | { status: 'active'; profile: AdminProfile };

/** Resolves the signed in admin profile once per request. Inactive profiles count as signed out. */
export const getAdminSession = cache(async (): Promise<AdminSession> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'signed-out' };

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, initials, color, role, active')
    .eq('id', user.id)
    .maybeSingle<AdminProfile>();
  if (error) throw new Error('Could not load the admin profile.');
  // Row level security hides every profile from inactive users, so a missing row means inactive.
  if (!data?.active) return { status: 'inactive' };
  return { status: 'active', profile: data };
});
