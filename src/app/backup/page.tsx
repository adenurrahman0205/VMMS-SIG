"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BackupRedirect() {
  const r = useRouter();
  useEffect(() => {
    r.replace("/data");
  }, [r]);
  return null;
}
