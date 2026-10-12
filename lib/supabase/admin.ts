import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service role client. Bypasses row level security: use only in server actions
 * that already checked the caller is an active admin. Never import from client code.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
