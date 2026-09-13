"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Shell } from "@/components/shell";
import { PengajuanModal } from "@/components/pengajuan-modal";
import { type Status, type Vehicle, vehiclePhoto } from "@/lib/data";
import { loadFleet, saveFleet } from "@/lib/fleet-store";
import { loadBookings, saveBookings, ymd, type Booking } from "@/lib/schedule-store";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function Jadwal() {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => ymd(new Date()));
  const [showAjuan, setShowAjuan] = useState(false);
  const [ajuanVehicle, setAjuanVehicle] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

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
  const approvedToday = (byDate.get(today) ?? []).filter((b) => b.status === "disetujui");
  const inUseIds = new Set(approvedToday.map((b) => b.vehicleId));
  const notes = bookings
    .filter((b) => b.status === "pengajuan" && b.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  function setStatus(id: string, status: Booking["status"], reason?: string) {
    persist(
      bookings.map((b) =>
        b.id === id ? { ...b, status, rejectReason: status === "ditolak" ? reason || b.rejectReason : b.rejectReason } : b
      )
    );
  }

  function removeBooking(id: string) {
    persist(bookings.filter((b) => b.id !== id));
  }

  type UsageKind = "tersedia" | "dipakai" | "maintenance";

  function setUsage(v: Vehicle, kind: UsageKind) {
    const nextStatus: Status = kind === "maintenance" ? "maintenance" : "ready";
    const nextFleet = fleet.map((x) => (x.id === v.id ? { ...x, status: nextStatus } : x));
    setFleet(nextFleet);
    saveFleet(nextFleet);

    const others = bookings.filter((b) => !(b.date === today && b.vehicleId === v.id && b.status === "disetujui"));
    if (kind === "dipakai") {
      persist([
        ...others,
        {
          id: `b${Date.now()}`,
          vehicleId: v.id,
          date: today,
          userName: v.driver || "Pengguna",
          purpose: "Pemakaian harian",
          status: "disetujui",
        },
      ]);
    } else {
      persist(others);
    }
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
        <div className="absolute inset-0 flex flex-col justify-end gap-3 p-4 text-white sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-sky-300">Dispatch calendar</p>
            <h2 className="text-lg font-semibold sm:text-2xl">Kalender & pengingat pengajuan</h2>
          </div>
          <button type="button" onClick={() => setShowAjuan(true)} className="w-fit rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold !text-white">
            + Pengajuan pemakaian
          </button>
        </div>
      </section>

      {notes.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">Note / pengingat</div>
          <div className="space-y-2">
            {notes.slice(0, 6).map((b) => {
              const v = fleet.find((x) => x.id === b.vehicleId);
              return (
                <div key={b.id} className="text-sm text-amber-950">
                  <b>{b.date}</b> — {b.userName} mengajukan {v ? `${v.brand} ${v.model} (${v.plate})` : "unit"}
                  {b.note ? ` · ${b.note}` : ""} · {b.purpose}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <button className="rounded-full border px-3 py-1 text-sm" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
            <h3 className="text-lg font-semibold capitalize">{monthLabel}</h3>
            <button className="rounded-full border px-3 py-1 text-sm" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {DAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((iso, i) => {
              if (!iso) return <div key={`e${i}`} className="min-h-[48px] rounded-xl bg-slate-50/50 sm:min-h-[72px]" />;
              const list = byDate.get(iso) ?? [];
              const n = list.filter((b) => b.status !== "ditolak").length;
              const pending = list.some((b) => b.status === "pengajuan");
              const isSel = iso === selected;
              const isToday = iso === today;
              return (
                <button
                  key={iso}
                  onClick={() => setSelected(iso)}
                  className={`min-h-[48px] rounded-xl p-1 text-left transition sm:min-h-[72px] sm:p-2 ${
                    isSel ? "bg-[#071526] text-white shadow-lg" : "bg-white ring-1 ring-slate-200 hover:ring-sky-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={isToday && !isSel ? "font-bold text-sky-600" : ""}>{Number(iso.slice(8))}</span>
                    {n > 0 && (
                      <span className={`rounded-full px-1.5 text-[10px] font-bold ${isSel ? "bg-sky-400 text-white" : pending ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"}`}>
                        {n}
                      </span>
                    )}
                  </div>
                  {pending && <div className={`mt-1 text-[10px] ${isSel ? "text-amber-200" : "text-amber-700"}`}>Ada pengajuan</div>}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="flex flex-col p-5 lg:col-span-2">
          <h3 className="font-semibold">{selectedLabel}</h3>
          <p className="mb-3 text-sm text-slate-500">{dayBookings.length} catatan di tanggal ini</p>
          <div className="max-h-[420px] space-y-2 overflow-auto">
            {dayBookings.length === 0 && <p className="text-sm text-slate-400">Belum ada pemakaian / pengajuan.</p>}
            {dayBookings.map((b) => {
              const v = fleet.find((x) => x.id === b.vehicleId);
              return (
                <div key={b.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex gap-3">
                    <img src={vehiclePhoto(v ?? { model: "" })} alt="" className="h-12 w-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{v ? `${v.brand} ${v.model}` : b.vehicleId}</div>
                      <div className="text-xs text-slate-500">{v?.plate} · {b.userName} {b.dept ? `· ${b.dept}` : ""}{b.jabatan ? ` · ${b.jabatan}` : ""}</div>
                      <div className="text-[11px] text-slate-400">{b.purpose}</div>
                      {b.note && <div className="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-900">Note: {b.note}</div>}
                      {b.status === "ditolak" && b.rejectReason && (
                        <div className="mt-1 rounded-lg bg-red-50 px-2 py-1 text-[11px] text-red-700">Alasan: {b.rejectReason}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">{b.status}</span>
                    {b.status === "pengajuan" && (
                      <>
                        <button className="text-xs font-semibold text-emerald-700" onClick={() => setStatus(b.id, "disetujui")}>Setujui</button>
                        <button className="text-xs font-semibold text-red-600" onClick={() => { setRejectId(b.id); setRejectReason(""); }}>Tolak</button>
                      </>
                    )}
                    {(b.status === "disetujui" || b.status === "ditolak") && (
                      <button className="text-xs font-semibold text-red-600" onClick={() => removeBooking(b.id)}>Hapus</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-semibold">Tabel pemakaian kendaraan</h3>
            <p className="text-xs text-slate-500">Mengikuti tanggal kalender: {selectedLabel}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{dayBookings.length} baris</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {["Tanggal", "Unit", "Pemohon", "Divisi", "Jabatan", "Keperluan", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayBookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">Tidak ada pemakaian pada tanggal ini. Pilih tanggal di kalender.</td>
                </tr>
              )}
              {[...dayBookings]
                .sort((a, b) => b.id.localeCompare(a.id))
                .map((b) => {
                  const v = fleet.find((x) => x.id === b.vehicleId);
                  const st =
                    b.status === "disetujui"
                      ? "bg-emerald-50 text-emerald-800"
                      : b.status === "ditolak"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-800";
                  return (
                    <tr key={b.id} className="border-t border-slate-100 hover:bg-sky-50/60">
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{b.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={vehiclePhoto(v ?? { model: "" })} alt="" className="h-9 w-12 rounded-lg object-cover" />
                          <span>
                            <span className="block font-semibold">{v ? `${v.brand} ${v.model}` : "—"}</span>
                            <span className="text-xs text-slate-500">{v?.plate ?? b.vehicleId}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{b.userName}</td>
                      <td className="px-4 py-3 text-slate-600">{b.dept || v?.dept || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{b.jabatan || v?.jabatan || "—"}</td>
                      <td className="max-w-[200px] px-4 py-3 text-slate-600">
                        <div className="truncate" title={b.purpose}>{b.purpose}</div>
                        {b.status === "ditolak" && b.rejectReason && (
                          <div className="mt-1 text-[11px] text-red-600">Alasan: {b.rejectReason}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${st}`}>{b.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {b.status === "pengajuan" ? (
                          <div className="flex gap-2">
                            <button type="button" className="text-xs font-semibold text-emerald-700" onClick={() => setStatus(b.id, "disetujui")}>Setujui</button>
                            <button type="button" className="text-xs font-semibold text-red-600" onClick={() => { setRejectId(b.id); setRejectReason(""); }}>Tolak</button>
                          </div>
                        ) : (
                          <button type="button" className="text-xs font-semibold text-red-600" onClick={() => removeBooking(b.id)}>Hapus</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <h3 className="mb-3 text-sm font-semibold">Status pemakaian hari ini</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {fleet.map((v) => {
          const service = v.status === "maintenance";
          const used = !service && inUseIds.has(v.id);
          const who = approvedToday.find((b) => b.vehicleId === v.id);
          const kind: UsageKind = service ? "maintenance" : used ? "dipakai" : "tersedia";
          const pill =
            kind === "maintenance"
              ? "bg-red-50 text-red-800"
              : kind === "dipakai"
                ? "bg-amber-100 text-amber-900"
                : "bg-emerald-50 text-emerald-800";
          return (
            <div
              key={v.id}
              onClick={() => {
                if (kind === "tersedia") {
                  setAjuanVehicle(v.id);
                  setShowAjuan(true);
                }
              }}
              className={`flex items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-slate-200 ${
                kind === "tersedia" ? "cursor-pointer hover:ring-sky-400" : ""
              }`}
            >
              <img src={vehiclePhoto(v)} alt="" className="h-14 w-20 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{v.brand} {v.model}</div>
                <div className="text-xs text-slate-500">{v.plate}</div>
                <div className="text-[11px] text-slate-400">
                  {used ? `Dipakai: ${who?.userName}` : service ? "Bengkel / perbaikan" : "Klik kartu untuk pengajuan"}
                </div>
              </div>
              <select
                value={kind}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  setUsage(v, e.target.value as UsageKind);
                }}
                className={`max-w-[150px] rounded-full border-0 px-2 py-1.5 text-xs font-semibold ${pill}`}
              >
                <option value="tersedia">Tersedia</option>
                <option value="dipakai">Sedang dipakai</option>
                <option value="maintenance">Sedang Maintenance</option>
              </select>
            </div>
          );
        })}
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setRejectId(null)}>
          <div className="absolute inset-0 bg-[#071526]/70 backdrop-blur-sm" />
          <form
            className="anim relative z-[81] w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (!rejectReason.trim()) return;
              setStatus(rejectId, "ditolak", rejectReason.trim());
              setRejectId(null);
              setRejectReason("");
            }}
          >
            <h3 className="text-lg font-semibold">Alasan penolakan</h3>
            <p className="mt-1 text-sm text-slate-500">Wajib diisi sebelum status menjadi Ditolak.</p>
            <textarea
              className="mt-3 w-full rounded-xl border px-3 py-2.5 text-sm"
              rows={4}
              required
              autoFocus
              placeholder="Contoh: unit sedang maintenance / jadwal bentrok"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={() => setRejectId(null)}>Batal</button>
              <button type="submit" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold !text-white">Tolak pengajuan</button>
            </div>
          </form>
        </div>
      )}

      {showAjuan && (
        <PengajuanModal
          vehicleId={ajuanVehicle}
          date={selected}
          onClose={() => setShowAjuan(false)}
          onSaved={() => setBookings(loadBookings())}
        />
      )}
    </Shell>
  );
}
