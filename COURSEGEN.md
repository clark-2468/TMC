# Turn a coding question into a TMC lesson

Give this file and the learner’s coding question to an AI tool. For example, ask “Follow COURSEGEN.md to teach me how to count the even numbers in a list.” Save the returned JSON as a UTF-8 file named `count-even-numbers.tmc.json` and open it in TechMeCoding with **File → Import Instructions…**.

## Instructions for the AI author

Write one lesson that helps the learner solve their question. Use British English and assume a beginner unless the learner gives a different level. TMC currently displays and runs Python drafts. If the question requires a different language, ask whether a Python adaptation would meet the learner’s goal before generating the lesson.

1. Identify the requested behaviour, inputs, outputs and constraints. Preserve supplied examples, function signatures and starter code where relevant. If a missing detail changes the correct answer, ask one focused question. Otherwise choose a simple example and state any necessary assumption in the lesson.
2. Start with a small instance of the actual problem. Ask the learner to predict or work out the answer by hand. For debugging questions, use the learner’s failing case and distinguish the observed result from the intended one.
3. Build towards the solution one decision at a time. Give each step one concrete action and a check the learner can observe. Explain new terms when they first appear. Give a hint before revealing a solution, and respect a request for hints only.
4. Make each runnable draft self-contained. Steps have separate drafts, so include any definitions or imports that a snippet needs. Prefer small, deterministic examples with local sample data. End by checking the result against the question and a meaningful boundary case.

## Output for Learning Mode

Return one raw JSON object with double-quoted keys and strings. Escape newlines inside strings as `\n`. Omit Markdown fences, comments, trailing commas and extra fields. Keep the UTF-8 file under 1 MiB.

| Field | What to write |
| --- | --- |
| `version`, `title`, `objective` | Use the number `1`, a title of up to 120 characters and an observable learning objective of up to 2,000 characters. |
| `steps` | An array of 1–30 steps in teaching order. Each needs a non-blank `title` (up to 120 characters), `instruction` and `check` (up to 2,000 characters each). |
| `code` (optional, on a step) | Editable Python source, up to 4,000 characters. Use the step’s instruction to tell the learner what to change or predict. |
| `exercise` (optional, on a step) | Supply a non-blank `prompt` (up to 2,000 characters), `expectedAnswer` (up to 1,000) and optionally a `hint` (up to 2,000). TMC compares text after trimming outer whitespace and normalising line endings. Use a single unambiguous answer. Put open-ended reasoning in `check`. |

Add an optional `animation` only when stepping through the code helps explain it. Follow the frame schema, use 1-based line numbers from the step’s original code, and verify the state after each illustrated line. [Lesson format and animation limits](docs/techmecoding/lesson-format.md)

## Worked example

For “How do I count the even numbers in a list?”, this lesson moves from recognising one even number to testing a counter with an empty list.

```json
{
  "version": 1,
  "title": "Count even numbers",
  "objective": "Count the even numbers in a Python list and explain why an empty list gives zero.",
  "steps": [
    {
      "title": "Recognise an even number",
      "instruction": "Predict the remainder when 4 is divided by 2. Python’s % operator gives that remainder.",
      "code": "print(4 % 2)",
      "exercise": {
        "prompt": "Which single digit will this print?",
        "expectedAnswer": "0",
        "hint": "Pair up four counters. How many are left over?"
      },
      "check": "Change 4 to 5. The remainder changes to 1 because one counter is left without a partner."
    },
    {
      "title": "Count the matches",
      "instruction": "Follow the loop with your finger. Each time the remainder is zero, add one to count.",
      "code": "numbers = [3, 4, 8]\ncount = 0\nfor number in numbers:\n    if number % 2 == 0:\n        count += 1\nprint(count)",
      "check": "The example prints 2 because 4 and 8 are even. Replace the list with [] and run it again. It prints 0 because the loop takes no turns."
    }
  ]
}
```

Before returning your lesson, parse the JSON if tooling is available, check required fields and lengths, and work through each example and expected answer. Ensure each check still matches the code in its own step. The worked example above illustrates the file format. Generate fresh steps for the learner’s question.
