# Heart Doll

A doll whose heart glows when someone far away is there for you. An ESP32 inside, one RGB LED for the heart, a **Heart** and a **Cross** button, and a phone app for the other person, served by the doll itself over its own WiFi. No app to install, no hotspot, no internet: scan the doll's QR code and the app opens.

**Try the app without a doll:** https://rkdotxyz.github.io/DM2601/app/

Built as the prototype for DM2601 at KTH, exploring pre-sleep rituals for people who have moved abroad. See the [repo overview](../README.md).

<!-- When the demo GIF is ready, replace this comment with:
![The Heart Doll's LED and the phone app, filling together](docs/media/demo.gif)
-->

## Features

- **Two people, one heart.** The doll person presses Heart when they're available; the phone person taps their photo. Each person's availability is their own until they change it.
- **A heart you can read at a glance:** slow red breathing when the doll person is waiting, a lub-dub heartbeat at 60% when the phone person is there, 100% when you both are.
- **"Not now":** Cross darkens the doll without switching the other person off. Asking again clears it.
- **A 3D phone app:** the doll and your photo, joined to a glass heart by glass tubes. Liquid flows down each person's tube and fills their half of the heart; full, it glows and beats with the doll. Sound, haptics and tilt. See [`app/`](app).
- **Its own WiFi:** the doll makes a network, "HeartDoll". Scan the QR sticker, and the app pops up by itself (a captive portal, like hotel WiFi). Or join your hotspot, as before, with one setting.
- **One phone at a time:** a second phone can't join while someone has the doll. When they leave, the next person scans and joins.
- **Always in sync:** the doll holds the one true state. A page opened late or reloaded shows the same thing.
- **Clear feedback:** a white flash for every button press, a blue blink while no phone has the app open, "Can't reach the doll" on the phone. Both reconnect by themselves. A phone gone for a minute counts as stepping away.

## How it works

```mermaid
flowchart LR
  phone["Phone browser"] <-- "the doll's own WiFi + WebSocket" --> esp["ESP32"]
  buttons["Heart + Cross buttons"] --> esp
  esp --> led(("RGB LED heart"))
```

The ESP32 makes its own WiFi network, serves the phone app (the React app in [`app/`](app), compressed into the firmware), and keeps a live WebSocket open to the phone: requests come in, status and button events go out. The rules are one function (`nextState()`) that never touches the LED or the network; everything else (buttons, LED patterns, the phone link) is a separate module around it. See [architecture](docs/architecture.md) and the [protocol](docs/protocol.md) for details.

| State | Doll person | Phone person | LED |
|---|---|---|---|
| Idle | – | – | Off |
| Waiting | available | – | Slow breathing |
| Connected | hasn't answered | available | Heartbeat, 60% |
| Declined | "not now" | available | Off |
| Together | available | available | Heartbeat, 100% |

## What you need

| Part | Notes |
|---|---|
| ESP32 dev board (DevKit V1 / WROOM-32) | |
| 4-pin RGB LED | Common cathode, or common anode with one setting changed |
| 3 × 220 Ω resistors | One per colour leg; 150–470 Ω works |
| 2 × tactile pushbuttons | Heart and Cross |
| Breadboard, jumper wires, micro-USB data cable | |
| A phone | Any phone with a browser. No hotspot or internet needed |

Full parts list, including what's planned for later: [`hardware/bom.md`](hardware/bom.md).

![Wiring diagram](hardware/wiring.svg)

<!-- When the wiring photo is ready, add:
![My wiring](docs/media/wiring.jpg)
-->

## Build and upload

1. Install **Arduino IDE 2**, the **esp32** board package by Espressif (**3.x**), and the libraries **ESP Async WebServer** and **Async TCP** (both by ESP32Async).
2. Wire it as above.
3. In `firmware/heart_doll/`, copy `secrets.example.h` to `secrets.h`. Choose the doll's WiFi name and password (`DOLL_WIFI_NAME`, `DOLL_WIFI_PASSWORD`, at least 8 characters). `secrets.h` is ignored by git.
4. Open `firmware/heart_doll/heart_doll.ino` and choose **ESP32 Dev Module** (or **DOIT ESP32 DEVKIT V1**).
5. **Tools → Partition Scheme → Huge APP (3MB No OTA/1MB SPIFFS).** The 3D app doesn't fit the default scheme; without this, the upload stops with "Sketch too big".
6. Upload.
7. Open Serial Monitor at **115200 baud** and watch the start-up colour check: red, green, blue. If the colours don't match the names printed, swap `PIN_RED` / `PIN_GREEN` / `PIN_BLUE` in [`config.h`](firmware/heart_doll/config.h). For a common-anode LED, set `COMMON_ANODE = true`.

**The QR sticker:** with [Node.js](https://nodejs.org) installed, run `npm install` then `npm run qr` in [`app/`](app). It reads your `secrets.h` and writes a sticker to print in `app/qr/`.

**Changing the app:** edit [`app/`](app), run `npm run build:doll` there (it rewrites `web_page.h`), and upload again. You don't need Node.js to flash the doll: `web_page.h` is in the repo.

**Your hotspot instead:** set `WIFI_MODE = WIFI_HOTSPOT` in [`config.h`](firmware/heart_doll/config.h) and fill in `WIFI_SSID` / `WIFI_PASSWORD`. The doll then joins your network as before v1.2.

New to this? The **[step-by-step build guide](docs/guide/README.md)** starts from testing each part on its own.

Compile-checked with Arduino IDE 2.3.10, esp32 3.3.12, Async TCP 3.5.0 and ESP Async WebServer 3.12.1.

## How to use it

1. Power the ESP32 over USB. After the colour check, the doll starts its WiFi, and the LED blinks blue: no phone yet.
2. **Scan the QR sticker** with the phone's camera (or join "HeartDoll" in WiFi settings). The phone joins, and the app pops up by itself. If it doesn't, open **http://192.168.4.1**. The blue blink stops.
3. **On the doll:** press **Heart** when you're available (the LED breathes), **Cross** for "not now" (the LED goes dark). Every press flashes white.
4. **On the phone:** tap your photo (bottom) to become available or step away. Liquid flows from your side into the heart, and from theirs when they press Heart.
5. Both available: the heart on the phone is full and beating, and the doll's heartbeat is at full brightness.
6. **Handing over:** the doll takes one phone at a time. Turn your phone's WiFi off, or "Forget" the network, and the next person can scan. A phone that just walks away is dropped after a minute, and then counts as stepped away.

No phone handy? Type `a` (available) or `u` (unavailable) in Serial Monitor to play the phone. (With no phone connected, the doll sets you back to unavailable after a minute.)

<!-- When screenshots are ready, add:
<img src="docs/media/app-half.png" width="260" alt="Heart half full"> <img src="docs/media/app-full.png" width="260" alt="Heart full">
-->

## Project structure

```
app/                   the phone app (React + React Three Fiber), and the QR sticker script
firmware/heart_doll/   the firmware (open heart_doll.ino in Arduino IDE)
firmware/tests/        four small sketches for bringing up and debugging the hardware
hardware/              parts list and wiring diagram
docs/                  build guide, architecture, protocol, story, build log, gotchas
```

Inside `firmware/heart_doll/`:

| File | Job |
|---|---|
| `heart_doll.ino` | Turns inputs into events, applies the rules, carries out the effects |
| `state_machine.h` | The rules, and nothing else |
| `led.h` | Draws the light patterns |
| `buttons.h` | Debounced button presses |
| `app_link.h` | The doll's WiFi, the captive portal, the web server and the WebSocket |
| `web_page.h` | The phone app, built from [`app/`](app) and compressed. Generated by `npm run build:doll` |
| `config.h` | Every setting: pins, timings, brightness |
| `secrets.example.h` | Template for `secrets.h` (your WiFi details) |

## Documentation

- **[Build guide](docs/guide/README.md):** the prototype in five phases, from testing parts to the doll's own WiFi.
- **[The story of the build](docs/story.md):** context, decisions, and what changed along the way.
- **[Architecture](docs/architecture.md)** and the **[doll ↔ phone protocol](docs/protocol.md)**.
- **[Gotchas](docs/gotchas.md):** pitfalls worth knowing before you start.
- **[Build log](docs/build-log.md):** what happened in each phase.
- **[Test sketches](firmware/tests/README.md):** what each one checks and when to use it.

## Versions

| Version | What's new |
|---|---|
| v1.2 | The doll's own WiFi with a captive portal and a QR sticker; one phone at a time; blue blink means no phone; the 3D app |
| v1.1 | Liquid-heart phone app; heartbeat at 60% / 100%; Cross means "not now" (Declined) |
| v1.0 | Phone app over WiFi and WebSocket; Together state; start-up colour check; offline blink |
| v0.5 | The state machine, with Serial Monitor standing in for the phone |
| v0.1 | Hardware tests: LED, patterns, buttons, WiFi |

## Roadmap

Planned, not built yet:

| Version | Phase |
|---|---|
| v1.3 | A heartbeat you can feel: DRV2605L haptic driver and an LRA motor |
| v1.4 | Music and voice: DFPlayer Mini, heartbeat sound, chime, a recorded goodnight, quiet hours |
| v1.5 | Robustness: reconnects under stress, an optional Waiting timeout, a stress test |
| v1.6 | Into the doll: perfboard, a diffused LED, strain relief |
| v2.0 | Cloud relay over MQTT, so the phone works from anywhere. The doll joins home WiFi, set up through its own network |
| v2.1 | Battery and a power switch |

## License

The code is MIT; see [`LICENSE`](../LICENSE). Documentation and images are [CC BY 4.0](../LICENSE-CC-BY-4.0.txt).
