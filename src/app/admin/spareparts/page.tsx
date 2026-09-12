"use client";

import { useEffect, useState } from "react";
import { Card, Shell } from "@/components/shell";
import { fmt } from "@/lib/data";
import { masterService } from "@/lib/services/master.service";

type Row = { id: string; part_code: string; part_name: string; stock: number; default_price: number; minimum_stock: number };

export default function SparePage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    masterService.spareparts().then((d) => setRows(d as Row[])).catch(() => setRows([]));
  }, []);
  return (
    <Shell title="Sparepart">
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>{["Kode", "Nama", "Stok", "Min", "Harga"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.part_code}</td>
                <td className="px-4 py-2">{p.part_name}</td>
                <td className="px-4 py-2">{p.stock}</td>
                <td className="px-4 py-2">{p.minimum_stock}</td>
                <td className="px-4 py-2">{fmt(Number(p.default_price))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}
