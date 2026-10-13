/*
  state_machine.h  -  Heart Doll: the rules, and nothing else

  The doll is always in exactly one STATE. Things that happen are
  EVENTS. nextState() is the whole rulebook: given the current state
  and an event, it returns the next state.

  It only decides; it never touches the LED, the buttons or the network.
  That separation is deliberate:
    - the rules can be read in one screen and checked against the plan,
    - the same rules work whether events come from buttons, the Serial
      Monitor, a WebSocket (Phase 3) or MQTT (later).

  The idea behind the rules
  -------------------------
  Each person's availability belongs to them, and stays until THEY
  change it:
    - Doll person:  Heart = available,  Cross = "not now".
    - Phone person: tap avatar on = available, tap off = steps away.
  "Not now" answers the phone person's current request. If they ask
  again (tap off, then on), it's cleared and the doll shows them again.

  The five states:
     IDLE       nobody available                     LED off
     WAITING    only the doll person available       slow breathing
     CONNECTED  only the phone person; doll hasn't
                answered yet                         heartbeat 60%
     DECLINED   phone person available; doll person
                said "not now" (Cross)               LED off
     TOGETHER   both available, in either order      heartbeat 100%
*/
#pragma once
#include <Arduino.h>

// The five states. (An enum is a list of named numbers:
// STATE_IDLE is 0, STATE_WAITING is 1, and so on.)
enum DollState {
  STATE_IDLE,        // Nobody available. LED off.
  STATE_WAITING,     // Only the doll person pressed Heart. Slow breathing.
  STATE_CONNECTED,   // Only the phone person is available. Heartbeat at 60%.
  STATE_DECLINED,    // Phone person available, doll person said "not now". LED off.
  STATE_TOGETHER     // Both available, in either order. Heartbeat at 100%.
};

// Everything that can happen.
enum DollEvent {
  EVENT_HEART,             // Heart button pressed on the doll
  EVENT_CROSS,             // Cross button pressed on the doll
  EVENT_APP_AVAILABLE,     // phone person tapped their avatar on
  EVENT_APP_UNAVAILABLE    // phone person tapped their avatar off
};

// The rulebook. Matches the table on the Phase 4 page.
DollState nextState(DollState current, DollEvent event) {
  // Two facts describe the phone person in every state:
  bool phoneAvailable = (current == STATE_CONNECTED ||
                         current == STATE_DECLINED  ||
                         current == STATE_TOGETHER);

  switch (event) {
    case EVENT_HEART:
      // The doll person is available. Joined with the phone person if
      // they're there (this also overrides an earlier "not now").
      return phoneAvailable ? STATE_TOGETHER : STATE_WAITING;

    case EVENT_CROSS:
      // "Not now". The phone person stays available, but the doll goes
      // dark: they've had their answer.
      return phoneAvailable ? STATE_DECLINED : STATE_IDLE;

    case EVENT_APP_AVAILABLE:
      // The phone person is available, or asking again after "not now".
      if (current == STATE_WAITING || current == STATE_TOGETHER) return STATE_TOGETHER;
      return STATE_CONNECTED;   // from Idle, or a fresh ask after Declined

    case EVENT_APP_UNAVAILABLE:
      // The phone person steps away. The doll person keeps their own
      // status: from a full heart, the doll goes back to breathing.
      if (current == STATE_TOGETHER || current == STATE_WAITING) return STATE_WAITING;
      return STATE_IDLE;
  }
  return current;   // unreachable, but keeps the compiler happy
}

// Names for the Serial Monitor and for messages to the phone.
// Lowercase, because these exact words go into "status:..." messages.
const char* stateName(DollState s) {
  switch (s) {
    case STATE_IDLE:      return "idle";
    case STATE_WAITING:   return "waiting";
    case STATE_CONNECTED: return "connected";
    case STATE_DECLINED:  return "declined";
    case STATE_TOGETHER:  return "together";
  }
  return "?";
}

const char* eventName(DollEvent e) {
  switch (e) {
    case EVENT_HEART:           return "HEART button";
    case EVENT_CROSS:           return "CROSS button";
    case EVENT_APP_AVAILABLE:   return "phone: available";
    case EVENT_APP_UNAVAILABLE: return "phone: unavailable";
  }
  return "?";
}
