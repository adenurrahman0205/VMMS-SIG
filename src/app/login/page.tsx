"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

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
    r.push("/");
    r.refresh();
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden">
      <img src="/images/hero-fleet.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#071526]/75" />
      <form className="anim relative w-[420px] rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur" onSubmit={submit}>
        <div className="mb-5 flex flex-col items-center text-center">
          <img src="/images/logo-sig.png" alt="SIG" className="mb-3 h-14 w-auto object-contain" />
          <h1 className="text-2xl font-semibold tracking-tight">VMMS-SIG</h1>
          <p className="mt-1 text-sm text-slate-500">Vehicle Maintenance Management System</p>
        </div>
        <label className="text-xs text-slate-500">Email</label>
        <input className="mb-3 mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label className="text-xs text-slate-500">Password</label>
        <input type="password" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {msg && <p className="mt-3 text-sm text-amber-700">{msg}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-xl bg-[#071526] py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700" type="submit">
          {busy ? "..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
