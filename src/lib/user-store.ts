import { pushCloud } from "./services/sync.service";

export type AppRole = "SUPER_ADMIN" | "FLEET_ADMIN" | "USER";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  dept: string;
  jabatan?: string;
  role: AppRole;
  active: boolean;
  createdAt: string;
  avatar?: string;
};

const KEY = "vmms-users-v1";

const seed: AppUser[] = [
  {
    id: "u-admin",
    name: "VMMS Admin",
    email: "vmms.admin@gmail.com",
    phone: "0812-0000-0000",
    dept: "General Affairs",
    jabatan: "Administrator",
    role: "SUPER_ADMIN",
    active: true,
    createdAt: "2026-09-01",
  },
];

export function loadUsers(): AppUser[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as AppUser[];
      if (Array.isArray(p) && p.length) return p;
    }
  } catch {
    /* ignore */
  }
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

export function saveUsers(rows: AppUser[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  void pushCloud("users", rows);
}

export function blankUser(): AppUser {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    id: `u${Date.now()}`,
    name: "",
    email: "",
    phone: "",
    dept: "",
    jabatan: "",
    role: "USER",
    active: true,
    createdAt: iso,
  };
}
