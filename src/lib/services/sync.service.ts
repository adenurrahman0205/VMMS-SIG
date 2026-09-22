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
const lastLocalWrite: Partial<Record<KvKey, number>> = {};

export function isHydrated() {
  return hydrated;
}

function metaKey(key: KvKey) {
  return `${STORAGE[key]}:t`;
}

function localStamp(key: KvKey) {
  if (typeof window === "undefined") return 0;
  return Math.max(lastLocalWrite[key] ?? 0, Number(localStorage.getItem(metaKey(key)) || 0));
}

function unwrap(value: unknown): { t: number; rows: unknown[] } | null {
  if (Array.isArray(value)) return { t: 0, rows: value };
  if (value && typeof value === "object" && Array.isArray((value as { rows?: unknown }).rows)) {
    const v = value as { updatedAt?: number; rows: unknown[] };
    return { t: Number(v.updatedAt) || 0, rows: v.rows };
  }
  return null;
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

function writeLocal(key: KvKey, rows: unknown[], t: number) {
  localStorage.setItem(STORAGE[key], JSON.stringify(rows));
  localStorage.setItem(metaKey(key), String(t));
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
        const incoming = unwrap(state[key]);
        if (incoming) {
          const rows =
            key === "users"
              ? incoming.rows.map((u) => {
                  const row = u as { role?: string };
                  return { ...row, role: row.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER" };
                })
              : incoming.rows;
          const lt = localStamp(key);
          const justWrote = (lastLocalWrite[key] ?? 0) > incoming.t;
          if (justWrote) continue;
          if (incoming.t < lt && incoming.t > 0 && (incoming.rows?.length ?? 0) === 0) continue;
          writeLocal(key, rows, incoming.t);
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
  if (typeof window === "undefined") return;
  const incoming = unwrap(value);
  if (!incoming) return;
  const lt = localStamp(key);
  if ((lastLocalWrite[key] ?? 0) > incoming.t) return;
  if (incoming.t === lt && localStorage.getItem(STORAGE[key]) === JSON.stringify(incoming.rows)) return;
  if (incoming.t === 0 && lt > 0) return;
  writeLocal(key, incoming.rows, incoming.t);
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
  const t = Date.now();
  lastLocalWrite[key] = t;
  if (typeof window !== "undefined") localStorage.setItem(metaKey(key), String(t));
  const packed = { updatedAt: t, rows: value };
  try {
    const res = await fetch("/api/app-state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: packed }),
    });
    if (res.ok) return true;
  } catch {
    /* fall through */
  }
  try {
    const sb = createBrowserSupabase();
    const { error } = await sb.from("app_kv").upsert({ key, value: packed }, { onConflict: "key" });
    return !error;
  } catch {
    return false;
  }
}
