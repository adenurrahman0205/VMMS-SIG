"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, Shell } from "@/components/shell";
import { fmt, fmtN, type Maintenance, type Vehicle } from "@/lib/data";
import { loadFleet } from "@/lib/fleet-store";
import { loadJobs } from "@/lib/maintenance-store";

export default function Biaya() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Maintenance[]>([]);
  useEffect(() => {
    setVehicles(loadFleet());
    setJobs(loadJobs());
  }, []);
  const rows = useMemo(
    () =>
      vehicles
        .map((v) => ({ ...v, c: jobs.filter((m) => m.vehicleId === v.id && m.status === "selesai").reduce((s, m) => s + m.cost, 0) }))
        .sort((a, b) => b.c - a.c),
    [vehicles, jobs]
  );
  return (
    <Shell title="Biaya & Analitik">
      <Card className="p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Top biaya maintenance</div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>{["Kendaraan", "KM", "Health", "Total", "Catatan"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-4 py-2"><Link href={`/kendaraan/${v.id}`}>{v.plate}</Link> {v.model}</td>
                <td className="px-4 py-2">{fmtN(v.km)}</td>
                <td className="px-4 py-2">{v.health}</td>
                <td className="px-4 py-2">{fmt(v.c)}</td>
                <td className="px-4 py-2">{v.health < 55 ? "Evaluasi penggantian unit" : "Masih ekonomis"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </Shell>
  );
}
