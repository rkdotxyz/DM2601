# Build log

What happened in each phase. The step-by-step version for rebuilding it is the [build guide](guide/README.md).

## Phase 1: Test every part

**Date:** 2026-10-07

**Board and tools**
- ESP32 DevKit (WROOM-32), Arduino IDE 2.x, esp32 board package 3.3.x
- Libraries: ESP Async WebServer and Async TCP, both by ESP32Async (already used on the [ESP32 LED Snake](https://github.com/rkdotxyz/esp32-led-snake) build)

**Wiring**
- GPIO25, 26, 27 → 220 Ω → the LED's colour legs; LED common leg → − rail
- GPIO32 → Heart button → − rail; GPIO33 → Cross button → − rail
- ESP32 GND → − rail

**What I did**
- `01_rgb_led_test`: cycled red, green, blue, white, off to find the LED type and leg order.
- `02_led_patterns`: drew every pattern the doll would use, with PWM and `millis()` instead of `delay()`: breathing, lub-dub heartbeat, no-WiFi blink, flash.
- `03_buttons_test`: debounced presses, with a RAW mode to see contact bounce.
- `04_wifi_test`: joined a phone hotspot and served a page with Red on / Red off, reachable at the IP or `heartdoll.local`.

**Results**
- Common cathode: `COMMON_ANODE = false`.
- Phone → WiFi → ESP32 → LED works on a 2.4 GHz phone hotspot.

**Result**
- [x] All four tests pass


## Phase 2: The state machine, offline

**Date:** 2026-10-07

**What I did**
- Started the real firmware, `firmware/heart_doll`, as six files: `config.h`, `state_machine.h`, `led.h` (from Test B), `buttons.h` (from Test C), `app_link.h` and `heart_doll.ino`.
- Wrote the rules as one function, `nextState()`, that only decides and never touches the LED or the network.
- Let the Serial Monitor play the phone: `a` = available, `u` = unavailable, with every message the doll would send printed as `-> phone: ...`.
- Three states at this point: Idle, Waiting (doll person pressed Heart) and Connected (phone person available), with "latest action wins".

**Result**
- [x] Both user flows work from the buttons and Serial Monitor (v0.5)


## Phase 3: The phone app (v1.0)

**Date:** 2026-10-07

**What I did**
- Replaced `app_link.h` with a WiFi + web server + WebSocket version with the same functions, so `heart_doll.ino` barely changed.
- Added `web_page.h`, the phone app served by the doll, and `secrets.h` for the hotspot details.
- Network messages are parked by the WebSocket handler and picked up by `loop()`, so all decisions still happen in `handleEvent()`.
- Added a blue blink while WiFi is down, and "Doll offline" on the phone when the link drops; both recover by themselves.
- Added a fourth state, Together, for when both people are available, shown as a calmer 40 BPM heartbeat.

**What broke and how I fixed it**
- **The heart glowed green.** This LED's red and green legs are the other way round from the usual order. Swapped `PIN_RED` and `PIN_GREEN` in `config.h` instead of rewiring, and added a red-green-blue colour check at every start-up to prove it.

**Result**
- [x] Both flows work between a phone and the doll, live, in both directions


## Phase 4: A heart that fills (v1.1)

**Date:** 2026-10-09

**What I did**
- Rebuilt the phone app from my own sketch: the doll person (Them) and the phone person (You) joined to a heart by squiggly pipes. A pipe draws itself when its person becomes available, and the heart fills like a container: from the bottom for You, with drops from the top for Them. Full, it glows and beats.
- Replaced the calm 40 BPM beat with brightness: the same 60 BPM heartbeat at 60% when only the phone person is available, 100% when both are. Same rhythm, different strength.
- Rewrote the rules so each person's availability is their own: Cross now means "not now" (a fifth state, Declined) instead of ending everything, and asking again clears it.
- Checked every cell of the five-state rulebook in a simulation of the firmware.

**Result**
- [x] All cases in the [rulebook](architecture.md#the-state-machine) behave as intended on the doll and the phone


## Repo clean-up

**Date:** 2026-10-13

- Moved the prototype into the DM2601 repo: test sketches into `firmware/tests/`, wiring and parts into `hardware/`, docs into `docs/`.
- `secrets.h` is no longer committed. Each sketch that needs WiFi ships `secrets.example.h` and falls back to it, so a fresh clone builds.
- Wrote the README, parts list, wiring diagram, architecture, protocol, gotchas, build guide and this log.
- Compile-checked every sketch with Arduino IDE 2.3.10, esp32 3.3.12, Async TCP 3.5.0 and ESP Async WebServer 3.12.1. With the same `secrets.h`, the firmware builds to exactly the same size as before the move.
