import { createBrowserSupabase } from "@/lib/supabase/client";

export const IDLE_MS = 60 * 60_000;
export const WARN_MS = 15_000;
const ACT_KEY = "vmms-last-activity";
const LOCK_KEY = "vmms-force-logout";

export function touchActivity() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function lastActivity(): number {
  if (typeof window === "undefined") return Date.now();
  try {
    const n = Number(localStorage.getItem(ACT_KEY) || 0);
    return n || Date.now();
  } catch {
    return Date.now();
  }
}

export function idleMs() {
  return Date.now() - lastActivity();
}

export async function forceLogout() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCK_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  try {
    const sb = createBrowserSupabase();
    await sb.auth.signOut();
  } catch {
    /* ignore */
  }
}

export function onForcedLogout(cb: () => void) {
  const fn = (e: StorageEvent) => {
    if (e.key === LOCK_KEY && e.newValue) cb();
  };
  window.addEventListener("storage", fn);
  return () => window.removeEventListener("storage", fn);
}
