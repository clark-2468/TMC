# Cross-platform releases

Run **Actions → TMC cross-platform release → Run workflow** on a trusted revision to rehearse a release. Enter a label such as `v1.0.0-rc.1`. Download the six packages and `SHA256SUMS.txt` from the **verified-release** artefact. Manual runs never create a Release.

For a release, tag the reviewed commit, for example with `git tag v1.0.0` followed by `git push origin v1.0.0`. Use a new v-prefixed semantic version for each release. The TMC distribution label is independent of the upstream Code - OSS engine version shown inside the editor. Four native jobs must succeed before publication credentials become available to the draft job. GitHub generates notes from repository history. Review those notes, checksums, signatures and downloads in **Releases → Drafts** before publishing. Protect release tags and restrict workflow changes to trusted maintainers.

| Platform | Downloads | Verification |
| --- | --- | --- |
| Windows x64 | Current-user Inno Setup EXE and portable ZIP | Portable launch, setup installation and installed CLI commit |
| macOS ARM64 and Intel x64 | One DMG per architecture | Image integrity, mounted app signature, CLI architecture and commit |
| Linux x64 | AppImage and amd64 DEB | Extracted AppImage CLI and installed Debian CLI |

Windows needs the Windows SDK, Visual C++ and Inno Setup 6. Intel macOS requires an available native `macos-15-intel` runner. Linux uses Ubuntu 22.04, native Electron development headers, squashfs tools and the checksum-pinned appimagetool. AppImage desktop launch requires compatible FUSE and Electron sandbox support. Python lessons that execute code use a separately installed interpreter.

## Signing

Configure Actions secrets in repository settings. Leave the whole platform group unset for development packages labelled `unsigned`. macOS development apps use an ad-hoc signature. Linux packages are unsigned. Never commit certificates or raw keys.

- Windows uses `TMC_WINDOWS_PFX` (base64 PFX with exportable Authenticode key) and `TMC_WINDOWS_PFX_PASSWORD`. Both the launcher and setup executable are signed, timestamped and verified. Hardware-backed or cloud-only keys require a provider-specific signing integration.
- macOS uses `TMC_MAC_P12` (base64 Developer ID Application certificate and private key), `TMC_MAC_P12_PASSWORD`, and `TMC_MAC_IDENTITY` (full Developer ID Application identity). Supply `TMC_NOTARY_KEY` (base64 App Store Connect .p8), `TMC_NOTARY_KEY_ID` and `TMC_NOTARY_ISSUER`. The runner imports the certificate into a temporary keychain, signs with Electron entitlements, submits the DMG, and staples and validates the accepted ticket. Signed builds require working Apple timestamp and notary services.

## Troubleshooting

Use the failing matrix job’s logs. Check native runner availability, dependency downloads, disk space, SDK versions and certificate validity. Retry transient runner failures from Actions. A failed or missing platform blocks draft creation. If GitHub interrupts the final release upload, inspect the partial draft and remove it before retrying the draft job. Review existing releases before removing anything. Verify downloaded files with `sha256sum -c SHA256SUMS.txt` or `shasum -a 256 -c SHA256SUMS.txt`. Signing and launch checks do not clear the dependency findings in the [security review](security-review.md).
