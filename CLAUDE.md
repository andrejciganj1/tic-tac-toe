# CLAUDE.md

4×4×4 tic tac toe (two players on one screen, or vs a computer at three levels). One web page that runs in a browser (installable as a PWA, works offline) and inside a minimal Android WebView app.

## Layout

- `index.html`: the whole game, with markup, CSS and JS inline. This is the single source for both web and Android. The JS is split into script blocks: `rules` (win lines, board logic), `controller` (turns, modes, computer scheduling), `ai` (easy, medium, hard players), `geometry` (3D projection and hit testing) and `view` (canvas drawing and input).
- `tests/`: node tests (`rules`, `controller`, `geometry`, `ai`, `view`) plus the helpers `load.mjs` and `browser.mjs`.
- `manifest.json`, `sw.js`, `icon.png`: PWA bits. `sw.js` caches `./`, `index.html`, `manifest.json`, `icon.png`.
- `android/`: the WebView shell (`AndroidManifest.xml`, `src/.../MainActivity.java`, `build.sh`).
- `tic-tac-toe.apk`: committed build output, the file that gets copied to the phone.

## Conventions

- Plain HTML/CSS/JS, no frameworks, no bundler, no dependencies. Keep it that way unless asked.
- Everything must work offline and from `file://` (the Android app loads `file:///android_asset/index.html`). No network requests, no CDN assets.
- Dark theme (`#111` background), touch-first: tap targets, no hover-only behavior, phone width first.
- Small and readable over clever.

## When changing things

- Changed any cached file (every shipped change to `index.html`, `manifest.json` or `icon.png`)? Bump `CACHE` in `sw.js` (currently `ttt-v2`, next `ttt-v3`), or installed PWAs keep serving the old version.
- Added a file the page needs? Add it to `ASSETS` in `sw.js`, and to `android/build.sh` staging if the APK needs it too.
- Rebuild the APK with `./android/build.sh` (needs `ANDROID_SDK_ROOT` with build-tools + a platform, and a JDK). The Android SDK is not installed on the main dev Mac as of 2026-10-25, so `tic-tac-toe.apk` has not been rebuilt for 4×4×4 yet (it is still the 3×3 build).
- `build.sh` signs with `android/debug.keystore` and creates one if missing (gitignored). A new keystore means a new signature, so the phone must uninstall the old app before installing.

## Testing

- `node --test tests/*.test.mjs` runs everything. The `view` smoke tests drive headless Google Chrome and skip if it is missing; set `CHROME` to the browser path if needed.
- Also check by hand at 360×640 (no scrolling, layer buttons and status readable). Headless Chrome has a minimum window width of 500, so for 360 px use an iframe or dev tools device mode.
