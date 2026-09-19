import { createBrowserSupabase } from "@/lib/supabase/client";

export const IDLE_MS = 60 * 60_000;
export const WARN_MS = 15_000;
const ACT_KEY = "vmms-last-activity";
const LOCK_KEY = "vmms-force-logout";

let memAt = Date.now();

function writeAt(n: number) {
  memAt = n;
  const s = String(n);
  try {
    sessionStorage.setItem(ACT_KEY, s);
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(ACT_KEY, s);
  } catch {
    /* kuota penuh (foto data URL) — tetap pakai memori */
  }
}

export function touchActivity() {
  if (typeof window === "undefined") return;
  writeAt(Date.now());
}

export function lastActivity(): number {
  if (typeof window === "undefined") return Date.now();
  let stored = 0;
  try {
    stored = Math.max(stored, Number(sessionStorage.getItem(ACT_KEY) || 0) || 0);
  } catch {
    /* ignore */
  }
  try {
    stored = Math.max(stored, Number(localStorage.getItem(ACT_KEY) || 0) || 0);
  } catch {
    /* ignore */
  }
  return Math.max(memAt, stored) || Date.now();
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
