"use client";

import { useEffect, useState } from "react";
import { Card, Shell } from "@/components/shell";
import { masterService } from "@/lib/services/master.service";

type Row = { id: string; workshop_code: string; name: string; phone: string | null };

export default function WorkshopsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ workshop_code: "", name: "", phone: "" });

  async function load() {
    try {
      setRows((await masterService.workshops()) as Row[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal memuat");
    }
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      await masterService.insertWorkshop(form);
      setForm({ workshop_code: "", name: "", phone: "" });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal simpan");
    }
  }

  return (
    <Shell title="Master Bengkel">
      <form className="mb-4 flex flex-wrap gap-2" onSubmit={add}>
        <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Kode" value={form.workshop_code} onChange={(e) => setForm({ ...form, workshop_code: e.target.value })} required />
        <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <button className="rounded-lg bg-[#2f80ed] px-4 py-2 text-sm text-white">Tambah</button>
      </form>
      {err && <p className="mb-2 text-sm text-amber-700">{err}</p>}
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>{["Kode", "Nama", "Telepon"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="px-4 py-2">{w.workshop_code}</td>
                <td className="px-4 py-2">{w.name}</td>
                <td className="px-4 py-2">{w.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}
