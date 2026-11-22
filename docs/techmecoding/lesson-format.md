# TechMeCoding lesson format v1

Save the lesson as UTF-8 JSON, for example `python-variables.tmc.json`. Open it with **File → Import Instructions…**. The importer validates the file and opens it in Learning Mode with step navigation, checks and editable Python drafts.

## Prompt to give GPT

Copy this prompt and replace the final line with your question.

> Generate one TechMeCoding lesson that answers the learner’s question. Assume the learner is new to Python. Use British English and introduce one concept at a time. Explain unfamiliar terms. Give the learner one concrete action per step and a way to check it. Use short, deterministic Python examples. When the learner asks an exercise question, give hints before revealing the solution.
>
> Return one valid JSON object. Use double quotes, escape newlines in code strings as `\n`, and omit Markdown fences, comments, trailing commas, and unlisted fields.
>
> The top-level fields are `version` (the number 1), `title` (up to 120 characters), `objective` (up to 2,000 characters) and `steps` (1–30 objects in teaching order). Each step requires `title` (up to 120 characters), `instruction` and `check` (up to 2,000 characters each). Required text must contain visible content. A step can include `code` (Python source, up to 4,000 characters), `animation` and `exercise`.
>
> An animation requires code and has `kind` (`variables`, `loop`, or `function`) and `frames` (2–20 objects in execution order). Each frame has `line` (a 1-based line number within this step’s code), `caption` (up to 2,000 characters), and `variables` (up to 12 objects containing unique Python identifier `name` and string `value`, up to 80 and 200 characters respectively). Use simple ASCII names. Include only variables visible at that point and show their values after the line executes. Optional `output` (up to 1,000 characters) is the cumulative output after that line. Omit optional fields where they do not apply. Keep the file under 1 MiB.
>
> An exercise has a `prompt` (up to 2,000 characters), an `expectedAnswer` (up to 1,000 characters) and an optional `hint` (up to 2,000 characters). Use exercises when the answer is unambiguous and can be compared as text. Answer checking ignores leading and trailing whitespace and differences in line endings. Use the step’s `check` to guide open-ended reflection.
>
> Trace the code yourself before returning the JSON. Use simple examples with no input, randomness, network access, or external packages. If you cannot reliably trace a snippet, omit its animation.
>
> Learner’s question: [INSERT QUESTION]

Try the [variables](python-variables.tmc.json), [running total](variables-and-loop.tmc.json), and [functions and decisions](functions-and-decisions.tmc.json) examples.

## Teaching animation design

Show the code beside the state it produces. Start paused. Give the learner **Previous**, **Next**, **Play/Pause**, and **Replay** controls with keyboard access. Show the frame number and announce the current caption when the learner steps. Respect reduced-motion preferences by switching frames instantly, and use text as well as colour to identify changes.

- **Variables** highlight the line just executed and show the previous and new values. Label a value as new, changed, or removed as students step.
- **Loops** let the learner revisit the condition and body in execution order. Repeated line numbers are expected. Use the caption to explain the iteration and show how the loop ends.
- **Functions** show the argument-to-parameter assignment, the local values used, and the result flowing back into the caller. Explain each transition in the caption. Scoped call-stack data can be added in a later format version.
- **Output** shows the cumulative text so learners can compare it with what they see when they run the example themselves.

Version 1 stores illustrative frames supplied by the lesson author. Learning Mode plays these frames beside the original example and highlights the corresponding line. Use the desktop trace command below to inspect the execution of a saved file.

## Run a Python draft on desktop

1. In Learning Mode, choose **Open Draft in Python Editor**.
2. Save the draft as a local `.py` file.
3. Open the Command Palette and choose **TechMeCoding: Run Saved Python File**.
4. Choose the executable for an installed Python interpreter (for example, the executable in your virtual environment).
5. Review the file and interpreter paths, then confirm. The integrated terminal shows the programme's output and errors, and stays open after it exits.

The command requires a trusted workspace and a local desktop window. Trace playback in a lesson continues to show the recorded example, while terminal output comes from the saved file.

For a live terminal trace, choose **TechMeCoding: Trace Saved Python File**. It reports which line is about to run and the local variables visible at that point. The trace covers the selected file and shows up to 200 events. The programme keeps running if it reaches that limit. Samples of strings are shortened, and collections are summarised by size.

## Ask the AI tutor

Configure an OpenAI model in **Manage Language Models**, then choose **Ask Tutor** on any lesson step. Enter a question and review the request before sending it. The tutor receives the question, the step title and its instructions. Sharing your current Python draft is optional. Imported lessons and exercises remain available offline.

To create a lesson in the app, run **TechMeCoding: Generate Python Lesson** from the Command Palette. Enter a topic and confirm that you want to send it to OpenAI. TMC checks the returned lesson against the version 1 format and opens it as JSON for review. Save it as a `.tmc.json` file and import it when you are ready.

When a trace finishes, TMC also opens a playback tab for files up to 20,000 characters when at least one frame was recorded. Playback uses the saved source read by the trace runner. The terminal retains the programme's output and errors.
