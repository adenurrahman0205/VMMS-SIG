import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Anon client for server components. Never use service role in the browser. */
export function createServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
