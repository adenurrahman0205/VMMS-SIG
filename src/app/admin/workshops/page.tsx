"use client";

import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import {
  blankWorkshop,
  loadWorkshops,
  nextWorkshopCode,
  saveWorkshops,
  waHref,
  type Workshop,
} from "@/lib/workshop-store";
import { loadJobs } from "@/lib/maintenance-store";

const inputCls =
  "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default function WorkshopsPage() {
  const [rows, setRows] = useState<Workshop[]>([]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [editor, setEditor] = useState<Workshop | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [detail, setDetail] = useState<Workshop | null>(null);
  const [copied, setCopied] = useState("");
  const [woCount, setWoCount] = useState<Record<string, number>>({});

  useEffect(() => {
    setRows(loadWorkshops());
    const jobs = loadJobs();
    const m: Record<string, number> = {};
    jobs.forEach((j) => {
      const k = (j.shop || "").toLowerCase();
      if (!k) return;
      m[k] = (m[k] || 0) + 1;
    });
    setWoCount(m);
  }, []);

  function persist(next: Workshop[]) {
    saveWorkshops(next);
    setRows(next);
  }

  const cities = useMemo(() => {
    const s = new Set(rows.filter((w) => w.active).map((w) => w.city).filter(Boolean));
    return Array.from(s).sort();
  }, [rows]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((w) => {
      if (!showArchived && !w.active) return false;
      if (city !== "all" && w.city !== city) return false;
      if (!s) return true;
      return `${w.code} ${w.name} ${w.address} ${w.city} ${w.phone} ${w.pic} ${w.specialty}`.toLowerCase().includes(s);
    });
  }, [rows, q, city, showArchived]);

  const nActive = rows.filter((w) => w.active).length;

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    const exists = rows.some((w) => w.id === editor.id);
    const code = (exists ? editor.code : nextWorkshopCode(rows)).trim().toUpperCase();
    const row = { ...editor, code };
    persist(exists ? rows.map((w) => (w.id === row.id ? row : w)) : [row, ...rows]);
    setEditor(null);
    setIsNew(false);
  }

  function archive(w: Workshop) {
    if (!window.confirm(`Arsipkan ${w.name}? Data tetap tersimpan.`)) return;
    persist(rows.map((x) => (x.id === w.id ? { ...x, active: false } : x)));
    if (detail?.id === w.id) setDetail({ ...w, active: false });
  }

  function restore(w: Workshop) {
    persist(rows.map((x) => (x.id === w.id ? { ...x, active: true } : x)));
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 1400);
    } catch {
      /* ignore */
    }
  }

  return (
    <Shell title="Bengkel">
      <section className="anim relative mb-6 overflow-hidden rounded-3xl">
        <img src="/images/hero-fleet.png" alt="" className="h-40 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071526] via-[#071526]/85 to-sky-900/30" />
        <div className="absolute inset-0 flex flex-col justify-end gap-4 p-6 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-sky-300">Partner network</p>
            <h2 className="text-2xl font-semibold sm:text-3xl">Bengkel mitra perusahaan</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              Daftar bengkel yang bekerja sama dengan SIG: kode, alamat lengkap, dan WhatsApp. Klik kartu untuk dossier.
            </p>
          </div>
          <button
            type="button"
            className="btn-pop shrink-0 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold !text-white shadow-lg shadow-sky-500/30"
            onClick={() => {
              setIsNew(true);
              setEditor(blankWorkshop(rows));
            }}
          >
            + Bengkel baru
          </button>
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Mitra aktif", v: String(nActive), s: "siap menerima WO", c: "text-emerald-700", bg: "bg-emerald-50 ring-emerald-100" },
          { l: "Kota", v: String(cities.length), s: "jangkauan layanan", c: "text-sky-700", bg: "bg-sky-50 ring-sky-100" },
          { l: "Arsip", v: String(rows.length - nActive), s: "tidak ditampilkan default", c: "text-slate-600", bg: "bg-slate-50 ring-slate-200" },
          { l: "Ditampilkan", v: String(list.length), s: "sesuai filter", c: "text-amber-800", bg: "bg-amber-50 ring-amber-100" },
        ].map((k, i) => (
          <div key={k.l} className={`anim rounded-3xl p-4 ring-1 ${k.bg}`} style={{ animationDelay: `${i * 70}ms` }}>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${k.c}`}>{k.l}</p>
            <p className="mt-1 text-3xl font-semibold">{k.v}</p>
            <p className="text-xs text-slate-500">{k.s}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-[220px] flex-1 items-center rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <span className="mr-2 text-slate-400">⌕</span>
          <input
            className="w-full text-sm outline-none"
            placeholder="Cari kode, nama, alamat, PIC…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCity("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${city === "all" ? "bg-[#071526] !text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            Semua kota
          </button>
          {cities.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCity(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${city === c ? "bg-[#071526] !text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
            >
              {c}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${showArchived ? "bg-amber-600 !text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {showArchived ? "Termasuk arsip" : "Hanya aktif"}
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-slate-200">
          <p className="text-sm text-slate-400">Tidak ada bengkel pada filter ini.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((w, i) => {
            const wa = waHref(w.phone);
            const nWo = woCount[w.name.toLowerCase()] || 0;
            return (
              <article
                key={w.id}
                className="card-hover anim group overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <button type="button" className="w-full text-left" onClick={() => setDetail(w)}>
                  <div className="relative h-28 overflow-hidden bg-[#0b1a2e]">
                    <img src="/images/hero-fleet.png" alt="" className="img-zoom h-full w-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071526] to-transparent" />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-sky-200 backdrop-blur">
                        {w.code}
                      </span>
                      {!w.active && (
                        <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-slate-200">Arsip</span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-lg font-semibold text-white">{w.name}</h3>
                      <p className="text-xs text-slate-300">{w.city || "—"} · {w.specialty || "Layanan umum"}</p>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="text-sm leading-relaxed text-slate-600">{w.address || "Alamat belum diisi"}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wide text-slate-400">PIC</div>
                        <div className="truncate font-semibold">{w.pic || "—"}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wide text-slate-400">Jam</div>
                        <div className="truncate font-semibold">{w.hours || "—"}</div>
                      </div>
                    </div>
                    {nWo > 0 && <p className="text-[11px] font-medium text-sky-700">{nWo} work order tercatat ke bengkel ini</p>}
                  </div>
                </button>
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-600 hover:!text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      WA {w.phone}
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">Telp belum diisi</span>
                  )}
                  <span className="ml-auto flex gap-2">
                    <button
                      type="button"
                      className="text-xs font-semibold text-sky-700"
                      onClick={() => {
                        setIsNew(false);
                        setEditor(w);
                      }}
                    >
                      Ubah
                    </button>
                    {w.active ? (
                      <button type="button" className="text-xs font-semibold text-red-600" onClick={() => archive(w)}>
                        Arsip
                      </button>
                    ) : (
                      <button type="button" className="text-xs font-semibold text-emerald-700" onClick={() => restore(w)}>
                        Pulihkan
                      </button>
                    )}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-sm" />
          <div
            className="anim relative max-h-[94vh] w-full max-w-3xl overflow-auto rounded-t-3xl bg-[#0b1628] text-slate-100 shadow-2xl ring-1 ring-white/10 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-44">
              <img src="/images/hero-fleet.png" alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1628] via-[#0b1628]/55 to-transparent" />
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1 text-sm !text-white ring-1 ring-white/20"
              >
                Tutup
              </button>
              <div className="absolute bottom-4 left-5 right-5">
                <p className="font-mono text-[11px] tracking-wide text-sky-300">{detail.code}</p>
                <h2 className="text-2xl font-semibold sm:text-3xl">{detail.name}</h2>
                <p className="text-sm text-slate-300">{detail.city} · {detail.active ? "Mitra aktif" : "Diarsipkan"}</p>
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-5">
              <div className="space-y-3 lg:col-span-3">
                {[
                  ["Alamat lengkap", detail.address || "—"],
                  ["Nomor telp / WhatsApp", detail.phone || "—"],
                  ["Email", detail.email || "—"],
                  ["Kontak PIC", detail.pic || "—"],
                  ["Jam operasional", detail.hours || "—"],
                  ["Spesialisasi", detail.specialty || "—"],
                  ["NPWP", detail.npwp || "—"],
                ].map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    className="flex w-full items-start justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3 text-left ring-1 ring-white/10 transition hover:bg-white/10"
                    onClick={() => copyText(k, String(v))}
                  >
                    <span>
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{k}</span>
                      <span className="mt-0.5 block text-sm font-medium">{v}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-500">{copied === k ? "Tersalin" : "Salin"}</span>
                  </button>
                ))}
                {detail.notes && (
                  <div className="rounded-2xl bg-sky-500/10 px-4 py-3 text-sm ring-1 ring-sky-400/20">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-300">Catatan kerja sama</p>
                    <p className="mt-1 text-slate-200">{detail.notes}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3 lg:col-span-2">
                <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Work order</p>
                  <p className="mt-1 text-4xl font-semibold">{woCount[detail.name.toLowerCase()] || 0}</p>
                  <p className="text-xs text-slate-400">tercatat dengan nama bengkel ini</p>
                </div>
                {detail.phone && waHref(detail.phone) && (
                  <a
                    href={waHref(detail.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-pop block rounded-2xl bg-emerald-500 px-4 py-3 text-center text-sm font-semibold !text-white"
                  >
                    Chat WhatsApp
                  </a>
                )}
                {detail.address && (
                  <a
                    href={mapsUrl(detail.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-pop block rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-semibold ring-1 ring-white/15"
                  >
                    Buka di Google Maps
                  </a>
                )}
                <button
                  type="button"
                  className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold !text-white"
                  onClick={() => {
                    setIsNew(false);
                    setEditor(detail);
                    setDetail(null);
                  }}
                >
                  Ubah data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditor(null)}>
          <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-sm" />
          <form
            className="anim relative max-h-[94vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={save}
          >
            <div className="flex items-center justify-between bg-[#071526] px-6 py-4 text-white">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300">VMMS-SIG</p>
                <h2 className="text-lg font-semibold">{isNew ? "Bengkel mitra baru" : "Ubah bengkel"}</h2>
              </div>
              <button type="button" className="rounded-full bg-white/10 px-3 py-1 text-sm !text-white" onClick={() => setEditor(null)}>
                Tutup
              </button>
            </div>
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <div className="block text-xs font-semibold uppercase text-slate-500">
                Kode bengkel
                <div className="mt-1 flex items-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 font-mono text-sm tracking-wide text-slate-700">
                  {editor.code || "BKL-…"}
                </div>
                <span className="mt-1 block font-normal normal-case tracking-normal text-[11px] text-slate-400">
                  Terisi otomatis, tidak bisa diubah
                </span>
              </div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Nama bengkel
                <input className={inputCls} required value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} />
              </label>
              <label className="sm:col-span-2 block text-xs font-semibold uppercase text-slate-500">
                Alamat lengkap
                <textarea className={inputCls} rows={2} required value={editor.address} onChange={(e) => setEditor({ ...editor, address: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Kota
                <input className={inputCls} value={editor.city} onChange={(e) => setEditor({ ...editor, city: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Nomor telp / WhatsApp
                <input className={inputCls} required placeholder="08… atau 0251-…" value={editor.phone} onChange={(e) => setEditor({ ...editor, phone: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Email
                <input className={inputCls} type="email" value={editor.email} onChange={(e) => setEditor({ ...editor, email: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                PIC / kontak
                <input className={inputCls} value={editor.pic} onChange={(e) => setEditor({ ...editor, pic: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Jam operasional
                <input className={inputCls} value={editor.hours} onChange={(e) => setEditor({ ...editor, hours: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Spesialisasi
                <input className={inputCls} placeholder="Oli, rem, AC…" value={editor.specialty} onChange={(e) => setEditor({ ...editor, specialty: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                NPWP
                <input className={inputCls} value={editor.npwp} onChange={(e) => setEditor({ ...editor, npwp: e.target.value })} />
              </label>
              <label className="sm:col-span-2 block text-xs font-semibold uppercase text-slate-500">
                Catatan kerja sama
                <textarea className={inputCls} rows={3} value={editor.notes} onChange={(e) => setEditor({ ...editor, notes: e.target.value })} />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t bg-slate-50 px-6 py-4">
              <button type="button" className="rounded-xl border bg-white px-4 py-2 text-sm" onClick={() => setEditor(null)}>
                Batal
              </button>
              <button className="rounded-xl bg-[#071526] px-6 py-2 text-sm font-semibold !text-white">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
