export type Status = "ready" | "warning" | "maintenance" | "inactive";
export type OwnerKind = "sig" | "vendor";
export type Transmission = "matic" | "manual";

export type VehicleDoc = {
  type: string;
  expire: string;
  status: "aktif" | "segera" | "expired";
  /** Nominal pajak (hanya untuk jenis Pajak). */
  amount?: number;
};

export function isPajakDoc(type: string) {
  return type.trim().toLowerCase() === "pajak";
}

export type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  km: number;
  dept: string;
  jabatan?: string;
  driver: string;
  status: Status;
  color: string;
  engine: string;
  chassis: string;
  loc: string;
  health: number;
  buyDate: string;
  buyPrice: number;
  owner: string;
  ownerKind: OwnerKind;
  address: string;
  fuel: string;
  cc: string;
  hp: string;
  madeYear: number;
  bbmNo: string;
  bbmImage?: string;
  photo?: string;
  nextServiceKm?: number;
  transmission?: Transmission;
  documents?: VehicleDoc[];
};

export const DOC_TYPES = ["STNK", "BPKB", "KIR", "Asuransi", "Pajak"] as const;

export function docStatusFromExpire(expire: string): VehicleDoc["status"] {
  if (!expire) return "segera";
  const t = new Date(expire + "T00:00:00").getTime();
  const days = (t - Date.now()) / 86400000;
  if (days < 0) return "expired";
  if (days <= 60) return "segera";
  return "aktif";
}

export function docsForVehicle(v: { id: string; documents?: VehicleDoc[] }): VehicleDoc[] {
  if (v.documents && v.documents.length) return v.documents;
  return documents
    .filter((d) => d.vehicleId === v.id)
    .map((d) => ({
      type: d.type,
      expire: d.expire,
      status: (d.status as VehicleDoc["status"]) || docStatusFromExpire(d.expire),
      amount: "amount" in d ? Number((d as { amount?: number }).amount) || undefined : undefined,
    }));
}

const CORE_DOCS = ["STNK", "Pajak", "Asuransi"] as const;

function isoAddMonths(base: Date, months: number) {
  const d = new Date(base.getFullYear(), base.getMonth() + months, base.getDate());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Lengkapi STNK, Pajak, Asuransi jika belum ada di unit. */
export function ensureCoreDocs(v: { id: string; buyDate?: string; documents?: VehicleDoc[] }): VehicleDoc[] {
  const existing = docsForVehicle(v).map((d) => ({ ...d, status: docStatusFromExpire(d.expire) }));
  const have = new Set(existing.map((d) => d.type.trim().toLowerCase()));
  const hash = [...v.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const start = v.buyDate ? new Date(`${v.buyDate}T00:00:00`) : new Date();
  const now = new Date();
  const origin = Number.isNaN(start.getTime()) ? now : start;
  const extras: VehicleDoc[] = [];
  CORE_DOCS.forEach((type, i) => {
    if (have.has(type.toLowerCase())) return;
    const months = 6 + ((hash + i * 5) % 18);
    const expire = isoAddMonths(origin.getTime() > now.getTime() - 86400000 * 30 ? now : origin, months);
    extras.push({ type, expire, status: docStatusFromExpire(expire) });
  });
  return [...existing, ...extras];
}

export type Maintenance = {
  id: string;
  vehicleId: string;
  date: string;
  type: string;
  km: number;
  shop: string;
  workshopId?: string;
  cost: number;
  jasa?: number;
  status: "selesai" | "proses";
  complaint: string;
  action: string;
  items: { name: string; qty: number; price: number }[];
  createdBy?: string;
};

export function woTotal(m: { cost: number; jasa?: number; items: { qty: number; price: number }[] }) {
  const parts = m.items.reduce((s, it) => s + it.qty * it.price, 0);
  const jasa = Number(m.jasa) || 0;
  if (m.jasa != null) return parts + jasa;
  return m.cost || parts;
}

export const vehicles: Vehicle[] = [
  { id: "v1", plate: "B 1234 ABC", brand: "Toyota", model: "Innova", year: 2022, km: 85240, dept: "General Affairs", driver: "Andi Wijaya", status: "ready", color: "Silver", engine: "2TR-FE-8821", chassis: "MHFM1BA3N0123456", loc: "Kantor Pusat Bogor", health: 88, buyDate: "2022-03-15", buyPrice: 385000000, owner: "PT SIG Operasional", ownerKind: "sig", address: "Jl. Raya Pajajaran No. 12, Bogor", fuel: "Bensin", cc: "1998 cc", hp: "137 HP", madeYear: 2022, bbmNo: "6088-2210-4581-0192" },
  { id: "v2", plate: "B 5678 DEF", brand: "Toyota", model: "Avanza", year: 2021, km: 102450, dept: "Operasional", driver: "Budi Santoso", status: "warning", color: "Putih", engine: "3SZ-VE-4412", chassis: "MHFM2BA2K0987654", loc: "Kantor Pusat Bogor", health: 64, buyDate: "2021-07-20", buyPrice: 235000000, owner: "PT SIG Operasional", ownerKind: "sig", address: "Jl. Raya Pajajaran No. 12, Bogor", fuel: "Bensin", cc: "1329 cc", hp: "97 HP", madeYear: 2021, bbmNo: "6088-2210-4581-0193" },
  { id: "v3", plate: "B 9012 XYZ", brand: "Isuzu", model: "Elf NLR", year: 2020, km: 145230, dept: "Logistik", driver: "Cahyo Pratama", status: "maintenance", color: "Putih", engine: "4JJ1-7781", chassis: "MPATFR77L1230987", loc: "Gudang Cibinong", health: 52, buyDate: "2020-01-10", buyPrice: 420000000, owner: "CV Armada Mitra", ownerKind: "vendor", address: "Kawasan Gudang Cibinong Blok D-4", fuel: "Solar", cc: "2999 cc", hp: "150 HP", madeYear: 2020, bbmNo: "6088-2210-4581-0194" },
  { id: "v4", plate: "F 3344 GHI", brand: "Honda", model: "HR-V", year: 2023, km: 28410, dept: "Direksi", driver: "Dedi Kurniawan", status: "ready", color: "Hitam", engine: "L15ZF-2201", chassis: "MHRZE1850PJ12345", loc: "Kantor Pusat Bogor", health: 94, buyDate: "2023-02-01", buyPrice: 410000000, owner: "PT SIG Holding", ownerKind: "sig", address: "Jl. Raya Pajajaran No. 12, Bogor", fuel: "Bensin", cc: "1498 cc", hp: "119 HP", madeYear: 2023, bbmNo: "6088-2210-4581-0195" },
  { id: "v5", plate: "F 7788 JKL", brand: "Mitsubishi", model: "Xpander", year: 2022, km: 67120, dept: "Marketing", driver: "Eko Nugroho", status: "ready", color: "Abu-abu", engine: "4A91-5510", chassis: "MMBMAU13SNJ66778", loc: "Kantor Cabang Depok", health: 81, buyDate: "2022-09-12", buyPrice: 278000000, owner: "PT SIG Operasional", ownerKind: "sig", address: "Jl. Margonda Raya 88, Depok", fuel: "Bensin", cc: "1499 cc", hp: "104 HP", madeYear: 2022, bbmNo: "6088-2210-4581-0196" },
  { id: "v6", plate: "B 2211 MNO", brand: "Daihatsu", model: "Gran Max", year: 2019, km: 168900, dept: "Logistik", driver: "Fajar Hidayat", status: "warning", color: "Putih", engine: "K3-VE-9901", chassis: "MHKAA1BA5K001122", loc: "Gudang Cibinong", health: 58, buyDate: "2019-05-08", buyPrice: 165000000, owner: "Rental Jaya Bogor", ownerKind: "vendor", address: "Kawasan Gudang Cibinong Blok D-4", fuel: "Bensin", cc: "1495 cc", hp: "97 HP", madeYear: 2019, bbmNo: "6088-2210-4581-0197" },
  { id: "v7", plate: "F 4455 PQR", brand: "Toyota", model: "Hiace", year: 2021, km: 98400, dept: "Operasional", driver: "Gilang Ramadhan", status: "ready", color: "Silver", engine: "2KD-FTV-3344", chassis: "JTFSH22P0K012987", loc: "Kantor Pusat Bogor", health: 76, buyDate: "2021-11-03", buyPrice: 545000000, owner: "PT SIG Operasional", ownerKind: "sig", address: "Jl. Raya Pajajaran No. 12, Bogor", fuel: "Solar", cc: "2494 cc", hp: "102 HP", madeYear: 2021, bbmNo: "6088-2210-4581-0198" },
  { id: "v8", plate: "B 8899 STU", brand: "Suzuki", model: "Carry", year: 2018, km: 201340, dept: "Logistik", driver: "Hendra Gunawan", status: "inactive", color: "Putih", engine: "K14B-1122", chassis: "MHYNC12S0J008811", loc: "Gudang Cibinong", health: 41, buyDate: "2018-04-22", buyPrice: 142000000, owner: "Rental Jaya Bogor", ownerKind: "vendor", address: "Kawasan Gudang Cibinong Blok D-4", fuel: "Bensin", cc: "1462 cc", hp: "95 HP", madeYear: 2018, bbmNo: "6088-2210-4581-0199" },
  ...buildExtraFleet(),
];

function buildExtraFleet(): Vehicle[] {
  const owner = "PT SIG Operasional";
  const addr = "Jl. Raya Pajajaran No. 12, Bogor";
  const rows: Vehicle[] = [];
  const add = (p: Partial<Vehicle> & Pick<Vehicle, "id" | "plate" | "brand" | "model" | "year" | "color">) => {
    rows.push({
      km: 40000,
      dept: "Operasional",
      driver: "Pool SIG",
      status: "ready",
      engine: "ENG-" + p.id.toUpperCase(),
      chassis: "CHS-" + p.id.toUpperCase(),
      loc: "Kantor Pusat Bogor",
      health: 85,
      buyDate: `${p.year}-03-01`,
      buyPrice: 250000000,
      owner,
      address: addr,
      fuel: "Bensin",
      cc: "1500 cc",
      hp: "104 HP",
      madeYear: p.year,
      bbmNo: "",
      ...p,
      ownerKind: p.ownerKind ?? "sig",
    });
  };
  ["B 1101 AVN", "B 1102 AVN", "B 1103 AVN", "B 1104 AVN", "B 1105 AVN"].forEach((plate, i) =>
    add({ id: `av21-${i + 1}`, plate, brand: "Toyota", model: "Avanza", year: 2021, color: ["Silver", "Putih", "Abu-abu", "Hitam", "Merah"][i], km: 78000 + i * 3100, driver: `Driver Avanza ${i + 1}`, health: 72 })
  );
  ["F 2201 INB", "F 2202 INB"].forEach((plate, i) =>
    add({ id: `inr-${i + 1}`, plate, brand: "Toyota", model: "Innova Reborn", year: 2022, color: "Hitam", km: 54000 + i * 8000, driver: `Driver Innova ${i + 1}`, dept: "General Affairs", health: 90, cc: "1998 cc", hp: "137 HP", buyPrice: 390000000 })
  );
  ["F 3301 XPD", "F 3302 XPD", "F 3303 XPD", "F 3304 XPD", "F 3305 XPD"].forEach((plate, i) =>
    add({ id: `xp-${i + 1}`, plate, brand: "Mitsubishi", model: "Xpander", year: 2022, color: "Abu-abu", km: 41000 + i * 2500, driver: `Driver Xpander ${i + 1}`, dept: "Marketing", health: 84, cc: "1499 cc" })
  );
  ["B 4401 LXO", "B 4402 LXO"].forEach((plate, i) =>
    add({ id: `lx-${i + 1}`, plate, brand: "Daihatsu", model: "Luxio", year: 2020, color: "Putih", km: 92000 + i * 4000, driver: `Driver Luxio ${i + 1}`, health: 70, cc: "1495 cc" })
  );
  ["B 5501 AAV", "B 5502 AAV", "B 5503 AAV", "B 5504 AAV", "B 5505 AAV"].forEach((plate, i) =>
    add({ id: `aan-${i + 1}`, plate, brand: "Toyota", model: "Avanza All New", year: 2021, color: "Putih", km: 36000 + i * 2200, driver: `Driver All New ${i + 1}`, health: 81 })
  );
  ["F 6601 CLH", "F 6602 CLH", "F 6603 CLH", "F 6604 CLH"].forEach((plate, i) =>
    add({ id: `clh-${i + 1}`, plate, brand: "Toyota", model: "Calya Type G", year: 2025, color: "Hitam", km: 4200 + i * 800, driver: `Driver Calya Hitam ${i + 1}`, health: 96, buyDate: "2025-02-10", madeYear: 2025 })
  );
  ["F 7701 CLP", "F 7702 CLP", "F 7703 CLP", "F 7704 CLP"].forEach((plate, i) =>
    add({ id: `clp-${i + 1}`, plate, brand: "Toyota", model: "Calya Type G", year: 2025, color: "Putih", km: 3800 + i * 700, driver: `Driver Calya Putih ${i + 1}`, health: 95, buyDate: "2025-02-12", madeYear: 2025 })
  );
  add({
    id: "pjs-1",
    plate: "F 8801 PJS",
    brand: "Mitsubishi",
    model: "Pajero Sport",
    year: 2022,
    color: "Hitam",
    km: 31200,
    driver: "Dedi Kurniawan",
    dept: "Direksi",
    health: 91,
    fuel: "Solar",
    cc: "2442 cc",
    hp: "181 HP",
    buyPrice: 620000000,
  });
  return rows;
}

export const maintenance: Maintenance[] = [
  { id: "MT-2026-000123", vehicleId: "inr-1", date: "2026-09-10", type: "Service Berkala", km: 54000, shop: "Auto Service A", cost: 1250000, status: "selesai", complaint: "Servis rutin", action: "Ganti oli & filter", items: [{ name: "Oli Mesin", qty: 5, price: 120000 }, { name: "Filter Oli", qty: 1, price: 85000 }, { name: "Filter Udara", qty: 1, price: 150000 }] },
  { id: "MT-2026-000122", vehicleId: "pjs-1", date: "2026-09-09", type: "Service AC", km: 31200, shop: "Auto Service B", cost: 2750000, status: "proses", complaint: "AC tidak dingin", action: "Isi freon, cek kompresor", items: [{ name: "Freon", qty: 1, price: 450000 }, { name: "Kompresor AC", qty: 1, price: 1850000 }] },
  { id: "MT-2026-000121", vehicleId: "av21-1", date: "2026-09-08", type: "Ganti Rem", km: 78000, shop: "Auto Service A", cost: 1850000, status: "selesai", complaint: "Rem kurang pakem", action: "Ganti kampas & cakram", items: [{ name: "Kampas Rem", qty: 1, price: 650000 }, { name: "Cakram", qty: 2, price: 420000 }] },
  { id: "MT-2026-000088", vehicleId: "inr-1", date: "2026-06-15", type: "Perbaikan AC", km: 48000, shop: "Auto Service B", cost: 2750000, status: "selesai", complaint: "AC kurang dingin", action: "Ganti kompresor", items: [{ name: "Kompresor AC", qty: 1, price: 1850000 }] },
  { id: "MT-2026-000060", vehicleId: "inr-2", date: "2026-03-20", type: "Penggantian Rem", km: 62000, shop: "Auto Service A", cost: 1850000, status: "selesai", complaint: "Rem blong ringan", action: "Ganti kampas", items: [{ name: "Kampas Rem", qty: 1, price: 650000 }] },
  { id: "MT-2026-000055", vehicleId: "xp-1", date: "2026-08-22", type: "Ganti Oli", km: 41000, shop: "Bengkel Resmi Mitsubishi", cost: 890000, status: "selesai", complaint: "Rutin", action: "Ganti oli", items: [{ name: "Oli Mesin", qty: 4, price: 135000 }] },
  { id: "MT-2026-000040", vehicleId: "aan-1", date: "2026-08-01", type: "Service Berkala", km: 36000, shop: "Auto Service A", cost: 2100000, status: "selesai", complaint: "Rutin", action: "Full service", items: [{ name: "Oli Mesin", qty: 7, price: 140000 }] },
  { id: "MT-2026-000033", vehicleId: "lx-1", date: "2026-07-12", type: "Ganti Ban", km: 92000, shop: "Ban Center Bogor", cost: 4200000, status: "selesai", complaint: "Ban aus", action: "Ganti 4 ban", items: [{ name: "Ban 165R13", qty: 4, price: 850000 }] },
  { id: "MT-2026-000030", vehicleId: "clh-1", date: "2026-06-02", type: "Ganti Ban", km: 4200, shop: "Ban Center Bogor", cost: 3800000, status: "selesai", complaint: "Ban pecah", action: "Ganti 4 ban", items: [{ name: "Ban", qty: 4, price: 800000 }] },
  { id: "MT-2026-000028", vehicleId: "xp-2", date: "2026-05-11", type: "Ganti Ban", km: 43500, shop: "Ban Center Bogor", cost: 5600000, status: "selesai", complaint: "Aus", action: "Ganti 4 ban", items: [{ name: "Ban", qty: 4, price: 850000 }] },
  { id: "MT-2026-000021", vehicleId: "av21-2", date: "2026-02-14", type: "Ganti Oli", km: 81100, shop: "Auto Service A", cost: 780000, status: "selesai", complaint: "Rutin", action: "Ganti oli", items: [{ name: "Oli Mesin", qty: 4, price: 120000 }] },
  { id: "MT-2026-000018", vehicleId: "clp-1", date: "2026-01-20", type: "Service Berkala", km: 3800, shop: "Auto Service A", cost: 1950000, status: "selesai", complaint: "Rutin", action: "Full service", items: [{ name: "Oli Mesin", qty: 4, price: 110000 }] },
];

export const documents = [
  { vehicleId: "v1", type: "STNK", expire: "2027-02-15", status: "aktif" },
  { vehicleId: "v1", type: "Asuransi", expire: "2026-12-31", status: "aktif" },
  { vehicleId: "v1", type: "Pajak", expire: "2027-02-15", status: "aktif" },
  { vehicleId: "v2", type: "STNK", expire: "2026-10-05", status: "segera" },
  { vehicleId: "v2", type: "Pajak", expire: "2026-10-05", status: "segera" },
  { vehicleId: "v2", type: "Asuransi", expire: "2026-12-01", status: "aktif" },
];

export const workshops = [
  { id: "w1", name: "Auto Service A", city: "Bogor", phone: "0251-123456" },
  { id: "w2", name: "Auto Service B", city: "Bogor", phone: "0251-654321" },
  { id: "w3", name: "Honda Plaza", city: "Jakarta", phone: "021-889900" },
  { id: "w4", name: "Ban Center Bogor", city: "Bogor", phone: "0251-778899" },
];

export const drivers = [
  { id: "d1", name: "Andi Wijaya", phone: "0812-1111-2222", vehicle: "B 1234 ABC" },
  { id: "d2", name: "Budi Santoso", phone: "0813-3333-4444", vehicle: "B 5678 DEF" },
  { id: "d3", name: "Cahyo Pratama", phone: "0815-5555-6666", vehicle: "B 9012 XYZ" },
  { id: "d4", name: "Dedi Kurniawan", phone: "0812-7777-8888", vehicle: "F 3344 GHI" },
];

export const backupHistory = [
  { date: "12 Sep 2026 23:00", status: "SUCCESS", size: "245 MB" },
  { date: "11 Sep 2026 23:00", status: "SUCCESS", size: "244 MB" },
  { date: "10 Sep 2026 23:00", status: "SUCCESS", size: "243 MB" },
];

export const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
export const fmtN = (n: number) => new Intl.NumberFormat("id-ID").format(n);

export function vehiclePhoto(v: { model: string; brand?: string; color?: string; photo?: string }) {
  if (v.photo) return v.photo;
  const m = v.model.toLowerCase();
  const c = (v.color || "").toLowerCase();
  if (m.includes("pajero")) return "/images/pajero.jpg";
  if (m.includes("luxio")) return "/images/luxio.jpg";
  if (m.includes("calya") && (c.includes("hitam") || c.includes("black"))) return "/images/calya-black.jpg";
  if (m.includes("calya")) return "/images/calya-white.jpg";
  if (m.includes("reborn") || (m.includes("innova") && (c.includes("hitam") || c.includes("black")))) return "/images/innova-black.jpg";
  if (m.includes("innova")) return "/images/innova.jpg";
  if (m.includes("all new") || (m.includes("avanza") && (c.includes("putih") || c.includes("white")))) return "/images/avanza-white.jpg";
  if (m.includes("avanza")) return "/images/avanza.jpg";
  if (m.includes("elf")) return "/images/elf.jpg";
  if (m.includes("hr-v") || m.includes("hrv")) return "/images/hrv.jpg";
  if (m.includes("xpander")) return "/images/xpander.jpg";
  if (m.includes("hiace")) return "/images/hiace.jpg";
  if (m.includes("carry") || m.includes("gran")) return "/images/carry.jpg";
  return "/images/innova.jpg";
}

export function inferOwnerKind(v: { ownerKind?: OwnerKind; owner?: string }): OwnerKind {
  if (v.ownerKind === "vendor" || v.ownerKind === "sig") return v.ownerKind;
  const o = (v.owner || "").toLowerCase();
  if (o.includes("rental") || o.includes("vendor") || o.includes("mitra")) return "vendor";
  return "sig";
}

export function ownerKindLabel(k: OwnerKind) {
  return k === "vendor" ? "Vendor / Rental" : "PT SIG";
}

export const SERVICE_INTERVAL_KM = 10000;

export function dueServiceKm(v: { km: number; nextServiceKm?: number }) {
  if (v.nextServiceKm && v.nextServiceKm > 0) return v.nextServiceKm;
  return v.km + SERVICE_INTERVAL_KM;
}

export function kmToService(v: { km: number; nextServiceKm?: number }) {
  return dueServiceKm(v) - v.km;
}

/** Health 25–99 dari umur, KM, jadwal servis, WO, dokumen, status. */
export function computeVehicleHealth(v: Vehicle, jobs: Maintenance[] = []): number {
  let s = 100;
  const nowY = new Date().getFullYear();
  const age = Math.max(0, nowY - (v.year || v.madeYear || nowY));
  s -= Math.min(20, age * 2.5);
  s -= Math.min(25, (Math.max(0, v.km) / 10000) * 1.5);
  const left = kmToService(v);
  if (left <= 0) s -= 12;
  else if (left < 1000) s -= 6;
  const mine = jobs.filter((j) => j.vehicleId === v.id);
  if (mine.some((j) => j.status === "proses")) s -= 10;
  const cutoff = Date.now() - 365 * 86400000;
  const yearDone = mine.filter((j) => j.status === "selesai" && new Date(j.date).getTime() >= cutoff);
  s -= Math.min(15, Math.max(0, yearDone.length - 2) * 3);
  const spend = yearDone.reduce((a, j) => a + woTotal(j), 0);
  if (spend > 15_000_000) s -= 10;
  else if (spend > 8_000_000) s -= 5;
  const docs = v.documents?.length ? v.documents : [];
  if (docs.some((d) => (d.status || docStatusFromExpire(d.expire)) === "expired")) s -= 5;
  if (v.status === "inactive") s -= 15;
  return Math.max(25, Math.min(99, Math.round(s)));
}

export const statusMap: Record<Status, { label: string; cls: string }> = {
  ready: { label: "Ready", cls: "bg-emerald-50 text-emerald-700" },
  warning: { label: "Warning", cls: "bg-amber-50 text-amber-700" },
  maintenance: { label: "Maintenance", cls: "bg-red-50 text-red-700" },
  inactive: { label: "Inactive", cls: "bg-slate-100 text-slate-600" },
};
