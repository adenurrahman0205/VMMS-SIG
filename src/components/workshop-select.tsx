"use client";

import { findWorkshop, type Workshop } from "@/lib/workshop-store";

export function WorkshopSelect({
  shops,
  value,
  workshopId,
  required,
  className,
  onPick,
}: {
  shops: Workshop[];
  value: string;
  workshopId?: string;
  required?: boolean;
  className: string;
  onPick: (w: Workshop | null) => void;
}) {
  const active = shops.filter((w) => w.active);
  const current = findWorkshop(shops, value, workshopId);
  const extra = value && !current ? value : "";
  const selected = current?.id || (extra ? "__legacy__" : "");

  return (
    <>
      <select
        className={className}
        required={required}
        value={selected}
        onChange={(e) => {
          const id = e.target.value;
          if (!id) {
            onPick(null);
            return;
          }
          if (id === "__legacy__") return;
          const w = shops.find((x) => x.id === id) || null;
          onPick(w);
        }}
      >
        <option value="">Pilih bengkel mitra</option>
        {extra && <option value="__legacy__">{extra} (tidak di master)</option>}
        {active.map((w) => (
          <option key={w.id} value={w.id}>
            {w.code} — {w.name} · {w.city || "—"}
          </option>
        ))}
        {current && !current.active && (
          <option value={current.id}>
            {current.code} — {current.name} (arsip)
          </option>
        )}
      </select>
      {current && (
        <div className="mt-2 rounded-2xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600 ring-1 ring-slate-200">
          <div className="font-semibold text-slate-800">{current.name}</div>
          <div>{current.address || current.city}</div>
          <div className="mt-0.5 text-emerald-700">{current.phone || "Telp belum diisi"}</div>
        </div>
      )}
    </>
  );
}

export function WorkshopCell({ shops, shop, workshopId }: { shops: Workshop[]; shop?: string; workshopId?: string }) {
  const w = findWorkshop(shops, shop, workshopId);
  if (!w) return <span>{shop || "—"}</span>;
  return (
    <span>
      <span className="block font-semibold">{w.name}</span>
      <span className="block font-mono text-[11px] text-slate-400">{w.code}</span>
      <span className="block text-xs text-slate-500">{w.city}</span>
    </span>
  );
}
