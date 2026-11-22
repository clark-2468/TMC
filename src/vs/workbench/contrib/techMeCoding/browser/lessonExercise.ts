/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { localize } from '../../../../nls.js';
import { LessonExercise } from './lesson.js';

export interface LessonExerciseState {
	answer: string;
	checked: boolean;
	hintOpen: boolean;
}

function normaliseAnswer(value: string): string {
	return value.replace(/\r\n|\r/g, '\n').trim();
}

export function renderLessonExercise(parent: HTMLElement, exercise: LessonExercise, state: LessonExerciseState, store: DisposableStore): void {
	const form = dom.append(parent, dom.$<HTMLFormElement>('form.tmc-exercise'));
	dom.append(form, dom.$('h3', undefined, localize('lessonExercise', "Exercise")));
	const label = dom.append(form, dom.$('label.tmc-text', undefined, exercise.prompt));
	const answer = dom.append(label, dom.$<HTMLTextAreaElement>('textarea', { rows: 3, maxlength: '2000', spellcheck: 'false' }));
	answer.value = state.answer;
	const controls = dom.append(form, dom.$('.tmc-navigation'));
	const check = dom.append(controls, dom.$<HTMLButtonElement>('button', { type: 'submit' }, localize('checkAnswer', "Check answer")));
	const feedback = dom.append(form, dom.$('p', { role: 'status' }));
	if (exercise.hint) {
		const hint = dom.append(form, dom.$<HTMLDetailsElement>('details'));
		hint.open = state.hintOpen;
		dom.append(hint, dom.$('summary', undefined, localize('exerciseHint', "Hint")));
		dom.append(hint, dom.$('p.tmc-text', undefined, exercise.hint));
		store.add(dom.addDisposableListener(hint, 'toggle', () => { state.hintOpen = hint.open; }));
	}

	const update = () => {
		check.disabled = !normaliseAnswer(state.answer);
		if (!state.checked) {
			feedback.textContent = '';
			return;
		}
		feedback.textContent = normaliseAnswer(state.answer) === normaliseAnswer(exercise.expectedAnswer)
			? localize('correctAnswer', "Correct.")
			: localize('retryAnswer', "That does not match the expected answer. Try again.");
	};

	store.add(dom.addDisposableListener(answer, 'input', () => {
		state.answer = answer.value;
		state.checked = false;
		update();
	}));
	store.add(dom.addDisposableListener(form, 'submit', event => {
		event.preventDefault();
		state.checked = !check.disabled;
		update();
	}));
	update();
}
