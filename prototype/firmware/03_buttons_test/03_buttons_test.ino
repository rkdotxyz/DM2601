/*
  03_buttons_test.ino  -  Heart Doll, Phase 1, Test C: buttons

  What this sketch does
  ---------------------
  Reads the Heart button (GPIO32) and Cross button (GPIO33) and prints
  exactly one line per press, with a running count. Each press also
  flashes the LED white, as the real doll will.

  Type 'r' in the Serial Monitor to switch to RAW mode: every electrical
  change is counted with no filtering, so you can see "bounce" for
  yourself. Type 'd' to go back to DEBOUNCED mode.

  Why it exists
  -------------
  Two ideas:
    1. Pull-up resistors. A button only connects a pin to GND when
       pressed. When released, the pin is connected to nothing and
       "floats", reading random HIGH/LOW. INPUT_PULLUP switches on a
       resistor inside the ESP32 that gently pulls the pin up to 3.3 V,
       so released = HIGH and pressed = LOW. No extra parts needed.
    2. Bounce. A button's metal contacts rattle for a few milliseconds
       when pressed, so the pin flips HIGH/LOW several times. To the
       ESP32, that's several presses. Debouncing means only accepting a
       new state once it has stayed the same for DEBOUNCE_MS.

  Wiring
  ------
    GPIO32 -> Heart button -> - rail (GND)
    GPIO33 -> Cross button -> - rail (GND)
    LED wired as in Tests A and B.
*/

// ---------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------
const int  PIN_RED   = 25;
const int  PIN_GREEN = 26;
const int  PIN_BLUE  = 27;
const bool COMMON_ANODE = false;   // copy from Test A's result

// Buttons, kept in small arrays so both use the same code.
// Index 0 = Heart, index 1 = Cross.
const int   NUM_BUTTONS = 2;
const int   BUTTON_PINS[NUM_BUTTONS]  = {32, 33};
const char* BUTTON_NAMES[NUM_BUTTONS] = {"HEART", "CROSS"};

// How long a new reading must stay unchanged before we believe it.
// 30 ms is longer than typical bounce and far shorter than a human press.
const unsigned long DEBOUNCE_MS = 30;   // safe range 10..60

const unsigned long FLASH_MS = 150;


// ---------------------------------------------------------------------
// State, one slot per button
// ---------------------------------------------------------------------
int lastRaw[NUM_BUTTONS];                 // last raw reading (HIGH/LOW)
int stableState[NUM_BUTTONS];             // last debounced state
unsigned long lastChangeMs[NUM_BUTTONS];  // when the raw reading last changed
unsigned long pressCount[NUM_BUTTONS];    // debounced presses
unsigned long rawCount[NUM_BUTTONS];      // raw HIGH->LOW changes

bool rawMode = false;
bool flashing = false;
unsigned long flashStartMs = 0;


// ---------------------------------------------------------------------
// LED helpers (simple on/off is enough for a flash)
// ---------------------------------------------------------------------
void setChannel(int pin, bool on) {
  if (COMMON_ANODE) digitalWrite(pin, on ? LOW : HIGH);
  else              digitalWrite(pin, on ? HIGH : LOW);
}

void setAll(bool on) {
  setChannel(PIN_RED, on);
  setChannel(PIN_GREEN, on);
  setChannel(PIN_BLUE, on);
}

void startFlash() {
  flashing = true;
  flashStartMs = millis();
  setAll(true);
}


// ---------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------

// Raw mode: report every HIGH->LOW change immediately, no filtering.
void checkRaw(int i, int raw) {
  if (raw == LOW) {
    rawCount[i]++;
    Serial.print("raw ");
    Serial.print(BUTTON_NAMES[i]);
    Serial.print(" went LOW, count ");
    Serial.println(rawCount[i]);
  }
}

// Called every loop for button i. Returns true exactly once per press.
bool pressedDebounced(int i, int raw, unsigned long now) {
  // Not changed for long enough yet? Then it might still be bouncing.
  if (now - lastChangeMs[i] < DEBOUNCE_MS) return false;

  // Stable for DEBOUNCE_MS and different from what we last believed:
  // it's a real change.
  if (raw != stableState[i]) {
    stableState[i] = raw;
    return raw == LOW;   // LOW = pressed (pull-up). Releases return false.
  }
  return false;
}

void updateButtons(unsigned long now) {
  for (int i = 0; i < NUM_BUTTONS; i++) {
    int raw = digitalRead(BUTTON_PINS[i]);

    // Remember when the raw reading last changed (the debounce timer).
    if (raw != lastRaw[i]) {
      lastRaw[i] = raw;
      lastChangeMs[i] = now;
      if (rawMode) checkRaw(i, raw);
    }

    if (!rawMode && pressedDebounced(i, raw, now)) {
      pressCount[i]++;
      Serial.print(BUTTON_NAMES[i]);
      Serial.print(" pressed (#");
      Serial.print(pressCount[i]);
      Serial.println(")");
      startFlash();
    }
  }
}


// ---------------------------------------------------------------------
// Serial commands: r = raw mode, d = debounced mode
// ---------------------------------------------------------------------
void readSerialCommands() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == 'r') {
      rawMode = true;
      Serial.println("RAW mode: every electrical change is counted. Press a button once and watch.");
    } else if (c == 'd') {
      rawMode = false;
      Serial.println("DEBOUNCED mode: one line per press.");
    }
  }
}


// ---------------------------------------------------------------------
// setup() and loop()
// ---------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(PIN_RED, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_BLUE, OUTPUT);
  setAll(false);

  for (int i = 0; i < NUM_BUTTONS; i++) {
    // INPUT_PULLUP: released reads HIGH, pressed reads LOW.
    pinMode(BUTTON_PINS[i], INPUT_PULLUP);
    lastRaw[i]      = digitalRead(BUTTON_PINS[i]);
    stableState[i]  = lastRaw[i];
    lastChangeMs[i] = millis();
    pressCount[i]   = 0;
    rawCount[i]     = 0;
  }

  Serial.println();
  Serial.println("=== Heart Doll - Phase 1, Test C: buttons ===");
  Serial.println("Press Heart or Cross. Type r for RAW mode, d for DEBOUNCED mode.");
  Serial.print("At start: HEART reads ");
  Serial.print(lastRaw[0] == HIGH ? "HIGH (released, good)" : "LOW (pressed or wired to GND?)");
  Serial.print(", CROSS reads ");
  Serial.println(lastRaw[1] == HIGH ? "HIGH (released, good)" : "LOW (pressed or wired to GND?)");
  Serial.println();
}

void loop() {
  unsigned long now = millis();

  readSerialCommands();
  updateButtons(now);

  // End the flash after FLASH_MS, without ever waiting.
  if (flashing && now - flashStartMs >= FLASH_MS) {
    flashing = false;
    setAll(false);
  }
}
