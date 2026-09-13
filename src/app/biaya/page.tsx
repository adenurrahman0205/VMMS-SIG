"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, Shell } from "@/components/shell";
import { fmt, fmtN, vehiclePhoto, woTotal, type Maintenance, type Vehicle } from "@/lib/data";
import { loadFleet } from "@/lib/fleet-store";
import { loadJobs } from "@/lib/maintenance-store";

type Peak = { date: string; type: string; cost: number; shop: string };

type UnitRow = {
  v: Vehicle;
  done: Maintenance[];
  cost: number;
  jobs: number;
  cpk: number;
  peak?: Peak;
  parts: { name: string; qty: number; amount: number }[];
  score: number;
  verdict: string;
};

function scoreOf(v: Vehicle, cost: number, jobs: number, avgCpk: number) {
  const cpk = cost / Math.max(v.km, 1);
  let s = v.health;
  if (avgCpk > 0 && cpk > avgCpk * 1.4) s -= 12;
  else if (avgCpk > 0 && cpk < avgCpk * 0.7) s += 6;
  if (jobs > 8) s -= 6;
  if (v.status === "maintenance") s -= 8;
  if (v.status === "inactive") s -= 15;
  return Math.max(0, Math.min(100, Math.round(s)));
}

function catOf(name: string) {
  const n = name.toLowerCase();
  if (n.includes("ban")) return "Ban";
  if (n.includes("oli")) return "Oli";
  if (n.includes("filter")) return "Filter";
  if (n.includes("rem") || n.includes("kampas") || n.includes("cakram")) return "Rem";
  if (n.includes("ac") || n.includes("freon") || n.includes("kompresor")) return "AC";
  return "Lainnya";
}

function verdict(score: number, cost: number) {
  if (score >= 85) return "Sangat ekonomis";
  if (score >= 70) return "Masih ekonomis";
  if (score >= 55) return "Perlu pengawasan";
  if (cost > 0) return "Evaluasi penggantian unit";
  return "Data terbatas";
}

export default function Biaya() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Maintenance[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [sort, setSort] = useState<"cost" | "score" | "cpk">("cost");
  const [partQ, setPartQ] = useState("");
  const [partOpen, setPartOpen] = useState<string | null>(null);

  useEffect(() => {
    setVehicles(loadFleet());
    setJobs(loadJobs());
  }, []);

  const doneAll = useMemo(() => jobs.filter((j) => j.status === "selesai"), [jobs]);

  const rows: UnitRow[] = useMemo(() => {
    const mapped = vehicles.map((v) => {
      const done = doneAll.filter((m) => m.vehicleId === v.id).sort((a, b) => b.date.localeCompare(a.date));
      const cost = done.reduce((s, m) => s + woTotal(m), 0);
      const peakJob = done.reduce<Maintenance | undefined>((best, m) => (!best || woTotal(m) > woTotal(best) ? m : best), undefined);
      const partMap = new Map<string, { qty: number; amount: number }>();
      done.forEach((m) =>
        m.items.forEach((it) => {
          const cur = partMap.get(it.name) ?? { qty: 0, amount: 0 };
          cur.qty += it.qty;
          cur.amount += it.qty * it.price;
          partMap.set(it.name, cur);
        })
      );
      const parts = [...partMap.entries()]
        .map(([name, x]) => ({ name, ...x }))
        .sort((a, b) => b.amount - a.amount);
      return {
        v,
        done,
        cost,
        jobs: done.length,
        cpk: cost / Math.max(v.km, 1),
        peak: peakJob ? { date: peakJob.date, type: peakJob.type, cost: woTotal(peakJob), shop: peakJob.shop } : undefined,
        parts,
        score: 0,
        verdict: "",
      };
    });
    const avgCpk = mapped.reduce((s, r) => s + r.cpk, 0) / Math.max(mapped.length, 1);
    return mapped.map((r) => {
      const score = scoreOf(r.v, r.cost, r.jobs, avgCpk);
      return { ...r, score, verdict: verdict(score, r.cost) };
    });
  }, [vehicles, doneAll]);

  const summary = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.cost, 0);
    const km = rows.reduce((s, r) => s + r.v.km, 0);
    const avgScore = Math.round(rows.reduce((s, r) => s + r.score, 0) / Math.max(rows.length, 1));
    const top = [...rows].sort((a, b) => b.cost - a.cost)[0];
    const best = [...rows].sort((a, b) => b.score - a.score)[0];
    const peak = rows.reduce<{ plate: string; peak: Peak } | undefined>((acc, r) => {
      if (!r.peak) return acc;
      if (!acc || r.peak.cost > acc.peak.cost) return { plate: r.v.plate, peak: r.peak };
      return acc;
    }, undefined);
    const partMap = new Map<string, number>();
    rows.forEach((r) => r.parts.forEach((p) => partMap.set(p.name, (partMap.get(p.name) ?? 0) + p.amount)));
    const topParts = [...partMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { total, km, avgScore, top, best, peak, jobs: doneAll.length, cpk: total / Math.max(km, 1), topParts, n: rows.length };
  }, [rows, doneAll.length]);

  const shown = useMemo(() => {
    const s = q.toLowerCase();
    const list = rows.filter((r) => `${r.v.plate} ${r.v.brand} ${r.v.model} ${r.v.driver}`.toLowerCase().includes(s));
    list.sort((a, b) => (sort === "score" ? b.score - a.score : sort === "cpk" ? b.cpk - a.cpk : b.cost - a.cost));
    return list;
  }, [rows, q, sort]);

  const maxCost = Math.max(...rows.map((r) => r.cost), 1);
  const avgCost = summary.total / Math.max(rows.length, 1);

  const partIndex = useMemo(() => {
    type VU = { id: string; plate: string; model: string; brand: string; amount: number; qty: number; last: string };
    const map = new Map<string, { total: number; qty: number; units: Map<string, VU> }>();
    doneAll.forEach((m) => {
      const v = vehicles.find((x) => x.id === m.vehicleId);
      m.items.forEach((it) => {
        const name = it.name.trim() || "Tanpa nama";
        const amt = it.qty * it.price;
        if (!map.has(name)) map.set(name, { total: 0, qty: 0, units: new Map() });
        const g = map.get(name)!;
        g.total += amt;
        g.qty += it.qty;
        const cur = g.units.get(m.vehicleId) ?? {
          id: m.vehicleId,
          plate: v?.plate ?? m.vehicleId,
          model: v?.model ?? "",
          brand: v?.brand ?? "",
          amount: 0,
          qty: 0,
          last: m.date,
        };
        cur.amount += amt;
        cur.qty += it.qty;
        if (m.date > cur.last) cur.last = m.date;
        g.units.set(m.vehicleId, cur);
      });
    });
    return [...map.entries()]
      .map(([name, g]) => ({
        name,
        cat: catOf(name),
        total: g.total,
        qty: g.qty,
        units: [...g.units.values()].sort((a, b) => b.amount - a.amount),
      }))
      .sort((a, b) => b.total - a.total);
  }, [doneAll, vehicles]);

  const partShown = useMemo(() => {
    const s = partQ.toLowerCase();
    return partIndex.filter((p) => `${p.name} ${p.cat} ${p.units[0]?.plate ?? ""}`.toLowerCase().includes(s));
  }, [partIndex, partQ]);

  return (
    <Shell title="Biaya & Analitik">
      <section className="anim relative mb-6 overflow-hidden rounded-3xl">
        <img src="/images/hero-fleet.png" alt="" className="h-40 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071526] via-[#071526]/85 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-5 text-white sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.22em] text-sky-300">Cost intelligence</p>
          <h2 className="text-2xl font-semibold">Rincian biaya maintenance armada</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            Setiap WO selesai diurai sampai sparepart. Skor unit membandingkan health, cost/KM, dan frekuensi servis terhadap rata-rata armada.
          </p>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Total biaya", fmt(summary.total), `${summary.jobs} WO selesai`],
          ["Cost / KM", fmt(Math.round(summary.cpk)), `${fmtN(summary.km)} KM`],
          ["Skor armada", String(summary.avgScore), "rata-rata 0–100"],
          ["Unit termahal", summary.top?.v.plate ?? "—", summary.top ? fmt(summary.top.cost) : ""],
          ["Servis terbesar", summary.peak ? fmt(summary.peak.peak.cost) : "—", summary.peak ? `${summary.peak.plate} · ${summary.peak.peak.date}` : ""],
        ].map(([l, n, s]) => (
          <div key={l} className="rounded-2xl bg-[#071526] p-4 text-white ring-1 ring-white/10">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">{l}</div>
            <div className="mt-2 break-words text-xl font-semibold">{n}</div>
            <div className="mt-1 text-[11px] text-slate-400">{s}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h3 className="mb-1 font-semibold">Perbandingan total biaya per unit</h3>
          <p className="mb-4 text-xs text-slate-500">Garis putus = rata-rata armada {fmt(Math.round(avgCost))}</p>
          <div className="space-y-2">
            {shown.slice(0, 12).map((r) => (
              <button
                key={r.v.id}
                type="button"
                onClick={() => setOpen(open === r.v.id ? null : r.v.id)}
                className="block w-full text-left"
              >
                <div className="mb-0.5 flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">{r.v.plate} · {r.v.model}</span>
                  <span className="text-slate-500">{fmt(r.cost)}</span>
                </div>
                <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                    style={{ width: `${Math.max(4, (r.cost / maxCost) * 100)}%` }}
                  />
                  <div className="absolute top-0 h-full w-px bg-slate-400/70" style={{ left: `${Math.min(98, (avgCost / maxCost) * 100)}%` }} />
                </div>
              </button>
            ))}
          </div>
        </Card>
        <div className="relative overflow-hidden rounded-3xl bg-[#071526] p-5 text-white lg:col-span-2">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-emerald-400/15 blur-3xl" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">Snapshot</p>
          <h3 className="mt-1 text-xl font-semibold">Summary armada</h3>
          <p className="mt-1 text-xs text-slate-400">{summary.n} unit · {summary.jobs} WO selesai</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Skor rata-rata</div>
              <div className="mt-1 text-2xl font-semibold">{summary.avgScore}</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" style={{ width: `${summary.avgScore}%` }} />
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Cost / KM</div>
              <div className="mt-1 text-lg font-semibold leading-tight">{fmt(Math.round(summary.cpk))}</div>
              <div className="mt-1 text-[11px] text-slate-400">{fmtN(summary.km)} KM</div>
            </div>
          </div>

          {summary.best && (
            <Link href={`/kendaraan/${summary.best.v.id}`} className="mt-3 flex items-center gap-3 rounded-2xl bg-emerald-400/10 p-3 ring-1 ring-emerald-400/30">
              <img src={vehiclePhoto(summary.best.v)} alt="" className="h-12 w-16 rounded-xl object-cover" />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">Paling ekonomis</div>
                <div className="truncate font-semibold">{summary.best.v.plate}</div>
                <div className="text-xs text-slate-400">{summary.best.v.model} · skor {summary.best.score}</div>
              </div>
            </Link>
          )}
          {summary.top && (
            <Link href={`/kendaraan/${summary.top.v.id}`} className="mt-2 flex items-center gap-3 rounded-2xl bg-rose-400/10 p-3 ring-1 ring-rose-400/25">
              <img src={vehiclePhoto(summary.top.v)} alt="" className="h-12 w-16 rounded-xl object-cover" />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-rose-300">Biaya tertinggi</div>
                <div className="truncate font-semibold">{summary.top.v.plate}</div>
                <div className="text-xs text-slate-400">{summary.top.v.model} · {fmt(summary.top.cost)}</div>
              </div>
            </Link>
          )}
          {summary.peak && (
            <div className="mt-2 rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-300 ring-1 ring-white/10">
              WO terbesar: <b className="text-white">{summary.peak.plate}</b> {fmt(summary.peak.peak.cost)}
              <span className="text-slate-500"> · {summary.peak.peak.date} · {summary.peak.peak.type}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b px-4 py-4">
          <div>
            <h3 className="font-semibold">Peringkat sparepart</h3>
            <p className="text-xs text-slate-500">Cari nama item, klik baris untuk unit yang paling boros.</p>
          </div>
          <input
            className="w-full max-w-xs rounded-xl border bg-slate-50 px-3 py-2 text-sm sm:w-64"
            placeholder="Cari oli, ban, filter…"
            value={partQ}
            onChange={(e) => setPartQ(e.target.value)}
          />
        </div>
        <div className="divide-y">
          {partShown.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-400">Tidak ada sparepart.</p>}
          {partShown.map((p) => {
            const top = p.units[0];
            const on = partOpen === p.name;
            const maxP = Math.max(partIndex[0]?.total || 1, 1);
            return (
              <div key={p.name} className={on ? "bg-slate-50" : ""}>
                <button type="button" className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left" onClick={() => setPartOpen(on ? null : p.name)}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-semibold">{p.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">{p.cat}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#071526] to-sky-400" style={{ width: `${Math.max(6, (p.total / maxP) * 100)}%` }} />
                    </div>
                    {top && <div className="mt-1 text-xs text-slate-500">Termahal: {top.plate} {top.model} · {fmt(top.amount)}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{fmt(p.total)}</div>
                    <div className="text-[11px] text-slate-400">{p.qty} pcs · {p.units.length} unit</div>
                  </div>
                </button>
                {on && (
                  <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
                    {p.units.map((u, i) => (
                      <Link key={u.id} href={`/kendaraan/${u.id}`} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
                        <span>
                          {i === 0 && <span className="mr-1 text-[10px] font-semibold uppercase text-amber-700">#1</span>}
                          <b>{u.plate}</b>
                          <span className="text-slate-500"> {u.model}</span>
                        </span>
                        <span className="font-semibold">{fmt(u.amount)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className="min-w-[200px] flex-1 rounded-xl border bg-white px-3 py-2 text-sm"
          placeholder="Cari plat, model, driver…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {(["cost", "score", "cpk"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setSort(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${sort === k ? "bg-[#071526] !text-white" : "bg-white ring-1 ring-slate-200"}`}
          >
            {k === "cost" ? "Urut biaya" : k === "score" ? "Urut skor" : "Urut cost/KM"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.map((r) => {
          const vsAvg = r.cost - avgCost;
          const isOpen = open === r.v.id;
          const bar = r.score >= 75 ? "from-emerald-400 to-sky-400" : r.score >= 55 ? "from-amber-400 to-orange-400" : "from-red-400 to-rose-500";
          return (
            <div key={r.v.id} className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
              <button type="button" className="flex w-full flex-wrap items-center gap-3 p-4 text-left" onClick={() => setOpen(isOpen ? null : r.v.id)}>
                <img src={vehiclePhoto(r.v)} alt="" className="h-16 w-24 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{r.v.plate}</span>
                    <span className="text-slate-500">{r.v.brand} {r.v.model}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${r.score >= 75 ? "bg-emerald-50 text-emerald-700" : r.score >= 55 ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"}`}>
                      Skor {r.score} · {r.verdict}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {fmtN(r.v.km)} KM · {r.jobs} WO · Cost/KM {fmt(Math.round(r.cpk))} · vs rata-rata {vsAvg >= 0 ? "+" : ""}{fmt(Math.round(vsAvg))}
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full bg-gradient-to-r ${bar}`} style={{ width: `${r.score}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{fmt(r.cost)}</div>
                  <div className="text-[11px] text-slate-400">{isOpen ? "Tutup rincian" : "Buka rincian"}</div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/70 p-4">
                  <div className="mb-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                      <div className="text-[11px] uppercase text-slate-400">Servis termahal</div>
                      {r.peak ? (
                        <>
                          <div className="font-semibold">{fmt(r.peak.cost)}</div>
                          <div className="text-xs text-slate-500">{r.peak.date} · {r.peak.type}</div>
                          <div className="text-xs text-slate-400">{r.peak.shop || "Bengkel"}</div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-400">Belum ada WO selesai</div>
                      )}
                    </div>
                    <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                      <div className="text-[11px] uppercase text-slate-400">Vs armada</div>
                      <div className="text-sm">
                        Biaya {vsAvg > 0 ? <b className="text-red-600">{fmt(Math.round(vsAvg))} lebih mahal</b> : <b className="text-emerald-700">{fmt(Math.round(Math.abs(vsAvg)))} lebih hemat</b>} dari rata-rata.
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Ranking biaya #{[...rows].sort((a, b) => b.cost - a.cost).findIndex((x) => x.v.id === r.v.id) + 1} dari {rows.length}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                      <div className="text-[11px] uppercase text-slate-400">Health & driver</div>
                      <div className="font-semibold">{r.v.health}/100</div>
                      <div className="text-xs text-slate-500">{r.v.driver} · {r.v.dept}</div>
                      <Link href={`/kendaraan/${r.v.id}`} className="mt-1 inline-block text-xs font-semibold text-sky-700">Dossier unit →</Link>
                    </div>
                  </div>

                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Akumulasi sparepart</h4>
                  {r.parts.length === 0 ? (
                    <p className="mb-4 text-sm text-slate-400">Tidak ada item sparepart pada WO selesai.</p>
                  ) : (
                    <div className="mb-4 overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
                      <table className="w-full min-w-[480px] text-sm">
                        <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
                          <tr>
                            {["Nama", "Qty", "Total"].map((h) => (
                              <th key={h} className="px-3 py-2">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {r.parts.map((p) => (
                            <tr key={p.name} className="border-t">
                              <td className="px-3 py-2">{p.name}</td>
                              <td className="px-3 py-2">{p.qty}</td>
                              <td className="px-3 py-2 font-semibold">{fmt(p.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Riwayat WO (rinci)</h4>
                  <div className="space-y-2">
                    {r.done.length === 0 && <p className="text-sm text-slate-400">Belum ada histori selesai.</p>}
                    {r.done.map((m) => {
                      const partsSum = m.items.reduce((s, it) => s + it.qty * it.price, 0);
                      const jasa = Number(m.jasa) || 0;
                      const total = typeof m.jasa === "number" ? partsSum + jasa : m.cost;
                      return (
                      <div key={m.id} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                        <div className="flex flex-wrap justify-between gap-2">
                          <div>
                            <div className="font-semibold">{m.type}</div>
                            <div className="text-xs text-slate-500">{m.date} · {m.id} · KM {fmtN(m.km)} · {m.shop || "—"}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{fmt(m.cost)}</div>
                            <div className="text-[11px] text-slate-400">Total WO selesai</div>
                          </div>
                        </div>
                        {(m.complaint || m.action) && (
                          <p className="mt-1 text-sm text-slate-600">{m.complaint || "—"} → {m.action || "—"}</p>
                        )}
                        {m.items.length > 0 && (
                          <ul className="mt-2 space-y-1 text-sm text-slate-600">
                            {m.items.map((it) => (
                              <li key={it.name} className="flex justify-between gap-3">
                                <span>{it.name} × {it.qty} @ {fmt(it.price)}</span>
                                <span className="font-medium">{fmt(it.qty * it.price)}</span>
                              </li>
                            ))}
                            <li className="flex justify-between border-t border-slate-100 pt-1 text-xs text-slate-500">
                              <span>Subtotal sparepart</span>
                              <span>{fmt(partsSum)}</span>
                            </li>
                            {jasa > 0 && (
                              <li className="flex justify-between text-xs text-slate-500">
                                <span>Jasa bengkel / lain-lain</span>
                                <span>{fmt(jasa)}</span>
                              </li>
                            )}
                            <li className="flex justify-between font-semibold">
                              <span>Total WO</span>
                              <span>{fmt(total)}</span>
                            </li>
                          </ul>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
