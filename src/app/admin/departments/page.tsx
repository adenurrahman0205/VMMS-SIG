"use client";

import { useEffect, useState } from "react";
import { Card, Shell } from "@/components/shell";
import { masterService } from "@/lib/services/master.service";

type Row = { id: string; department_code: string; name: string };

export default function DeptPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    masterService.departments().then((d) => setRows(d as Row[])).catch(() => setRows([]));
  }, []);
  return (
    <Shell title="Departemen">
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>{["Kode", "Nama"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-2">{d.department_code}</td>
                <td className="px-4 py-2">{d.name}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="px-4 py-6 text-slate-500" colSpan={2}>Kosong atau RLS — silakan login.</td></tr>}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}
