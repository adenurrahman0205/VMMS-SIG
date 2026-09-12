"use client";

import { useState } from "react";
import type { Vehicle } from "@/lib/data";
import { statuses } from "@/lib/fleet-store";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

export function VehicleForm({
  initial,
  title,
  onSave,
  onClose,
}: {
  initial: Vehicle;
  title: string;
  onSave: (v: Vehicle) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Vehicle>(initial);

  function set<K extends keyof Vehicle>(k: K, val: string) {
    const num = ["year", "madeYear", "km", "health", "buyPrice"].includes(String(k));
    setForm({ ...form, [k]: num ? Number(val) || 0 : val });
  }

  function onBbmFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result || "");
      setForm((f) => ({ ...f, bbmImage: data }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-md" />
      <form
        className="anim relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#071526] px-6 py-4 text-white">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300">VMMS-SIG</p>
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-sm !text-white hover:bg-white/20">
            Tutup
          </button>
        </div>

        <div className="overflow-auto px-6 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Identitas unit</p>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Nomor plat">
              <input className={inputCls} value={form.plate} onChange={(e) => set("plate", e.target.value)} required />
            </Field>
            <Field label="Merk">
              <input className={inputCls} value={form.brand} onChange={(e) => set("brand", e.target.value)} required />
            </Field>
            <Field label="Model">
              <input className={inputCls} value={form.model} onChange={(e) => set("model", e.target.value)} required />
            </Field>
            <Field label="Warna">
              <input className={inputCls} value={form.color} onChange={(e) => set("color", e.target.value)} />
            </Field>
            <Field label="Tahun mobil">
              <input className={inputCls} type="number" value={form.year} onChange={(e) => set("year", e.target.value)} />
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Vehicle["status"] })}>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Mesin & spek</p>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Kilometer">
              <input className={inputCls} type="number" value={form.km} onChange={(e) => set("km", e.target.value)} />
            </Field>
            <Field label="Bahan bakar">
              <input className={inputCls} value={form.fuel} onChange={(e) => set("fuel", e.target.value)} />
            </Field>
            <Field label="Isi silinder">
              <input className={inputCls} value={form.cc} onChange={(e) => set("cc", e.target.value)} />
            </Field>
            <Field label="Tenaga (HP)">
              <input className={inputCls} value={form.hp} onChange={(e) => set("hp", e.target.value)} />
            </Field>
            <Field label="No. mesin">
              <input className={inputCls} value={form.engine} onChange={(e) => set("engine", e.target.value)} />
            </Field>
            <Field label="No. rangka">
              <input className={inputCls} value={form.chassis} onChange={(e) => set("chassis", e.target.value)} />
            </Field>
            <Field label="Tahun pembuatan">
              <input className={inputCls} type="number" value={form.madeYear} onChange={(e) => set("madeYear", e.target.value)} />
            </Field>
            <Field label="Tanggal pembelian">
              <input className={inputCls} type="date" value={form.buyDate} onChange={(e) => set("buyDate", e.target.value)} />
            </Field>
            <Field label="Health 0–100">
              <input className={inputCls} type="number" value={form.health} onChange={(e) => set("health", e.target.value)} />
            </Field>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Pemilik & penugasan</p>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nama pemilik">
              <input className={inputCls} value={form.owner} onChange={(e) => set("owner", e.target.value)} />
            </Field>
            <Field label="Driver">
              <input className={inputCls} value={form.driver} onChange={(e) => set("driver", e.target.value)} />
            </Field>
            <Field label="Departemen">
              <input className={inputCls} value={form.dept} onChange={(e) => set("dept", e.target.value)} />
            </Field>
            <Field label="Lokasi / pool">
              <input className={inputCls} value={form.loc} onChange={(e) => set("loc", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Alamat">
                <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} />
              </Field>
            </div>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Kartu BBM</p>
          <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
            <div className="flex items-center justify-center rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <img
                src={form.bbmImage || "/images/bbm-qr.png"}
                alt="QR BBM"
                className="h-48 w-48 object-contain"
              />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-sm text-slate-600">Unggah QR kartu BBM (seperti Pertamina). Default memakai template QR.</p>
              <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#071526] px-4 py-2.5 text-sm font-semibold !text-white">
                Pilih gambar kartu
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onBbmFile(e.target.files?.[0])} />
              </label>
              {form.bbmImage && (
                <button type="button" className="mt-2 text-xs text-red-600" onClick={() => setForm({ ...form, bbmImage: "" })}>
                  Hapus gambar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
            Batal
          </button>
          <button className="rounded-xl bg-[#071526] px-6 py-2 text-sm font-semibold !text-white">Simpan</button>
        </div>
      </form>
    </div>
  );
}
