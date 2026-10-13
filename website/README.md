# Heart Doll website

**Live: https://rkdotxyz.github.io/DM2601/website/**

A 3D customiser for the Heart Doll: a soft doll by the bed whose heart glows when someone far away is there for you. It's a standalone demo of the concept, not connected to the [prototype](../prototype) or its phone app.

Put the doll in the middle, then make it yours:

- **Colour:** heather grey like the sewn doll, seven other fabrics, or any colour.
- **Head:** beanie, nightcap, party hat, crown, bow or flower.
- **Eyes:** round glasses, sunglasses, heart glasses or a sleep mask.
- **Extras:** scarf, backpack, a moon plush and a heart balloon, as many as you like.
- **Stickers:** pick one and tap the doll to stick it on. They follow the curve of the body.
- **Sketch:** draw straight onto the fabric, all the way round. Drag on the doll to draw; drag anywhere else to turn the view.
- **Heart:** you have the doll; the other person is far away with the phone app. Switch each of you on or off and the heart shows it with the same light as the real doll: slow breathing when only you are available, a 60% heartbeat when they are, full brightness when you both are.

**Places:** the button under the doll moves it between eight little 3D rooms: a plain studio, a bedside table, on the bed, a window sill, a bookshelf, a desk, a sofa and on a suitcase. They're real 3D, so you can still drag to look around.

Night mode dims the room so the glow looks as it would by the bed (lamps switch on, the window shows the night sky), and the save button downloads a PNG of your doll where it is.

## Run it

Needs Node.js 20 or newer.

```bash
cd website
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

```bash
npm run build     # production build into dist/
npm run preview   # serve the build locally
npm run lint
```

`dist/` uses relative paths, so it can be hosted from any folder. On every push to `main`, the [Pages workflow](../.github/workflows/pages.yml) builds it and publishes it at `/DM2601/website/`.

## How it's built

[Vite](https://vite.dev), React and TypeScript, with [React Three Fiber](https://r3f.docs.pmnd.rs) and [drei](https://drei.docs.pmnd.rs) for the 3D, `@react-three/postprocessing` for the glow, and [zustand](https://zustand.docs.pmnd.rs) for state. There are no image or model files: the doll and everything on it are built in code.

```
src/
  App.tsx              layout, toolbar (night, save, start over), place picker
  Scene.tsx            camera, lights, bloom, orbit controls
  store.ts             everything you can change, in one zustand store
  ui/Panel.tsx         the customisation panel and its tabs
  doll/
    profile.ts         the body's shape: one curve, spun around; helpers to place things on it
    Doll.tsx           body, feet, seams, embroidered face, the glowing heart, stickers, drawing
    Accessories.tsx    headwear, eyewear and extras
    textures.ts        knit fabric, face, heart patch, stickers and stripes, drawn on canvases
    paint.ts           the drawing layer: strokes painted into the body's texture
    heartbeat.ts       the heart's light, with the firmware's timings
    GroundShadow.tsx   the soft shadow under the doll
  places/
    list.ts            the eight places, and how far the camera may turn in each
    Places.tsx         the rooms and furniture, built from simple shapes
    materials.ts       wood, fabric, wall, sky, photo and map textures
```

A few details:

- **One curve makes the body.** `profile.ts` defines the radius at each height. The body is a lathe of that curve, and hats, glasses and scarves use the same curve to sit on the surface at any size.
- **Stickers and the face are decals.** drei's `<Decal>` projects a texture onto the body, so a sticker bends with the fabric wherever you tap.
- **Drawing goes into the body's UV texture.** The UVs wrap around the doll, so each brush dab is stretched sideways by how wide the body is at that height, to stay round on the fabric.
- **Places are rooms, not pictures.** The surface the doll sits on is always at y = 0, and each place builds its furniture and four walls around that. The doll and camera never move; in rooms with a wall close behind, the camera just can't swing round past it.
- **The heart matches the real doll.** `heartbeat.ts` copies the breathing and lub-dub timings from the firmware's `led.h`, and the states have the same names as in [`prototype/docs/architecture.md`](../prototype/docs/architecture.md).

While developing, the store is available in the browser console as `window.doll`, e.g. `doll.setState({ headwear: 'crown' })`.

## License

Code: MIT, see [`LICENSE`](../LICENSE). Design and text: [CC BY 4.0](../LICENSE-CC-BY-4.0.txt).
