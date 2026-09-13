"use client";

import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { fmt, type Vehicle } from "@/lib/data";
import { loadFleet } from "@/lib/fleet-store";
import { loadJobs } from "@/lib/maintenance-store";
import { loadWorkshops } from "@/lib/workshop-store";
import {
  blankSpare,
  ingestFromJobs,
  nextSpareCode,
  saveSpareparts,
  type SparepartRow,
} from "@/lib/sparepart-store";

const inputCls =
  "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

export default function SparePage() {
  const [rows, setRows] = useState<SparepartRow[]>([]);
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [q, setQ] = useState("");
  const [shopF, setShopF] = useState("all");
  const [kindF, setKindF] = useState("all");
  const [yearF, setYearF] = useState("all");
  const [editor, setEditor] = useState<SparepartRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [detail, setDetail] = useState<SparepartRow | null>(null);
  const [shops, setShops] = useState<string[]>([]);

  useEffect(() => {
    const f = loadFleet();
    setFleet(f);
    setRows(ingestFromJobs(loadJobs(), f));
    const s = new Set<string>();
    loadWorkshops().forEach((w) => w.active && s.add(w.name));
    setShops(Array.from(s).sort());
  }, []);

  const kinds = useMemo(() => {
    const k = new Set<string>();
    fleet.forEach((v) => k.add(`${v.brand} ${v.model}`.trim()));
    rows.forEach((r) => r.vehicleKind && k.add(r.vehicleKind));
    return Array.from(k).sort();
  }, [fleet, rows]);

  const yearsForKind = useMemo(() => {
    const map = new Map<string, number[]>();
    fleet.forEach((v) => {
      const k = `${v.brand} ${v.model}`.trim();
      const arr = map.get(k) ?? [];
      if (v.year && !arr.includes(v.year)) arr.push(v.year);
      map.set(k, arr.sort((a, b) => b - a));
    });
    return map;
  }, [fleet]);

  function persist(next: SparepartRow[]) {
    saveSpareparts(next);
    setRows(next);
  }

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (!r.active) return false;
      if (shopF !== "all" && r.workshop !== shopF) return false;
      if (kindF !== "all" && r.vehicleKind !== kindF) return false;
      if (yearF !== "all" && String(r.year) !== yearF) return false;
      if (!s) return true;
      return `${r.code} ${r.name} ${r.merk} ${r.vehicleKind} ${r.year} ${r.workshop}`.toLowerCase().includes(s);
    });
  }, [rows, q, shopF, kindF, yearF]);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    const exists = rows.some((r) => r.id === editor.id);
    const code = exists ? editor.code : nextSpareCode(rows);
    const row = {
      ...editor,
      code,
      name: editor.name.trim(),
      merk: editor.merk.trim(),
      price: Number(editor.price) || 0,
      year: editor.year === "" ? "" : Number(editor.year) || "",
    };
    persist(exists ? rows.map((r) => (r.id === row.id ? row : r)) : [row, ...rows]);
    setEditor(null);
    setIsNew(false);
  }

  function remove(r: SparepartRow) {
    if (!window.confirm(`Hapus ${r.name} (${r.code}) dari katalog? Work order tidak berubah.`)) return;
    persist(rows.filter((x) => x.id !== r.id));
    if (detail?.id === r.id) setDetail(null);
  }

  const editorYears = editor?.vehicleKind ? yearsForKind.get(editor.vehicleKind) ?? [] : [];

  return (
    <Shell title="Sparepart">
      <section className="anim relative mb-6 overflow-hidden rounded-3xl">
        <img src="/images/hero-fleet.png" alt="" className="h-40 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071526] via-[#071526]/85 to-sky-900/30" />
        <div className="absolute inset-0 flex flex-col justify-end gap-4 p-6 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-sky-300">Parts catalog</p>
            <h2 className="text-2xl font-semibold sm:text-3xl">Master sparepart</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              Dipilah per merk, jenis mobil, dan tahun. Ubah/hapus katalog tidak mengubah histori work order.
            </p>
          </div>
          <button
            type="button"
            className="btn-pop shrink-0 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold !text-white shadow-lg shadow-sky-500/30"
            onClick={() => {
              setIsNew(true);
              setEditor(blankSpare(rows));
            }}
          >
            + Sparepart baru
          </button>
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Katalog", v: String(rows.filter((r) => r.active).length), s: "item aktif", c: "text-sky-700", bg: "bg-sky-50 ring-sky-100" },
          { l: "Dari WO", v: String(rows.filter((r) => r.source === "wo").length), s: "terisi otomatis", c: "text-emerald-700", bg: "bg-emerald-50 ring-emerald-100" },
          { l: "Manual", v: String(rows.filter((r) => r.source === "manual").length), s: "input katalog", c: "text-amber-800", bg: "bg-amber-50 ring-amber-100" },
          { l: "Ditampilkan", v: String(list.length), s: "sesuai filter", c: "text-slate-700", bg: "bg-slate-50 ring-slate-200" },
        ].map((k, i) => (
          <div key={k.l} className={`anim rounded-3xl p-4 ring-1 ${k.bg}`} style={{ animationDelay: `${i * 60}ms` }}>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${k.c}`}>{k.l}</p>
            <p className="mt-1 text-3xl font-semibold">{k.v}</p>
            <p className="text-xs text-slate-500">{k.s}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="flex min-w-[220px] flex-1 items-center rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <span className="mr-2 text-slate-400">⌕</span>
          <input className="w-full text-sm outline-none" placeholder="Cari kode, nama, merk, jenis, tahun…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="rounded-2xl border bg-white px-3 py-2 text-sm" value={kindF} onChange={(e) => { setKindF(e.target.value); setYearF("all"); }}>
          <option value="all">Semua jenis mobil</option>
          {kinds.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <select className="rounded-2xl border bg-white px-3 py-2 text-sm" value={yearF} onChange={(e) => setYearF(e.target.value)}>
          <option value="all">Semua tahun</option>
          {Array.from(new Set(rows.map((r) => r.year).filter(Boolean)))
            .sort((a, b) => Number(b) - Number(a))
            .map((y) => (
              <option key={String(y)}>{y}</option>
            ))}
        </select>
        <select className="rounded-2xl border bg-white px-3 py-2 text-sm" value={shopF} onChange={(e) => setShopF(e.target.value)}>
          <option value="all">Semua bengkel</option>
          {shops.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </div>

      <div className="anim overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {["Kode", "Nama", "Merk", "Jenis mobil", "Tahun", "Harga", "Bengkel", "Sumber", ""].map((h) => (
                  <th key={h || "x"} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-slate-400">
                    Belum ada sparepart. Tambah manual atau buat WO berisi item sparepart.
                  </td>
                </tr>
              )}
              {list.map((r, i) => (
                <tr
                  key={r.id}
                  className="card-hover cursor-pointer border-t border-slate-100 hover:bg-sky-50/60"
                  style={{ animationDelay: `${i * 30}ms` }}
                  onClick={() => setDetail(r)}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-sky-800">{r.code}</td>
                  <td className="px-4 py-3 font-semibold">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.merk || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.vehicleKind || "—"}</td>
                  <td className="px-4 py-3 font-medium">{r.year || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(r.price)}</td>
                  <td className="px-4 py-3">{r.workshop || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${r.source === "wo" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                      {r.source === "wo" ? "Work order" : "Manual"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="mr-3 text-xs font-semibold text-sky-700" onClick={() => { setIsNew(false); setEditor({ ...r, merk: r.merk || "", year: r.year ?? "" }); }}>
                      Ubah
                    </button>
                    <button type="button" className="text-xs font-semibold text-red-600" onClick={() => remove(r)}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-sm" />
          <div className="anim relative max-h-[92vh] w-full max-w-lg overflow-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#071526] px-6 py-5 text-white">
              <p className="font-mono text-[11px] tracking-wide text-sky-300">{detail.code}</p>
              <h2 className="text-2xl font-semibold">{detail.name}</h2>
              <p className="text-sm text-slate-300">{detail.merk || "Merk belum diisi"} · {detail.vehicleKind || "—"} {detail.year || ""}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-6">
              {[
                ["Merk sparepart", detail.merk || "—"],
                ["Jenis mobil", detail.vehicleKind || "—"],
                ["Tahun mobil", detail.year ? String(detail.year) : "—"],
                ["Harga", fmt(detail.price)],
                ["Bengkel", detail.workshop || "—"],
                ["WO terkait", detail.woId || "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">{k}</div>
                  <div className="text-sm font-semibold">{v}</div>
                </div>
              ))}
              {detail.notes && <p className="col-span-2 text-sm text-slate-600">{detail.notes}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={() => setDetail(null)}>Tutup</button>
              <button type="button" className="rounded-xl bg-[#071526] px-4 py-2 text-sm font-semibold !text-white" onClick={() => { setIsNew(false); setEditor(detail); setDetail(null); }}>
                Ubah
              </button>
            </div>
          </div>
        </div>
      )}

      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditor(null)}>
          <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-sm" />
          <form className="anim relative max-h-[94vh] w-full max-w-lg overflow-auto rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <div className="flex items-center justify-between bg-[#071526] px-6 py-4 text-white">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300">VMMS-SIG</p>
                <h2 className="text-lg font-semibold">{isNew ? "Sparepart baru" : "Ubah sparepart"}</h2>
              </div>
              <button type="button" className="rounded-full bg-white/10 px-3 py-1 text-sm !text-white" onClick={() => setEditor(null)}>Tutup</button>
            </div>
            <div className="space-y-3 p-6">
              <div className="text-xs font-semibold uppercase text-slate-500">
                Kode sparepart
                <div className="mt-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 font-mono text-sm text-slate-700">{editor.code}</div>
                <span className="mt-1 block font-normal normal-case text-[11px] text-slate-400">Otomatis, tidak bisa diubah</span>
              </div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Nama sparepart
                <input className={inputCls} required value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Merk sparepart
                <input className={inputCls} required placeholder="Toyota, Denso, Bosch…" value={editor.merk} onChange={(e) => setEditor({ ...editor, merk: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Jenis mobil
                  <select
                    className={inputCls}
                    required
                    value={editor.vehicleKind}
                    onChange={(e) => {
                      const kind = e.target.value;
                      const ys = yearsForKind.get(kind) ?? [];
                      setEditor({ ...editor, vehicleKind: kind, year: ys[0] ?? "" });
                    }}
                  >
                    <option value="">Pilih dari armada</option>
                    {kinds.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Tahun mobil
                  <select
                    className={inputCls}
                    required
                    value={editor.year === "" ? "" : String(editor.year)}
                    onChange={(e) => setEditor({ ...editor, year: e.target.value ? Number(e.target.value) : "" })}
                  >
                    <option value="">Pilih tahun</option>
                    {editorYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                    {editor.year && !editorYears.includes(Number(editor.year)) && (
                      <option value={String(editor.year)}>{editor.year}</option>
                    )}
                  </select>
                </label>
              </div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Harga
                <input className={inputCls} type="number" min={0} required value={editor.price} onChange={(e) => setEditor({ ...editor, price: Number(e.target.value) || 0 })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Bengkel
                <select className={inputCls} value={editor.workshop} onChange={(e) => setEditor({ ...editor, workshop: e.target.value })}>
                  <option value="">Pilih bengkel</option>
                  {shops.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Catatan
                <textarea className={inputCls} rows={2} value={editor.notes} onChange={(e) => setEditor({ ...editor, notes: e.target.value })} />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t bg-slate-50 px-6 py-4">
              <button type="button" className="rounded-xl border bg-white px-4 py-2 text-sm" onClick={() => setEditor(null)}>Batal</button>
              <button className="rounded-xl bg-[#071526] px-6 py-2 text-sm font-semibold !text-white">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
