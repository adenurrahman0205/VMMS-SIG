import { inferOwnerKind, vehicles as seed, type Status, type Vehicle } from "./data";
import { createBrowserSupabase } from "./supabase/client";

const KEY = "vmms-armada-v3";

export function loadFleet(): Vehicle[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Vehicle[];
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((v) => ({ ...v, ownerKind: inferOwnerKind(v) }));
      }
    }
  } catch {
    /* ignore */
  }
  return seed;
}

export function saveFleet(rows: Vehicle[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
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
