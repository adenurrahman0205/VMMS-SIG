"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { mergeLocalUser } from "@/lib/services/profile.service";
import { loadBookings, ymd } from "@/lib/schedule-store";
import { loadJobs } from "@/lib/maintenance-store";
import { loadFleet } from "@/lib/fleet-store";
import type { AppUser } from "@/lib/user-store";

export default function UserHome() {
  const [me, setMe] = useState<AppUser | null>(null);
  const [nBook, setNBook] = useState(0);
  const [nWo, setNWo] = useState(0);
  const [nFleet, setNFleet] = useState(0);
  const [nReady, setNReady] = useState(0);
  const [nUsed, setNUsed] = useState(0);

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
      const usedIds = new Set(books.filter((b) => b.date === today && b.status === "disetujui").map((b) => b.vehicleId));
      let ready = 0;
      let used = 0;
      fleet.forEach((v) => {
        if (v.status === "inactive" || v.status === "maintenance") return;
        if (usedIds.has(v.id)) used += 1;
        else ready += 1;
      });
      setNFleet(fleet.length);
      setNReady(ready);
      setNUsed(used);
    })();
  }, []);

  const pctReady = nFleet ? nReady / nFleet : 0;
  const pctUsed = nFleet ? nUsed / nFleet : 0;

  return (
    <Shell title="Portal User">
      <p className="mb-4 text-sm text-slate-500">Halo, {me?.name || "Pengguna"} · status armada hari ini</p>

      <div className="mb-6 grid gap-3 lg:grid-cols-5">
        <div className="anim relative overflow-hidden rounded-[28px] p-6 text-left text-white shadow-xl lg:col-span-2">
          <img src="/images/hero-fleet.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#071526] via-[#071526]/85 to-sky-900/40" />
          <div className="relative flex h-full min-h-[200px] flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200 backdrop-blur">Live fleet</span>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                Online
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-300">Total armada</div>
              <div className="mt-1 text-6xl font-semibold tracking-tight">{nFleet}</div>
              <div className="mt-2 text-sm text-slate-300">{nReady} tersedia · {nUsed} dipakai</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:col-span-3">
          <div className="anim group relative overflow-hidden rounded-[22px] bg-[#0b1a2e] p-4 text-left text-white ring-1 ring-white/10">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Tersedia</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{nReady}</div>
            <div className="mt-1 text-[11px] text-slate-400">Siap operasi</div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-emerald-400 transition-all duration-700 group-hover:w-full" style={{ width: `${Math.max(12, Math.min(100, pctReady * 100))}%` }} />
            </div>
          </div>
          <div className="anim group relative overflow-hidden rounded-[22px] bg-[#0b1a2e] p-4 text-left text-white ring-1 ring-white/10">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">Dipakai</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{nUsed}</div>
            <div className="mt-1 text-[11px] text-slate-400">Hari ini</div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-amber-400 transition-all duration-700 group-hover:w-full" style={{ width: `${Math.max(12, Math.min(100, pctUsed * 100))}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
    </Shell>
  );
}
