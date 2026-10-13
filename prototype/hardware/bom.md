# Parts list

## Built so far (v1.1)

| Part | Qty | Notes |
|---|---|---|
| ESP32 dev board (DevKit V1 / WROOM-32) | 1 | Any ESP32 with GPIO 25, 26, 27, 32 and 33 broken out |
| RGB LED, 4-pin, 5 mm | 1 | Common cathode (common anode also works, see [`config.h`](../firmware/heart_doll/config.h)). The longest leg is the common one |
| Resistor, 220 Ω | 3 | One per colour leg (red-red-brown-gold). Anything from 150 to 470 Ω works |
| Tactile pushbutton, momentary | 2 | Heart and Cross. 6 mm or 12 mm, 4 legs |
| Breadboard + male-to-male jumper wires | – | |
| Micro-USB **data** cable | 1 | Charge-only cables won't show up as a port |
| Phone or laptop with a browser | 1 | Runs the phone app. No install |
| A 2.4 GHz WiFi network | 1 | A phone hotspot works. The ESP32 can't use 5 GHz or eduroam-style enterprise logins |

No resistors on the buttons: the firmware uses the ESP32's internal pull-ups.

**Why 220 Ω:** the pin gives 3.3 V and a red LED drops about 2.0 V, leaving 1.3 V across the resistor: 1.3 V ÷ 220 Ω ≈ 6 mA. Bright enough, and well under the pin's limit. Green and blue drop about 3 V, so they look dimmer at 3.3 V. That's fine here: red does the work.

## Planned (later phases)

Not part of the current build. Listed so the plan is in one place; see [the roadmap](../README.md#roadmap).

| Part | For |
|---|---|
| DRV2605L haptic driver breakout + coin LRA vibration motor (8–10 mm) | A heartbeat you can feel (I²C on GPIO 21/22) |
| DFPlayer Mini + microSD card (32 GB or smaller, FAT32) + 3 W speaker (4 or 8 Ω, 28–40 mm) + 470 µF capacitor | Heartbeat sound, chime, lullaby, a recorded goodnight |
| A soft doll to hack | The enclosure |
| Power bank, or LiPo + charger | Running untethered |
