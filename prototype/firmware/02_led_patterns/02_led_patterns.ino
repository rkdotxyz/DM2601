/*
  02_led_patterns.ino  -  Heart Doll, Phase 1, Test B: LED patterns

  What this sketch does
  ---------------------
  Draws every light pattern the doll will use, smoothly, using PWM:
    w = Waiting    slow red "breathing" (the doll person pressed Heart)
    c = Connected  red "lub-dub" heartbeat (the phone person is available)
    n = No WiFi    faint blue blink every 2 seconds
    f = Flash      quick white flash (acknowledges a button press)
    o = Off
  Type a letter in the Serial Monitor and press Enter to switch.

  Why it exists
  -------------
  Two ideas the whole project depends on:
    1. PWM: an LED is dimmed by switching it on and off thousands of
       times a second. The fraction of time it's on ("duty") sets the
       brightness your eye sees.
    2. No delay(): every pattern is a function of the clock, millis().
       loop() runs thousands of times a second, asks "what time is it?"
       and sets the brightness for that moment. Nothing ever waits, so
       later the same loop can also read buttons and WiFi.

  Wiring: same as Test A (GPIO25/26/27 through resistors, common leg on
  the - rail, or the + rail for a common-anode LED).

  Needs: esp32 board package 3.x (uses ledcAttach / ledcWrite).
*/

#include <math.h>   // cosf(), expf(), fmaxf()

// ---------------------------------------------------------------------
// Settings: pins and LED type (copy COMMON_ANODE from Test A's result)
// ---------------------------------------------------------------------
const int  PIN_RED   = 25;
const int  PIN_GREEN = 26;
const int  PIN_BLUE  = 27;
const bool COMMON_ANODE = false;

// PWM settings. 5000 Hz is far too fast to see flicker. 8 bits gives
// brightness steps from 0 (off) to 255 (full).
const uint32_t PWM_FREQ_HZ = 5000;
const uint8_t  PWM_BITS    = 8;
const int      PWM_MAX     = 255;   // (1 << PWM_BITS) - 1

// How often to update the LED, in ms. 10 ms = 100 updates a second,
// smoother than the eye can tell, and it leaves loop() free the rest
// of the time.
const unsigned long LED_FRAME_MS = 10;

// ---------------------------------------------------------------------
// Settings: the feel of each pattern (tune these freely)
// ---------------------------------------------------------------------
// Waiting: one full breath (dim -> bright -> dim) every BREATH_MS.
const unsigned long BREATH_MS   = 4000;   // safe range 2000..8000
const float         WAITING_MAX = 0.40f;  // peak brightness, 0..1

// Connected: one heartbeat every BEAT_MS. 1000 ms = 60 beats per minute.
const unsigned long BEAT_MS     = 1000;   // safe range 600..1500
const float         HEART_FLOOR = 0.06f;  // faint glow between beats, 0..1

// No WiFi: a short blue blink.
const unsigned long NOWIFI_PERIOD_MS = 2000;
const unsigned long NOWIFI_ON_MS     = 120;
const float         NOWIFI_LEVEL     = 0.60f;  // blue is dim at 3.3 V, so higher

// Acknowledgement flash length.
const unsigned long FLASH_MS = 150;


// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
char mode = 'o';                 // current pattern: 'w', 'c', 'n' or 'o'
bool flashing = false;           // is a flash playing on top of the pattern?
unsigned long flashStartMs = 0;  // when the flash started
unsigned long lastFrameMs  = 0;  // when we last updated the LED


// ---------------------------------------------------------------------
// Low level: set one colour channel to a brightness from 0.0 to 1.0
// ---------------------------------------------------------------------
void writeChannel(int pin, float level) {
  // Keep the value in range, whatever the caller passed.
  if (level < 0.0f) level = 0.0f;
  if (level > 1.0f) level = 1.0f;

  // Gamma correction. Eyes are much more sensitive to changes in dim
  // light than in bright light, so a straight 0..255 ramp looks like it
  // jumps up fast and then sits at "bright". Squaring the level spends
  // more of the range on the dim end, which makes fades look even.
  float perceived = level * level;

  int duty = (int)(perceived * PWM_MAX + 0.5f);   // +0.5 rounds to nearest

  // Common anode LEDs light when the pin is LOW, so the duty is flipped:
  // 0 means fully on and 255 means off.
  if (COMMON_ANODE) duty = PWM_MAX - duty;

  ledcWrite(pin, duty);
}

// Set all three channels at once.
void setRGB(float red, float green, float blue) {
  writeChannel(PIN_RED, red);
  writeChannel(PIN_GREEN, green);
  writeChannel(PIN_BLUE, blue);
}


// ---------------------------------------------------------------------
// Patterns. Each takes the current time and returns a brightness 0..1.
// They hold no state of their own, so they can be switched at any
// moment, mid-breath or mid-beat, without glitches.
// ---------------------------------------------------------------------

// Waiting: a cosine wave. phase goes 0 -> 1 over one breath;
// (1 - cos(2*pi*phase)) / 2 goes 0 -> 1 -> 0 smoothly over that time.
float breathLevel(unsigned long now) {
  float phase = (float)(now % BREATH_MS) / (float)BREATH_MS;
  float wave  = (1.0f - cosf(2.0f * PI * phase)) / 2.0f;
  return wave * WAITING_MAX;
}

// A smooth bump: 1.0 at 'center', fading to ~0 about two 'width's away.
// (It's the bell-curve shape; any smooth hump would do.)
float bump(float t, float center, float width) {
  float x = (t - center) / width;
  return expf(-x * x);
}

// Connected: "lub-dub". A strong pulse, then a weaker one shortly after,
// then rest until the next beat. Times are in ms from the start of a beat.
float heartbeatLevel(unsigned long now) {
  float t   = (float)(now % BEAT_MS);
  float lub = bump(t, 120.0f, 55.0f);          // first, strongest pulse
  float dub = 0.6f * bump(t, 360.0f, 70.0f);   // second, softer pulse
  // fmaxf picks the higher of the two, so the pulses never add up past 1.
  return HEART_FLOOR + (1.0f - HEART_FLOOR) * fmaxf(lub, dub);
}

// No WiFi: true during the short "on" part of each period.
bool noWifiBlinkOn(unsigned long now) {
  return (now % NOWIFI_PERIOD_MS) < NOWIFI_ON_MS;
}


// ---------------------------------------------------------------------
// Serial Monitor commands
// ---------------------------------------------------------------------
void printHelp() {
  Serial.println();
  Serial.println("=== Heart Doll - Phase 1, Test B: LED patterns ===");
  Serial.println("Type a letter and press Enter:");
  Serial.println("  w = Waiting (slow breathing)");
  Serial.println("  c = Connected (heartbeat)");
  Serial.println("  n = No WiFi (blue blink)");
  Serial.println("  f = Flash (acknowledgement, plays over any pattern)");
  Serial.println("  o = Off");
  Serial.println();
}

void readSerialCommands() {
  // Handle every character that has arrived since the last loop.
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n' || c == '\r' || c == ' ') continue;   // ignore Enter and spaces

    if (c == 'w' || c == 'c' || c == 'n' || c == 'o') {
      mode = c;
      Serial.print("Pattern: ");
      if (c == 'w') Serial.println("Waiting");
      if (c == 'c') Serial.println("Connected");
      if (c == 'n') Serial.println("No WiFi");
      if (c == 'o') Serial.println("Off");
    } else if (c == 'f') {
      flashing = true;
      flashStartMs = millis();
      Serial.println("Flash");
    } else {
      Serial.print("Unknown command: ");
      Serial.println(c);
      printHelp();
    }
  }
}


// ---------------------------------------------------------------------
// setup() and loop()
// ---------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);   // only in setup: give the USB serial a moment

  // Attach each pin to the ESP32's PWM hardware (called LEDC).
  // From esp32 core 3.0, you attach by pin number; no channel numbers.
  bool ok = ledcAttach(PIN_RED,   PWM_FREQ_HZ, PWM_BITS) &&
            ledcAttach(PIN_GREEN, PWM_FREQ_HZ, PWM_BITS) &&
            ledcAttach(PIN_BLUE,  PWM_FREQ_HZ, PWM_BITS);
  if (!ok) {
    Serial.println("ERROR: ledcAttach failed. Check the pin numbers and that the esp32 package is 3.x.");
  }

  setRGB(0, 0, 0);
  printHelp();
}

void loop() {
  unsigned long now = millis();

  // 1. Input: always first, and never blocked by the animation.
  readSerialCommands();

  // 2. Output: only redraw every LED_FRAME_MS.
  //    (now - lastFrameMs) stays correct even when millis() wraps
  //    around after ~49 days, because unsigned subtraction wraps too.
  if (now - lastFrameMs < LED_FRAME_MS) return;
  lastFrameMs = now;

  // A flash, while it lasts, overrides whatever pattern is running.
  if (flashing) {
    if (now - flashStartMs < FLASH_MS) {
      setRGB(1.0f, 1.0f, 1.0f);
      return;
    }
    flashing = false;   // flash finished: fall through to the pattern
  }

  if (mode == 'w') {
    setRGB(breathLevel(now), 0, 0);
  } else if (mode == 'c') {
    setRGB(heartbeatLevel(now), 0, 0);
  } else if (mode == 'n') {
    setRGB(0, 0, noWifiBlinkOn(now) ? NOWIFI_LEVEL : 0.0f);
  } else {
    setRGB(0, 0, 0);
  }
}
