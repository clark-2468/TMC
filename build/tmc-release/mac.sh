set -euo pipefail
stage="$RUNNER_TEMP/dmg"
app="TechMeCoding.app"
mkdir "$stage"
src="../VSCode-darwin-$ARCH/$app"
state=unsigned
if [[ -n "$P12_B64$P12_PASSWORD$IDENTITY$NOTARY_KEY$KEY_ID$ISSUER" ]]; then
  : "${P12_B64:?}" "${P12_PASSWORD:?}" "${IDENTITY:?}" "${NOTARY_KEY:?}" "${KEY_ID:?}" "${ISSUER:?}"
  umask 077
  keychain="$RUNNER_TEMP/buildagent.keychain"
  password=$(openssl rand -hex 32)
  trap 'security delete-keychain "$keychain" || true; rm -f "$RUNNER_TEMP/cert.p12" "$RUNNER_TEMP/key.p8"' EXIT
  printf %s "$P12_B64" | base64 -D > "$RUNNER_TEMP/cert.p12"
  printf %s "$NOTARY_KEY" | base64 -D > "$RUNNER_TEMP/key.p8"
  security create-keychain -p "$password" "$keychain"
  security unlock-keychain -p "$password" "$keychain"
  security import "$RUNNER_TEMP/cert.p12" -k "$keychain" -P "$P12_PASSWORD" -T /usr/bin/codesign
  security set-key-partition-list -S apple-tool:,apple: -s -k "$password" "$keychain" >/dev/null
  AGENT_TEMPDIRECTORY="$RUNNER_TEMP" VSCODE_ARCH="$ARCH" CODESIGN_IDENTITY="$IDENTITY" node build/darwin/sign.ts "$(dirname "$PWD")"
  state=signed
else
  codesign --force --deep --sign - "$src"
fi
mv "$src" "$stage/"
cp -R docs/techmecoding "$stage/TMC-Lessons"
ln -s /Applications "$stage/Applications"
dmg="dist/TechMeCoding-$VERSION-macOS-$ARCH-$state.dmg"
hdiutil create -srcfolder "$stage" -volname TechMeCoding -format UDZO "$dmg"
if [[ $state == signed ]]; then
  codesign --keychain "$keychain" --timestamp --sign "$IDENTITY" "$dmg"
  xcrun notarytool submit "$dmg" --key "$RUNNER_TEMP/key.p8" --issuer "$ISSUER" --key-id "$KEY_ID" --wait --output-format json | jq -e '.status=="Accepted"'
  xcrun stapler staple "$dmg"
  xcrun stapler validate "$dmg"
fi
hdiutil verify "$dmg"
mount=$(mktemp -d)
hdiutil attach -readonly -nobrowse -mountpoint "$mount" "$dmg"
codesign --verify --deep --strict "$mount/$app"
version=$("$mount/$app/Contents/Resources/app/bin/code" --version)
grep -Fx "$GITHUB_SHA" <<< "$version"
grep -Fx "$ARCH" <<< "$version"
hdiutil detach "$mount"
