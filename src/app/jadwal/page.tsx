"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Shell } from "@/components/shell";
import { PengajuanModal } from "@/components/pengajuan-modal";
import { type Maintenance, type Vehicle, vehiclePhoto } from "@/lib/data";
import { loadFleet } from "@/lib/fleet-store";
import { loadJobs } from "@/lib/maintenance-store";
import { loadBookings, saveBookings, ymd, type Booking } from "@/lib/schedule-store";
import { loadUsers, type AppUser } from "@/lib/user-store";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { mergeLocalUser } from "@/lib/services/profile.service";

function waHref(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (!d) return "";
  const n = d.startsWith("0") ? `62${d.slice(1)}` : d;
  return `https://wa.me/${n}`;
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function Jadwal() {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [jobs, setJobs] = useState<Maintenance[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [actor, setActor] = useState("Admin");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => ymd(new Date()));
  const [showAjuan, setShowAjuan] = useState(false);
  const [ajuanVehicle, setAjuanVehicle] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    setFleet(loadFleet());
    setBookings(loadBookings());
    setJobs(loadJobs());
    setUsers(loadUsers());
    (async () => {
      const sb = createBrowserSupabase();
      const { data } = await sb.auth.getUser();
      const u = mergeLocalUser(data.user?.email ?? "", data.user?.id ?? "", data.user?.user_metadata as Record<string, unknown> | undefined);
      setActor(u.name || data.user?.email || "Admin");
    })();
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

  function serviceJobsOn(iso: string) {
    return jobs.filter((j) => j.status === "proses" && ((j.date <= iso && iso <= today) || j.date === iso));
  }

  const dayBookings = byDate.get(selected) ?? [];
  const dayService = serviceJobsOn(selected);
  const approvedToday = (byDate.get(today) ?? []).filter((b) => b.status === "disetujui");
  const pendingToday = (byDate.get(today) ?? []).filter((b) => b.status === "pengajuan");
  const inUseIds = new Set(approvedToday.map((b) => b.vehicleId));
  const pendingIds = new Set(pendingToday.map((b) => b.vehicleId));
  const notes = bookings
    .filter((b) => b.status === "pengajuan" && b.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  function setStatus(id: string, status: Booking["status"], reason?: string) {
    const now = new Date().toISOString();
    persist(
      bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              status,
              rejectReason: status === "ditolak" ? reason || b.rejectReason : b.rejectReason,
              approvedBy: status === "disetujui" ? actor : b.approvedBy,
              approvedAt: status === "disetujui" ? now : b.approvedAt,
            }
          : b
      )
    );
  }

  function removeBooking(id: string) {
    persist(bookings.filter((b) => b.id !== id));
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
              const svc = serviceJobsOn(iso);
              const n = list.filter((b) => b.status !== "ditolak").length + svc.length;
              const pending = list.some((b) => b.status === "pengajuan");
              const hasSvc = svc.length > 0;
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
                  {hasSvc && <div className={`text-[10px] ${isSel ? "text-red-200" : "text-red-700"}`}>Diservice</div>}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="flex flex-col p-5 lg:col-span-2">
          <h3 className="font-semibold">{selectedLabel}</h3>
          <p className="mb-3 text-sm text-slate-500">{dayBookings.length + dayService.length} catatan di tanggal ini</p>
          <div className="max-h-[420px] space-y-2 overflow-auto">
            {dayBookings.length === 0 && dayService.length === 0 && <p className="text-sm text-slate-400">Belum ada pemakaian / pengajuan.</p>}
            {dayService.map((j) => {
              const v = fleet.find((x) => x.id === j.vehicleId);
              return (
                <div key={j.id} className="rounded-xl bg-red-50 p-3 ring-1 ring-red-100">
                  <div className="flex gap-3">
                    <img src={vehiclePhoto(v ?? { model: "" })} alt="" className="h-12 w-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{v ? `${v.brand} ${v.model}` : j.vehicleId}</div>
                      <div className="text-xs text-slate-500">{v?.plate} · {j.shop || "Bengkel"}</div>
                      <div className="text-[11px] text-slate-400">{j.type} · {j.complaint || "Sedang diservice"}</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">Sedang diservice</span>
                  </div>
                </div>
              );
            })}
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

      <div id="tabel-pemakaian" className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-[#071526] px-5 py-4 text-white">
          <div>
            <h3 className="font-semibold">Tabel pemakaian kendaraan</h3>
            <p className="text-xs text-sky-200">Mengikuti tanggal kalender: {selectedLabel}</p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">{dayBookings.length + dayService.length} baris</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {["Tanggal", "Unit", "Pemohon", "No. telp", "Divisi", "Jabatan", "Keperluan", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayBookings.length === 0 && dayService.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400">Tidak ada pemakaian pada tanggal ini. Pilih tanggal di kalender.</td>
                </tr>
              )}
              {dayService.map((j) => {
                const v = fleet.find((x) => x.id === j.vehicleId);
                return (
                  <tr key={j.id} className="border-t border-red-100 bg-red-50/60">
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{selected}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={vehiclePhoto(v ?? { model: "" })} alt="" className="h-9 w-12 rounded-lg object-cover" />
                        <span>
                          <span className="block font-semibold">{v ? `${v.brand} ${v.model}` : "—"}</span>
                          <span className="text-xs text-slate-500">{v?.plate ?? j.vehicleId}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{j.shop || "Bengkel"}</td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                    <td className="px-4 py-3 text-slate-600">{v?.dept || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">—</td>
                    <td className="max-w-[200px] px-4 py-3 text-slate-600">{j.type}{j.complaint ? ` · ${j.complaint}` : ""}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-red-600 px-2 py-1 text-[10px] font-semibold uppercase text-white">Diservice</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">WO {j.id}</td>
                  </tr>
                );
              })}
              {[...dayBookings]
                .sort((a, b) => b.id.localeCompare(a.id))
                .map((b) => {
                  const v = fleet.find((x) => x.id === b.vehicleId);
                  const u = users.find(
                    (x) =>
                      (b.userId && x.id === b.userId) ||
                      x.name.toLowerCase() === b.userName.toLowerCase() ||
                      x.email.toLowerCase() === b.userName.toLowerCase()
                  );
                  const phone = b.phone || u?.phone || "";
                  const ini = b.userName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {u?.avatar ? (
                            <img src={u.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#071526] text-[10px] font-semibold text-white">{ini}</span>
                          )}
                          <span className="font-medium">{b.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {phone ? (
                          <a href={waHref(phone)} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">
                            {phone}
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
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
          const requested = !service && !used && pendingIds.has(v.id);
          const who = approvedToday.find((b) => b.vehicleId === v.id) || pendingToday.find((b) => b.vehicleId === v.id);
          const canAjukan = !service && !used;
          const wrap = service
            ? "bg-red-50 ring-red-200"
            : used
              ? "bg-amber-50 ring-amber-200"
              : requested
                ? "bg-sky-50 ring-sky-200"
                : "bg-emerald-50/60 ring-emerald-200";
          const pill = service
            ? "bg-red-600 text-white"
            : used
              ? "bg-amber-500 text-white"
              : requested
                ? "bg-sky-600 text-white"
                : "bg-emerald-600 text-white";
          const label = service ? "Sedang diservice" : used ? "Sedang dipakai" : requested ? "Ada request" : "Tersedia";
          return (
            <div key={v.id} className={`flex items-center gap-3 rounded-2xl p-3 ring-1 ${wrap}`}>
              <img src={vehiclePhoto(v)} alt="" className="h-14 w-20 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold text-slate-800">{v.brand} {v.model}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${pill}`}>{label}</span>
                </div>
                <div className="text-xs text-slate-500">{v.plate}</div>
                <div className="text-[11px] text-slate-500">
                  {service ? "Tidak bisa diajukan" : used ? `Dipakai ${who?.userName || ""}` : requested ? `Request ${who?.userName || ""}` : "Siap diajukan"}
                </div>
              </div>
              <button
                type="button"
                disabled={!canAjukan}
                onClick={() => {
                  if (!canAjukan) return;
                  setAjuanVehicle(v.id);
                  setShowAjuan(true);
                }}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${
                  canAjukan ? "bg-[#071526] !text-white hover:bg-sky-700" : "cursor-not-allowed bg-slate-200 text-slate-400"
                }`}
              >
                Ajukan
              </button>
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
