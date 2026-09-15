"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type SearchOption = { value: string; label: string };

export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih…",
  disabled,
  required,
  className,
  allowEmpty = true,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  allowEmpty?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => `${o.label} ${o.value}`.toLowerCase().includes(s));
  }, [options, q]);

  useEffect(() => {
    function hide(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  return (
    <div ref={box} className="relative mt-1 w-full">
      {required && (
        <input
          tabIndex={-1}
          required
          value={value}
          onChange={() => undefined}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          aria-hidden
        />
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
      >
        <span className={cn("min-w-0 truncate", selected ? "text-slate-800" : "text-slate-400")}>
          {selected?.label || placeholder}
        </span>
        <svg viewBox="0 0 24 24" className={cn("h-4 w-4 shrink-0 text-slate-400 transition", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && !disabled && (
        <div className="absolute z-[90] mt-1 w-full overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
          <div className="border-b px-2 py-2">
            <input
              ref={input}
              className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-sky-300"
              placeholder="Ketik untuk mencari…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-auto py-1">
            {allowEmpty && (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-50"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                {placeholder}
              </button>
            )}
            {filtered.length === 0 && <p className="px-3 py-3 text-sm text-slate-400">Tidak ada hasil</p>}
            {filtered.map((o) => (
              <button
                type="button"
                key={o.value || o.label}
                className={cn(
                  "block w-full px-3 py-2 text-left text-sm hover:bg-sky-50",
                  o.value === value && "bg-sky-50 font-semibold text-sky-800"
                )}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
