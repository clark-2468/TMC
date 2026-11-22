/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface LessonFrame {
	line: number;
	caption: string;
	variables: { name: string; value: string }[];
	output?: string;
}

export interface LessonExercise {
	prompt: string;
	expectedAnswer: string;
	hint?: string;
}

export interface LessonStep {
	title: string;
	instruction: string;
	check: string;
	exercise?: LessonExercise;
	code?: string;
	animation?: { kind: 'variables' | 'loop' | 'function'; frames: LessonFrame[] };
}

export interface Lesson {
	version: 1;
	title: string;
	objective: string;
	steps: LessonStep[];
}

export function isLessonRecord(value: unknown, keys: string[]): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).every(key => keys.includes(key));
}

function text(value: unknown, max: number): value is string {
	return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function optionalString(value: unknown, max: number): value is string | undefined {
	return value === undefined || (typeof value === 'string' && value.length <= max);
}

function validFrame(value: unknown, lineCount: number): value is LessonFrame {
	if (!isLessonRecord(value, ['line', 'caption', 'variables', 'output']) ||
		typeof value.line !== 'number' || !Number.isInteger(value.line) || value.line < 1 || value.line > lineCount ||
		!text(value.caption, 2000) || !optionalString(value.output, 1000) ||
		!Array.isArray(value.variables) || value.variables.length > 12) {
		return false;
	}

	const names = new Set<string>();
	for (const variable of value.variables) {
		if (!isLessonRecord(variable, ['name', 'value']) || !text(variable.name, 80) ||
			!/^[A-Za-z_][A-Za-z0-9_]*$/.test(variable.name) || names.has(variable.name) ||
			typeof variable.value !== 'string' || variable.value.length > 200) {
			return false;
		}
		names.add(variable.name);
	}
	return true;
}

function validExercise(value: unknown): value is LessonExercise {
	return isLessonRecord(value, ['prompt', 'expectedAnswer', 'hint']) &&
		text(value.prompt, 2000) && text(value.expectedAnswer, 1000) &&
		(value.hint === undefined || text(value.hint, 2000));
}

function validStep(value: unknown): value is LessonStep {
	if (!isLessonRecord(value, ['title', 'instruction', 'check', 'code', 'animation', 'exercise']) ||
		!text(value.title, 120) || !text(value.instruction, 2000) || !text(value.check, 2000) ||
		!optionalString(value.code, 4000) ||
		(value.exercise !== undefined && !validExercise(value.exercise))) {
		return false;
	}

	const animation = value.animation;
	if (animation === undefined) {
		return true;
	}

	const lineCount = value.code?.trim() ? value.code.split(/\r\n|\r|\n/).length : 0;
	return isLessonRecord(animation, ['kind', 'frames']) &&
		typeof animation.kind === 'string' && ['variables', 'loop', 'function'].includes(animation.kind) &&
		Array.isArray(animation.frames) && animation.frames.length >= 2 && animation.frames.length <= 20 &&
		animation.frames.every(frame => validFrame(frame, lineCount));
}

export function parseLesson(value: unknown): { valid: true; lesson: Lesson } | { valid: false; errorPath: string } {
	if (!isLessonRecord(value, ['version', 'title', 'objective', 'steps'])) {
		return { valid: false, errorPath: '$' };
	}
	if (value.version !== 1) {
		return { valid: false, errorPath: 'version' };
	}
	if (!text(value.title, 120)) {
		return { valid: false, errorPath: 'title' };
	}
	if (!text(value.objective, 2000)) {
		return { valid: false, errorPath: 'objective' };
	}
	if (!Array.isArray(value.steps) || value.steps.length < 1 || value.steps.length > 30) {
		return { valid: false, errorPath: 'steps' };
	}
	const steps: LessonStep[] = [];
	for (const [index, step] of value.steps.entries()) {
		if (!validStep(step)) {
			return { valid: false, errorPath: `steps[${index}]` };
		}
		steps.push(step);
	}
	return { valid: true, lesson: { version: 1, title: value.title, objective: value.objective, steps } };
}
