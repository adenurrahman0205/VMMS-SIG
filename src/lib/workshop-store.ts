import { workshops as seedLegacy } from "./data";
import { pushCloud } from "./services/sync.service";

export type Workshop = {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  pic: string;
  hours: string;
  specialty: string;
  npwp: string;
  notes: string;
  active: boolean;
};

const KEY = "vmms-workshops-v1";

const seed: Workshop[] = [
  {
    id: "w1",
    code: "BKL-001",
    name: "Auto Service A",
    address: "Jl. Raya Pajajaran No. 88, Baranangsiang, Kota Bogor 16143",
    city: "Bogor",
    phone: "0251-123456",
    email: "autoservice.a@partner.sig.id",
    pic: "Hendra Gunawan",
    hours: "Sen–Sab 08.00–17.00",
    specialty: "Servis berkala, oli, rem",
    npwp: "10.111.222.3-403.000",
    notes: "Bengkel resmi partner GA. Prioritas unit operasional harian.",
    active: true,
  },
  {
    id: "w2",
    code: "BKL-002",
    name: "Auto Service B",
    address: "Jl. Sholeh Iskandar No. 12, Kedungbadak, Kota Bogor 16164",
    city: "Bogor",
    phone: "0251-654321",
    email: "autoservice.b@partner.sig.id",
    pic: "Rina Wulandari",
    hours: "Sen–Jum 08.00–16.30",
    specialty: "AC, kelistrikan, body minor",
    npwp: "10.222.333.4-403.000",
    notes: "Cocok untuk unit dinas dalam kota.",
    active: true,
  },
  {
    id: "w3",
    code: "BKL-003",
    name: "Honda Plaza",
    address: "Jl. TB Simatupang Kav. 18, Cilandak, Jakarta Selatan 12430",
    city: "Jakarta",
    phone: "021-889900",
    email: "honda.plaza@partner.sig.id",
    pic: "Agus Salim",
    hours: "Sen–Sab 07.30–17.00",
    specialty: "Honda authorized · sparepart original",
    npwp: "01.333.444.5-012.000",
    notes: "Khusus unit Honda (HR-V). Booking H-1.",
    active: true,
  },
  {
    id: "w4",
    code: "BKL-004",
    name: "Ban Center Bogor",
    address: "Jl. Raya Tajur No. 45, Tajur, Kota Bogor 16134",
    city: "Bogor",
    phone: "0251-778899",
    email: "ban.center@partner.sig.id",
    pic: "Yudi Pratama",
    hours: "Setiap hari 08.00–20.00",
    specialty: "Ganti ban, balancing, spooring",
    npwp: "10.444.555.6-403.000",
    notes: "Stok ban 16–18 inci. Invoice harian.",
    active: true,
  },
];

export function blankWorkshop(): Workshop {
  return {
    id: `w${Date.now()}`,
    code: "",
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    pic: "",
    hours: "Sen–Jum 08.00–17.00",
    specialty: "",
    npwp: "",
    notes: "",
    active: true,
  };
}

function migrateLegacy(): Workshop[] {
  return seedLegacy.map((w, i) => ({
    id: w.id,
    code: `BKL-${String(i + 1).padStart(3, "0")}`,
    name: w.name,
    address: `${w.city}`,
    city: w.city,
    phone: w.phone,
    email: "",
    pic: "",
    hours: "",
    specialty: "",
    npwp: "",
    notes: "",
    active: true,
  }));
}

export function loadWorkshops(): Workshop[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Workshop[];
      if (Array.isArray(p) && p.length) return p;
    }
  } catch {
    /* ignore */
  }
  const next = seed.length ? seed : migrateLegacy();
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function saveWorkshops(rows: Workshop[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  void pushCloud("workshops", rows);
}

export function findWorkshop(list: Workshop[], shop?: string, workshopId?: string): Workshop | undefined {
  if (workshopId) {
    const byId = list.find((w) => w.id === workshopId);
    if (byId) return byId;
  }
  const s = (shop || "").trim().toLowerCase();
  if (!s) return undefined;
  return (
    list.find((w) => w.name.toLowerCase() === s) ||
    list.find((w) => w.code.toLowerCase() === s) ||
    list.find((w) => w.name.toLowerCase().includes(s) || s.includes(w.name.toLowerCase()))
  );
}

export function waHref(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (!d) return "";
  const n = d.startsWith("0") ? `62${d.slice(1)}` : d;
  return `https://wa.me/${n}`;
}
