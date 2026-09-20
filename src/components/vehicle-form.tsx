"use client";

import { useState } from "react";
import { BbmPreview } from "@/components/bbm-preview";
import type { OwnerKind, Vehicle, VehicleDoc } from "@/lib/data";
import { DOC_TYPES, SERVICE_INTERVAL_KM, docHasNominal, docStatusFromExpire, docsForVehicle, fmt, isAsuransiDoc, isStnkDoc, vehiclePhoto } from "@/lib/data";
import { SearchSelect } from "@/components/search-select";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

export function VehicleForm({
  initial,
  title,
  onSave,
  onClose,
  sections = "full",
  notice = "",
  takenPlates = [],
}: {
  initial: Vehicle;
  title: string;
  onSave: (v: Vehicle) => void;
  onClose: () => void;
  sections?: "full" | "docs";
  notice?: string;
  takenPlates?: string[];
}) {
  const [form, setForm] = useState<Vehicle>(() => ({
    ...initial,
    transmission: initial.transmission ?? "matic",
    documents: docsForVehicle(initial),
  }));
  const [plateErr, setPlateErr] = useState("");

  function plateKey(p: string) {
    return p.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  function set<K extends keyof Vehicle>(k: K, val: string) {
    const num = ["year", "madeYear", "km", "health", "buyPrice", "nextServiceKm"].includes(String(k));
    const n = num ? Number(val) || 0 : val;
    if (k === "km") {
      const km = Number(val) || 0;
      setForm({ ...form, km, nextServiceKm: km + SERVICE_INTERVAL_KM });
      return;
    }
    setForm({ ...form, [k]: n });
  }

  function readImage(file: File, maxW: number, cb: (data: string) => void) {
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || "");
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / Math.max(img.width, 1));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cb(src);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = () => cb(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  function onBbmFile(file?: File) {
    if (!file) return;
    readImage(file, 720, (data) => setForm((f) => ({ ...f, bbmImage: data })));
  }

  function onPhotoFile(file?: File) {
    if (!file) return;
    readImage(file, 960, (data) => setForm((f) => ({ ...f, photo: data })));
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-[#071526]/75 backdrop-blur-md" />
      <form
        className="anim relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (sections !== "docs") {
            const key = plateKey(form.plate);
            if (!key) {
              setPlateErr("Nomor plat wajib diisi.");
              return;
            }
            if (takenPlates.some((p) => plateKey(p) === key)) {
              setPlateErr("Nomor plat ini sudah dipakai kendaraan lain. Gunakan plat yang berbeda.");
              return;
            }
          }
          setPlateErr("");
          onSave(
            sections === "docs"
              ? { ...initial, documents: form.documents }
              : { ...form, status: initial.status || "ready" }
          );
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#071526] px-6 py-4 text-white">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300">VMMS-SIG</p>
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-sm !text-white hover:bg-white/20">
            Tutup
          </button>
        </div>

        <div className="overflow-auto px-6 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Foto kendaraan</p>
          <div className="mb-6 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[220px_1fr]">
            <img src={vehiclePhoto(form)} alt="" className="h-36 w-full rounded-2xl object-cover ring-1 ring-slate-200" />
            {sections === "docs" ? (
              <div className="flex flex-col justify-center">
                <p className="text-sm font-semibold text-slate-800">{form.brand} {form.model}</p>
                <p className="mt-1 text-sm text-slate-500">{form.plate} · {form.year} · {form.color || "—"}</p>
                <p className="mt-2 text-xs text-slate-400">Foto dan identitas hanya tampilan. Ubah di halaman Armada.</p>
              </div>
            ) : (
            <div className="flex flex-col justify-center">
              <p className="text-sm text-slate-600">Unggah foto unit. Jika kosong, dipakai foto default sesuai model.</p>
              <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#071526] px-4 py-2.5 text-sm font-semibold !text-white">
                Pilih foto
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhotoFile(e.target.files?.[0])} />
              </label>
              {form.photo && (
                <button type="button" className="mt-2 text-left text-xs font-semibold text-red-600" onClick={() => setForm({ ...form, photo: "" })}>
                  Kembali ke foto default
                </button>
              )}
            </div>
            )}
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Identitas unit</p>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Nomor plat">
              <input
                className={inputCls}
                value={form.plate}
                onChange={(e) => {
                  setPlateErr("");
                  set("plate", e.target.value);
                }}
                required
                readOnly={sections === "docs"}
              />
            </Field>
            <Field label="Merk">
              <input className={inputCls} value={form.brand} onChange={(e) => set("brand", e.target.value)} required readOnly={sections === "docs"} />
            </Field>
            <Field label="Model">
              <input className={inputCls} value={form.model} onChange={(e) => set("model", e.target.value)} required readOnly={sections === "docs"} />
            </Field>
            <Field label="Warna">
              <input className={inputCls} value={form.color} onChange={(e) => set("color", e.target.value)} readOnly={sections === "docs"} />
            </Field>
            <Field label="Tahun mobil">
              <input className={inputCls} type="number" value={form.year} onChange={(e) => set("year", e.target.value)} readOnly={sections === "docs"} />
            </Field>

          </div>

          {sections === "full" && (
          <>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Mesin & spek</p>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Kilometer">
              <input className={inputCls} type="number" value={form.km} onChange={(e) => set("km", e.target.value)} />
            </Field>
            <Field label="Jatuh tempo servis (KM)">
              <input className={inputCls} type="number" value={form.nextServiceKm ?? form.km + SERVICE_INTERVAL_KM} onChange={(e) => set("nextServiceKm", e.target.value)} />
              <p className="mt-1 text-[11px] font-normal normal-case tracking-normal text-slate-400">Otomatis KM saat ini + {SERVICE_INTERVAL_KM.toLocaleString("id-ID")} saat kilometer diubah.</p>
            </Field>
            <Field label="Bahan bakar">
              <input className={inputCls} value={form.fuel} onChange={(e) => set("fuel", e.target.value)} />
            </Field>
            <Field label="Transmisi">
              <SearchSelect
                allowEmpty={false}
                value={form.transmission ?? "matic"}
                onChange={(v) => setForm({ ...form, transmission: v as Vehicle["transmission"] })}
                options={[
                  { value: "matic", label: "Matic" },
                  { value: "manual", label: "Manual" },
                ]}
              />
            </Field>
            <Field label="Isi silinder">
              <input className={inputCls} value={form.cc} onChange={(e) => set("cc", e.target.value)} />
            </Field>
            <Field label="No. mesin">
              <input className={inputCls} value={form.engine} onChange={(e) => set("engine", e.target.value)} />
            </Field>
            <Field label="No. rangka">
              <input className={inputCls} value={form.chassis} onChange={(e) => set("chassis", e.target.value)} />
            </Field>
            <Field label="Tahun pembuatan">
              <input className={inputCls} type="number" value={form.madeYear} onChange={(e) => set("madeYear", e.target.value)} />
            </Field>
            <Field label="Tanggal pembelian">
              <input className={inputCls} type="date" value={form.buyDate} onChange={(e) => set("buyDate", e.target.value)} />
            </Field>
            <Field label="Vehicle health (otomatis)">
              <input className={inputCls} type="number" value={form.health} readOnly />
              <p className="mt-1 text-[11px] text-slate-400">Dihitung dari umur, KM, jadwal servis, WO 12 bulan, dokumen, dan status. Tidak diisi manual.</p>
            </Field>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Pemilik & penugasan</p>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Kategori pemilik">
              <SearchSelect
                allowEmpty={false}
                value={form.ownerKind ?? "sig"}
                onChange={(v) => {
                  const ownerKind = v as OwnerKind;
                  setForm({
                    ...form,
                    ownerKind,
                    owner:
                      ownerKind === "sig" && !form.owner.toLowerCase().includes("saraswanti")
                        ? "PT Saraswanti Indo Genetech"
                        : form.owner,
                  });
                }}
                options={[
                  { value: "sig", label: "PT Saraswanti Indo Genetech" },
                  { value: "vendor", label: "Vendor / Rental" },
                ]}
              />
            </Field>
            <Field label={form.ownerKind === "vendor" ? "Nama vendor / rental" : "Nama pemilik"}>
              <input className={inputCls} value={form.owner} onChange={(e) => set("owner", e.target.value)} />
            </Field>
            <Field label="User">
              <input className={inputCls} value={form.driver} onChange={(e) => set("driver", e.target.value)} />
            </Field>
            <Field label="Departemen">
              <input className={inputCls} value={form.dept} onChange={(e) => set("dept", e.target.value)} />
            </Field>
            <Field label="Divisi">
              <input className={inputCls} value={form.jabatan ?? ""} onChange={(e) => set("jabatan", e.target.value)} />
            </Field>
            <Field label="Lokasi / pool">
              <input className={inputCls} value={form.loc} onChange={(e) => set("loc", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Alamat">
                <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} />
              </Field>
            </div>
          </div>
          </>
          )}

          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Dokumen kendaraan</p>
          <div className="mb-6 space-y-2">
            {(form.documents ?? []).map((d, i) => (
              <div key={i} className="space-y-2 rounded-2xl bg-slate-50 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                <div className={docHasNominal(d.type) ? "sm:col-span-3" : "sm:col-span-4"}>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Jenis</p>
                  <SearchSelect
                    allowEmpty={false}
                    value={d.type}
                    onChange={(type) => {
                      const documents = [...(form.documents ?? [])];
                      documents[i] = {
                        ...d,
                        type,
                        amount: docHasNominal(type) ? d.amount : undefined,
                        photo: isStnkDoc(type) ? d.photo : undefined,
                      };
                      setForm({ ...form, documents });
                    }}
                    options={[
                      ...DOC_TYPES.map((t) => ({ value: t, label: t })),
                      ...(!DOC_TYPES.includes(d.type as (typeof DOC_TYPES)[number]) ? [{ value: d.type, label: d.type }] : []),
                    ]}
                  />
                </div>
                <div className={docHasNominal(d.type) ? "sm:col-span-3" : "sm:col-span-4"}>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Berlaku sampai</p>
                  <input
                    className={inputCls}
                    type="date"
                    value={d.expire}
                    onChange={(e) => {
                      const expire = e.target.value;
                      const documents = [...(form.documents ?? [])];
                      documents[i] = { ...d, expire, status: docStatusFromExpire(expire) };
                      setForm({ ...form, documents });
                    }}
                  />
                </div>
                {docHasNominal(d.type) && (
                  <div className="sm:col-span-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {isAsuransiDoc(d.type) ? "Nominal asuransi" : "Nominal pajak"}
                    </p>
                    <input
                      className={inputCls}
                      type="number"
                      min={0}
                      placeholder="Rp"
                      value={d.amount ?? ""}
                      onChange={(e) => {
                        const documents = [...(form.documents ?? [])];
                        const n = e.target.value === "" ? undefined : Number(e.target.value) || 0;
                        documents[i] = { ...d, amount: n };
                        setForm({ ...form, documents });
                      }}
                    />
                    {d.amount ? <p className="mt-1 text-[11px] text-slate-400">{fmt(d.amount)}</p> : null}
                  </div>
                )}
                <div className={`flex items-end gap-2 ${docHasNominal(d.type) ? "sm:col-span-3" : "sm:col-span-4"}`}>
                  <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold uppercase text-slate-500 ring-1 ring-slate-200">{d.status}</span>
                  <button
                    type="button"
                    className="ml-auto text-xs font-semibold text-red-600"
                    onClick={() => setForm({ ...form, documents: (form.documents ?? []).filter((_, j) => j !== i) })}
                  >
                    Hapus
                  </button>
                </div>
              </div>
              {isStnkDoc(d.type) && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
                  {d.photo ? (
                    <img src={d.photo} alt="STNK" className="h-20 w-32 rounded-lg object-cover ring-1 ring-slate-200" />
                  ) : (
                    <span className="grid h-20 w-32 place-items-center rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-400">
                      Belum ada foto
                    </span>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Foto STNK (bukti dokumen)</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">Unggah foto/scan STNK agar tercatat sebagai bukti.</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer rounded-lg bg-[#071526] px-3 py-1.5 text-xs font-semibold !text-white">
                        {d.photo ? "Ganti foto" : "Unggah foto"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            readImage(file, 960, (data) => {
                              const documents = [...(form.documents ?? [])];
                              documents[i] = { ...d, photo: data };
                              setForm({ ...form, documents });
                            });
                          }}
                        />
                      </label>
                      {d.photo ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-red-600"
                          onClick={() => {
                            const documents = [...(form.documents ?? [])];
                            documents[i] = { ...d, photo: "" };
                            setForm({ ...form, documents });
                          }}
                        >
                          Hapus foto
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
              </div>
            ))}
            <button
              type="button"
              className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
              onClick={() =>
                setForm({
                  ...form,
                  documents: [...(form.documents ?? []), { type: "STNK", expire: "", status: "segera" } as VehicleDoc],
                })
              }
            >
              + Tambah dokumen
            </button>
          </div>

          {sections === "full" && (
          <>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Kartu BBM</p>
          <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
            <BbmPreview src={form.bbmImage} size="md" />
            <div className="flex flex-col justify-center">
              <p className="text-sm text-slate-600">Unggah QR kartu BBM (seperti Pertamina). Default memakai template QR.</p>
              <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#071526] px-4 py-2.5 text-sm font-semibold !text-white">
                Pilih gambar kartu
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onBbmFile(e.target.files?.[0])} />
              </label>
              {form.bbmImage && (
                <button type="button" className="mt-2 text-xs text-red-600" onClick={() => setForm({ ...form, bbmImage: "" })}>
                  Hapus gambar
                </button>
              )}
            </div>
          </div>
          </>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          {(plateErr || notice) ? (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-100">{plateErr || notice}</p>
          ) : null}
          <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
            Batal
          </button>
          <button className="rounded-xl bg-[#071526] px-6 py-2 text-sm font-semibold !text-white">Simpan</button>
          </div>
        </div>
      </form>
    </div>
  );
}
