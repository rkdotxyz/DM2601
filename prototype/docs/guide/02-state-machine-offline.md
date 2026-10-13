# Phase 2: The state machine, offline

**Goal:** run the doll's rules from the Heart and Cross buttons, with Serial Monitor standing in for the phone. No WiFi yet.

**Code:** [`firmware/heart_doll`](../../firmware/heart_doll): `config.h`, `state_machine.h`, `led.h`, `buttons.h`, `heart_doll.ino`

No wiring changes from Phase 1.

## The idea

- **A state machine.** The doll is always in exactly one **state**. Things that happen are **events**: Heart, Cross, phone available, phone unavailable. A rule says which state each event leads to.
- **Rules apart from effects.** `nextState()` in `state_machine.h` only *decides*: give it a state and an event, it returns the next state. It never touches the LED or sends anything. `handleEvent()` in `heart_doll.ino` then *carries it out*. You can read the whole rulebook on one screen.
- **Serial plays the phone.** All talk with the phone goes through `app_link.h`. Typing `a` or `u` in Serial Monitor sends the same events a phone will, and every message the doll would send is printed as `-> phone: ...`.

```cpp
DollState nextState(DollState current, DollEvent event) {
  bool phoneAvailable = (current == STATE_CONNECTED ||
                         current == STATE_DECLINED  ||
                         current == STATE_TOGETHER);
  switch (event) {
    case EVENT_HEART: return phoneAvailable ? STATE_TOGETHER : STATE_WAITING;
    case EVENT_CROSS: return phoneAvailable ? STATE_DECLINED : STATE_IDLE;
    // ... phone available / unavailable ...
  }
}
```

The modules from Phase 1 move in almost unchanged: `led.h` is Test B's drawing code, `buttons.h` is Test C's debounce, behind `buttonPressed()`, which is true exactly once per press.

> **How it was first built.** In the original Phase 2, `app_link.h` was a Serial-only stand-in, and there were three states (Idle, Waiting, Connected) with "latest action wins". The finished firmware has five states (Phase 4) and real WiFi (Phase 3), but it **still accepts `a`, `u` and `?` from Serial Monitor**, so you can do this phase with it before setting up WiFi.

## Steps

1. Open `firmware/heart_doll/heart_doll.ino` in Arduino IDE. The other files open as tabs.
2. In `config.h`, set `COMMON_ANODE` from Test A. If Test A showed red and green swapped, keep `PIN_RED = 26`, `PIN_GREEN = 25`; if your LED is in the usual order, swap them back (`PIN_RED = 25`, `PIN_GREEN = 26`).
3. Upload, and open Serial Monitor.
4. Watch the **colour check**: red, green, blue, half a second each. If the LED doesn't match the printed names, swap the pin numbers in `config.h` until it does.

Without a `secrets.h`, the sketch builds with placeholder WiFi details and the LED gives a short blue blink every 2 s, because it can't join a network. That's expected for now; everything else works.

## Run the flows

**The doll person reaches out first:**

```
[HEART button] idle -> waiting          (flash, then slow breathing)
    -> phone: event:heart
    -> phone: status:waiting
[phone: available] waiting -> together  (type a: heartbeat at full brightness)
    -> phone: status:together
[phone: unavailable] together -> waiting  (type u: back to breathing)
    -> phone: status:waiting
```

**The phone person reaches out first:**

```
[phone: available] idle -> connected    (type a: heartbeat at 60%)
    -> phone: status:connected
[CROSS button] connected -> declined    (flash, then dark: "not now")
    -> phone: event:cross
    -> phone: status:declined
```

## Predict, then try

The full rulebook is in [architecture](../architecture.md#the-state-machine). For each of these, guess first, then check the LED and the log:

| Try this | Expected |
|---|---|
| Heart, then Heart again | Breathing continues; a flash on each press; second press logs `(no change)` but still sends `event:heart` |
| Cross while dark | Flash, stays dark; `event:cross` is still sent |
| `a`, Cross, then `u`, `a` | 60% heartbeat, dark, still dark, 60% heartbeat again: asking again clears "not now" |
| Press Heart mid-beat, fast and slow | The pattern never stutters or restarts |

## What to check

- [ ] On start: colour check in the right order, then `status:idle` and a dark LED (apart from the blue no-WiFi blink).
- [ ] Both flows produce the logs above.
- [ ] Every button press gives exactly one flash and one log line.
- [ ] Every row in Predict, then try matches.

**If a button does nothing,** rerun `03_buttons_test`: if it fails there, it's wiring; if it passes, check the pins in `config.h`. Deciding "part or logic?" first saves a lot of time.

**Next:** [Phase 3, the phone app](03-phone-app.md).
