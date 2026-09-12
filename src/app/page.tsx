"use client";

import Link from "next/link";
import { Badge, Card, Shell } from "@/components/shell";
import { fmt, maintenance, vehicles } from "@/lib/data";

export default function Page() {
  const ready = vehicles.filter((v) => v.status === "ready").length;
  const warn = vehicles.filter((v) => v.status === "warning").length;
  const mnt = vehicles.filter((v) => v.status === "maintenance").length;
  const cost = maintenance.reduce((s, m) => s + m.cost, 0);
  const recent = [...maintenance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const kpis = [
    { l: "Total Kendaraan", v: String(vehicles.length), s: "Armada kantor", navy: true },
    { l: "Ready", v: String(ready), s: "Siap operasi" },
    { l: "Warning", v: String(warn), s: "Perlu perhatian" },
    { l: "Maintenance", v: String(mnt), s: "Di bengkel" },
  ];
  return (
    <Shell title="Dashboard">
      <div className="mb-4 grid grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.l} className={k.navy ? "border-0 bg-[#0b1f3a] text-white" : ""}>
            <div className={`text-xs ${k.navy ? "text-slate-300" : "text-slate-500"}`}>{k.l}</div>
            <div className="mt-1 text-2xl font-bold">{k.v}</div>
            <div className={`mt-1 text-xs ${k.navy ? "text-slate-400" : "text-slate-500"}`}>{k.s}</div>
          </Card>
        ))}
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card>
          <div className="text-xs text-slate-500">Total biaya (sample)</div>
          <div className="mt-1 text-xl font-bold">{fmt(cost)}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Rata-rata / kendaraan</div>
          <div className="mt-1 text-xl font-bold">{fmt(Math.round(cost / vehicles.length))}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Alert</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            ⚠ Avanza B 5678 DEF butuh service ±500 KM.
            <br />🔔 3 dokumen akan jatuh tempo &lt; 30 hari.
          </p>
        </Card>
      </div>
      <Card className="p-0">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Maintenance terbaru</div>
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              {["ID", "Tanggal", "Kendaraan", "Jenis", "Bengkel", "Biaya", "Status"].map((h) => (
                <th key={h} className="px-4 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((m) => {
              const v = vehicles.find((x) => x.id === m.vehicleId)!;
              return (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono text-xs">{m.id}</td>
                  <td className="px-4 py-2">{m.date}</td>
                  <td className="px-4 py-2">
                    <Link className="font-medium text-[#1a3d6d] underline" href={`/kendaraan/${v.id}`}>
                      {v.plate}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{m.type}</td>
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
