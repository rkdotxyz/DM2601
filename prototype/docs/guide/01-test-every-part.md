# Phase 1: Test every part

**Goal:** prove every piece of hardware works on its own (the LED's colours, its fades, the two buttons, and WiFi with a phone) before writing the real firmware.

**Code:** [`firmware/tests`](../../firmware/tests): `01_rgb_led_test`, `02_led_patterns`, `03_buttons_test`, `04_wifi_test`

Do the four tests in order: each relies on what the one before proved. If something breaks later, rerun the test for just that part.

## Identify your parts

- **RGB LED:** three LEDs (red, green, blue) in one dome. The **longest leg is the common one**. The usual order is red, common, green, blue, but sellers vary; Test A confirms it.
- **Resistors:** 220 Ω is red-red-brown(-gold); 330 Ω is orange-orange-brown(-gold). Anything from 150 to 470 Ω works, either way round.
- **Tactile buttons:** the two legs on each side are always joined; pressing joins the two sides. Wiring to **diagonally opposite legs** always works.

## Wire it

Unplug USB while wiring. Wire the LED for Test A; add the buttons before Test C.

![Wiring diagram](../../hardware/wiring.svg)

| From | To | When |
|---|---|---|
| ESP32 GND | − rail | Test A |
| GPIO26 | 220 Ω → LED red leg | Test A |
| GPIO25 | 220 Ω → LED green leg | Test A |
| GPIO27 | 220 Ω → LED blue leg | Test A |
| LED common leg | − rail (or 3V3, if Test A shows common anode) | Test A |
| GPIO32 | Heart button → − rail | Before Test C |
| GPIO33 | Cross button → − rail | Before Test C |

> **About the red and green pins.** The diagram matches the finished firmware, where GPIO26 drives red. The test sketches still use the usual GPIO25 = red, so with this wiring Test A's RED and GREEN steps show the opposite colour. That's expected (it's how this build discovered its LED's legs were swapped). See [`firmware/tests/README.md`](../../firmware/tests/README.md).

Each button sits across the breadboard's centre channel: signal jumper on one corner, ground on the diagonally opposite corner. No resistors on the buttons; the ESP32's internal pull-ups do that job.

## Before you plug in USB

- [ ] Each resistor sits in line between its GPIO and its LED leg.
- [ ] The four LED legs are in four different rows.
- [ ] The common leg goes to the − rail for the first try, never to 5V or VIN.
- [ ] Nothing connects 3V3 directly to GND.
- [ ] Each button connects its GPIO to the − rail, never to 3V3.

## Test A: colours

`01_rgb_led_test` cycles red, green, blue, white, off, one second each, and prints what *should* be showing. Comparing what you read with what you see tells you the LED type and the leg order. `setChannel()` is the only place that knows about common anode vs cathode:

```cpp
void setChannel(int pin, bool on) {
  if (COMMON_ANODE) digitalWrite(pin, on ? LOW : HIGH);   // common leg on 3V3
  else              digitalWrite(pin, on ? HIGH : LOW);   // common leg on GND
}
```

| You see | It means | Do this |
|---|---|---|
| Colours match the printout | Common cathode, legs as expected | Keep `COMMON_ANODE = false` |
| Nothing ever lights | Probably common anode, with its plus leg on GND | Move the common leg to 3V3, set `COMMON_ANODE = true` |
| "RED" shows cyan, "OFF" is white | Common anode, but the setting says cathode | Set `COMMON_ANODE = true` |
| Right pattern, wrong colours | Legs in a different order | Note it: Phase 3 swaps the pins in `config.h` |

On this build: common cathode, and the leg on GPIO25 lit **green**.

## Test B: patterns

`02_led_patterns` draws every light pattern the doll uses. Type `w` (breathing), `c` (heartbeat), `n` (no-WiFi blink), `f` (flash) or `o` (off) and press Enter. Three ideas the whole project depends on:

- **PWM:** a pin is only on or off, so it's switched 5000 times a second; the fraction of time it's on sets the brightness.
- **Time, not `delay()`:** every pattern is a formula of `millis()`. `loop()` asks what time it is and sets the brightness for that instant, so nothing ever waits, and the same loop can later read buttons and WiFi.
- **Gamma:** eyes notice changes in dim light much more than in bright light, so the level is squared before it's written. Fades look even.

```cpp
float heartbeatLevel(unsigned long now) {
  float t   = (float)(now % BEAT_MS);
  float lub = bump(t, 120.0f, 55.0f);          // first, strongest pulse
  float dub = 0.6f * bump(t, 360.0f, 70.0f);   // second, softer pulse
  return HEART_FLOOR + (1.0f - HEART_FLOOR) * fmaxf(lub, dub);
}
```

Tune the feel here: the settings have the same names as in `config.h`, so you can copy them across.

## Test C: buttons

`03_buttons_test` prints one line per press and flashes the LED. Type `r` for RAW mode and press once: two or more counts for one press is **bounce**, the contacts rattling. Debouncing only accepts a new reading once it has held for 30 ms. `INPUT_PULLUP` makes a released button read HIGH and a pressed one LOW; "pressed = LOW" looks backwards at first, and it's normal.

## Test D: WiFi

1. Turn on your phone's hotspot. On iPhone: Settings → Personal Hotspot, and turn on **Maximize Compatibility** (2.4 GHz).
2. In `firmware/tests/04_wifi_test/`, copy `secrets.example.h` to `secrets.h` and fill in the hotspot's name and password, exactly.
3. Upload. The LED blinks blue while joining, then Serial Monitor prints the address.
4. Open it on a phone on the same network and tap **Red on** / **Red off**.

The ESP32 joins as a "station", gets an IP address, and announces `heartdoll.local` with mDNS. If the hotspot phone itself can't open the page, use a laptop or a second phone on the same hotspot.

## What to check

- [ ] Test A: you know your `COMMON_ANODE` value and which leg is which colour.
- [ ] Test B: breathing is slow and dim, the heartbeat is a clear lub-dub, and switching is instant.
- [ ] Test C: one line per press for both buttons, and one flash.
- [ ] Test D: tapping Red on / Red off on the phone switches the LED within about a second.

**Next:** [Phase 2, the state machine](02-state-machine-offline.md).
