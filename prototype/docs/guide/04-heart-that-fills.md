# Phase 4: A heart that fills

**Goal:** the phone app becomes one picture (two people joined to a heart that fills as each becomes available), and the doll says the same thing through brightness: 60% for one, 100% for both.

**Code:** [`firmware/heart_doll`](../../firmware/heart_doll): `state_machine.h`, `led.h`, `config.h`, `web_page.h` (v1.1)

No wiring changes.

## On the doll

Two changes: the heartbeat's **brightness** now says whether one or both of you are available (the same 60 BPM rhythm either way), and the **rules** treat each person's availability as their own.

- **Yours until you change it.** The doll person is available after Heart; the phone person after tapping their circle on. Neither can switch the other off.
- **Cross means "not now".** The doll goes dark, but the phone person stays available. That's a fifth state, **Declined**.
- **Asking again clears it.** If the phone person taps off and on again, the doll shows the 60% heartbeat again.

| Who was first | Then | Doll LED | State |
|---|---|---|---|
| Phone | Doll hasn't answered | Heartbeat at 60% | Connected |
| Phone | Doll presses Cross | Off; phone person still available | Declined |
| Phone | Doll presses Heart | Heartbeat at 100% | Together |
| Doll (Heart) | Phone hasn't answered | Slow breathing | Waiting |
| Doll (Heart) | Phone taps on | Heartbeat at 100% | Together |
| Both | Phone person steps away | Back to breathing | Waiting |
| Declined | Phone taps off, then on | Heartbeat at 60% | Connected |

In `led.h`, the two heartbeats share one rhythm and differ only in strength:

```cpp
case PATTERN_HEARTBEAT_SOFT: ledSetRGB(ledHeartbeatLevel(now) * CONNECTED_LEVEL, 0, 0); break;
case PATTERN_HEARTBEAT_FULL: ledSetRGB(ledHeartbeatLevel(now) * TOGETHER_LEVEL, 0, 0);  break;
```

"60%" means 60% as the eye sees it: after gamma correction, that's about 36% of the LED's power.

## The app

The whole screen is one SVG: **Them** (the doll person) at the top, **You** at the bottom, each joined to the heart by a squiggly pipe. Tap your circle to switch between available and unavailable.

| Happens | Pipe | Heart |
|---|---|---|
| You become available | Bottom pipe draws itself up to the heart | Liquid rises from the bottom to half |
| They press Heart | Top pipe draws itself down | Drops fall in from the top until half full |
| The second person joins | Their pipe draws | Fills to the top, then glows and beats |
| Someone leaves, or says "not now" | Only their pipe pulls back | Drains to the other person's half |

How it's drawn:

- **Trim path:** each pipe's red copy has a dash exactly as long as the path; sliding it with `stroke-dashoffset` makes the line draw itself.
- **The heart as a container:** the liquid is a rectangle with a wavy top, clipped to the heart. The heart is wider at the top, so half its *area* sits at 59% of its height; a small lookup table converts one to the other.
- **One loop, only while moving:** a single `requestAnimationFrame` loop moves the pipes, the liquid and the drops, and stops when nothing moves.

The messages are exactly the same as in Phase 3, plus `status:declined`, so `app_link.h` didn't change at all.

## Steps

1. Upload. Serial Monitor shows `=== Heart Doll v1.1 - liquid heart ===`.
2. On your phone, **reload the page** so the browser fetches the new app.
3. Walk through every row of the table in [On the doll](#on-the-doll), watching the LED and the phone together.

## What to check

- [ ] Phone first: your circle fills, the bottom pipe draws, the heart fills to half from below, and the doll beats at a visibly dimmer heartbeat.
- [ ] Then Heart on the doll: the top pipe draws, the heart fills, glows and beats; the doll jumps to full brightness.
- [ ] Then Cross: the doll goes dark; on the phone only the top pipe pulls back and the heart drains to your half.
- [ ] Doll first: drops fall from the top pipe until the heart is half full, then stop.
- [ ] Reloading the page in any state fills it to the right level by itself.
- [ ] Hotspot off: "Doll offline" at the top, and your circle can't be tapped.

## Tuning

| Setting | Where | Default | Effect |
|---|---|---|---|
| `CONNECTED_LEVEL` | `config.h` | 0.60 | Doll brightness when only the phone person is available |
| `TOGETHER_LEVEL` | `config.h` | 1.00 | Doll brightness when both are; lower it if it's too bright by the bed |
| `PIPE_MS` | `web_page.h`, script | 700 | How long a pipe takes to draw |
| `RISE_MS` / `DRIP_MS` | `web_page.h`, script | 1100 / 1500 | How long filling takes, from below / with drops |
| `@keyframes beat` | `web_page.h`, CSS | 1 s | The full heart's beat. Keep it matching `BEAT_MS` |

## If something's wrong

| Symptom | Likely cause and fix |
|---|---|
| The phone still shows an old app | The browser kept the old page. Reload, or close the tab and open the address again |
| Taps work, but nothing animates | The phone has Reduce Motion on. States still change, just without movement |
| 60% and 100% look the same on the doll | LEDs are hard to judge directly. Look through a sheet of paper, or lower `CONNECTED_LEVEL` to 0.4 |

**This is v1.1, the current version.** What comes next is in the [roadmap](../../README.md#roadmap).
