# TMC Windows x64 development build

From a Windows x64 checkout, install the Code - OSS development prerequisites, including the supported Visual Studio C++ toolchain. Use the Node.js version in `.nvmrc` and the pnpm version in `package.json`.

```powershell
pnpm install --frozen-lockfile
pnpm run gulp vscode-win32-x64
```

The build produces a `VSCode-win32-x64` directory next to the checkout. Run `Code - OSS.exe` from that directory and use **TechMeCoding: Import Instructions…** to open one of the example lessons in the repository. An installed local Python interpreter is required for the **Run Saved Python File** and **Trace Saved Python File** commands.

The **TMC Windows development build** GitHub Actions workflow packages the same target. Once the workflow is available on the default branch, select the development branch when dispatching it. Download the archive named `TMC-win32-x64-<commit>`, extract it, and open `Code - OSS.exe`. The archive includes sample lessons under `TMC-Lessons` and is intended for development testing.
