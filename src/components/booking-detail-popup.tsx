"use client";

import { useState } from "react";
import { vehiclePhoto, type Vehicle } from "@/lib/data";
import type { Booking } from "@/lib/schedule-store";
import type { AppUser } from "@/lib/user-store";

function waUrl(phone?: string) {
  const d = (phone || "").replace(/\D/g, "");
  if (!d) return "";
  return `https://wa.me/${d.startsWith("0") ? `62${d.slice(1)}` : d}`;
}

function fmtWhen(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" });
}

function fmtDate(ymd: string) {
  if (!ymd) return "—";
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const statusMeta = {
  pengajuan: {
    label: "Menunggu persetujuan",
    chip: "bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/30",
    bar: "from-amber-500 to-orange-400",
    pulse: "bg-amber-400",
  },
  disetujui: {
    label: "Disetujui",
    chip: "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/30",
    bar: "from-emerald-500 to-teal-400",
    pulse: "bg-emerald-400",
  },
  ditolak: {
    label: "Ditolak",
    chip: "bg-red-400/20 text-red-200 ring-1 ring-red-300/30",
    bar: "from-red-500 to-rose-400",
    pulse: "bg-red-400",
  },
} as const;

export function BookingDetailPopup({
  booking,
  vehicle,
  me,
  onClose,
}: {
  booking: Booking;
  vehicle?: Vehicle;
  me?: AppUser | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const meta = statusMeta[booking.status];
  const phone = booking.phone || me?.phone || "";
  const wa = waUrl(phone);
  const ini = (booking.userName || me?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const steps = [
    { id: "ajukan", t: "Diajukan", d: "Pengajuan terkirim", on: true },
    {
      id: "proses",
      t: booking.status === "ditolak" ? "Ditolak" : "Disetujui",
      d:
        booking.status === "pengajuan"
          ? "Menunggu admin"
          : booking.status === "ditolak"
            ? booking.rejectReason || "Ditolak admin"
            : `Oleh ${booking.approvedBy || "Admin"}`,
      on: booking.status !== "pengajuan",
    },
    {
      id: "pakai",
      t: "Siap dipakai",
      d: booking.status === "disetujui" ? fmtDate(booking.date) : "Setelah disetujui",
      on: booking.status === "disetujui",
    },
  ];

  async function copyId() {
    try {
      await navigator.clipboard.writeText(booking.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  const facts: [string, string][] = [
    ["Tanggal pemakaian", fmtDate(booking.date)],
    ["Keperluan", booking.purpose || "—"],
    ["Divisi", booking.dept || me?.dept || "—"],
    ["Jabatan", booking.jabatan || me?.jabatan || "—"],
    ["Telepon", phone || "—"],
    ["Catatan", booking.note || "—"],
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-sm" />
      <div
        className="anim relative max-h-[94vh] w-full max-w-3xl overflow-auto rounded-t-3xl bg-[#0b1628] text-slate-100 shadow-2xl ring-1 ring-white/10 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-48 sm:h-56">
          <img src={vehiclePhoto(vehicle ?? { model: "" })} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1628] via-[#0b1628]/50 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1 text-sm font-medium !text-white ring-1 ring-white/20 transition hover:bg-black/70"
          >
            Tutup
          </button>
          <div className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.chip}`}>
            <span className={`mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full ${meta.pulse}`} />
            {meta.label}
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-sky-300">Detail pengajuan</p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {vehicle ? `${vehicle.brand} ${vehicle.model}` : booking.vehicleId}
            </h2>
            <p className="text-sm text-slate-300">
              {vehicle?.plate || "—"} · {vehicle?.color || ""} · {vehicle?.year || ""}
            </p>
          </div>
        </div>

        <div className={`h-1 bg-gradient-to-r ${meta.bar}`} />

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
              {me?.avatar ? (
                <img src={me.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-full bg-sky-500/20 text-xs font-semibold text-sky-200">
                  {ini}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{booking.userName}</div>
                <div className="truncate text-xs text-slate-400">
                  {(booking.jabatan || me?.jabatan || "—")} · {(booking.dept || me?.dept || "—")}
                </div>
              </div>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/25"
                >
                  WhatsApp
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {facts.map(([k, val]) => (
                <div key={k} className="rounded-2xl bg-white/5 px-3.5 py-2.5 ring-1 ring-white/5">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{k}</div>
                  <div className="mt-0.5 text-sm font-medium text-slate-100">{val}</div>
                </div>
              ))}
            </div>

            {booking.status === "disetujui" && (
              <div className="mt-3 rounded-2xl bg-emerald-500/10 px-4 py-3 ring-1 ring-emerald-400/20">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">Disetujui</p>
                <p className="mt-1 text-sm">
                  oleh <b>{booking.approvedBy || "Admin"}</b>
                  {booking.approvedAt ? ` · ${fmtWhen(booking.approvedAt)}` : ""}
                </p>
              </div>
            )}
            {booking.status === "ditolak" && (
              <div className="mt-3 rounded-2xl bg-red-500/10 px-4 py-3 ring-1 ring-red-400/20">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-300">Alasan ditolak</p>
                <p className="mt-1 text-sm">{booking.rejectReason || "Tidak ada alasan tercatat."}</p>
              </div>
            )}
            {booking.status === "pengajuan" && (
              <div className="mt-3 rounded-2xl bg-amber-500/10 px-4 py-3 ring-1 ring-amber-400/20">
                <p className="text-sm text-amber-100">Pengajuan masih menunggu keputusan admin.</p>
              </div>
            )}
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Status</p>
              <ol className="space-y-3">
                {steps.map((s, i) => (
                  <li key={s.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${s.on ? "bg-sky-400 shadow-[0_0_10px_#38bdf8]" : "bg-white/20"}`} />
                      {i < steps.length - 1 && <span className={`mt-1 w-px flex-1 ${s.on ? "bg-sky-400/50" : "bg-white/10"}`} />}
                    </div>
                    <div className="pb-2">
                      <div className={`text-sm font-semibold ${s.on ? "text-white" : "text-slate-500"}`}>{s.t}</div>
                      <div className="text-xs text-slate-400">{s.d}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {vehicle && (
              <div className="rounded-2xl bg-white/5 p-4 text-sm ring-1 ring-white/10">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Unit</p>
                <p className="font-semibold">{vehicle.plate}</p>
                <p className="text-xs text-slate-400">
                  Driver {vehicle.driver || "—"} · {vehicle.fuel} · {vehicle.transmission === "manual" ? "Manual" : "Matic"}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={copyId}
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-left text-xs ring-1 ring-white/10 transition hover:bg-white/10"
            >
              <span className="block text-[10px] uppercase tracking-wide text-slate-400">ID pengajuan</span>
              <span className="font-mono text-slate-200">{copied ? "Tersalin ✓" : booking.id}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
