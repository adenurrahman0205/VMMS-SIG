"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Card, Shell } from "@/components/shell";
import { fmtN, vehicles } from "@/lib/data";

export default function KendaraanPage() {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const list = useMemo(
    () =>
      vehicles.filter((v) => {
        const hit = `${v.plate} ${v.brand} ${v.model} ${v.driver}`.toLowerCase().includes(q.toLowerCase());
        return hit && (f === "all" || v.status === f);
      }),
    [q, f]
  );
  return (
    <Shell title="Daftar Kendaraan">
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="min-w-72 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          placeholder="Cari No Polisi / Merk / Model / Driver"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {(["all", "ready", "warning", "maintenance"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setF(k)}
            className={`rounded-full border px-3 py-1.5 text-xs ${f === k ? "border-[#0b1f3a] bg-[#0b1f3a] text-white" : "border-slate-200 bg-white"}`}
          >
            {k === "all" ? "Semua" : k}
          </button>
        ))}
      </div>
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase text-slate-500">
            <tr>
              {["No Polisi", "Kendaraan", "Tahun", "KM", "Dept", "Driver", "Health", "Status"].map((h) => (
                <th key={h} className="px-4 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <Link className="font-semibold text-[#1a3d6d]" href={`/kendaraan/${v.id}`}>{v.plate}</Link>
                </td>
                <td className="px-4 py-2">{v.brand} {v.model}</td>
                <td className="px-4 py-2">{v.year}</td>
                <td className="px-4 py-2">{fmtN(v.km)}</td>
                <td className="px-4 py-2">{v.dept}</td>
                <td className="px-4 py-2">{v.driver}</td>
                <td className="px-4 py-2">{v.health}/100</td>
                <td className="px-4 py-2"><Badge status={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}
