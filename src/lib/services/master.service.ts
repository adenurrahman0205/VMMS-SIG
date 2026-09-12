import { createBrowserSupabase } from "@/lib/supabase/client";

export const masterService = {
  async departments() {
    const sb = createBrowserSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from("departments").select("*").eq("active", true).order("name");
    if (error) throw error;
    return data ?? [];
  },
  async drivers() {
    const sb = createBrowserSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from("drivers").select("*").eq("active", true).order("name");
    if (error) throw error;
    return data ?? [];
  },
  async workshops() {
    const sb = createBrowserSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from("workshops").select("*").eq("active", true).order("name");
    if (error) throw error;
    return data ?? [];
  },
  async spareparts() {
    const sb = createBrowserSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from("spareparts").select("*").eq("active", true).order("part_name");
    if (error) throw error;
    return data ?? [];
  },
  async insertDriver(row: { employee_number: string; name: string; phone?: string }) {
    const sb = createBrowserSupabase();
    if (!sb) throw new Error("Supabase not configured");
    const { error } = await sb.from("drivers").insert(row);
    if (error) throw error;
  },
  async insertWorkshop(row: { workshop_code: string; name: string; phone?: string }) {
    const sb = createBrowserSupabase();
    if (!sb) throw new Error("Supabase not configured");
    const { error } = await sb.from("workshops").insert(row);
    if (error) throw error;
  },
};
