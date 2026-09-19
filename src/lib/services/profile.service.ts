import { createBrowserSupabase } from "@/lib/supabase/client";
import { loadUsers, saveUsers, type AppUser } from "@/lib/user-store";

export type ProfileFields = {
  name: string;
  phone: string;
  dept: string;
  jabatan: string;
  avatar: string;
};

export function fieldsFromAuth(meta: Record<string, unknown> | undefined): Partial<ProfileFields> {
  const m = meta ?? {};
  return {
    name: typeof m.name === "string" ? m.name : typeof m.full_name === "string" ? m.full_name : undefined,
    phone: typeof m.phone === "string" ? m.phone : undefined,
    dept: typeof m.dept === "string" ? m.dept : undefined,
    jabatan: typeof m.jabatan === "string" ? m.jabatan : undefined,
    avatar: typeof m.avatar === "string" ? m.avatar : undefined,
  };
}

export function mergeLocalUser(email: string, authId: string, meta: Record<string, unknown> | undefined): AppUser {
  const cloud = fieldsFromAuth(meta);
  const users = loadUsers();
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  return {
    id: authId || found?.id || "me",
    name: found?.name || cloud.name || email.split("@")[0] || "Pengguna",
    email: found?.email || email,
    phone: found?.phone || cloud.phone || "",
    dept: found?.dept || cloud.dept || "",
    jabatan: found?.jabatan || cloud.jabatan || "",
    role: found?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER",
    active: found?.active ?? true,
    createdAt: found?.createdAt ?? new Date().toISOString().slice(0, 10),
    avatar: found?.avatar || cloud.avatar || "",
  };
}

export function cacheUser(row: AppUser) {
  const users = loadUsers();
  const i = users.findIndex((u) => u.email.toLowerCase() === row.email.toLowerCase());
  if (i >= 0) {
    users[i] = { ...users[i], ...row };
    saveUsers(users);
  } else {
    saveUsers([row, ...users]);
  }
}

export async function saveProfileCloud(fields: ProfileFields) {
  const sb = createBrowserSupabase();
  // Jangan simpan foto di JWT/cookie Auth — itu penyebab 494 REQUEST_HEADER_TOO_LARGE.
  const payload = {
    name: fields.name,
    full_name: fields.name,
    phone: fields.phone,
    dept: fields.dept,
    jabatan: fields.jabatan,
    avatar: "",
  };
  const { error } = await sb.auth.updateUser({ data: payload });
  if (error) throw error;
}

export function compressAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 192;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas tidak tersedia"));
        return;
      }
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.55));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal membaca foto"));
    };
    img.src = url;
  });
}
