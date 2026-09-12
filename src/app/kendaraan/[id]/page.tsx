"use client";

import { use, useState } from "react";
import { Badge, Card, Shell } from "@/components/shell";
import { documents, fmt, fmtN, maintenance, vehiclePhoto, vehicles } from "@/lib/data";

export default function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const v = vehicles.find((x) => x.id === id);
  const [tab, setTab] = useState("overview");
  if (!v) return <Shell title="Tidak ditemukan">Unit tidak ada.</Shell>;
  const hist = maintenance.filter((m) => m.vehicleId === v.id).sort((a, b) => b.date.localeCompare(a.date));
  const docs = documents.filter((d) => d.vehicleId === v.id);
  const total = hist.reduce((s, m) => s + m.cost, 0);
  const tabs = ["overview", "maintenance", "sparepart", "biaya", "dokumen"];
  return (
    <Shell title={`${v.brand} ${v.model}`}>
      <div className="anim mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-64">
          <img src={vehiclePhoto(v)} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 flex w-full items-end justify-between p-6 text-white">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{v.brand} {v.model}</h2>
              <p className="text-sm text-slate-200">{v.plate} · {v.dept} · {v.driver} · {v.loc}</p>
            </div>
            <Badge status={v.status} />
          </div>
        </div>
      </div>
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm capitalize ${tab === t ? "border-b-2 border-[#2f80ed] font-semibold" : "text-slate-500"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "overview" && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Tahun", String(v.year)],
              ["Kilometer", `${fmtN(v.km)} KM`],
              ["Warna", v.color],
              ["No Mesin", v.engine],
              ["No Rangka", v.chassis],
              ["Pembelian", v.buyDate],
            ].map(([k, val]) => (
              <Card key={k}>
                <div className="text-[11px] text-slate-500">{k}</div>
                <div className="mt-1 font-semibold">{val}</div>
              </Card>
            ))}
          </div>
          <Card className="mt-4">
            <div className="text-sm font-semibold">Vehicle Health Score — {v.health}/100</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-emerald-500" style={{ width: `${v.health}%` }} />
            </div>
          </Card>
        </>
      )}
      {tab === "maintenance" && (
        <div className="space-y-4 border-l-2 border-slate-200 pl-5">
          {hist.map((m) => (
            <div key={m.id}>
              <div className="font-semibold">{m.date} — {m.type}</div>
              <p className="text-sm text-slate-500">KM {fmtN(m.km)} · {m.shop} · {fmt(m.cost)}</p>
              <p className="text-sm">{m.complaint} → {m.action}</p>
            </div>
          ))}
        </div>
      )}
      {tab === "sparepart" && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500">{["Tanggal", "Nama", "Qty", "Total"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr></thead>
            <tbody>
              {hist.flatMap((m) => m.items.map((it) => (
                <tr key={m.id + it.name} className="border-t">
                  <td className="px-4 py-2">{m.date}</td>
                  <td className="px-4 py-2">{it.name}</td>
                  <td className="px-4 py-2">{it.qty}</td>
                  <td className="px-4 py-2">{fmt(it.qty * it.price)}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </Card>
      )}
      {tab === "biaya" && (
        <div className="grid grid-cols-3 gap-3">
          <Card><div className="text-xs text-slate-500">Total 2026</div><div className="text-xl font-bold">{fmt(total)}</div></Card>
          <Card><div className="text-xs text-slate-500">Transaksi</div><div className="text-xl font-bold">{hist.length}</div></Card>
          <Card><div className="text-xs text-slate-500">Cost / KM (est.)</div><div className="text-xl font-bold">{fmt(Math.round(total / 50000))}</div></Card>
        </div>
      )}
      {tab === "dokumen" && (
        <Card>
          {docs.map((d) => (
            <div key={d.type} className="mb-2 flex items-center justify-between text-sm">
              <b>{d.type}</b>
              <span>s.d. {d.expire}</span>
              <Badge status={d.status} />
            </div>
          ))}
          {docs.length === 0 && <p className="text-sm text-slate-500">Belum ada dokumen.</p>}
        </Card>
      )}
    </Shell>
  );
}
