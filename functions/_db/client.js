import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(env) {
  // Extract project ID from DATABASE_URL: postgresql://...@db.{id}.supabase.co:5432/...
  const match = env.DATABASE_URL?.match(/@db\.([^.]+)\.supabase\.co/);
  const supabaseUrl = match
    ? `https://${match[1]}.supabase.co`
    : env.SUPABASE_URL;

  return createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
