"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./public";

let browser: SupabaseClient | null = null;

export function createBrowserSupabase() {
  if (!browser) {
    browser = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browser;
}
