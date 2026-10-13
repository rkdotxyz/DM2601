/*
  04_wifi_test.ino  -  Heart Doll, Phase 1, Test D: WiFi and a phone page

  What this sketch does
  ---------------------
  1. Joins your WiFi (phone hotspot), blinking the LED blue while it tries.
  2. Prints its IP address and makes itself reachable as heartdoll.local.
  3. Serves a tiny web page with "Red on" / "Red off" buttons.
  Opening that page on your phone and lighting the LED proves the whole
  chain the real build needs: phone -> WiFi -> ESP32 -> LED.

  Why it exists
  -------------
  WiFi problems (wrong band, typo in the password, a network the ESP32
  can't join) are the most common time sink in ESP32 projects. Finding
  them here, in a small sketch, keeps them out of the main build.

  Libraries (Arduino IDE: Sketch -> Include Library -> Manage Libraries)
  ---------------------------------------------------------------------
    "ESP Async WebServer" by ESP32Async   (3.12.x)
    "Async TCP"           by ESP32Async   (3.5.x)
  Install both. Avoid older look-alikes by other authors.

  Files in this sketch folder
  ---------------------------
    04_wifi_test.ino  this file
    secrets.h         your WiFi name and password (never committed)
*/

#include <WiFi.h>                // built into the esp32 package
#include <ESPmDNS.h>             // built in: the "heartdoll.local" name
#include <AsyncTCP.h>            // library: networking underneath the server
#include <ESPAsyncWebServer.h>   // library: the web server
#include "secrets.h"             // WIFI_SSID and WIFI_PASSWORD

// ---------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------
const int  PIN_RED   = 25;
const int  PIN_GREEN = 26;
const int  PIN_BLUE  = 27;
const bool COMMON_ANODE = false;   // copy from Test A's result

const char HOSTNAME[] = "heartdoll";              // -> http://heartdoll.local
const unsigned long CONNECT_TIMEOUT_MS = 20000;   // give up waiting after 20 s

// The web server listens on port 80, the normal port for http:// pages.
AsyncWebServer server(80);

bool redOn = false;           // what the page last asked for
int  lastWifiStatus = -1;     // to print only when the status changes


// ---------------------------------------------------------------------
// LED helpers
// ---------------------------------------------------------------------
void setChannel(int pin, bool on) {
  if (COMMON_ANODE) digitalWrite(pin, on ? LOW : HIGH);
  else              digitalWrite(pin, on ? HIGH : LOW);
}


// ---------------------------------------------------------------------
// WiFi status in words. (The status is passed as a plain int on purpose:
// see the Arduino prototype gotcha in docs/gotchas.md.)
// ---------------------------------------------------------------------
const char* wifiStatusText(int status) {
  switch (status) {
    case WL_CONNECTED:       return "connected";
    case WL_NO_SSID_AVAIL:   return "network not found (name wrong, out of range, or 5 GHz only)";
    case WL_CONNECT_FAILED:  return "connection failed (usually a wrong password)";
    case WL_CONNECTION_LOST: return "connection lost";
    case WL_DISCONNECTED:    return "disconnected / still trying";
    case WL_IDLE_STATUS:     return "idle, about to try";
    default:                 return "other";
  }
}


// ---------------------------------------------------------------------
// The phone page. Built fresh on every request so it shows live values.
// ---------------------------------------------------------------------
String buildPage() {
  String html;
  html += "<!doctype html><html><head><meta charset='utf-8'>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<title>Heart Doll test</title>";
  html += "<style>body{font-family:system-ui,sans-serif;margin:2rem;max-width:28rem}"
          "a{display:block;text-align:center;padding:1rem;margin:.6rem 0;border-radius:12px;"
          "text-decoration:none;font-size:1.2rem;font-weight:600}"
          ".on{background:#c0304a;color:#fff}.off{background:#ddd;color:#222}</style>";
  html += "</head><body>";
  html += "<h1>Heart Doll is online</h1>";
  html += "<p>Red LED is <b>";
  html += redOn ? "ON" : "OFF";
  html += "</b></p>";
  html += "<a class='on' href='/red/on'>Red on</a>";
  html += "<a class='off' href='/red/off'>Red off</a>";
  html += "<p>Signal strength: ";
  html += String(WiFi.RSSI());
  html += " dBm (above -70 is fine)<br>Uptime: ";
  html += String(millis() / 1000);
  html += " s</p></body></html>";
  return html;
}


// ---------------------------------------------------------------------
// setup()
// ---------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(PIN_RED, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_BLUE, OUTPUT);
  setChannel(PIN_RED, false);
  setChannel(PIN_GREEN, false);
  setChannel(PIN_BLUE, false);

  Serial.println();
  Serial.println("=== Heart Doll - Phase 1, Test D: WiFi ===");
  Serial.print("Joining network: ");
  Serial.println(WIFI_SSID);

  // Station mode = join an existing network (as opposed to creating one).
  WiFi.mode(WIFI_STA);
  WiFi.setHostname(HOSTNAME);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Wait for the connection, blinking blue. Blocking here is fine: the
  // sketch has nothing else to do yet. (The main build won't block.)
  unsigned long start = millis();
  bool blueOn = false;
  while (WiFi.status() != WL_CONNECTED && millis() - start < CONNECT_TIMEOUT_MS) {
    blueOn = !blueOn;
    setChannel(PIN_BLUE, blueOn);
    Serial.print(".");
    delay(250);
  }
  setChannel(PIN_BLUE, false);
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.print("Could not connect. Status: ");
    Serial.println(wifiStatusText(WiFi.status()));
    Serial.println("Check secrets.h, that the hotspot is on, and that it's 2.4 GHz.");
    Serial.println("The ESP32 keeps trying in the background; watch for 'connected' below.");
  }

  // Routes: which URL does what. Each handler runs when a request arrives.
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(200, "text/html", buildPage());
  });
  server.on("/red/on", HTTP_GET, [](AsyncWebServerRequest *request) {
    redOn = true;
    setChannel(PIN_RED, true);
    Serial.println("Phone says: red ON");
    request->redirect("/");   // send the browser back to the main page
  });
  server.on("/red/off", HTTP_GET, [](AsyncWebServerRequest *request) {
    redOn = false;
    setChannel(PIN_RED, false);
    Serial.println("Phone says: red OFF");
    request->redirect("/");
  });
  server.begin();
}


// ---------------------------------------------------------------------
// loop(): report WiFi changes and start the .local name once connected
// ---------------------------------------------------------------------
bool mdnsStarted = false;

void loop() {
  int status = WiFi.status();

  if (status != lastWifiStatus) {
    lastWifiStatus = status;
    Serial.print("WiFi: ");
    Serial.println(wifiStatusText(status));

    if (status == WL_CONNECTED) {
      Serial.print("Open on your phone:  http://");
      Serial.println(WiFi.localIP());
      if (!mdnsStarted && MDNS.begin(HOSTNAME)) {
        MDNS.addService("http", "tcp", 80);
        mdnsStarted = true;
      }
      if (mdnsStarted) {
        Serial.print("or try:              http://");
        Serial.print(HOSTNAME);
        Serial.println(".local");
      }
    }
  }

  // While disconnected, blink blue without blocking (on 120 ms every 2 s).
  if (status != WL_CONNECTED) {
    setChannel(PIN_BLUE, (millis() % 2000) < 120);
  } else {
    setChannel(PIN_BLUE, false);
  }

  delay(10);   // nothing time-critical here; keeps the loop relaxed
}
