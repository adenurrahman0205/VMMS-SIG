"use client";

import { useEffect, useState } from "react";
import { Card, Shell } from "@/components/shell";
import { masterService } from "@/lib/services/master.service";

type Row = { id: string; employee_number: string; name: string; phone: string | null };

export default function DriversPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ employee_number: "", name: "", phone: "" });

  async function load() {
    try {
      setRows((await masterService.drivers()) as Row[]);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal memuat");
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      await masterService.insertDriver(form);
      setForm({ employee_number: "", name: "", phone: "" });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal simpan — login dulu");
    }
  }

  return (
    <Shell title="Master Driver">
      <form className="mb-4 flex flex-wrap gap-2" onSubmit={add}>
        <input className="rounded-lg border px-3 py-2 text-sm" placeholder="NIP" value={form.employee_number} onChange={(e) => setForm({ ...form, employee_number: e.target.value })} required />
        <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <button className="rounded-lg bg-[#2f80ed] px-4 py-2 text-sm text-white">Tambah</button>
      </form>
      {err && <p className="mb-2 text-sm text-amber-700">{err}</p>}
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>{["NIP", "Nama", "Telepon"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-2">{d.employee_number}</td>
                <td className="px-4 py-2">{d.name}</td>
                <td className="px-4 py-2">{d.phone}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-4 py-6 text-slate-500" colSpan={3}>Belum ada data (login SUPER_ADMIN / FLEET_ADMIN untuk menulis).</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}
