"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { forceLogout, IDLE_MS, idleMs, onForcedLogout, touchActivity, WARN_MS } from "@/lib/idle-session";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function IdleGuard() {
  const router = useRouter();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    touchActivity();
    let hiddenAt = 0;
    let locking = false;

    const bump = () => {
      touchActivity();
      setLeft(null);
    };

    const events = ["pointerdown", "keydown", "touchstart", "scroll", "mousemove"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    async function lock(reason: "idle" | "remote") {
      if (locking) return;
      locking = true;
      await forceLogout();
      router.replace(reason === "idle" ? "/login?idle=1" : "/login");
      router.refresh();
    }

    const vis = () => {
      if (document.hidden) hiddenAt = Date.now();
      else {
        if (hiddenAt && Date.now() - hiddenAt >= IDLE_MS) void lock("idle");
        else bump();
        hiddenAt = 0;
      }
    };
    document.addEventListener("visibilitychange", vis);

    const off = onForcedLogout(() => void lock("remote"));

    const tick = window.setInterval(() => {
      const remain = IDLE_MS - idleMs();
      if (remain <= 0) {
        window.clearInterval(tick);
        void lock("idle");
        return;
      }
      if (remain <= WARN_MS) setLeft(Math.ceil(remain / 1000));
      else setLeft(null);
    }, 1000);

    const sb = createBrowserSupabase();
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && !locking) void lock("remote");
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") bump();
    });

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      document.removeEventListener("visibilitychange", vis);
      off();
      window.clearInterval(tick);
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (left == null) return null;

  return (
    <div className="fixed inset-x-0 top-3 z-[80] flex justify-center px-4 lg:pl-64">
      <div className="anim w-full max-w-md rounded-2xl bg-[#071526] px-4 py-3 text-center text-sm text-white shadow-xl ring-1 ring-white/10">
        Tidak ada aktivitas. Sesi berakhir dalam <b>{left}</b> dtk.
        <span className="mt-0.5 block text-[11px] text-slate-300">Gerakkan mouse atau sentuh layar untuk tetap masuk.</span>
      </div>
    </div>
  );
}
