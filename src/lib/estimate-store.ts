import { woTotal, type Maintenance, type Vehicle } from "./data";
import { pushCloud } from "./services/sync.service";

export type EstimateItem = { name: string; qty: number; price: number };

export type ServiceEstimate = {
  id: string;
  date: string;
  vehicleId: string;
  type: string;
  km: number;
  shop: string;
  workshopId?: string;
  complaint: string;
  items: EstimateItem[];
  jasa: number;
  notes: string;
  status: "arsip" | "wo";
  woId?: string;
};

const KEY = "vmms-estimates-v1";

const DEFAULT_JASA: Record<string, number> = {
  "Service Berkala": 350_000,
  "Ganti Oli": 150_000,
  "Ganti Rem": 250_000,
  "Service AC": 400_000,
  "Ganti Ban": 200_000,
  "Perbaikan Lain": 300_000,
};

const DEFAULT_PARTS: Record<string, EstimateItem[]> = {
  "Service Berkala": [
    { name: "Oli mesin", qty: 4, price: 135_000 },
    { name: "Filter oli", qty: 1, price: 85_000 },
    { name: "Filter udara", qty: 1, price: 150_000 },
  ],
  "Ganti Oli": [{ name: "Oli mesin", qty: 4, price: 135_000 }],
  "Ganti Rem": [{ name: "Kampas rem", qty: 1, price: 650_000 }],
  "Service AC": [{ name: "Freon", qty: 1, price: 450_000 }],
  "Ganti Ban": [{ name: "Ban", qty: 4, price: 850_000 }],
  "Perbaikan Lain": [],
};

export function estimateTotal(e: { items: EstimateItem[]; jasa?: number }) {
  const parts = e.items.reduce((s, it) => s + it.qty * it.price, 0);
  return parts + (Number(e.jasa) || 0);
}

export function loadEstimates(): ServiceEstimate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as ServiceEstimate[];
      if (Array.isArray(p)) return p;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveEstimates(rows: ServiceEstimate[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  void pushCloud("estimates", rows);
}

export function blankEstimate(vehicleId = "", type = "Service Berkala"): ServiceEstimate {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return {
    id: `EST-${y}-${String(Date.now()).slice(-6)}`,
    date: `${y}-${m}-${day}`,
    vehicleId,
    type,
    km: 0,
    shop: "",
    complaint: "",
    items: (DEFAULT_PARTS[type] ?? []).map((it) => ({ ...it })),
    jasa: DEFAULT_JASA[type] ?? 300_000,
    notes: "",
    status: "arsip",
  };
}

/** Isi default dari histori WO sejenis, atau paket standar. */
export function suggestFor(type: string, vehicleId: string, jobs: Maintenance[], fleet: Vehicle[]) {
  const v = fleet.find((x) => x.id === vehicleId);
  const same = jobs.filter(
    (j) =>
      j.status === "selesai" &&
      j.type === type &&
      (j.vehicleId === vehicleId || (v && fleet.find((x) => x.id === j.vehicleId)?.model === v.model))
  );
  if (same.length) {
    const last = [...same].sort((a, b) => b.date.localeCompare(a.date))[0];
    const avgJasa = Math.round(same.reduce((s, j) => s + (Number(j.jasa) || 0), 0) / same.length / 10_000) * 10_000;
    return {
      items: last.items.length ? last.items.map((it) => ({ ...it })) : (DEFAULT_PARTS[type] ?? []).map((it) => ({ ...it })),
      jasa: avgJasa || DEFAULT_JASA[type] || 300_000,
      fromHistory: true,
      sample: same.length,
      avgTotal: Math.round(same.reduce((s, j) => s + woTotal(j), 0) / same.length),
    };
  }
  return {
    items: (DEFAULT_PARTS[type] ?? []).map((it) => ({ ...it })),
    jasa: DEFAULT_JASA[type] ?? 300_000,
    fromHistory: false,
    sample: 0,
    avgTotal: estimateTotal({ items: DEFAULT_PARTS[type] ?? [], jasa: DEFAULT_JASA[type] ?? 300_000 }),
  };
}
