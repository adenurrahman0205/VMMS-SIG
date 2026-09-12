"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Shell } from "@/components/shell";
import { fmtN, type Vehicle, vehiclePhoto } from "@/lib/data";
import { vehicleService } from "@/lib/services/vehicle.service";

export default function KendaraanPage() {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const [source, setSource] = useState<"demo" | "supabase">("demo");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    vehicleService.listForUi().then((r) => {
      setSource(r.source);
      setVehicles(r.rows);
    });
  }, []);

  const list = useMemo(
    () =>
      vehicles.filter((v) => {
        const hit = `${v.plate} ${v.brand} ${v.model} ${v.driver}`.toLowerCase().includes(q.toLowerCase());
        return hit && (f === "all" || v.status === f);
      }),
    [q, f, vehicles]
  );

  return (
    <Shell title="Armada">
      <p className="mb-4 text-xs text-slate-500">
        Sumber: {source === "supabase" ? "Supabase live" : "katalog visual demo"} · {list.length} unit
      </p>
      <div className="mb-5 flex flex-wrap gap-2">
        <input
          className="min-w-72 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm"
          placeholder="Cari nopol, merk, driver..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {(["all", "ready", "warning", "maintenance"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setF(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${f === k ? "bg-[#071526] text-white" : "bg-white border border-slate-200"}`}
          >
            {k === "all" ? "Semua" : k}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((v, i) => (
          <Link
            key={v.id}
            href={`/kendaraan/${v.id}`}
            className={`anim card-hover delay-${(i % 4) + 1} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm`}
          >
            <div className="relative h-44 overflow-hidden">
              <img src={vehiclePhoto(v)} alt={`${v.brand} ${v.model}`} className="img-zoom h-full w-full object-cover" />
              <div className="absolute left-3 top-3">
                <Badge status={v.status} />
              </div>
            </div>
            <div className="p-4">
              <div className="text-lg font-semibold tracking-tight">{v.brand} {v.model}</div>
              <div className="text-sm text-slate-500">{v.plate} · {v.year} · {v.color}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="rounded-lg bg-slate-50 p-2">KM<br /><b>{fmtN(v.km)}</b></div>
                <div className="rounded-lg bg-slate-50 p-2">Health<br /><b>{v.health}/100</b></div>
                <div className="rounded-lg bg-slate-50 p-2">Dept<br /><b>{v.dept}</b></div>
                <div className="rounded-lg bg-slate-50 p-2">Driver<br /><b>{v.driver}</b></div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
