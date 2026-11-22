/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationTokenSource } from '../../../../base/common/cancellation.js';
import { localize, localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { IDialogService } from '../../../../platform/dialogs/common/dialogs.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { IProgressService, ProgressLocation } from '../../../../platform/progress/common/progress.js';
import { IQuickInputService } from '../../../../platform/quickinput/common/quickInput.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { ILanguageModelsService } from '../../chat/common/languageModels.js';
import { parseLesson } from './lesson.js';
import { pickOpenAIModel, requestOpenAILessonText } from './openAILessonModel.js';

const generationInstructions = [
	'Create a TechMeCoding lesson for a beginner learning Python. Use British English, explain unfamiliar terms, and give one actionable instruction per step.',
	'Return a single valid JSON object with only these fields: "version": 1, "title" (max 120 characters), "objective" (max 2,000), and "steps" (1–30 objects).',
	'Each step has "title" (max 120), "instruction" and "check" (max 2,000 each), and optional "code" (Python text, max 4,000). Required text must be non-empty.',
	'A step can also have an optional "exercise" with "prompt" (max 2,000), "expectedAnswer" (max 1,000), and optional "hint" (max 2,000). Use an exercise only for an unambiguous text answer.',
	'Use deterministic examples with no network or external packages. Omit animation, Markdown fences and any extra keys. Escape line breaks in strings and end the response after the JSON object.',
].join('\n');

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'techMeCoding.generateLesson',
			title: localize2('generateLesson', "Generate Python Lesson"),
			category: localize2('techMeCoding', "TechMeCoding"),
			f1: true,
		});
	}

	override async run(accessor: ServicesAccessor): Promise<void> {
		const quickInput = accessor.get(IQuickInputService);
		const notifications = accessor.get(INotificationService);
		const dialog = accessor.get(IDialogService);
		const progress = accessor.get(IProgressService);
		const editor = accessor.get(IEditorService);
		const models = accessor.get(ILanguageModelsService);

		const topic = (await quickInput.input({
			prompt: localize('generateLessonTopic', "What would you like to learn in Python?"),
			validateInput: async value => value.length > 1000 ? localize('lessonTopicLimit', "Use 1,000 characters or fewer.") : undefined,
		}))?.trim();
		if (!topic) {
			return;
		}

		const request = new CancellationTokenSource();
		const token = request.token;
		try {
			const model = await pickOpenAIModel(models, quickInput, token, () => {
				notifications.info(localize('generatorNoOpenAI', "Add an OpenAI model using Manage Language Models, then try again."));
			});
			if (!model) {
				return;
			}

			const { confirmed } = await dialog.confirm({
				message: localize('generateLessonConsent', "Send this lesson topic to OpenAI?"),
				detail: localize('generateLessonShareDetail', "OpenAI receives the topic you entered and the TMC lesson format. Review the generated lesson before importing it."),
				primaryButton: localize('generateLessonSend', "&&Generate"),
			});
			if (!confirmed) {
				return;
			}

			let response: string | undefined;
			await progress.withProgress({
				location: ProgressLocation.Notification,
				title: localize('generatingLesson', "Generating a Python lesson…"),
				cancellable: true,
			}, async () => {
				const timeout = setTimeout(() => request.cancel(), 60000);
				try {
					response = await requestOpenAILessonText(models, model, generationInstructions, topic, token);
				} finally {
					clearTimeout(timeout);
				}
			}, () => request.cancel());
			if (token.isCancellationRequested) {
				return;
			}

			let value: unknown;
			try {
				value = JSON.parse(response ?? '');
			} catch {
				notifications.warn(localize('generateLessonInvalidJson', "The model did not return valid JSON. Try generating the lesson again."));
				return;
			}
			const parsed = parseLesson(value);
			if (!parsed.valid) {
				notifications.warn(localize('generatedLessonInvalid', "The generated lesson is invalid at {0}. Try generating it again.", parsed.errorPath));
				return;
			}

			await editor.openEditor({
				resource: undefined,
				languageId: 'json',
				contents: JSON.stringify(parsed.lesson, undefined, 2) + '\n',
				options: { pinned: true },
			});
			notifications.info(localize('reviewGeneratedLesson', "Review the lesson, save it as a .tmc.json file, then choose Import Instructions to open it."));
		} catch {
			if (!token.isCancellationRequested) {
				notifications.error(localize('lessonGenerationFailed', "Lesson generation failed. Check your OpenAI model configuration and connection, then try again."));
			}
		} finally {
			request.dispose();
		}
	}
});
