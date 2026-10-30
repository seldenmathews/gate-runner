# Gate Runner

A one-thumb lane runner for iPhone. A squad auto-runs a sky-high road over a foggy city. Drag to steer. Math gates grow or shrink the crowd. The squad shoots enemy packs on the way to a boss or an end wall, and whoever is still standing is the score.

**Gate Hack.** Some gates are rigged. They shimmer. Line the squad up and shoot one enough times and its operator flips: `-12` becomes `+12`, `/2` becomes `x2`. A normal gate never flips. Level 1 teaches it with one obvious rigged gate.

Runs are about 30 to 60 seconds. There is no account, no ads, no IAP, and no analytics SDK.

## Run it on an iPhone

Requirements: Node.js 22.13 or newer, and Expo Go for **SDK 58** (or an EAS build).

```bash
npm install
npx expo start
```

Scan the QR code from Expo Go. The dev server has to be reachable from the phone (same Wi-Fi, or the tunnel the CLI offers).

This repo was not run on a physical iPhone. If Expo Go on the App Store is still an older SDK, it will refuse to open the project. Use the TestFlight path in [docs/TESTFLIGHT.md](docs/TESTFLIGHT.md) instead of downgrading the app.

Useful scripts:

| Command             | What it does                                                                     |
| ------------------- | -------------------------------------------------------------------------------- |
| `npm start`         | Expo dev server                                                                  |
| `npm run ios`       | Expo, then the iOS simulator (needs macOS)                                       |
| `npm run web`       | Browser preview. Arrow keys or A/D steer. `?autodrive=1` on a level plays itself |
| `npm run typecheck` | `tsc --noEmit`                                                                   |
| `npm run lint`      | ESLint                                                                           |
| `npm test`          | Jest                                                                             |
| `npm run format`    | Prettier                                                                         |

Web autodrive, for a hands-off look at a level: open `/play/1?autodrive=1`.

## Architecture

The simulation does not know React or three.js exists. Rendering reads the simulation; it does not decide the rules.

```
src/sim        deterministic run: steering, gates, crowd math, shots, contact, finale
src/levels     level-1.json, level-2.json, level-3.json, parsed at startup
src/render     expo-gl + @react-three/fiber. Instanced soldiers, enemies, shots, particles
src/ui         title, HUD, pause, win/lose
src/services   haptics, generated audio, on-device progress
src/app        expo-router screens
```

`step(state, input, dt)` mutates one `GameState` and is deterministic: same state, same input, same dt, same result. There is no `Math.random` in the sim. Squad members are a count plus a formation, not hundreds of simulated bodies. The renderer writes that formation into `InstancedMesh`es, capped at 240 soldiers, which is what keeps a full crowd cheap on an iPhone 12-class GPU.

Progress is a small JSON document in `expo-sqlite` (`expo-sqlite/kv-store`) on device and `localStorage` on web. Winning a level unlocks the next one and keeps the best score.

## Add a level

1. Copy `src/levels/level-1.json` to `src/levels/level-4.json`.
2. Give it a new `id`, name, and brief. Gates come in pairs that share a `z`: one `left`, one `right`. Operators are `add`, `sub`, `mul`, and `div`. Values are positive integers (`mul` and `div` start at 2).
3. A rigged gate sets `"rigged": true` and `"hitsToFlip"` to a positive integer. Only rig a penalty (`sub` or `div`). The flip turns it into the matching bonus. A rigged `mul` would become a `div`, which is a trap this version does not use.
4. Keep `length / speed` between 20 and 70 seconds. With the finale duration, the whole run should land around 30 to 60 seconds. Enemy groups are at most 24 each and 80 total.
5. Register the file in `src/levels/index.ts`. Unlock order follows that array.
6. `npm test` parses every shipped level and checks that the scripted advisor in `src/sim/auto.ts` can clear it. If the new level is unfair, that test fails on purpose.

`parseLevel` throws `LevelParseError` with the field path. A bad file fails at import time, not halfway down the road.

## Juice

Particles, camera shake, haptics (`expo-haptics`), and audio (`expo-audio`) are driven by simulation events. The mute chip silences both music and effects. Audio is mixed with `playsInSilentMode` so a run is still audible with the hardware silent switch on.

Sound and music are synthesized by `scripts/generate-audio.mjs` and committed as wav. They are original and CC0. See `assets/audio/LICENSE`.

UI type is Teko and Rajdhani from Google Fonts, SIL Open Font License 1.1. See `assets/fonts/OFL-Teko.txt` and `assets/fonts/OFL-Rajdhani.txt`.

## EAS and TestFlight

`eas.json` has `development`, `preview`, and `production` profiles. The iOS bundle id is `com.seldenmathews.gaterunner`. Production is the store profile used for TestFlight. The Apple team id and App Store Connect app id in `eas.json` are placeholders. Replace them, then follow [docs/TESTFLIGHT.md](docs/TESTFLIGHT.md).

No TestFlight upload was made from this workspace.

## Tests

Jest covers crowd math (including rounding and the squad cap), gate flips, level parsing, steering limits, contact, finale scoring, progress unlocks, and a full clear of levels 1 to 3. GitHub Actions runs typecheck, lint, format, and tests on Node 22.

Frame rate was not measured on an iPhone 12. The crowd is instanced and the simulation does not allocate a body per soldier, but 60fps on device is still something to confirm with the dev FPS counter.
