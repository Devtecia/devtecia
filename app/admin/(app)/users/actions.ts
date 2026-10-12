'use server';

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '../../../../lib/admin/session';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { inviteCallbackUrl, inviteTeamMember, type InviteState } from '../../../../lib/admin/invitations';

function applicationOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return process.env.NODE_ENV === 'production' ? null : 'http://localhost:3000';
}

export async function inviteMember(_previous: InviteState, formData: FormData): Promise<InviteState> {
  const session = await getAdminSession();
  const origin = applicationOrigin();
  if (!origin) return { error: 'No está configurada la dirección del panel para crear invitaciones.' };

  let redirectTo: string;
  try {
    redirectTo = inviteCallbackUrl(origin);
  } catch {
    return { error: 'No pudimos preparar la invitación. Revisa la configuración del panel.' };
  }

  const result = await inviteTeamMember(session, formData.get('email'), redirectTo, createAdminClient);
  if (result.success) revalidatePath('/admin/users');
  return result;
}
