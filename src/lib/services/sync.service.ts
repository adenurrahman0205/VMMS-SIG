import { createBrowserSupabase } from "@/lib/supabase/client";

type KvKey = "fleet" | "bookings" | "users" | "jobs";

const STORAGE: Record<KvKey, string> = {
  fleet: "vmms-armada-v3",
  bookings: "vmms-bookings-v2",
  users: "vmms-users-v1",
  jobs: "vmms-maintenance-v1",
};

let hydrated = false;
let hydrating: Promise<boolean> | null = null;

export function isHydrated() {
  return hydrated;
}

async function loadState(): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch("/api/app-state", { cache: "no-store" });
    const json = (await res.json()) as { ok?: boolean; state?: Record<string, unknown> };
    if (res.ok && json.ok && json.state) return json.state;
  } catch {
    /* fall through */
  }
  try {
    const sb = createBrowserSupabase();
    const { data, error } = await sb.from("app_kv").select("key,value");
    if (error || !data) return null;
    const state: Record<string, unknown> = {};
    for (const row of data) state[row.key] = row.value;
    return state;
  } catch {
    return null;
  }
}

export async function hydrateCloud(): Promise<boolean> {
  if (hydrated) return true;
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      if (typeof window === "undefined") return false;
      const state = await loadState();
      if (!state) {
        hydrated = true;
        return false;
      }
      for (const key of Object.keys(STORAGE) as KvKey[]) {
        const cloud = state[key];
        if (Array.isArray(cloud)) {
          localStorage.setItem(STORAGE[key], JSON.stringify(cloud));
          continue;
        }
        const raw = localStorage.getItem(STORAGE[key]);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) await pushCloud(key, parsed);
        } catch {
          /* ignore */
        }
      }
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

export async function pushCloud(key: KvKey, value: unknown) {
  try {
    const res = await fetch("/api/app-state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) return true;
  } catch {
    /* fall through */
  }
  try {
    const sb = createBrowserSupabase();
    const { error } = await sb.from("app_kv").upsert({ key, value }, { onConflict: "key" });
    return !error;
  } catch {
    return false;
  }
}
