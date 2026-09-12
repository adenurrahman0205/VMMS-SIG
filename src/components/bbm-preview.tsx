"use client";

import { useState } from "react";

export function BbmPreview({
  src,
  caption = "QR BBM operasional SIG",
  size = "md",
}: {
  src?: string;
  caption?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const image = src || "/images/bbm-qr.png";
  const box = size === "lg" ? "h-52 w-52" : size === "sm" ? "h-36 w-36" : "h-44 w-44";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200 transition hover:ring-sky-400"
      >
        <img src={image} alt={caption} className={`mx-auto ${box} object-contain`} />
        <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">{caption}</div>
        <div className="mt-0.5 text-[10px] text-sky-600">Klik untuk perbesar</div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-[#071526]/80 backdrop-blur-sm" />
          <div
            className="anim relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
            >
              Tutup
            </button>
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Preview QR
            </p>
            <img src={image} alt={caption} className="mx-auto max-h-[70vh] w-full object-contain" />
            <p className="mt-3 text-center text-sm text-slate-500">{caption}</p>
          </div>
        </div>
      )}
    </>
  );
}
