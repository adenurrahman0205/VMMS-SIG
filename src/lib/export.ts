import * as XLSX from "xlsx";
import { documents, drivers, maintenance, vehicles, workshops } from "./data";

export type Dataset =
  | "kendaraan"
  | "maintenance"
  | "sparepart"
  | "biaya"
  | "driver"
  | "bengkel"
  | "semua";

function sheets() {
  const kendaraan = vehicles.map((v) => ({
    plate: v.plate, brand: v.brand, model: v.model, year: v.year, km: v.km,
    dept: v.dept, driver: v.driver, status: v.status, health: v.health, location: v.loc,
  }));
  const mnt = maintenance.map((m) => {
    const v = vehicles.find((x) => x.id === m.vehicleId);
    return { id: m.id, date: m.date, plate: v?.plate, type: m.type, km: m.km, shop: m.shop, cost: m.cost, status: m.status };
  });
  const sparepart = maintenance.flatMap((m) =>
    m.items.map((it) => ({ maintenance_id: m.id, date: m.date, name: it.name, qty: it.qty, unit_price: it.price, total: it.qty * it.price }))
  );
  const biaya = mnt;
  return { kendaraan, maintenance: mnt, sparepart, biaya, driver: drivers, bengkel: workshops };
}

export function downloadWorkbook(dataset: Dataset, format: "xlsx" | "csv" | "json") {
  const all = sheets();
  const pick: Record<string, unknown[]> =
    dataset === "semua"
      ? all
      : { [dataset]: all[dataset as keyof typeof all] };

  if (format === "json") {
    const blob = new Blob([JSON.stringify(pick, null, 2)], { type: "application/json" });
    save(blob, `${dataset}_2026.json`);
    return;
  }

  const wb = XLSX.utils.book_new();
  Object.entries(pick).forEach(([name, rows]) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });

  if (format === "csv") {
    const first = Object.values(pick)[0] ?? [];
    const ws = XLSX.utils.json_to_sheet(first);
    const csv = XLSX.utils.sheet_to_csv(ws);
    save(new Blob([csv], { type: "text/csv" }), `${dataset}_2026.csv`);
    return;
  }

  XLSX.writeFile(wb, `${dataset}_2026.xlsx`);
}

function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

export function sqlDump() {
  const lines = [
    "-- Portable SQL dump (demo)",
    ...vehicles.map(
      (v) =>
        `INSERT INTO vehicles (plate, brand, model, year, km, status) VALUES ('${v.plate}','${v.brand}','${v.model}',${v.year},${v.km},'${v.status}');`
    ),
  ];
  save(new Blob([lines.join("\n")], { type: "text/sql" }), "fleet_backup_2026.sql");
}

export { documents };
