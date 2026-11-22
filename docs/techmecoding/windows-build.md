# TMC Windows x64 development build

From a Windows x64 checkout, install the Code - OSS development prerequisites, including the supported Visual Studio C++ toolchain. Use the Node.js version in `.nvmrc` and the pnpm version in `package.json`.

```powershell
pnpm install --frozen-lockfile
pnpm run gulp vscode-win32-x64
```

The build produces a `VSCode-win32-x64` directory next to the checkout. Run `TechMeCoding.exe` from that directory and use **TechMeCoding: Import Instructions…** to open one of the example lessons in the repository. An installed local Python interpreter is required for the **Run Saved Python File** and **Trace Saved Python File** commands.

The **TMC Windows development build** GitHub Actions workflow packages the same target. Once the workflow is available on the default branch, select the development branch when dispatching it. Download the archive named `TMC-win32-x64-<commit>`, extract it, and open `TechMeCoding.exe`. The archive includes sample lessons under `TMC-Lessons` and is intended for development testing.

## Check the archive on Windows

1. Extract the archive to a path containing spaces. Start `TechMeCoding.exe` and open a trusted local folder.
2. Import `variables-and-loop.tmc.json` from `TMC-Lessons`. Try an incorrect answer, reveal the hint, then enter the correct answer.
3. Edit the Python draft, switch steps, and return. Open the edited draft in a Python editor, save it as a `.py` file, and run it by selecting an installed interpreter. Check the terminal output.
4. Run **Trace Saved Python File**. Check that the terminal remains available and the recorded playback tab highlights the executed lines and shows variable changes.
5. Repeat the run and cancel the confirmation. Then try running a file in a restricted workspace and check that the command asks for a trusted workspace.
6. With an OpenAI model configured, try **Ask Tutor** and **Generate Python Lesson**. Decline one request and confirm another. Save and import the generated JSON lesson after reviewing it.
