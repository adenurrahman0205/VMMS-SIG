"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Shell } from "@/components/shell";
import { VehicleForm } from "@/components/vehicle-form";
import { fmtN, type Vehicle, vehiclePhoto } from "@/lib/data";
import { blankVehicle, loadFleet, saveFleet, syncArchive, syncCreate, syncUpdate } from "@/lib/fleet-store";

export default function KendaraanPage() {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editor, setEditor] = useState<Vehicle | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setVehicles(loadFleet());
  }, []);

  function persist(next: Vehicle[]) {
    setVehicles(next);
    saveFleet(next);
  }

  const list = useMemo(
    () =>
      vehicles.filter((v) => {
        const hit = `${v.plate} ${v.brand} ${v.model} ${v.driver}`.toLowerCase().includes(q.toLowerCase());
        return hit && (f === "all" || v.status === f);
      }),
    [q, f, vehicles]
  );

  async function save(v: Vehicle) {
    if (mode === "create") {
      persist([v, ...vehicles]);
      syncCreate(v).catch(() => setMsg("Tersimpan lokal. Login admin untuk tulis ke Supabase."));
    } else {
      persist(vehicles.map((x) => (x.id === v.id ? v : x)));
      syncUpdate(v).catch(() => setMsg("Tersimpan lokal. Sync DB gagal (RLS / belum login)."));
    }
    setEditor(null);
  }

  function remove(v: Vehicle) {
    if (!confirm(`Nonaktifkan / hapus ${v.plate} ${v.brand} ${v.model}? Histori tidak dihapus permanen.`)) return;
    persist(vehicles.filter((x) => x.id !== v.id));
    syncArchive(v.id).catch(() => undefined);
  }

  return (
    <Shell title="Armada">
      <div className="mb-5 flex flex-wrap items-center gap-2">
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
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${f === k ? "bg-[#071526] text-white" : "border border-slate-200 bg-white"}`}
          >
            {k === "all" ? "Semua" : k}
          </button>
        ))}
        <button
          className="ml-auto rounded-full bg-[#071526] px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            setMode("create");
            setEditor(blankVehicle());
          }}
        >
          + Tambah kendaraan
        </button>
      </div>
      {msg && <p className="mb-3 text-xs text-amber-700">{msg}</p>}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((v) => (
          <div key={v.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Link href={`/kendaraan/${v.id}`} className="block">
              <div className="relative h-44 overflow-hidden">
                <img src={vehiclePhoto(v)} alt="" className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3">
                  <Badge status={v.status} />
                </div>
              </div>
            </Link>
            <div className="p-4">
              <div className="text-lg font-semibold">{v.brand} {v.model}</div>
              <div className="text-sm text-slate-500">{v.plate} · {v.year} · {fmtN(v.km)} km</div>
              <div className="mt-3 flex gap-2">
                <Link href={`/kendaraan/${v.id}`} className="rounded-lg border px-3 py-1.5 text-xs">
                  Detail
                </Link>
                <button
                  className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800"
                  onClick={() => {
                    setMode("edit");
                    setEditor(v);
                  }}
                >
                  Update
                </button>
                <button className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700" onClick={() => remove(v)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editor && (
        <VehicleForm
          initial={editor}
          title={mode === "create" ? "Tambah kendaraan" : `Update ${editor.plate}`}
          onSave={save}
          onClose={() => setEditor(null)}
        />
      )}
    </Shell>
  );
}
