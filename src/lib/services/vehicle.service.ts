import type { Vehicle as DbVehicle } from "@/types/vehicle";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { vehicles as demo, type Vehicle as DemoVehicle } from "@/lib/data";

export const vehicleService = {
  async listFromDb(): Promise<DbVehicle[]> {
    const sb = createBrowserSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from("vehicles").select("*").eq("active", true).order("plate_number");
    if (error) throw error;
    return (data ?? []) as DbVehicle[];
  },

  async create(input: {
    vehicle_code: string;
    plate_number: string;
    brand: string;
    model: string;
    year?: number;
    current_odometer?: number;
  }) {
    const sb = createBrowserSupabase();
    if (!sb) throw new Error("Supabase not configured");
    const { error } = await sb.from("vehicles").insert({
      ...input,
      status: "READY",
      active: true,
      initial_odometer: input.current_odometer ?? 0,
    });
    if (error) throw error;
  },

  /** Live DB if rows exist; otherwise demo dataset so UI tetap jalan. */
  async listForUi(): Promise<{ source: "supabase" | "demo"; rows: DemoVehicle[] }> {
    try {
      const live = await this.listFromDb();
      if (live.length) {
        return {
          source: "supabase",
          rows: live.map((v) => ({
            id: v.id,
            plate: v.plate_number,
            brand: v.brand,
            model: v.model,
            year: v.year ?? 0,
            km: v.current_odometer,
            dept: "—",
            driver: "—",
            status: mapStatus(v.status),
            color: v.color ?? "",
            engine: v.engine_number ?? "",
            chassis: v.chassis_number ?? "",
            loc: "",
            health: 80,
            buyDate: v.purchase_date ?? "",
            buyPrice: Number(v.purchase_price ?? 0),
            owner: "—",
            address: "—",
            fuel: "—",
            cc: "—",
            hp: "—",
            madeYear: v.year ?? 0,
            bbmNo: "0000-0000-0000-0000",
            bbmImage: "",
          })),
        };
      }
    } catch {
      /* RLS / missing table */
    }
    return { source: "demo", rows: demo };
  },
};

function mapStatus(s: string): DemoVehicle["status"] {
  const u = s.toLowerCase();
  if (u === "warning") return "warning";
  if (u === "maintenance") return "maintenance";
  if (u === "inactive" || u === "sold") return "inactive";
  return "ready";
}
