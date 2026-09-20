import { createBrowserSupabase } from "@/lib/supabase/client";

type KvKey = "fleet" | "bookings" | "users" | "jobs" | "workshops" | "spareparts" | "estimates";

const STORAGE: Record<KvKey, string> = {
  fleet: "vmms-armada-v3",
  bookings: "vmms-bookings-v2",
  users: "vmms-users-v1",
  jobs: "vmms-maintenance-v2",
  workshops: "vmms-workshops-v1",
  spareparts: "vmms-spareparts-v1",
  estimates: "vmms-estimates-v1",
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
          const rows =
            key === "users"
              ? cloud.map((u) => {
                  const row = u as { role?: string };
                  return { ...row, role: row.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER" };
                })
              : cloud;
          localStorage.setItem(STORAGE[key], JSON.stringify(rows));
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

function applySlice(key: KvKey, value: unknown) {
  if (typeof window === "undefined" || !Array.isArray(value)) return;
  const next = JSON.stringify(value);
  if (localStorage.getItem(STORAGE[key]) === next) return;
  localStorage.setItem(STORAGE[key], next);
  window.dispatchEvent(new CustomEvent("vmms-sync", { detail: key }));
}

let live = false;

export function startLiveSync() {
  if (typeof window === "undefined" || live) return;
  live = true;

  const tick = async () => {
    if (document.visibilityState === "hidden") return;
    const state = await loadState();
    if (!state) return;
    (["jobs", "fleet", "estimates", "workshops"] as KvKey[]).forEach((k) => applySlice(k, state[k]));
  };

  void tick();
  window.setInterval(() => void tick(), 3000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void tick();
  });

  try {
    const sb = createBrowserSupabase();
    sb.channel("vmms-app-kv")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_kv" }, (payload) => {
        const row = payload.new as { key?: string; value?: unknown } | null;
        if (row?.key && row.key in STORAGE) applySlice(row.key as KvKey, row.value);
      })
      .subscribe();
  } catch {
    /* polling cukup */
  }
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
