import { maintenance as seed, type Maintenance } from "./data";
import { loadFleet, saveFleet } from "./fleet-store";

const KEY = "vmms-maintenance-v1";

export function loadJobs(): Maintenance[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Maintenance[];
      if (Array.isArray(p) && p.length) return p;
    }
  } catch {
    /* ignore */
  }
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

export function saveJobs(rows: Maintenance[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
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
