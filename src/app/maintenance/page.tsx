"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Card, Shell } from "@/components/shell";
import { fmt, fmtN, vehiclePhoto, woTotal, type Maintenance, type Vehicle } from "@/lib/data";
import { loadFleet } from "@/lib/fleet-store";
import { blankJob, findFleetUnit, loadJobs, saveJobs } from "@/lib/maintenance-store";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const TYPES = ["Service Berkala", "Ganti Oli", "Ganti Rem", "Service AC", "Ganti Ban", "Perbaikan Lain"];
const inputCls =
  "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

export default function Mnt() {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Maintenance[]>([]);
  const [q, setQ] = useState("");
  const [st, setSt] = useState<"all" | "proses" | "selesai">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [histUnit, setHistUnit] = useState<string | null>(null);
  const [editor, setEditor] = useState<Maintenance | null>(null);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

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

  function removeJob(id: string) {
    if (!window.confirm("Hapus work order ini? Data tidak bisa dikembalikan.")) return;
    persist(jobs.filter((j) => j.id !== id));
  }

  const filtered = useMemo(() => {
    return jobs
      .filter((j) => {
        const v = findFleetUnit(fleet, j.vehicleId);
        const blob = `${j.id} ${j.type} ${j.shop} ${j.complaint} ${v?.plate} ${v?.model}`.toLowerCase();
        const okQ = blob.includes(q.toLowerCase());
        const okS = st === "all" || j.status === st;
        const okFrom = !from || j.date >= from;
        const okTo = !to || j.date <= to;
        return okQ && okS && okFrom && okTo;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [jobs, fleet, q, st, from, to]);

  const stats = useMemo(() => {
    const proses = filtered.filter((j) => j.status === "proses");
    const selesai = filtered.filter((j) => j.status === "selesai");
    const cost = selesai.reduce((s, j) => s + woTotal(j), 0);
    return { n: filtered.length, proses: proses.length, selesai: selesai.length, cost };
  }, [filtered]);

  const histJobs = jobs
    .filter((j) => j.vehicleId === histUnit)
    .sort((a, b) => b.date.localeCompare(a.date));
  const histV = findFleetUnit(fleet, histUnit ?? "");

  function saveEditor(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    const parts = editor.items.reduce((s, it) => s + it.qty * it.price, 0);
    const jasa = Number(editor.jasa) || 0;
    const row = { ...editor, jasa, cost: parts + jasa };
    const exists = jobs.some((j) => j.id === row.id);
    persist(exists ? jobs.map((j) => (j.id === row.id ? row : j)) : [row, ...jobs]);
    setEditor(null);
  }

  const ev = editor ? findFleetUnit(fleet, editor.vehicleId) : undefined;
  const previewParts = editor ? editor.items.reduce((s, it) => s + it.qty * it.price, 0) : 0;
  const previewCost = editor ? previewParts + (Number(editor.jasa) || 0) : 0;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = first.getDay();
    const daysIn = new Date(year, month + 1, 0).getDate();
    const grid: (string | null)[] = [];
    for (let i = 0; i < start; i++) grid.push(null);
    for (let d = 1; d <= daysIn; d++) {
      grid.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    while (grid.length % 7) grid.push(null);
    return grid;
  }, [year, month]);

  const jobsByDate = useMemo(() => {
    const m = new Map<string, Maintenance[]>();
    jobs.forEach((j) => {
      const arr = m.get(j.date) ?? [];
      arr.push(j);
      m.set(j.date, arr);
    });
    return m;
  }, [jobs]);

  const dayJobs = jobsByDate.get(selected) ?? [];
  const dayUnits = new Set(dayJobs.map((j) => j.vehicleId)).size;
  const dayCost = dayJobs.filter((j) => j.status === "selesai").reduce((s, j) => s + woTotal(j), 0);
  const monthLabel = cursor.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const selectedLabel = new Date(selected + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function pickDate(iso: string) {
    setSelected(iso);
    setFrom(iso);
    setTo(iso);
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
            <p className="text-sm text-slate-300">Klik baris tabel untuk histori unit. Total biaya hanya WO selesai.</p>
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
          ["Semua WO", String(stats.n), "sesuai filter"],
          ["Sedang proses", String(stats.proses), "belum dihitung biaya"],
          ["Selesai", String(stats.selesai), "histori tertutup"],
          ["Total biaya", fmt(stats.cost), "akumulasi WO selesai"],
        ].map(([l, n, s]) => (
          <div key={l} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{l}</div>
            <div className="mt-1 break-words text-2xl font-semibold tracking-tight">{n}</div>
            <div className="text-xs text-slate-400">{s}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" className="rounded-full border px-3 py-1 text-sm" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
            <h3 className="text-lg font-semibold capitalize">{monthLabel}</h3>
            <button type="button" className="rounded-full border px-3 py-1 text-sm" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {DAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((iso, i) => {
              if (!iso) return <div key={`e${i}`} className="min-h-[56px] rounded-xl bg-slate-50/50 sm:min-h-[76px]" />;
              const list = jobsByDate.get(iso) ?? [];
              const units = new Set(list.map((j) => j.vehicleId)).size;
              const cost = list.filter((j) => j.status === "selesai").reduce((s, j) => s + woTotal(j), 0);
              const proses = list.some((j) => j.status === "proses");
              const isSel = iso === selected;
              const isToday = iso === today;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => pickDate(iso)}
                  className={`min-h-[56px] rounded-xl p-1 text-left transition sm:min-h-[76px] sm:p-2 ${
                    isSel ? "bg-[#071526] text-white shadow-lg" : "bg-white ring-1 ring-slate-200 hover:ring-sky-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={isToday && !isSel ? "font-bold text-sky-600" : ""}>{Number(iso.slice(8))}</span>
                    {units > 0 && (
                      <span className={`rounded-full px-1.5 text-[10px] font-bold ${isSel ? "bg-sky-400 text-white" : proses ? "bg-red-100 text-red-800" : "bg-sky-100 text-sky-800"}`}>
                        {units}
                      </span>
                    )}
                  </div>
                  {units > 0 && (
                    <div className={`mt-1 text-[10px] leading-tight ${isSel ? "text-slate-300" : "text-slate-500"}`}>
                      {units} unit
                      {cost > 0 ? ` · ${fmt(cost)}` : ""}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="flex flex-col p-5 lg:col-span-2">
          <h3 className="font-semibold">{selectedLabel}</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-red-50 p-3">
              <div className="text-[11px] uppercase text-red-700">Unit diservice</div>
              <div className="text-2xl font-semibold text-red-800">{dayUnits}</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3">
              <div className="text-[11px] uppercase text-emerald-700">Biaya selesai</div>
              <div className="text-lg font-semibold text-emerald-800">{fmt(dayCost)}</div>
            </div>
          </div>
          <div className="mt-3 max-h-[280px] space-y-2 overflow-auto">
            {dayJobs.length === 0 && <p className="text-sm text-slate-400">Tidak ada WO di tanggal ini.</p>}
            {dayJobs.map((j) => {
              const v = findFleetUnit(fleet, j.vehicleId);
              return (
                <div key={j.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <img src={vehiclePhoto(v ?? { model: "" })} alt="" className="h-10 w-14 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{v ? `${v.brand} ${v.model}` : j.vehicleId}</div>
                      <div className="text-xs text-slate-500">{v?.plate} · {j.type}</div>
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className={j.status === "proses" ? "font-semibold text-red-700" : "text-emerald-700"}>{j.status === "proses" ? "Diservice" : "Selesai"}</span>
                    <span className="font-semibold">{j.status === "selesai" ? fmt(woTotal(j)) : "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <label className="text-xs font-semibold uppercase text-slate-500">
          Dari tanggal
          <input className={inputCls} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-xs font-semibold uppercase text-slate-500">
          Sampai tanggal
          <input className={inputCls} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        {(from || to) && (
          <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={() => { setFrom(""); setTo(""); }}>
            Reset tanggal
          </button>
        )}
        <div className="ml-auto flex min-w-[200px] flex-1 items-center rounded-xl border bg-slate-50 px-3 py-2">
          <span className="mr-2 text-slate-400">⌕</span>
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Cari plat, jenis, bengkel…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
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
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {["Work order", "Unit", "Jenis", "KM", "Bengkel", "Keluhan", "Biaya", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
                <th className="sticky right-0 bg-slate-50 px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">Tidak ada work order pada rentang tanggal ini.</td>
                </tr>
              )}
              {filtered.map((m) => {
                const v = fleet.find((x) => x.id === m.vehicleId);
                return (
                  <tr
                    key={m.id}
                    className="cursor-pointer border-t border-slate-100 hover:bg-sky-50/70"
                    onClick={() => setHistUnit(m.vehicleId)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] text-slate-500">{m.id}</div>
                      <div className="font-medium">{m.date}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={vehiclePhoto(v ?? { model: "" })} alt="" className="h-10 w-14 rounded-lg object-cover" />
                        <span>
                          <span className="block font-semibold">{v?.plate ?? m.vehicleId}</span>
                          <span className="text-xs text-slate-500">{v ? `${v.brand} ${v.model}` : ""}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{m.type}</td>
                    <td className="px-4 py-3">{fmtN(m.km)}</td>
                    <td className="px-4 py-3">{m.shop || "—"}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-600">{m.complaint || "—"}</td>
                    <td className="px-4 py-3 font-semibold">
                      {m.status === "selesai" ? fmt(woTotal(m)) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                    <td className="sticky right-0 bg-white px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-600 hover:!text-white"
                        onClick={() => removeJob(m.id)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {histUnit && histV && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setHistUnit(null)}>
          <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-sm" />
          <div className="anim relative max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-40">
              <img src={vehiclePhoto(histV)} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071526] to-transparent" />
              <button type="button" className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1 text-sm !text-white" onClick={() => setHistUnit(null)}>
                Tutup
              </button>
              <div className="absolute bottom-4 left-6 text-white">
                <p className="text-[11px] uppercase tracking-[0.2em] text-sky-300">Histori maintenance</p>
                <h3 className="text-2xl font-semibold">{histV.brand} {histV.model}</h3>
                <p className="text-sm text-slate-300">{histV.plate} · {histJobs.length} work order</p>
              </div>
            </div>
            <div className="p-5">
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[11px] uppercase text-slate-400">Total selesai</div>
                  <div className="text-lg font-semibold">{fmt(histJobs.filter((j) => j.status === "selesai").reduce((s, j) => s + j.cost, 0))}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[11px] uppercase text-slate-400">Status unit</div>
                  <div className="mt-1"><Badge status={histV.status} /></div>
                </div>
              </div>
              <div className="space-y-3">
                {histJobs.length === 0 && <p className="text-sm text-slate-400">Belum ada histori.</p>}
                {histJobs.map((m) => (
                  <div key={m.id} className="rounded-2xl ring-1 ring-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">{m.type}</div>
                        <div className="text-xs text-slate-500">{m.id} · {m.date} · KM {fmtN(m.km)} · {m.shop}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{m.status === "selesai" ? fmt(woTotal(m)) : "Belum ditagih"}</div>
                        <Badge status={m.status} />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{m.complaint || "—"} → {m.action || "—"}</p>
                    {m.items.length > 0 && (
                      <ul className="mt-2 text-xs text-slate-500">
                        {m.items.map((it) => (
                          <li key={it.name}>{it.name} × {it.qty} · {fmt(it.qty * it.price)}</li>
                        ))}
                      </ul>
                    )}
                    <button type="button" className="mt-2 text-xs font-semibold text-sky-700" onClick={() => { setEditor(m); setHistUnit(null); }}>
                      Ubah WO
                    </button>
                  </div>
                ))}
              </div>
              <Link href={`/kendaraan/${histV.id}`} className="mt-4 inline-block text-sm text-sky-700">Buka dossier unit →</Link>
            </div>
          </div>
        </div>
      )}

      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" onClick={() => setEditor(null)}>
          <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-md" />
          <form
            className="anim relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveEditor}
          >
            <div className="flex items-center justify-between bg-[#071526] px-6 py-4 text-white">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300">VMMS-SIG</p>
                <h2 className="text-lg font-semibold">Formulir work order</h2>
              </div>
              <button type="button" onClick={() => setEditor(null)} className="rounded-full bg-white/10 px-3 py-1 text-sm !text-white">
                Tutup
              </button>
            </div>
            <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-5">
              <div className="space-y-3 p-6 lg:col-span-3">
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Kendaraan
                  <select className={inputCls} value={editor.vehicleId} onChange={(e) => setEditor({ ...editor, vehicleId: e.target.value })}>
                    {fleet.map((v) => (
                      <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Tanggal
                    <input className={inputCls} type="date" value={editor.date} onChange={(e) => setEditor({ ...editor, date: e.target.value })} />
                  </label>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    KM
                    <input className={inputCls} type="number" value={editor.km} onChange={(e) => setEditor({ ...editor, km: Number(e.target.value) || 0 })} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Jenis
                    <select className={inputCls} value={editor.type} onChange={(e) => setEditor({ ...editor, type: e.target.value })}>
                      {TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Status
                    <select className={inputCls} value={editor.status} onChange={(e) => setEditor({ ...editor, status: e.target.value as Maintenance["status"] })}>
                      <option value="proses">Proses</option>
                      <option value="selesai">Selesai</option>
                    </select>
                  </label>
                </div>
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Bengkel
                  <input className={inputCls} value={editor.shop} onChange={(e) => setEditor({ ...editor, shop: e.target.value })} />
                </label>
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Keluhan
                  <textarea className={inputCls} rows={2} value={editor.complaint} onChange={(e) => setEditor({ ...editor, complaint: e.target.value })} />
                </label>
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Tindakan
                  <textarea className={inputCls} rows={2} value={editor.action} onChange={(e) => setEditor({ ...editor, action: e.target.value })} />
                </label>
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Sparepart</div>
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
                  <button type="button" className="text-xs font-semibold text-sky-700" onClick={() => setEditor({ ...editor, items: [...editor.items, { name: "", qty: 1, price: 0 }] })}>
                    + Item sparepart
                  </button>
                </div>
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Jasa bengkel / lain-lain
                  <input
                    className={inputCls}
                    type="number"
                    min={0}
                    value={editor.jasa ?? 0}
                    onChange={(e) => setEditor({ ...editor, jasa: Number(e.target.value) || 0 })}
                  />
                  <span className="mt-1 block font-normal normal-case tracking-normal text-[11px] text-slate-400">
                    Opsional. Total WO = sparepart + jasa ini.
                  </span>
                </label>
              </div>
              <div className="border-t bg-slate-50 p-6 lg:border-l lg:border-t-0 lg:col-span-2">
                <h3 className="mb-3 text-sm font-semibold">Preview unit</h3>
                {ev ? (
                  <>
                    <img src={vehiclePhoto(ev)} alt="" className="mb-3 h-36 w-full rounded-2xl object-cover" />
                    <p className="font-semibold">{ev.brand} {ev.model}</p>
                    <p className="text-sm text-slate-500">{ev.plate} · {ev.color}</p>
                    <p className="mt-1 text-xs text-slate-400">{ev.driver} · {ev.dept}</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Pilih kendaraan.</p>
                )}
                <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-[11px] uppercase text-slate-400">Perkiraan biaya</div>
                  <div className="text-xl font-semibold">{fmt(previewCost)}</div>
                  <p className="mt-1 text-xs text-slate-500">Sparepart {fmt(previewParts)} + jasa {fmt(Number(editor.jasa) || 0)}. Masuk total setelah Selesai.</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t bg-slate-50 px-6 py-4">
              <button type="button" className="rounded-xl border bg-white px-4 py-2 text-sm" onClick={() => setEditor(null)}>Batal</button>
              <button className="rounded-xl bg-[#071526] px-6 py-2 text-sm font-semibold !text-white">Simpan work order</button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
