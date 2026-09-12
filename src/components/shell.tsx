"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const groups = [
  {
    g: "Monitoring",
    items: [
      ["/", "Dashboard"],
      ["/kendaraan", "Daftar Kendaraan"],
      ["/jadwal", "Jadwal"],
      ["/biaya", "Biaya & Analitik"],
      ["/dokumen", "Dokumen"],
      ["/maintenance", "Maintenance"],
    ],
  },
  {
    g: "Data & Backup",
    items: [
      ["/data", "Export Data"],
      ["/backup", "Backup Management"],
    ],
  },
];

export function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 flex-col bg-gradient-to-b from-[#0b1f3a] to-[#071426] text-slate-200">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-sm font-semibold tracking-wide text-white">VMMS-SIG</div>
          <div className="mt-1 text-[11px] text-slate-400">Vehicle Maintenance · SIG</div>
        </div>
        <nav className="flex-1 overflow-auto p-3">
          {groups.map((s) => (
            <div key={s.g}>
              <div className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-wider text-slate-400">{s.g}</div>
              {s.items.map(([href, label]) => {
                const on = path === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "mb-0.5 block rounded-lg px-3 py-2 text-[13px]",
                      on ? "bg-[#2f80ed] text-white" : "text-slate-300 hover:bg-white/5"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-3 text-xs text-slate-400">
          VMMS-SIG · Next.js · Supabase
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-7 py-3.5">
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Andi · Fleet Admin</span>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#0b1f3a] text-xs font-bold text-white">GA</div>
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
    warning: "bg-amber-50 text-amber-700",
    maintenance: "bg-red-50 text-red-700",
    inactive: "bg-slate-100 text-slate-600",
    selesai: "bg-emerald-50 text-emerald-700",
    proses: "bg-amber-50 text-amber-700",
    aktif: "bg-emerald-50 text-emerald-700",
    segera: "bg-amber-50 text-amber-700",
    SUCCESS: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold", map[status] ?? "bg-slate-100")}>
      {status}
    </span>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>{children}</div>;
}
