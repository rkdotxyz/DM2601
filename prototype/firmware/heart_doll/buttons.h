/*
  buttons.h  -  Heart Doll: debounced Heart and Cross buttons

  The code from Phase 1, Test C, packaged as a module:
    buttonsBegin()               once, in setup()
    buttonPressed(button, now)   true exactly once per press

  Buttons are wired GPIO -> button -> GND with INPUT_PULLUP, so a
  released button reads HIGH and a pressed one reads LOW.
*/
#pragma once
#include <Arduino.h>
#include "config.h"

// Button numbers, used as indexes into the arrays below.
const int BUTTON_HEART = 0;
const int BUTTON_CROSS = 1;
const int NUM_BUTTONS  = 2;

const int buttonPins[NUM_BUTTONS] = {PIN_HEART_BUTTON, PIN_CROSS_BUTTON};

// ----- private state, one slot per button ----------------------------
int           buttonLastRaw[NUM_BUTTONS];       // last raw reading
int           buttonStable[NUM_BUTTONS];        // last debounced reading
unsigned long buttonChangedMs[NUM_BUTTONS];     // when the raw reading changed

void buttonsBegin() {
  for (int i = 0; i < NUM_BUTTONS; i++) {
    pinMode(buttonPins[i], INPUT_PULLUP);
    buttonLastRaw[i]   = digitalRead(buttonPins[i]);
    buttonStable[i]    = buttonLastRaw[i];
    buttonChangedMs[i] = millis();
  }
}

// Returns true exactly once per press of button 'b'.
// Call it for every button on every loop().
bool buttonPressed(int b, unsigned long now) {
  int raw = digitalRead(buttonPins[b]);

  // Any change restarts the debounce timer.
  if (raw != buttonLastRaw[b]) {
    buttonLastRaw[b] = raw;
    buttonChangedMs[b] = now;
    return false;
  }

  // Still possibly bouncing?
  if (now - buttonChangedMs[b] < DEBOUNCE_MS) return false;

  // Held steady long enough and different from before: a real change.
  if (raw != buttonStable[b]) {
    buttonStable[b] = raw;
    return raw == LOW;   // LOW = pressed. Releases don't count.
  }
  return false;
}
