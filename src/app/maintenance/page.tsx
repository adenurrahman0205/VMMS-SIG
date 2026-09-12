"use client";
import { Badge, Card, Shell } from "@/components/shell";
import { fmt, fmtN, maintenance, vehicles } from "@/lib/data";

export default function Mnt() {
  return (
    <Shell title="Data Maintenance">
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>{["ID", "Tanggal", "Kendaraan", "Jenis", "KM", "Bengkel", "Biaya", "Status"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {maintenance.map((m) => {
              const v = vehicles.find((x) => x.id === m.vehicleId)!;
              return (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">{m.id}</td>
                  <td className="px-4 py-2">{m.date}</td>
                  <td className="px-4 py-2">{v.plate}</td>
                  <td className="px-4 py-2">{m.type}</td>
                  <td className="px-4 py-2">{fmtN(m.km)}</td>
                  <td className="px-4 py-2">{m.shop}</td>
                  <td className="px-4 py-2">{fmt(m.cost)}</td>
                  <td className="px-4 py-2"><Badge status={m.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}
