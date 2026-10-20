# Phase 5: Its own WiFi (v1.2)

**Goal:** no hotspot, no internet. The doll makes its own WiFi; scan its QR sticker and the app opens by itself. One phone at a time, a blue blink when no phone is there, and the 3D app.

**Code:** [`firmware/heart_doll`](../../firmware/heart_doll) (`app_link.h`, `config.h`, `heart_doll.ino`) and [`app`](../../app)

No wiring changes.

## The idea

- **The doll as an access point.** Until now the doll *joined* a network, like a laptop. Now it *makes* one, like a router: `WiFi.softAP()` starts a network called "HeartDoll" at `192.168.4.1`. Phones join it directly. Nothing else is involved, so it works in a classroom where the doll can't use the university WiFi, with one phone, anywhere.
- **A captive portal.** Right after joining any WiFi, a phone fetches a known address to check for internet. The doll runs a tiny DNS server that answers every name with itself, and replies to that check with "go to the app". The phone decides it's a sign-in network, like hotel WiFi, and opens the app by itself. Once the app is open, the doll answers the check the way the internet would, so the phone stays.
- **One phone at a time.** `softAP()` takes the number of phones allowed to join: one. A phone that goes quiet is dropped after a minute, so the place frees up.
- **The app in the firmware.** The 3D app is a React project ([`app/`](../../app)). `npm run build:doll` builds it into one file, gzips it, and writes the bytes into `web_page.h`. The doll sends them as they are, and the phone's browser unpacks them.

```cpp
WiFi.mode(WIFI_AP);
WiFi.softAPConfig(APP_DOLL_IP, APP_DOLL_IP, IPAddress(255, 255, 255, 0));
WiFi.softAP(DOLL_WIFI_NAME, DOLL_WIFI_PASSWORD, DOLL_WIFI_CHANNEL, 0, MAX_PHONES);
appDns.start(53, "*", APP_DOLL_IP);   // every name -> the doll
```

## Steps

1. In `firmware/heart_doll/secrets.h` (copy it from `secrets.example.h` if you don't have one), choose `DOLL_WIFI_NAME` and `DOLL_WIFI_PASSWORD`. The password needs at least 8 characters.
2. In Arduino IDE: **Tools → Partition Scheme → Huge APP (3MB No OTA/1MB SPIFFS)**. The app is about 490 KB, and the default scheme leaves too little room.
3. Upload. Serial Monitor prints `The doll's WiFi is on: HeartDoll`, and the LED blinks blue: no phone yet.
4. On your phone, join "HeartDoll" (in WiFi settings, or with the QR sticker below). The app pops up. On an iPhone, wait for the button at the top to say **Done**, then tap it.
5. Make the QR sticker (needs [Node.js](https://nodejs.org)): in `prototype/app`, run `npm install`, then `npm run qr`. Print `qr/sticker.html` at 100%.

To use your hotspot as before, set `WIFI_MODE = WIFI_HOTSPOT` in `config.h`.

## What to check

- [ ] At start-up, the LED blinks blue every 2 s.
- [ ] Joining "HeartDoll" opens the app by itself; the blue blink stops.
- [ ] Every flow from [Phase 4](04-heart-that-fills.md#what-to-check) still works: Heart, Cross, tapping your photo.
- [ ] Liquid always goes down the tube before it fills the heart, and drains from the heart before the tube.
- [ ] A second phone can't join the WiFi while the first is on it.
- [ ] Available on the phone, then turn its WiFi off: within a few seconds the blue blink returns, and the phone person's heartbeat goes (the doll breathes if its person pressed Heart, otherwise it's dark). After a minute, the doll counts them as stepped away.
- [ ] Turn the WiFi back on within the minute: the app reconnects, and the heartbeat comes back by itself.
- [ ] The second phone can now join, and the app opens.

## Tuning

| Setting | Where | Default | Effect |
|---|---|---|---|
| `WIFI_MODE` | `config.h` | `WIFI_OWN_NETWORK` | The doll's own WiFi, or `WIFI_HOTSPOT` to join yours |
| `MAX_PHONES` | `config.h` | 1 | Phones allowed at once (1–4) |
| `WIFI_IDLE_DROP_S` | `config.h` | 60 | Seconds before a quiet phone is dropped from the doll's WiFi |
| `PHONE_PING_S` / `PHONE_SILENT_S` | `config.h` | 2 / 6 | How often the doll checks a quiet app connection, and how long without an answer before it counts the phone as gone (blue blink) |
| `PHONE_GONE_MS` | `config.h` | 60000 | How long without a phone before the phone person counts as stepped away |
| `DOLL_WIFI_CHANNEL` | `config.h` | 6 | Try 1 or 11 if the network is crowded |

## If something's wrong

| Symptom | Likely cause and fix |
|---|---|
| "Sketch too big" when uploading | Choose the Huge APP partition scheme (step 2) |
| No "HeartDoll" network appears | Check Serial Monitor. "couldn't start the doll's WiFi" means the password is shorter than 8 characters |
| The app doesn't pop up | Some phones skip the check. Open `http://192.168.4.1` |
| iPhone pop-up only shows Cancel | The app is still loading (about 490 KB), so wait a moment. If it stays on Cancel, don't tap it (that leaves the network): swipe home, stay on HeartDoll, and open `http://192.168.4.1` in Safari |
| Android asks "Stay connected?" | Tap yes. The doll's network has no internet, on purpose |
| "Someone else is with the doll" | Another phone has it. When it leaves, you join by yourself |
| The doll still shows the old app | Run `npm run build:doll` in `prototype/app`, then upload again |

**This is v1.2, the current version.** What comes next is in the [roadmap](../../README.md#roadmap).
