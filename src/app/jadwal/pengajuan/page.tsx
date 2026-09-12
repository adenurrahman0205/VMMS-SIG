"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Shell } from "@/components/shell";
import { type Vehicle, vehiclePhoto } from "@/lib/data";
import { loadFleet } from "@/lib/fleet-store";
import { loadBookings, saveBookings, type Booking } from "@/lib/schedule-store";

export default function PengajuanPage() {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
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
    setBookings(loadBookings());
  }, []);

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
    const rows = [next, ...bookings];
    saveBookings(rows);
    setBookings(rows);
    setOk("Pengajuan terkirim. Fleet admin akan meninjau. Pengingat tampil di kalender.");
    setForm({ vehicleId: "", date: "", userName: "", dept: "", phone: "", purpose: "", note: "" });
  }

  const v = fleet.find((x) => x.id === form.vehicleId);

  return (
    <Shell title="Pengajuan pemakaian">
      <p className="mb-4 text-sm text-slate-500">
        Isi formulir ini sebelum memakai kendaraan. Status awal: <b>Pengajuan</b>. Lihat kalender di{" "}
        <Link href="/jadwal" className="text-sky-700 underline">Jadwal</Link>.
      </p>
      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={submit} className="space-y-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-3">
          <h2 className="text-lg font-semibold">Formulir pengajuan</h2>
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
            <textarea className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" rows={3} placeholder="Jam berangkat, tujuan, penumpang..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </label>
          {ok && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</p>}
          <button className="rounded-xl bg-[#071526] px-6 py-2.5 text-sm font-semibold !text-white">Kirim pengajuan</button>
        </form>
        <div className="lg:col-span-2">
          <Card>
            <h3 className="mb-2 font-semibold">Preview unit</h3>
            {v ? (
              <>
                <img src={vehiclePhoto(v)} alt="" className="mb-3 h-36 w-full rounded-2xl object-cover" />
                <p className="font-semibold">{v.brand} {v.model}</p>
                <p className="text-sm text-slate-500">{v.plate} · {v.color} · {v.fuel}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Pilih kendaraan untuk melihat foto.</p>
            )}
          </Card>
        </div>
      </div>
    </Shell>
  );
}
