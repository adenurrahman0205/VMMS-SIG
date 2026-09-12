"use client";

import { useState } from "react";
import type { Vehicle } from "@/lib/data";
import { statuses } from "@/lib/fleet-store";

const fields: { key: keyof Vehicle; label: string; type?: string }[] = [
  { key: "plate", label: "Nomor plat" },
  { key: "brand", label: "Merk" },
  { key: "model", label: "Model" },
  { key: "year", label: "Tahun", type: "number" },
  { key: "madeYear", label: "Tahun pembuatan", type: "number" },
  { key: "color", label: "Warna" },
  { key: "km", label: "Kilometer", type: "number" },
  { key: "fuel", label: "Bahan bakar" },
  { key: "cc", label: "Isi silinder" },
  { key: "hp", label: "HP" },
  { key: "engine", label: "No. mesin" },
  { key: "chassis", label: "No. rangka" },
  { key: "owner", label: "Nama pemilik" },
  { key: "address", label: "Alamat" },
  { key: "driver", label: "Driver" },
  { key: "dept", label: "Departemen" },
  { key: "loc", label: "Lokasi / pool" },
  { key: "buyDate", label: "Tanggal pembelian" },
  { key: "bbmNo", label: "No. kartu BBM" },
  { key: "health", label: "Health 0–100", type: "number" },
];

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
    const num = ["year", "madeYear", "km", "health", "buyPrice"].includes(k);
    setForm({ ...form, [k]: num ? Number(val) || 0 : val });
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#071526]/70 backdrop-blur-sm" />
      <form
        className="anim relative max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-slate-500">
            Tutup
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <label key={String(f.key)} className="text-xs text-slate-500">
              {f.label}
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm text-slate-800"
                value={String(form[f.key] ?? "")}
                type={f.type ?? "text"}
                onChange={(e) => set(f.key, e.target.value)}
                required={f.key === "plate" || f.key === "brand" || f.key === "model"}
              />
            </label>
          ))}
          <label className="text-xs text-slate-500">
            Status
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Vehicle["status"] })}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm">
            Batal
          </button>
          <button className="rounded-xl bg-[#071526] px-5 py-2 text-sm font-semibold text-white">Simpan</button>
        </div>
      </form>
    </div>
  );
}
