"use client";

import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { SearchSelect } from "@/components/search-select";
import { fmt, type Vehicle } from "@/lib/data";
import { loadFleet } from "@/lib/fleet-store";
import { loadJobs } from "@/lib/maintenance-store";
import { loadWorkshops } from "@/lib/workshop-store";
import {
  blankSpare,
  ingestFromJobs,
  nextSpareCode,
  saveSpareparts,
  SPARE_UNITS,
  type SparepartRow,
} from "@/lib/sparepart-store";

const inputCls =
  "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function compressPartPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 480;
      const scale = Math.min(1, max / Math.max(img.width, img.height, 1));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal baca foto"));
    };
    img.src = url;
  });
}

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
  const [page, setPage] = useState(1);
  const PAGE = 15;

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
      return `${r.code} ${r.name} ${r.merk} ${r.vehicleKind} ${r.year} ${r.workshop} ${r.buyDate}`.toLowerCase().includes(s);
    });
  }, [rows, q, shopF, kindF, yearF]);

  useEffect(() => {
    setPage(1);
  }, [q, shopF, kindF, yearF]);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE));
  const pageSafe = Math.min(page, pageCount);
  const pageRows = list.slice((pageSafe - 1) * PAGE, pageSafe * PAGE);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    const exists = rows.some((r) => r.id === editor.id);
    const code = exists ? editor.code : nextSpareCode(rows);
    const year: SparepartRow["year"] =
      editor.year === "" || editor.year == null ? "" : Number(editor.year) || "";
    const row: SparepartRow = {
      ...editor,
      code,
      name: editor.name.trim(),
      merk: editor.merk.trim(),
      price: Number(editor.price) || 0,
      qty: Number(editor.qty) > 0 ? Number(editor.qty) : 1,
      unit: (editor.unit || "PCS").toUpperCase(),
      year,
      buyDate: editor.buyDate || "",
      photo: editor.photo || "",
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
        <div className="min-w-[180px] lg:w-52">
          <SearchSelect
            value={kindF === "all" ? "" : kindF}
            placeholder="Semua jenis mobil"
            onChange={(v) => { setKindF(v || "all"); setYearF("all"); }}
            options={kinds.map((k) => ({ value: k, label: k }))}
          />
        </div>
        <div className="min-w-[140px] lg:w-40">
          <SearchSelect
            value={yearF === "all" ? "" : yearF}
            placeholder="Semua tahun"
            onChange={(v) => setYearF(v || "all")}
            options={Array.from(new Set(rows.map((r) => r.year).filter(Boolean)))
              .sort((a, b) => Number(b) - Number(a))
              .map((y) => ({ value: String(y), label: String(y) }))}
          />
        </div>
        <div className="min-w-[180px] lg:w-52">
          <SearchSelect
            value={shopF === "all" ? "" : shopF}
            placeholder="Semua bengkel"
            onChange={(v) => setShopF(v || "all")}
            options={shops.map((k) => ({ value: k, label: k }))}
          />
        </div>
      </div>

      <div className="anim overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {["Foto", "Kode", "Nama", "Tanggal", "Harga", "QTY", "Unit", "Merk", "Jenis mobil", "Tahun", "Bengkel", "Sumber", ""].map((h) => (
                  <th key={h || "x"} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-14 text-center text-slate-400">
                    Belum ada sparepart. Tambah manual atau buat WO berisi item sparepart.
                  </td>
                </tr>
              )}
              {pageRows.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer border-t border-slate-100 hover:bg-sky-50/60"
                  onClick={() => setDetail(r)}
                >
                  <td className="px-4 py-3">
                    {r.photo ? (
                      <img src={r.photo} alt="" className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200" />
                    ) : (
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-[10px] font-semibold text-slate-400">Foto</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-sky-800">{r.code}</td>
                  <td className="px-4 py-3 font-semibold">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.merk || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.vehicleKind || "—"}</td>
                  <td className="px-4 py-3 font-medium">{r.year || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{r.qty ?? 1}</td>
                  <td className="px-4 py-3 uppercase text-slate-600">{r.unit || "PCS"}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(r.price)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.buyDate || "—"}</td>
                  <td className="px-4 py-3">{r.workshop || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${r.source === "wo" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                      {r.source === "wo" ? "Work order" : "Manual"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="mr-3 text-xs font-semibold text-sky-700" onClick={() => { setIsNew(false); setEditor({ ...r, merk: r.merk || "", year: r.year ?? "", qty: r.qty || 1, unit: r.unit || "PCS" }); }}>
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">
            {list.length === 0
              ? "0 item"
              : `${(pageSafe - 1) * PAGE + 1}–${Math.min(pageSafe * PAGE, list.length)} dari ${list.length} item`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageSafe <= 1}
              className="rounded-xl border bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </button>
            <span className="text-xs font-semibold text-slate-600">
              {pageSafe} / {pageCount}
            </span>
            <button
              type="button"
              disabled={pageSafe >= pageCount}
              className="rounded-xl border bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-sm" />
          <div className="anim relative max-h-[92vh] w-full max-w-lg overflow-auto rounded-t-3xl bg-white pb-8 shadow-2xl sm:rounded-3xl sm:pb-0" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#071526] px-6 py-5 text-white">
              <div className="flex items-start gap-4">
                {detail.photo ? (
                  <img src={detail.photo} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-2 ring-white/20" />
                ) : (
                  <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/10 text-xs font-semibold text-slate-300">Tidak ada foto</span>
                )}
                <div className="min-w-0">
                  <p className="font-mono text-[11px] tracking-wide text-sky-300">{detail.code}</p>
                  <h2 className="text-2xl font-semibold leading-tight">{detail.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">{detail.merk || "Merk belum diisi"} · {detail.vehicleKind || "—"} {detail.year || ""}</p>
                </div>
              </div>
            </div>
            {detail.photo && (
              <img src={detail.photo} alt="" className="h-44 w-full object-cover" />
            )}
            <div className="grid grid-cols-2 gap-3 p-6">
              {[
                ["Merk sparepart", detail.merk || "—"],
                ["Jenis mobil", detail.vehicleKind || "—"],
                ["Tahun mobil", detail.year ? String(detail.year) : "—"],
                ["QTY", String(detail.qty ?? 1)],
                ["Unit", (detail.unit || "PCS").toUpperCase()],
                ["Tanggal beli", fmtDate(detail.buyDate)],
                ["Harga", fmt(detail.price)],
                ["Bengkel", detail.workshop || "—"],
                ["Sumber", detail.source === "wo" ? "Work order" : "Manual"],
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setEditor(null)}>
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
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Foto sparepart</p>
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  {editor.photo ? (
                    <img src={editor.photo} alt="" className="h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-200" />
                  ) : (
                    <span className="grid h-20 w-20 place-items-center rounded-2xl bg-white text-[10px] font-semibold text-slate-400 ring-1 ring-slate-200">Belum ada</span>
                  )}
                  <div className="min-w-0">
                    <label className="inline-flex cursor-pointer rounded-xl bg-[#071526] px-4 py-2.5 text-xs font-semibold !text-white">
                      Unggah foto
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file || !editor) return;
                          try {
                            const photo = await compressPartPhoto(file);
                            setEditor({ ...editor, photo });
                          } catch {
                            window.alert("Gagal membaca foto. Coba file JPG/PNG lain.");
                          }
                        }}
                      />
                    </label>
                    {editor.photo && (
                      <button type="button" className="ml-3 text-xs font-semibold text-red-600" onClick={() => setEditor({ ...editor, photo: "" })}>
                        Hapus foto
                      </button>
                    )}
                    <p className="mt-2 text-[11px] text-slate-400">JPG/PNG. Foto tampil di tabel dan popup detail.</p>
                  </div>
                </div>
              </div>
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
                  <SearchSelect
                    required
                    placeholder="Pilih dari armada"
                    value={editor.vehicleKind}
                    onChange={(kind) => {
                      const ys = yearsForKind.get(kind) ?? [];
                      setEditor({ ...editor, vehicleKind: kind, year: ys[0] ?? "" });
                    }}
                    options={kinds.map((k) => ({ value: k, label: k }))}
                  />
                </label>
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Tahun mobil
                  <SearchSelect
                    required
                    placeholder="Pilih tahun"
                    value={editor.year === "" ? "" : String(editor.year)}
                    onChange={(v) => setEditor({ ...editor, year: v ? Number(v) : "" })}
                    options={[
                      ...editorYears.map((y) => ({ value: String(y), label: String(y) })),
                      ...(editor.year && !editorYears.includes(Number(editor.year))
                        ? [{ value: String(editor.year), label: String(editor.year) }]
                        : []),
                    ]}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  QTY
                  <input className={inputCls} type="number" min={1} required value={editor.qty ?? 1} onChange={(e) => setEditor({ ...editor, qty: Math.max(1, Number(e.target.value) || 1) })} />
                </label>
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Unit
                  <SearchSelect
                    allowEmpty={false}
                    value={editor.unit || "PCS"}
                    onChange={(v) => setEditor({ ...editor, unit: v })}
                    options={[
                      ...SPARE_UNITS.map((u) => ({ value: u, label: u })),
                      ...(editor.unit && !SPARE_UNITS.includes(editor.unit as (typeof SPARE_UNITS)[number])
                        ? [{ value: editor.unit, label: editor.unit }]
                        : []),
                    ]}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Harga
                  <input className={inputCls} type="number" min={0} required value={editor.price} onChange={(e) => setEditor({ ...editor, price: Number(e.target.value) || 0 })} />
                </label>
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Tanggal beli
                  <input className={inputCls} type="date" value={editor.buyDate || ""} onChange={(e) => setEditor({ ...editor, buyDate: e.target.value })} />
                </label>
              </div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Bengkel
                <SearchSelect
                  placeholder="Pilih bengkel"
                  value={editor.workshop}
                  onChange={(v) => setEditor({ ...editor, workshop: v })}
                  options={shops.map((k) => ({ value: k, label: k }))}
                />
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
