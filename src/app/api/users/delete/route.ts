import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { normalizeRole, type AppUser } from "@/lib/user-store";

function isSuper(email: string, users: AppUser[]) {
  const row = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  return normalizeRole(row?.role) === "SUPER_ADMIN";
}

export async function POST(req: Request) {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user?.email) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const db = admin ?? sb;

  const { data: kv, error: kvErr } = await db.from("app_kv").select("key,value").eq("key", "users").maybeSingle();
  if (kvErr) return NextResponse.json({ ok: false, error: kvErr.message }, { status: 500 });

  const users = (Array.isArray(kv?.value) ? kv.value : []) as AppUser[];
  if (!isSuper(user.email, users)) {
    return NextResponse.json({ ok: false, error: "Hanya SUPER_ADMIN yang boleh menghapus akun." }, { status: 403 });
  }

  const body = (await req.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ ok: false, error: "email" }, { status: 400 });
  if (email === user.email.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Tidak bisa menghapus akun yang sedang login." }, { status: 400 });
  }

  const next = users.filter((u) => u.email.toLowerCase() !== email);
  const { error: upErr } = await db.from("app_kv").upsert({ key: "users", value: next }, { onConflict: "key" });
  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

  if (!admin) {
    return NextResponse.json({
      ok: true,
      authDeleted: false,
      warning:
        "User dihapus dari daftar. Untuk menghapus login Auth, isi SUPABASE_SERVICE_ROLE_KEY di Vercel (server only, jangan NEXT_PUBLIC).",
    });
  }

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

  return NextResponse.json({ ok: true, authDeleted: Boolean(authId) });
}
