"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Shell } from "@/components/shell";
import { type Vehicle, vehiclePhoto } from "@/lib/data";
import { loadFleet } from "@/lib/fleet-store";
import { loadBookings, saveBookings, ymd, type Booking } from "@/lib/schedule-store";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function Jadwal() {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => ymd(new Date()));
  const [form, setForm] = useState({ vehicleId: "", userName: "", purpose: "" });

  useEffect(() => {
    setFleet(loadFleet());
    setBookings(loadBookings());
  }, []);

  function persist(next: Booking[]) {
    setBookings(next);
    saveBookings(next);
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = first.getDay();
    const daysIn = new Date(year, month + 1, 0).getDate();
    const grid: (string | null)[] = [];
    for (let i = 0; i < start; i++) grid.push(null);
    for (let d = 1; d <= daysIn; d++) {
      grid.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    while (grid.length % 7) grid.push(null);
    return grid;
  }, [year, month]);

  const byDate = useMemo(() => {
    const m = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      const arr = m.get(b.date) ?? [];
      arr.push(b);
      m.set(b.date, arr);
    });
    return m;
  }, [bookings]);

  const today = ymd(new Date());
  const dayBookings = byDate.get(selected) ?? [];
  const inUseIds = new Set((byDate.get(today) ?? []).map((b) => b.vehicleId));

  function addBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicleId || !form.userName) return;
    persist([
      ...bookings,
      {
        id: `b${Date.now()}`,
        vehicleId: form.vehicleId,
        date: selected,
        userName: form.userName,
        purpose: form.purpose,
      },
    ]);
    setForm({ vehicleId: "", userName: "", purpose: "" });
  }

  function removeBooking(id: string) {
    persist(bookings.filter((b) => b.id !== id));
  }

  function toggleToday(v: Vehicle) {
    const existing = bookings.find((b) => b.date === today && b.vehicleId === v.id);
    if (existing) persist(bookings.filter((b) => b.id !== existing.id));
    else
      persist([
        ...bookings,
        { id: `b${Date.now()}`, vehicleId: v.id, date: today, userName: v.driver || "Pengguna", purpose: "Pemakaian harian" },
      ]);
  }

  const monthLabel = cursor.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const selectedLabel = new Date(selected + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Shell title="Jadwal pemakaian">
      <section className="anim relative mb-6 overflow-hidden rounded-3xl">
        <img src="/images/hero-fleet.png" alt="" className="h-36 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071526] via-[#071526]/80 to-transparent" />
        <div className="absolute inset-0 flex items-end p-6 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-sky-300">Dispatch calendar</p>
            <h2 className="text-2xl font-semibold">Siapa pakai mobil, kapan, berapa unit</h2>
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 p-5">
          <div className="mb-4 flex items-center justify-between">
            <button
              className="rounded-full border px-3 py-1 text-sm"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
            >
              ‹
            </button>
            <h3 className="text-lg font-semibold capitalize">{monthLabel}</h3>
            <button
              className="rounded-full border px-3 py-1 text-sm"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {DAYS.map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((iso, i) => {
              if (!iso) return <div key={`e${i}`} className="min-h-[72px] rounded-xl bg-slate-50/50" />;
              const n = byDate.get(iso)?.length ?? 0;
              const isSel = iso === selected;
              const isToday = iso === today;
              return (
                <button
                  key={iso}
                  onClick={() => setSelected(iso)}
                  className={`min-h-[72px] rounded-xl p-2 text-left transition ${
                    isSel ? "bg-[#071526] text-white shadow-lg" : "bg-white ring-1 ring-slate-200 hover:ring-sky-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={isToday && !isSel ? "font-bold text-sky-600" : ""}>{Number(iso.slice(8))}</span>
                    {n > 0 && (
                      <span className={`rounded-full px-1.5 text-[10px] font-bold ${isSel ? "bg-sky-400 text-white" : "bg-sky-100 text-sky-800"}`}>
                        {n}
                      </span>
                    )}
                  </div>
                  {n > 0 && (
                    <div className={`mt-1 truncate text-[10px] ${isSel ? "text-sky-100" : "text-slate-500"}`}>
                      {n} unit terpakai
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="lg:col-span-2 flex flex-col p-5">
          <h3 className="font-semibold">{selectedLabel}</h3>
          <p className="mb-3 text-sm text-slate-500">{dayBookings.length} kendaraan terpakai</p>
          <div className="mb-4 max-h-56 space-y-2 overflow-auto">
            {dayBookings.length === 0 && <p className="text-sm text-slate-400">Belum ada pemakaian.</p>}
            {dayBookings.map((b) => {
              const v = fleet.find((x) => x.id === b.vehicleId);
              return (
                <div key={b.id} className="flex gap-3 rounded-xl bg-slate-50 p-2">
                  <img src={vehiclePhoto(v ?? { model: "" })} alt="" className="h-12 w-16 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{v ? `${v.brand} ${v.model}` : b.vehicleId}</div>
                    <div className="text-xs text-slate-500">{v?.plate} · {b.userName}</div>
                    <div className="text-[11px] text-slate-400">{b.purpose}</div>
                  </div>
                  <button className="text-xs text-red-600" onClick={() => removeBooking(b.id)}>Hapus</button>
                </div>
              );
            })}
          </div>
          <form onSubmit={addBooking} className="mt-auto space-y-2 border-t pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Catat pemakaian</p>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              required
            >
              <option value="">Pilih kendaraan</option>
              {fleet.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.brand} {v.model}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Nama pengguna"
              value={form.userName}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
              required
            />
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Keperluan"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            />
            <button className="w-full rounded-xl bg-[#071526] py-2.5 text-sm font-semibold !text-white">Simpan ke tanggal ini</button>
          </form>
        </Card>
      </div>

      <h3 className="mb-3 text-sm font-semibold">Status pemakaian hari ini</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {fleet.map((v) => {
          const used = inUseIds.has(v.id);
          const who = (byDate.get(today) ?? []).find((b) => b.vehicleId === v.id);
          return (
            <div key={v.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <img src={vehiclePhoto(v)} alt="" className="h-14 w-20 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{v.brand} {v.model}</div>
                <div className="text-xs text-slate-500">{v.plate}</div>
                <div className="text-[11px] text-slate-400">{used ? `Dipakai: ${who?.userName}` : "Tersedia"}</div>
              </div>
              <button
                onClick={() => toggleToday(v)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  used ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"
                }`}
              >
                {used ? "Sedang dipakai" : "Tersedia"}
              </button>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
