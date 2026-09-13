"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { cacheUser } from "@/lib/services/profile.service";
import { blankUser, loadUsers } from "@/lib/user-store";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function strongPw(pw: string) {
  return {
    len: pw.length >= 8,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    num: /\d/.test(pw),
    spec: /[^A-Za-z0-9]/.test(pw),
  };
}

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
  const [showPw, setShowPw] = useState(false);

  const chk = useMemo(() => strongPw(password), [password]);
  const okPw = chk.len && chk.lower && chk.upper && chk.num && chk.spec;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const em = email.trim().toLowerCase();
    if (loadUsers().some((u) => u.email.toLowerCase() === em)) {
      setMsg("Email sudah terdaftar. Gunakan email lain atau masuk.");
      return;
    }
    if (!okPw) {
      setMsg("Password belum kuat. Minimal 8 karakter, huruf besar, huruf kecil, angka, dan simbol.");
      return;
    }
    if (password !== confirm) {
      setMsg("Konfirmasi password tidak sama.");
      return;
    }
    const sb = createBrowserSupabase();
    setBusy(true);
    try {
      const { data, error } = await sb.auth.signUp({
        email: em,
        password,
        options: { data: { name, phone, dept, jabatan, role: "USER" } },
      });
      if (error) {
        setBusy(false);
        const t = error.message.toLowerCase();
        setMsg(t.includes("already") || t.includes("registered") || t.includes("exists") ? "Email sudah terdaftar. Gunakan email lain atau masuk." : error.message);
        return;
      }
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setBusy(false);
        setMsg("Email sudah terdaftar. Gunakan email lain atau masuk.");
        return;
      }
      const row = {
        ...blankUser(),
        id: data.user?.id || `u${Date.now()}`,
        name,
        email: em,
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

  const inp = "w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm";

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-8">
      <img src="/images/hero-fleet.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#071526]/75" />
      <form className="anim relative w-full max-w-[480px] rounded-3xl bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8" onSubmit={submit}>
        <div className="mb-5 flex flex-col items-center text-center">
          <img src="/images/logo-sig.png" alt="SIG" className="mb-3 h-14 w-auto object-contain" />
          <h1 className="text-2xl font-semibold">Registrasi</h1>
          <p className="mt-1 text-sm text-slate-500">Akun baru otomatis role User.</p>
        </div>

        <label className="text-xs text-slate-500">Nama lengkap</label>
        <div className="relative mb-3 mt-1">
          <Icon d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM4 20a8 8 0 0 1 16 0" />
          <input className={inp} required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <label className="text-xs text-slate-500">Email</label>
        <div className="relative mb-3 mt-1">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 7 8 6 8-6" />
          </svg>
          <input className={inp} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500">Telepon</label>
            <div className="relative mt-1">
              <Icon d="M6.5 4h3l1.5 4-2 1.2a12 12 0 0 0 6 6L16.2 13.7l4 1.5v3A2 2 0 0 1 18.2 20 16 16 0 0 1 4 5.8 2 2 0 0 1 6.5 4Z" />
              <input className={inp} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Divisi</label>
            <div className="relative mt-1">
              <Icon d="M3 21V9l9-6 9 6v12M9 21v-8h6v8" />
              <input className={inp} value={dept} onChange={(e) => setDept(e.target.value)} />
            </div>
          </div>
        </div>
        <label className="text-xs text-slate-500">Jabatan</label>
        <div className="relative mb-3 mt-1">
          <Icon d="M8 21V10M16 21V10M4 10h16M6 10V7l6-3 6 3v3" />
          <input className={inp} value={jabatan} onChange={(e) => setJabatan(e.target.value)} />
        </div>
        <label className="text-xs text-slate-500">Password</label>
        <div className="relative mt-1">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <input className="w-full rounded-xl border py-2.5 pl-10 pr-11 text-sm" type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowPw((v) => !v)}>
            {showPw ? "Sembunyi" : "Lihat"}
          </button>
        </div>
        <ul className="mt-2 mb-3 grid grid-cols-2 gap-x-2 text-[11px]">
          {[
            [chk.len, "Min. 8 karakter"],
            [chk.upper, "Huruf besar"],
            [chk.lower, "Huruf kecil"],
            [chk.num, "Angka"],
            [chk.spec, "Simbol (!@#…)"],
          ].map(([ok, label]) => (
            <li key={String(label)} className={ok ? "text-emerald-600" : "text-slate-400"}>
              {ok ? "✓" : "○"} {label}
            </li>
          ))}
        </ul>
        <label className="text-xs text-slate-500">Konfirmasi password</label>
        <div className="relative mt-1">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <input className={inp} type={showPw ? "text" : "password"} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {msg && <p className="mt-3 text-sm text-amber-700">{msg}</p>}
        <button disabled={busy} className="btn-pop mt-5 w-full rounded-xl bg-sky-500 py-2.5 text-sm font-semibold !text-white shadow-md shadow-sky-500/30 hover:bg-sky-600" type="submit">
          {busy ? "..." : "Daftar sebagai User"}
        </button>
        <Link href="/login" className="mt-3 block text-center text-sm font-semibold text-sky-700 hover:underline">
          Sudah punya akun? Masuk
        </Link>
      </form>
    </div>
  );
}
