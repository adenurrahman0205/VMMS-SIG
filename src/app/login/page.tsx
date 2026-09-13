"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { mergeLocalUser } from "@/lib/services/profile.service";

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const sb = createBrowserSupabase();
    setBusy(true);
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        setMsg(error.message);
        return;
      }
    } catch (err) {
      setBusy(false);
      setMsg(err instanceof Error ? err.message : "Gagal terhubung ke Supabase.");
      return;
    }
    const { data } = await sb.auth.getUser();
    const em = data.user?.email ?? email;
    const u = mergeLocalUser(em, data.user?.id ?? "", data.user?.user_metadata as Record<string, unknown> | undefined);
    r.push(u.role === "USER" ? "/user" : "/");
    r.refresh();
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-8">
      <img src="/images/hero-fleet.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#071526]/75" />
      <form className="anim relative w-full max-w-[420px] rounded-3xl bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8" onSubmit={submit}>
        <div className="mb-5 flex flex-col items-center text-center">
          <img src="/images/logo-sig.png" alt="SIG" className="mb-3 h-14 w-auto object-contain" />
          <h1 className="text-2xl font-semibold tracking-tight">VMMS-SIG</h1>
          <p className="mt-1 text-sm text-slate-500">Vehicle Maintenance Management System</p>
        </div>
        <label className="text-xs text-slate-500">Email</label>
        <div className="relative mb-3 mt-1">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 7 8 6 8-6" />
          </svg>
          <input className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <label className="text-xs text-slate-500">Password</label>
        <div className="relative mt-1">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <input
            type={showPw ? "text" : "password"}
            className="w-full rounded-xl border py-2.5 pl-10 pr-11 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Sembunyikan password" : "Lihat password"}
          >
            {showPw ? (
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6M9.9 5.2A10 10 0 0 1 12 5c6 0 10 7 10 7a16 16 0 0 1-3.2 3.8M6.1 6.1C3.6 7.9 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 4.2-.9" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-amber-700">{msg}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-xl bg-[#071526] py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700" type="submit">
          {busy ? "..." : "Masuk"}
        </button>
        <Link href="/register" className="mt-3 block w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Registrasi
        </Link>
      </form>
    </div>
  );
}
