"use client";
import Link from "next/link";
import { Badge, Card, Shell } from "@/components/shell";
import { fmtN, vehicles } from "@/lib/data";

export default function Jadwal() {
  return (
    <Shell title="Jadwal Maintenance">
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase text-slate-500">
            <tr>{["Kendaraan", "KM", "Sisa ke 10.000", "Estimasi", "Prioritas"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {vehicles.map((v) => {
              const next = 10000 - (v.km % 10000);
              const soon = next < 1500 || v.status === "warning";
              return (
                <tr key={v.id} className="border-t">
                  <td className="px-4 py-2"><Link className="font-medium" href={`/kendaraan/${v.id}`}>{v.plate}</Link> {v.model}</td>
                  <td className="px-4 py-2">{fmtN(v.km)}</td>
                  <td className="px-4 py-2">{fmtN(next)} KM</td>
                  <td className="px-4 py-2">{fmtN(v.km + next)}</td>
                  <td className="px-4 py-2"><Badge status={soon ? "segera" : "ready"} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}
