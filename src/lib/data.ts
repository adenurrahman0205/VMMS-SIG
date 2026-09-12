export type Status = "ready" | "warning" | "maintenance" | "inactive";

export type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  km: number;
  dept: string;
  driver: string;
  status: Status;
  color: string;
  engine: string;
  chassis: string;
  loc: string;
  health: number;
  buyDate: string;
  buyPrice: number;
};

export type Maintenance = {
  id: string;
  vehicleId: string;
  date: string;
  type: string;
  km: number;
  shop: string;
  cost: number;
  status: "selesai" | "proses";
  complaint: string;
  action: string;
  items: { name: string; qty: number; price: number }[];
};

export const vehicles: Vehicle[] = [
  { id: "v1", plate: "B 1234 ABC", brand: "Toyota", model: "Innova", year: 2022, km: 85240, dept: "General Affairs", driver: "Andi Wijaya", status: "ready", color: "Silver", engine: "2TR-FE-8821", chassis: "MHFM1BA3N0123456", loc: "Kantor Pusat Bogor", health: 88, buyDate: "2022-03-15", buyPrice: 385000000 },
  { id: "v2", plate: "B 5678 DEF", brand: "Toyota", model: "Avanza", year: 2021, km: 102450, dept: "Operasional", driver: "Budi Santoso", status: "warning", color: "Putih", engine: "3SZ-VE-4412", chassis: "MHFM2BA2K0987654", loc: "Kantor Pusat Bogor", health: 64, buyDate: "2021-07-20", buyPrice: 235000000 },
  { id: "v3", plate: "B 9012 XYZ", brand: "Isuzu", model: "Elf NLR", year: 2020, km: 145230, dept: "Logistik", driver: "Cahyo Pratama", status: "maintenance", color: "Putih", engine: "4JJ1-7781", chassis: "MPATFR77L1230987", loc: "Gudang Cibinong", health: 52, buyDate: "2020-01-10", buyPrice: 420000000 },
  { id: "v4", plate: "F 3344 GHI", brand: "Honda", model: "HR-V", year: 2023, km: 28410, dept: "Direksi", driver: "Dedi Kurniawan", status: "ready", color: "Hitam", engine: "L15ZF-2201", chassis: "MHRZE1850PJ12345", loc: "Kantor Pusat Bogor", health: 94, buyDate: "2023-02-01", buyPrice: 410000000 },
  { id: "v5", plate: "F 7788 JKL", brand: "Mitsubishi", model: "Xpander", year: 2022, km: 67120, dept: "Marketing", driver: "Eko Nugroho", status: "ready", color: "Abu-abu", engine: "4A91-5510", chassis: "MMBMAU13SNJ66778", loc: "Kantor Cabang Depok", health: 81, buyDate: "2022-09-12", buyPrice: 278000000 },
  { id: "v6", plate: "B 2211 MNO", brand: "Daihatsu", model: "Gran Max", year: 2019, km: 168900, dept: "Logistik", driver: "Fajar Hidayat", status: "warning", color: "Putih", engine: "K3-VE-9901", chassis: "MHKAA1BA5K001122", loc: "Gudang Cibinong", health: 58, buyDate: "2019-05-08", buyPrice: 165000000 },
  { id: "v7", plate: "F 4455 PQR", brand: "Toyota", model: "Hiace", year: 2021, km: 98400, dept: "Operasional", driver: "Gilang Ramadhan", status: "ready", color: "Silver", engine: "2KD-FTV-3344", chassis: "JTFSH22P0K012987", loc: "Kantor Pusat Bogor", health: 76, buyDate: "2021-11-03", buyPrice: 545000000 },
  { id: "v8", plate: "B 8899 STU", brand: "Suzuki", model: "Carry", year: 2018, km: 201340, dept: "Logistik", driver: "Hendra Gunawan", status: "inactive", color: "Putih", engine: "K14B-1122", chassis: "MHYNC12S0J008811", loc: "Gudang Cibinong", health: 41, buyDate: "2018-04-22", buyPrice: 142000000 },
];

export const maintenance: Maintenance[] = [
  { id: "MT-2026-000123", vehicleId: "v1", date: "2026-09-10", type: "Service Berkala", km: 85240, shop: "Auto Service A", cost: 1250000, status: "selesai", complaint: "Servis rutin", action: "Ganti oli & filter", items: [{ name: "Oli Mesin", qty: 5, price: 120000 }, { name: "Filter Oli", qty: 1, price: 85000 }, { name: "Filter Udara", qty: 1, price: 150000 }] },
  { id: "MT-2026-000122", vehicleId: "v3", date: "2026-09-09", type: "Service AC", km: 145230, shop: "Auto Service B", cost: 2750000, status: "proses", complaint: "AC tidak dingin", action: "Isi freon, cek kompresor", items: [{ name: "Freon", qty: 1, price: 450000 }, { name: "Kompresor AC", qty: 1, price: 1850000 }] },
  { id: "MT-2026-000121", vehicleId: "v2", date: "2026-09-08", type: "Ganti Rem", km: 102450, shop: "Auto Service A", cost: 1850000, status: "selesai", complaint: "Rem kurang pakem", action: "Ganti kampas & cakram", items: [{ name: "Kampas Rem", qty: 1, price: 650000 }, { name: "Cakram", qty: 2, price: 420000 }] },
  { id: "MT-2026-000088", vehicleId: "v1", date: "2026-06-15", type: "Perbaikan AC", km: 80120, shop: "Auto Service B", cost: 2750000, status: "selesai", complaint: "AC kurang dingin", action: "Ganti kompresor", items: [{ name: "Kompresor AC", qty: 1, price: 1850000 }] },
  { id: "MT-2026-000060", vehicleId: "v1", date: "2026-03-20", type: "Penggantian Rem", km: 75450, shop: "Auto Service A", cost: 1850000, status: "selesai", complaint: "Rem blong ringan", action: "Ganti kampas", items: [{ name: "Kampas Rem", qty: 1, price: 650000 }] },
  { id: "MT-2026-000055", vehicleId: "v5", date: "2026-08-22", type: "Ganti Oli", km: 67120, shop: "Bengkel Resmi Mitsubishi", cost: 890000, status: "selesai", complaint: "Rutin", action: "Ganti oli", items: [{ name: "Oli Mesin", qty: 4, price: 135000 }] },
  { id: "MT-2026-000040", vehicleId: "v7", date: "2026-08-01", type: "Service Berkala", km: 98400, shop: "Auto Service A", cost: 2100000, status: "selesai", complaint: "Rutin", action: "Full service", items: [{ name: "Oli Mesin", qty: 7, price: 140000 }] },
  { id: "MT-2026-000033", vehicleId: "v6", date: "2026-07-12", type: "Ganti Ban", km: 160000, shop: "Ban Center Bogor", cost: 4200000, status: "selesai", complaint: "Ban aus", action: "Ganti 4 ban", items: [{ name: "Ban 165R13", qty: 4, price: 850000 }] },
];

export const documents = [
  { vehicleId: "v1", type: "STNK", expire: "2027-02-15", status: "aktif" },
  { vehicleId: "v1", type: "KIR", expire: "2026-11-10", status: "segera" },
  { vehicleId: "v1", type: "Asuransi", expire: "2026-12-31", status: "aktif" },
  { vehicleId: "v2", type: "STNK", expire: "2026-10-05", status: "segera" },
  { vehicleId: "v3", type: "KIR", expire: "2026-09-25", status: "segera" },
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

export const statusMap: Record<Status, { label: string; cls: string }> = {
  ready: { label: "Ready", cls: "bg-emerald-50 text-emerald-700" },
  warning: { label: "Warning", cls: "bg-amber-50 text-amber-700" },
  maintenance: { label: "Maintenance", cls: "bg-red-50 text-red-700" },
  inactive: { label: "Inactive", cls: "bg-slate-100 text-slate-600" },
};
