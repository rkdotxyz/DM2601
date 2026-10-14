# Build guide

A step-by-step guide to building the Heart Doll prototype from scratch: from testing each part on a breadboard to a doll whose heart you can light from your phone.

It's written for someone new to physical computing. Each phase adds one thing, ends with a check you can see on the LED or the phone, and includes what went wrong the first time it was built.

## What you need

**Hardware** (full list in [`hardware/bom.md`](../../hardware/bom.md))

- ESP32 dev board (DevKit V1 / WROOM-32)
- 4-pin RGB LED and 3 × 220 Ω resistors
- 2 tactile pushbuttons
- Breadboard, jumper wires, a micro-USB **data** cable
- A phone with a browser. Phases 3–4 also need a 2.4 GHz WiFi network (a phone hotspot works); from Phase 5 the doll makes its own

**Software**

- Arduino IDE 2.x, with the **esp32** board package by Espressif, **version 3.x**
- Libraries: **ESP Async WebServer** and **Async TCP**, both by **ESP32Async** (Sketch → Include Library → Manage Libraries). Older libraries have nearly the same names; check the author.

- From Phase 5: the **Huge APP** partition scheme (Tools → Partition Scheme), and [Node.js](https://nodejs.org) only if you change the app or make the QR sticker

Compile-checked with Arduino IDE 2.3.10, esp32 3.3.12, Async TCP 3.5.0 and ESP Async WebServer 3.12.1.

## The phases

| # | Phase | You end up with | Code |
|---|---|---|---|
| 1 | [Test every part](01-test-every-part.md) | LED type and colours known, patterns tuned, buttons debounced, WiFi proven | [`firmware/tests`](../../firmware/tests) |
| 2 | [The state machine, offline](02-state-machine-offline.md) | The doll's rules running, with Serial Monitor playing the phone | [`firmware/heart_doll`](../../firmware/heart_doll) |
| 3 | [The phone app](03-phone-app.md) | The doll on WiFi, serving its own app, live in both directions | [`firmware/heart_doll`](../../firmware/heart_doll) |
| 4 | [A heart that fills](04-heart-that-fills.md) | The liquid-heart app and the five-state rules (v1.1) | [`firmware/heart_doll`](../../firmware/heart_doll) |
| 5 | [Its own WiFi](05-its-own-wifi.md) | The doll's own network with a QR sticker and captive portal, one phone at a time, and the 3D app (v1.2) | [`firmware/heart_doll`](../../firmware/heart_doll), [`app`](../../app) |

Phases 2–5 all use the finished firmware. It was built up in four steps, and the guide explains each step's part of it; where an earlier version differed, the phase says how. The [build log](../build-log.md) records what happened in each phase.

## Conventions

- Serial Monitor always runs at **115200 baud**. Type commands in the box at the top and press Enter.
- "Upload" means pressing Upload in Arduino IDE with **ESP32 Dev Module** (or **DOIT ESP32 DEVKIT V1**) selected as the board.
- Unplug USB whenever you change the wiring.
- Each phase ends with a **What to check** list. Don't move on until everything in it works.

Also useful along the way: [gotchas](../gotchas.md), the [architecture](../architecture.md) and the [protocol](../protocol.md).
