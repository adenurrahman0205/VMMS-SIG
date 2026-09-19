"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { VehicleForm } from "@/components/vehicle-form";
import {
  DOC_TYPES,
  docStatusFromExpire,
  docsForVehicle,
  ensureCoreDocs,
  fmt,
  fmtN,
  isPajakDoc,
  vehiclePhoto,
  type Vehicle,
  type VehicleDoc,
} from "@/lib/data";
import { loadFleet, saveFleet, syncUpdate } from "@/lib/fleet-store";

type St = "all" | "aktif" | "segera" | "expired" | "kosong";

function daysLeft(expire: string) {
  if (!expire) return null;
  return Math.ceil((new Date(expire + "T00:00:00").getTime() - Date.now()) / 86400000);
}

function liveDoc(d: VehicleDoc): VehicleDoc {
  return { ...d, status: docStatusFromExpire(d.expire) };
}

function fmtDocDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function DocGlyph({ type }: { type: string }) {
  const t = type.toLowerCase();
  const d =
    t.includes("stnk")
      ? "M7 3h8l5 5v13H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM15 3v5h5"
      : t.includes("bpkb")
        ? "M4 6h16v12H4zM8 10h8M8 14h5"
        : t.includes("pajak")
          ? "M12 3v18M8 7h8M7 11h10M9 15h6M10 19h4"
          : t.includes("asuransi")
            ? "M12 3 4 7v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V7l-8-4Z"
            : "M7 3h8l5 5v13H7V3Z";
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function Dokumen() {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [q, setQ] = useState("");
  const [st, setSt] = useState<St>("all");
  const [kind, setKind] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [editor, setEditor] = useState<Vehicle | null>(null);

  useEffect(() => {
    const loaded = loadFleet();
    const dropDemoKir = typeof window !== "undefined" && !localStorage.getItem("vmms-drop-demo-kir");
    let changed = false;
    const next = loaded.map((v) => {
      let documents = ensureCoreDocs(v);
      if (dropDemoKir) documents = documents.filter((d) => d.type.toLowerCase() !== "kir");
      if (documents.length !== (v.documents?.length ?? 0)) changed = true;
      else if (
        documents.some(
          (d) =>
            !v.documents?.some(
              (x) => x.type === d.type && x.expire === d.expire && (x.amount ?? 0) === (d.amount ?? 0)
            )
        )
      )
        changed = true;
      return { ...v, documents };
    });
    if (dropDemoKir) {
      localStorage.setItem("vmms-drop-demo-kir", "1");
      changed = true;
    }
    if (changed) saveFleet(next);
    setFleet(next);
  }, []);

  const rows = useMemo(() => {
    return fleet.map((v) => {
      const docs = docsForVehicle(v).map(liveDoc);
      const worst = docs.some((d) => d.status === "expired")
        ? "expired"
        : docs.some((d) => d.status === "segera")
          ? "segera"
          : docs.length
            ? "aktif"
            : "kosong";
      return { v, docs, worst };
    });
  }, [fleet]);

  const stats = useMemo(() => {
    const docs = rows.flatMap((r) => r.docs);
    return {
      n: rows.length,
      docs: docs.length,
      aktif: docs.filter((d) => d.status === "aktif").length,
      segera: docs.filter((d) => d.status === "segera").length,
      expired: docs.filter((d) => d.status === "expired").length,
      kosong: rows.filter((r) => r.docs.length === 0).length,
    };
  }, [rows]);

  const usedTypes = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.docs.forEach((d) => set.add(d.type)));
    return set;
  }, [rows]);

  const filterTypes = useMemo(
    () => DOC_TYPES.filter((t) => t !== "KIR" || usedTypes.has("KIR")),
    [usedTypes]
  );

  useEffect(() => {
    if (kind === "KIR" && !usedTypes.has("KIR")) setKind("all");
  }, [kind, usedTypes]);

  function persist(next: Vehicle[]) {
    saveFleet(next);
    setFleet(next);
  }

  function saveEditor(v: Vehicle) {
    persist(fleet.map((x) => (x.id === v.id ? v : x)));
    syncUpdate(v).catch(() => undefined);
    setEditor(null);
  }

  const shown = useMemo(() => {
    const s = q.toLowerCase();
    return rows.filter((r) => {
      const blob = `${r.v.plate} ${r.v.brand} ${r.v.model} ${r.v.driver} ${r.v.dept}`.toLowerCase();
      if (s && !blob.includes(s)) return false;
      if (kind !== "all" && !r.docs.some((d) => d.type === kind)) return false;
      if (st === "kosong") return r.docs.length === 0;
      if (st !== "all") {
        if (kind !== "all") return r.docs.some((d) => d.type === kind && d.status === st);
        return r.docs.some((d) => d.status === st);
      }
      return true;
    });
  }, [rows, q, st, kind]);

  return (
    <Shell title="Dokumen">
      <section className="anim relative mb-6 overflow-hidden rounded-3xl">
        <img src="/images/hero-fleet.png" alt="" className="h-36 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071526] via-[#071526]/85 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-5 text-white sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.22em] text-sky-300">Compliance</p>
          <h2 className="text-2xl font-semibold">Dokumen armada</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-300">
            STNK, BPKB, asuransi, dan pajak mengikuti data setiap unit di Armada. Filter KIR hanya tampil jika ada unit yang memakai KIR.
          </p>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Unit", String(stats.n), "seluruh armada"],
          ["Dokumen", String(stats.docs), "semua jenis"],
          ["Aktif", String(stats.aktif), "masih berlaku"],
          ["Segera", String(stats.segera), "≤ 60 hari"],
          ["Expired", String(stats.expired), `${stats.kosong} unit tanpa data`],
        ].map(([l, n, s]) => (
          <div key={l} className="rounded-2xl bg-[#071526] p-4 text-white ring-1 ring-white/10">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">{l}</div>
            <div className="mt-2 text-2xl font-semibold">{n}</div>
            <div className="mt-1 text-[11px] text-slate-400">{s}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className="min-w-[200px] flex-1 rounded-xl border bg-white px-3 py-2 text-sm"
          placeholder="Cari plat, model, driver…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {(["all", "aktif", "segera", "expired", "kosong"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setSt(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${st === k ? "bg-[#071526] !text-white" : "bg-white ring-1 ring-slate-200"}`}
          >
            {k === "all" ? "Semua" : k === "kosong" ? "Tanpa dokumen" : k}
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setKind("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${kind === "all" ? "bg-sky-600 !text-white" : "bg-white ring-1 ring-slate-200"}`}
        >
          Semua jenis
        </button>
        {filterTypes.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setKind(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${kind === t ? "bg-sky-600 !text-white" : "bg-white ring-1 ring-slate-200"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-sm text-slate-400 ring-1 ring-slate-200">Tidak ada unit pada filter ini.</p>}
        {shown.map((r) => {
          const on = open === r.v.id;
          const tone =
            r.worst === "expired"
              ? "ring-red-200"
              : r.worst === "segera"
                ? "ring-amber-200"
                : r.worst === "kosong"
                  ? "ring-slate-200"
                  : "ring-slate-200";
          return (
            <div key={r.v.id} className={`overflow-hidden rounded-3xl bg-white ring-1 ${tone}`}>
              <div className="flex w-full flex-wrap items-center gap-4 p-4">
                <button type="button" className="flex min-w-0 flex-1 flex-wrap items-center gap-4 text-left" onClick={() => setOpen(on ? null : r.v.id)}>
                <img src={vehiclePhoto(r.v)} alt="" className="h-16 w-24 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{r.v.plate}</span>
                    <span className="text-slate-500">{r.v.brand} {r.v.model}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                      {r.v.ownerKind === "vendor" ? "Vendor" : "PT SIG"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {r.v.driver || "—"} · {r.v.dept || "—"} · {fmtN(r.v.km)} KM
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.docs.length === 0 && <span className="text-xs text-slate-400">Belum ada dokumen — isi di Update kendaraan</span>}
                    {r.docs.map((d) => {
                      const cls =
                        d.status === "expired"
                          ? "bg-red-50 text-red-700"
                          : d.status === "segera"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-emerald-50 text-emerald-700";
                      return (
                        <span key={d.type + d.expire} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>
                          {d.type} · {d.status}
                          {isPajakDoc(d.type) && d.amount ? ` · ${fmt(d.amount)}` : ""}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">{on ? "Tutup" : "Detail"}</div>
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded-xl bg-[#071526] px-4 py-2.5 text-sm font-semibold !text-white"
                  onClick={() => setEditor(r.v)}
                >
                  Update
                </button>
              </div>
              {on && (
                <div className="border-t bg-slate-50/80 p-4">
                  {r.docs.length === 0 ? (
                    <p className="text-sm text-slate-500">Unit ini belum punya STNK/asuransi/pajak di form Armada.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {r.docs.map((d) => {
                        const left = daysLeft(d.expire);
                        const cls =
                          d.status === "expired"
                            ? "border-red-200 bg-red-50/50"
                            : d.status === "segera"
                              ? "border-amber-200 bg-amber-50/40"
                              : "border-slate-200 bg-white";
                        return (
                          <div key={d.type + d.expire} className={`rounded-2xl border p-4 ${cls}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-sm font-semibold">{d.type}</div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                  d.status === "expired"
                                    ? "bg-red-100 text-red-700"
                                    : d.status === "segera"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {d.status}
                              </span>
                            </div>
                            {isPajakDoc(d.type) && (
                              <>
                                <div className="mt-3 text-[11px] uppercase tracking-wide text-slate-400">Nominal pajak</div>
                                <div className="text-lg font-semibold">{d.amount ? fmt(d.amount) : "—"}</div>
                              </>
                            )}
                            <div className="mt-3 text-[11px] uppercase tracking-wide text-slate-400">Berlaku sampai</div>
                            <div className="text-lg font-semibold">{d.expire || "—"}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {left == null
                                ? "Tanggal belum diisi"
                                : left < 0
                                  ? `Kadaluarsa ${Math.abs(left)} hari lalu`
                                  : left === 0
                                    ? "Habis hari ini"
                                    : `${left} hari lagi`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Link href={`/kendaraan/${r.v.id}`} className="mt-4 inline-block text-sm font-semibold text-sky-700">
                    Buka dossier unit →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editor && (
        <VehicleForm
          initial={editor}
          title={`Update dokumen ${editor.plate}`}
          sections="docs"
          onSave={saveEditor}
          onClose={() => setEditor(null)}
        />
      )}
    </Shell>
  );
}
