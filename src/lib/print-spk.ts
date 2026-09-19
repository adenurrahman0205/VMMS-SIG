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
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `Bogor, ${day}-${month}-${year}`;
}

function jenisKendaraan(v?: Vehicle) {
  if (!v) return "—";
  const trans = v.transmission === "manual" ? "Manual" : v.transmission === "matic" ? "Automatic" : "";
  return [v.brand, v.model, v.cc, trans, v.year].filter(Boolean).join(" ");
}

export function openSpkPdf(opts: {
  job: Maintenance;
  jobs: Maintenance[];
  vehicle?: Vehicle;
  workshop?: Workshop;
}) {
  const { job, jobs, vehicle, workshop } = opts;
  const no = spkNumber(jobs, job);
  const shopName = workshop?.name || job.shop || "—";
  const shopAddr = workshop?.address || "";
  const uraian = job.items
    .map((it) => it.name)
    .filter(Boolean)
    .join("\n");
  const catatan = job.complaint || job.action || "";
  const logo = `${window.location.origin}/images/logo-sig.png`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<title>${esc(no)}</title>
<style>
  @page { size: A4; margin: 16mm 18mm 18mm 18mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    color: #111;
    background: #fff;
  }
  .sheet { width: 174mm; margin: 0 auto; }
  .head { display: flex; align-items: flex-start; gap: 16px; }
  .head img { height: 52px; width: auto; object-fit: contain; }
  .co { flex: 1; text-align: center; line-height: 1.35; }
  .co .name { font-weight: 700; letter-spacing: 0.04em; font-size: 13pt; }
  .co .addr { font-size: 10.5pt; }
  hr.line { border: 0; border-top: 1.6px solid #111; margin: 10px 0 12px; }
  h1 { font-size: 14pt; text-align: center; text-decoration: underline; margin: 0 0 4px; }
  .no { text-align: center; margin: 0 0 14px; font-size: 11.5pt; }
  .meta { position: relative; margin-bottom: 10px; }
  .seq { position: absolute; right: 0; top: 0; font-size: 10pt; }
  .label { font-weight: 700; }
  .shop { font-weight: 700; margin-top: 2px; }
  .addr-block { white-space: pre-wrap; max-width: 78%; font-size: 11pt; line-height: 1.35; }
  .intro { margin: 22px 0 16px; line-height: 1.5; }
  .sec { font-weight: 700; margin: 14px 0 6px; }
  table.data { border-collapse: collapse; margin-left: 18px; }
  table.data td { padding: 2px 10px 2px 0; vertical-align: top; }
  table.data td.n { width: 22px; }
  table.data td.k { width: 140px; }
  .box {
    min-height: 88px;
    border: 1.4px solid #111;
    padding: 8px 10px;
    white-space: pre-wrap;
    line-height: 1.4;
  }
  .sign { margin-top: 28px; }
  .sign .who { font-weight: 700; margin-top: 56px; }
  .sign .role { font-size: 11pt; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <img src="${esc(logo)}" alt="SIG"/>
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
      <div class="seq">${esc(no.split("-").pop()?.split("/")[0]?.replace(/^0+/, "") || "")}</div>
      <div><span class="label">Kepada :</span></div>
      <div class="shop">${esc(shopName)}</div>
      <div class="addr-block">${esc(shopAddr)}</div>
      <div style="margin-top:14px"><span class="label">Up :</span></div>
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
    <div class="box">${esc(uraian)}</div>
    <div class="sec">Catatan Pemeriksaan :</div>
    <div class="box" style="text-align:center">${esc(catatan)}</div>
    <div class="sign">
      <div>${esc(formatLongDate(job.date))}</div>
      <div>PT Saraswanti Indo Genetech</div>
      <div class="who">Muhammad Dzikry Hannan</div>
      <div class="role">Manager GA</div>
    </div>
  </div>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.print(); }, 250);
    });
  </script>
</body>
</html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
