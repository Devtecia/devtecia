import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabasePublicEnv } from './env';

/** Supabase client bound to the signed in user's cookies. Create one per request. */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = supabasePublicEnv();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server components cannot write cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
