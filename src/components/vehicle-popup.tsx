"use client";

import Link from "next/link";
import { Badge } from "@/components/shell";
import { fmt, fmtN, maintenance, vehiclePhoto, type Vehicle } from "@/lib/data";
import { statsFor } from "@/lib/analytics";

function BbmCard({ v }: { v: Vehicle }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <img src={v.bbmImage || "/images/bbm-qr.png"} alt="QR BBM" className="mx-auto h-44 w-44 object-contain" />
      <div className="mt-1 text-center text-[10px] text-slate-500">QR BBM operasional</div>
    </div>
  );
}

export function VehiclePopup({ v, onClose }: { v: Vehicle; onClose: () => void }) {
  const s = statsFor(v);
  const hist = maintenance.filter((m) => m.vehicleId === v.id).sort((a, b) => b.date.localeCompare(a.date));
  const specs: [string, string][] = [
    ["Nomor Plat", v.plate],
    ["Tahun mobil / pembuatan", String(v.madeYear)],
    ["Tahun pembelian", v.buyDate],
    ["Kilometer", `${fmtN(v.km)} KM`],
    ["Warna", v.color],
    ["No. rangka", v.chassis],
    ["No. mesin", v.engine],
    ["Nama pemilik", v.owner],
    ["Alamat", v.address],
    ["Bahan bakar", v.fuel],
    ["Isi silinder", v.cc],
    ["Tenaga", v.hp],
    ["Driver", v.driver],
    ["Departemen", v.dept],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#071526]/70 backdrop-blur-sm" />
      <div
        className="anim relative max-h-[92vh] w-full max-w-4xl overflow-auto rounded-3xl bg-[#0b1628] text-slate-100 shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56">
          <img src={vehiclePhoto(v)} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1628] via-[#0b1628]/40 to-transparent" />
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1 text-sm">
            Tutup
          </button>
          <div className="absolute bottom-4 left-6">
            <div className="text-xs uppercase tracking-[0.2em] text-sky-300">Dossier unit</div>
            <h2 className="text-3xl font-semibold">
              {v.brand} {v.model}
            </h2>
            <p className="text-sm text-slate-300">
              {v.plate} · Health {v.health}/100
            </p>
          </div>
          <div className="absolute bottom-4 right-6">
            <Badge status={v.status} />
          </div>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-5">
          <div className="grid grid-cols-2 gap-2 lg:col-span-3">
            {specs.map(([k, val]) => (
              <div key={k} className="rounded-xl bg-white/5 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-400">{k}</div>
                <div className="text-sm font-medium">{val}</div>
              </div>
            ))}
          </div>
          <div className="space-y-3 lg:col-span-2">
            <BbmCard v={v} />
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              {[
                ["Servis", s.jobs],
                ["Ganti ban", s.ban],
                ["Oli", s.oli],
                ["Rem", s.rem],
                ["AC", s.ac],
                ["Biaya", fmt(s.cost)],
              ].map(([l, n]) => (
                <div key={String(l)} className="rounded-xl bg-sky-500/10 py-2">
                  <div className="text-slate-400">{l}</div>
                  <div className="text-sm font-semibold">{n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Histori maintenance</div>
          <div className="max-h-40 space-y-2 overflow-auto text-sm">
            {hist.length === 0 && <p className="text-slate-500">Belum ada histori.</p>}
            {hist.map((m) => (
              <div key={m.id} className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                <span>
                  {m.date} · {m.type}
                  <span className="block text-[11px] text-slate-400">{m.shop} · KM {fmtN(m.km)}</span>
                </span>
                <span className="font-medium">{fmt(m.cost)}</span>
              </div>
            ))}
          </div>
          <Link href={`/kendaraan/${v.id}`} className="mt-3 inline-block text-xs text-sky-300">
            Buka halaman detail lengkap →
          </Link>
        </div>
      </div>
    </div>
  );
}
