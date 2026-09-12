"use client";

import { useEffect, useState } from "react";
import { type Vehicle, vehiclePhoto } from "@/lib/data";
import { loadFleet } from "@/lib/fleet-store";
import { loadBookings, saveBookings, type Booking } from "@/lib/schedule-store";

export function PengajuanModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [ok, setOk] = useState("");
  const [form, setForm] = useState({
    vehicleId: "",
    date: "",
    userName: "",
    dept: "",
    phone: "",
    purpose: "",
    note: "",
  });

  useEffect(() => {
    setFleet(loadFleet());
  }, []);

  const v = fleet.find((x) => x.id === form.vehicleId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Booking = {
      id: `pg${Date.now()}`,
      vehicleId: form.vehicleId,
      date: form.date,
      userName: form.userName,
      purpose: form.purpose,
      dept: form.dept,
      phone: form.phone,
      note: form.note,
      status: "pengajuan",
    };
    saveBookings([next, ...loadBookings()]);
    setOk("Pengajuan terkirim. Pengingat muncul di kalender.");
    onSaved();
    setTimeout(onClose, 700);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-sm" />
      <div
        className="anim relative max-h-[94vh] w-full max-w-4xl overflow-auto rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#071526] px-6 py-4 text-white">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300">VMMS-SIG</p>
            <h2 className="text-lg font-semibold">Pengajuan pemakaian kendaraan</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-sm !text-white">
            Tutup
          </button>
        </div>
        <div className="grid gap-0 lg:grid-cols-5">
          <form onSubmit={submit} className="space-y-3 p-6 lg:col-span-3">
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Tanggal pemakaian
              <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Kendaraan
              <select className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Pilih unit</option>
                {fleet.map((x) => (
                  <option key={x.id} value={x.id}>{x.plate} — {x.brand} {x.model}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Nama pemohon
                <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" required value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Departemen
                <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })} />
              </label>
            </div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Telepon
              <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Keperluan
              <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" required value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Catatan / note
              <textarea className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" rows={3} placeholder="Jam berangkat, tujuan..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>
            {ok && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</p>}
            <button className="rounded-xl bg-[#071526] px-6 py-2.5 text-sm font-semibold !text-white">Kirim pengajuan</button>
          </form>
          <div className="border-t bg-slate-50 p-6 lg:border-l lg:border-t-0 lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold">Preview unit</h3>
            {v ? (
              <>
                <img src={vehiclePhoto(v)} alt="" className="mb-3 h-44 w-full rounded-2xl object-cover" />
                <p className="font-semibold">{v.brand} {v.model}</p>
                <p className="text-sm text-slate-500">{v.plate} · {v.color} · {v.fuel}</p>
                <p className="mt-2 text-xs text-slate-400">{v.dept} · {v.driver}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Pilih kendaraan di formulir untuk melihat foto unit.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
