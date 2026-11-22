/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The learner's file is passed as a separate argument. Keep the executable trace
// helper fixed, and use Python's normal process permissions and terminal streams.
export const pythonTraceScript = String.raw`
import dis
import itertools
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

def display_value(value, depth=0):
    kind = type(value)
    if kind is str:
        return repr(value[:32]) + ("..." if len(value) > 32 else "")
    if kind is int and value.bit_length() > 300:
        return "<large integer>"
    if any(kind is builtin for builtin in (bool, int, float, type(None))):
        return repr(value)
    if any(kind is builtin for builtin in (list, tuple, dict, set, frozenset)):
        if depth >= 2:
            return "<" + kind.__name__ + ", " + str(len(value)) + " items>"
        if kind is dict:
            entries = [display_value(key, depth + 1) + ": " + display_value(item, depth + 1)
                       for key, item in itertools.islice(value.items(), 3)]
            start, end = "{", "}"
        else:
            entries = [display_value(item, depth + 1) for item in itertools.islice(value, 3)]
            if kind is list:
                start, end = "[", "]"
            elif kind is tuple:
                start, end = "(", ")"
                if len(value) == 1:
                    end = ",)"
            elif not value:
                return kind.__name__ + "()"
            else:
                start, end = ("frozenset({", "})") if kind is frozenset else ("{", "}")
        if len(value) > 3:
            entries.append("...")
        preview = ", ".join(entries)
        if len(preview) > 78:
            preview = preview[:78] + "..."
        return start + preview + end
    return "<object>"

def safe_preview(value):
    try:
        return display_value(value)[:100]
    except RuntimeError:
        return "<value changed during capture>"

def trace_message(message):
    try:
        print(message, file=stderr)
    except (OSError, ValueError):
        pass

def trace_frame(frame, event, argument):
    global remaining
    if event not in ("call", "line", "return", "exception") or not remaining or frame.f_lineno < 1:
        return trace_frame

    remaining -= 1
    variables = []
    objects = {}
    for name, value in frame.f_locals.items():
        if type(name) is not str or name.startswith("__"):
            continue
        item = {"name": name[:40], "value": safe_preview(value)}
        if not any(type(value) is builtin for builtin in (bool, int, float, str, type(None))):
            item["reference"] = objects.setdefault(id(value), len(objects) + 1)
        variables.append(item)
        if len(variables) == 12:
            break

    location = {"call": "entering line", "line": "before line", "return": "leaving line", "exception": "exception on line"}[event]
    if can_record:
        stack = []
        current = frame
        while current and current.f_code.co_filename == script and len(stack) < 8:
            stack.append({"name": current.f_code.co_name[:40], "line": current.f_lineno})
            current = current.f_back
        state = {"line": frame.f_lineno, "event": event, "variables": variables, "stack": stack}
        if event == "exception":
            state["exception"] = type.__getattribute__(argument[0], "__name__")[:40]
        if event == "return" and frame.f_lasti >= 0:
            opcode = dis.opname[frame.f_code.co_code[frame.f_lasti]]
            if opcode in ("RETURN_VALUE", "RETURN_CONST"):
                state["result"] = {"kind": "return", "value": safe_preview(argument)}
            elif opcode in ("YIELD_VALUE", "YIELD_FROM"):
                state["result"] = {"kind": "yield", "value": safe_preview(argument)}
        frames.append(state)
    rendered = ", ".join(item["name"] + " = " + item["value"] for item in variables)
    message = f"[TMC] {location} {frame.f_lineno}: " + (rendered or "(no variables)")
    trace_message(message)
    if not remaining:
        trace_message("[TMC] Trace limit reached. The programme continues running.")
        sys.settrace(None)
    return trace_frame

def trace_call(frame, event, argument):
    if event == "call" and frame.f_code.co_filename == script:
        return trace_frame(frame, event, argument)
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
