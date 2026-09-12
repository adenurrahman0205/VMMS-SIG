import { createBrowserSupabase } from "@/lib/supabase/client";

type KvRow = { key: string; value: unknown };

let hydrated = false;
let hydrating: Promise<boolean> | null = null;

export function isHydrated() {
  return hydrated;
}

export async function hydrateCloud(): Promise<boolean> {
  if (hydrated) return true;
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      if (typeof window === "undefined") return false;
      const sb = createBrowserSupabase();
      const { data, error } = await sb.from("app_kv").select("key,value");
      if (error || !data) {
        hydrated = true;
        return false;
      }
      const map = new Map((data as KvRow[]).map((r) => [r.key, r.value]));
      await applyKey("fleet", "vmms-armada-v3", map);
      await applyKey("bookings", "vmms-bookings-v2", map);
      await applyKey("users", "vmms-users-v1", map);
      await applyKey("jobs", "vmms-maintenance-v1", map);
      hydrated = true;
      return true;
    } catch {
      hydrated = true;
      return false;
    } finally {
      hydrating = null;
    }
  })();
  return hydrating;
}

async function applyKey(key: "fleet" | "bookings" | "users" | "jobs", storageKey: string, map: Map<string, unknown>) {
  const cloud = map.get(key);
  if (Array.isArray(cloud)) {
    localStorage.setItem(storageKey, JSON.stringify(cloud));
    return;
  }
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) await pushCloud(key, parsed);
  } catch {
    /* ignore */
  }
}

export async function pushCloud(key: "fleet" | "bookings" | "users" | "jobs", value: unknown) {
  try {
    const sb = createBrowserSupabase();
    const { error } = await sb.from("app_kv").upsert({ key, value }, { onConflict: "key" });
    return !error;
  } catch {
    return false;
  }
}
