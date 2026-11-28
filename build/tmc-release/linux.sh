set -euo pipefail
dir="$RUNNER_TEMP/TechMeCoding.AppDir"
mkdir -p "$dir/usr"
mv ../VSCode-linux-x64 "$dir/usr/tmc"
cp -R docs/techmecoding "$dir/usr/tmc/TMC-Lessons"
cat > "$dir/AppRun" <<'SH'
#!/bin/sh
exec "$(dirname "$0")/usr/tmc/code-oss" "$@"
SH
chmod 755 "$dir/AppRun"
cp resources/linux/code.png "$dir/tmc.png"
cat > "$dir/tmc.desktop" <<'DESKTOP'
[Desktop Entry]
Type=Application
Name=TechMeCoding
Exec=tmc %F
Icon=tmc
Categories=Development;IDE;
DESKTOP
prefix="dist/TechMeCoding-$VERSION-Linux-x64-unsigned"
tool="$RUNNER_TEMP/appimagetool"
curl -fsSL --retry 3 https://github.com/AppImage/appimagetool/releases/download/1.9.1/appimagetool-x86_64.AppImage -o "$tool"
echo "ed4ce84f0d9caff66f50bcca6ff6f35aae54ce8135408b3fa33abfc3cb384eb0  $tool" | sha256sum -c -
chmod +x "$tool"
ARCH=x86_64 "$tool" --appimage-extract-and-run "$dir" "$prefix.AppImage"
image="$(realpath "$prefix.AppImage")"
(cd "$RUNNER_TEMP" && "$image" --appimage-extract >/dev/null)
verify() {
  output=$("$1/bin/code-oss" --version)
  grep -Fx "$GITHUB_SHA" <<< "$output"
  grep -Fx x64 <<< "$output"
}
verify "$RUNNER_TEMP/squashfs-root/usr/tmc"
root="$RUNNER_TEMP/deb"
mkdir -p "$root"/{opt,DEBIAN,usr/bin,usr/share/applications,usr/share/pixmaps}
mv "$dir/usr/tmc" "$root/opt/techmecoding"
ln -s /opt/techmecoding/bin/code-oss "$root/usr/bin/tmc"
cp "$dir"/tmc.desktop "$root/usr/share/applications/"
cp "$dir"/tmc.png "$root/usr/share/pixmaps/"
cat > "$root/DEBIAN/control" <<CONTROL
Package: techmecoding
Version: ${VERSION/-/\~}
Architecture: amd64
Maintainer: TechMeCoding <39589318+clark-2468@users.noreply.github.com>
Description: TechMeCoding educational Python IDE
Depends: libgtk-3-0, libnss3, libasound2, libgbm1, libxkbfile1, libsecret-1-0, libxss1, libxtst6, libxkbcommon0, libdrm2, libcurl4, libkrb5-3
CONTROL
dpkg-deb --root-owner-group --build "$root" "$prefix.deb"
sudo apt-get install -y "$(realpath "$prefix.deb")"
verify /opt/techmecoding
