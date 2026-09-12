"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Shell } from "@/components/shell";
import { vehicleService } from "@/lib/services/vehicle.service";

export default function NewVehicle() {
  const r = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    vehicle_code: "",
    plate_number: "",
    brand: "",
    model: "",
    year: "2022",
    current_odometer: "0",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      await vehicleService.create({
        vehicle_code: f.vehicle_code,
        plate_number: f.plate_number.toUpperCase(),
        brand: f.brand,
        model: f.model,
        year: Number(f.year) || undefined,
        current_odometer: Number(f.current_odometer) || 0,
      });
      r.push("/kendaraan");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal simpan. Login sebagai Fleet Admin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="Tambah Kendaraan">
      <Card className="max-w-xl">
        <form className="grid gap-3" onSubmit={submit}>
          {(["vehicle_code", "plate_number", "brand", "model", "year", "current_odometer"] as const).map((k) => (
            <label key={k} className="text-xs text-slate-600">
              {k.replaceAll("_", " ")}
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={f[k]}
                onChange={(e) => setF({ ...f, [k]: e.target.value })}
                required={k !== "year"}
              />
            </label>
          ))}
          {msg && <p className="text-sm text-red-600">{msg}</p>}
          <button disabled={busy} className="rounded-lg bg-[#2f80ed] py-2 text-sm font-semibold text-white">
            {busy ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </Card>
    </Shell>
  );
}
