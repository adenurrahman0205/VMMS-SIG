"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserPortalRemoved() {
  const r = useRouter();
  useEffect(() => {
    r.replace("/");
  }, [r]);
  return <p className="p-8 text-sm text-slate-500">Mengalihkan…</p>;
}
