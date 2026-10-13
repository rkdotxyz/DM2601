/*
  led.h  -  Heart Doll: everything about the RGB LED

  The code from Phase 1, Test B, packaged as a module. The rest of the
  firmware only calls five functions:
    ledBegin()            once, in setup()
    ledSetPattern(p)      choose what to show: off, breathing, soft or full heartbeat
    ledFlash()            play the short white acknowledgement flash
    ledColourCheck()      red, green, blue once at start-up (blocking, setup only)
    ledSetNoWifi(on)      show the blue "no WiFi" blink (from Phase 3)
    ledUpdate(now)        call every loop(); it redraws when it's time

  The module doesn't know about states, buttons or phones. The main
  sketch decides WHAT to show; this file only knows HOW to draw it.
*/
#pragma once
#include <Arduino.h>
#include <math.h>
#include "config.h"

// What the LED can show.
enum LedPattern {
  PATTERN_OFF,
  PATTERN_BREATHING,   // used for Waiting
  PATTERN_HEARTBEAT_SOFT,   // used for Connected: heartbeat at CONNECTED_LEVEL
  PATTERN_HEARTBEAT_FULL    // used for Together:  heartbeat at TOGETHER_LEVEL
};

// ----- private state of this module ---------------------------------
LedPattern    ledPattern      = PATTERN_OFF;
bool          ledFlashing     = false;
unsigned long ledFlashStartMs = 0;
bool          ledNoWifi       = false;
unsigned long ledLastFrameMs  = 0;

// ----- drawing helpers (from Test B) --------------------------------

// One channel, brightness 0..1, with gamma correction and the
// common-anode flip.
void ledWriteChannel(int pin, float level) {
  if (level < 0.0f) level = 0.0f;
  if (level > 1.0f) level = 1.0f;
  float perceived = level * level;               // gamma: even-looking fades
  int duty = (int)(perceived * PWM_MAX + 0.5f);
  if (COMMON_ANODE) duty = PWM_MAX - duty;       // anode LEDs light on LOW
  ledcWrite(pin, duty);
}

void ledSetRGB(float red, float green, float blue) {
  ledWriteChannel(PIN_RED, red);
  ledWriteChannel(PIN_GREEN, green);
  ledWriteChannel(PIN_BLUE, blue);
}

// Waiting: cosine "breath", 0 -> WAITING_MAX -> 0 every BREATH_MS.
float ledBreathLevel(unsigned long now) {
  float phase = (float)(now % BREATH_MS) / (float)BREATH_MS;
  return (1.0f - cosf(2.0f * PI * phase)) / 2.0f * WAITING_MAX;
}

// A smooth bell-shaped bump centred on 'center'.
float ledBump(float t, float center, float width) {
  float x = (t - center) / width;
  return expf(-x * x);
}

// Heartbeat: lub (strong) then dub (softer), then rest until the next
// beat, every BEAT_MS. Returns 0..1; the caller scales it by how bright
// this heartbeat should be (CONNECTED_LEVEL or TOGETHER_LEVEL).
float ledHeartbeatLevel(unsigned long now) {
  float t   = (float)(now % BEAT_MS);
  float lub = ledBump(t, 120.0f, 55.0f);
  float dub = 0.6f * ledBump(t, 360.0f, 70.0f);
  return HEART_FLOOR + (1.0f - HEART_FLOOR) * fmaxf(lub, dub);
}

// ----- public functions ----------------------------------------------

void ledBegin() {
  bool ok = ledcAttach(PIN_RED,   PWM_FREQ_HZ, PWM_BITS) &&
            ledcAttach(PIN_GREEN, PWM_FREQ_HZ, PWM_BITS) &&
            ledcAttach(PIN_BLUE,  PWM_FREQ_HZ, PWM_BITS);
  if (!ok) Serial.println("ERROR: ledcAttach failed (esp32 package must be 3.x)");
  ledSetRGB(0, 0, 0);
}

// Show red, green, then blue, so you can see at a glance that the pin
// numbers in config.h match your LED's legs. Uses delay(): it runs once,
// in setup(), before anything else needs the loop.
void ledColourCheck() {
  const char* names[3] = {"RED", "GREEN", "BLUE"};
  Serial.println("Colour check (if the LED doesn't match, swap PIN_RED / PIN_GREEN / PIN_BLUE in config.h):");
  for (int i = 0; i < 3; i++) {
    Serial.print("  now: ");
    Serial.println(names[i]);
    ledSetRGB(i == 0 ? 1.0f : 0.0f, i == 1 ? 1.0f : 0.0f, i == 2 ? 1.0f : 0.0f);
    delay(COLOUR_CHECK_MS);
  }
  ledSetRGB(0, 0, 0);
}

void ledSetPattern(LedPattern p) {
  ledPattern = p;   // takes effect on the next frame, mid-beat is fine
}

void ledFlash() {
  ledFlashing = true;
  ledFlashStartMs = millis();
}

void ledSetNoWifi(bool on) {
  ledNoWifi = on;
}

// Call every loop(). Only redraws every LED_FRAME_MS.
void ledUpdate(unsigned long now) {
  if (now - ledLastFrameMs < LED_FRAME_MS) return;
  ledLastFrameMs = now;

  // Priority 1: the acknowledgement flash, while it lasts.
  if (ledFlashing) {
    if (now - ledFlashStartMs < FLASH_MS) {
      ledSetRGB(1.0f, 1.0f, 1.0f);
      return;
    }
    ledFlashing = false;
  }

  // Priority 2: no WiFi. During the short blink, blue replaces the
  // pattern; the rest of the time the pattern shows as usual.
  if (ledNoWifi && (now % NOWIFI_PERIOD_MS) < NOWIFI_ON_MS) {
    ledSetRGB(0, 0, NOWIFI_LEVEL);
    return;
  }

  // Priority 3: the pattern for the current state.
  switch (ledPattern) {
    case PATTERN_BREATHING: ledSetRGB(ledBreathLevel(now), 0, 0);    break;
    case PATTERN_HEARTBEAT_SOFT: ledSetRGB(ledHeartbeatLevel(now) * CONNECTED_LEVEL, 0, 0); break;
    case PATTERN_HEARTBEAT_FULL: ledSetRGB(ledHeartbeatLevel(now) * TOGETHER_LEVEL, 0, 0);  break;
    default:                ledSetRGB(0, 0, 0);                      break;
  }
}
