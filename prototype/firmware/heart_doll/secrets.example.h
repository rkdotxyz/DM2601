/*
  secrets.example.h  -  template for your WiFi names and passwords.

  Copy this file to secrets.h in the same folder and fill it in.
  secrets.h is listed in .gitignore, so it never goes to GitHub. Until
  secrets.h exists, the sketch builds with these placeholders.

  Which pair is used depends on WIFI_MODE in config.h.
*/
#pragma once

// The doll's own network (WIFI_MODE = WIFI_OWN_NETWORK, the default).
// The doll makes this network; your phone joins it. The password needs
// at least 8 characters. The QR sticker (prototype/app: npm run qr) is
// made from these two lines.
const char DOLL_WIFI_NAME[]     = "HeartDoll";
const char DOLL_WIFI_PASSWORD[] = "goodnight";

// Your WiFi or phone hotspot (WIFI_MODE = WIFI_HOTSPOT). The doll joins
// it. Use a 2.4 GHz network (iPhone hotspot: turn on "Maximize
// Compatibility").
const char WIFI_SSID[]     = "YourHotspotName";
const char WIFI_PASSWORD[] = "YourHotspotPassword";
