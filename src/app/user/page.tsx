"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { mergeLocalUser } from "@/lib/services/profile.service";
import { loadBookings } from "@/lib/schedule-store";
import { loadJobs } from "@/lib/maintenance-store";
import type { AppUser } from "@/lib/user-store";

export default function UserHome() {
  const [me, setMe] = useState<AppUser | null>(null);
  const [nBook, setNBook] = useState(0);
  const [nWo, setNWo] = useState(0);

  useEffect(() => {
    (async () => {
      const sb = createBrowserSupabase();
      const { data } = await sb.auth.getUser();
      const u = mergeLocalUser(data.user?.email ?? "", data.user?.id ?? "", data.user?.user_metadata as Record<string, unknown> | undefined);
      setMe(u);
      const books = loadBookings().filter((b) => b.userId === u.id || b.userName.toLowerCase() === u.name.toLowerCase());
      setNBook(books.length);
      setNWo(loadJobs().filter((j) => j.createdBy === u.email || j.createdBy === u.id).length);
    })();
  }, []);

  return (
    <Shell title="Portal User">
      <section className="anim relative mb-6 overflow-hidden rounded-3xl">
        <img src="/images/hero-fleet.png" alt="" className="h-36 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071526] via-[#071526]/85 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
          <p className="text-[11px] uppercase tracking-[0.2em] text-sky-300">Role USER</p>
          <h2 className="text-2xl font-semibold">Halo, {me?.name || "Pengguna"}</h2>
          <p className="text-sm text-slate-300">Ajukan pemakaian kendaraan atau buat work order. Menu admin tidak tersedia di akun ini.</p>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/user/pemakaian" className="card-hover rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">Pemakaian</p>
          <h3 className="mt-2 text-xl font-semibold">Ajukan kendaraan</h3>
          <p className="mt-1 text-sm text-slate-500">Pilih unit, tanggal, dan keperluan. {nBook} pengajuan Anda tercatat.</p>
        </Link>
        <Link href="/user/maintenance" className="card-hover rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">Maintenance</p>
          <h3 className="mt-2 text-xl font-semibold">Buat work order</h3>
          <p className="mt-1 text-sm text-slate-500">Laporkan servis unit. {nWo} WO dari akun ini.</p>
        </Link>
      </div>
    </Shell>
  );
}
