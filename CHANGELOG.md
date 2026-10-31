# Changelog

## 1.0.0 - 2026-10-30

### Fixed

- iOS no longer dies with SIGBUS when a level starts. The native renderer refuses half-float targets (ACES tone mapping and three's DFG lookup), drops `pixelStorei` modes Expo GL does not implement, and replaces `THREE.Clock` with `performance.now()`.
- iOS launch no longer loads three's CommonJS entry. That file calls `process.emitWarning`, which Hermes does not implement, so Expo Go crashed on the first 3D screen. Metro now resolves `three` to `build/three.module.js`.

### Added

- Expo SDK 58 app with a low-poly lane runner: drag steering, follow camera, math gates, and an instanced squad.
- Gate Hack. Shooting a rigged gate flips `sub`/`add` or `div`/`mul`. Level 1 teaches it with one shimmering gate.
- Enemy packs, gold and weapon pickups, and a boss or end-wall finale that scores survivors.
- Three data-driven levels, a win/lose card, retry, and a level select that stores unlocks and best scores on device.
- Particles, camera shake, haptics, and original CC0 sound and music.
- EAS profiles and a TestFlight checklist.
- Jest coverage for crowd math, gate flips, and level parsing, plus GitHub Actions for typecheck, lint, and tests.
