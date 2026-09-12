"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Shell } from "@/components/shell";
import { VehiclePopup } from "@/components/vehicle-popup";
import { dueServiceKm, fmt, fmtN, inferOwnerKind, kmToService, vehiclePhoto, type Vehicle } from "@/lib/data";
import { statsFor } from "@/lib/analytics";
import { loadFleet } from "@/lib/fleet-store";
import { loadJobs } from "@/lib/maintenance-store";
import { loadBookings, ymd } from "@/lib/schedule-store";
import type { Maintenance } from "@/lib/data";

type SortKey = "health" | "km" | "cost" | "ban" | "jobs";

export default function Page() {
  const [sort, setSort] = useState<SortKey>("health");
  const [open, setOpen] = useState<Vehicle | null>(null);
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Maintenance[]>([]);
  const [inUseIds, setInUseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFleet(loadFleet());
    setJobs(loadJobs());
    const today = ymd(new Date());
    const used = new Set(
      loadBookings()
        .filter((b) => b.date === today && b.status === "disetujui")
        .map((b) => b.vehicleId)
    );
    setInUseIds(used);
  }, []);

  const rows = useMemo(() => {
    const list = fleet.map((v) => ({ ...v, ...statsFor(v, jobs) }));
    list.sort((a, b) => {
      if (sort === "km") return b.km - a.km;
      if (sort === "cost") return b.cost - a.cost;
      if (sort === "ban") return b.ban - a.ban;
      if (sort === "jobs") return b.jobs - a.jobs;
      return b.health - a.health;
    });
    return list;
  }, [sort, fleet, jobs]);
  const maxKm = Math.max(...rows.map((r) => r.km), 1);
  const maxCost = Math.max(...rows.map((r) => r.cost), 1);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalKm = rows.reduce((s, r) => s + r.km, 0);
  const avgHealth = rows.length ? Math.round(rows.reduce((s, r) => s + r.health, 0) / rows.length) : 0;
  const milikSig = rows.filter((r) => inferOwnerKind(r) === "sig").length;
  const milikVendor = rows.filter((r) => inferOwnerKind(r) === "vendor").length;
  const nMaint = rows.filter((r) => r.status === "maintenance").length;
  const nUsed = rows.filter((r) => r.status !== "maintenance" && inUseIds.has(r.id)).length;
  const nReady = rows.filter((r) => r.status !== "maintenance" && r.status !== "inactive" && !inUseIds.has(r.id)).length;
  const dueSoon = rows
    .map((r) => ({ ...r, left: kmToService(r) }))
    .filter((r) => r.left <= 1500)
    .sort((a, b) => a.left - b.left);

  const filters: { id: SortKey; label: string }[] = [
    { id: "health", label: "Skor tertinggi" },
    { id: "km", label: "KM terbanyak" },
    { id: "cost", label: "Biaya maintenance" },
    { id: "ban", label: "Ganti ban" },
    { id: "jobs", label: "Frekuensi servis" },
  ];

  return (
    <Shell title="Command Dashboard">
      <section className="anim relative mb-6 overflow-hidden rounded-3xl">
        <img src="/images/hero-fleet.png" alt="" className="h-48 w-full object-cover sm:h-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050b16] via-[#050b16]/70 to-transparent" />
        <div className="absolute inset-0 flex items-end justify-between p-7 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-sky-300">Live fleet intelligence</p>
            <h2 className="text-3xl font-semibold tracking-tight">Semua unit. Semua biaya. Satu klik.</h2>
            <p className="mt-1 max-w-lg text-sm text-slate-300">Klik kartu mobil untuk dossier lengkap, barcode BBM, dan histori servis.</p>
          </div>
          <div className="hidden rounded-2xl bg-white/10 px-5 py-3 text-right backdrop-blur md:block">
            <div className="text-xs text-sky-200">Health rata-rata</div>
            <div className="text-4xl font-semibold">{avgHealth}</div>
          </div>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { l: "Armada", v: String(rows.length), s: "Unit terdaftar", tone: "navy", hint: "siap operasi" },
          { l: "Total kilometer", v: `${fmtN(totalKm)} km`, s: "Akumulasi odometer", tone: "sky", hint: "semua unit" },
          { l: "Biaya maintenance", v: fmt(totalCost), s: "WO selesai", tone: "amber", hint: "sama dengan halaman Maintenance" },
          { l: "Cost per KM", v: fmt(Math.round(totalCost / Math.max(totalKm, 1))), s: "Efisiensi armada", tone: "mint", hint: "semakin rendah semakin baik" },
        ].map((k) => {
          const skin: Record<string, string> = {
            navy: "bg-[#071526] text-white ring-white/10",
            sky: "bg-white text-slate-900 ring-sky-100",
            amber: "bg-white text-slate-900 ring-amber-100",
            mint: "bg-white text-slate-900 ring-emerald-100",
          };
          const pip: Record<string, string> = {
            navy: "bg-sky-400",
            sky: "bg-sky-500",
            amber: "bg-amber-500",
            mint: "bg-emerald-500",
          };
          const sub: Record<string, string> = {
            navy: "text-slate-400",
            sky: "text-slate-500",
            amber: "text-slate-500",
            mint: "text-slate-500",
          };
          return (
            <div key={k.l} className={`anim card-hover min-h-[132px] rounded-2xl p-5 ring-1 ${skin[k.tone]}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${k.tone === "navy" ? "text-sky-300" : "text-slate-500"}`}>
                  {k.l}
                </span>
                <span className={`h-2 w-2 rounded-full ${pip[k.tone]}`} />
              </div>
              <div className="mt-3 break-words text-[1.65rem] font-semibold leading-tight tracking-tight">{k.v}</div>
              <div className={`mt-2 text-xs ${sub[k.tone]}`}>
                {k.s}
                <span className="mx-1 opacity-40">·</span>
                {k.hint}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Tersedia</div>
          <div className="mt-1 text-4xl font-semibold tracking-tight text-emerald-900">{nReady}</div>
          <p className="mt-1 text-sm text-emerald-800/70">siap dipakai hari ini</p>
        </div>
        <div className="rounded-3xl bg-amber-50 p-5 ring-1 ring-amber-100">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Sedang dipakai</div>
          <div className="mt-1 text-4xl font-semibold tracking-tight text-amber-950">{nUsed}</div>
          <p className="mt-1 text-sm text-amber-800/70">pengajuan disetujui hari ini</p>
        </div>
        <div className="rounded-3xl bg-red-50 p-5 ring-1 ring-red-100">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-red-700">Sedang Maintenance</div>
          <div className="mt-1 text-4xl font-semibold tracking-tight text-red-950">{nMaint}</div>
          <p className="mt-1 text-sm text-red-800/70">work order proses / bengkel</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">Milik pribadi · PT SIG</div>
          <div className="mt-1 text-4xl font-semibold tracking-tight">{milikSig}</div>
          <p className="mt-1 text-sm text-slate-500">unit aset sendiri</p>
        </div>
        <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-600">Milik vendor / rental</div>
          <div className="mt-1 text-4xl font-semibold tracking-tight">{milikVendor}</div>
          <p className="mt-1 text-sm text-slate-500">unit sewa / mitra</p>
        </div>
      </div>

      {dueSoon.length > 0 && (
        <Card className="mb-6">
          <h3 className="mb-3 text-sm font-semibold">Mendekati jatuh tempo servis (≤ 1.500 km)</h3>
          <div className="space-y-2">
            {dueSoon.map((v) => (
              <button key={v.id} type="button" onClick={() => setOpen(v)} className="flex w-full items-center gap-3 rounded-xl bg-amber-50 px-3 py-2 text-left">
                <img src={vehiclePhoto(v)} alt="" className="h-10 w-14 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{v.plate} · {v.brand} {v.model}</div>
                  <div className="text-xs text-slate-500">
                    KM {fmtN(v.km)} → servis {fmtN(v.km + v.left)}
                    {v.left <= 0 ? " · terlambat" : ` · sisa ${fmtN(v.left)} km`}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${v.left <= 0 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>
                  {v.left <= 0 ? "Overdue" : "Segera"}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Urutkan</span>
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setSort(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              sort === f.id ? "bg-[#071526] text-white shadow-lg" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((v) => {
          const rental = inferOwnerKind(v) === "vendor";
          return (
            <article
              key={v.id}
              className="card-hover group overflow-hidden rounded-3xl bg-white text-left shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80"
            >
              <button type="button" onClick={() => setOpen(v)} className="relative block h-52 w-full overflow-hidden">
                <img src={vehiclePhoto(v)} alt="" className="img-zoom h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <Badge status={v.status} />
                  {rental && (
                    <span className="rounded-full bg-violet-500 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow">
                      Rental
                    </span>
                  )}
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-left text-white">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-sky-200">{v.plate}</div>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {v.brand} {v.model}
                  </h3>
                </div>
              </button>
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Health <b className="text-slate-800">{v.health}</b>
                  </span>
                  <span>{v.year} · {v.color}</span>
                </div>
                <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                    style={{ width: `${v.health}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 py-2">
                    <div className="text-sm font-semibold text-slate-800">{fmtN(v.km)}</div>
                    <div className="text-[10px] uppercase text-slate-400">KM</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 py-2">
                    <div className="truncate px-1 text-sm font-semibold text-slate-800">{v.driver.split(" ")[0]}</div>
                    <div className="text-[10px] uppercase text-slate-400">Driver</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 py-2">
                    <div className="truncate px-1 text-sm font-semibold text-slate-800">{v.dept.split(" ")[0]}</div>
                    <div className="text-[10px] uppercase text-slate-400">Dept</div>
                  </div>
                </div>
                <div className="mt-2 rounded-xl bg-sky-50 px-3 py-2 text-center">
                  <div className="text-sm font-semibold text-sky-900">{fmtN(dueServiceKm(v))}</div>
                  <div className="text-[10px] uppercase text-sky-600">KM servis selanjutnya</div>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/kendaraan/${v.id}`}
                    className="block rounded-xl bg-[#071526] py-2.5 text-center text-xs font-semibold !text-white hover:bg-[#0c2340]"
                  >
                    Detail
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold">Ranking kilometer</h3>
          {rows
            .slice()
            .sort((a, b) => b.km - a.km)
            .map((v) => (
              <button key={v.id} onClick={() => setOpen(v)} className="mb-2 flex w-full items-center gap-3 text-left">
                <img src={vehiclePhoto(v)} alt="" className="h-9 w-12 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate font-medium">{v.plate}</span>
                    <span>{fmtN(v.km)} km</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-sky-500" style={{ width: `${(v.km / maxKm) * 100}%` }} />
                  </div>
                </div>
              </button>
            ))}
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-semibold">Ranking biaya maintenance</h3>
          {rows
            .slice()
            .sort((a, b) => b.cost - a.cost)
            .map((v) => (
              <button key={v.id} onClick={() => setOpen(v)} className="mb-2 flex w-full items-center gap-3 text-left">
                <img src={vehiclePhoto(v)} alt="" className="h-9 w-12 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate font-medium">
                      {v.model} · {v.jobs}x servis · ban {v.ban}x
                    </span>
                    <span>{fmt(v.cost)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-amber-500" style={{ width: `${(v.cost / maxCost) * 100}%` }} />
                  </div>
                </div>
              </button>
            ))}
        </Card>
      </div>

      <Card className="mt-4 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
            <tr>
              {["Unit", "Skor", "KM", "Biaya", "Servis", "Ban", "Oli", "Rem", "AC"].map((h) => (
                <th key={h} className="px-4 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="cursor-pointer border-t hover:bg-sky-50" onClick={() => setOpen(v)}>
                <td className="px-4 py-2 font-medium">
                  {v.plate}
                  <span className="block text-[11px] text-slate-400">{v.model}</span>
                </td>
                <td className="px-4 py-2">{v.health}</td>
                <td className="px-4 py-2">{fmtN(v.km)}</td>
                <td className="px-4 py-2">{fmt(v.cost)}</td>
                <td className="px-4 py-2">{v.jobs}</td>
                <td className="px-4 py-2">{v.ban}</td>
                <td className="px-4 py-2">{v.oli}</td>
                <td className="px-4 py-2">{v.rem}</td>
                <td className="px-4 py-2">{v.ac}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {open && <VehiclePopup v={open} onClose={() => setOpen(null)} />}
    </Shell>
  );
}
