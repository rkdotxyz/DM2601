/*
  app_link.h  -  Heart Doll: the link to the phone
                 PHASE 3 VERSION: WiFi + web page + WebSocket

  Same three functions as the Phase 2 stand-in, plus two small ones:
    appLinkBegin()          once, in setup(): starts joining WiFi
    appLinkUpdate(now)      every loop(): WiFi status, start the server
    appLinkOnline()         true while WiFi is connected
    appLinkSend(message)    send to every connected phone (and print it)
    appLinkReadEvent()      the phone's latest request, or -1 if none

  How it works
  ------------
  The ESP32 joins your hotspot, serves the phone page (web_page.h) at
  http://heartdoll.local, and keeps a WebSocket open at /ws to every
  phone that opens it. A WebSocket is a connection that stays open, so
  both sides can send a message at any moment.

  Two jobs, two tasks
  -------------------
  Network messages arrive on a separate background task, not in loop().
  So the handler below doesn't act on them: it only parks the request in
  appPendingEvent, and loop() picks it up through appLinkReadEvent(). All
  real decisions still happen in one place, in handleEvent(), one at a
  time. The short "critical sections" (portENTER/EXIT_CRITICAL) stop the
  two tasks from touching the shared variables at the same instant.

  The Serial Monitor still works too: a, u and ? as in Phase 2.
*/
#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include "config.h"
#include "state_machine.h"
#include "web_page.h"

// Your WiFi name and password. A fresh clone has no secrets.h yet, so it
// builds with the placeholders in secrets.example.h until you add one.
#if __has_include("secrets.h")
#include "secrets.h"
#else
#pragma message "secrets.h not found: using the placeholders in secrets.example.h"
#include "secrets.example.h"
#endif

AsyncWebServer appServer(80);        // the web server, normal http port
AsyncWebSocket appSocket("/ws");     // the live link, at ws://<doll>/ws

// Shared between the network task and loop(): guarded by appLinkLock.
portMUX_TYPE  appLinkLock     = portMUX_INITIALIZER_UNLOCKED;
volatile int  appPendingEvent = -1;            // phone request not yet handled
char          appLastStatus[32] = "status:idle";  // re-sent to new phones

// Only used in loop().
bool          appServerStarted = false;
int           appLastWifiStatus = -1;
unsigned long appLastCleanupMs  = 0;


void appLinkPrintHelp() {
  Serial.println("Phone page: open the address printed when WiFi connects.");
  Serial.println("You can still play the phone here:  a = available,  u = unavailable,  ? = help");
  Serial.println();
}

// Runs on the network task whenever something happens on the WebSocket.
void appLinkOnSocketEvent(AsyncWebSocket *server, AsyncWebSocketClient *client,
                          AwsEventType type, void *arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_CONNECT) {
    // A phone just connected: tell it the current state straight away.
    // Status is re-sent like this; one-off events (button presses) are not.
    char status[32];
    portENTER_CRITICAL(&appLinkLock);
    strncpy(status, appLastStatus, sizeof(status));
    portEXIT_CRITICAL(&appLinkLock);
    status[sizeof(status) - 1] = '\0';
    client->text(status);
    Serial.print("Phone connected. Phones open: ");
    Serial.println((unsigned long)server->count());

  } else if (type == WS_EVT_DISCONNECT) {
    Serial.println("Phone disconnected.");

  } else if (type == WS_EVT_DATA) {
    // Only accept small, complete text messages.
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
    appPendingEvent = event;
    portEXIT_CRITICAL(&appLinkLock);
  }
}

void appLinkBegin() {
  WiFi.mode(WIFI_STA);              // join a network, don't create one
  WiFi.setHostname(HOSTNAME);
  WiFi.setAutoReconnect(true);      // rejoin by itself after a drop
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);   // returns at once; joins in the background

  appSocket.onEvent(appLinkOnSocketEvent);
  appServer.addHandler(&appSocket);
  appServer.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(200, "text/html; charset=utf-8", WEB_PAGE);
  });

  Serial.print("Joining WiFi: ");
  Serial.println(WIFI_SSID);
  appLinkPrintHelp();
}

bool appLinkOnline() {
  return WiFi.status() == WL_CONNECTED;
}

// Call every loop(). Never waits.
void appLinkUpdate(unsigned long now) {
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

  // Free the memory of phones that have gone away, once a second.
  if (now - appLastCleanupMs >= SOCKET_CLEANUP_MS) {
    appLastCleanupMs = now;
    appSocket.cleanupClients();
  }
}

// Send to every open phone. Status messages are also remembered, so a
// phone that connects later gets the current state.
void appLinkSend(const char* message) {
  if (strncmp(message, "status:", 7) == 0) {
    portENTER_CRITICAL(&appLinkLock);
    strncpy(appLastStatus, message, sizeof(appLastStatus) - 1);
    appLastStatus[sizeof(appLastStatus) - 1] = '\0';
    portEXIT_CRITICAL(&appLinkLock);
  }

  Serial.print("    -> phone: ");
  Serial.println(message);

  if (appServerStarted) appSocket.textAll(message);
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
