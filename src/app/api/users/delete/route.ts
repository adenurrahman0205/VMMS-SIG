import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/user-store";

async function isAdminEmail(email: string, users: AppUser[]) {
  const row = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  return row?.role === "SUPER_ADMIN" || row?.role === "FLEET_ADMIN";
}

export async function POST(req: Request) {
  const admin = createAdminSupabase();
  if (!admin) return NextResponse.json({ ok: false, error: "no-admin" }, { status: 501 });

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user?.email) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { data: kv } = await admin.from("app_kv").select("key,value").eq("key", "users").maybeSingle();
  const users = (Array.isArray(kv?.value) ? kv.value : []) as AppUser[];
  if (!(await isAdminEmail(user.email, users))) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ ok: false, error: "email" }, { status: 400 });
  if (email === user.email.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Tidak bisa menghapus akun yang sedang login." }, { status: 400 });
  }

  const next = users.filter((u) => u.email.toLowerCase() !== email);
  await admin.from("app_kv").upsert({ key: "users", value: next }, { onConflict: "key" });

  let page = 1;
  let authId: string | undefined;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) {
      authId = hit.id;
      break;
    }
    if (!data.users.length || data.users.length < 200) break;
    page += 1;
  }

  if (authId) {
    const id = authId;
    await admin.from("user_roles").delete().eq("user_id", id);
    await admin.from("notifications").delete().eq("user_id", id);

    const nullCols: { table: string; col: string }[] = [
      { table: "vehicle_assignments", col: "created_by" },
      { table: "vehicle_status_logs", col: "created_by" },
      { table: "odometer_logs", col: "created_by" },
      { table: "maintenance", col: "created_by" },
      { table: "expenses", col: "created_by" },
      { table: "vehicle_documents", col: "created_by" },
      { table: "attachments", col: "uploaded_by" },
      { table: "audit_logs", col: "user_id" },
      { table: "export_logs", col: "user_id" },
      { table: "backup_logs", col: "created_by" },
    ];
    for (const { table, col } of nullCols) {
      await admin.from(table).update({ [col]: null }).eq(col, id);
    }

    await admin.from("profiles").delete().eq("id", id);

    const del = await admin.auth.admin.deleteUser(id);
    if (del.error) return NextResponse.json({ ok: false, error: del.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
