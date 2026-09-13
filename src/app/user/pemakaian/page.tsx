"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { PengajuanModal } from "@/components/pengajuan-modal";
import { BookingDetailPopup } from "@/components/booking-detail-popup";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { mergeLocalUser } from "@/lib/services/profile.service";
import { loadBookings, type Booking } from "@/lib/schedule-store";
import { loadFleet } from "@/lib/fleet-store";
import { vehiclePhoto, type Vehicle } from "@/lib/data";
import type { AppUser } from "@/lib/user-store";

export default function UserPemakaian() {
  const [me, setMe] = useState<AppUser | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [rows, setRows] = useState<Booking[]>([]);
  const [fleet, setFleet] = useState<Vehicle[]>([]);

  function refresh(u: AppUser) {
    setFleet(loadFleet());
    setRows(
      loadBookings().filter((b) => b.userId === u.id || b.userName.toLowerCase() === u.name.toLowerCase())
    );
  }

  useEffect(() => {
    (async () => {
      const sb = createBrowserSupabase();
      const { data } = await sb.auth.getUser();
      const u = mergeLocalUser(data.user?.email ?? "", data.user?.id ?? "", data.user?.user_metadata as Record<string, unknown> | undefined);
      setMe(u);
      refresh(u);
    })();
  }, []);

  return (
    <Shell title="Pemakaian">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pengajuan saya</h2>
          <p className="text-sm text-slate-500">Klik baris untuk melihat detail. Pemohon terkunci ke akun login Anda.</p>
        </div>
        <button type="button" className="rounded-full bg-[#071526] px-4 py-2 text-sm font-semibold !text-white" onClick={() => setOpen(true)}>
          + Ajukan pemakaian
        </button>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Belum ada pengajuan.</p>
        ) : (
          <div className="divide-y">
            {rows.map((b) => {
              const v = fleet.find((x) => x.id === b.vehicleId);
              const approvedWhen = b.approvedAt
                ? new Date(b.approvedAt).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })
                : "";
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setDetail(b)}
                  className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 active:scale-[0.995]"
                >
                  <img src={vehiclePhoto(v ?? { model: "" })} alt="" className="h-12 w-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{v ? `${v.brand} ${v.model}` : b.vehicleId} · {v?.plate}</div>
                    <div className="text-xs text-slate-500">{b.date} · {b.purpose}</div>
                    {b.status === "disetujui" && (
                      <div className="mt-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">
                        Disetujui oleh <b>{b.approvedBy || "Admin"}</b>
                        {approvedWhen ? ` · ${approvedWhen}` : ""}
                      </div>
                    )}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${b.status === "disetujui" ? "bg-emerald-50 text-emerald-800" : b.status === "ditolak" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>{b.status}</span>
                  <span className="text-xs font-semibold text-sky-700">Detail →</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {open && me && (
        <PengajuanModal
          lockUser={me}
          onClose={() => setOpen(false)}
          onSaved={() => refresh(me)}
        />
      )}
      {detail && (
        <BookingDetailPopup
          booking={detail}
          vehicle={fleet.find((x) => x.id === detail.vehicleId)}
          me={me}
          onClose={() => setDetail(null)}
        />
      )}
    </Shell>
  );
}
