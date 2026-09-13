"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { cacheUser } from "@/lib/services/profile.service";
import { blankUser } from "@/lib/user-store";

export default function Register() {
  const r = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dept, setDept] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (password !== confirm) {
      setMsg("Konfirmasi password tidak sama.");
      return;
    }
    const sb = createBrowserSupabase();
    setBusy(true);
    try {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { name, phone, dept, jabatan, role: "USER" } },
      });
      if (error) {
        setBusy(false);
        setMsg(error.message);
        return;
      }
      const row = {
        ...blankUser(),
        id: data.user?.id || `u${Date.now()}`,
        name,
        email,
        phone,
        dept,
        jabatan,
        role: "USER" as const,
        active: true,
      };
      cacheUser(row);
      setBusy(false);
      if (!data.session) {
        setMsg("Akun USER dibuat. Cek email untuk konfirmasi, lalu masuk.");
        return;
      }
      r.push("/user");
      r.refresh();
    } catch (err) {
      setBusy(false);
      setMsg(err instanceof Error ? err.message : "Gagal registrasi.");
    }
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-8">
      <img src="/images/hero-fleet.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#071526]/75" />
      <form className="anim relative w-full max-w-[480px] rounded-3xl bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8" onSubmit={submit}>
        <div className="mb-5 flex flex-col items-center text-center">
          <img src="/images/logo-sig.png" alt="SIG" className="mb-3 h-14 w-auto object-contain" />
          <h1 className="text-2xl font-semibold">Registrasi</h1>
          <p className="mt-1 text-sm text-slate-500">Akun baru otomatis role User — pengajuan pemakaian & work order.</p>
        </div>
        <label className="text-xs text-slate-500">Nama lengkap</label>
        <input className="mb-3 mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" required value={name} onChange={(e) => setName(e.target.value)} />
        <label className="text-xs text-slate-500">Email</label>
        <input className="mb-3 mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="text-xs text-slate-500">
            Telepon
            <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="text-xs text-slate-500">
            Divisi
            <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" value={dept} onChange={(e) => setDept(e.target.value)} />
          </label>
        </div>
        <label className="text-xs text-slate-500">Jabatan</label>
        <input className="mb-3 mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" value={jabatan} onChange={(e) => setJabatan(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-slate-500">
            Password
            <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="text-xs text-slate-500">
            Konfirmasi
            <input className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
        </div>
        {msg && <p className="mt-3 text-sm text-amber-700">{msg}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-xl bg-[#071526] py-2.5 text-sm font-semibold text-white" type="submit">
          {busy ? "..." : "Daftar sebagai User"}
        </button>
        <Link href="/login" className="mt-3 block text-center text-sm font-semibold text-sky-700">
          Sudah punya akun? Masuk
        </Link>
      </form>
    </div>
  );
}
