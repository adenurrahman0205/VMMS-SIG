import type { Maintenance, Vehicle } from "@/lib/data";
import type { Workshop } from "@/lib/workshop-store";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function spkNumber(jobs: Maintenance[], job: Maintenance) {
  const [y, m] = (job.date || "").split("-");
  const year = Number(y) || new Date().getFullYear();
  const month = Number(m) || new Date().getMonth() + 1;
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const same = jobs
    .filter((j) => (j.date || "").startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const idx = Math.max(0, same.findIndex((j) => j.id === job.id));
  const seq = String(idx + 1).padStart(4, "0");
  return `SIG-SPK-${seq}/${month}/${year}`;
}

function formatLongDate(iso: string) {
  const d = iso ? new Date(iso + "T00:00:00") : new Date();
  return `Bogor, ${d.getDate()}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
}

function jenisKendaraan(v?: Vehicle) {
  if (!v) return "—";
  const trans = v.transmission === "manual" ? "Manual" : v.transmission === "matic" ? "Automatic" : "";
  return [v.brand, v.model, v.cc, trans, v.year].filter(Boolean).join(" ");
}

function letterBody(opts: {
  job: Maintenance;
  jobs: Maintenance[];
  vehicle?: Vehicle;
  workshop?: Workshop;
  logoSrc: string;
}) {
  const { job, jobs, vehicle, workshop, logoSrc } = opts;
  const no = spkNumber(jobs, job);
  const shopName = workshop?.name || job.shop || "—";
  const shopAddr = workshop?.address || "";
  const uraian = job.items.map((it) => it.name).filter(Boolean).join("\n");
  const catatan = job.complaint || job.action || "";
  const seq = no.split("-").pop()?.split("/")[0]?.replace(/^0+/, "") || "";
  return `
    <div class="sheet">
      <div class="head">
        <img src="${esc(logoSrc)}" alt="SIG"/>
        <div class="co">
          <div class="name">PT. SARASWANTI INDO GENETECH</div>
          <div class="addr">JL. Rasamala No. 20 Taman Yasmin - Bogor 16113</div>
          <div class="addr">Tlp. 0251-7532348, Fax : 0251-7540927</div>
          <div class="addr">Email : hse.sig@saraswanti.com</div>
        </div>
      </div>
      <hr class="line"/>
      <h1>Surat Perintah Kerja Bengkel</h1>
      <p class="no">No.SPK : ${esc(no)}</p>
      <div class="meta">
        <div class="seq">${esc(seq)}</div>
        <div><span class="label">Kepada :</span></div>
        <div class="shop">${esc(shopName)}</div>
        <div class="addr-block">${esc(shopAddr)}</div>
        <div class="up"><span class="label">Up :</span></div>
        <div>Service Advisor</div>
      </div>
      <hr class="line"/>
      <div class="intro">
        Dengan Hormat,<br/>
        Bersama ini kami mengajukan perbaikan atau servis kendaraan kami dengan rincian sebagai berikut :
      </div>
      <div class="sec">Data Kendaraan :</div>
      <table class="data">
        <tr><td class="n">1</td><td class="k">Jenis Kendaraan</td><td>${esc(jenisKendaraan(vehicle))}</td></tr>
        <tr><td class="n">2</td><td class="k">No Plat</td><td>${esc(vehicle?.plate || "—")}</td></tr>
        <tr><td class="n">3</td><td class="k">No Rangka</td><td>${esc(vehicle?.chassis || "—")}</td></tr>
        <tr><td class="n">4</td><td class="k">No Mesin</td><td>${esc(vehicle?.engine || "—")}</td></tr>
      </table>
      <div class="sec">Uraian permintaan pekerjaan :</div>
      <div class="box">${esc(uraian) || "&nbsp;"}</div>
      <div class="sec">Catatan Pemeriksaan :</div>
      <div class="box center">${esc(catatan) || "&nbsp;"}</div>
      <div class="sign">
        <div>${esc(formatLongDate(job.date))}</div>
        <div>PT Saraswanti Indo Genetech</div>
        <div class="who">Muhammad Dzikry Hannan</div>
        <div class="role">Manager GA</div>
      </div>
    </div>`;
}

const LETTER_CSS = `
  @page { size: A4 portrait; margin: 14mm 16mm 16mm 16mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #111;
    font-family: "Times New Roman", Times, Georgia, serif;
    font-size: 12pt;
  }
  .sheet { width: 100%; color: #111; background: #fff; }
  .head { display: flex; align-items: flex-start; gap: 14px; }
  .head img { height: 48px; width: auto; }
  .co { flex: 1; text-align: center; line-height: 1.35; }
  .co .name { font-weight: 700; letter-spacing: 0.03em; font-size: 13pt; }
  .co .addr { font-size: 10.5pt; }
  hr.line { border: 0; border-top: 1.5px solid #111; margin: 8px 0 10px; }
  h1 { font-size: 14pt; text-align: center; text-decoration: underline; margin: 0 0 2px; font-weight: 700; }
  .no { text-align: center; margin: 0 0 12px; font-size: 11.5pt; }
  .meta { position: relative; }
  .seq { position: absolute; right: 0; top: 0; }
  .label { font-weight: 700; }
  .shop { font-weight: 700; margin-top: 2px; }
  .addr-block { white-space: pre-wrap; max-width: 85%; font-size: 11pt; line-height: 1.35; }
  .up { margin-top: 12px; }
  .intro { margin: 16px 0 12px; line-height: 1.45; }
  .sec { font-weight: 700; margin: 12px 0 6px; }
  table.data { border-collapse: collapse; margin-left: 16px; }
  table.data td { padding: 1px 10px 1px 0; vertical-align: top; }
  table.data td.n { width: 22px; }
  table.data td.k { width: 150px; }
  .box {
    min-height: 72px;
    border: 1.4px solid #111;
    padding: 8px 10px;
    white-space: pre-wrap;
    line-height: 1.4;
  }
  .box.center { text-align: center; }
  .sign { margin-top: 22px; }
  .sign .who { font-weight: 700; margin-top: 48px; text-decoration: underline; }
  .sign .role { font-size: 11pt; }
`;

function fullHtml(inner: string) {
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"/><title>SPK</title><style>${LETTER_CSS}</style></head><body>${inner}</body></html>`;
}

export function openSpkPdf(opts: {
  job: Maintenance;
  jobs: Maintenance[];
  vehicle?: Vehicle;
  workshop?: Workshop;
}) {
  if (typeof document === "undefined") return;
  document.getElementById("spk-preview-root")?.remove();
  document.getElementById("spk-print-frame")?.remove();

  const logoSrc = `${window.location.origin}/images/logo-sig.png`;
  const inner = letterBody({ ...opts, logoSrc });
  const html = fullHtml(inner);

  const root = document.createElement("div");
  root.id = "spk-preview-root";
  root.style.cssText =
    "position:fixed;inset:0;z-index:99999;background:rgba(7,21,38,.72);overflow:auto;padding:20px 12px 48px";
  root.innerHTML = `
    <div style="display:flex;justify-content:flex-end;gap:8px;margin:0 auto 12px;max-width:210mm">
      <button type="button" id="spk-print-btn" style="border:0;border-radius:999px;padding:8px 16px;font-weight:700;background:#0ea5e9;color:#fff;cursor:pointer">Cetak / Simpan PDF</button>
      <button type="button" id="spk-close-btn" style="border:0;border-radius:999px;padding:8px 16px;font-weight:700;background:#fff;color:#071526;cursor:pointer">Tutup</button>
    </div>
    <div style="background:#fff;color:#111;max-width:210mm;margin:0 auto;min-height:297mm;padding:14mm 16mm;box-shadow:0 12px 40px rgba(0,0,0,.35)">
      <style>${LETTER_CSS}</style>
      ${inner}
    </div>
  `;
  document.body.appendChild(root);

  function printLetter() {
    document.getElementById("spk-print-frame")?.remove();
    const iframe = document.createElement("iframe");
    iframe.id = "spk-print-frame";
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    const run = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };
    const imgs = Array.from(doc.images);
    if (imgs.length === 0) {
      setTimeout(run, 50);
      return;
    }
    let left = imgs.length;
    imgs.forEach((img) => {
      const done = () => {
        left -= 1;
        if (left <= 0) setTimeout(run, 50);
      };
      if (img.complete) done();
      else {
        img.onload = done;
        img.onerror = done;
      }
    });
  }

  root.querySelector("#spk-print-btn")?.addEventListener("click", printLetter);
  root.querySelector("#spk-close-btn")?.addEventListener("click", () => {
    document.getElementById("spk-print-frame")?.remove();
    root.remove();
  });
}
