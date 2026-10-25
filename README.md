# Tic Tac Toe

Simplest two-player tic tac toe (same screen). Works in a browser and as an Android app.

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
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"   # or your SDK path
./android/build.sh
```

That writes a fresh `tic-tac-toe.apk` at the repo root.
