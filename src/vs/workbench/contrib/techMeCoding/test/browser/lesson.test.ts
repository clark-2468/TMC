/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { parseLesson } from '../../browser/lesson.js';
import { readRecordedTrace } from '../../browser/recordedPythonTrace.js';

suite('TechMeCoding lesson data', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	const step = { title: 'Print a value', instruction: 'Read each line.', check: 'Explain the assignment.' };
	const lesson = { version: 1, title: 'Variables', objective: 'Read a variable.', steps: [step] };

	test('accepts a version 1 lesson without an exercise', () => {
		assert.deepStrictEqual(parseLesson(lesson), { valid: true, lesson });
	});

	test('validates an optional prediction exercise', () => {
		const exercise = { prompt: 'What number is printed?', expectedAnswer: '3', hint: 'Add one to two.' };
		assert.strictEqual(parseLesson({ ...lesson, steps: [{ ...step, exercise }] }).valid, true);
		assert.deepStrictEqual(parseLesson({
			...lesson,
			steps: [{ ...step, exercise: { ...exercise, expectedAnswer: ' ' } }],
		}), { valid: false, errorPath: 'steps[0]' });
	});

	test('reads a recorded run while preserving its source and variables', () => {
		const source = 'score = 3\r\nprint(score)';
		const variables = [{ name: 'score', value: '3' }];
		const trace = readRecordedTrace({ source, frames: [{ event: 'line', line: 2, variables }] }, 'score.py');
		assert.strictEqual(trace?.steps[0].code, source);
		assert.deepStrictEqual(trace?.steps[0].animation?.frames[0].variables, variables);
	});

	test('rejects a trace that points beyond the captured source', () => {
		assert.strictEqual(readRecordedTrace({
			source: 'score = 3',
			frames: [{ event: 'line', line: 2, variables: [] }],
		}, 'score.py'), undefined);
	});
	test('keeps call stacks, shared references and exception types', () => {
		const variables = [
			{ name: 'first', value: '[1, 2]', reference: 1 },
			{ name: 'second', value: '[1, 2]', reference: 1 },
		];
		const stack = [{ name: 'run', line: 2 }, { name: '<module>', line: 3 }];
		const payload = {
			source: 'def run():\n    raise ValueError()\nrun()',
			frames: [{ event: 'exception', exception: 'ValueError', line: 2, variables, stack }],
		};
		const frame = readRecordedTrace(payload, 'errors.py')?.steps[0].animation?.frames[0];
		assert.deepStrictEqual(frame?.stack, stack);
		assert.deepStrictEqual(frame?.variables, variables);
		assert.match(frame?.caption ?? '', /ValueError/);
		assert.strictEqual(readRecordedTrace({
			...payload,
			frames: [{ ...payload.frames[0], stack: [{ name: 'invalid', line: 4 }] }],
		}, 'errors.py'), undefined);
	});
});
