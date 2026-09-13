"use client";

import { useEffect, useMemo, useState } from "react";
import { type Vehicle, vehiclePhoto } from "@/lib/data";
import { loadFleet } from "@/lib/fleet-store";
import { loadBookings, saveBookings, type Booking } from "@/lib/schedule-store";
import { loadUsers, type AppUser } from "@/lib/user-store";

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
  const [users, setUsers] = useState<AppUser[]>([]);
  const [userId, setUserId] = useState("");
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
    setUsers(loadUsers().filter((u) => u.active));
    if (lockUser) {
      setUserId(lockUser.id);
      setForm((f) => ({
        ...f,
        userName: lockUser.name,
        dept: lockUser.dept,
        jabatan: lockUser.jabatan || "",
        phone: lockUser.phone,
      }));
    }
  }, [lockUser]);

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
                  setErr("");
                  setForm({
                    ...form,
                    vehicleId: id,
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

            <label className="block text-xs font-semibold uppercase text-slate-500">
              Nama pemohon
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
                required
                disabled={!!lockUser}
                value={userId}
                onChange={(e) => {
                  const id = e.target.value;
                  const u = users.find((x) => x.id === id);
                  setUserId(id);
                  setForm({
                    ...form,
                    userName: u?.name || "",
                    dept: u?.dept || "",
                    jabatan: u?.jabatan || "",
                    phone: u?.phone || "",
                  });
                }}
              >
                <option value="">Pilih dari daftar User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.dept || "—"} · {u.jabatan || "—"}
                  </option>
                ))}
              </select>
            </label>
            {userId && (
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                {users.find((x) => x.id === userId)?.avatar ? (
                  <img src={users.find((x) => x.id === userId)!.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#071526] text-xs font-semibold text-white">
                    {form.userName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 text-sm">
                  <div className="font-semibold">{form.userName}</div>
                  <div className="text-xs text-slate-500">{form.jabatan || "—"} · {form.dept || "—"}</div>
                  <div className="text-xs text-emerald-700">{form.phone || "Telp belum diisi di User"}</div>
                </div>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Divisi
                <input className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm" readOnly value={form.dept} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Jabatan
                <input className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm" readOnly value={form.jabatan} />
              </label>
            </div>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Telepon
              <input className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm" readOnly value={form.phone} />
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
