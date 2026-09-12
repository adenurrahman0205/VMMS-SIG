"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Shell } from "@/components/shell";
import { fmt, fmtN, vehiclePhoto, type Maintenance, type Vehicle } from "@/lib/data";
import { loadFleet } from "@/lib/fleet-store";
import { blankJob, loadJobs, saveJobs } from "@/lib/maintenance-store";

const TYPES = ["Service Berkala", "Ganti Oli", "Ganti Rem", "Service AC", "Ganti Ban", "Perbaikan Lain"];

export default function Mnt() {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Maintenance[]>([]);
  const [q, setQ] = useState("");
  const [st, setSt] = useState<"all" | "proses" | "selesai">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [editor, setEditor] = useState<Maintenance | null>(null);

  useEffect(() => {
    setFleet(loadFleet());
    setJobs(loadJobs());
  }, []);

  function persist(next: Maintenance[]) {
    saveJobs(next);
    setJobs(next);
    setFleet(loadFleet());
  }

  function setJobStatus(id: string, status: Maintenance["status"]) {
    persist(jobs.map((j) => (j.id === id ? { ...j, status } : j)));
  }

  const stats = useMemo(() => {
    const proses = jobs.filter((j) => j.status === "proses");
    const selesai = jobs.filter((j) => j.status === "selesai");
    const cost = jobs.reduce((s, j) => s + j.cost, 0);
    return { n: jobs.length, proses: proses.length, selesai: selesai.length, cost };
  }, [jobs]);

  const list = useMemo(() => {
    return jobs
      .filter((j) => {
        const v = fleet.find((x) => x.id === j.vehicleId);
        const blob = `${j.id} ${j.type} ${j.shop} ${j.complaint} ${v?.plate} ${v?.model}`.toLowerCase();
        return blob.includes(q.toLowerCase()) && (st === "all" || j.status === st);
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [jobs, fleet, q, st]);

  function saveEditor(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    const cost = editor.items.reduce((s, it) => s + it.qty * it.price, 0) || editor.cost;
    const row = { ...editor, cost };
    const exists = jobs.some((j) => j.id === row.id);
    persist(exists ? jobs.map((j) => (j.id === row.id ? row : j)) : [row, ...jobs]);
    setEditor(null);
  }

  return (
    <Shell title="Data Maintenance">
      <section className="anim relative mb-6 overflow-hidden rounded-3xl">
        <img src="/images/hero-fleet.png" alt="" className="h-36 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071526] via-[#071526]/80 to-transparent" />
        <div className="absolute inset-0 flex items-end justify-between p-6 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-sky-300">Workshop control</p>
            <h2 className="text-2xl font-semibold">Histori servis & work order</h2>
            <p className="text-sm text-slate-300">Status proses otomatis menandai unit Sedang Maintenance di Armada & Jadwal.</p>
          </div>
          <button
            type="button"
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold !text-white"
            onClick={() => setEditor(blankJob(fleet[0]?.id ?? ""))}
          >
            + Work order
          </button>
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Semua WO", stats.n, "catatan servis"],
          ["Sedang proses", stats.proses, "unit di bengkel"],
          ["Selesai", stats.selesai, "histori tertutup"],
          ["Total biaya", fmt(stats.cost), "semua WO"],
        ].map(([l, n, s]) => (
          <div key={String(l)} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{l}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{n}</div>
            <div className="text-xs text-slate-400">{s}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "proses", "selesai"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setSt(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              st === k ? "bg-[#071526] !text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {k === "all" ? "Semua status" : k === "proses" ? "Proses" : "Selesai"}
          </button>
        ))}
        <div className="ml-auto flex min-w-[220px] flex-1 items-center rounded-2xl border bg-white px-3 py-2">
          <span className="mr-2 text-slate-400">⌕</span>
          <input className="w-full text-sm outline-none" placeholder="Cari plat, jenis, bengkel…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {["Work order", "Unit", "Jenis", "KM", "Bengkel", "Keluhan", "Biaya", "Status", ""].map((h) => (
                  <th key={h || "x"} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">Tidak ada work order.</td>
                </tr>
              )}
              {list.map((m) => {
                const v = fleet.find((x) => x.id === m.vehicleId);
                const shown = open === m.id;
                return (
                  <Fragment key={m.id}>
                    <tr className="border-t border-slate-100 hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] text-slate-500">{m.id}</div>
                        <div className="font-medium">{m.date}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={v ? `/kendaraan/${v.id}` : "/kendaraan"} className="flex items-center gap-2">
                          <img src={vehiclePhoto(v ?? { model: "" })} alt="" className="h-10 w-14 rounded-lg object-cover" />
                          <span>
                            <span className="block font-semibold">{v?.plate ?? m.vehicleId}</span>
                            <span className="text-xs text-slate-500">{v ? `${v.brand} ${v.model}` : ""}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">{m.type}</td>
                      <td className="px-4 py-3">{fmtN(m.km)}</td>
                      <td className="px-4 py-3">{m.shop || "—"}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-slate-600">{m.complaint || "—"}</td>
                      <td className="px-4 py-3 font-semibold">{fmt(m.cost)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={m.status}
                          onChange={(e) => setJobStatus(m.id, e.target.value as Maintenance["status"])}
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            m.status === "proses" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          <option value="proses">Proses</option>
                          <option value="selesai">Selesai</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs font-semibold text-sky-700" onClick={() => setOpen(shown ? null : m.id)}>
                          {shown ? "Tutup" : "Detail"}
                        </button>
                      </td>
                    </tr>
                    {shown && (
                      <tr className="border-t border-slate-100 bg-slate-50">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <div className="text-[11px] uppercase text-slate-400">Keluhan</div>
                              <p className="text-sm">{m.complaint || "—"}</p>
                            </div>
                            <div>
                              <div className="text-[11px] uppercase text-slate-400">Tindakan</div>
                              <p className="text-sm">{m.action || "—"}</p>
                            </div>
                            <div>
                              <div className="text-[11px] uppercase text-slate-400">Sparepart</div>
                              {m.items.length === 0 && <p className="text-sm text-slate-400">Tidak ada item.</p>}
                              <ul className="text-sm">
                                {m.items.map((it) => (
                                  <li key={it.name} className="flex justify-between gap-4">
                                    <span>{it.name} × {it.qty}</span>
                                    <span>{fmt(it.qty * it.price)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <Badge status={v?.status ?? "ready"} />
                            <span className="text-xs text-slate-500">Status unit mengikuti WO proses.</span>
                            <button className="ml-auto text-xs font-semibold text-sky-700" onClick={() => setEditor(m)}>
                              Ubah WO
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditor(null)}>
          <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-sm" />
          <form
            className="anim relative max-h-[94vh] w-full max-w-xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveEditor}
          >
            <h3 className="mb-4 text-lg font-semibold">Work order</h3>
            <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
              Kendaraan
              <select className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" value={editor.vehicleId} onChange={(e) => setEditor({ ...editor, vehicleId: e.target.value })}>
                {fleet.map((v) => (
                  <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                ))}
              </select>
            </label>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Tanggal
                <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" type="date" value={editor.date} onChange={(e) => setEditor({ ...editor, date: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                KM
                <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" type="number" value={editor.km} onChange={(e) => setEditor({ ...editor, km: Number(e.target.value) || 0 })} />
              </label>
            </div>
            <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
              Jenis
              <select className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" value={editor.type} onChange={(e) => setEditor({ ...editor, type: e.target.value })}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
              Bengkel
              <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" value={editor.shop} onChange={(e) => setEditor({ ...editor, shop: e.target.value })} />
            </label>
            <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
              Keluhan
              <textarea className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" rows={2} value={editor.complaint} onChange={(e) => setEditor({ ...editor, complaint: e.target.value })} />
            </label>
            <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
              Tindakan
              <textarea className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" rows={2} value={editor.action} onChange={(e) => setEditor({ ...editor, action: e.target.value })} />
            </label>
            <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
              Status
              <select className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" value={editor.status} onChange={(e) => setEditor({ ...editor, status: e.target.value as Maintenance["status"] })}>
                <option value="proses">Proses</option>
                <option value="selesai">Selesai</option>
              </select>
            </label>
            <div className="mb-3">
              <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Sparepart</div>
              {editor.items.map((it, i) => (
                <div key={i} className="mb-2 grid grid-cols-7 gap-2">
                  <input className="col-span-3 rounded-xl border px-2 py-2 text-sm" placeholder="Nama" value={it.name} onChange={(e) => {
                    const items = [...editor.items];
                    items[i] = { ...it, name: e.target.value };
                    setEditor({ ...editor, items });
                  }} />
                  <input className="col-span-2 rounded-xl border px-2 py-2 text-sm" type="number" placeholder="Qty" value={it.qty} onChange={(e) => {
                    const items = [...editor.items];
                    items[i] = { ...it, qty: Number(e.target.value) || 0 };
                    setEditor({ ...editor, items });
                  }} />
                  <input className="col-span-2 rounded-xl border px-2 py-2 text-sm" type="number" placeholder="Harga" value={it.price} onChange={(e) => {
                    const items = [...editor.items];
                    items[i] = { ...it, price: Number(e.target.value) || 0 };
                    setEditor({ ...editor, items });
                  }} />
                </div>
              ))}
              <button
                type="button"
                className="text-xs font-semibold text-sky-700"
                onClick={() => setEditor({ ...editor, items: [...editor.items, { name: "", qty: 1, price: 0 }] })}
              >
                + Item
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={() => setEditor(null)}>Batal</button>
              <button className="rounded-xl bg-[#071526] px-5 py-2 text-sm font-semibold !text-white">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
