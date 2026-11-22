# TechMeCoding (TMC) — Codex Agent Instructions

## Project Identity

TechMeCoding (TMC) is an AI-assisted educational desktop IDE built from Microsoft's open-source Code - OSS project.

Its purpose is to teach complete beginners Python programming through extremely detailed, interactive, step-by-step instructions, code execution visualisations and personalised tutoring.

The application should progressively introduce real software development concepts, including:

- Python syntax and programming fundamentals
- File and directory management
- Python modules and imports
- Git and version control
- Package management with pip
- Python virtual environments
- Debugging and testing
- Multi-file software projects

## Core Product Principles

1. **Beginner-first design:** Assume learners have no previous programming experience. Explain terminology, syntax and reasoning carefully.
2. **Learning before automation:** Do not automatically solve exercises for learners unless explicitly requested.
3. **Step-by-step teaching:** Divide complex programming tasks into small, understandable, verifiable steps.
4. **Visual explanations:** Use interactive graphics to illustrate program state, variables, loops, functions, file operations and Git workflows.
5. **Real development environments:** Prefer genuine Python, Git and filesystem operations over simulations when teaching development tools.
6. **Progressive complexity:** Hide advanced IDE functionality initially and introduce it as learners develop confidence.
7. **Maintainability:** Keep TMC-specific features modular and minimise unnecessary modifications to upstream Code - OSS.

## Architecture Requirements

- Use the existing Code - OSS infrastructure wherever practical.
- Prefer implementing educational functionality as a built-in extension or isolated workbench contribution.
- Separate the lesson engine, AI tutor, visualisation system and execution-state tracking.
- Use structured, schema-validated lesson data rather than rendering arbitrary AI-generated UI instructions.
- Derive execution visualisations from actual runtime state wherever possible.
- Preserve existing editor, terminal, debugging and Git functionality.
- Support Windows initially, with macOS and Linux compatibility as longer-term goals.

## AI Integration

TMC will eventually support two lesson modes:

**Mode 1 — Pre-generated lessons**

Lessons are generated using AI, reviewed or validated, then stored as structured lesson data for offline use.

**Mode 2 — Live AI tutoring**

TMC communicates with the OpenAI API to generate personalised lessons, answer questions, explain errors and provide contextual hints.

Do not embed developer-owned API keys in distributed desktop application code.

Use a secure backend for developer-funded API access, or appropriate operating-system credential storage for user-supplied API keys.

## Security Requirements

- Treat AI-generated content and project files as untrusted input.
- Never execute AI-generated shell commands without explicit user approval.
- Restrict filesystem operations to authorised locations.
- Avoid exposing secrets in logs, commits or application output.
- Preserve Code - OSS security boundaries.
- Do not introduce unsafe Electron renderer permissions.

## Development Workflow

Before implementing a significant feature:

1. Inspect relevant existing code and architecture.
2. Explain the proposed implementation.
3. Identify affected files and modules.
4. Prefer the smallest maintainable change.
5. Implement automated tests where appropriate.
6. Run relevant tests and report results.
7. Document limitations and outstanding work.

Do not rewrite large portions of Code - OSS unnecessarily.

Do not remove existing functionality without explicit approval.

Use British English in documentation and learner-facing content.

## Current Development Stage

The project is currently in its initial planning and prototyping phase.

Priorities:

1. Analyse Code - OSS architecture.
2. Establish TMC branding and project structure.
3. Design the structured lesson engine.
4. Implement a minimal Learning Mode.
5. Build a Python variables lesson with interactive visualisation.
6. Introduce AI lesson generation after the lesson engine is validated.

Do not attempt to implement the entire product in one task.
