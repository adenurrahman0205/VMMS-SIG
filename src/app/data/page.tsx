"use client";

import { useState } from "react";
import { Card, Shell } from "@/components/shell";
import { downloadWorkbook, sqlDump, type Dataset } from "@/lib/export";

const sets: { id: Dataset; label: string }[] = [
  { id: "maintenance", label: "Maintenance" },
  { id: "kendaraan", label: "Kendaraan" },
  { id: "sparepart", label: "Sparepart" },
  { id: "biaya", label: "Biaya" },
  { id: "driver", label: "Driver" },
  { id: "bengkel", label: "Bengkel" },
  { id: "semua", label: "Semua Data" },
];

export default function DataPage() {
  const [sel, setSel] = useState<Dataset>("semua");
  const [fmt, setFmt] = useState<"xlsx" | "csv" | "json">("xlsx");
  return (
    <Shell title="Data Management — Export">
      <div className="grid max-w-xl gap-4">
        <Card>
          <h2 className="mb-3 font-semibold">Export Data</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {sets.map((s) => (
              <button
                key={s.id}
                onClick={() => setSel(s.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${sel === s.id ? "border-[#0b1f3a] bg-[#0b1f3a] text-white" : "border-slate-200"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <label className="text-xs text-slate-500">Periode</label>
          <div className="mb-3 mt-1 flex gap-2">
            <input type="date" defaultValue="2026-01-01" className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
            <input type="date" defaultValue="2026-12-31" className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
          </div>
          <label className="text-xs text-slate-500">Format</label>
          <select value={fmt} onChange={(e) => setFmt(e.target.value as typeof fmt)} className="mt-1 mb-4 block rounded-lg border border-slate-200 px-2 py-2 text-sm">
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
          <button className="rounded-lg bg-[#2f80ed] px-4 py-2 text-sm font-semibold text-white" onClick={() => downloadWorkbook(sel, fmt)}>
            EXPORT DATA
          </button>
          <button className="ml-2 rounded-lg border border-slate-200 px-4 py-2 text-sm" onClick={sqlDump}>
            Download SQL dump
          </button>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Format portable: Excel / CSV / JSON / SQL — bisa dibuka di Excel, Power BI, Tableau, Python, atau diimpor ke Postgres kantor / AWS / Azure tanpa tergantung Supabase.
          </p>
        </Card>
      </div>
    </Shell>
  );
}
