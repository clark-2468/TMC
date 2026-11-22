# TechMeCoding (TMC) Requirements

This document defines the product vision, development requirements and roadmap.

- **Project name** — TechMeCoding (TMC)
- **GitHub repository** — `clark-2468/TMC`
- **Foundation** — Microsoft Code - OSS
- **Primary platform** — Windows desktop application
- **Primary programming language taught** — Python
- **Development branch** — `tmc-development`

---

## 1. Project Vision

TechMeCoding (TMC) is a beginner-friendly, AI-assisted Python integrated development environment (IDE), built on top of Microsoft's open-source Visual Studio Code foundation (Code - OSS).

Its main purpose is to teach programming to complete beginners through highly detailed explanations, interactive tutorials, editable code, and visual representations of how programmes execute.

TMC should combine the functionality of a professional development environment with the accessibility of an interactive educational platform.

The application must not simply provide an AI chatbot beside a conventional text editor.

Instead, it should integrate programming education directly into the coding experience.

**The central objective is to help learners understand not only what code does, but precisely how and why it works, step by step.**

TMC should be designed for people with little or no prior programming experience, including learners who may not understand basic concepts such as variables, functions, loops, conditions, data types or program execution.

The educational experience should be detailed, intuitive, visual and interactive.

---

## 2. Core Product Requirements

### 2.1 Desktop Application

TMC should be a fully functional desktop application based on Code - OSS.

The primary target is Windows, with the architecture ideally remaining compatible with other desktop platforms.

The application should retain the advantages of a real IDE:

- Code editing and syntax highlighting.
- File and folder management.
- Integrated terminal.
- Python execution.
- Debugging functionality.
- Git version control.
- Python package management using pip.
- Python virtual environments.
- Extension compatibility wherever practical.
- Access to the user's local filesystem.
- Standard editor navigation and workspace management.

Existing Code - OSS functionality should be preserved wherever possible.

Educational features should be added through modular components rather than unnecessary changes to unrelated editor internals.

The final application must support both guided tutorials and real Python projects. Teach Python modules and imports, file and folder management, Git, pip, virtual environments, debugging, testing and multi-file projects using the corresponding real tools where practical.

### 2.2 Browser Development and Testing

Although the intended product is a desktop application, browser-compatible features should also be testable using Code - OSS's existing web workbench.

Browser testing should be used for:

- Lesson interfaces.
- Instruction rendering.
- Educational visualisations.
- User-interface interactions.
- Lesson import and validation.
- Navigation between lesson steps.
- Browser-compatible AI tutoring features.

Native desktop functionality must be tested separately.

A successful browser build must not be treated as proof that Electron packaging, local Python execution, native terminals or filesystem integration work correctly.

---

## 3. Interactive Learning Mode

A dedicated **TMC Learning Mode** is one of the most important requirements.

This should be a first-class application experience rather than a simple Markdown document viewer.

### 3.1 Learning Mode Layout

The interface should allow beginners to view educational instructions alongside editable code.

A possible layout includes:

**Instruction panel**

Displays:

- Lesson title and objectives.
- Detailed conceptual explanations.
- Step-by-step instructions.
- Illustrations and diagrams.
- Animated examples.
- Questions and exercises.
- Hints and feedback.
- Navigation between lesson steps.

**Code editor**

Provides:

- Editable Python code.
- Syntax highlighting.
- Code execution controls.
- Relevant error messages.
- Optional debugging assistance.
- Synchronisation with the current lesson step.

**Visualisation panel**

Displays:

- Variables and their values.
- Changes in program state.
- Control flow.
- Loops and iterations.
- Function calls.
- Data structures.
- Execution timelines.
- Other relevant graphical explanations.

**Output panel**

Displays actual program output, errors and relevant execution information.

The layout should reuse existing Code - OSS components where practical.

Panels should ideally be resizable, and learners should be able to focus on the code or lesson content as needed.

### 3.2 Lesson Navigation

The learner should be able to:

1. Open or import a lesson.
2. Read the learning objectives.
3. Follow individual instructions.
4. Inspect and edit example code.
5. Execute code where supported.
6. Observe the resulting output and visualisations.
7. Complete exercises or checks.
8. Receive feedback.
9. Move forwards or backwards through the lesson.

Lesson state should remain consistent when navigating between steps.

The system should avoid unexpectedly overwriting user-written code.

---

## 4. Extremely Detailed Beginner-Friendly Teaching

TMC should prioritise clarity and understanding over brevity.

Explanations must assume that the learner may have no previous experience of programming. Give learners hints and actionable checks before supplying exercise solutions, unless they explicitly ask for a solution. Introduce advanced IDE features progressively as learners gain confidence.

For example, when introducing:

```python
x = 10
print(x)
```

The system should not simply say:

"The variable x stores 10, and print displays it."

It should explain:

1. Python executes instructions according to its execution rules.
2. The statement `x = 10` is an assignment.
3. The expression on the right-hand side evaluates to the integer value `10`.
4. The name `x` becomes associated with that value.
5. The `=` symbol represents assignment in this context, not an equality comparison.
6. The statement `print(x)` calls the built-in `print` function.
7. Python evaluates `x` to obtain its associated value.
8. The function displays a textual representation of that value.
9. The resulting output is `10`.

Where appropriate, the interface should display a graphical representation of these operations.

Explanations must remain technically accurate while using language accessible to beginners.

The system should avoid misleading simplifications, especially concerning Python variables, references, memory and object identity.

---

## 5. Animated Code Execution Visualisations

TMC should support detailed, interactive visualisations that demonstrate what happens when Python code executes.

This is a defining feature of the project.

### 5.1 Required Visualisation Concepts

The visualisation system should eventually support:

#### Variables and assignment

Show:

- Variable names.
- Associated values.
- Changes following assignments.
- Relevant Python objects and references.
- Relationships between variables.

#### Data types

Illustrate:

- Integers.
- Floating-point numbers.
- Strings.
- Booleans.
- Lists.
- Dictionaries.
- Tuples.
- Sets.
- Other relevant Python types.

#### Conditions

Show how Python evaluates conditions and chooses execution paths.

#### Loops

Illustrate each iteration of `for` and `while` loops.

Display:

- Current iteration.
- Relevant variable values.
- Condition evaluations.
- Execution progress.
- Loop termination.

#### Functions

Illustrate:

- Function definitions.
- Function calls.
- Argument passing.
- Local variables.
- Return values.
- Call-stack behaviour.

#### Data structures

Visualise the structure and behaviour of lists, dictionaries and other relevant data types.

#### Errors and debugging

Where practical, show:

- Where an error occurs.
- The relevant execution state.
- Why the error happened.
- How the learner might resolve it.

### 5.2 Execution-Driven Visualisations

**Visualisations should be based on actual program execution state wherever feasible.**

They should not merely display prewritten animations that may disagree with the learner's code.

The long-term architecture should support an execution-tracing mechanism capable of producing structured state changes that the interface can visualise.

For example:

```python
x = 1
x = x + 2
print(x)
```

The visualisation might show:

1. The name `x` is associated with `1`.
2. The expression `x + 2` evaluates to `3`.
3. The name `x` is reassigned to `3`.
4. The output becomes `3`.

Learners should ideally be able to pause, replay, step forwards and step backwards through recorded execution states.

For initial development, author-provided execution traces may be used, but they must be distinguished from live execution-derived traces.

The system must never present a simulated trace as verified runtime behaviour.

### 5.3 Visual Design

Visualisations should be:

- Visually clear.
- Easy for beginners to understand.
- Consistent across lessons.
- Appropriately animated.
- Responsive to interface resizing.
- Accessible where practical.
- Designed to reduce cognitive overload.

Animations should support understanding rather than serve as decoration.

---

## 6. Two Lesson Generation Modes

TMC must eventually support two complementary educational workflows.

### 6.1 Mode A — Pre-generated Lessons

A user should be able to generate a structured lesson using GPT outside the application and import it into TMC.

The lesson should contain structured educational information that TMC can interpret.

Potential content includes:

- Lesson metadata.
- Learning objectives.
- Explanations.
- Python code examples.
- Step-by-step instructions.
- Exercises.
- Expected outputs.
- Validation checks.
- Diagram or visualisation descriptions.
- Author-provided execution traces.

The application should interpret the structured file and display the appropriate interactive learning interface.

**Importing a lesson must not require a live OpenAI API connection.**

### 6.2 Mode B — Live AI-Assisted Tutoring

TMC should also support interactive tutoring using the OpenAI API.

The AI tutor should eventually be able to:

- Explain unfamiliar code.
- Answer questions about the current lesson.
- Provide more detailed explanations.
- Generate examples.
- Offer hints.
- Help diagnose errors.
- Adapt explanations to the learner's understanding.
- Generate additional exercises.
- Produce structured lesson content.
- Explain execution visualisations.

The AI tutor should use relevant context from the current lesson and code where authorised.

Live AI functionality should be modular and should not be required for ordinary editing or importing pre-generated lessons.

---

## 7. Structured Lesson File Format

The primary educational lesson format should be a structured, versioned JSON specification.

This format should be stable, documented and validated.

### 7.1 Design Principles

The format should:

1. Have an explicit version identifier.
2. Separate educational content from application behaviour.
3. Support multiple lesson steps.
4. Include code snippets and expected outputs.
5. Support validation checks.
6. Describe visualisations in a structured manner.
7. Support optional execution traces.
8. Be readable and generatable by AI.
9. Be extensible as TMC evolves.
10. Provide understandable error messages for invalid content.

### 7.2 Published Lesson Format

See the [lesson format guide](techmecoding/lesson-format.md) for the supported schema and example lessons. Check the existing parser before proposing any schema changes.

### 7.3 Validation

The importer should validate:

- File format and structure.
- Supported format version.
- Required fields.
- Step identifiers.
- Supported content types.
- Relevant visualisation definitions.
- Exercise and check definitions.
- Optional execution traces.

Invalid content should generate useful errors rather than silently failing.

### 7.4 Backwards Compatibility

Where practical, newer versions of TMC should remain compatible with previously supported lesson files.

Schema changes should be deliberate, documented and tested.

---

## 8. Import Instructions Functionality

TMC should include an accessible **Import Instructions** feature.

The importer should be available through suitable application commands, including the Command Palette and, where supported, the File menu.

Supported formats should include:

- Structured JSON lessons.
- Markdown instruction files.
- Plain-text instruction files.

### 8.1 Structured Lessons

JSON lessons should open in the dedicated interactive Learning Mode wherever supported.

They should not be treated only as ordinary text files.

### 8.2 Markdown and Plain Text

Markdown and plain-text instructions should remain useful even if they do not contain the structured metadata required for advanced interactions.

They may use a simpler instruction viewer or an appropriate existing editor.

---

## 9. Python Execution Architecture

The application should distinguish clearly between lesson content, code execution and visualisation.

A suitable conceptual architecture is:

**Lesson content → Lesson parser → Lesson state → Code execution → Execution trace → Visualisation renderer**

Actual implementation should follow the existing Code - OSS architecture and reuse available services.

The execution system should eventually support:

- Running Python code.
- Capturing standard output.
- Capturing errors.
- Recording selected execution states.
- Mapping execution events to source lines.
- Providing execution data to visualisations.

Python execution must be treated as potentially untrusted.

Appropriate isolation, explicit user consent where needed, resource limits and safe execution controls should be considered. Treat imported lesson content as untrusted, restrict filesystem operations to authorised locations, preserve Code - OSS security boundaries and avoid unsafe Electron renderer permissions.

Do not assume that a browser environment can directly execute the same local Python workflow as the desktop application.

The system should not execute imported lesson code automatically without appropriate safeguards.

---

## 10. Integration with Code - OSS

TMC is a Code - OSS-based product, not an unrelated IDE.

Development should prioritise preservation of existing functionality.

### 10.1 Architecture

Prefer:

- Modular extensions or isolated workbench contributions.
- Existing workbench services.
- Reusable editor components.
- Appropriate webviews or other supported UI mechanisms.
- Clear separation between educational functionality and IDE infrastructure.

Avoid:

- Unnecessary modifications to core editor functionality.
- Large-scale unrelated refactoring.
- Hard-coded lesson content inside the application.
- Duplicate implementations of existing Code - OSS capabilities.
- Breaking the application to implement educational features.

### 10.2 Product Identity

The long-term objective is for the finished application to have its own product identity as TechMeCoding.

Branding should eventually include appropriate application naming, icons and visual identity.

Packaging and distribution must respect the licences and third-party notices applicable to Code - OSS and its dependencies.

Do not assume that Microsoft's proprietary Visual Studio Code branding or marketplace services may be redistributed unchanged.

---

## 11. OpenAI API Integration and Security

TMC should support the OpenAI API for live tutoring and structured content generation.

However, API integration must be implemented securely.

Requirements:

- Never hard-code API keys in source files.
- Never commit API keys to GitHub.
- Never package a shared developer-owned key into an executable. Use a secure backend for developer-funded access or operating-system credential storage for user-supplied keys.
- Distinguish development secrets from end-user credentials.
- Avoid exposing credentials in logs.
- Request only the code or lesson context needed for the relevant AI task.
- Explain when source code or lesson content may be transmitted to an external API.
- Handle network errors and API failures gracefully.

A future user-facing authentication or API-key configuration approach should be designed before public distribution.

API access should be optional for offline-compatible educational functionality.

---

## 12. Development Workflow

Work on the TMC development branch. Verify the actual repository and branch state before making changes.

### 12.1 Git Safety

Before implementing changes:

1. Inspect the working tree.
2. Identify the current branch.
3. Check relevant recent commits.
4. Preserve existing feature work.
5. Avoid destructive Git commands.
6. Do not force-push or overwrite remote branches without explicit authorisation.
7. Do not merge into `main` without user approval.

Each meaningful development milestone should be committed appropriately.

A local commit does not necessarily mean the work has been pushed to GitHub.

### 12.2 Cloud Environment

Follow the project’s environment setup and build instructions for Node.js, pnpm, web preview, type checking and desktop prerequisites.

### 12.3 Browser Testing

Use the environment’s preview when available. In Codex Cloud, a server listening on loopback is accessible inside the cloud environment. Verify an accessible preview URL before sharing it with the user.

### 12.4 Desktop Builds

TMC should eventually produce downloadable Windows x64 development builds.

Prefer the existing Code - OSS/Electron build infrastructure.

Where appropriate, configure GitHub Actions to:

- Build the Windows application.
- Support manual workflow triggering.
- Produce downloadable build artefacts.
- Associate artefacts with specific commits.
- Report build failures clearly.

A successful web build must not be described as a successful Windows desktop build.

---

## 13. Testing and Quality Assurance

All changes should be validated to the extent practical.

Testing should include:

### Static and build checks

- TypeScript type checking.
- Relevant unit tests.
- Web-client compilation.
- Build configuration validation.

### Functional testing

- Importing valid lessons.
- Rejecting invalid lessons.
- Rendering explanations.
- Navigating between steps.
- Displaying Python snippets.
- Preserving user edits.
- Rendering visualisations.
- Handling missing or malformed data.

### Integration testing

- Compatibility with existing Code - OSS functionality.
- Web workbench interaction.
- Desktop application behaviour.
- Python execution integration when implemented.
- AI integration when implemented.

### Reporting

After each task, Codex should report:

1. What was implemented.
2. Which files were modified.
3. Which tests were performed.
4. Which tests passed or failed.
5. Which features remain untested.
6. Any known limitations.
7. How the user can manually test the results.
8. Whether changes were committed or pushed to GitHub.

Do not report successful implementation based solely on code generation without appropriate verification.

---

## 14. Development Priorities

Development should be incremental.

Avoid attempting to implement the entire application in a single task.

### Phase 1 — Foundation

- Establish reproducible Code - OSS development setup.
- Preserve existing IDE functionality.
- Implement and validate lesson importing.
- Document the structured lesson format.
- Provide example lessons.
- Establish reliable Git workflows.

### Phase 2 — Learning Mode

- Create a dedicated interactive lesson interface.
- Display lessons alongside editable Python code.
- Support lesson navigation.
- Add exercises and validation feedback.
- Preserve learner edits.
- Improve the beginner-friendly presentation.

### Phase 3 — Execution Visualisations

- Establish a structured visualisation model.
- Implement variable-state visualisations.
- Support playback of author-provided traces.
- Develop runtime-derived execution traces.
- Add loop, condition, function and data-structure visualisations.
- Add stepping, replay and navigation.

### Phase 4 — AI Tutoring

- Integrate OpenAI API access.
- Support contextual explanations.
- Add interactive hints.
- Generate structured lessons.
- Validate AI-generated lesson content.
- Provide safe and understandable error handling.

### Phase 5 — Desktop Integration

- Validate Python execution on Windows.
- Integrate Python environments and package management.
- Test debugging and terminal workflows.
- Produce repeatable Windows builds.
- Resolve application-specific packaging issues.

### Phase 6 — Refinement

- Improve accessibility.
- Improve performance.
- Expand lesson types.
- Refine visualisations.
- Improve user experience.
- Test with actual beginners.
- Prepare the application for wider distribution.

These phases indicate development priorities, not proof that individual features are incomplete or complete.

The actual repository state should determine the next implementation task.

---

## 15. Persistent Instructions for Codex

When working on TechMeCoding:

1. Treat this document as the project's product vision and development requirements.
2. Inspect existing code and relevant `AGENTS.md` instructions before modifying the repository.
3. Preserve previously implemented features and avoid unnecessary reimplementation.
4. Develop educational features as modular components.
5. Prioritise beginner comprehension, technical accuracy and clear visual explanations.
6. Ensure the lesson engine can function independently of the live AI service.
7. Prefer execution-driven visualisations when feasible.
8. Keep the JSON lesson specification stable and documented.
9. Maintain compatibility with Code - OSS wherever practical.
10. Apply appropriate security precautions to Python execution and API credentials.
11. Validate changes with relevant tests.
12. Distinguish completed work from proposed work.
13. Distinguish local commits from remotely published work.
14. Avoid destructive Git operations.
15. Keep implementation tasks reasonably scoped.
16. Explain architectural decisions when they affect future development.
17. Do not silently change the project's overall direction.
18. Ask for approval before major architectural changes, destructive operations or merging into `main`.

---

## 16. Definition of Success

TechMeCoding should ultimately allow a complete beginner to:

1. Open the application on their computer.
2. Import or generate a Python lesson.
3. Read detailed, understandable instructions.
4. See and edit real Python code.
5. Run the code.
6. Observe visually how the programme executes.
7. Understand how variables, conditions, loops and functions behave.
8. Receive useful feedback when something goes wrong.
9. Ask an AI tutor for further explanation when desired.
10. Gradually progress from guided lessons to independent programming.

**The ultimate goal is not merely to make Python code easier to write, but to make programming easier to understand.**

TMC should bridge the gap between learning programming concepts and using a professional development environment.
