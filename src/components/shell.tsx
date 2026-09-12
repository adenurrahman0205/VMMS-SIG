"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { createBrowserSupabase } from "@/lib/supabase/client";

const groups = [
  {
    g: "Monitoring",
    items: [
      ["/", "Dashboard"],
      ["/kendaraan", "Armada"],
      ["/jadwal", "Jadwal"],
      ["/biaya", "Biaya & Analitik"],
      ["/dokumen", "Dokumen"],
      ["/maintenance", "Maintenance"],
    ],
  },
  {
    g: "Admin",
    items: [
      ["/admin/vehicles/new", "Tambah Kendaraan"],
      ["/admin/drivers", "Driver"],
      ["/admin/workshops", "Bengkel"],
      ["/admin/departments", "Departemen"],
      ["/admin/spareparts", "Sparepart"],
    ],
  },
  {
    g: "Data & Backup",
    items: [
      ["/data", "Export Data"],
      ["/backup", "Backup"],
    ],
  },
];

export function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  async function logout() {
    const sb = createBrowserSupabase();
    await sb?.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-64 flex-col bg-[#071526] text-slate-200">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-700 text-xs font-black text-white shadow-lg">
              VS
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-white">VMMS-SIG</div>
              <div className="text-[11px] text-slate-400">Fleet Control Center</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-auto p-3">
          {groups.map((s) => (
            <div key={s.g}>
              <div className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-wider text-slate-500">{s.g}</div>
              {s.items.map(([href, label]) => {
                const on = path === href;
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
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-3 text-[11px] text-slate-500">SIG · Operasional Armada</div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-7 py-3.5 backdrop-blur-md">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Vehicle Maintenance Management</p>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50">
              Login
            </Link>
            <button type="button" onClick={logout} className="text-slate-400 hover:text-slate-700">
              Keluar
            </button>
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
