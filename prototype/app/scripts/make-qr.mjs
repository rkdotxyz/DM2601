// Makes a printable QR sticker that joins the doll's own WiFi. Scan it
// with a phone camera: the phone joins, and the app opens by itself.
//
// The network name and password come from firmware/heart_doll/secrets.h
// (or secrets.example.h if you haven't made one). The output, in qr/,
// contains your password, so qr/ is kept out of git.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const secretsPath = existsSync(here("../../firmware/heart_doll/secrets.h"))
  ? here("../../firmware/heart_doll/secrets.h")
  : here("../../firmware/heart_doll/secrets.example.h");
const secrets = readFileSync(secretsPath, "utf8");

function value(name) {
  const m = secrets.match(new RegExp(`${name}\\[\\]\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  if (!m) throw new Error(`${name} not found in ${secretsPath}`);
  return m[1].replace(/\\(.)/g, "$1");
}
const ssid = value("DOLL_WIFI_NAME");
const password = value("DOLL_WIFI_PASSWORD");
if (password.length < 8) throw new Error("DOLL_WIFI_PASSWORD needs at least 8 characters");

// The standard WiFi QR format, understood by iPhone and Android cameras.
const esc = (s) => s.replace(/([\;,:"])/g, "\\$1");
const wifi = `WIFI:T:WPA;S:${esc(ssid)};P:${esc(password)};;`;

const svg = await QRCode.toString(wifi, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#2b1d20", light: "#ffffff" } });
const html = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const sticker = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Heart Doll QR sticker</title>
<style>
  @page { margin: 12mm; }
  body { font: 14px/1.4 -apple-system, "Segoe UI", Roboto, sans-serif; color: #2b1d20; margin: 0; padding: 24px; }
  .sticker { width: 62mm; border: 1px dashed #c9b8b4; border-radius: 6mm; padding: 6mm; text-align: center; }
  .sticker svg { width: 46mm; height: 46mm; display: block; margin: 0 auto 3mm; }
  h1 { font-size: 17px; margin: 0 0 1mm; }
  p { margin: 0; font-size: 11px; color: #6b5a58; }
  code { font-size: 11px; }
  .tip { margin-top: 18px; font-size: 12px; color: #8c7977; }
</style></head>
<body>
  <div class="sticker">
    ${svg}
    <h1>&#9829; Heart Doll</h1>
    <p>Scan to join. The app opens by itself.</p>
    <p>Or join <b>${html(ssid)}</b>, then open <code>http://192.168.4.1</code></p>
  </div>
  <p class="tip">Print at 100% and cut along the dashed line. Made from ${html(secretsPath.split("/").pop())}.</p>
</body></html>
`;

mkdirSync(here("../qr"), { recursive: true });
writeFileSync(here("../qr/heartdoll-wifi.svg"), svg);
writeFileSync(here("../qr/sticker.html"), sticker);
console.log(`QR for "${ssid}" written to prototype/app/qr/ (sticker.html to print, heartdoll-wifi.svg)`);
