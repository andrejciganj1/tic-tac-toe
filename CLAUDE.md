# CLAUDE.md

Two-player, same-screen tic tac toe. One web page that runs in a browser (installable as a PWA, works offline) and inside a minimal Android WebView app.

## Layout

- `index.html`: the whole game, with markup, CSS and JS inline. This is the single source for both web and Android.
- `manifest.json`, `sw.js`, `icon.png`: PWA bits. `sw.js` caches `./`, `index.html`, `manifest.json`, `icon.png`.
- `android/`: the WebView shell (`AndroidManifest.xml`, `src/.../MainActivity.java`, `build.sh`).
- `tic-tac-toe.apk`: committed build output, the file that gets copied to the phone.

## Conventions

- Plain HTML/CSS/JS, no frameworks, no bundler, no dependencies. Keep it that way unless asked.
- Everything must work offline and from `file://` (the Android app loads `file:///android_asset/index.html`). No network requests, no CDN assets.
- Dark theme (`#111` background), touch-first: tap targets, no hover-only behavior, phone width first.
- Small and readable over clever.

## When changing things

- Changed any cached file? Bump `CACHE` in `sw.js` (`ttt-v1` → `ttt-v2`), or installed PWAs keep serving the old version.
- Added a file the page needs? Add it to `ASSETS` in `sw.js`, and to `android/build.sh` staging if the APK needs it too.
- Rebuild the APK with `./android/build.sh` (needs `ANDROID_SDK_ROOT` with build-tools + a platform, and a JDK). The Android SDK is not installed on the main dev Mac as of 2026-10-25.
- `build.sh` signs with `android/debug.keystore` and creates one if missing (gitignored). A new keystore means a new signature, so the phone must uninstall the old app before installing.

## Testing

No automated tests. Run `python3 -m http.server 8000` and play at http://localhost:8000, including at phone width.

## Direction

Planned next: 4×4×4 tic tac toe (four in a row along any line, including space diagonals). Design not settled yet.
