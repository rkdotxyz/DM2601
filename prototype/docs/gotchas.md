# Gotchas

Pitfalls worth knowing before you start. Some were hit during this build; the rest were planned around from the start.

## Hardware
- **RGB LED legs aren't always in the usual order.** The usual order is red, common, green, blue, but on the LED this was built with, the leg on GPIO25 lit green. The fix was in software: `config.h` swaps `PIN_RED` and `PIN_GREEN`, and a red-green-blue colour check runs at every start-up so you can see it's right. If yours differs, swap the numbers until the check matches.
- **Common anode or common cathode.** The two kinds are wired and driven the opposite way round. If the LED is lit when it should be dark, or "RED" shows cyan, set `COMMON_ANODE = true` and move the common leg to 3V3. `01_rgb_led_test` tells you which you have.
- **Tactile buttons have two pairs of legs that are always joined.** Wired across a joined pair, a button reads pressed all the time, or never. Connect to diagonally opposite legs: that always goes through the switch, whichever way the button is turned.
- **Pins that bite.** GPIO 0, 2, 12 and 15 affect booting, and GPIO 34–39 are input-only with no internal pull-up (a button there floats and triggers randomly). This build uses 25, 26, 27 for the LED and 32, 33 for the buttons, which avoid both.
- **Split breadboard rails.** On many long breadboards each power rail is split halfway along. A ground rail can look continuous and not be.
- **Green and blue look dimmer than red** at 3.3 V. That's normal; red does the work here, and the no-phone blue is set brighter (`NOPHONE_LEVEL`) to compensate.
- **Two LED legs in one breadboard row are shorted together.** Give each leg its own row.

## Software
- **esp32 board package 3.x is required.** The LED code uses `ledcAttach()` / `ledcWrite(pin, …)`, which changed in 3.0. On 2.x you get `'ledcAttach' was not declared`.
- **Web server libraries.** Use **ESP Async WebServer** and **Async TCP**, both by **ESP32Async**. Several older libraries have nearly the same names; mixing them causes pages of errors inside the library. Remove any copy by another author.
- **Never use `delay()` for animation.** A heartbeat drawn with `delay()` blocks the ESP32 for most of every second, so presses and phone messages get missed. Every pattern here is a function of `millis()`. The one `delay()` is the start-up colour check, which runs before anything else needs the loop.
- **Network messages arrive on another task.** Don't act on a WebSocket message inside its handler. Park it, and let `loop()` pick it up (see [architecture](architecture.md#two-tasks-one-decision-maker)).
- **Custom types in function signatures need a header.** Functions that take `DollState` compile because the enum lives in `state_machine.h`, included at the top of the `.ino`. Defined further down an `.ino`, the IDE's auto-generated prototypes break on it.
- **`secrets.h` missing.** A fresh clone builds with the placeholders in `secrets.example.h` and prints a note while compiling. The doll's network then uses the example's name and password, which anyone reading the repo knows. Copy the example to `secrets.h` and choose your own.
- **"Sketch too big".** The 3D app needs **Tools → Partition Scheme → Huge APP (3MB No OTA/1MB SPIFFS)**. The default scheme has room for about 1.3 MB; the sketch is about 1.46 MB.
- **Changed the app, but the doll shows the old one?** The doll serves `web_page.h`, which is only rewritten by `npm run build:doll` in `prototype/app`. Run it, then upload again.

## The doll's own WiFi
- **The password needs 8 or more characters.** Shorter, and the doll's WiFi doesn't start (Serial Monitor says so).
- **On iPhone, tap Done, not Cancel.** The pop-up that opens the app shows **Cancel** for a moment, until the app has loaded; then **Done**. Cancel leaves the network. If it keeps showing Cancel, close it, stay on the network, and open `http://192.168.4.1` in Safari.
- **No internet while you're on it.** The doll's network has none. Android may ask "Stay connected?": say yes. Mobile data may still work alongside.
- **Your phone remembers the doll's network** and rejoins by itself, taking the one place. To hand over, turn WiFi off or tap "Forget this network".
- **A second phone can't join** while someone has the doll. That's on purpose (`MAX_PHONES` in `config.h`).
- **No tilt on the doll's page.** Phones only share the motion sensor with secure (`https`) pages, and the doll's page is `http`. The scene follows your finger instead. Tilt works on the GitHub Pages demo.
- **The photo button may not work in the pop-up.** Some sign-in windows can't open the photo library. Open `http://192.168.4.1` in the browser to pick a photo; that browser remembers it.

## WiFi and the phone (hotspot mode)
- **2.4 GHz only.** The ESP32 can't see 5 GHz networks. On an iPhone hotspot, turn on **Maximize Compatibility**, and keep the Personal Hotspot screen open while the doll joins; iPhones hide an idle hotspot.
- **No eduroam.** Enterprise logins are hard for the ESP32. Use a phone hotspot or a normal home network.
- **Curly apostrophes.** iPhone hotspot names like "Name’s iPhone" use a curly ’, not a straight '. Copy the name exactly, or rename the phone.
- **The hotspot phone may not reach the doll.** Some hotspots keep the host phone from talking to devices on it. If the page won't load on the hotspot phone, open it on a laptop or a second phone joined to the same hotspot.
- **`heartdoll.local` doesn't work everywhere.** iPhones and Macs support `.local` names; Android support varies. The IP address printed in Serial Monitor always works.
- **Type `http://`, not `https://`.** The doll only serves plain HTTP. Safari may call the page "Not Secure"; it's a local page with no internet involved.
- **The page only updates while it's open.** A web page can't notify you from the background. Keep it open on screen for the demo.
- **Reload after uploading new firmware.** The browser may keep the old page. An old page doesn't understand new statuses.
- **Vibration is Android only.** iPhones ignore web vibration silently.

## Arduino IDE and Serial Monitor
- **Typed commands need Enter.** Type in the message box at the top of Serial Monitor and press Enter.
- **Gibberish in Serial Monitor:** set it to 115200 baud. **Empty:** the start message printed before it opened; press **EN**.
- **No port listed:** a charge-only USB cable, or a missing driver for the board's USB chip (CP2102 or CH340).
- **"Failed to connect" while uploading:** hold **BOOT** while the IDE shows `Connecting...`, and close any other program using the port.
- **`.h` tab names are exact.** `config.h`, not `Config.h` or `config.h.txt`, all in the `heart_doll` folder. A tab created as `.cpp` instead of `.h` causes `multiple definition` errors.
