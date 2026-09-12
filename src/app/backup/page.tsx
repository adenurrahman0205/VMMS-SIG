"use client";

import { useState } from "react";
import { Badge, Card, Shell } from "@/components/shell";
import { backupHistory } from "@/lib/data";

export default function BackupPage() {
  const [msg, setMsg] = useState("");
  return (
    <Shell title="Backup Management">
      <div className="grid max-w-xl gap-4">
        <Card>
          <div className="text-xs text-slate-500">Last Backup</div>
          <div className="mt-1 text-lg font-semibold">12 September 2026 — 23:00</div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            Status <Badge status="SUCCESS" />
          </div>
          <div className="mt-3 text-sm text-slate-600">Database size: 245 MB (demo)</div>
          <p className="mt-2 text-xs text-slate-500">
            Daily backup 23:00 · Monthly archive 2026/01 … 12. Database ≠ file: invoice PDF ada di Storage.
          </p>
          <button
            className="mt-4 rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white"
            onClick={() => setMsg("Backup demo dibuat: snapshot JSON + log SUCCESS. Hubungkan Supabase pg_dump + Storage zip untuk produksi.")}
          >
            BACKUP NOW
          </button>
          {msg && <p className="mt-3 text-sm text-emerald-700">{msg}</p>}
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Backup History</h2>
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
