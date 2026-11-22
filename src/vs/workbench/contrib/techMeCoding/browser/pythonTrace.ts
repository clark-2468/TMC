/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The learner's file is passed as a separate argument. Keep the executable trace
// helper fixed, and use Python's normal process permissions and terminal streams.
export const pythonTraceScript = String.raw`
import json
import os
import sys
import tokenize
import types

script = os.path.abspath(sys.argv[1])
trace_path = sys.argv[2] if len(sys.argv) > 2 else None
sys.argv = [script]
sys.path.insert(0, os.path.dirname(script))
stderr = sys.stderr
remaining = 200
frames = []
with tokenize.open(script) as source_file:
    source = source_file.read()
can_record = trace_path is not None and len(source) <= 20000
programme = compile(source, script, "exec")
module = types.ModuleType("__main__")
module.__file__ = script
module.__cached__ = None
sys.modules["__main__"] = module

def display_value(value):
    kind = type(value)
    if kind is str:
        return repr(value[:80]) + ("..." if len(value) > 80 else "")
    if kind is int and value.bit_length() > 300:
        return "<large integer>"
    if any(kind is builtin for builtin in (bool, int, float, type(None))):
        return repr(value)
    if any(kind is builtin for builtin in (list, tuple, dict, set)):
        return "<" + kind.__name__ + ", " + str(len(value)) + " items>"
    return "<object>"

def trace_message(message):
    try:
        print(message, file=stderr)
    except (OSError, ValueError):
        pass

def trace_frame(frame, event, argument):
    global remaining
    if event not in ("line", "return") or not remaining:
        return trace_frame

    remaining -= 1
    variables = []
    for name, value in frame.f_locals.items():
        if type(name) is not str or name.startswith("__"):
            continue
        variables.append({"name": name[:40], "value": display_value(value)[:100]})
        if len(variables) == 12:
            break

    location = "before line" if event == "line" else "leaving line"
    if can_record:
        frames.append({"line": frame.f_lineno, "event": event, "variables": variables})
    rendered = ", ".join(item["name"] + " = " + item["value"] for item in variables)
    message = f"[TMC] {location} {frame.f_lineno}: " + (rendered or "(no variables)")
    trace_message(message)
    if not remaining:
        trace_message("[TMC] Trace limit reached. The programme continues running.")
        sys.settrace(None)
    return trace_frame

def trace_call(frame, event, argument):
    if event == "call" and frame.f_code.co_filename == script:
        return trace_frame
    return None

sys.settrace(trace_call)
try:
    exec(programme, module.__dict__)
finally:
    sys.settrace(None)
    if can_record and frames:
        try:
            with open(trace_path, "x", encoding="utf-8") as trace_file:
                json.dump({"source": source, "frames": frames}, trace_file)
        except OSError:
            pass
`;
