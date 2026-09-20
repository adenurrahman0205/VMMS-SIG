"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, Shell } from "@/components/shell";
import { VehiclePopup } from "@/components/vehicle-popup";
import {
  docsForVehicle,
  docStatusFromExpire,
  dueServiceKm,
  fmt,
  fmtN,
  isAsuransiDoc,
  isPajakDoc,
  kmToService,
  vehiclePhoto,
  type Maintenance,
  type Vehicle,
  type VehicleDoc,
} from "@/lib/data";
import { statsFor } from "@/lib/analytics";
import { loadFleet } from "@/lib/fleet-store";
import { loadJobs } from "@/lib/maintenance-store";

type Row = Vehicle & ReturnType<typeof statsFor>;
type UseFilter = "all" | "ready" | "maint";
type DueItem = { v: Vehicle; d: VehicleDoc; left: number };

function DueDocCard({
  title,
  hint,
  items,
  tone,
  onOpen,
}: {
  title: string;
  hint: string;
  items: DueItem[];
  tone: "rose" | "sky";
  onOpen: (v: Vehicle) => void;
}) {
  const head = tone === "rose" ? "bg-rose-50" : "bg-sky-50";
  const titleC = tone === "rose" ? "text-rose-950" : "text-sky-950";
  const hintC = tone === "rose" ? "text-rose-800/80" : "text-sky-800/80";
  const badge = tone === "rose" ? "bg-rose-200/80 text-rose-950" : "bg-sky-200/80 text-sky-950";
  const hover = tone === "rose" ? "hover:bg-rose-50/70" : "hover:bg-sky-50/70";
  const line = tone === "rose" ? "divide-rose-100" : "divide-sky-100";
  return (
    <Card className="overflow-hidden p-0">
      <div className={`flex items-center justify-between px-4 py-3 ${head}`}>
        <div>
          <h2 className={`text-sm font-semibold ${titleC}`}>{title}</h2>
          <p className={`text-xs ${hintC}`}>{hint}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>{items.length} unit</span>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-400">Tidak ada yang jatuh tempo.</p>
      ) : (
        <div className={`max-h-72 divide-y overflow-auto ${line}`}>
          {items.map((it) => (
            <button
              key={it.v.id + it.d.type + it.d.expire}
              type="button"
              onClick={() => onOpen(it.v)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${hover}`}
            >
              <img src={vehiclePhoto(it.v)} alt="" className="h-11 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {it.v.plate} · {it.v.brand} {it.v.model}
                </div>
                <div className="text-xs text-slate-500">
                  {it.d.type} s.d. {it.d.expire || "—"}
                  {it.d.amount ? ` · ${fmt(it.d.amount)}` : ""}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  it.left < 0 ? "bg-red-100 text-red-800" : "bg-white text-amber-900 ring-1 ring-amber-200"
                }`}
              >
                {it.left < 0 ? `Lewat ${Math.abs(it.left)} hr` : `${it.left} hari`}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="border-t px-4 py-2.5">
        <Link href="/dokumen" className="text-xs font-semibold text-sky-700">
          Buka dokumen →
        </Link>
      </div>
    </Card>
  );
}

export default function Page() {
  const [q, setQ] = useState("");
  const [useF, setUseF] = useState<UseFilter>("all");
  const [open, setOpen] = useState<Vehicle | null>(null);
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Maintenance[]>([]);
  const [showAllCards, setShowAllCards] = useState(false);

  useEffect(() => {
    setFleet(loadFleet());
    setJobs(loadJobs());
  }, []);

  const rows = useMemo(() => fleet.map((v) => ({ ...v, ...statsFor(v, jobs) })), [fleet, jobs]);
  const totalCost = jobs.filter((j) => j.status === "selesai").reduce((s, j) => s + j.cost, 0);
  const totalKm = rows.reduce((s, r) => s + r.km, 0);
  const nMaint = rows.filter((r) => r.status === "maintenance").length;
  const nReady = rows.filter((r) => r.status !== "maintenance" && r.status !== "inactive").length;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((v) => {
      if (useF === "ready" && (v.status === "maintenance" || v.status === "inactive")) return false;
      if (useF === "maint" && v.status !== "maintenance") return false;
      if (!s) return true;
      return `${v.plate} ${v.brand} ${v.model} ${v.driver} ${v.dept} ${v.color}`.toLowerCase().includes(s);
    });
  }, [rows, q, useF]);

  const cards = showAllCards ? filtered : filtered.slice(0, 8);
  const topKm = [...rows].sort((a, b) => b.km - a.km).slice(0, 5);
  const topCost = [...rows].sort((a, b) => b.cost - a.cost).slice(0, 5);
  const maxKm = Math.max(...topKm.map((r) => r.km), 1);
  const maxCost = Math.max(...topCost.map((r) => r.cost), 1);

  const dueSoon = useMemo(
    () =>
      rows
        .map((v) => ({ ...v, left: kmToService(v) }))
        .filter((v) => v.left <= 1500)
        .sort((a, b) => a.left - b.left)
        .slice(0, 8),
    [rows]
  );

  const dueDocs = useMemo(() => {
    type Item = { v: Vehicle; d: VehicleDoc; left: number };
    const pajak: Item[] = [];
    const asuransi: Item[] = [];
    const today = Date.now();
    fleet.forEach((v) => {
      docsForVehicle(v).forEach((raw) => {
        const d = { ...raw, status: docStatusFromExpire(raw.expire) };
        if (d.status !== "segera" && d.status !== "expired") return;
        const t = d.expire ? new Date(d.expire + "T00:00:00").getTime() : today;
        const left = Math.ceil((t - today) / 86400000);
        const item = { v, d, left };
        if (isPajakDoc(d.type)) pajak.push(item);
        else if (isAsuransiDoc(d.type)) asuransi.push(item);
      });
    });
    const urg = (a: Item, b: Item) => a.left - b.left;
    pajak.sort(urg);
    asuransi.sort(urg);
    return { pajak, asuransi };
  }, [fleet]);

  function usageOf(v: Row) {
    if (v.status === "maintenance") return "maintenance";
    return "ready";
  }

  const kpis = [
    { l: "Tersedia", v: String(nReady), s: "Siap operasi", click: () => setUseF("ready"), c: "text-emerald-300", bar: "bg-emerald-400", pct: rows.length ? nReady / rows.length : 0 },
    { l: "Bengkel", v: String(nMaint), s: "Sedang perawatan", click: () => setUseF("maint"), c: "text-amber-300", bar: "bg-amber-400", pct: rows.length ? nMaint / rows.length : 0 },
    { l: "Pajak jatuh tempo", v: String(dueDocs.pajak.length), s: "Unit pajak due", click: () => undefined, c: "text-rose-300", bar: "bg-rose-400", pct: rows.length ? dueDocs.pajak.length / rows.length : 0 },
    { l: "Asuransi jatuh tempo", v: String(dueDocs.asuransi.length), s: "Unit asuransi due", click: () => undefined, c: "text-cyan-300", bar: "bg-cyan-400", pct: rows.length ? dueDocs.asuransi.length / rows.length : 0 },
    { l: "Jatuh tempo servis", v: String(dueSoon.length), s: "Mobil dekat servis", click: () => undefined, c: "text-red-300", bar: "bg-red-400", pct: rows.length ? dueSoon.length / rows.length : 0 },
    { l: "Total KM", v: fmtN(totalKm), s: "Akumulasi odometer", click: () => setUseF("all"), c: "text-sky-300", bar: "bg-sky-400", pct: 0.72 },
    { l: "Biaya WO", v: fmt(totalCost), s: "WO selesai", click: () => undefined, c: "text-orange-300", bar: "bg-orange-400", pct: 0.55 },
    { l: "Cost / KM", v: fmt(Math.round(totalCost / Math.max(totalKm, 1))), s: "Efisiensi armada", click: () => undefined, c: "text-violet-300", bar: "bg-violet-400", pct: 0.4 },
  ];

  return (
    <Shell title="Command Dashboard">
      <div className="mb-5 grid gap-3 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => setUseF("all")}
          className="anim relative overflow-hidden rounded-[28px] p-6 text-left text-white shadow-xl lg:col-span-2"
        >
          <img src="/images/hero-fleet.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#071526] via-[#071526]/85 to-sky-900/40" />
          <div className="relative flex h-full min-h-[200px] flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200 backdrop-blur">Live fleet</span>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                Online
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-300">Total armada</div>
              <div className="mt-1 text-6xl font-semibold tracking-tight">{rows.length}</div>
              <div className="mt-2 text-sm text-slate-300">{nReady} tersedia · {nMaint} bengkel · {dueSoon.length} dekat servis</div>
            </div>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-3">
          {kpis.map((k, i) => (
            <button
              key={k.l}
              type="button"
              onClick={k.click}
              style={{ animationDelay: `${80 + i * 50}ms` }}
              className="anim group relative overflow-hidden rounded-[22px] bg-[#0b1a2e] p-4 text-left text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-sky-400/40"
            >
              <div className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${k.c}`}>{k.l}</div>
              <div className="mt-3 truncate text-xl font-semibold tracking-tight sm:text-2xl">{k.v}</div>
              <div className="mt-1 text-[11px] text-slate-400">{k.s}</div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${k.bar} transition-all duration-700 group-hover:w-full`} style={{ width: `${Math.max(12, Math.min(100, k.pct * 100))}%` }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <DueDocCard
          title="Pajak jatuh tempo"
          hint="Expired atau ≤ 60 hari"
          items={dueDocs.pajak}
          tone="rose"
          onOpen={setOpen}
        />
        <DueDocCard
          title="Asuransi jatuh tempo"
          hint="Expired atau ≤ 60 hari"
          items={dueDocs.asuransi}
          tone="sky"
          onOpen={setOpen}
        />
      </div>

      {dueSoon.length > 0 && (
        <Card className="mb-5 overflow-hidden p-0">
          <div className="flex items-center justify-between bg-amber-50 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-amber-950">Mendekati jatuh tempo servis</h2>
              <p className="text-xs text-amber-800/80">Sisa ≤ 1.500 km ke KM servis berikutnya</p>
            </div>
            <span className="rounded-full bg-amber-200/80 px-2.5 py-1 text-xs font-semibold text-amber-950">{dueSoon.length} unit</span>
          </div>
          <div className="divide-y divide-amber-100">
            {dueSoon.map((v) => (
              <button key={v.id} type="button" onClick={() => setOpen(v)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-amber-50/70">
                <img src={vehiclePhoto(v)} alt="" className="h-11 w-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{v.plate} · {v.brand} {v.model}</div>
                  <div className="text-xs text-slate-500">KM {fmtN(v.km)} → servis {fmtN(dueServiceKm(v))}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${v.left <= 0 ? "bg-red-100 text-red-800" : "bg-white text-amber-900 ring-1 ring-amber-200"}`}>
                  {v.left <= 0 ? "Overdue" : `sisa ${fmtN(v.left)} km`}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <span className="mr-2 text-slate-400">⌕</span>
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Cari plat, merk, model, driver…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {([
            ["all", "Semua"],
            ["ready", "Tersedia"],
            ["maint", "Bengkel"],
          ] as const).map(([id, l]) => (
            <button
              key={id}
              type="button"
              onClick={() => setUseF(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${useF === id ? "bg-[#071526] !text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 text-xs text-slate-500">{filtered.length} unit</div>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((v) => {
          const kind = usageOf(v);
          const pill = kind === "maintenance" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700";
          const label = kind === "maintenance" ? "Maintenance" : "Tersedia";
          return (
            <article key={v.id} className="flex overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <button type="button" onClick={() => setOpen(v)} className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
                <img src={vehiclePhoto(v)} alt="" className="h-full w-full object-cover" />
              </button>
              <div className="min-w-0 flex-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-sky-700">{v.plate}</div>
                    <h3 className="truncate text-sm font-semibold">{v.brand} {v.model}</h3>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${pill}`}>{label}</span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">{v.driver} · {v.year}</p>
                <p className="text-xs text-slate-400">{fmtN(v.km)} km</p>
                <Link href={`/kendaraan/${v.id}`} className="mt-2 inline-block text-[11px] font-semibold text-sky-700">Detail →</Link>
              </div>
            </article>
          );
        })}
      </div>
      {filtered.length > 8 && (
        <button type="button" onClick={() => setShowAllCards((v) => !v)} className="mb-6 w-full rounded-xl border bg-white py-2 text-sm font-semibold text-slate-600">
          {showAllCards ? "Tampilkan lebih sedikit" : `Tampilkan semua ${filtered.length} unit`}
        </button>
      )}

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Top 5 kilometer</h3>
          <div className="space-y-2">
            {topKm.map((v, i) => (
              <button key={v.id} type="button" onClick={() => setOpen(v)} className="flex w-full items-center gap-3 text-left">
                <span className="w-5 text-xs font-bold text-slate-400">{i + 1}</span>
                <img src={vehiclePhoto(v)} alt="" className="h-8 w-11 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate font-medium">{v.plate}</span>
                    <span className="shrink-0 pl-2">{fmtN(v.km)} km</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-sky-500" style={{ width: `${(v.km / maxKm) * 100}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Top 5 biaya maintenance</h3>
          <div className="space-y-2">
            {topCost.map((v, i) => (
              <button key={v.id} type="button" onClick={() => setOpen(v)} className="flex w-full items-center gap-3 text-left">
                <span className="w-5 text-xs font-bold text-slate-400">{i + 1}</span>
                <img src={vehiclePhoto(v)} alt="" className="h-8 w-11 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate font-medium">{v.model}</span>
                    <span className="shrink-0 pl-2">{fmt(v.cost)}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-amber-500" style={{ width: `${(v.cost / maxCost) * 100}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
        <div className="border-b px-5 py-4">
          <h3 className="text-lg font-semibold">Ringkasan armada</h3>
          <p className="mt-0.5 text-xs text-slate-500">{filtered.length} unit · {fmtN(totalKm)} KM · WO selesai {fmt(totalCost)}</p>
        </div>
        <div className="hidden border-b bg-slate-50 px-5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:grid lg:grid-cols-12 lg:gap-4">
          <span className="col-span-4">Unit</span>
          <span className="col-span-2">Driver</span>
          <span className="col-span-2">KM / servis</span>
          <span className="col-span-2">Biaya WO</span>
          <span className="col-span-2">Health</span>
        </div>
        <div className="max-h-[540px] divide-y overflow-y-auto">
          {filtered.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-400">Tidak ada unit pada filter ini.</p>}
          {filtered.map((v) => {
            const kind = usageOf(v);
            const left = kmToService(v);
            const due = dueServiceKm(v);
            const label = kind === "maintenance" ? "Diservice" : v.status === "inactive" ? "Nonaktif" : "Tersedia";
            const chip =
              kind === "maintenance"
                ? "bg-red-50 text-red-700"
                : v.status === "inactive"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-emerald-50 text-emerald-700";
            const hb = v.health >= 75 ? "bg-emerald-500" : v.health >= 55 ? "bg-amber-500" : "bg-red-500";
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setOpen(v)}
                className="grid w-full grid-cols-1 items-center gap-4 px-5 py-3.5 text-left transition hover:bg-slate-50 lg:grid-cols-12"
              >
                <div className="flex items-center gap-3 lg:col-span-4">
                  <img src={vehiclePhoto(v)} alt="" className="h-14 w-20 shrink-0 rounded-2xl object-cover" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{v.plate}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${chip}`}>{label}</span>
                    </div>
                    <div className="truncate text-xs text-slate-500">{v.brand} {v.model} · {v.year}</div>
                    <div className="text-[11px] text-slate-400">{v.color} · {v.ownerKind === "vendor" ? "Vendor" : "PT Saraswanti Indo Genetech"}</div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="truncate text-sm font-medium">{v.driver || "—"}</div>
                  <div className="truncate text-xs text-slate-500">{v.dept || "—"}</div>
                </div>
                <div className="lg:col-span-2">
                  <div className="text-sm font-semibold">{fmtN(v.km)} KM</div>
                  <div className={`text-xs ${left <= 0 ? "font-semibold text-red-600" : left < 1000 ? "text-amber-700" : "text-slate-500"}`}>
                    {left <= 0 ? "Lewat servis" : `Servis ${fmtN(left)} KM`} · {fmtN(due)}
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="text-sm font-semibold">{fmt(v.cost)}</div>
                  <div className="text-xs text-slate-500">{v.jobs} WO · {fmt(Math.round(v.cost / Math.max(v.km, 1)))}/KM</div>
                </div>
                <div className="lg:col-span-2">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold">{v.health}</span>
                    <span className="text-slate-400">/100</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${hb}`} style={{ width: `${v.health}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {open && <VehiclePopup v={open} onClose={() => setOpen(null)} />}
    </Shell>
  );
}
