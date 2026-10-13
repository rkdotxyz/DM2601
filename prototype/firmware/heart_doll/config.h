/*
  config.h  -  Heart Doll: every setting in one place

  Pins, LED type, timings and the feel of each light pattern. If you
  want to change how the doll behaves or looks, this is the only file
  you should need to touch. Units are in the names (_MS = milliseconds).
*/
#pragma once
#include <Arduino.h>

// ---------------------------------------------------------------------
// Pins (GPIO numbers as printed on the DevKit)
// ---------------------------------------------------------------------
// Your LED's legs are in a different order from the usual one: the leg
// on GPIO25 lights GREEN. So red and green swap here, in software,
// instead of re-wiring. The colour check at start-up confirms it.
// If red still isn't red, swap these numbers until it is.
const int PIN_RED   = 26;
const int PIN_GREEN = 25;
const int PIN_BLUE  = 27;
const int PIN_HEART_BUTTON = 32;
const int PIN_CROSS_BUTTON = 33;

// ---------------------------------------------------------------------
// LED type: copy your result from Phase 1, Test A
// false = common cathode (common leg on the - rail)
// true  = common anode   (common leg on the + rail, fed from 3V3)
// ---------------------------------------------------------------------
const bool COMMON_ANODE = false;

// ---------------------------------------------------------------------
// PWM (how the LED is dimmed)
// ---------------------------------------------------------------------
const uint32_t PWM_FREQ_HZ = 5000;   // far above visible flicker
const uint8_t  PWM_BITS    = 8;      // brightness steps 0..255
const int      PWM_MAX     = 255;
const unsigned long LED_FRAME_MS = 10;   // LED redraw interval (100 per second)

// ---------------------------------------------------------------------
// Light patterns (tested and tuned in Phase 1, Test B)
// ---------------------------------------------------------------------
// Waiting: slow breathing
const unsigned long BREATH_MS   = 4000;   // one breath; safe 2000..8000
const float         WAITING_MAX = 0.40f;  // peak brightness 0..1

// Heartbeat: lub-dub, used for Connected and Together
const unsigned long BEAT_MS      = 1000;  // 1000 = 60 BPM; safe 600..1500
const float         HEART_FLOOR  = 0.06f; // glow between beats, 0..1 of the peak

// How bright the heartbeat is at its peak, 0..1 (as the eye sees it).
// Same rhythm, different strength: one person available vs both.
const float CONNECTED_LEVEL = 0.60f;  // only the phone person is available
const float TOGETHER_LEVEL  = 1.00f;  // both are available

// No WiFi: short blue blink (used from Phase 3)
const unsigned long NOWIFI_PERIOD_MS = 2000;
const unsigned long NOWIFI_ON_MS     = 120;
const float         NOWIFI_LEVEL     = 0.60f;

// Acknowledgement flash after a button press
const unsigned long FLASH_MS = 150;

// ---------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------
const unsigned long DEBOUNCE_MS = 30;   // safe 10..60

// ---------------------------------------------------------------------
// Start-up colour check: red, green, blue, COLOUR_CHECK_MS each
// ---------------------------------------------------------------------
const bool          BOOT_COLOUR_CHECK = true;   // set false once you trust it
const unsigned long COLOUR_CHECK_MS   = 500;

// ---------------------------------------------------------------------
// Network (from Phase 3)
// ---------------------------------------------------------------------
const char HOSTNAME[] = "heartdoll";              // -> http://heartdoll.local
const unsigned long SOCKET_CLEANUP_MS = 1000;     // tidy closed phone links

// ---------------------------------------------------------------------
// Serial Monitor
// ---------------------------------------------------------------------
const unsigned long SERIAL_BAUD = 115200;
