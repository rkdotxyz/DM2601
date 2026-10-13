/*
  01_rgb_led_test.ino  -  Heart Doll, Phase 1: Light the LED

  What this sketch does
  ---------------------
  Cycles the 4-pin RGB LED through RED -> GREEN -> BLUE -> WHITE -> OFF,
  one second each, and prints the colour that SHOULD be showing to the
  Serial Monitor. Comparing what you read with what you see tells you:
    1. whether your LED is common cathode or common anode, and
    2. which leg is which colour.

  Why it exists
  -------------
  Every later phase assumes these two facts are right. Testing them in a
  tiny sketch first means a wrong guess costs you a minute, not an evening.

  Wiring (see the Phase 1 page)
  -----------------------------
    GPIO25 -> 220 ohm -> LED red leg
    GPIO26 -> 220 ohm -> LED green leg
    GPIO27 -> 220 ohm -> LED blue leg
    LED common (longest) leg -> GND   (or 3V3 for a common-anode LED)

  Note: this sketch uses delay() because it does nothing else. From
  Phase 2 on we stop using delay(), so buttons and WiFi keep working.
*/

// ---------------------------------------------------------------------
// Settings you may change
// ---------------------------------------------------------------------

// GPIO numbers as printed on the ESP32 board (the "D25" / "25" labels).
const int PIN_RED   = 25;
const int PIN_GREEN = 26;
const int PIN_BLUE  = 27;

// false = common CATHODE (common leg on GND): a pin set HIGH lights its colour.
// true  = common ANODE   (common leg on 3V3): a pin set LOW lights its colour.
// Start with false. If the colours look "inverted" (see the debugging
// table on the Phase 1 page), move the common leg to 3V3 and set this to true.
const bool COMMON_ANODE = false;

// How long each colour stays on, in milliseconds (1000 ms = 1 second).
const unsigned long STEP_MS = 1000;


// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

// Turn one colour channel fully on or fully off.
// The only place that knows about common anode vs cathode, so the rest of
// the code can simply say "red on" without caring how the LED is wired.
void setChannel(int pin, bool on) {
  if (COMMON_ANODE) {
    // Common anode: the common leg sits at +3.3 V. Current only flows (and
    // the colour lights) when the pin is pulled DOWN to 0 V, i.e. LOW.
    digitalWrite(pin, on ? LOW : HIGH);
  } else {
    // Common cathode: the common leg sits at 0 V (GND). Current flows when
    // the pin pushes UP to 3.3 V, i.e. HIGH.
    digitalWrite(pin, on ? HIGH : LOW);
  }
}

// Show a combination of red/green/blue and print what should be visible.
// pinInfo is just text for the Serial Monitor, so you know which wire to check.
void showColour(bool red, bool green, bool blue, const char* name, const char* pinInfo) {
  setChannel(PIN_RED, red);
  setChannel(PIN_GREEN, green);
  setChannel(PIN_BLUE, blue);

  Serial.print("Now showing: ");
  Serial.print(name);
  Serial.print("   ");
  Serial.println(pinInfo);
}


// ---------------------------------------------------------------------
// setup() runs once, after power-on or reset
// ---------------------------------------------------------------------
void setup() {
  // 115200 is the usual speed for ESP32. The Serial Monitor's dropdown
  // (bottom right) must be set to the same number, or you'll see gibberish.
  Serial.begin(115200);

  // Give the USB connection a moment so the first lines aren't lost.
  delay(500);

  // Make the three LED pins outputs (they start as inputs after reset).
  pinMode(PIN_RED, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_BLUE, OUTPUT);

  // Start with everything off.
  showColour(false, false, false, "OFF", "(starting up)");

  Serial.println();
  Serial.println("=== Heart Doll - Phase 1: RGB LED test ===");
  Serial.print("Mode: ");
  Serial.println(COMMON_ANODE ? "COMMON ANODE (common leg on 3V3)"
                              : "COMMON CATHODE (common leg on GND)");
  Serial.println("Compare what you READ here with what you SEE on the LED.");
  Serial.println();
}


// ---------------------------------------------------------------------
// loop() runs again and again, forever
// ---------------------------------------------------------------------
void loop() {
  showColour(true,  false, false, "RED",   "(GPIO25 only)");
  delay(STEP_MS);

  showColour(false, true,  false, "GREEN", "(GPIO26 only)");
  delay(STEP_MS);

  showColour(false, false, true,  "BLUE",  "(GPIO27 only)");
  delay(STEP_MS);

  // All three together. Usually looks white-ish with a pink or blue tint,
  // because the three colours aren't equally bright at 3.3 V. That's normal.
  showColour(true,  true,  true,  "WHITE", "(all three)");
  delay(STEP_MS);

  showColour(false, false, false, "OFF",   "(none)");
  delay(STEP_MS);

  Serial.println("--- cycle done, starting again ---");
}
