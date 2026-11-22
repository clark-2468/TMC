# VS Code Agents Instructions

This file provides instructions for AI coding agents working with the VS Code codebase.

For detailed project overview, architecture, coding guidelines, and validation steps, see the [Copilot Instructions](.github/copilot-instructions.md).

Prefer `CancellationToken`/`CancellationTokenSource` internally and adapt `AbortSignal` only at native or third-party API boundaries; see the [cancellation guidance](.github/copilot-instructions.md#cancellation).

## TechMeCoding (TMC)

Read [TMC Requirements](docs/TMC_REQUIREMENTS.md) before planning or implementing TMC changes. Use it as the source for product requirements, architecture, security, testing and development priorities.

- Check the working tree, branch and recent commits. Preserve existing work and verify the current implementation before extending it.
- Before significant changes, explain the proposed implementation and identify the affected files or modules. Make the smallest maintainable change, validate it and report limitations.
- Ask before making major architectural changes, performing destructive Git operations, merging into `main` or removing existing functionality.
- AI-generated shell commands require explicit user approval before execution.
- Use British English in documentation and learner-facing content.
