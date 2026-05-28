import { createClient } from '@supabase/supabase-js';
import { env } from '../env.js';

// Admin client — uses the service role key, bypasses RLS.
// Only use for server-only operations that intentionally need elevated access.
// Never expose this client or its key to any client-facing response.
export const adminSupabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// Per-request factory — uses the anon key + user's JWT.
// PostgREST reads the Authorization header to set auth.uid() in the Postgres
// session, so all RLS policies apply correctly for the authenticated user.
export function createUserSupabaseClient(accessToken: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type UserSupabaseClient = ReturnType<typeof createUserSupabaseClient>;
