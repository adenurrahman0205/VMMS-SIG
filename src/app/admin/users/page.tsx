"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Shell } from "@/components/shell";
import { blankUser, loadUsers, saveUsers, type AppRole, type AppUser } from "@/lib/user-store";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { compressAvatar, mergeLocalUser } from "@/lib/services/profile.service";
import { hydrateCloud } from "@/lib/services/sync.service";
import { SearchSelect } from "@/components/search-select";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function formatRegistered(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const inputCls =
  "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

export default function UsersPage() {
  const [rows, setRows] = useState<AppUser[]>([]);
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editor, setEditor] = useState<AppUser | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [formMsg, setFormMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [isSuper, setIsSuper] = useState(false);
  const [pendingDel, setPendingDel] = useState<AppUser | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [delMsg, setDelMsg] = useState("");

  useEffect(() => {
    (async () => {
      await hydrateCloud();
      setRows(loadUsers());
      const sb = createBrowserSupabase();
      const { data } = await sb.auth.getUser();
      const em = data.user?.email ?? "";
      const me = mergeLocalUser(em, data.user?.id ?? "", data.user?.user_metadata as Record<string, unknown> | undefined);
      setIsSuper(me.role === "SUPER_ADMIN");
    })();
  }, []);

  function persist(next: AppUser[]) {
    saveUsers(next);
    setRows(next);
  }

  const list = useMemo(() => {
    return rows.filter((u) => {
      const hit = `${u.name} ${u.email} ${u.dept} ${u.jabatan ?? ""} ${u.role}`.toLowerCase().includes(q.toLowerCase());
      return hit && (showArchived || u.active);
    });
  }, [rows, q, showArchived]);

  const nActive = rows.filter((u) => u.active).length;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    if (!isSuper) {
      setFormMsg("Hanya SUPER_ADMIN yang boleh mengubah akun.");
      return;
    }
    setFormMsg("");
    if (isNew || password || confirmPw) {
      if (password.length < 6) {
        setFormMsg("Password minimal 6 karakter.");
        return;
      }
      if (password !== confirmPw) {
        setFormMsg("Konfirmasi password tidak sama.");
        return;
      }
    }
    setBusy(true);
    try {
      const sb = createBrowserSupabase();
      const { data: prev } = await sb.auth.getSession();
      const self = prev.session?.user?.email?.toLowerCase() === editor.email.toLowerCase();
      if (isNew && password) {
        const { error } = await sb.auth.signUp({ email: editor.email, password });
        if (error) setFormMsg(error.message);
        if (prev.session) await sb.auth.setSession(prev.session);
      } else if (!isNew && password) {
        if (self) {
          const { error } = await sb.auth.updateUser({ password });
          if (error) {
            setBusy(false);
            setFormMsg(error.message);
            return;
          }
        } else {
          setBusy(false);
          setFormMsg("Password akun lain hanya bisa diganti oleh pemilik di halaman Profil (Auth tidak mengizinkan ganti password user lain dari browser).");
          return;
        }
      }
    } catch (err) {
      setBusy(false);
      setFormMsg(err instanceof Error ? err.message : "Gagal mengubah password login.");
      return;
    }
    const exists = rows.some((u) => u.id === editor.id);
    persist(exists ? rows.map((u) => (u.id === editor.id ? editor : u)) : [editor, ...rows]);
    setBusy(false);
    setEditor(null);
    setPassword("");
    setConfirmPw("");
    setIsNew(false);
  }

  function waHref(phone: string) {
    const d = phone.replace(/\D/g, "");
    if (!d) return "";
    const n = d.startsWith("0") ? `62${d.slice(1)}` : d;
    return `https://wa.me/${n}`;
  }

  function askRemove(u: AppUser) {
    if (!isSuper) return;
    setDelMsg("");
    setPendingDel(u);
  }

  async function confirmRemove() {
    const u = pendingDel;
    if (!u || !isSuper) return;
    setDelBusy(true);
    setDelMsg("");
    try {
      const res = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: u.email }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; warning?: string };
      if (!res.ok || !json.ok) {
        setDelBusy(false);
        setDelMsg(json.error || "Gagal hapus akun.");
        return;
      }
      persist(rows.filter((x) => x.id !== u.id && x.email.toLowerCase() !== u.email.toLowerCase()));
      setDelBusy(false);
      setPendingDel(null);
    } catch {
      setDelBusy(false);
      setDelMsg("Gagal terhubung ke server. Coba lagi.");
    }
  }

  function restore(u: AppUser) {
    if (!isSuper) return;
    persist(rows.map((x) => (x.id === u.id ? { ...x, active: true } : x)));
  }

  return (
    <Shell title="User">
      <section className="anim relative mb-6 overflow-hidden rounded-3xl">
        <img src="/images/hero-fleet.png" alt="" className="h-36 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071526] via-[#071526]/80 to-transparent" />
        <div className="absolute inset-0 flex items-end justify-between p-6 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-sky-300">Access control</p>
            <h2 className="text-2xl font-semibold">Pengguna aplikasi</h2>
            <p className="text-sm text-slate-300">
              {nActive} user aktif · {isSuper ? "Ubah/Hapus hanya SUPER_ADMIN" : "lihat saja"}
            </p>
          </div>
          {isSuper && (
          <button
            type="button"
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold !text-white"
            onClick={() => {
              setIsNew(true);
              setPassword("");
              setConfirmPw("");
              setFormMsg("");
              setEditor(blankUser());
            }}
          >
            + User baru
          </button>
          )}
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center rounded-2xl border bg-white px-3 py-2">
          <span className="mr-2 text-slate-400">⌕</span>
          <input className="w-full text-sm outline-none" placeholder="Cari nama, email, role…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button
          type="button"
          onClick={() => setShowArchived(!showArchived)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            showArchived ? "bg-[#071526] !text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
          }`}
        >
          {showArchived ? "Termasuk arsip" : "Hanya aktif"}
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {["Nama", "Email", "Divisi", "Jabatan", "Role", "Terdaftar", "Status", ""].map((h) => (
                  <th key={h || "x"} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">Belum ada user.</td>
                </tr>
              )}
              {list.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200" />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#071526] text-[11px] font-semibold text-white">{initials(u.name)}</span>
                      )}
                      <div className="min-w-0">
                    <div className="font-semibold">{u.name}</div>
                    {u.phone ? (
                      <a
                        href={waHref(u.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        {u.phone}
                      </a>
                    ) : (
                      <div className="text-xs text-slate-400">—</div>
                    )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.dept || "—"}</td>
                  <td className="px-4 py-3">{u.jabatan || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={u.active ? "aktif" : "inactive"} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isSuper ? (
                      <>
                        <button className="mr-3 text-xs font-semibold text-sky-700" onClick={() => { setIsNew(false); setFormMsg(""); setEditor(u); }}>Ubah</button>
                        {!u.active && (
                          <button className="mr-3 text-xs font-semibold text-emerald-700" onClick={() => restore(u)}>Pulihkan</button>
                        )}
                        <button className="text-xs font-semibold text-red-600" onClick={() => askRemove(u)}>Hapus</button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pendingDel && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => !delBusy && setPendingDel(null)}>
          <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-sm" />
          <div
            className="anim relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#071526] px-6 py-4 text-white">
              <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300">VMMS-SIG</p>
              <h2 className="text-lg font-semibold">Hapus akun?</h2>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                {pendingDel.avatar ? (
                  <img src={pendingDel.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#071526] text-xs font-semibold text-white">
                    {initials(pendingDel.name)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{pendingDel.name}</p>
                  <p className="truncate text-sm text-slate-500">{pendingDel.email}</p>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">{pendingDel.role}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                Akun ini akan dihapus permanen dari daftar pengguna. Login ikut dihapus dan tidak bisa masuk lagi.
              </p>
              {delMsg && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{delMsg}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t bg-slate-50 px-6 py-4">
              <button type="button" disabled={delBusy} className="rounded-xl border bg-white px-4 py-2 text-sm" onClick={() => setPendingDel(null)}>
                Batal
              </button>
              <button
                type="button"
                disabled={delBusy}
                className="rounded-xl bg-red-600 px-6 py-2 text-sm font-semibold !text-white disabled:opacity-60"
                onClick={() => void confirmRemove()}
              >
                {delBusy ? "Menghapus…" : "Hapus akun"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editor && isSuper && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setEditor(null)}>
          <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-sm" />
          <form
            className="anim relative max-h-[94vh] w-full max-w-lg overflow-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={save}
          >
            <div className="flex items-center justify-between bg-[#071526] px-6 py-4 text-white">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300">VMMS-SIG</p>
                <h2 className="text-lg font-semibold">{rows.some((x) => x.id === editor.id) ? "Ubah user" : "User baru"}</h2>
              </div>
              <button type="button" className="rounded-full bg-white/10 px-3 py-1 text-sm !text-white" onClick={() => setEditor(null)}>
                Tutup
              </button>
            </div>
            <div className="space-y-3 p-6">
              <div className="flex items-center gap-4">
                {editor.avatar ? (
                  <img src={editor.avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-1 ring-slate-200" />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-[#071526] text-sm font-semibold text-white">{initials(editor.name)}</span>
                )}
                <div>
                  <label className="inline-flex cursor-pointer rounded-xl bg-[#071526] px-3 py-2 text-xs font-semibold !text-white">
                    Pilih foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const avatar = await compressAvatar(file);
                          setEditor({ ...editor, avatar });
                        } catch {
                          /* ignore */
                        }
                      }}
                    />
                  </label>
                  {editor.avatar && (
                    <button type="button" className="ml-3 text-xs font-semibold text-red-600" onClick={() => setEditor({ ...editor, avatar: "" })}>
                      Hapus foto
                    </button>
                  )}
                </div>
              </div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Nama
                <input className={inputCls} required value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Email
                <input className={inputCls} type="email" required value={editor.email} onChange={(e) => setEditor({ ...editor, email: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  {isNew ? "Password" : "Password baru"}
                  <input
                    className={inputCls}
                    type="password"
                    required={isNew}
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isNew ? "" : "Kosongkan jika tidak diganti"}
                    autoComplete="new-password"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Konfirmasi password
                  <input
                    className={inputCls}
                    type="password"
                    required={isNew}
                    minLength={6}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder={isNew ? "" : "Ulangi password baru"}
                    autoComplete="new-password"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Telepon
                  <input className={inputCls} value={editor.phone} onChange={(e) => setEditor({ ...editor, phone: e.target.value })} />
                </label>
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Divisi
                  <input className={inputCls} value={editor.dept} onChange={(e) => setEditor({ ...editor, dept: e.target.value })} />
                </label>
              </div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Jabatan
                <input className={inputCls} value={editor.jabatan ?? ""} onChange={(e) => setEditor({ ...editor, jabatan: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Role
                <SearchSelect
                  allowEmpty={false}
                  value={editor.role}
                  onChange={(v) => setEditor({ ...editor, role: v as AppRole })}
                  options={[
                    { value: "USER", label: "USER" },
                    { value: "SUPER_ADMIN", label: "SUPER_ADMIN" },
                  ]}
                />
              </label>
              {formMsg && <p className="text-sm text-amber-700">{formMsg}</p>}
              <p className="text-xs text-slate-400">
                Password dipakai untuk akun login (Supabase), tidak disimpan di master user.
                {!isNew && " Ganti password akun yang sedang login bisa dari sini; akun lain ganti di halaman Profil."}
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t bg-slate-50 px-6 py-4">
              <button type="button" className="rounded-xl border bg-white px-4 py-2 text-sm" onClick={() => setEditor(null)}>Batal</button>
              <button className="rounded-xl bg-[#071526] px-6 py-2 text-sm font-semibold !text-white">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
