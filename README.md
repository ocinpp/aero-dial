# AERO-DIAL

A late-90s/early-2000s Discman-inspired audio interface: a 3D CD player paired with a mechanical numeric dialer. Features a sleek, unified matte silver chassis, perfectly round rubberized buttons, and a dynamic LCD screen.
Dial `1984`, hit **CALL** (or ENTER), and the disc spins up.

Built with Vue 3 + TypeScript + Three.js, bundled with Vite. Runs fully offline —
no CDN scripts, no remote fonts.

## Quick start

```sh
npm install
npm run dev       # http://localhost:5173
```

## Scripts

| Script              | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Vite dev server with HMR                  |
| `npm run build`     | Type-check (`vue-tsc`) + production build |
| `npm run preview`   | Serve the production build locally        |
| `npm run typecheck` | Run `vue-tsc --noEmit` only               |

## Project structure

```
.
├── index.html                    # Vite entry, mounts #app
├── public/
│   └── track.mp3                 # (optional) audio for the CALL track
├── src/
│   ├── main.ts                   # Bootstrap + global CSS + fonts
│   ├── App.vue                   # Dialer UI + state
│   ├── styles.css                # All visual styling
│   ├── env.d.ts                  # Vue / Vite type shims
│   └── composables/
│       ├── useAudio.ts           # DTMF tones, MP3 playback, synth fallback
│       └── useThreeScene.ts      # Three.js CD player scene
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## Custom track

Drop an MP3 at `public/track.mp3`. It plays on loop with a 1.5 s fade-in when you
dial `1984` + **CALL**, and fades out over 0.5 s on **END**.

If the file is missing or fails to decode, a synthesized C-major sawtooth chord
plays as a fallback. To use a different filename, edit the single line in
`src/App.vue`:

```ts
const trackUrl = `${import.meta.env.BASE_URL}track.mp3`;
```

## Common tweaks

All visual tweaks for the 3D scene live in `src/composables/useThreeScene.ts`. The UI and chassis colors are controlled in `src/styles.css`.

**Transparent background.** The WebGL canvas has `alpha: true` and the dark/metal background boxes have been removed. This means the CD floats seamlessly over the CSS background of the chassis.

**CD framing.** The camera looks straight down at the CD and auto-fits its
distance to the canvas aspect ratio (handled by `frameCD()`, called on init
and on every resize). To tighten or loosen the fit, change `FRAME_RADIUS`:

```ts
const FRAME_RADIUS = 2.0; // CD radius 1.8 + small margin
```

For a 3/4 angled view instead of top-down, replace the `frameCD()` block with
a fixed camera:

```ts
camera.position.set(0, 5, 7);
camera.lookAt(0, 0, 0);
```

(and remove the `camera.up.set(...)` line and the `frameCD()` call inside
`resizeRendererToDisplaySize`).

**Spin speed.** In the `animate` loop:

```ts
targetSpeed = isPlaying.value ? 0.25 : 0; // radians per frame
```

**Brightness.** Adjust at the top of `initThreeScene`:

```ts
renderer.toneMappingExposure = 1.2; // 0.9 = darker, 1.5 = brighter
```

**Accent light color / intensity.**

```ts
const pointLight = new PointLight(0x00f0ff, 4, 20, 0);
```

## Tech notes

- **Three.js**: lighting uses physically-correct intensities (mandatory since
  r155). The two `PointLight`s have `decay = 0` to keep the original visual
  falloff. The CD's metallic look comes from `RoomEnvironment` as the studio
  probe — pure mirror surfaces (`metalness: 1.0`) only show what's in the
  environment map, not direct lights.
- **Audio**: a single `AudioContext` powers DTMF tones, MP3 playback, and the
  synth fallback. The MP3 is fetched once and cached as a decoded `AudioBuffer`.
- **Fonts**: `@fontsource/inter` and `@fontsource/share-tech-mono` are bundled
  locally — nothing fetched from Google Fonts at runtime.
- **Pointer events**: all dial-pad interaction uses `pointerdown` for unified
  mouse / touch / pen support.

## Browser support

Modern evergreen browsers with WebGL2 and Web Audio API. Tested on current
Chrome, Safari, and Firefox.
