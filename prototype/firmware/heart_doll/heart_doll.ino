/*
  heart_doll.ino  -  Heart Doll firmware (v1.1: liquid heart app)

  A doll with an RGB heart and two buttons:
    Heart  -> tells the phone "I'm available";   heart breathes slowly
    Cross  -> tells the phone "I'm busy";        heart goes dark
  and a phone person who can say Available (heartbeat) or Unavailable.
  Phone available on its own: heartbeat at 60%. Both available, in
  either order: heartbeat at 100%. Each person stays available until
  they change it themselves; Cross means "not now".

  How the files fit together
  --------------------------
    config.h          every setting
    state_machine.h   the rules: (state, event) -> next state
    led.h             draws patterns on the LED
    buttons.h         debounced button presses
    app_link.h        WiFi, the web server and the WebSocket to the phone
    web_page.h        the phone app itself (HTML, CSS, JavaScript)
    secrets.h         your WiFi name and password (never committed)
    heart_doll.ino    this file: turns inputs into events, applies the
                      rules, and carries out the effects

  The ESP32 holds the one true state. The phone only sends requests
  and shows what the doll reports back.
*/

#include "config.h"
#include "state_machine.h"
#include "led.h"
#include "buttons.h"
#include "app_link.h"

// The single source of truth.
DollState state = STATE_IDLE;


// ---------------------------------------------------------------------
// Effects: what each state looks like, and what the phone is told
// ---------------------------------------------------------------------

// Each state has exactly one LED pattern.
void showState(DollState s) {
  switch (s) {
    case STATE_IDLE:      ledSetPattern(PATTERN_OFF);       break;
    case STATE_WAITING:   ledSetPattern(PATTERN_BREATHING); break;
    case STATE_CONNECTED: ledSetPattern(PATTERN_HEARTBEAT_SOFT); break;
    case STATE_DECLINED:  ledSetPattern(PATTERN_OFF);            break;
    case STATE_TOGETHER:  ledSetPattern(PATTERN_HEARTBEAT_FULL); break;
  }
}

// Tell the phone the current state, e.g. "status:waiting".
// Sent on every change (and, from Phase 3, whenever a phone connects).
void sendStatus() {
  char message[32];
  snprintf(message, sizeof(message), "status:%s", stateName(state));
  appLinkSend(message);
}


// ---------------------------------------------------------------------
// The one place where events are handled
// ---------------------------------------------------------------------
void handleEvent(DollEvent event) {
  DollState before = state;
  DollState after  = nextState(before, event);   // the rules decide

  // Log it: "[HEART button] idle -> waiting"
  Serial.print("[");
  Serial.print(eventName(event));
  Serial.print("] ");
  Serial.print(stateName(before));
  Serial.print(" -> ");
  Serial.print(stateName(after));
  Serial.println(after == before ? "  (no change)" : "");

  // Button presses are also one-off EVENTS for the phone (it shows a
  // banner), and they get the acknowledgement flash, even when the
  // state doesn't change: pressing Heart twice re-sends "available".
  if (event == EVENT_HEART) {
    appLinkSend("event:heart");
    ledFlash();
  } else if (event == EVENT_CROSS) {
    appLinkSend("event:cross");
    ledFlash();
  }

  // Only a real change updates the LED and the phone's status.
  if (after != before) {
    state = after;
    showState(state);
    sendStatus();
  }
}


// ---------------------------------------------------------------------
// setup() and loop()
// ---------------------------------------------------------------------
void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(500);   // only here: let the USB serial connect

  Serial.println();
  Serial.println("=== Heart Doll v1.1 - liquid heart ===");

  ledBegin();
  if (BOOT_COLOUR_CHECK) ledColourCheck();
  buttonsBegin();
  appLinkBegin();

  showState(state);
  sendStatus();
}

void loop() {
  unsigned long now = millis();

  // 1. Inputs become events. Nothing here ever waits.
  if (buttonPressed(BUTTON_HEART, now)) handleEvent(EVENT_HEART);
  if (buttonPressed(BUTTON_CROSS, now)) handleEvent(EVENT_CROSS);

  int fromPhone = appLinkReadEvent();
  if (fromPhone >= 0) handleEvent((DollEvent)fromPhone);

  // 2. Network housekeeping (never waits).
  appLinkUpdate(now);
  ledSetNoWifi(!appLinkOnline());   // blue blink while WiFi is down

  // 3. Output: redraw the LED when it's time.
  ledUpdate(now);
}
