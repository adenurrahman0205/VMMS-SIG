"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Card, Shell } from "@/components/shell";
import { fmt, fmtN, vehiclePhoto, woTotal, type Maintenance, type Vehicle } from "@/lib/data";
import { loadFleet } from "@/lib/fleet-store";
import { blankJob, findFleetUnit, loadJobs, saveJobs } from "@/lib/maintenance-store";
import {
  blankEstimate,
  estimateTotal,
  loadEstimates,
  saveEstimates,
  suggestFor,
  type ServiceEstimate,
} from "@/lib/estimate-store";
import { findWorkshop, loadWorkshops, type Workshop } from "@/lib/workshop-store";
import { WorkshopCell, WorkshopSelect } from "@/components/workshop-select";
import { SearchSelect } from "@/components/search-select";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const TYPES = ["Service Berkala", "Ganti Oli", "Ganti Rem", "Service AC", "Ganti Ban", "Perbaikan Lain"];
const inputCls =
  "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

export default function Mnt() {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Maintenance[]>([]);
  const [shops, setShops] = useState<Workshop[]>([]);
  const [q, setQ] = useState("");
  const [st, setSt] = useState<"all" | "proses" | "selesai">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [histId, setHistId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Maintenance | null>(null);
  const [estimates, setEstimates] = useState<ServiceEstimate[]>([]);
  const [estEditor, setEstEditor] = useState<ServiceEstimate | null>(null);
  const [estView, setEstView] = useState<ServiceEstimate | null>(null);
  const [tab, setTab] = useState<"wo" | "estimasi">("wo");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  useEffect(() => {
    setFleet(loadFleet());
    setJobs(loadJobs());
    setShops(loadWorkshops());
    setEstimates(loadEstimates());
  }, []);

  function persist(next: Maintenance[]) {
    saveJobs(next);
    setJobs(next);
    setFleet(loadFleet());
  }

  function persistEst(next: ServiceEstimate[]) {
    saveEstimates(next);
    setEstimates(next);
  }

  function saveEstForm(e: React.FormEvent) {
    e.preventDefault();
    if (!estEditor) return;
    const row = { ...estEditor, jasa: Number(estEditor.jasa) || 0, status: estEditor.status || "arsip" };
    const exists = estimates.some((x) => x.id === row.id);
    persistEst(exists ? estimates.map((x) => (x.id === row.id ? row : x)) : [row, ...estimates]);
    setEstEditor(null);
  }

  function convertEstToWo(est: ServiceEstimate) {
    const job = {
      ...blankJob(est.vehicleId),
      date: est.date,
      type: est.type,
      km: est.km || findFleetUnit(fleet, est.vehicleId)?.km || 0,
      shop: est.shop,
      workshopId: est.workshopId,
      complaint: est.complaint,
      items: est.items.map((it) => ({ ...it })),
      jasa: Number(est.jasa) || 0,
      cost: estimateTotal(est),
      status: "proses" as const,
    };
    persist([job, ...jobs]);
    persistEst(estimates.map((x) => (x.id === est.id ? { ...x, status: "wo" as const, woId: job.id } : x)));
    setEstView(null);
    setTab("wo");
    setEditor(job);
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
        const shop = findWorkshop(shops, j.shop, j.workshopId);
        const blob = `${j.id} ${j.type} ${j.shop} ${shop?.code ?? ""} ${shop?.city ?? ""} ${j.complaint} ${v?.plate} ${v?.model}`.toLowerCase();
        const okQ = blob.includes(q.toLowerCase());
        const okS = st === "all" || j.status === st;
        const okFrom = !from || j.date >= from;
        const okTo = !to || j.date <= to;
        return okQ && okS && okFrom && okTo;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [jobs, fleet, shops, q, st, from, to]);

  const stats = useMemo(() => {
    const proses = filtered.filter((j) => j.status === "proses");
    const selesai = filtered.filter((j) => j.status === "selesai");
    const cost = selesai.reduce((s, j) => s + woTotal(j), 0);
    return { n: filtered.length, proses: proses.length, selesai: selesai.length, cost };
  }, [filtered]);

  const histJob = jobs.find((j) => j.id === histId);
  const histShop = histJob ? findWorkshop(shops, histJob.shop, histJob.workshopId) : undefined;
  const histV = findFleetUnit(fleet, histJob?.vehicleId ?? "");
  const histDayJobs = histJob
    ? jobs.filter((j) => j.vehicleId === histJob.vehicleId && j.date === histJob.date).sort((a, b) => a.id.localeCompare(b.id))
    : [];

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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold !text-white ring-1 ring-white/20"
              onClick={() => {
                setTab("estimasi");
                const b = blankEstimate(fleet[0]?.id ?? "");
                const s = suggestFor(b.type, b.vehicleId, jobs, fleet);
                setEstEditor({ ...b, items: s.items, jasa: s.jasa, km: fleet[0]?.km ?? 0 });
              }}
            >
              + Estimasi biaya
            </button>
            <button
              type="button"
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold !text-white"
              onClick={() => {
                setTab("wo");
                setEditor(blankJob(fleet[0]?.id ?? ""));
              }}
            >
              + Work order
            </button>
          </div>
        </div>
      </section>

      <div className="mb-6 overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-[#071526] px-4 py-3 text-white">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">Sebelum work order</p>
            <h3 className="text-sm font-semibold">Arsip estimasi biaya service</h3>
          </div>
          <button
            type="button"
            className="rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold !text-white"
            onClick={() => {
              const b = blankEstimate(fleet[0]?.id ?? "");
              const s = suggestFor(b.type, b.vehicleId, jobs, fleet);
              setEstEditor({ ...b, items: s.items, jasa: s.jasa, km: fleet[0]?.km ?? 0 });
            }}
          >
            + Estimasi baru
          </button>
        </div>
        {estimates.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">Belum ada estimasi. Buat dulu sebelum membuka work order.</p>
        ) : (
          <ul className="max-h-72 divide-y divide-slate-100 overflow-auto">
            {estimates.map((e) => {
              const v = findFleetUnit(fleet, e.vehicleId);
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <img src={vehiclePhoto(v ?? { model: "" })} alt="" className="h-10 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{v?.plate ?? e.vehicleId} · {e.type}</div>
                    <div className="text-xs text-slate-500">{e.id} · {e.date} · {e.status === "wo" ? "Sudah WO" : "Arsip"}</div>
                  </div>
                  <div className="text-sm font-semibold">{fmt(estimateTotal(e))}</div>
                  <button type="button" className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold" onClick={() => setEstView(e)}>Detail</button>
                  {e.status !== "wo" && (
                    <button type="button" className="rounded-full bg-[#071526] px-3 py-1 text-xs font-semibold !text-white" onClick={() => convertEstToWo(e)}>Lanjut WO</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

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
                    onClick={() => setHistId(m.id)}
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
                    <td className="px-4 py-3">
                      <WorkshopCell shops={shops} shop={m.shop} workshopId={m.workshopId} />
                    </td>
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

      {histJob && histV && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setHistId(null)}>
          <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-sm" />
          <div className="anim relative max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-44">
              <img src={vehiclePhoto(histV)} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071526] via-[#071526]/55 to-transparent" />
              <button type="button" className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1 text-sm !text-white" onClick={() => setHistId(null)}>
                Tutup
              </button>
              <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3 text-white">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-sky-300">Work order {histJob.date}</p>
                  <h3 className="text-2xl font-semibold">{histV.brand} {histV.model}</h3>
                  <p className="text-sm text-slate-300">{histV.plate} · {histV.color} · {histV.driver || "—"}</p>
                </div>
                <Badge status={histJob.status} />
              </div>
            </div>
            <div className="p-5">
              {histDayJobs.length > 1 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {histDayJobs.map((j) => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => setHistId(j.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${j.id === histJob.id ? "bg-[#071526] !text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      {j.id}
                    </button>
                  ))}
                </div>
              )}
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{histJob.type}</div>
                  <div className="text-xs text-slate-500">{histJob.id} · KM {fmtN(histJob.km)} · {findWorkshop(shops, histJob.shop, histJob.workshopId)?.name || histJob.shop || "Bengkel belum diisi"}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase text-slate-400">{histJob.status === "selesai" ? "Total WO" : "Belum ditagih"}</div>
                  <div className="text-2xl font-semibold">{histJob.status === "selesai" ? fmt(woTotal(histJob)) : "—"}</div>
                </div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Tanggal", histJob.date],
                  ["Status", histJob.status],
                  ["Odometer", `${fmtN(histJob.km)} KM`],
                  ["Bengkel", histShop?.name || histJob.shop || "—"],
                  ["Kode bengkel", histShop?.code || "—"],
                  ["Alamat bengkel", histShop?.address || "—"],
                  ["Telp / WA", histShop?.phone || "—"],
                  ["Sparepart", fmt(histJob.items.reduce((s, it) => s + it.qty * it.price, 0))],
                  ["Jasa", fmt(Number(histJob.jasa) || 0)],
                  ["Health unit", `${histV.health}/100`],
                  ["Divisi", histV.dept || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                    <div className="text-[10px] uppercase tracking-wide text-slate-400">{k}</div>
                    <div className="truncate text-sm font-semibold">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[11px] uppercase text-slate-400">Keluhan</div>
                  <p className="mt-1 text-sm text-slate-700">{histJob.complaint || "Tidak ada catatan keluhan."}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[11px] uppercase text-slate-400">Tindakan</div>
                  <p className="mt-1 text-sm text-slate-700">{histJob.action || "Belum ada tindakan."}</p>
                </div>
              </div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Sparepart</h4>
              {histJob.items.length === 0 ? (
                <p className="mb-4 text-sm text-slate-400">Tidak ada item sparepart pada WO ini.</p>
              ) : (
                <div className="mb-4 overflow-hidden rounded-2xl ring-1 ring-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
                      <tr>
                        {["Nama", "Qty", "Harga", "Subtotal"].map((h) => (
                          <th key={h} className="px-3 py-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {histJob.items.map((it) => (
                        <tr key={it.name} className="border-t">
                          <td className="px-3 py-2">{it.name}</td>
                          <td className="px-3 py-2">{it.qty}</td>
                          <td className="px-3 py-2">{fmt(it.price)}</td>
                          <td className="px-3 py-2 font-semibold">{fmt(it.qty * it.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                <Link href={`/kendaraan/${histV.id}`} className="text-sm font-semibold text-sky-700">Dossier unit →</Link>
                <div className="flex gap-2">
                  <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={() => setHistId(null)}>Tutup</button>
                  <button
                    type="button"
                    className="rounded-xl bg-[#071526] px-4 py-2 text-sm font-semibold !text-white"
                    onClick={() => { setEditor(histJob); setHistId(null); }}
                  >
                    Ubah WO
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editor && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" onClick={() => setEditor(null)}>
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
                  <SearchSelect
                    required
                    allowEmpty={false}
                    placeholder="Pilih unit"
                    value={editor.vehicleId}
                    onChange={(v) => setEditor({ ...editor, vehicleId: v })}
                    options={fleet.map((v) => ({ value: v.id, label: `${v.plate} — ${v.brand} ${v.model}` }))}
                  />
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
                    <SearchSelect
                      allowEmpty={false}
                      value={editor.type}
                      onChange={(v) => setEditor({ ...editor, type: v })}
                      options={TYPES.map((t) => ({ value: t, label: t }))}
                    />
                  </label>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Status
                    <SearchSelect
                      allowEmpty={false}
                      value={editor.status}
                      onChange={(v) => setEditor({ ...editor, status: v as Maintenance["status"] })}
                      options={[
                        { value: "proses", label: "Proses" },
                        { value: "selesai", label: "Selesai" },
                      ]}
                    />
                  </label>
                </div>
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Bengkel mitra
                  <WorkshopSelect
                    shops={shops}
                    value={editor.shop}
                    workshopId={editor.workshopId}
                    required
                    className={inputCls}
                    onPick={(w) => setEditor({ ...editor, shop: w?.name || "", workshopId: w?.id })}
                  />
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

      {estView && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setEstView(null)}>
          <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-sm" />
          <div className="anim relative max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{estView.id}</p>
            <h3 className="text-lg font-semibold">{estView.type}</h3>
            <p className="text-sm text-slate-500">{findFleetUnit(fleet, estView.vehicleId)?.plate} · {estView.date}</p>
            <div className="mt-4 rounded-2xl bg-[#071526] p-4 text-white">
              <div className="text-[11px] uppercase text-sky-300">Estimasi biaya</div>
              <div className="text-2xl font-semibold">{fmt(estimateTotal(estView))}</div>
              <p className="mt-1 text-xs text-slate-300">Sparepart {fmt(estView.items.reduce((s, it) => s + it.qty * it.price, 0))} + jasa {fmt(Number(estView.jasa) || 0)}</p>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {estView.items.map((it, i) => (
                <li key={i} className="flex justify-between">
                  <span>{it.name} × {it.qty}</span>
                  <span className="font-semibold">{fmt(it.qty * it.price)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-600">{estView.complaint || estView.notes || "Tidak ada catatan."}</p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={() => setEstView(null)}>Tutup</button>
              {estView.status !== "wo" && (
                <button type="button" className="rounded-xl bg-[#071526] px-4 py-2 text-sm font-semibold !text-white" onClick={() => convertEstToWo(estView)}>
                  Lanjut work order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {estEditor && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" onClick={() => setEstEditor(null)}>
          <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-md" />
          <form
            className="anim relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveEstForm}
          >
            <div className="flex items-center justify-between bg-[#071526] px-6 py-4 text-white">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300">Sebelum work order</p>
                <h2 className="text-lg font-semibold">Estimasi biaya service</h2>
              </div>
              <button type="button" onClick={() => setEstEditor(null)} className="rounded-full bg-white/10 px-3 py-1 text-sm !text-white">Tutup</button>
            </div>
            <div className="space-y-3 overflow-auto p-6">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Kendaraan
                <SearchSelect
                  required
                  allowEmpty={false}
                  placeholder="Pilih unit"
                  value={estEditor.vehicleId}
                  onChange={(id) => {
                    const s = suggestFor(estEditor.type, id, jobs, fleet);
                    const v = findFleetUnit(fleet, id);
                    setEstEditor({ ...estEditor, vehicleId: id, km: v?.km ?? estEditor.km, items: s.items, jasa: s.jasa });
                  }}
                  options={fleet.map((v) => ({ value: v.id, label: `${v.plate} — ${v.brand} ${v.model}` }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Tanggal
                  <input className={inputCls} type="date" value={estEditor.date} onChange={(e) => setEstEditor({ ...estEditor, date: e.target.value })} />
                </label>
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Jenis
                  <SearchSelect
                    allowEmpty={false}
                    value={estEditor.type}
                    onChange={(type) => {
                      const s = suggestFor(type, estEditor.vehicleId, jobs, fleet);
                      setEstEditor({ ...estEditor, type, items: s.items, jasa: s.jasa });
                    }}
                    options={TYPES.map((t) => ({ value: t, label: t }))}
                  />
                </label>
              </div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Bengkel (opsional)
                <WorkshopSelect
                  shops={shops}
                  value={estEditor.shop}
                  workshopId={estEditor.workshopId}
                  className={inputCls}
                  onPick={(w) => setEstEditor({ ...estEditor, shop: w?.name || "", workshopId: w?.id })}
                />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Catatan / keluhan
                <textarea className={inputCls} rows={2} value={estEditor.complaint} onChange={(e) => setEstEditor({ ...estEditor, complaint: e.target.value })} />
              </label>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Item estimasi</div>
                {estEditor.items.map((it, i) => (
                  <div key={i} className="mb-2 grid grid-cols-7 gap-2">
                    <input className="col-span-3 rounded-xl border px-2 py-2 text-sm" placeholder="Nama" value={it.name} onChange={(e) => {
                      const items = [...estEditor.items];
                      items[i] = { ...it, name: e.target.value };
                      setEstEditor({ ...estEditor, items });
                    }} />
                    <input className="col-span-2 rounded-xl border px-2 py-2 text-sm" type="number" value={it.qty} onChange={(e) => {
                      const items = [...estEditor.items];
                      items[i] = { ...it, qty: Number(e.target.value) || 0 };
                      setEstEditor({ ...estEditor, items });
                    }} />
                    <input className="col-span-2 rounded-xl border px-2 py-2 text-sm" type="number" value={it.price} onChange={(e) => {
                      const items = [...estEditor.items];
                      items[i] = { ...it, price: Number(e.target.value) || 0 };
                      setEstEditor({ ...estEditor, items });
                    }} />
                  </div>
                ))}
                <button type="button" className="text-xs font-semibold text-sky-700" onClick={() => setEstEditor({ ...estEditor, items: [...estEditor.items, { name: "", qty: 1, price: 0 }] })}>
                  + Item
                </button>
              </div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Jasa
                <input className={inputCls} type="number" min={0} value={estEditor.jasa} onChange={(e) => setEstEditor({ ...estEditor, jasa: Number(e.target.value) || 0 })} />
              </label>
              <div className="rounded-2xl bg-[#071526] p-4 text-white">
                <div className="text-[11px] uppercase text-sky-300">Total estimasi</div>
                <div className="text-2xl font-semibold">{fmt(estimateTotal(estEditor))}</div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t bg-slate-50 px-6 py-4">
              <button type="button" className="rounded-xl border bg-white px-4 py-2 text-sm" onClick={() => setEstEditor(null)}>Batal</button>
              <button className="rounded-xl bg-[#071526] px-6 py-2 text-sm font-semibold !text-white">Simpan ke arsip</button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
