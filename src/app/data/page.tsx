"use client";

import { useState } from "react";
import { Badge, Card, Shell } from "@/components/shell";
import { backupHistory } from "@/lib/data";
import { downloadWorkbook, sqlDump, type Dataset } from "@/lib/export";
import { SearchSelect } from "@/components/search-select";

const sets: { id: Dataset; label: string }[] = [
  { id: "maintenance", label: "Maintenance" },
  { id: "kendaraan", label: "Kendaraan" },
  { id: "sparepart", label: "Sparepart" },
  { id: "biaya", label: "Biaya" },
  { id: "driver", label: "Driver" },
  { id: "bengkel", label: "Bengkel" },
  { id: "semua", label: "Semua Data" },
];

export default function DataBackupPage() {
  const [sel, setSel] = useState<Dataset>("semua");
  const [fmt, setFmt] = useState<"xlsx" | "csv" | "json">("xlsx");
  const [msg, setMsg] = useState("");

  return (
    <Shell title="Data & Backup">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Export Data</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {sets.map((s) => (
              <button
                key={s.id}
                onClick={() => setSel(s.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${sel === s.id ? "border-[#0b1f3a] bg-[#0b1f3a] !text-white" : "border-slate-200"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <label className="text-xs text-slate-500">Format</label>
          <select value={fmt} onChange={(e) => setFmt(e.target.value as typeof fmt)} className="mt-1 mb-4 block w-full rounded-lg border border-slate-200 px-2 py-2 text-sm">
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
          <button className="rounded-lg bg-[#2f80ed] px-4 py-2 text-sm font-semibold !text-white" onClick={() => downloadWorkbook(sel, fmt)}>
            EXPORT DATA
          </button>
          <button className="ml-2 rounded-lg border border-slate-200 px-4 py-2 text-sm" onClick={sqlDump}>
            Download SQL dump
          </button>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Last Backup</div>
          <div className="mt-1 text-lg font-semibold">12 September 2026 — 23:00</div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            Status <Badge status="SUCCESS" />
          </div>
          <button
            className="mt-4 rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold !text-white"
            onClick={() => setMsg("Backup demo dibuat: snapshot JSON + log SUCCESS.")}
          >
            BACKUP NOW
          </button>
          {msg && <p className="mt-3 text-sm text-emerald-700">{msg}</p>}
          <h3 className="mb-2 mt-6 text-sm font-semibold">Backup History</h3>
          <ul className="space-y-2 text-sm">
            {backupHistory.map((b) => (
              <li key={b.date} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span>{b.date}</span>
                <span className="text-slate-500">{b.size}</span>
                <Badge status={b.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Shell>
  );
}
