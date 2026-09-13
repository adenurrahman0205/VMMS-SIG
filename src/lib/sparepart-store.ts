import { type Maintenance, type Vehicle } from "./data";
import { pushCloud } from "./services/sync.service";

export type SparepartRow = {
  id: string;
  code: string;
  name: string;
  vehicleKind: string;
  price: number;
  workshop: string;
  workshopId?: string;
  source: "manual" | "wo";
  woId?: string;
  notes: string;
  active: boolean;
};

const KEY = "vmms-spareparts-v1";

export function nextSpareCode(rows: SparepartRow[]): string {
  let max = 0;
  for (const r of rows) {
    const m = /^SPR-(\d+)$/i.exec((r.code || "").trim());
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `SPR-${String(max + 1).padStart(3, "0")}`;
}

export function blankSpare(rows: SparepartRow[] = []): SparepartRow {
  return {
    id: `sp${Date.now()}`,
    code: nextSpareCode(rows),
    name: "",
    vehicleKind: "",
    price: 0,
    workshop: "",
    notes: "",
    source: "manual",
    active: true,
  };
}

function fingerprint(name: string, vehicleKind: string, workshop: string) {
  return `${name.trim().toLowerCase()}|${vehicleKind.trim().toLowerCase()}|${workshop.trim().toLowerCase()}`;
}

export function loadSpareparts(): SparepartRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as SparepartRow[];
      if (Array.isArray(p)) return p;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveSpareparts(rows: SparepartRow[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  void pushCloud("spareparts", rows);
}

/** Tambah baris baru dari WO. Tidak menimpa/menghapus katalog, tidak mengubah WO. */
export function ingestFromJobs(jobs: Maintenance[], fleet: Vehicle[]) {
  const rows = loadSpareparts();
  const seen = new Set(rows.map((r) => fingerprint(r.name, r.vehicleKind, r.workshop)));
  const extra: SparepartRow[] = [];
  jobs.forEach((j) => {
    const v = fleet.find((x) => x.id === j.vehicleId);
    const kind = v ? `${v.brand} ${v.model}`.trim() : "";
    const shop = j.shop || "";
    j.items.forEach((it) => {
      const name = (it.name || "").trim();
      if (!name) return;
      const fp = fingerprint(name, kind, shop);
      if (seen.has(fp)) return;
      seen.add(fp);
      extra.push({
        id: `spwo${j.id}-${extra.length}-${Date.now()}`,
        code: nextSpareCode([...rows, ...extra]),
        name,
        vehicleKind: kind,
        price: Number(it.price) || 0,
        workshop: shop,
        source: "wo",
        woId: j.id,
        notes: `Dari work order ${j.id}`,
        active: true,
      });
    });
  });
  if (!extra.length) return rows;
  const next = [...extra, ...rows];
  saveSpareparts(next);
  return next;
}
