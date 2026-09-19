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
  docHasNominal,
  isAsuransiDoc,
  isPajakDoc,
  isStnkDoc,
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

function leftText(left: number | null) {
  if (left == null) return "Tanggal belum diisi";
  if (left < 0) return `Kadaluarsa ${Math.abs(left)} hari`;
  if (left === 0) return "Habis hari ini";
  return `${fmtN(left)} hari lagi`;
}

function DueList({
  title,
  empty,
  items,
  onUpdate,
}: {
  title: string;
  empty: string;
  items: { v: Vehicle; d: VehicleDoc; left: number | null }[];
  onUpdate: (v: Vehicle) => void;
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
          {items.length} unit
        </span>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-400">{empty}</p>
      ) : (
        <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-auto">
          {items.map(({ v, d, left }) => {
            const expired = d.status === "expired";
            return (
              <li key={v.id + d.type} className="flex items-center gap-3 px-3 py-3">
                <img src={vehiclePhoto(v)} alt="" className="h-12 w-16 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{v.plate}</span>
                    <span className="truncate text-xs text-slate-500">
                      {v.brand} {v.model}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-800">{d.amount ? fmt(d.amount) : "Nominal —"}</span>
                    <span className={expired ? "font-semibold text-red-600" : "font-semibold text-amber-700"}>
                      {leftText(left)}
                    </span>
                    <span className="text-slate-400">s.d. {fmtDocDate(d.expire)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-xl bg-[#071526] px-3 py-2 text-xs font-semibold !text-white"
                  onClick={() => onUpdate(v)}
                >
                  Update
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function Dokumen() {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [q, setQ] = useState("");
  const [st, setSt] = useState<St>("all");
  const [kind, setKind] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [editor, setEditor] = useState<Vehicle | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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

  const dueDocs = useMemo(() => {
    type Item = { v: Vehicle; d: VehicleDoc; left: number | null };
    const pajak: Item[] = [];
    const asuransi: Item[] = [];
    rows.forEach((r) => {
      r.docs.forEach((d) => {
        if (d.status !== "segera" && d.status !== "expired") return;
        const item = { v: r.v, d, left: daysLeft(d.expire) };
        if (isPajakDoc(d.type)) pajak.push(item);
        else if (isAsuransiDoc(d.type)) asuransi.push(item);
      });
    });
    const byUrgency = (a: Item, b: Item) => (a.left ?? 9999) - (b.left ?? 9999);
    pajak.sort(byUrgency);
    asuransi.sort(byUrgency);
    return {
      pajak,
      asuransi,
      pajakSum: pajak.reduce((s, x) => s + (Number(x.d.amount) || 0), 0),
      asuransiSum: asuransi.reduce((s, x) => s + (Number(x.d.amount) || 0), 0),
    };
  }, [rows]);

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

      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        <div className="rounded-3xl bg-[#071526] p-5 text-white ring-1 ring-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">Pajak jatuh tempo</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{fmt(dueDocs.pajakSum)}</p>
          <p className="mt-1 text-sm text-slate-400">
            {dueDocs.pajak.length} unit · expired atau ≤ 60 hari
          </p>
        </div>
        <div className="rounded-3xl bg-[#0b2a4a] p-5 text-white ring-1 ring-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">Asuransi jatuh tempo</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{fmt(dueDocs.asuransiSum)}</p>
          <p className="mt-1 text-sm text-slate-400">
            {dueDocs.asuransi.length} unit · expired atau ≤ 60 hari
          </p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <DueList
          title="Daftar Pajak"
          empty="Tidak ada pajak yang hampir atau sudah jatuh tempo."
          items={dueDocs.pajak}
          onUpdate={setEditor}
        />
        <DueList
          title="Daftar Asuransi"
          empty="Tidak ada asuransi yang hampir atau sudah jatuh tempo."
          items={dueDocs.asuransi}
          onUpdate={setEditor}
        />
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
                          {docHasNominal(d.type) && d.amount ? ` · ${fmt(d.amount)}` : ""}
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
                <div className="anim border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-5">
                  {r.docs.length === 0 ? (
                    <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-500 ring-1 ring-slate-200">
                      Unit ini belum punya STNK / asuransi / pajak. Isi lewat tombol Update.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {r.docs.map((d) => {
                        const left = daysLeft(d.expire);
                        const expired = d.status === "expired";
                        const soon = d.status === "segera";
                        const pct =
                          left == null
                            ? 0
                            : left < 0
                              ? 0
                              : Math.max(6, Math.min(100, Math.round((left / 365) * 100)));
                        const tone = expired
                          ? "from-red-500/90 to-red-700"
                          : soon
                            ? "from-amber-400 to-orange-500"
                            : "from-sky-500 to-emerald-500";
                        const chip = expired
                          ? "bg-red-50 text-red-700"
                          : soon
                            ? "bg-amber-50 text-amber-800"
                            : "bg-emerald-50 text-emerald-700";
                        const leftLabel =
                          left == null
                            ? "Tanggal belum diisi"
                            : left < 0
                              ? `Kadaluarsa ${Math.abs(left)} hari lalu`
                              : left === 0
                                ? "Habis hari ini"
                                : `${fmtN(left)} hari lagi`;
                        return (
                          <article
                            key={d.type + d.expire}
                            className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
                          >
                            <div className={`h-1.5 bg-gradient-to-r ${tone}`} />
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className={`grid h-11 w-11 place-items-center rounded-2xl ${chip}`}>
                                    <DocGlyph type={d.type} />
                                  </span>
                                  <div>
                                    <div className="text-base font-semibold text-slate-900">{d.type}</div>
                                    <div className="text-[11px] uppercase tracking-wide text-slate-400">Dokumen unit</div>
                                  </div>
                                </div>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${chip}`}>
                                  {d.status}
                                </span>
                              </div>

                              {isStnkDoc(d.type) && (
                                <button
                                  type="button"
                                  className="mt-4 w-full overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200"
                                  onClick={() => d.photo && setPreview(d.photo)}
                                >
                                  {d.photo ? (
                                    <img src={d.photo} alt="STNK" className="h-36 w-full object-cover" />
                                  ) : (
                                    <div className="grid h-28 place-items-center text-xs font-semibold text-slate-400">
                                      Foto STNK belum diunggah
                                    </div>
                                  )}
                                </button>
                              )}

                              {docHasNominal(d.type) && (
                                <div className="mt-4 rounded-2xl bg-[#071526] px-4 py-3 text-white">
                                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                                    {isAsuransiDoc(d.type) ? "Nominal asuransi" : "Nominal pajak"}
                                  </div>
                                  <div className="mt-1 text-xl font-semibold tracking-tight">{d.amount ? fmt(d.amount) : "Belum diisi"}</div>
                                </div>
                              )}

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Berlaku sampai</div>
                                  <div className="mt-0.5 text-sm font-semibold text-slate-800">{fmtDocDate(d.expire)}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sisa waktu</div>
                                  <div className={`mt-0.5 text-sm font-semibold ${expired ? "text-red-600" : soon ? "text-amber-700" : "text-emerald-700"}`}>
                                    {leftLabel}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/kendaraan/${r.v.id}`} className="text-sm font-semibold text-sky-700 hover:underline">
                      Buka dossier unit →
                    </Link>
                    <button
                      type="button"
                      className="rounded-xl bg-[#071526] px-4 py-2 text-sm font-semibold !text-white"
                      onClick={() => setEditor(r.v)}
                    >
                      Update dokumen
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="absolute inset-0 bg-[#071526]/80 backdrop-blur-sm" />
          <div className="anim relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between bg-[#071526] px-5 py-3 text-white">
              <p className="text-sm font-semibold">Foto STNK</p>
              <button type="button" className="rounded-full bg-white/10 px-3 py-1 text-sm !text-white" onClick={() => setPreview(null)}>
                Tutup
              </button>
            </div>
            <img src={preview} alt="STNK" className="max-h-[80vh] w-full object-contain bg-slate-100" />
          </div>
        </div>
      )}

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
