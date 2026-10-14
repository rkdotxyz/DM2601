// Turns the doll build (dist-doll/index.html, one self-contained file)
// into firmware/heart_doll/web_page.h: gzip-compressed, as a byte array
// the doll serves straight from flash with "Content-Encoding: gzip".
//
// Run through `npm run build:doll`, after any change to the app, then
// upload the firmware again.
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync, constants } from "node:zlib";
import { fileURLToPath } from "node:url";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const html = readFileSync(here("../dist-doll/index.html"));
const gz = gzipSync(html, { level: constants.Z_BEST_COMPRESSION, memLevel: 9 });

const lines = [];
for (let i = 0; i < gz.length; i += 20) {
  lines.push("  " + Array.from(gz.subarray(i, i + 20), (b) => "0x" + b.toString(16).padStart(2, "0")).join(","));
}

const header = `/*
  web_page.h  -  Heart Doll: the phone app            GENERATED, DON'T EDIT

  The React app from prototype/app, built into one HTML file and
  gzip-compressed: ${(html.length / 1024).toFixed(0)} KB of page in ${(gz.length / 1024).toFixed(0)} KB of flash.
  The doll sends these bytes as they are, with "Content-Encoding: gzip",
  and the phone's browser unpacks them.

  To change the app, edit prototype/app and run, in that folder:
      npm run build:doll
  then upload the firmware again.

  PROGMEM keeps it in flash, not in RAM. The sketch needs the
  "Huge APP (3MB No OTA/1MB SPIFFS)" partition scheme to fit it.
*/
#pragma once
#include <Arduino.h>

const size_t WEB_PAGE_GZ_LEN = ${gz.length};
const uint8_t WEB_PAGE_GZ[] PROGMEM = {
${lines.join(",\n")}
};
`;
writeFileSync(here("../../firmware/heart_doll/web_page.h"), header);
console.log(`web_page.h: ${(html.length / 1024).toFixed(0)} KB page, ${(gz.length / 1024).toFixed(0)} KB gzipped`);
