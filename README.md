# Tic Tac Toe 4×4×4

Four in a row on a 4×4×4 cube: along any straight line of 4 cells (rows, columns, pillars, diagonals in any flat or vertical slice, and the 4 corner-to-corner space diagonals). Works in a browser and as an Android app.

## How to play

- Modes: 2 players (same screen), or vs Computer at Easy, Medium or Hard. Against the computer you are X and move first.
- The cube is four layers. Pick the active layer with the numbers 1 to 4.
- Tap a cube to select it, tap it again to place. Drag to rotate the view.
- "New game" opens the mode list. The last mode you picked is remembered.

## Play in the browser

Open `index.html`, or from this folder:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Android

`tic-tac-toe.apk` is a signed debug build (`com.andrej.tictactoe`). Copy it to your phone and install it (allow install from that source if HyperOS asks). It runs fully offline.

The APK is a WebView shell (`android/`) around the same `index.html` and `icon.png` as the browser version. `android/build.sh` copies them in at build time, so there is only one copy of the game. It needs the Android SDK build-tools and a JDK (no Gradle):

```sh
# SDK via Homebrew: brew install --cask android-commandlinetools, then
# sdkmanager "build-tools;34.0.0" "platforms;android-34" (sdkmanager needs Java 17+)
export ANDROID_SDK_ROOT="/opt/homebrew/share/android-commandlinetools"   # or your SDK path
./android/build.sh
```

That writes a fresh `tic-tac-toe.apk` at the repo root.

## Tests

```sh
node --test tests/*.test.mjs
```

The smoke tests drive the page in headless Google Chrome; set `CHROME` to the browser path if it is not found. Without Chrome they are skipped.
