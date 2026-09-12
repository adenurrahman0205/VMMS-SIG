"use client";

import { useRouter } from "next/navigation";

export default function Login() {
  const r = useRouter();
  return (
    <div className="grid min-h-screen place-items-center bg-[#0b1f3a]">
      <form
        className="w-[400px] rounded-2xl bg-white p-8"
        onSubmit={(e) => {
          e.preventDefault();
          r.push("/");
        }}
      >
        <h1 className="text-xl font-bold">VMMS-SIG</h1>
        <p className="mb-4 mt-1 text-sm text-slate-500">Demo login — nanti diganti Supabase Auth.</p>
        <label className="text-xs">Email</label>
        <input className="mb-3 mt-1 w-full rounded-lg border px-3 py-2 text-sm" defaultValue="ga@kantor.id" />
        <label className="text-xs">Password</label>
        <input type="password" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" defaultValue="demo123" />
        <button className="mt-4 w-full rounded-lg bg-[#2f80ed] py-2.5 text-sm font-semibold text-white">Masuk</button>
      </form>
    </div>
  );
}
