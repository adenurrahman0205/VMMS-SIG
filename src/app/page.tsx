"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Shell } from "@/components/shell";
import { VehiclePopup } from "@/components/vehicle-popup";
import { dueServiceKm, fmt, fmtN, kmToService, vehiclePhoto, type Maintenance, type Vehicle } from "@/lib/data";
import { statsFor } from "@/lib/analytics";
import { loadFleet } from "@/lib/fleet-store";
import { loadJobs } from "@/lib/maintenance-store";
import { loadBookings, ymd, type Booking } from "@/lib/schedule-store";
import { loadUsers } from "@/lib/user-store";

type Row = Vehicle & ReturnType<typeof statsFor>;
type UseFilter = "all" | "ready" | "used" | "maint";

export default function Page() {
  const [q, setQ] = useState("");
  const [useF, setUseF] = useState<UseFilter>("all");
  const [open, setOpen] = useState<Vehicle | null>(null);
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Maintenance[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [showAllCards, setShowAllCards] = useState(false);

  useEffect(() => {
    setFleet(loadFleet());
    setJobs(loadJobs());
    const today = ymd(new Date());
    setTodayBookings(loadBookings().filter((b) => b.date === today && b.status === "disetujui"));
  }, []);

  const inUseIds = useMemo(() => new Set(todayBookings.map((b) => b.vehicleId)), [todayBookings]);
  const users = useMemo(() => (typeof window === "undefined" ? [] : loadUsers()), [fleet]);

  const rows = useMemo(() => fleet.map((v) => ({ ...v, ...statsFor(v, jobs) })), [fleet, jobs]);
  const totalCost = jobs.filter((j) => j.status === "selesai").reduce((s, j) => s + j.cost, 0);
  const totalKm = rows.reduce((s, r) => s + r.km, 0);
  const nMaint = rows.filter((r) => r.status === "maintenance").length;
  const nUsed = rows.filter((r) => r.status !== "maintenance" && inUseIds.has(r.id)).length;
  const nReady = rows.filter((r) => r.status !== "maintenance" && r.status !== "inactive" && !inUseIds.has(r.id)).length;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((v) => {
      const used = v.status !== "maintenance" && inUseIds.has(v.id);
      if (useF === "ready" && (used || v.status === "maintenance" || v.status === "inactive")) return false;
      if (useF === "used" && !used) return false;
      if (useF === "maint" && v.status !== "maintenance") return false;
      if (!s) return true;
      return `${v.plate} ${v.brand} ${v.model} ${v.driver} ${v.dept} ${v.color}`.toLowerCase().includes(s);
    });
  }, [rows, q, useF, inUseIds]);

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

  const todayUse = todayBookings.map((b) => {
    const v = fleet.find((x) => x.id === b.vehicleId);
    const u = users.find((x) => x.name.toLowerCase() === b.userName.toLowerCase());
    return { b, v, jabatan: u?.jabatan || "—", divisi: b.dept || u?.dept || "—" };
  });

  function usageOf(v: Row) {
    if (v.status === "maintenance") return "maintenance";
    if (inUseIds.has(v.id)) return "used";
    return "ready";
  }

  return (
    <Shell title="Command Dashboard">
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          { l: "Armada", v: String(rows.length), s: "unit terdaftar", tone: "navy", icon: "▣", click: () => setUseF("all") },
          { l: "Tersedia", v: String(nReady), s: "siap operasi", tone: "mint", icon: "○", click: () => setUseF("ready") },
          { l: "Dipakai", v: String(nUsed), s: "hari ini", tone: "amber", icon: "▶", click: () => setUseF("used") },
          { l: "Total kilometer", v: `${fmtN(totalKm)}`, s: "akumulasi odometer", tone: "sky", icon: "↗", click: () => setUseF("all") },
          { l: "Biaya WO", v: fmt(totalCost), s: "work order selesai", tone: "rose", icon: "Rp", click: () => undefined },
          { l: "Cost per KM", v: fmt(Math.round(totalCost / Math.max(totalKm, 1))), s: "efisiensi armada", tone: "violet", icon: "÷", click: () => undefined },
        ].map((k, i) => {
          const skin: Record<string, string> = {
            navy: "bg-[#071526] text-white ring-white/10",
            mint: "bg-gradient-to-br from-emerald-50 to-white text-emerald-950 ring-emerald-100",
            amber: "bg-gradient-to-br from-amber-50 to-white text-amber-950 ring-amber-100",
            sky: "bg-gradient-to-br from-sky-50 to-white text-sky-950 ring-sky-100",
            rose: "bg-gradient-to-br from-orange-50 to-white text-orange-950 ring-orange-100",
            violet: "bg-gradient-to-br from-violet-50 to-white text-violet-950 ring-violet-100",
          };
          const muted: Record<string, string> = {
            navy: "text-sky-300",
            mint: "text-emerald-600",
            amber: "text-amber-700",
            sky: "text-sky-600",
            rose: "text-orange-600",
            violet: "text-violet-600",
          };
          return (
            <button
              key={k.l}
              type="button"
              onClick={k.click}
              style={{ animationDelay: `${i * 70}ms` }}
              className={`kpi-shine anim card-hover relative overflow-hidden rounded-2xl p-4 text-left ring-1 ${skin[k.tone]}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${muted[k.tone]}`}>{k.l}</span>
                <span className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold ${k.tone === "navy" ? "bg-white/10 text-sky-200" : "bg-white/80"}`}>{k.icon}</span>
              </div>
              <div className="mt-3 break-words text-xl font-semibold leading-tight tracking-tight sm:text-2xl">{k.v}</div>
              <div className={`mt-1 text-[11px] ${k.tone === "navy" ? "text-slate-400" : "text-slate-500"}`}>{k.s}</div>
            </button>
          );
        })}
      </div>

      <Card className="mb-5 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Pemakaian hari ini</h2>
            <p className="text-xs text-slate-500">Pengguna, driver, unit, dan jabatan</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{todayUse.length} unit</span>
        </div>
        {todayUse.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">Belum ada unit yang disetujui dipakai hari ini.</p>
        ) : (
          <div className="max-h-64 overflow-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  {["Pengguna", "Jabatan", "Divisi", "Driver", "Kendaraan", "Keperluan"].map((h) => (
                    <th key={h} className="px-4 py-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todayUse.map(({ b, v, jabatan, divisi }) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 font-medium">{b.userName}</td>
                    <td className="px-4 py-2.5 text-slate-600">{jabatan}</td>
                    <td className="px-4 py-2.5 text-slate-600">{divisi}</td>
                    <td className="px-4 py-2.5 text-slate-600">{v?.driver || "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{v ? `${v.brand} ${v.model}` : b.vehicleId}</div>
                      <div className="text-[11px] text-slate-400">{v?.plate}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{b.purpose || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <span className="mr-2 text-slate-400">⌕</span>
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Cari plat, merk, model, driver…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {([
            ["all", "Semua"],
            ["ready", "Tersedia"],
            ["used", "Dipakai"],
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
          const pill = kind === "maintenance" ? "bg-red-50 text-red-700" : kind === "used" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700";
          const label = kind === "maintenance" ? "Maintenance" : kind === "used" ? "Dipakai" : "Tersedia";
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

      <Card className="overflow-hidden p-0">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Ringkasan armada</h3>
          <p className="text-xs text-slate-500">{fmtN(totalKm)} km akumulasi · mengikuti filter pencarian</p>
        </div>
        <div className="max-h-80 overflow-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {["Unit", "Status", "KM", "Biaya", "Servis", "Health"].map((h) => (
                  <th key={h} className="px-4 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const kind = usageOf(v);
                return (
                  <tr key={v.id} className="cursor-pointer border-t border-slate-100 hover:bg-sky-50" onClick={() => setOpen(v)}>
                    <td className="px-4 py-2">
                      <div className="font-medium">{v.plate}</div>
                      <div className="text-[11px] text-slate-400">{v.brand} {v.model}</div>
                    </td>
                    <td className="px-4 py-2">
                      <Badge status={kind === "used" ? "warning" : v.status} />
                    </td>
                    <td className="px-4 py-2">{fmtN(v.km)}</td>
                    <td className="px-4 py-2">{fmt(v.cost)}</td>
                    <td className="px-4 py-2">{v.jobs}x</td>
                    <td className="px-4 py-2">{v.health}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {open && <VehiclePopup v={open} onClose={() => setOpen(null)} />}
    </Shell>
  );
}
