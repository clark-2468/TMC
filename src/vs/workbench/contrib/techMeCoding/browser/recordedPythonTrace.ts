/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../nls.js';
import { isLessonRecord, Lesson, LessonFrame } from './lesson.js';

export function readRecordedTrace(value: unknown, fileName: string): Lesson | undefined {
	if (!isLessonRecord(value, ['source', 'frames']) || typeof value.source !== 'string' || value.source.length > 40000 ||
		!Array.isArray(value.frames) || !value.frames.length || value.frames.length > 200) {
		return;
	}
	const lineCount = value.source.split(/\r\n|\r|\n/).length;
	const frames: LessonFrame[] = [];
	for (const frame of value.frames) {
		if (!isLessonRecord(frame, ['line', 'event', 'variables', 'stack', 'exception']) || typeof frame.line !== 'number' || !Number.isInteger(frame.line) || frame.line < 1 || frame.line > lineCount ||
			(frame.event !== 'line' && frame.event !== 'return' && frame.event !== 'call' && frame.event !== 'exception') || !Array.isArray(frame.variables) || frame.variables.length > 12) {
			return;
		}
		const variables: LessonFrame['variables'] = [];
		for (const variable of frame.variables) {
			if (!isLessonRecord(variable, ['name', 'value', 'reference']) || typeof variable.name !== 'string' || variable.name.length > 80 ||
				typeof variable.value !== 'string' || variable.value.length > 200) {
				return;
			}
			const reference = variable.reference;
			if (reference !== undefined && (typeof reference !== 'number' || !Number.isInteger(reference) || reference < 1 || reference > 12)) {
				return;
			}
			variables.push(reference === undefined
				? { name: variable.name, value: variable.value }
				: { name: variable.name, value: variable.value, reference });
		}
		const stack: NonNullable<LessonFrame['stack']> = [];
		if (frame.stack !== undefined) {
			if (!Array.isArray(frame.stack) || frame.stack.length > 8) {
				return;
			}
			for (const entry of frame.stack) {
				if (!isLessonRecord(entry, ['name', 'line']) || typeof entry.name !== 'string' || entry.name.length > 80 ||
					typeof entry.line !== 'number' || !Number.isInteger(entry.line) || entry.line < 1 || entry.line > lineCount) {
					return;
				}
				stack.push({ name: entry.name, line: entry.line });
			}
		}
		let caption: string;
		switch (frame.event) {
			case 'call':
				caption = localize('recordedEnteringFunction', "Python entered this block. Its local values include any arguments passed to it.");
				break;
			case 'return':
				caption = localize('recordedLeavingLine', "Python is leaving this block. These are the last recorded local values.");
				break;
			case 'exception':
				if (typeof frame.exception !== 'string' || frame.exception.length > 80 || !frame.exception) {
					return;
				}
				caption = localize('recordedPythonException', "Python raised {0} here. A handler may catch the exception. Check the terminal for any traceback.", frame.exception);
				break;
			default:
				caption = localize('recordedBeforeLine', "Python is about to run this line. The variables show their values before it runs.");
		}
		frames.push({ line: frame.line, variables, caption, stack: stack.length ? stack : undefined });
	}
	return {
		version: 1,
		title: localize('recordedTraceTitle', "Trace of {0}", fileName),
		objective: localize('recordedTraceObjective', "Step through the recorded run to follow the order of execution and inspect local values."),
		steps: [{
			title: localize('recordedTraceStep', "Follow the run"),
			instruction: localize('recordedTraceInstruction', "Use Next frame to follow the order in which Python reached each line."),
			check: localize('recordedTraceCheck', "Choose a line that assigns a value. Compare the variable before the assignment and in the next frame."),
			code: value.source,
			animation: { kind: 'variables', frames },
		}],
	};
}
