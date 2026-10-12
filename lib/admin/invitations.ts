export type InviteState = { error?: string; success?: string; email?: string };
type InviteAuthorization = { status: string; profile?: { role?: string } };
type InviteClient = {
  auth: { admin: { inviteUserByEmail: (email: string, options: { data: { role: 'member' }; redirectTo: string }) => Promise<{ error: unknown | null }> } };
};

const INVALID_EMAIL = 'Escribe un correo válido, por ejemplo ana@devtecia.com.';
const INVITE_ERROR = 'No pudimos enviar la invitación. Verifica el correo e inténtalo de nuevo.';

export function normalizeInvitationEmail(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

export function isValidInvitationEmail(raw: unknown): boolean {
  const email = normalizeInvitationEmail(raw);
  if (email.length > 254) return false;
  const [local, domain, extra] = email.split('@');
  return Boolean(local && local.length <= 64 && domain && !extra && domain.includes('.') &&
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local) &&
    domain.split('.').every(label => label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)) &&
    domain.split('.').at(-1)!.length >= 2);
}

export function inviteCallbackUrl(origin: string): string {
  const callback = new URL('/auth/callback', origin);
  callback.searchParams.set('next', '/admin/login?setup=invite');
  return callback.toString();
}

export async function inviteTeamMember(
  session: InviteAuthorization,
  rawEmail: unknown,
  redirectTo: string,
  createClient: () => InviteClient,
): Promise<InviteState> {
  if (session.status !== 'active' || session.profile?.role !== 'admin') {
    return { error: 'No tienes permiso para invitar integrantes.' };
  }

  const email = normalizeInvitationEmail(rawEmail);
  if (!isValidInvitationEmail(email)) return { error: INVALID_EMAIL, email };

  try {
    const { error } = await createClient().auth.admin.inviteUserByEmail(email, {
      data: { role: 'member' },
      redirectTo,
    });
    if (error) return { error: INVITE_ERROR, email };
    return { success: `Enviamos la invitación a ${email}.` };
  } catch {
    return { error: INVITE_ERROR, email };
  }
}
