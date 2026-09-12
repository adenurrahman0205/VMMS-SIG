import { maintenance, vehicles, type Vehicle } from "./data";

export function statsFor(v: Vehicle) {
  const rows = maintenance.filter((m) => m.vehicleId === v.id);
  const cost = rows.reduce((s, m) => s + m.cost, 0);
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
