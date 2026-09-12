"use client";
import Link from "next/link";
import { Card, Shell } from "@/components/shell";
import { fmt, fmtN, maintenance, vehicles } from "@/lib/data";

export default function Biaya() {
  const rows = vehicles
    .map((v) => ({ ...v, c: maintenance.filter((m) => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0) }))
    .sort((a, b) => b.c - a.c);
  return (
    <Shell title="Biaya & Analitik">
      <Card className="p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Top biaya maintenance</div>
        <table className="w-full text-sm">
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
      </Card>
    </Shell>
  );
}
