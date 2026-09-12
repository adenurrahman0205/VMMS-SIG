import { maintenance as seed, vehicles as seedVehicles, type Maintenance, type Vehicle } from "./data";
import { loadFleet, saveFleet } from "./fleet-store";
import { pushCloud } from "./services/sync.service";

const KEY = "vmms-maintenance-v2";
const LEGACY = "vmms-maintenance-v1";

/** Seed demo ids → unit Armada yang sekarang. */
const LEGACY_IDS: Record<string, string> = {
  v1: "inr-1",
  v2: "av21-1",
  v3: "pjs-1",
  v4: "inr-2",
  v5: "xp-1",
  v6: "lx-1",
  v7: "aan-1",
  v8: "clh-1",
};

export function findFleetUnit(fleet: Vehicle[], vehicleId: string): Vehicle | undefined {
  if (!vehicleId) return undefined;
  const compact = vehicleId.replace(/\s/g, "").toLowerCase();
  return (
    fleet.find((v) => v.id === vehicleId) ||
    fleet.find((v) => v.plate.replace(/\s/g, "").toLowerCase() === compact) ||
    undefined
  );
}

function matchToFleet(vehicleId: string, fleet: Vehicle[]): string {
  const live = findFleetUnit(fleet, vehicleId);
  if (live) return live.id;
  const mapped = LEGACY_IDS[vehicleId];
  if (mapped && findFleetUnit(fleet, mapped)) return mapped;
  const seedV = seedVehicles.find((v) => v.id === vehicleId);
  if (seedV) {
    const plate = seedV.plate.replace(/\s/g, "").toLowerCase();
    const byPlate = fleet.find((v) => v.plate.replace(/\s/g, "").toLowerCase() === plate);
    if (byPlate) return byPlate.id;
    const token = seedV.model.toLowerCase().split(" ")[0];
    const byModel = fleet.find((v) => v.model.toLowerCase().includes(token) && v.brand === seedV.brand);
    if (byModel) return byModel.id;
  }
  return vehicleId;
}

function alignJobs(rows: Maintenance[], fleet: Vehicle[]): Maintenance[] {
  if (!fleet.length) return rows;
  return rows
    .map((j) => ({ ...j, vehicleId: matchToFleet(j.vehicleId, fleet) }))
    .filter((j) => fleet.some((v) => v.id === j.vehicleId));
}

export function loadJobs(): Maintenance[] {
  if (typeof window === "undefined") return seed;
  const fleet = loadFleet();
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(LEGACY);
    if (raw) {
      const p = JSON.parse(raw) as Maintenance[];
      if (Array.isArray(p)) return alignJobs(p, fleet);
    }
  } catch {
    /* ignore */
  }
  return alignJobs(seed, fleet);
}

export function saveJobs(rows: Maintenance[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  void pushCloud("jobs", rows);
  syncVehicleFromJobs(rows);
}

export function blankJob(vehicleId = ""): Maintenance {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return {
    id: `MT-${y}-${String(Date.now()).slice(-6)}`,
    vehicleId,
    date: `${y}-${m}-${day}`,
    type: "Service Berkala",
    km: 0,
    shop: "",
    cost: 0,
    status: "proses",
    complaint: "",
    action: "",
    items: [],
  };
}

function syncVehicleFromJobs(rows: Maintenance[]) {
  const fleet = loadFleet();
  const prosesIds = new Set(rows.filter((j) => j.status === "proses").map((j) => j.vehicleId));
  const next = fleet.map((v) => {
    if (prosesIds.has(v.id)) return { ...v, status: "maintenance" as const };
    if (v.status === "maintenance") return { ...v, status: "ready" as const };
    return v;
  });
  saveFleet(next);
}
