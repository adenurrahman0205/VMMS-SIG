import { pushCloud } from "./services/sync.service";

export type BookingStatus = "pengajuan" | "disetujui" | "ditolak";

export type Booking = {
  id: string;
  vehicleId: string;
  date: string;
  userName: string;
  purpose: string;
  dept?: string;
  jabatan?: string;
  phone?: string;
  note?: string;
  status: BookingStatus;
};

const KEY = "vmms-bookings-v2";

export function loadBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Booking[];
      if (Array.isArray(p)) return p;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveBookings(rows: Booking[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  void pushCloud("bookings", rows);
}

function iso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function seedBookings(): Booking[] {
  const t = new Date();
  const d0 = iso(t);
  const d1 = iso(new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1));
  const d2 = iso(new Date(t.getFullYear(), t.getMonth(), t.getDate() + 2));
  return [
    { id: "b1", vehicleId: "v1", date: d0, userName: "Andi Wijaya", purpose: "Antar dokumen GA", status: "disetujui", dept: "GA" },
    { id: "b2", vehicleId: "v4", date: d0, userName: "Dedi Kurniawan", purpose: "Kunjungan direksi", status: "disetujui", dept: "Direksi" },
    { id: "b3", vehicleId: "xp-1", date: d1, userName: "Eko Nugroho", purpose: "Meeting klien", status: "pengajuan", dept: "Marketing", note: "Butuh unit pagi hari" },
    { id: "b4", vehicleId: "pjs-1", date: d1, userName: "Dedi Kurniawan", purpose: "Dinas luar kota", status: "pengajuan", dept: "Direksi" },
    { id: "b5", vehicleId: "inr-1", date: d2, userName: "Andi Wijaya", purpose: "Jemput tamu", status: "pengajuan", note: "Bandara pukul 09.00" },
  ];
}

export function ymd(d: Date) {
  return iso(d);
}
