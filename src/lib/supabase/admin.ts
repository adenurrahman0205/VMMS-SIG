import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./public";

export function serviceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ""
  ).trim();
}

export function createAdminSupabase() {
  const key = serviceRoleKey();
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
