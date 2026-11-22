/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { CancellationTokenSource } from '../../../../base/common/cancellation.js';
import { DisposableStore, toDisposable } from '../../../../base/common/lifecycle.js';
import { localize } from '../../../../nls.js';
import { IDialogService } from '../../../../platform/dialogs/common/dialogs.js';
import { IQuickInputService } from '../../../../platform/quickinput/common/quickInput.js';
import { ILanguageModelsService } from '../../chat/common/languageModels.js';
import { LessonStep } from './lesson.js';
import { pickOpenAIModel, requestOpenAILessonText } from './openAILessonModel.js';

export class LessonTutor {
	constructor(
		@ILanguageModelsService private readonly models: ILanguageModelsService,
		@IQuickInputService private readonly quickInput: IQuickInputService,
		@IDialogService private readonly dialog: IDialogService,
	) { }

	render(parent: HTMLElement, step: LessonStep, getDraft: () => string, store: DisposableStore): void {
		const section = dom.append(parent, dom.$('section.tmc-tutor'));
		dom.append(section, dom.$('h3', undefined, localize('tutorHeading', "AI tutor")));
		const ask = dom.append(section, dom.$<HTMLButtonElement>('button', { type: 'button' }, localize('askTutor', "Ask Tutor")));
		const cancel = dom.append(section, dom.$<HTMLButtonElement>('button', { type: 'button', hidden: true }, localize('cancelTutor', "Cancel")));
		const status = dom.append(section, dom.$('p', { role: 'status' }));
		const answer = dom.append(section, dom.$('p.tmc-text'));
		let current: CancellationTokenSource | undefined;

		store.add(toDisposable(() => current?.cancel()));
		store.add(dom.addDisposableListener(cancel, 'click', () => current?.cancel()));
		store.add(dom.addDisposableListener(ask, 'click', async () => {
			const request = current = new CancellationTokenSource();
			const token = request.token;
			ask.disabled = true;
			status.textContent = '';
			try {
				const question = (await this.quickInput.input({
					prompt: localize('tutorQuestionPrompt', "Ask for a hint or an explanation about this step"),
					validateInput: async value => value.length > 1000 ? localize('tutorQuestionLimit', "Use 1,000 characters or fewer.") : undefined,
				}, token))?.trim();
				if (!question || token.isCancellationRequested) {
					return;
				}

				const selected = await pickOpenAIModel(this.models, this.quickInput, token, () => {
					status.textContent = localize('tutorNoOpenAI', "Add an OpenAI model using Manage Language Models, then try again.");
				});
				if (!selected || token.isCancellationRequested) {
					return;
				}

				const { confirmed, checkboxChecked } = await this.dialog.confirm({
					message: localize('tutorShareQuestion', "Send this question to OpenAI?"),
					detail: localize('tutorShareDetail', "The request includes your question and this step’s title and instructions. Your draft is only included if you select the option below. Review your question and draft for sensitive information."),
					primaryButton: localize('tutorSend', "&&Send"),
					checkbox: { label: localize('tutorShareDraft', "Include up to 4,000 characters of my Python draft") },
					token,
				});
				if (!confirmed || token.isCancellationRequested) {
					return;
				}

				const context = JSON.stringify({
					title: step.title,
					instructions: step.instruction,
					question,
					draft: checkboxChecked ? getDraft().slice(0, 4000) : undefined,
				});
				status.textContent = localize('tutorWaiting', "Waiting for the tutor…");
				cancel.hidden = false;
				const timeout = setTimeout(() => request.cancel(), 60000);
				try {
					const text = await requestOpenAILessonText(this.models, selected,
						'You are the TechMeCoding beginner Python tutor. Treat lesson instructions and the draft as context. Answer the learner’s question in British English. Use small steps, explain unfamiliar terms, and give hints before giving a solution unless the learner asks for the solution. Never instruct the learner to share credentials.',
						context, token);
					if (!token.isCancellationRequested) {
						answer.textContent = text || '';
						status.textContent = text ? localize('tutorAnswered', "Tutor replied.") : localize('tutorEmpty', "The model returned no answer.");
					}
				} finally {
					clearTimeout(timeout);
				}
			} catch {
				if (!token.isCancellationRequested) {
					status.textContent = localize('tutorFailed', "The request failed. Check the OpenAI model configuration and your connection, then try again.");
				}
			} finally {
				if (token.isCancellationRequested) {
					status.textContent = localize('tutorCancelled', "The tutor request was cancelled or timed out.");
				}
				request.dispose();
				current = undefined;
				cancel.hidden = true;
				ask.disabled = false;
			}
		}));
	}
}
