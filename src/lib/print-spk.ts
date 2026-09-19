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
  const trans = v.transmission === "manual" ? "Manual" : "Automatic";
  return [v.brand?.toUpperCase(), v.model, v.cc, trans, v.year].filter(Boolean).join(" ");
}

const LETTER_CSS = `
  @page { size: A4 portrait; margin: 12mm 16mm 14mm 16mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: "Times New Roman", Times, serif;
    font-size: 11.5pt;
    line-height: 1.35;
  }
  .sheet { width: 100%; color: #000; background: #fff; }
  table.head { width: 100%; border-collapse: collapse; }
  table.head td { vertical-align: middle; padding: 0; }
  table.head .logo { width: 92px; }
  table.head .logo img { display: block; height: 44px; width: auto; }
  table.head .co { text-align: center; }
  table.head .name { font-size: 12.5pt; font-weight: 700; letter-spacing: 0.04em; }
  table.head .addr { font-size: 10pt; }
  hr.line { border: 0; border-top: 1.35px solid #000; margin: 8px 0 10px; }
  h1 {
    font-size: 13.5pt;
    text-align: center;
    text-decoration: underline;
    margin: 4px 0 2px;
    font-weight: 700;
  }
  .no { text-align: center; margin: 0 0 14px; font-size: 11pt; }
  table.kepada { width: 100%; border-collapse: collapse; }
  table.kepada td { vertical-align: top; padding: 0; }
  table.kepada .seq { text-align: right; width: 48px; padding-top: 2px; }
  .shop { font-weight: 700; margin-top: 2px; }
  .addr-block { font-size: 10.5pt; line-height: 1.35; max-width: 420px; }
  .up { margin-top: 14px; }
  .intro { margin: 18px 0 16px; }
  .intro p { margin: 0 0 10px; }
  .sec { font-weight: 700; margin: 12px 0 6px; }
  table.data { border-collapse: collapse; margin: 0 0 4px 22px; }
  table.data td { padding: 2px 14px 2px 0; vertical-align: top; }
  table.data td.n { width: 28px; }
  table.data td.k { width: 148px; }
  .box {
    height: 78px;
    border: 1.35px solid #000;
    padding: 8px 10px;
    white-space: pre-wrap;
    line-height: 1.4;
  }
  .box.tall { height: 92px; }
  .box.center { text-align: center; padding-top: 28px; }
  .sign { margin-top: 22px; }
  .sign .co-name { margin-bottom: 40px; }
  .sign .who { font-weight: 700; text-decoration: underline; }
  .sign .role { font-size: 11pt; }
`;

function letterInner(opts: {
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
      <table class="head">
        <tr>
          <td class="logo"><img src="${esc(logoSrc)}" alt="SIG"/></td>
          <td class="co">
            <div class="name">PT. SARASWANTI INDO GENETECH</div>
            <div class="addr">JL. Rasamala No. 20 Taman Yasmin - Bogor 16113</div>
            <div class="addr">Tlp. 0251-7532348, Fax : 0251-7540927</div>
            <div class="addr">Email : hse.sig@saraswanti.com</div>
          </td>
          <td class="logo"></td>
        </tr>
      </table>
      <hr class="line"/>
      <h1>Surat Perintah Kerja Bengkel</h1>
      <p class="no">No.SPK : ${esc(no)}</p>
      <table class="kepada">
        <tr>
          <td>
            <div><b>Kepada :</b></div>
            <div class="shop">${esc(shopName)}</div>
            <div class="addr-block">${esc(shopAddr)}</div>
            <div class="up"><b>Up :</b></div>
            <div>Service Advisor</div>
          </td>
          <td class="seq">${esc(seq)}</td>
        </tr>
      </table>
      <hr class="line"/>
      <div class="intro">
        <p>Dengan Hormat,</p>
        <p>Bersama ini kami mengajukan perbaikan atau servis kendaraan kami dengan rincian sebagai berikut :</p>
      </div>
      <div class="sec">Data Kendaraan :</div>
      <table class="data">
        <tr><td class="n">1</td><td class="k">Jenis Kendaraan</td><td>${esc(jenisKendaraan(vehicle))}</td></tr>
        <tr><td class="n">2</td><td class="k">No Plat</td><td>${esc(vehicle?.plate || "—")}</td></tr>
        <tr><td class="n">3</td><td class="k">No Rangka</td><td>${esc(vehicle?.chassis || "—")}</td></tr>
        <tr><td class="n">4</td><td class="k">No Mesin</td><td>${esc(vehicle?.engine || "—")}</td></tr>
      </table>
      <div class="sec">Uraian permintaan pekerjaan :</div>
      <div class="box tall">${esc(uraian) || "&nbsp;"}</div>
      <div class="sec">Catatan Pemeriksaan :</div>
      <div class="box center">${esc(catatan) || "&nbsp;"}</div>
      <div class="sign">
        <div><b>${esc(formatLongDate(job.date))}</b></div>
        <div class="co-name">PT Saraswanti Indo Genetech</div>
        <div class="who">Muhammad Dzikry Hannan</div>
        <div class="role">Manager GA</div>
      </div>
    </div>`;
}

function fullHtml(inner: string) {
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"/><title>SPK</title><style>${LETTER_CSS}</style></head><body>${inner}</body></html>`;
}

async function logoDataUrl() {
  const url = `${window.location.origin}/images/logo-sig-print.png`;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || url));
      r.onerror = () => reject(new Error("read"));
      r.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

export function openSpkPdf(opts: {
  job: Maintenance;
  jobs: Maintenance[];
  vehicle?: Vehicle;
  workshop?: Workshop;
}) {
  if (typeof document === "undefined") return;
  void (async () => {
    document.getElementById("spk-preview-root")?.remove();
    document.getElementById("spk-print-frame")?.remove();
    const logoSrc = await logoDataUrl();
    const inner = letterInner({ ...opts, logoSrc });
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
      <div style="background:#fff;color:#000;max-width:210mm;margin:0 auto;min-height:297mm;padding:12mm 16mm;box-shadow:0 12px 40px rgba(0,0,0,.35)">
        <style>${LETTER_CSS}</style>
        ${inner}
      </div>
    `;
    document.body.appendChild(root);

    function printLetter() {
      document.getElementById("spk-print-frame")?.remove();
      const iframe = document.createElement("iframe");
      iframe.id = "spk-print-frame";
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
      setTimeout(run, 200);
    }

    root.querySelector("#spk-print-btn")?.addEventListener("click", printLetter);
    root.querySelector("#spk-close-btn")?.addEventListener("click", () => {
      document.getElementById("spk-print-frame")?.remove();
      root.remove();
    });
  })();
}
