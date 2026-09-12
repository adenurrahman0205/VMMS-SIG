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
    if (!sb) {
      setMsg("Supabase env belum terpasang.");
      return;
    }
    setBusy(true);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    r.push("/");
    r.refresh();
  }

  async function signUp() {
    setMsg("");
    const sb = createBrowserSupabase();
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.auth.signUp({ email, password });
    setBusy(false);
    if (error) setMsg(error.message);
    else setMsg("Akun dibuat. Jika email confirmation aktif, buka inbox lalu login.");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#0b1f3a]">
      <form className="w-[400px] rounded-2xl bg-white p-8" onSubmit={submit}>
        <h1 className="text-xl font-bold">VMMS-SIG</h1>
        <p className="mb-4 mt-1 text-sm text-slate-500">Masuk dengan Supabase Auth.</p>
        <label className="text-xs">Email</label>
        <input className="mb-3 mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label className="text-xs">Password</label>
        <input type="password" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {msg && <p className="mt-3 text-sm text-amber-700">{msg}</p>}
        <button disabled={busy} className="mt-4 w-full rounded-lg bg-[#2f80ed] py-2.5 text-sm font-semibold text-white" type="submit">
          {busy ? "..." : "Masuk"}
        </button>
        <button type="button" disabled={busy} onClick={signUp} className="mt-2 w-full rounded-lg border py-2 text-sm">
          Daftar akun baru
        </button>
      </form>
    </div>
  );
}
