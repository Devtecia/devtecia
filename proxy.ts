import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isLoginPath } from './lib/admin/redirect';
import { supabasePublicEnv } from './lib/supabase/env';

/** Refreshes the Supabase session cookies and keeps signed out visitors on the admin login. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = supabasePublicEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // getUser validates the token with Supabase Auth; never trust the cookie alone here.
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;
  if (user || isLoginPath(pathname)) return response;

  const login = request.nextUrl.clone();
  login.pathname = '/admin/login';
  login.search = '';
  if (pathname !== '/admin') login.searchParams.set('next', `${pathname}${search}`);
  const redirect = NextResponse.redirect(login);
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
