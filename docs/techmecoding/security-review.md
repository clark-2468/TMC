# TechMeCoding security review

26 November 2026. The review started at `abf1b1e4428` on `tmc-development`. The results below include the fixes committed with this report.

**Release assessment.** Hold public distribution pending review of the remaining high-severity dependency advisories and testing of the packaged Windows application.

## Source and user data

The review covered TMC changes since the Code - OSS fork point `f31439d`, including lesson import and rendering, Python execution and tracing, virtual environments, AI requests, example lessons and Windows packaging. No malicious behaviour was identified in the reviewed changes.

- Importing a JSON lesson validates its size and structure. The examples and imported code open for inspection. Running a saved Python file requires a trusted local desktop workspace, an interpreter selection and confirmation. Python then runs with the learner’s OS permissions.
- The tutor asks before sending the question and lesson context to the model provider. Sending draft code requires selecting a separate checkbox. The response is rendered as text. The generator opens validated lesson JSON for review.
- The Windows build workflow uses read-only repository permissions, disables credential persistence during checkout and pins external actions to commit hashes.
- Elastic YARA signatures were applied to all 21,636 tracked regular files in the application source tree. One tracked symlink was skipped. No matches were reported with 1,057 rule files from revision `418cfd9a`. A separate Gitleaks scan of the starting source snapshot flagged 56 matches, all in inherited files. These included test fixtures, telemetry identifiers and code that recognises key formats. No exposed TMC credential was identified. Commit history, externally downloaded extensions, installed packages and a final Windows executable were outside these scans.

## Fixes

- Run Python in isolated mode when invoking the environment creation and pip modules. This prevents Python from resolving those modules from the workspace or from the user's Python module search path. Normal programme execution keeps its existing behaviour.
- Update the root and remote JavaScript lockfiles and the separate Claude agent bundle. Updates cover the critical proxy-addr and shell-quote advisories, TLS and redirect handling in undici, and advisories affecting the MCP SDK and node-forge.
- Upgrade the CLI ZIP reader and affected HTTP, URL and zlib dependencies. The extractor strips privileged Unix permission bits, limits symlink target length and handles an empty archive without assuming there is a first entry.

## Dependency findings after fixes

Counts are by lockfile and can overlap. Advisory databases change over time. A match identifies an affected dependency version. User exposure depends on the feature, how it calls the dependency and what the packaged application includes.

| Lockfile scope | Critical | High | Moderate | Low |
| --- | ---: | ---: | ---: | ---: |
| Main JS workspace, including extensions and development tools | 0 | 9 | 32 | 14 |
| Build JS workspace | 0 | 4 | 2 | 1 |
| Remote JS workspace | 0 | 1 | 0 | 1 |
| Claude and Codex agent bundles, audited separately | 0 | 0 | 0 | 0 |

All four Cargo lockfiles returned zero entries in the RustSec vulnerability list. RustSec also reported maintenance and soundness warnings which require separate triage. The root desktop Electron target is 43.8.10. An npm advisory query for that exact target returned no entries. The separate Electron version used in Copilot development tooling appears in the root JS audit.

## Outstanding work before release

1. Prioritise the Microsoft authentication extension, Emmet image parsing and Zod input validation. The authentication and image-parsing upgrades cross major versions and need feature-level compatibility tests. [Microsoft authentication advisory](https://github.com/advisories/GHSA-xcx6-jx8p-x3h5) · [Image parsing advisory](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) · [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
2. Review build-time archive extraction and replace or isolate affected tooling. The registry reported no published patched version for the flagged extract-zip path-traversal advisory. The main workspace also has findings in Gulp dependencies, Vite and extension development tooling. [Build archive advisory](https://github.com/advisories/GHSA-jmr9-qjv8-65gv)
3. Build from the reviewed source on Windows. Scan the complete package, including bundled extensions and native binaries, and smoke-test lesson import, Python confirmation and the interpreter workflow before distributing it.

## Validation

The Python environment command passed real CPython environment creation and offline wheel installation, plus cancellation and workspace-trust checks. The root and remote frozen lockfile checks passed. The Claude agent bundle passed a clean dependency installation with lifecycle scripts disabled.

The Linux CLI utility suite passed 26 tests with one helper fixture ignored. The first run encountered unreaped child processes in the container. Running with a child subreaper provided the process cleanup expected by that test. The passing suite included ZIP extraction, permission restoration and archive path checks. Windows package behaviour remains unverified.
