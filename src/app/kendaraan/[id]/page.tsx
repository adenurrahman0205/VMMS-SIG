"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Badge, Card, Shell } from "@/components/shell";
import { docsForVehicle, fmt, fmtN, inferOwnerKind, ownerKindLabel, vehiclePhoto, vehicles, type Maintenance, type Vehicle } from "@/lib/data";
import { statsFor } from "@/lib/analytics";
import { BbmPreview } from "@/components/bbm-preview";
import { loadFleet } from "@/lib/fleet-store";
import { loadJobs } from "@/lib/maintenance-store";

function BbmCard({ v }: { v: Vehicle }) {
  return <BbmPreview src={v.bbmImage} size="lg" />;
}

export default function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState("overview");
  const [v, setV] = useState<Vehicle | undefined>(undefined);
  const [jobs, setJobs] = useState<Maintenance[]>([]);
  useEffect(() => {
    const all = loadFleet();
    setV(all.find((x) => x.id === id) ?? vehicles.find((x) => x.id === id));
    setJobs(loadJobs());
  }, [id]);
  if (!v) {
    return (
      <Shell title="Tidak ditemukan">
        <p className="text-slate-500">Unit tidak ada. Kembali ke <Link href="/kendaraan" className="text-sky-600">Armada</Link>.</p>
      </Shell>
    );
  }
  const hist = jobs.filter((m) => m.vehicleId === v.id).sort((a, b) => b.date.localeCompare(a.date));
  const docs = docsForVehicle(v);
  const s = statsFor(v, jobs);
  const tabs: { k: string; l: string; n?: string; d: string }[] = [
    { k: "overview", l: "Identitas", d: "M4 6h16M4 12h10M4 18h14" },
    { k: "maintenance", l: "Histori", n: String(hist.length), d: "M14.7 6.3a4.5 4.5 0 0 0-6.4 6.4L3 18v3h3l5.3-5.3a4.5 4.5 0 0 0 6.4-6.4L15 12l-3-3 2.7-2.7Z" },
    { k: "sparepart", l: "Sparepart", n: String(hist.reduce((a, m) => a + m.items.length, 0)), d: "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3 5.6 18.4" },
    { k: "biaya", l: "Biaya", d: "M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-8" },
    { k: "dokumen", l: "Dokumen", n: String(docs.length), d: "M7 3h8l5 5v13H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" },
  ];
  const specs: [string, string][] = [
    ["Nomor plat", v.plate],
    ["Tahun mobil", String(v.year)],
    ["Tahun pembuatan", String(v.madeYear)],
    ["Tahun pembelian", v.buyDate],
    ["Kilometer", `${fmtN(v.km)} KM`],
    ["Warna", v.color],
    ["No. rangka", v.chassis],
    ["No. mesin", v.engine],
    ["Kategori pemilik", ownerKindLabel(inferOwnerKind(v))],
    ["Nama pemilik", v.owner],
    ["Alamat", v.address],
    ["Bahan bakar", v.fuel],
    ["Transmisi", v.transmission === "manual" ? "Manual" : "Matic"],
    ["Isi silinder", v.cc],
    ["Tenaga (HP)", v.hp],
    ["Driver", v.driver],
    ["Departemen", v.dept],
    ["Lokasi pool", v.loc],
  ];

  return (
    <Shell title={`${v.brand} ${v.model}`}>
      <div className="anim mb-6 overflow-hidden rounded-3xl bg-[#071526] text-white shadow-xl">
        <div className="grid lg:grid-cols-5">
          <div className="relative h-72 lg:col-span-3 lg:h-auto min-h-[280px]">
            <img src={vehiclePhoto(v)} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#071526] via-[#071526]/40 to-transparent lg:bg-gradient-to-t lg:from-[#071526] lg:via-transparent" />
          </div>
          <div className="flex flex-col justify-between p-6 lg:col-span-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-sky-300">Dossier kendaraan</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                {v.brand} {v.model}
              </h2>
              <p className="mt-1 text-slate-300">{v.plate} · {v.color} · {v.fuel} · {v.transmission === "manual" ? "Manual" : "Matic"}</p>
              <div className="mt-3"><Badge status={v.status} /></div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Vehicle health</span>
                <span className="text-lg font-semibold text-white">{v.health}/100</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" style={{ width: `${v.health}%` }} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  [fmtN(v.km), "KM"],
                  [`${s.jobs}x`, "Servis"],
                  [fmt(s.cost), "Biaya"],
                ].map(([n, l]) => (
                  <div key={l} className="rounded-xl bg-white/5 py-2">
                    <div className="text-sm font-semibold">{n}</div>
                    <div className="text-[10px] text-slate-400">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Identitas & spek</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {specs.map(([k, val]) => (
              <div key={k} className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-400">{k}</div>
                <div className="text-sm font-medium text-slate-800">{val}</div>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-3">
          <BbmCard v={v} />
          <Card>
            <h3 className="mb-2 text-sm font-semibold">Rekap pekerjaan</h3>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              {[
                ["Ganti ban", s.ban],
                ["Oli", s.oli],
                ["Rem", s.rem],
                ["AC", s.ac],
              ].map(([l, n]) => (
                <div key={String(l)} className="rounded-xl bg-[#071526] py-3 text-white">
                  <div className="text-xl font-semibold">{n}x</div>
                  <div className="text-[10px] text-sky-200">{l}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mb-5 overflow-x-auto">
        <div className="inline-flex min-w-full gap-1 rounded-2xl bg-[#071526] p-1.5 shadow-lg ring-1 ring-white/10">
          {tabs.map((t) => {
            const on = tab === t.k;
            return (
              <button
                key={t.k}
                type="button"
                onClick={() => setTab(t.k)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  on ? "bg-sky-500 text-white shadow-md shadow-sky-500/30" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={t.d} />
                </svg>
                <span>{t.l}</span>
                {t.n ? (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${on ? "bg-white/20" : "bg-white/10 text-slate-400"}`}>{t.n}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview" && (
        <Card>
          <p className="text-sm leading-relaxed text-slate-600">
            {v.brand} {v.model} {v.plate} adalah unit {v.dept.toLowerCase()} dengan driver {v.driver}.
            Diproduksi {v.madeYear}, dibeli {v.buyDate} seharga {fmt(v.buyPrice)}. Mesin {v.cc} / {v.hp}, bahan bakar {v.fuel}.
            Health score {v.health}/100 berdasarkan umur, KM, frekuensi servis, dan biaya.
          </p>
        </Card>
      )}

      {tab === "maintenance" && (
        <div className="space-y-3">
          {hist.length === 0 && <Card>Belum ada histori maintenance untuk unit ini.</Card>}
          {hist.map((m) => (
            <Card key={m.id} className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{m.type}</div>
                <p className="text-sm text-slate-500">{m.date} · KM {fmtN(m.km)} · {m.shop}</p>
                <p className="mt-1 text-sm">{m.complaint} → {m.action}</p>
                <ul className="mt-1 text-xs text-slate-500">
                  {m.items.map((it) => (
                    <li key={it.name}>{it.name} × {it.qty} · {fmt(it.qty * it.price)}</li>
                  ))}
                </ul>
              </div>
              <div className="text-right">
                <div className="font-semibold">{fmt(m.cost)}</div>
                <Badge status={m.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "sparepart" && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                {["Tanggal", "Nama", "Qty", "Total"].map((h) => (
                  <th key={h} className="px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hist.flatMap((m) =>
                m.items.map((it) => (
                  <tr key={m.id + it.name} className="border-t">
                    <td className="px-4 py-2">{m.date}</td>
                    <td className="px-4 py-2">{it.name}</td>
                    <td className="px-4 py-2">{it.qty}</td>
                    <td className="px-4 py-2">{fmt(it.qty * it.price)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "biaya" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <div className="text-xs text-slate-500">Total maintenance</div>
            <div className="text-2xl font-semibold">{fmt(s.cost)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-500">Transaksi</div>
            <div className="text-2xl font-semibold">{s.jobs}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-500">Cost / KM</div>
            <div className="text-2xl font-semibold">{fmt(Math.round(s.cost / Math.max(v.km, 1)))}</div>
          </Card>
        </div>
      )}

      {tab === "dokumen" && (
        <Card>
          {docs.length === 0 && <p className="text-sm text-slate-500">Belum ada dokumen terunggah untuk unit ini.</p>}
          {docs.map((d) => (
            <div key={d.type} className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <b>{d.type}</b>
              <span>s.d. {d.expire}</span>
              <Badge status={d.status} />
            </div>
          ))}
        </Card>
      )}
    </Shell>
  );
}
