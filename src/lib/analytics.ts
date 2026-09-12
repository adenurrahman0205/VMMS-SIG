import { maintenance as seedJobs, vehicles, type Maintenance, type Vehicle } from "./data";
import { loadJobs } from "./maintenance-store";

function jobs(): Maintenance[] {
  if (typeof window === "undefined") return seedJobs;
  return loadJobs();
}

export function statsFor(v: Vehicle, list?: Maintenance[]) {
  const rows = (list ?? jobs()).filter((m) => m.vehicleId === v.id);
  const done = rows.filter((m) => m.status === "selesai");
  const cost = done.reduce((s, m) => s + m.cost, 0);
  const hit = (k: string) =>
    rows.filter((m) => `${m.type} ${m.items.map((i) => i.name).join(" ")}`.toLowerCase().includes(k)).length;
  return {
    cost,
    jobs: rows.length,
    ban: hit("ban"),
    oli: hit("oli"),
    rem: hit("rem") || hit("kampas"),
    ac: hit("ac") || hit("freon"),
    berkala: hit("berkala") || hit("service"),
  };
}

export function fleetRows() {
  return vehicles.map((v) => ({ ...v, ...statsFor(v) }));
}
