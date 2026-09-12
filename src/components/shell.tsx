"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { loadUsers } from "@/lib/user-store";

const items: [string, string][] = [
  ["/", "Dashboard"],
  ["/kendaraan", "Armada"],
  ["/jadwal", "Jadwal"],
  ["/maintenance", "Maintenance"],
  ["/biaya", "Biaya & Analitik"],
  ["/dokumen", "Dokumen"],
  ["/admin/workshops", "Bengkel"],
  ["/admin/spareparts", "Sparepart"],
  ["/admin/users", "User"],
  ["/profil", "Profil"],
  ["/data", "Data & Backup"],
];

export function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [displayName, setDisplayName] = useState("Pengguna");
  const [avatar, setAvatar] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      const sb = createBrowserSupabase();
      const { data } = await sb.auth.getUser();
      const em = data.user?.email ?? "";
      setEmail(em);
      const u = loadUsers().find((x) => x.email.toLowerCase() === em.toLowerCase());
      setDisplayName(u?.name || data.user?.user_metadata?.name || em.split("@")[0] || "Pengguna");
      setAvatar(u?.avatar || "");
    })();
  }, [path]);

  async function logout() {
    const sb = createBrowserSupabase();
    await sb?.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = displayName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-64 flex-col bg-[#071526] text-slate-200">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <img src="/images/logo-sig.png" alt="SIG" className="h-10 w-auto object-contain" />
            <div>
              <div className="text-sm font-semibold tracking-wide text-white">VMMS-SIG</div>
              <div className="text-[11px] text-slate-400">Fleet Control Center</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-auto p-3">
          <div className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-wider text-slate-500">Monitoring</div>
          {items.map(([href, label]) => {
            const on = path === href || (href !== "/" && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "nav-link mb-0.5 block rounded-lg px-3 py-2 text-[13px]",
                  on ? "bg-sky-500 text-white shadow-md shadow-sky-500/20" : "text-slate-300 hover:bg-white/5"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-left text-[13px] font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200"
          >
            Logout
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-7 py-3.5 backdrop-blur-md">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Vehicle Maintenance Management</p>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3"
            >
              {avatar ? (
                <img src={avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#071526] text-xs font-semibold text-white">{initials}</span>
              )}
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold text-slate-800">{displayName}</span>
                <span className="block text-[11px] text-slate-400">{email || "belum login"}</span>
              </span>
            </button>
            {menu && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl bg-white py-1 shadow-xl ring-1 ring-slate-200">
                <Link href="/profil" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenu(false)}>
                  Profil
                </Link>
                <button type="button" className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50" onClick={logout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="p-7">{children}</main>
      </div>
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ready: "bg-emerald-50 text-emerald-700",
    READY: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-800",
    WARNING: "bg-amber-50 text-amber-800",
    maintenance: "bg-red-50 text-red-700",
    MAINTENANCE: "bg-red-50 text-red-700",
    inactive: "bg-slate-100 text-slate-600",
    selesai: "bg-emerald-50 text-emerald-700",
    proses: "bg-amber-50 text-amber-800",
    aktif: "bg-emerald-50 text-emerald-700",
    segera: "bg-amber-50 text-amber-800",
    SUCCESS: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize", map[status] ?? "bg-slate-100")}>
      {status}
    </span>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm", className)}>{children}</div>;
}
