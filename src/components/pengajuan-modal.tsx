"use client";

import { useEffect, useMemo, useState } from "react";
import { type Vehicle, vehiclePhoto } from "@/lib/data";
import { loadFleet } from "@/lib/fleet-store";
import { loadBookings, saveBookings, type Booking } from "@/lib/schedule-store";

export function PengajuanModal({
  onClose,
  onSaved,
  vehicleId = "",
  date = "",
}: {
  onClose: () => void;
  onSaved: () => void;
  vehicleId?: string;
  date?: string;
}) {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    vehicleId,
    date,
    userName: "",
    dept: "",
    jabatan: "",
    phone: "",
    purpose: "",
    note: "",
  });

  useEffect(() => {
    setFleet(loadFleet());
    setBookings(loadBookings());
  }, []);

  const v = fleet.find((x) => x.id === form.vehicleId);

  const dayRows = useMemo(
    () => bookings.filter((b) => b.date === form.date && b.status !== "ditolak"),
    [bookings, form.date]
  );

  function unitFlag(id: string) {
    const unit = fleet.find((x) => x.id === id);
    const rows = dayRows.filter((b) => b.vehicleId === id);
    const used = rows.find((b) => b.status === "disetujui");
    const req = rows.find((b) => b.status === "pengajuan");
    if (unit?.status === "maintenance") return { kind: "maintenance" as const, label: "Sedang maintenance", who: "" };
    if (used) return { kind: "dipakai" as const, label: "Sedang dipakai", who: used.userName };
    if (req) return { kind: "request" as const, label: "Sudah ada request", who: req.userName };
    return { kind: "ok" as const, label: "Tersedia", who: "" };
  }

  const flag = form.vehicleId ? unitFlag(form.vehicleId) : null;
  const blocked = flag && flag.kind !== "ok";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const f = form.vehicleId ? unitFlag(form.vehicleId) : null;
    if (f && f.kind !== "ok") {
      setErr(
        f.kind === "dipakai"
          ? `Unit sedang dipakai oleh ${f.who} pada tanggal ini. Pilih unit lain.`
          : f.kind === "request"
            ? `Unit sudah direquest oleh ${f.who} pada tanggal ini. Pilih unit lain.`
            : "Unit sedang maintenance. Pilih unit lain."
      );
      return;
    }
    const next: Booking = {
      id: `pg${Date.now()}`,
      vehicleId: form.vehicleId,
      date: form.date,
      userName: form.userName,
      purpose: form.purpose,
      dept: form.dept,
      jabatan: form.jabatan,
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
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
                required
                value={form.vehicleId}
                onChange={(e) => {
                  const id = e.target.value;
                  const unit = fleet.find((x) => x.id === id);
                  setErr("");
                  setForm({
                    ...form,
                    vehicleId: id,
                    dept: form.dept || unit?.dept || "",
                    jabatan: form.jabatan || unit?.jabatan || "",
                  });
                }}
              >
                <option value="">Pilih unit</option>
                {fleet.map((x) => {
                  const f = unitFlag(x.id);
                  const tag =
                    f.kind === "ok"
                      ? "Tersedia"
                      : f.kind === "dipakai"
                        ? `Dipakai${f.who ? ` · ${f.who}` : ""}`
                        : f.kind === "request"
                          ? `Ada request${f.who ? ` · ${f.who}` : ""}`
                          : "Maintenance";
                  return (
                    <option key={x.id} value={x.id}>
                      {x.plate} — {x.brand} {x.model} ({tag})
                    </option>
                  );
                })}
              </select>
            </label>

            {flag && flag.kind !== "ok" && (
              <div className={`rounded-xl px-3 py-2.5 text-sm ${flag.kind === "request" ? "bg-amber-50 text-amber-900" : "bg-red-50 text-red-800"}`}>
                {flag.kind === "dipakai" && (
                  <>Unit ini <b>sedang dipakai</b>{flag.who ? ` oleh ${flag.who}` : ""} pada {form.date}. Tidak bisa diajukan.</>
                )}
                {flag.kind === "request" && (
                  <>Unit ini <b>sudah ada yang request</b>{flag.who ? ` (${flag.who})` : ""} pada {form.date}. Pilih unit lain.</>
                )}
                {flag.kind === "maintenance" && <>Unit ini <b>sedang maintenance</b>. Pilih unit lain.</>}
              </div>
            )}
            {flag?.kind === "ok" && form.vehicleId && (
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Unit tersedia pada tanggal ini.</div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Nama pemohon
                <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" required value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Divisi
                <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })} />
              </label>
            </div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Jabatan
              <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} />
            </label>
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
            {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>}
            {ok && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</p>}
            <button
              disabled={!!blocked}
              className={`rounded-xl px-6 py-2.5 text-sm font-semibold !text-white ${blocked ? "cursor-not-allowed bg-slate-400" : "bg-[#071526]"}`}
            >
              {blocked ? "Unit tidak tersedia" : "Kirim pengajuan"}
            </button>
          </form>
          <div className="border-t bg-slate-50 p-6 lg:border-l lg:border-t-0 lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold">Preview unit</h3>
            {v ? (
              <>
                <img src={vehiclePhoto(v)} alt="" className="mb-3 h-44 w-full rounded-2xl object-cover" />
                <p className="font-semibold">{v.brand} {v.model}</p>
                <p className="text-sm text-slate-500">{v.plate} · {v.color} · {v.fuel}</p>
                <p className="mt-2 text-xs text-slate-400">{v.dept}{v.jabatan ? ` · ${v.jabatan}` : ""} · {v.driver}</p>
                {flag && (
                  <div className={`mt-4 rounded-2xl p-3 text-sm ${flag.kind === "ok" ? "bg-emerald-100 text-emerald-900" : flag.kind === "request" ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-900"}`}>
                    <div className="text-[11px] font-semibold uppercase tracking-wide">{flag.label}</div>
                    {flag.who && <div className="mt-1">Oleh {flag.who}</div>}
                    <div className="mt-1 text-xs opacity-80">{form.date || "Pilih tanggal"}</div>
                  </div>
                )}
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
