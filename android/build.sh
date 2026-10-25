#!/usr/bin/env bash
# Rebuild tic-tac-toe.apk with Android SDK build-tools (no Gradle).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
if [[ -z "$SDK" ]]; then
  for c in "$HOME/Library/Android/sdk" /workspace/android-sdk "$HOME/Android/Sdk"; do
    [[ -d "$c" ]] && SDK="$c" && break
  done
fi
[[ -n "$SDK" ]] || { echo "Set ANDROID_SDK_ROOT to your Android SDK"; exit 1; }
BT="$(ls -d "$SDK"/build-tools/* 2>/dev/null | sort -V | tail -1)"
ANDROID_JAR="$(ls -d "$SDK"/platforms/android-* 2>/dev/null | sort -V | tail -1)/android.jar"
[[ -x "$BT/aapt" && -f "$ANDROID_JAR" ]] || { echo "Need build-tools and an android platform in $SDK"; exit 1; }
command -v javac >/dev/null || { echo "javac required"; exit 1; }

OUT="$ROOT/out"
GEN="$OUT/gen"
OBJ="$OUT/obj"
CLS="$OUT/classes"
rm -rf "$OUT"
mkdir -p "$GEN" "$OBJ" "$CLS"

"$BT/aapt" package -f -m -J "$GEN" -M "$ROOT/AndroidManifest.xml" -S "$ROOT/res" -I "$ANDROID_JAR"
javac --release 11 -cp "$ANDROID_JAR" -d "$CLS" \
  "$ROOT/src/com/andrej/tictactoe/MainActivity.java" \
  "$GEN"/com/andrej/tictactoe/R.java
"$BT/d8" --min-api 21 --output "$OBJ" $(find "$CLS" -name '*.class')
"$BT/aapt" package -f -M "$ROOT/AndroidManifest.xml" -S "$ROOT/res" -A "$ROOT/assets" \
  -I "$ANDROID_JAR" -F "$OUT/base.apk"
( cd "$OBJ" && zip -u "$OUT/base.apk" classes.dex )
"$BT/zipalign" -f 4 "$OUT/base.apk" "$OUT/aligned.apk"

KEY="$ROOT/debug.keystore"
if [[ ! -f "$KEY" ]]; then
  keytool -genkeypair -v -keystore "$KEY" -storepass android -keypass android \
    -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Andrej,O=Dev,C=HR"
fi
"$BT/apksigner" sign --ks "$KEY" --ks-pass pass:android --key-pass pass:android \
  --out "$OUT/tic-tac-toe.apk" "$OUT/aligned.apk"
cp "$OUT/tic-tac-toe.apk" "$REPO/tic-tac-toe.apk"
"$BT/apksigner" verify "$REPO/tic-tac-toe.apk"
echo "Built $REPO/tic-tac-toe.apk"
