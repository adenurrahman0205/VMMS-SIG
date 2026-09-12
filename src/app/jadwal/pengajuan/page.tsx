"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PengajuanRedirect() {
  const r = useRouter();
  useEffect(() => {
    r.replace("/jadwal");
  }, [r]);
  return null;
}
