import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

const invitationSetup = (request: NextRequest, error?: boolean) => {
  const url = new URL('/admin/login', request.url);
  url.searchParams.set(error ? 'error' : 'setup', 'invite');
  return NextResponse.redirect(url);
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  if (tokenHash && type === 'invite') {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'invite' });
    return invitationSetup(request, Boolean(error));
  }

  const code = request.nextUrl.searchParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return invitationSetup(request, Boolean(error));
  }

  return invitationSetup(request, true);
}
