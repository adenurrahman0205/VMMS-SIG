import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

const KEYS = ["fleet", "bookings", "users", "jobs", "workshops", "spareparts", "estimates"] as const;

export async function GET() {
  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "no-admin" }, { status: 501 });
  const { data, error } = await sb.from("app_kv").select("key,value");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const state: Record<string, unknown> = {};
  for (const row of data ?? []) state[row.key] = row.value;
  return NextResponse.json({ ok: true, state });
}

export async function PUT(req: Request) {
  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ ok: false, error: "no-admin" }, { status: 501 });
  const body = (await req.json()) as { key?: string; value?: unknown };
  if (!body.key || !KEYS.includes(body.key as (typeof KEYS)[number])) {
    return NextResponse.json({ ok: false, error: "bad-key" }, { status: 400 });
  }
  const { error } = await sb.from("app_kv").upsert({ key: body.key, value: body.value }, { onConflict: "key" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
