"use client";

import Link from "next/link";
import { Badge, Card, Shell } from "@/components/shell";
import { fmt, fmtN, maintenance, vehiclePhoto, vehicles } from "@/lib/data";

export default function Page() {
  const ready = vehicles.filter((v) => v.status === "ready").length;
  const warn = vehicles.filter((v) => v.status === "warning").length;
  const mnt = vehicles.filter((v) => v.status === "maintenance").length;
  const cost = maintenance.reduce((s, m) => s + m.cost, 0);
  const recent = [...maintenance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const kpis = [
    { l: "Total Armada", v: String(vehicles.length), s: "Unit terdaftar", navy: true },
    { l: "Ready", v: String(ready), s: "Siap operasi" },
    { l: "Warning", v: String(warn), s: "Perlu perhatian" },
    { l: "Di bengkel", v: String(mnt), s: "Maintenance" },
  ];
  return (
    <Shell title="Dashboard">
      <section className="anim relative mb-6 overflow-hidden rounded-3xl">
        <img src="/images/hero-fleet.png" alt="Armada SIG" className="h-56 w-full object-cover sm:h-72" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071526]/90 via-[#071526]/55 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-200">SIG Fleet Control</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Kendaraan operasional, terpantau utuh.</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-200">
            Histori servis, biaya, dokumen, dan kesehatan unit dalam satu layar — siap untuk pimpinan dan GA.
          </p>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <Card key={k.l} className={`anim card-hover delay-${i + 1} ${k.navy ? "border-0 bg-[#071526] text-white" : ""}`}>
            <div className={`text-xs ${k.navy ? "text-sky-200" : "text-slate-500"}`}>{k.l}</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">{k.v}</div>
            <div className={`mt-1 text-xs ${k.navy ? "text-slate-400" : "text-slate-500"}`}>{k.s}</div>
          </Card>
        ))}
      </div>

      <h3 className="mb-3 text-sm font-semibold text-slate-700">Armada unggulan</h3>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {vehicles.slice(0, 4).map((v, i) => (
          <Link key={v.id} href={`/kendaraan/${v.id}`} className={`anim card-hover delay-${i + 1} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm`}>
            <div className="h-36 overflow-hidden">
              <img src={vehiclePhoto(v)} alt={v.model} className="img-zoom h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{v.brand} {v.model}</div>
                  <div className="text-xs text-slate-500">{v.plate} · {fmtN(v.km)} km</div>
                </div>
                <Badge status={v.status} />
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${v.health}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Health {v.health}/100 · {v.driver}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="anim lg:col-span-2 p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="text-sm font-semibold">Maintenance terbaru</div>
            <Link href="/maintenance" className="text-xs text-sky-600">Lihat semua</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                {["Kendaraan", "Jenis", "Bengkel", "Biaya", ""].map((h) => (
                  <th key={h} className="px-5 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((m) => {
                const v = vehicles.find((x) => x.id === m.vehicleId)!;
                return (
                  <tr key={m.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={vehiclePhoto(v)} alt="" className="h-10 w-14 rounded-lg object-cover" />
                        <div>
                          <Link className="font-medium" href={`/kendaraan/${v.id}`}>{v.plate}</Link>
                          <div className="text-[11px] text-slate-400">{v.model} · {m.date}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{m.type}</td>
                    <td className="px-5 py-3 text-slate-500">{m.shop}</td>
                    <td className="px-5 py-3 font-medium">{fmt(m.cost)}</td>
                    <td className="px-5 py-3"><Badge status={m.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <Card className="anim delay-2 overflow-hidden p-0">
          <img src="/images/workshop.jpg" alt="Bengkel" className="h-36 w-full object-cover" />
          <div className="p-4">
            <div className="text-xs text-slate-500">Ringkasan biaya</div>
            <div className="mt-1 text-2xl font-semibold">{fmt(cost)}</div>
            <p className="mt-2 text-sm text-slate-500">Rata-rata {fmt(Math.round(cost / vehicles.length))} / unit</p>
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              ⚠ Avanza B 5678 DEF butuh service ±500 KM.
              <br />🔔 3 dokumen jatuh tempo &lt; 30 hari.
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
