"use client";

import { useMemo, useState } from "react";
import { Badge, Card, Shell } from "@/components/shell";
import { VehiclePopup } from "@/components/vehicle-popup";
import { fmt, fmtN, vehiclePhoto, type Vehicle } from "@/lib/data";
import { fleetRows } from "@/lib/analytics";

type SortKey = "health" | "km" | "cost" | "ban" | "jobs";

export default function Page() {
  const [sort, setSort] = useState<SortKey>("health");
  const [open, setOpen] = useState<Vehicle | null>(null);
  const rows = useMemo(() => {
    const list = [...fleetRows()];
    list.sort((a, b) => {
      if (sort === "km") return b.km - a.km;
      if (sort === "cost") return b.cost - a.cost;
      if (sort === "ban") return b.ban - a.ban;
      if (sort === "jobs") return b.jobs - a.jobs;
      return b.health - a.health;
    });
    return list;
  }, [sort]);
  const maxKm = Math.max(...rows.map((r) => r.km), 1);
  const maxCost = Math.max(...rows.map((r) => r.cost), 1);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalKm = rows.reduce((s, r) => s + r.km, 0);
  const avgHealth = Math.round(rows.reduce((s, r) => s + r.health, 0) / rows.length);

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

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Armada", String(rows.length), "unit aktif + nonaktif"],
          ["Total KM", fmtN(totalKm), "akumulasi odometer"],
          ["Biaya servis", fmt(totalCost), "tahun berjalan (sample)"],
          ["Cost / KM", fmt(Math.round(totalCost / Math.max(totalKm, 1))), "efisiensi armada"],
        ].map(([l, v, s], i) => (
          <Card key={l} className={`anim delay-${i + 1} border-0 bg-[#071526] text-white`}>
            <div className="text-[11px] uppercase tracking-wide text-sky-300">{l}</div>
            <div className="mt-1 text-2xl font-semibold">{v}</div>
            <div className="text-xs text-slate-400">{s}</div>
          </Card>
        ))}
      </div>

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

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((v, i) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setOpen(v)}
            className="anim card-hover overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm"
          >
            <div className="relative h-36 overflow-hidden">
              <img src={vehiclePhoto(v)} alt="" className="img-zoom h-full w-full object-cover" />
              <div className="absolute left-3 top-3">
                <Badge status={v.status} />
              </div>
              <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">
                Skor {v.health}
              </div>
            </div>
            <div className="p-4">
              <div className="font-semibold tracking-tight">
                {v.brand} {v.model}
              </div>
              <div className="text-xs text-slate-500">
                {v.plate} · #{i + 1} {filters.find((x) => x.id === sort)?.label}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                  style={{ width: `${v.health}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[10px] text-slate-500">
                <div>
                  <b className="block text-sm text-slate-800">{fmtN(v.km)}</b>KM
                </div>
                <div>
                  <b className="block text-sm text-slate-800">{v.jobs}x</b>servis
                </div>
                <div>
                  <b className="block text-sm text-slate-800">{v.ban}x</b>ban
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">Biaya {fmt(v.cost)}</div>
            </div>
          </button>
        ))}
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
