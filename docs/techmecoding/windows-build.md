# TMC Windows x64 development build

From a Windows x64 checkout, install the Code - OSS development prerequisites, including the supported Visual Studio C++ toolchain and Windows SDK. Use an x64 Developer PowerShell with `signtool.exe` available on `PATH`. Use the Node.js version in `.nvmrc` and the pnpm version in `package.json`.

```powershell
pnpm install --frozen-lockfile
pnpm run gulp vscode-win32-x64
./scripts/package-tmc-portable.ps1 -OutputDirectory $PWD
```

Extract the entire portable ZIP to a writable folder and double-click `TechMeCoding.exe`. No installation or administrator privileges are required. Keep the adjacent `data` directory with the application. Portable mode stores settings and profiles under `data/user-data` and user-installed extensions under `data/extensions`. Use **TechMeCoding: Import Instructions…** to open a file from `TMC-Lessons`. The IDE includes Electron and its runtime dependencies. Running or tracing Python programmes uses a separately installed interpreter of your choice.

The **TMC Windows development build** workflow runs on packaging changes pushed to `tmc-development`. Open the workflow run and download **TechMeCoding-portable-win32-x64** under **Artifacts**. The separate **TechMeCoding-source** ZIP contains the complete tracked tree for the same commit. Building from an extracted source archive requires initialising a local Git checkout for the upstream build scripts. In the extracted project root, run `git init`, `git add -A` and `git commit -m "Import TMC source snapshot"` before the build commands above. Configure a local Git identity if needed. Such a build reports the new local commit.

## Check the archive on Windows

1. Extract the archive to a path containing spaces. Start `TechMeCoding.exe` and open a trusted local folder.
2. Import `variables-and-loop.tmc.json` from `TMC-Lessons`. Try an incorrect answer, reveal the hint, then enter the correct answer.
3. Edit the Python draft, switch steps, and return. Open the edited draft in a Python editor, save it as a `.py` file, and run it by selecting an installed interpreter. Check the terminal output.
4. Run **Trace Saved Python File**. Check that the terminal remains available and the recorded playback tab highlights the executed lines and shows variable changes.
5. Repeat the run and cancel the confirmation. Then try running a file in a restricted workspace and check that the command asks for a trusted workspace.
6. With an OpenAI model configured, try **Ask Tutor** and **Generate Python Lesson**. Decline one request and confirm another. Save and import the generated JSON lesson after reviewing it.
