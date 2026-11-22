/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The learner's file is passed as a separate argument. Keep the executable trace
// helper fixed, and use Python's normal process permissions and terminal streams.
export const pythonTraceScript = String.raw`
import os
import runpy
import sys

script = os.path.abspath(sys.argv[1])
sys.argv = [script]
sys.path[0] = os.path.dirname(script)
stderr = sys.stderr
remaining = 200

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

def trace_frame(frame, event, argument):
    global remaining
    if event not in ("line", "return") or not remaining:
        return trace_frame

    remaining -= 1
    variables = []
    for name, value in frame.f_locals.items():
        if type(name) is not str or name.startswith("__"):
            continue
        variables.append(name[:80] + " = " + display_value(value))
        if len(variables) == 12:
            break

    location = "before line" if event == "line" else "leaving line"
    message = f"[TMC] {location} {frame.f_lineno}: " + (", ".join(variables) or "(no variables)")
    print(message, file=stderr)
    if not remaining:
        print("[TMC] Trace limit reached. The programme continues running.", file=stderr)
        sys.settrace(None)
    return trace_frame

def trace_call(frame, event, argument):
    if event == "call" and frame.f_code.co_filename == script:
        return trace_frame
    return None

sys.settrace(trace_call)
try:
    runpy.run_path(script, run_name="__main__")
finally:
    sys.settrace(None)
`;
