import { type Maintenance, type Vehicle } from "./data";
import { pushCloud } from "./services/sync.service";

export type SparepartRow = {
  id: string;
  code: string;
  name: string;
  merk: string;
  vehicleKind: string;
  year: number | "";
  price: number;
  buyDate: string;
  qty: number;
  unit: string;
  workshop: string;
  workshopId?: string;
  source: "manual" | "wo";
  woId?: string;
  notes: string;
  photo?: string;
  active: boolean;
};

export const SPARE_UNITS = ["PCS", "SET", "PSG", "BH", "LTR", "KIT", "ROLL", "MTR", "KG"] as const;

const KEY = "vmms-spareparts-v1";

function normalize(r: SparepartRow): SparepartRow {
  return {
    ...r,
    merk: r.merk ?? "",
    year: r.year === undefined || r.year === null ? "" : r.year,
    qty: Number(r.qty) > 0 ? Number(r.qty) : 1,
    unit: (r.unit || "PCS").toUpperCase(),
    buyDate: typeof r.buyDate === "string" ? r.buyDate : "",
    photo: typeof r.photo === "string" ? r.photo : "",
  };
}

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
    merk: "",
    vehicleKind: "",
    year: "",
    price: 0,
    qty: 1,
    unit: "PCS",
    workshop: "",
    notes: "",
    photo: "",
    source: "manual",
    active: true,
  };
}

export function fingerprint(r: { name: string; merk?: string; vehicleKind: string; year?: number | ""; workshop: string }) {
  return `${(r.name || "").trim().toLowerCase()}|${(r.merk || "").trim().toLowerCase()}|${(r.vehicleKind || "").trim().toLowerCase()}|${r.year || ""}|${(r.workshop || "").trim().toLowerCase()}`;
}

export function loadSpareparts(): SparepartRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as SparepartRow[];
      if (Array.isArray(p)) return p.map(normalize);
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveSpareparts(rows: SparepartRow[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.map(normalize)));
  void pushCloud("spareparts", rows);
}

/** Tambah baris baru dari WO. Tidak menimpa/menghapus katalog, tidak mengubah WO. */
export function ingestFromJobs(jobs: Maintenance[], fleet: Vehicle[]) {
  const rows = loadSpareparts();
  const seen = new Set(rows.map((r) => fingerprint(r)));
  const extra: SparepartRow[] = [];
  jobs.forEach((j) => {
    const v = fleet.find((x) => x.id === j.vehicleId);
    const kind = v ? `${v.brand} ${v.model}`.trim() : "";
    const year = v?.year ?? "";
    const shop = j.shop || "";
    j.items.forEach((it) => {
      const name = (it.name || "").trim();
      if (!name) return;
      const row: SparepartRow = {
        id: `spwo${j.id}-${extra.length}-${Date.now()}`,
        code: nextSpareCode([...rows, ...extra]),
        name,
        merk: "",
        vehicleKind: kind,
        year,
        price: Number(it.price) || 0,
        buyDate: j.date || "",
        qty: Number(it.qty) > 0 ? Number(it.qty) : 1,
        unit: "PCS",
        workshop: shop,
        source: "wo",
        woId: j.id,
        notes: `Dari work order ${j.id}`,
        photo: "",
        active: true,
      };
      const fp = fingerprint(row);
      if (seen.has(fp)) return;
      seen.add(fp);
      extra.push(row);
    });
  });
  if (!extra.length) return rows;
  const next = [...extra, ...rows];
  saveSpareparts(next);
  return next;
}
