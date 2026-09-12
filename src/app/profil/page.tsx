"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { loadUsers, saveUsers, type AppUser } from "@/lib/user-store";

const inputCls =
  "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white";

export default function ProfilPage() {
  const [me, setMe] = useState<AppUser | null>(null);
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    (async () => {
      const sb = createBrowserSupabase();
      const { data } = await sb.auth.getUser();
      const em = data.user?.email ?? "";
      setEmail(em);
      const users = loadUsers();
      const found = users.find((u) => u.email.toLowerCase() === em.toLowerCase());
      setMe(
        found ?? {
          id: data.user?.id ?? "me",
          name: data.user?.user_metadata?.name || em.split("@")[0] || "Pengguna",
          email: em,
          phone: "",
          dept: "",
          jabatan: "",
          role: "USER",
          active: true,
          createdAt: new Date().toISOString().slice(0, 10),
        }
      );
    })();
  }, []);

  function onPhoto(file?: File) {
    if (!file || !me) return;
    const reader = new FileReader();
    reader.onload = () => setMe({ ...me, avatar: String(reader.result || "") });
    reader.readAsDataURL(file);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    const users = loadUsers();
    const i = users.findIndex((u) => u.email.toLowerCase() === me.email.toLowerCase());
    if (i >= 0) {
      users[i] = me;
      saveUsers(users);
    } else {
      saveUsers([me, ...users]);
    }
    setOk("Profil disimpan.");
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
      <form onSubmit={save} className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
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
        <button className="rounded-xl bg-[#071526] px-6 py-2.5 text-sm font-semibold !text-white">Simpan profil</button>
      </form>
    </Shell>
  );
}
