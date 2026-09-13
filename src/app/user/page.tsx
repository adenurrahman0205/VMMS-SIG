"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { mergeLocalUser } from "@/lib/services/profile.service";
import { loadBookings, ymd, type Booking } from "@/lib/schedule-store";
import { loadJobs } from "@/lib/maintenance-store";
import { loadFleet } from "@/lib/fleet-store";
import { vehiclePhoto, type Vehicle } from "@/lib/data";
import type { AppUser } from "@/lib/user-store";

export default function UserHome() {
  const [me, setMe] = useState<AppUser | null>(null);
  const [nBook, setNBook] = useState(0);
  const [nWo, setNWo] = useState(0);
  const [ready, setReady] = useState<{ v: Vehicle }[]>([]);
  const [used, setUsed] = useState<{ v: Vehicle; who: string }[]>([]);

  useEffect(() => {
    (async () => {
      const sb = createBrowserSupabase();
      const { data } = await sb.auth.getUser();
      const u = mergeLocalUser(data.user?.email ?? "", data.user?.id ?? "", data.user?.user_metadata as Record<string, unknown> | undefined);
      setMe(u);
      const books = loadBookings();
      setNBook(books.filter((b) => b.userId === u.id || b.userName.toLowerCase() === u.name.toLowerCase()).length);
      setNWo(loadJobs().filter((j) => j.createdBy === u.email || j.createdBy === u.id).length);
      const today = ymd(new Date());
      const fleet = loadFleet();
      const approved = books.filter((b) => b.date === today && b.status === "disetujui");
      const byId = new Map<string, Booking>();
      approved.forEach((b) => byId.set(b.vehicleId, b));
      const r: { v: Vehicle }[] = [];
      const d: { v: Vehicle; who: string }[] = [];
      fleet.forEach((v) => {
        if (v.status === "inactive") return;
        const b = byId.get(v.id);
        if (v.status === "maintenance") return;
        if (b) d.push({ v, who: b.userName });
        else r.push({ v });
      });
      setReady(r);
      setUsed(d);
    })();
  }, []);

  function CardUnit({ v, who }: { v: Vehicle; who?: string }) {
    return (
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
        <img src={vehiclePhoto(v)} alt="" className="h-32 w-full object-cover" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{v.plate}</div>
              <div className="text-sm text-slate-500">{v.brand} {v.model}</div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${who ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>
              {who ? "Dipakai" : "Tersedia"}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">{v.color} · {v.year} · {v.driver || "—"}</div>
          {who && <div className="mt-2 text-xs font-medium text-amber-800">Dipakai oleh {who}</div>}
        </div>
      </div>
    );
  }

  return (
    <Shell title="Portal User">
      <section className="anim relative mb-6 overflow-hidden rounded-3xl">
        <img src="/images/hero-fleet.png" alt="" className="h-36 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071526] via-[#071526]/85 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
          <p className="text-[11px] uppercase tracking-[0.2em] text-sky-300">Role USER</p>
          <h2 className="text-2xl font-semibold">Halo, {me?.name || "Pengguna"}</h2>
          <p className="text-sm text-slate-300">Status armada hari ini: {ready.length} tersedia · {used.length} dipakai.</p>
        </div>
      </section>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Link href="/user/pemakaian" className="card-hover rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">Pemakaian</p>
          <h3 className="mt-2 text-xl font-semibold">Ajukan kendaraan</h3>
          <p className="mt-1 text-sm text-slate-500">{nBook} pengajuan Anda tercatat.</p>
        </Link>
        <Link href="/user/maintenance" className="card-hover rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">Maintenance</p>
          <h3 className="mt-2 text-xl font-semibold">Buat work order</h3>
          <p className="mt-1 text-sm text-slate-500">{nWo} WO dari akun ini.</p>
        </Link>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-end justify-between">
          <h3 className="text-lg font-semibold">Kendaraan tersedia</h3>
          <span className="text-xs font-semibold text-emerald-700">{ready.length} unit</span>
        </div>
        {ready.length === 0 ? (
          <p className="rounded-3xl bg-white px-5 py-8 text-center text-sm text-slate-400 ring-1 ring-slate-200">Tidak ada unit tersedia hari ini.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ready.map(({ v }) => (
              <CardUnit key={v.id} v={v} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between">
          <h3 className="text-lg font-semibold">Kendaraan dipakai</h3>
          <span className="text-xs font-semibold text-amber-700">{used.length} unit</span>
        </div>
        {used.length === 0 ? (
          <p className="rounded-3xl bg-white px-5 py-8 text-center text-sm text-slate-400 ring-1 ring-slate-200">Belum ada unit dipakai hari ini.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {used.map(({ v, who }) => (
              <CardUnit key={v.id} v={v} who={who} />
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
