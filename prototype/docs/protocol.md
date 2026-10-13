# Doll ↔ phone protocol

The phone loads the app over HTTP from `/`, then opens a WebSocket at `ws://<address>/ws`. Every message is a short line of plain text, `kind:value`, so the traffic is easy to read in Serial Monitor (every message the doll sends is printed as `-> phone: ...`).

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
- **The names are meant to outlive the transport.** The plan for a cloud version (MQTT) keeps exactly these strings, so only `app_link.h` and the page's `connect()` would change.
