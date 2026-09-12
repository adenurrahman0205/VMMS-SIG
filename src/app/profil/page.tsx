"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { cacheUser, compressAvatar, mergeLocalUser, saveProfileCloud } from "@/lib/services/profile.service";
import type { AppUser } from "@/lib/user-store";

const inputCls =
  "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white";

export default function ProfilPage() {
  const [me, setMe] = useState<AppUser | null>(null);
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState("");
  const [pwOk, setPwOk] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = createBrowserSupabase();
      const { data } = await sb.auth.getUser();
      const em = data.user?.email ?? "";
      setEmail(em);
      setMe(mergeLocalUser(em, data.user?.id ?? "me", data.user?.user_metadata as Record<string, unknown> | undefined));
    })();
  }, []);

  async function onPhoto(file?: File) {
    if (!file || !me) return;
    try {
      const avatar = await compressAvatar(file);
      setMe({ ...me, avatar });
    } catch {
      const reader = new FileReader();
      reader.onload = () => setMe({ ...me, avatar: String(reader.result || "") });
      reader.readAsDataURL(file);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setOk("");
    setBusy(true);
    cacheUser(me);
    try {
      await saveProfileCloud({
        name: me.name,
        phone: me.phone,
        dept: me.dept,
        jabatan: me.jabatan ?? "",
        avatar: me.avatar ?? "",
      });
      setOk("Profil disimpan di akun (bisa dipakai di HP dan komputer).");
    } catch (ex) {
      setOk(ex instanceof Error ? `Tersimpan di perangkat ini. Cloud: ${ex.message}` : "Tersimpan di perangkat ini saja.");
    }
    setBusy(false);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwOk("");
    setPwErr("");
    if (password.length < 6) {
      setPwErr("Password baru minimal 6 karakter.");
      return;
    }
    if (password !== confirmPw) {
      setPwErr("Konfirmasi password tidak sama.");
      return;
    }
    setPwBusy(true);
    try {
      const sb = createBrowserSupabase();
      const { error } = await sb.auth.updateUser({ password });
      setPwBusy(false);
      if (error) {
        setPwErr(error.message);
        return;
      }
      setPassword("");
      setConfirmPw("");
      setPwOk("Password berhasil diganti.");
    } catch (ex) {
      setPwBusy(false);
      setPwErr(ex instanceof Error ? ex.message : "Gagal ganti password.");
    }
  }

  if (!me) {
    return (
      <Shell title="Profil">
        <p className="text-sm text-slate-500">Memuat akun…</p>
      </Shell>
    );
  }

  const initials = me.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <Shell title="Profil">
      <div className="mx-auto grid max-w-xl gap-5">
        <form onSubmit={save} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-500">Data profil</h2>
          <div className="mb-6 flex items-center gap-4">
            {me.avatar ? (
              <img src={me.avatar} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-sky-200" />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full bg-[#071526] text-xl font-semibold text-white">{initials}</div>
            )}
            <div>
              <p className="font-semibold">{me.name || "Pengguna"}</p>
              <p className="text-sm text-slate-500">{email || me.email}</p>
              <label className="mt-2 inline-block cursor-pointer text-xs font-semibold text-sky-700">
                Unggah foto
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
              </label>
            </div>
          </div>
          <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
            Nama
            <input className={inputCls} value={me.name} onChange={(e) => setMe({ ...me, name: e.target.value })} />
          </label>
          <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
            Email
            <input className={inputCls} value={me.email} disabled />
          </label>
          <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
            Telepon
            <input className={inputCls} value={me.phone} onChange={(e) => setMe({ ...me, phone: e.target.value })} />
          </label>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Divisi
              <input className={inputCls} value={me.dept} onChange={(e) => setMe({ ...me, dept: e.target.value })} />
            </label>
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Jabatan
              <input className={inputCls} value={me.jabatan ?? ""} onChange={(e) => setMe({ ...me, jabatan: e.target.value })} />
            </label>
          </div>
          {ok && <p className="mb-3 text-sm text-emerald-700">{ok}</p>}
          <button disabled={busy} className="rounded-xl bg-[#071526] px-6 py-2.5 text-sm font-semibold !text-white">
            {busy ? "Menyimpan…" : "Simpan profil"}
          </button>
        </form>

        <form onSubmit={savePassword} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Ganti password</h2>
          <p className="mb-4 text-xs text-slate-400">Password login akun ini. Tidak disimpan di master user.</p>
          <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
            Password baru
            <div className="relative">
              <input
                className={inputCls + " pr-11"}
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Sembunyikan password" : "Lihat password"}
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  {showPw ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6M9.9 5.2A10 10 0 0 1 12 5c6 0 10 7 10 7a16 16 0 0 1-3.2 3.8M6.1 6.1C3.6 7.9 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 4.2-.9" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </label>
          <label className="mb-3 block text-xs font-semibold uppercase text-slate-500">
            Konfirmasi password
            <input
              className={inputCls}
              type={showPw ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          {pwErr && <p className="mb-3 text-sm text-amber-700">{pwErr}</p>}
          {pwOk && <p className="mb-3 text-sm text-emerald-700">{pwOk}</p>}
          <button disabled={pwBusy} className="rounded-xl bg-[#071526] px-6 py-2.5 text-sm font-semibold !text-white">
            {pwBusy ? "Menyimpan…" : "Simpan password"}
          </button>
        </form>
      </div>
    </Shell>
  );
}
