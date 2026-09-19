"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function JadwalRemoved() {
  const r = useRouter();
  useEffect(() => {
    r.replace("/maintenance");
  }, [r]);
  return <p className="p-8 text-sm text-slate-500">Mengalihkan ke Maintenance…</p>;
}
