"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { mergeLocalUser } from "@/lib/services/profile.service";
import { blankJob, loadJobs, saveJobs } from "@/lib/maintenance-store";
import { loadFleet } from "@/lib/fleet-store";
import { loadWorkshops, type Workshop } from "@/lib/workshop-store";
import { WorkshopSelect } from "@/components/workshop-select";
import { fmt, vehiclePhoto, woTotal, type Maintenance, type Vehicle } from "@/lib/data";
import type { AppUser } from "@/lib/user-store";

const TYPES = ["Service Berkala", "Ganti Oli", "Ganti Rem", "Service AC", "Ganti Ban", "Perbaikan Lain"];
const inputCls = "mt-1 w-full rounded-xl border px-3 py-2.5 text-sm";

export default function UserWo() {
  const [me, setMe] = useState<AppUser | null>(null);
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [shops, setShops] = useState<Workshop[]>([]);
  const [jobs, setJobs] = useState<Maintenance[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => blankJob());

  function mine(list: Maintenance[], u: AppUser) {
    return list.filter((j) => j.createdBy === u.email || j.createdBy === u.id);
  }

  useEffect(() => {
    (async () => {
      const sb = createBrowserSupabase();
      const { data } = await sb.auth.getUser();
      const u = mergeLocalUser(data.user?.email ?? "", data.user?.id ?? "", data.user?.user_metadata as Record<string, unknown> | undefined);
      setMe(u);
      setFleet(loadFleet());
      setShops(loadWorkshops());
      setJobs(mine(loadJobs(), u));
    })();
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    const parts = form.items.reduce((s, it) => s + it.qty * it.price, 0);
    const jasa = Number(form.jasa) || 0;
    const row: Maintenance = { ...form, jasa, cost: parts + jasa, createdBy: me.email || me.id, status: "proses" };
    const all = loadJobs();
    saveJobs([row, ...all]);
    setJobs(mine(loadJobs(), me));
    setOpen(false);
    setForm(blankJob());
  }

  return (
    <Shell title="Work order">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Work order saya</h2>
          <p className="text-sm text-slate-500">Buat laporan servis. Status proses sampai admin menyelesaikan.</p>
        </div>
        <button type="button" className="rounded-full bg-[#071526] px-4 py-2 text-sm font-semibold !text-white" onClick={() => { setForm(blankJob(fleet[0]?.id ?? "")); setOpen(true); }}>
          + Work order
        </button>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
        {jobs.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Belum ada work order.</p>
        ) : (
          <div className="divide-y">
            {jobs.map((j) => {
              const v = fleet.find((x) => x.id === j.vehicleId);
              return (
                <div key={j.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <img src={vehiclePhoto(v ?? { model: "" })} alt="" className="h-12 w-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{j.type} · {v?.plate}</div>
                    <div className="text-xs text-slate-500">{j.date} · {j.id} · {j.complaint || "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{j.status === "selesai" ? fmt(woTotal(j)) : "—"}</div>
                    <div className="text-[11px] uppercase text-slate-400">{j.status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-[#071526]/75" />
          <form className="anim relative max-h-[92vh] w-full max-w-lg overflow-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h3 className="mb-4 text-lg font-semibold">Formulir work order</h3>
            <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
              Unit
              <select className={inputCls} required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Pilih</option>
                {fleet.map((v) => (
                  <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                ))}
              </select>
            </label>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold uppercase text-slate-500">
                Tanggal
                <input className={inputCls} type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </label>
              <label className="text-xs font-semibold uppercase text-slate-500">
                KM
                <input className={inputCls} type="number" value={form.km} onChange={(e) => setForm({ ...form, km: Number(e.target.value) || 0 })} />
              </label>
            </div>
            <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
              Jenis
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
              Bengkel mitra
              <WorkshopSelect
                shops={shops}
                value={form.shop}
                workshopId={form.workshopId}
                required
                className={inputCls}
                onPick={(w) => setForm({ ...form, shop: w?.name || "", workshopId: w?.id })}
              />
            </label>
            <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
              Keluhan
              <textarea className={inputCls} rows={3} value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={() => setOpen(false)}>Batal</button>
              <button className="rounded-xl bg-[#071526] px-4 py-2 text-sm font-semibold !text-white">Kirim WO</button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
