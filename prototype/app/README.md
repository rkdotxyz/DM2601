# Heart Doll app

The phone app for the Heart Doll, rebuilt in React and React Three Fiber: a glass heart that fills with liquid, joined by glass tubes to the two people. **Them** is the Heart Doll itself; **You** are your photo in a floating locket.

**Try the demo:** https://rkdotxyz.github.io/DM2601/app/ (with a simulated doll: press its Heart and Cross buttons, and tap your photo).

> The doll still serves the original app from `firmware/heart_doll/web_page.h`. Baking this app into the firmware, and the doll's own WiFi network, come in the next step.

## What it does

- **The liquid follows the people.** Each person's liquid travels down their tube, then fills their half of the heart. When they leave, the heart drains first, then the tube. Change your mind halfway and the flow turns around from where it is.
- **Real liquid.** The surface stays level with gravity, sloshes when you tilt the phone, and nudges with every heartbeat. The doll person's half pours in from the top; yours rises from the bottom with bubbles.
- **The doll glows like the real one.** Its fabric heart uses the firmware's LED timing: slow breathing, then a heartbeat at 60% or 100%.
- **Together:** the heart glows and beats at 60 BPM, with a soft chord.
- **Sound, haptics and tilt.** Synthesised with Web Audio (no audio files). Vibration on Android, a light tick on iPhone (iOS 18+). The gyroscope on phones over https, the pointer otherwise.
- **Your photo.** The camera button next to "You" picks your own; it stays on your phone.

## Run it

```bash
cd prototype/app
npm install
npm run dev            # with a simulated doll
```

Open the printed address. Add `?doll=192.168.4.1` (or your doll's address) to drive a real doll instead.

| Command | What it does |
|---|---|
| `npm run dev` | Development server, simulated doll |
| `npm run build:demo` | The demo build (simulated doll), as published on GitHub Pages |
| `npm run build` | The build for the doll: talks to the doll that serves it |
| `npm run typecheck` | Type-check |

## How it's built

| Folder | Job |
|---|---|
| `src/doll/` | The link to a doll. `DollLink` is the interface; `localLink.ts` is the real doll's WebSocket, `simulatedDoll.ts` the stand-in (the firmware's `nextState()` rules, ported in `rules.ts`) |
| `src/app/` | The screen around the scene, and `useDoll`, the app's view of the doll |
| `src/scene/` | The 3D scene. `flow.ts` keeps each person's liquid as one number, so tube and heart can't disagree; `Heart.tsx`, `Tube.tsx`, `liquidMaterial.ts` (the liquid shaders), `Figure.tsx`, `Portrait.tsx` |
| `src/scene/doll/` | The doll, copied from [`website/src/doll/`](../../website/src/doll): keep the two in step |
| `src/fx/` | Sound, haptics and tilt |
| `src/demo/` | The demo page and the simulated doll's panel, with a copy of its LED |

The protocol is unchanged: see [`docs/protocol.md`](../docs/protocol.md).

## Credits

Default portrait: [Woman in white crew neck shirt smiling](https://unsplash.com/photos/woman-in-white-crew-neck-shirt-smiling-IF9TK5Uy-KI) by [Jake Nackos](https://unsplash.com/@jakenackos), under the [Unsplash License](https://unsplash.com/license). Typeface: Fraunces (SIL Open Font License).
