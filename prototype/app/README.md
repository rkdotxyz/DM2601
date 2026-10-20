# Heart Doll app

The phone app for the Heart Doll, rebuilt in React and React Three Fiber: a frosted-glass heart that fills with liquid, joined by frosted tubes to the two people. **Them** is the Heart Doll itself; **You** are your photo in a floating locket. It shares the [customiser website](../../website)'s look: warm paper, soft matte materials, the same studio lighting, Fraunces and Inter.

**Try the demo:** https://rkdotxyz.github.io/DM2601/app/ (with a simulated doll: press its Heart and Cross buttons, and tap your photo).

The doll serves this app itself, from [`firmware/heart_doll/web_page.h`](../firmware/heart_doll/web_page.h), over its own WiFi.

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
| `npm run build:doll` | Builds the app for the doll as one gzipped file and rewrites `firmware/heart_doll/web_page.h`. Upload the firmware again afterwards |
| `npm run qr` | A printable QR sticker that joins the doll's WiFi, from `firmware/heart_doll/secrets.h`, in `qr/` (kept out of git: it holds the password) |
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

The protocol is in [`docs/protocol.md`](../docs/protocol.md); the app also understands `link:busy`, which the doll sends to a second phone.

## Credits

Default portrait: [Woman in white crew neck shirt smiling](https://unsplash.com/photos/woman-in-white-crew-neck-shirt-smiling-IF9TK5Uy-KI) by [Jake Nackos](https://unsplash.com/@jakenackos), under the [Unsplash License](https://unsplash.com/license). Typefaces: Fraunces and Inter (SIL Open Font License).
