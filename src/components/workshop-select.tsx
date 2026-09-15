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
      <SearchSelect
        className={className}
        required={required}
        placeholder="Pilih bengkel mitra"
        value={selected}
        onChange={(id: string) => {
          if (!id) {
            onPick(null);
            return;
          }
          if (id === "__legacy__") return;
          const w = shops.find((x) => x.id === id) || null;
          onPick(w);
        }}
        options={[
          ...(extra ? [{ value: "__legacy__", label: `${extra} (tidak di master)` }] : []),
          ...active.map((w) => ({ value: w.id, label: `${w.code} — ${w.name} · ${w.city || "—"}` })),
          ...(current && !current.active
            ? [{ value: current.id, label: `${current.code} — ${current.name} (arsip)` }]
            : []),
        ]}
      />
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
