"use client";
import { Badge, Card, Shell } from "@/components/shell";
import { documents, vehicles } from "@/lib/data";

export default function Dokumen() {
  return (
    <Shell title="Dokumen Kendaraan">
      <p className="mb-3 text-sm text-slate-500">File (STNK/KIR/invoice) dirancang untuk Supabase Storage — terpisah dari PostgreSQL.</p>
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>{["Kendaraan", "Jenis", "Berlaku", "Status"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {documents.map((d, i) => {
              const v = vehicles.find((x) => x.id === d.vehicleId)!;
              return (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2">{v.plate} {v.model}</td>
                  <td className="px-4 py-2">{d.type}</td>
                  <td className="px-4 py-2">{d.expire}</td>
                  <td className="px-4 py-2"><Badge status={d.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}
