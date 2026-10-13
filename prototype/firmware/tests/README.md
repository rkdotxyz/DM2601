# Test sketches

Four small, single-purpose sketches used to bring the hardware up one part at a time: the LED's colours, its fades, the two buttons, and WiFi with a phone. Each one checks one thing, so when something stops working later, they're the quickest way to tell a wiring fault from a logic bug.

Open any of them in Arduino IDE, upload, and open Serial Monitor at **115200 baud**. Press the board's **EN** button if the start message was missed.

| Sketch | Checks | Wiring needed | You should see |
|---|---|---|---|
| `01_rgb_led_test` | LED type (common anode or cathode) and which leg is which colour | LED + 3 resistors | The LED cycles red, green, blue, white, off, one second each, matching the `Now showing:` lines |
| `02_led_patterns` | PWM dimming and every light pattern the doll uses | Same | Type `w` (breathing), `c` (heartbeat), `n` (no-WiFi blink), `f` (flash), `o` (off) and press Enter. Switching is instant, never a stutter |
| `03_buttons_test` | Pull-ups and debouncing | Add the 2 buttons | One `HEART pressed (#n)` or `CROSS pressed (#n)` line per press, and one white flash. Type `r` for RAW mode to watch bounce, `d` to go back |
| `04_wifi_test` | WiFi, the IP address and `heartdoll.local`, a web page served by the ESP32 | Same | The LED blinks blue while joining, then the address prints. Opening it on a phone, **Red on** / **Red off** switch the LED |

Wiring for all four: [`hardware/wiring.svg`](../../hardware/wiring.svg).

## Before you run them

- **`COMMON_ANODE`** is set near the top of every sketch, separately. Set it from Test A's result in each one, and in [`config.h`](../heart_doll/config.h).
- **Red and green pins.** The tests use the usual mapping, GPIO25 = red and GPIO26 = green. On the LED this was built with, those two legs turned out to be the other way round, so the main firmware swaps them in `config.h` (GPIO26 = red). Wired as in the diagram, Test A's RED and GREEN steps show the opposite colour. That's expected, and exactly how the swap was found. Swap `PIN_RED` and `PIN_GREEN` at the top of a test if you want its names to match.
- **`04_wifi_test` needs WiFi details.** Copy `secrets.example.h` to `secrets.h` in the same folder and fill in a **2.4 GHz** network. Without it the sketch still builds, but can't join anything.
- **`02_led_patterns` needs esp32 board package 3.x** (it uses `ledcAttach`).
- **`04_wifi_test` needs two libraries:** **ESP Async WebServer** and **Async TCP**, both by **ESP32Async**.

## When to use them

- **One colour never lights, or the colours are wrong:** `01_rgb_led_test`. If this fails, it's the wiring or the LED type, not the code.
- **Fades look jumpy, or you want to tune the patterns:** `02_led_patterns`. Its settings have the same names as in `config.h`, so tuned numbers can be copied across.
- **A press counts twice, or a button does nothing:** `03_buttons_test`. A button that reads LOW at start is wired across two legs that are always joined; use diagonally opposite legs.
- **WiFi won't connect, or the page won't load:** `04_wifi_test`. It's much easier to debug the network here than inside the full firmware.

The main firmware lives in [`../heart_doll`](../heart_doll). The step-by-step build guide is in [`../../docs/guide`](../../docs/guide).
