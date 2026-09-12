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

function Icon({ d, extra }: { d: string; extra?: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
      {extra}
    </svg>
  );
}

function NavIcon({ href }: { href: string }) {
  switch (href) {
    case "/":
      return <Icon d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />;
    case "/kendaraan":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 13h18l-1.5-5.5A2 2 0 0 0 17.6 6H6.4a2 2 0 0 0-1.9 1.5L3 13Z" />
          <path d="M5 17h.01M19 17h.01M5 13v4a1 1 0 0 0 1 1h1a2 2 0 1 1 4 0h2a2 2 0 1 1 4 0h1a1 1 0 0 0 1-1v-4" />
        </svg>
      );
    case "/jadwal":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case "/maintenance":
      return <Icon d="M14.7 6.3a4.5 4.5 0 0 0-6.4 6.4L3 18v3h3l5.3-5.3a4.5 4.5 0 0 0 6.4-6.4L15 12l-3-3 2.7-2.7Z" />;
    case "/biaya":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19V5M4 19h16" />
          <path d="M8 16v-5M12 16V8M16 16v-8" />
        </svg>
      );
    case "/dokumen":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3h8l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M15 3v5h5M9 13h6M9 17h6" />
        </svg>
      );
    case "/admin/workshops":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21V9l9-6 9 6v12" />
          <path d="M9 21v-8h6v8" />
        </svg>
      );
    case "/admin/spareparts":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3 5.6 18.4" />
        </svg>
      );
    case "/admin/users":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9.5" cy="7.5" r="3.5" />
          <path d="M20 21v-2a3.5 3.5 0 0 0-2.5-3.3M16 4.1a3.5 3.5 0 0 1 0 6.8" />
        </svg>
      );
    case "/profil":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20a8 8 0 0 1 16 0" />
        </svg>
      );
    case "/data":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="6" rx="8" ry="3" />
          <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </svg>
      );
    default:
      return <Icon d="M4 12h16" />;
  }
}

export function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Pengguna");
  const [avatar, setAvatar] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    setNavOpen(false);
    setMenu(false);
  }, [path]);

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
    <div className="flex min-h-dvh">
      {navOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col bg-[#071526] text-slate-200 transition-transform duration-200 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:w-64 lg:max-w-none lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <img src="/images/logo-sig-white.png" alt="SIG" className="h-10 w-auto object-contain" />
            <div>
              <div className="text-sm font-semibold tracking-wide text-white">VMMS-SIG</div>
              <div className="text-[11px] leading-snug text-slate-400">Vehicle Maintenance Management System</div>
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
                onClick={() => setNavOpen(false)}
                className={cn(
                  "nav-link mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] active:scale-[0.99]",
                  on ? "bg-sky-500 text-white shadow-md shadow-sky-500/20" : "text-slate-300 hover:bg-white/5"
                )}
              >
                <NavIcon href={href} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5 text-left text-[13px] font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 px-3 py-3 backdrop-blur-md sm:px-7 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
              onClick={() => setNavOpen(true)}
              aria-label="Buka menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="hidden text-[11px] uppercase tracking-wider text-slate-400 sm:block">Vehicle Maintenance Management</p>
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
            </div>
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
