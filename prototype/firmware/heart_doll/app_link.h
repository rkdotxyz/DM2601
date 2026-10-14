/*
  app_link.h  -  Heart Doll: the link to the phone
                 v1.2: the doll's own WiFi, a captive portal, one phone

    appLinkBegin()          once, in setup(): starts the WiFi
    appLinkUpdate(now)      every loop(): WiFi status, the server, DNS
    appLinkOnline()         true while phones can reach the doll
    appLinkPhones()         how many phones have the app open right now
    appLinkSend(message)    send to every connected phone (and print it)
    appLinkReadEvent()      the phone's latest request, or -1 if none

  Two ways to reach the doll (WIFI_MODE in config.h)
  --------------------------------------------------
  WIFI_OWN_NETWORK: the doll makes its own WiFi, DOLL_WIFI_NAME, at
  http://192.168.4.1. It also answers every web address with itself (a
  small DNS server), which makes the network a "captive portal": a phone
  that joins it opens the app by itself, like hotel WiFi. No internet,
  router or hotspot is involved.

  WIFI_HOTSPOT: the doll joins your WiFi or hotspot (WIFI_SSID), as
  before v1.2, at the IP printed in Serial Monitor or heartdoll.local.

  The page itself is the React app from prototype/app, built into one
  compressed file by `npm run build:doll` and stored in web_page.h.

  One phone at a time
  -------------------
  On its own network the doll lets MAX_PHONES phones join its WiFi, and
  drops a phone that has gone quiet for WIFI_IDLE_DROP_S. In both modes it
  keeps MAX_PHONES app connections: a reload from the same phone replaces
  its old connection, and anyone else is sent "link:busy" and closed.

  Two jobs, two tasks
  -------------------
  Network messages arrive on a separate background task, not in loop().
  So the handlers below don't act on them: they only park a request in
  appPendingEvent, and loop() picks it up through appLinkReadEvent(). All
  real decisions still happen in one place, handleEvent(), one at a time.
  The short "critical sections" (portENTER/EXIT_CRITICAL) stop the two
  tasks from touching the shared variables at the same instant.

  The Serial Monitor still works too: a, u and ? as before.
*/
#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <DNSServer.h>
#include <esp_wifi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include "config.h"
#include "state_machine.h"
#include "web_page.h"

// Your WiFi names and passwords. A fresh clone has no secrets.h yet, so it
// builds with the placeholders in secrets.example.h until you add one.
#if __has_include("secrets.h")
#include "secrets.h"
#else
#pragma message "secrets.h not found: using the placeholders in secrets.example.h"
#include "secrets.example.h"
#endif

AsyncWebServer appServer(80);        // the web server, normal http port
AsyncWebSocket appSocket("/ws");     // the live link, at ws://<doll>/ws
DNSServer      appDns;               // own network: every name -> the doll

const IPAddress APP_DOLL_IP(192, 168, 4, 1);
const int APP_MAX_LINKS = 4;         // room for MAX_PHONES (safe 1..4)

// Shared between the network task and loop(): guarded by appLinkLock.
portMUX_TYPE  appLinkLock     = portMUX_INITIALIZER_UNLOCKED;
volatile int  appPendingEvent = -1;               // phone request not yet handled
char          appLastStatus[32] = "status:idle";  // re-sent to new phones
uint32_t      appLinks[APP_MAX_LINKS];            // ids of the accepted app connections
IPAddress     appLinkIps[APP_MAX_LINKS];          // ...and the phone each came from
int           appLinkCount    = 0;
volatile bool appSignedIn     = false;  // the app has been opened since the phone joined

// Only used in loop().
bool          appServerStarted  = false;
int           appLastWifiStatus = -1;
int           appLastStations   = -1;
unsigned long appLastCleanupMs  = 0;


void appLinkPrintHelp() {
  Serial.println("You can play the phone here:  a = available,  u = unavailable,  ? = help");
  Serial.println();
}

// ---------------------------------------------------------------------
// The WebSocket (runs on the network task)
// ---------------------------------------------------------------------

// Forget an app connection. Call with appLinkLock held.
void appLinkForget(int i) {
  appLinks[i]   = appLinks[appLinkCount - 1];
  appLinkIps[i] = appLinkIps[appLinkCount - 1];
  appLinkCount--;
}

void appLinkOnSocketEvent(AsyncWebSocket *server, AsyncWebSocketClient *client,
                          AwsEventType type, void *arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_CONNECT) {
    IPAddress ip = client->remoteIP();
    uint32_t replaced[APP_MAX_LINKS];
    int nReplaced = 0;
    bool busy = false;
    char status[32];

    portENTER_CRITICAL(&appLinkLock);
    // The same phone reloading: its old connection may still be open.
    // The new one replaces it.
    for (int i = appLinkCount - 1; i >= 0; i--) {
      if (appLinkIps[i] == ip) { replaced[nReplaced++] = appLinks[i]; appLinkForget(i); }
    }
    if (appLinkCount >= MAX_PHONES || appLinkCount >= APP_MAX_LINKS) {
      busy = true;
    } else {
      appLinks[appLinkCount] = client->id();
      appLinkIps[appLinkCount] = ip;
      appLinkCount++;
      appSignedIn = true;
    }
    strncpy(status, appLastStatus, sizeof(status));
    portEXIT_CRITICAL(&appLinkLock);
    status[sizeof(status) - 1] = '\0';

    for (int i = 0; i < nReplaced; i++) server->close(replaced[i]);

    if (busy) {
      // Someone else has the doll: say so, and let the page try again later.
      client->text("link:busy");
      client->close();
      Serial.println("Another phone tried to connect: sent link:busy.");
      return;
    }
    // Tell the phone the current state straight away. Status is re-sent
    // like this; one-off events (button presses) are not.
    client->text(status);
    Serial.println("Phone connected.");

  } else if (type == WS_EVT_DISCONNECT) {
    bool known = false;
    portENTER_CRITICAL(&appLinkLock);
    for (int i = 0; i < appLinkCount; i++) {
      if (appLinks[i] == client->id()) { appLinkForget(i); known = true; break; }
    }
    portEXIT_CRITICAL(&appLinkLock);
    if (known) Serial.println("Phone disconnected.");

  } else if (type == WS_EVT_DATA) {
    // Only accept small, complete text messages, from an accepted phone.
    AwsFrameInfo *info = (AwsFrameInfo *)arg;
    if (!(info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT)) return;

    char message[32];
    size_t n = len < sizeof(message) - 1 ? len : sizeof(message) - 1;
    memcpy(message, data, n);
    message[n] = '\0';

    int event = -1;
    if (strcmp(message, "app:available") == 0)   event = EVENT_APP_AVAILABLE;
    if (strcmp(message, "app:unavailable") == 0) event = EVENT_APP_UNAVAILABLE;
    if (event < 0) return;   // ignore anything else

    // Park it for loop(). If two arrive before loop() looks, the latest
    // wins, which matches the doll's own rule.
    portENTER_CRITICAL(&appLinkLock);
    bool accepted = false;
    for (int i = 0; i < appLinkCount; i++) if (appLinks[i] == client->id()) accepted = true;
    if (accepted) appPendingEvent = event;
    portEXIT_CRITICAL(&appLinkLock);
  }
}

// ---------------------------------------------------------------------
// The web pages (run on the network task)
// ---------------------------------------------------------------------

// The app: one gzip-compressed file, straight from flash.
void appLinkServeApp(AsyncWebServerRequest *request) {
  AsyncWebServerResponse *response =
      request->beginResponse(200, "text/html; charset=utf-8", WEB_PAGE_GZ, WEB_PAGE_GZ_LEN);
  response->addHeader("Content-Encoding", "gzip");
  response->addHeader("Cache-Control", "no-cache");
  request->send(response);
  // The phone has the app: its "is this network online?" checks can now
  // pass, so an iPhone's pop-up shows Done (stay) instead of Cancel.
  if (WIFI_MODE == WIFI_OWN_NETWORK) appSignedIn = true;
}

// Phones check for internet by fetching a known address right after they
// join. Until the app has been opened, the doll answers with the app
// itself, so the phone opens it as a sign-in page. After that, it answers
// the way the internet would, so the phone keeps the network.
void appLinkCaptiveCheck(AsyncWebServerRequest *request) {
  if (!appSignedIn) {
    request->redirect("http://192.168.4.1/");
    return;
  }
  String url = request->url();
  if (url.endsWith("generate_204") || url.endsWith("gen_204")) {
    request->send(204);                                                   // Android, Chrome
  } else if (url.endsWith("connecttest.txt")) {
    request->send(200, "text/plain", "Microsoft Connect Test");            // Windows
  } else if (url.endsWith("ncsi.txt")) {
    request->send(200, "text/plain", "Microsoft NCSI");
  } else {
    request->send(200, "text/html",                                        // Apple
                  "<HTML><HEAD><TITLE>Success</TITLE></HEAD><BODY>Success</BODY></HTML>");
  }
}

void appLinkSetUpPages() {
  appSocket.onEvent(appLinkOnSocketEvent);
  appServer.addHandler(&appSocket);
  appServer.on("/", HTTP_GET, appLinkServeApp);

  if (WIFI_MODE == WIFI_OWN_NETWORK) {
    const char *checks[] = {
      "/generate_204", "/gen_204",                          // Android
      "/hotspot-detect.html", "/library/test/success.html", // Apple
      "/connecttest.txt", "/ncsi.txt",                      // Windows
      "/canonical.html", "/success.txt",                    // Firefox, Linux
    };
    for (const char *path : checks) appServer.on(path, HTTP_GET, appLinkCaptiveCheck);
    // Anything else, at any name: send the phone to the app.
    appServer.onNotFound([](AsyncWebServerRequest *request) {
      request->redirect("http://192.168.4.1/");
    });
  } else {
    appServer.onNotFound([](AsyncWebServerRequest *request) { request->send(404); });
  }
}

// ---------------------------------------------------------------------
// Public functions (called from setup() and loop())
// ---------------------------------------------------------------------

void appLinkBegin() {
  appLinkSetUpPages();
  WiFi.setHostname(HOSTNAME);

  if (WIFI_MODE == WIFI_OWN_NETWORK) {
    WiFi.mode(WIFI_AP);
    WiFi.softAPConfig(APP_DOLL_IP, APP_DOLL_IP, IPAddress(255, 255, 255, 0));
    bool ok = WiFi.softAP(DOLL_WIFI_NAME, DOLL_WIFI_PASSWORD, DOLL_WIFI_CHANNEL, 0, MAX_PHONES);
    if (!ok) {
      Serial.println("ERROR: couldn't start the doll's WiFi. Is DOLL_WIFI_PASSWORD at least 8 characters?");
      return;
    }
    // Drop a phone that has gone quiet, so its place frees up.
    esp_wifi_set_inactive_time(WIFI_IF_AP, WIFI_IDLE_DROP_S);
    appDns.setErrorReplyCode(DNSReplyCode::NoError);
    appDns.start(53, "*", APP_DOLL_IP);
    appServer.begin();
    if (MDNS.begin(HOSTNAME)) MDNS.addService("http", "tcp", 80);
    appServerStarted = true;

    Serial.print("The doll's WiFi is on: ");
    Serial.println(DOLL_WIFI_NAME);
    Serial.println("Join it on your phone; the app opens by itself.");
    Serial.println("If it doesn't, open http://192.168.4.1");
  } else {
    WiFi.mode(WIFI_STA);              // join a network, don't create one
    WiFi.setAutoReconnect(true);      // rejoin by itself after a drop
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);   // returns at once; joins in the background
    Serial.print("Joining WiFi: ");
    Serial.println(WIFI_SSID);
  }
  appLinkPrintHelp();
}

bool appLinkOnline() {
  if (WIFI_MODE == WIFI_OWN_NETWORK) return appServerStarted;
  return WiFi.status() == WL_CONNECTED;
}

int appLinkPhones() {
  portENTER_CRITICAL(&appLinkLock);
  int n = appLinkCount;
  portEXIT_CRITICAL(&appLinkLock);
  return n;
}

// Call every loop(). Never waits.
void appLinkUpdate(unsigned long now) {
  if (WIFI_MODE == WIFI_OWN_NETWORK) {
    if (appServerStarted) appDns.processNextRequest();

    // Phones joining and leaving the doll's WiFi.
    int stations = WiFi.softAPgetStationNum();
    if (stations != appLastStations) {
      if (appLastStations >= 0 && stations > appLastStations) Serial.println("A phone joined the doll's WiFi.");
      if (stations < appLastStations) Serial.println("A phone left the doll's WiFi.");
      // Nobody on the network: the next phone to join gets the pop-up again.
      if (stations == 0) appSignedIn = false;
      appLastStations = stations;
    }
  } else {
    int status = WiFi.status();
    if (status != appLastWifiStatus) {
      appLastWifiStatus = status;
      if (status == WL_CONNECTED) {
        // First connection: start the server and the .local name.
        if (!appServerStarted) {
          appServer.begin();
          if (MDNS.begin(HOSTNAME)) MDNS.addService("http", "tcp", 80);
          appServerStarted = true;
        }
        Serial.println("WiFi: connected");
        Serial.print("Open on your phone:  http://");
        Serial.println(WiFi.localIP());
        Serial.print("or:                  http://");
        Serial.print(HOSTNAME);
        Serial.println(".local");
      } else if (appServerStarted) {
        Serial.println("WiFi: lost, reconnecting by itself...");
      }
    }
  }

  // Free the memory of phones that have gone away, once a second.
  if (now - appLastCleanupMs >= SOCKET_CLEANUP_MS) {
    appLastCleanupMs = now;
    appSocket.cleanupClients(APP_MAX_LINKS);
  }
}

// Send to every accepted phone. Status messages are also remembered, so
// a phone that connects later gets the current state.
void appLinkSend(const char* message) {
  if (strncmp(message, "status:", 7) == 0) {
    portENTER_CRITICAL(&appLinkLock);
    strncpy(appLastStatus, message, sizeof(appLastStatus) - 1);
    appLastStatus[sizeof(appLastStatus) - 1] = '\0';
    portEXIT_CRITICAL(&appLinkLock);
  }

  Serial.print("    -> phone: ");
  Serial.println(message);

  if (!appServerStarted) return;
  uint32_t ids[APP_MAX_LINKS];
  int n;
  portENTER_CRITICAL(&appLinkLock);
  n = appLinkCount;
  for (int i = 0; i < n; i++) ids[i] = appLinks[i];
  portEXIT_CRITICAL(&appLinkLock);
  for (int i = 0; i < n; i++) appSocket.text(ids[i], message);
}

// The phone's latest request (EVENT_APP_...), or -1 if there's none.
int appLinkReadEvent() {
  int event;
  portENTER_CRITICAL(&appLinkLock);
  event = appPendingEvent;
  appPendingEvent = -1;
  portEXIT_CRITICAL(&appLinkLock);
  if (event >= 0) return event;

  // The Serial Monitor can still play the phone.
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == 'a') return EVENT_APP_AVAILABLE;
    if (c == 'u') return EVENT_APP_UNAVAILABLE;
    if (c == '?') appLinkPrintHelp();
  }
  return -1;
}
