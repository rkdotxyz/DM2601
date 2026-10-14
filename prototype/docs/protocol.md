# Doll ↔ phone protocol

The phone joins the doll's WiFi and loads the app over HTTP from `/` (at `http://192.168.4.1`, or by itself as a captive portal; see [below](#reaching-the-doll)), then opens a WebSocket at `ws://<address>/ws`. Every message is a short line of plain text, `kind:value`, so the traffic is easy to read in Serial Monitor (every message the doll sends is printed as `-> phone: ...`).

## Phone → doll

| Message | Meaning |
|---|---|
| `app:available` | The phone person tapped their circle on. The doll goes to `connected`, or `together` if the doll person is available |
| `app:unavailable` | The phone person tapped their circle off. The doll goes to `idle`, or `waiting` if the doll person is available |

These are requests: the doll decides what happens. Anything else is ignored, and only single-frame text messages are accepted, cut off at 31 characters.

Serial Monitor can play the phone too: type `a` (available), `u` (unavailable) or `?` (help) and press Enter.

## Doll → phone

**Status** describes how things are right now. It's sent on every state change, and to each phone as it connects, so a page opened late (or reloaded) shows the right picture at once.

| Message | When |
|---|---|
| `status:idle` | Nobody is available |
| `status:waiting` | Only the doll person is available |
| `status:connected` | Only the phone person is available; the doll person hasn't answered |
| `status:declined` | The phone person is available; the doll person said "not now" |
| `status:together` | Both are available |

**Link** messages are about the connection itself, not the doll:

| Message | When | The page does |
|---|---|---|
| `link:busy` | Another phone already has the doll (`MAX_PHONES`). The doll closes the connection right after | Shows "Someone else is with the doll" and keeps retrying every 2 s, so it joins as soon as they leave |

The same phone reloading isn't "another phone": its new connection replaces the old one.

**Events** are one-off moments, sent once to the phones open at the time and never repeated to late joiners:

| Message | When | The page does |
|---|---|---|
| `event:heart` | Every Heart press, even with no state change | A short double vibration (Android only; iPhones ignore it) |
| `event:cross` | Every Cross press, even with no state change | Nothing yet; the status that follows updates the picture |

## A short session

```
phone opens http://heartdoll.local, then ws://heartdoll.local/ws
doll  → status:idle               (current state, on connect)
        [Heart pressed on the doll]
doll  → event:heart
doll  → status:waiting            heart fills to half from the top
phone → app:available
doll  → status:together           heart fills, glows and beats; LED at 100%
        [Cross pressed on the doll]
doll  → event:cross
doll  → status:declined           heart drains to the phone person's half; LED off
phone → app:unavailable
doll  → status:idle
```

## Design notes

- **Status and events are separate on purpose.** A status can be re-sent any number of times with no harm; an event is a moment that happened once. Mixing them would make a reloaded page replay old button presses.
- **The page never assumes.** Tapping your circle only sends a request; the circle and the heart change when the status comes back, usually within a few hundredths of a second.
- **The page reconnects by itself** every 2 s while the doll is unreachable, showing "Doll offline". Taps are ignored while offline.
- **One phone at a time.** On its own network, the doll lets one phone join its WiFi at all. `link:busy` covers the case where two phones share a network anyway (hotspot mode).
- **The names are meant to outlive the transport.** The plan for a cloud version (MQTT) keeps exactly these strings, so only `app_link.h` and the page's `connect()` would change.

## Reaching the doll

On its own network (`WIFI_MODE = WIFI_OWN_NETWORK`, the default), the doll is at `192.168.4.1`, and it answers every name with itself through a small DNS server. That makes the network a **captive portal**: right after joining, phones fetch a known address to check for internet, and the doll answers that check with a redirect to the app, so the phone opens it as a sign-in page.

| Check | Asked by | Before the app has opened | After |
|---|---|---|---|
| `/generate_204`, `/gen_204` | Android, Chrome | Redirect to `http://192.168.4.1/` | `204 No Content` |
| `/hotspot-detect.html`, `/library/test/success.html` | iPhone, Mac | Redirect | The "Success" page |
| `/connecttest.txt`, `/ncsi.txt` | Windows | Redirect | Microsoft's expected text |
| Anything else, any name | Everyone | Redirect | Redirect |

Once the app has been served, the checks get the answers the internet would give. The phone then treats the network as online and keeps it: on an iPhone, the pop-up's button changes from **Cancel** (which would leave the network) to **Done**. When the last phone leaves the doll's WiFi, the doll forgets, so the next phone gets the pop-up again.

In hotspot mode (`WIFI_HOTSPOT`), there's no portal: open the IP printed in Serial Monitor or `http://heartdoll.local`.
