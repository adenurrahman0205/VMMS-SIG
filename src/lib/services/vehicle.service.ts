import type { Vehicle } from "@/types/vehicle";
import { createBrowserClient } from "@/lib/supabase/client";

/** Service layer: UI → service → Supabase. Tidak query dari component. */
export const vehicleService = {
  async list(): Promise<Vehicle[]> {
    const sb = createBrowserClient();
    if (!sb) return [];
    const { data, error } = await sb.from("vehicles").select("*").eq("active", true).order("plate_number");
    if (error) throw error;
    return (data ?? []) as Vehicle[];
  },
};
