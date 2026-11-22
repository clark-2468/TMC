/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { RunOnceScheduler } from '../../../../base/common/async.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { localize } from '../../../../nls.js';
import { LessonFrame } from './lesson.js';

export function renderLessonTrace(parent: HTMLElement, code: string, frames: readonly LessonFrame[], store: DisposableStore, recorded: boolean): void {
	const section = dom.append(parent, dom.$('section.tmc-trace'));
	dom.append(section, dom.$('h3', undefined, recorded
		? localize('recordedExecutionTrace', "Recorded execution trace")
		: localize('lessonExampleTrace', "Example execution trace")));
	dom.append(section, dom.$('p', undefined, recorded
		? localize('recordedTraceSource', "These frames were recorded while Python ran the saved code below. Programme output and errors are in the terminal.")
		: localize('lessonTraceSource', "The lesson author supplied this trace for the original example below.")));
	const source = dom.append(section, dom.$('ol.tmc-trace-lines', {
		'aria-label': recorded ? localize('recordedTraceCode', "Recorded Python source") : localize('lessonTraceCode', "Original Python example")
	}));
	const lines = code.split(/\r\n|\r|\n/).map(text => {
		const line = dom.append(source, dom.$('li'));
		dom.append(line, dom.$('code', undefined, text || ' '));
		return line;
	});

	const nav = dom.append(section, dom.$('div.tmc-navigation', { role: 'group', 'aria-label': localize('lessonTraceControls', "Trace controls") }));
	const previous = dom.append(nav, dom.$<HTMLButtonElement>('button', { type: 'button' }, localize('previousFrame', "Previous frame")));
	const next = dom.append(nav, dom.$<HTMLButtonElement>('button', { type: 'button' }, localize('nextFrame', "Next frame")));
	const play = dom.append(nav, dom.$<HTMLButtonElement>('button', { type: 'button' }));
	const replay = dom.append(nav, dom.$<HTMLButtonElement>('button', { type: 'button' }, localize('replayTrace', "Replay trace")));
	const seekLabel = dom.append(section, dom.$('label.tmc-trace-seek', undefined, localize('traceSeek', "Jump to frame")));
	const seek = dom.append(seekLabel, dom.$<HTMLInputElement>('input', { type: 'range', min: '1', max: String(frames.length), step: '1' }));
	seek.disabled = frames.length === 1;
	const state = dom.append(section, dom.$('div', { 'aria-live': 'polite', 'aria-atomic': 'true' }));

	let index = 0;
	let playing = false;
	let highlighted: HTMLElement | undefined;
	const last = frames.length - 1;
	const timer = store.add(new RunOnceScheduler(() => show(index + 1, index + 1 < last), 1800));

	function show(frameIndex: number, playNext = false): void {
		timer.cancel();
		index = frameIndex;
		playing = playNext;
		const frame = frames[index];
		highlighted?.removeAttribute('aria-current');
		highlighted = lines[frame.line - 1];
		highlighted.setAttribute('aria-current', 'step');
		if (highlighted.offsetTop < source.scrollTop) {
			source.scrollTop = highlighted.offsetTop;
		} else if (highlighted.offsetTop + highlighted.offsetHeight > source.scrollTop + source.clientHeight) {
			source.scrollTop = highlighted.offsetTop + highlighted.offsetHeight - source.clientHeight;
		}
		seek.valueAsNumber = index + 1;
		seek.setAttribute('aria-valuetext', localize('traceSeekPosition', "Frame {0} of {1}", index + 1, frames.length));

		dom.clearNode(state);
		dom.append(state, dom.$('p', undefined, localize('lessonFrameProgress', "Frame {0} of {1} · Line {2}", index + 1, frames.length, frame.line)));
		dom.append(state, dom.$('p.tmc-text', undefined, frame.caption));
		if (frame.stack?.length) {
			dom.append(state, dom.$('h4', undefined, localize('recordedCallStack', "Call stack · current call first")));
			const stack = dom.append(state, dom.$('ol'));
			for (const entry of frame.stack) {
				dom.append(stack, dom.$('li', undefined, localize('recordedStackLine', "{0} · Line {1}",
					entry.name === '<module>' ? localize('recordedMainScript', "Top level") : entry.name, entry.line)));
			}
		}
		dom.append(state, dom.$('h4', undefined, localize('traceVariables', "Variables")));
		const prior = frames[index - 1];
		const sameScope = prior?.stack?.length === frame.stack?.length && prior?.stack?.[0]?.name === frame.stack?.[0]?.name;
		const previousValues = new Map(sameScope ? prior?.variables.map(({ name, value }) => [name, value]) : undefined);
		const references = new Map<number, number>();
		for (const { reference } of frame.variables) {
			if (reference !== undefined) {
				references.set(reference, (references.get(reference) ?? 0) + 1);
			}
		}
		if (frame.variables.length || previousValues.size) {
			const variables = dom.append(state, dom.$('ul.tmc-trace-variables'));
			for (const { name, value, reference } of frame.variables) {
				const previousValue = previousValues.get(name);
				const row = dom.append(variables, dom.$('li.tmc-text'));
				dom.append(row, dom.$('code', undefined, `${name} = ${value}`));
				if (reference !== undefined && (references.get(reference) ?? 0) > 1) {
					dom.append(row, dom.$('span.tmc-variable-change', undefined, localize('traceSharedObject', "Shared object {0}", reference)));
				}
				if (index > 0 && sameScope && previousValue === undefined) {
					dom.append(row, dom.$('span.tmc-variable-change', undefined, localize('traceVariableAppeared', "New in this frame")));
				} else if (previousValue !== undefined && previousValue !== value) {
					dom.append(row, dom.$('span.tmc-variable-change', undefined, localize('traceVariableChanged', "Previously {0}", previousValue)));
				}
				previousValues.delete(name);
			}
			for (const [name, value] of previousValues) {
				const row = dom.append(variables, dom.$('li.tmc-text'));
				dom.append(row, dom.$('code', undefined, `${name} = ${value}`));
				dom.append(row, dom.$('span.tmc-variable-change', undefined, localize('traceVariableAbsent', "Absent in this frame")));
			}
		} else {
			dom.append(state, dom.$('p', undefined, localize('traceNoVariables', "No variables recorded.")));
		}
		if (frame.output !== undefined) {
			dom.append(state, dom.$('h4', undefined, localize('traceOutput', "Output")));
			dom.append(state, dom.$('pre.tmc-text', undefined, frame.output));
		}

		previous.disabled = index === 0;
		next.disabled = index === last;
		play.disabled = index === last;
		play.textContent = playing ? localize('pauseTrace', "Pause trace") : localize('playTrace', "Play trace");
		if (playing) {
			timer.schedule();
		}
	}

	store.add(dom.addDisposableListener(previous, 'click', () => show(index - 1)));
	store.add(dom.addDisposableListener(next, 'click', () => show(index + 1)));
	store.add(dom.addDisposableListener(play, 'click', () => show(index, !playing)));
	store.add(dom.addDisposableListener(seek, 'input', () => show(seek.valueAsNumber - 1)));
	store.add(dom.addDisposableListener(replay, 'click', () => show(0, true)));
	show(0);
}
