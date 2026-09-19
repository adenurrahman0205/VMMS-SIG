import { computeVehicleHealth, ensureCoreDocs, dueServiceKm, inferOwnerKind, vehicles as seed, type Maintenance, type Status, type Vehicle } from "./data";
import { createBrowserSupabase } from "./supabase/client";
import { pushCloud } from "./services/sync.service";

const KEY = "vmms-armada-v3";

function jobsFromStorage(): Maintenance[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("vmms-maintenance-v2") || localStorage.getItem("vmms-maintenance-v1");
    if (!raw) return [];
    const p = JSON.parse(raw) as Maintenance[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function withHealth(v: Vehicle, jobs: Maintenance[]): Vehicle {
  return { ...v, health: computeVehicleHealth(v, jobs) };
}

export function loadFleet(): Vehicle[] {
  const jobs = jobsFromStorage();
  if (typeof window === "undefined") return seed.map((v) => withHealth(v, []));
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Vehicle[];
      if (Array.isArray(parsed) && parsed.length) {
        const next = parsed.map((v) =>
          withHealth(
            {
              ...v,
              ownerKind: inferOwnerKind(v),
              nextServiceKm: dueServiceKm(v),
              transmission: v.transmission === "manual" ? "manual" : "matic",
              documents: ensureCoreDocs(v),
              jabatan: v.jabatan ?? "",
            },
            jobs
          )
        );
        const needPajak = parsed.some((v) =>
          !(v.documents ?? []).some((d) => d.type.trim().toLowerCase() === "pajak" && Number(d.amount) > 0)
        );
        if (needPajak) saveFleet(next);
        return next;
      }
    }
  } catch {
    /* ignore */
  }
  return seed.map((v) => withHealth({ ...v, documents: ensureCoreDocs(v) }, jobs));
}

export function saveFleet(rows: Vehicle[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  void pushCloud("fleet", rows);
}

export function blankVehicle(): Vehicle {
  return {
    id: `v${Date.now()}`,
    plate: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    km: 0,
    dept: "",
    jabatan: "",
    driver: "",
    status: "ready",
    color: "",
    engine: "",
    chassis: "",
    loc: "",
    health: 80,
    buyDate: "",
    buyPrice: 0,
    owner: "PT SIG Operasional",
    ownerKind: "sig",
    address: "",
    fuel: "Bensin",
    cc: "",
    hp: "",
    madeYear: new Date().getFullYear(),
    bbmNo: "",
    bbmImage: "",
    photo: "",
    nextServiceKm: 10000,
  };
}

export async function syncCreate(v: Vehicle) {
  const sb = createBrowserSupabase();
  if (!sb) return;
  await sb.from("vehicles").insert({
    vehicle_code: v.plate.replace(/\s/g, "-"),
    plate_number: v.plate,
    brand: v.brand,
    model: v.model,
    year: v.year,
    color: v.color,
    engine_number: v.engine,
    chassis_number: v.chassis,
    current_odometer: v.km,
    initial_odometer: v.km,
    status: v.status.toUpperCase(),
    active: true,
  });
}

export async function syncUpdate(v: Vehicle) {
  const sb = createBrowserSupabase();
  if (!sb) return;
  const looksUuid = v.id.includes("-") && v.id.length > 20;
  if (!looksUuid) return;
  await sb
    .from("vehicles")
    .update({
      plate_number: v.plate,
      brand: v.brand,
      model: v.model,
      year: v.year,
      color: v.color,
      engine_number: v.engine,
      chassis_number: v.chassis,
      current_odometer: v.km,
      status: v.status.toUpperCase(),
    })
    .eq("id", v.id);
}

export async function syncArchive(id: string) {
  const sb = createBrowserSupabase();
  if (!sb) return;
  if (!(id.includes("-") && id.length > 20)) return;
  await sb.from("vehicles").update({ active: false, status: "INACTIVE" }).eq("id", id);
}

export const statuses: Status[] = ["ready", "warning", "maintenance", "inactive"];
