# TestFlight checklist

This environment cannot upload a build. There is no Apple session and no physical iPhone here. The steps below are what to run on a machine that has both.

Gate Runner targets **Expo SDK 58**. It uses only modules that ship in Expo Go (`expo-gl`, `expo-audio`, `expo-haptics`, `expo-sqlite`, `expo-router`). A store build is still required for TestFlight.

## 1. Accounts and ids

- Apple Developer Program membership for the team that will own the app.
- App Store Connect app whose bundle id is `com.seldenmathews.gaterunner` (already set in `app.json`).
- Expo account. From the repo: `npx eas-cli@latest login` then `npx eas-cli@latest init`.
- `eas init` writes `extra.eas.projectId` into `app.json`. Commit that id. It is not a secret.
- In `eas.json`, replace `REPLACE_WITH_APPLE_TEAM_ID` and `REPLACE_WITH_APP_STORE_CONNECT_APP_ID` before `eas submit`.

`ITSAppUsesNonExemptEncryption` is already `false`. The app does not collect data, does not use ads, accounts, or IAP, and does not ship an analytics SDK.

## 2. Confirm Expo Go before you burn a build

```bash
npm install
npx expo start
```

Open the project in Expo Go on an iPhone. The CLI prints the SDK it expects. If the App Store copy of Expo Go is still on an older SDK, skip Go and use the preview or production profile below.

On device, play all three levels and check:

- Drag steers, and the squad cannot leave the road.
- The level 1 glitch gate shows a shimmer and a `HACK` counter. Shooting it flips `-12` to `+12`.
- A normal gate does not flip.
- Enemy packs thin out under fire. Whatever is left removes squad members on contact.
- Weapon and gold pickups change the FIRE, DMG, and GOLD readouts.
- The barricade or boss scores survivors, then the win or lose card can retry, advance, or return to level select.
- Quitting and relaunching keeps the unlocked level and best score.
- Haptics fire on a flip, a bad gate, and the finale. The mute chip silences music and effects. Audio plays with the hardware silent switch on.
- The dev FPS counter (dev builds only) stays near 60 with a large squad.

## 3. Build and upload

```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --profile production --latest
```

`production` is a store build with remote build-number autoincrement. `preview` is an internal install if you want a binary without TestFlight. The `development` profile is also an internal install; it is not a custom dev client, so it runs the embedded bundle the same way a store build does.

The first iOS build asks for distribution credentials. Let EAS create and store them.

## 4. TestFlight pass

After processing finishes in App Store Connect:

- Add an internal tester and install from the TestFlight app.
- Repeat the device checks above on a release build. The FPS counter is hidden outside `__DEV__`.
- Confirm the icon, the launch screen, and portrait lock.
- Confirm the app does not prompt for the microphone. The audio plugin disables that permission on purpose.

## 5. If the build fails

- `npx expo-doctor` on the same commit.
- Read the EAS iOS build log for the failing native phase. Do not hand-edit `ios/`; native projects are generated from `app.json`.
- SDK 58 needs Node `>= 22.13`.
