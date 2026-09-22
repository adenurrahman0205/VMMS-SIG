"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Shell } from "@/components/shell";
import { VehicleForm } from "@/components/vehicle-form";
import { dueServiceKm, fmtN, inferOwnerKind, ownerKindLabel, type OwnerKind, type Vehicle, vehiclePhoto } from "@/lib/data";
import { blankVehicle, loadFleet, saveFleet, syncArchive, syncCreate, syncUpdate } from "@/lib/fleet-store";
import { loadJobs, syncVehicleFromJobs } from "@/lib/maintenance-store";
import { hydrateCloud } from "@/lib/services/sync.service";

export default function KendaraanPage() {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const [own, setOwn] = useState<"all" | OwnerKind>("all");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editor, setEditor] = useState<Vehicle | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    function reload(ev?: Event) {
      const key = (ev as CustomEvent | undefined)?.detail;
      if (key === "jobs") syncVehicleFromJobs(loadJobs());
      setVehicles(loadFleet());
    }
    reload();
    window.addEventListener("vmms-sync", reload);
    return () => window.removeEventListener("vmms-sync", reload);
  }, []);

  function persist(next: Vehicle[]) {
    setVehicles(next);
    saveFleet(next);
  }

  const counts = useMemo(() => {
    const sig = vehicles.filter((v) => inferOwnerKind(v) === "sig").length;
    const vendor = vehicles.filter((v) => inferOwnerKind(v) === "vendor").length;
    return {
      all: vehicles.length,
      ready: vehicles.filter((v) => v.status === "ready").length,
      warning: vehicles.filter((v) => v.status === "warning").length,
      maintenance: vehicles.filter((v) => v.status === "maintenance").length,
      sig,
      vendor,
    };
  }, [vehicles]);

  const list = useMemo(
    () =>
      vehicles.filter((v) => {
        const hit = `${v.plate} ${v.brand} ${v.model} ${v.driver} ${v.dept} ${v.owner}`.toLowerCase().includes(q.toLowerCase());
        const okOwn = own === "all" || inferOwnerKind(v) === own;
        return hit && (f === "all" || v.status === f) && okOwn;
      }),
    [q, f, own, vehicles]
  );

  function plateKey(p: string) {
    return p.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  async function save(v: Vehicle) {
    const key = plateKey(v.plate);
    if (!key) {
      setMsg("Nomor plat wajib diisi.");
      return;
    }
    const all = loadFleet();
    const dup = all.find((x) => x.id !== v.id && plateKey(x.plate) === key);
    if (dup) {
      setMsg(
        mode === "create"
          ? `Kendaraan ${dup.plate} sudah ada. Tidak bisa ditambahkan lagi.`
          : `Nomor plat ${dup.plate} sudah dipakai unit lain. Gunakan plat yang berbeda.`
      );
      return;
    }
    setMsg("");
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
      <section className="anim relative mb-6 overflow-hidden rounded-3xl">
        <img src="/images/hero-fleet.png" alt="" className="h-40 w-full object-cover sm:h-48" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071526] via-[#071526]/75 to-[#071526]/25" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-sky-300">Fleet gallery</p>
            <h2 className="text-2xl font-semibold tracking-tight">Semua unit operasional SIG</h2>
            <p className="mt-1 text-sm text-slate-300">
              {counts.all} kendaraan · milik PT Saraswanti Indo Genetech atau vendor/rental
            </p>
          </div>
          <button
            className="mt-4 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 hover:bg-sky-400 sm:mt-0"
            onClick={() => {
              setMode("create");
              setEditor(blankVehicle());
            }}
          >
            + Tambah kendaraan
          </button>
        </div>
      </section>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setOwn(own === "sig" ? "all" : "sig")}
          className="rounded-3xl bg-[#071526] p-6 text-left text-white shadow-lg ring-1 ring-white/10"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300">Milik pribadi · PT Saraswanti Indo Genetech</div>
          <div className="mt-2 text-5xl font-semibold tracking-tight">{counts.sig}</div>
          <p className="mt-2 text-sm text-slate-300">unit aset sendiri</p>
        </button>
        <button
          type="button"
          onClick={() => setOwn(own === "vendor" ? "all" : "vendor")}
          className="rounded-3xl bg-violet-700 p-6 text-left text-white shadow-lg ring-1 ring-white/10"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200">Milik vendor / rental</div>
          <div className="mt-2 text-5xl font-semibold tracking-tight">{counts.vendor}</div>
          <p className="mt-2 text-sm text-violet-100">unit sewa / mitra</p>
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["all", "Semua", counts.all, "bg-white"],
            ["ready", "Ready", counts.ready, "bg-emerald-50"],
            ["warning", "Warning", counts.warning, "bg-amber-50"],
            ["maintenance", "Bengkel", counts.maintenance, "bg-red-50"],
          ] as const
        ).map(([k, l, n, bg]) => (
          <button
            key={k}
            onClick={() => setF(k)}
            className={`rounded-2xl px-4 py-3 text-left ring-1 transition ${bg} ${
              f === k ? "ring-[#071526] shadow-md" : "ring-slate-200"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wide text-slate-500">{l}</div>
            <div className="text-2xl font-semibold tracking-tight">{n}</div>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["all", "Semua pemilik"],
            ["sig", "PT Saraswanti Indo Genetech"],
            ["vendor", "Vendor / Rental"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setOwn(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              own === k ? "bg-[#071526] !text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <span className="mr-2 text-slate-400">⌕</span>
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder="Cari nomor polisi, merk, model, driver, atau departemen…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="hidden text-xs text-slate-400 sm:inline">{list.length} hasil</span>
      </div>
      {msg && <p className="mb-3 text-xs text-amber-700">{msg}</p>}

      {list.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
          Tidak ada unit pada filter ini.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {list.map((v) => (
          <article key={v.id} className="card-hover group overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80">
            <Link href={`/kendaraan/${v.id}`} className="relative block h-52 overflow-hidden">
              <img src={vehiclePhoto(v)} alt="" className="img-zoom h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <Badge status={v.status} />
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    inferOwnerKind(v) === "vendor" ? "bg-violet-500 text-white" : "bg-sky-500 text-white"
                  }`}
                >
                  {ownerKindLabel(inferOwnerKind(v))}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-[11px] uppercase tracking-[0.18em] text-sky-200">{v.plate}</div>
                <h3 className="text-xl font-semibold tracking-tight">
                  {v.brand} {v.model}
                </h3>
              </div>
            </Link>
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Health <b className="text-slate-800">{v.health}</b>
                </span>
                <span>{v.year} · {v.color}</span>
              </div>
              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                  style={{ width: `${v.health}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 py-2">
                  <div className="text-sm font-semibold text-slate-800">{fmtN(v.km)}</div>
                  <div className="text-[10px] uppercase text-slate-400">KM</div>
                </div>
                <div className="rounded-xl bg-slate-50 py-2">
                  <div className="truncate px-1 text-sm font-semibold text-slate-800">{v.driver.split(" ")[0]}</div>
                  <div className="text-[10px] uppercase text-slate-400">User</div>
                </div>
                <div className="rounded-xl bg-slate-50 py-2">
                  <div className="truncate px-1 text-sm font-semibold text-slate-800">{v.dept.split(" ")[0]}</div>
                  <div className="text-[10px] uppercase text-slate-400">Dept</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Link
                  href={`/kendaraan/${v.id}`}
                  className="block rounded-xl bg-[#071526] py-2.5 text-center text-xs font-semibold !text-white hover:bg-[#0c2340]"
                >
                  Detail
                </Link>
                <button
                  className="rounded-xl bg-sky-50 py-2 text-xs font-semibold text-sky-800"
                  onClick={() => {
                    setMode("edit");
                    setEditor(v);
                  }}
                >
                  Update
                </button>
                <button className="rounded-xl bg-red-50 py-2 text-xs font-semibold text-red-700" onClick={() => remove(v)}>
                  Hapus
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {editor && (
        <VehicleForm
          initial={editor}
          title={mode === "create" ? "Tambah kendaraan" : `Update ${editor.plate}`}
          notice={msg}
          onSave={save}
          onClose={() => {
            setMsg("");
            setEditor(null);
          }}
        />
      )}
    </Shell>
  );
}
