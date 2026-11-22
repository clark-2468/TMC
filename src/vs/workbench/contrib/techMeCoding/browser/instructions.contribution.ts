/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { extname } from '../../../../base/common/resources.js';
import { localize, localize2 } from '../../../../nls.js';
import { Action2, MenuId, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { IFileDialogService } from '../../../../platform/dialogs/common/dialogs.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { DEFAULT_EDITOR_ASSOCIATION, EditorExtensions } from '../../../common/editor.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { ITextFileService } from '../../../services/textfile/common/textfiles.js';
import { parseLesson } from './lesson.js';
import { LessonEditor, LessonEditorInput } from './lessonEditor.js';

Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(LessonEditor, LessonEditor.ID, localize('learningMode', "TechMeCoding Learning Mode")),
	[new SyncDescriptor(LessonEditorInput)]
);

const instructionFileExtensions = ['json', 'md', 'markdown', 'txt'];

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'techMeCoding.importInstructions',
			title: localize2('importInstructions', "Import Instructions..."),
			category: localize2('techMeCoding', "TechMeCoding"),
			f1: true,
			menu: {
				id: MenuId.MenubarFileMenu,
				group: '2_open',
				order: 10,
			}
		});
	}

	override async run(accessor: ServicesAccessor): Promise<void> {
		const dialogService = accessor.get(IFileDialogService);
		const editorService = accessor.get(IEditorService);
		const notificationService = accessor.get(INotificationService);
		const textFileService = accessor.get(ITextFileService);

		const files = await dialogService.showOpenDialog({
			title: localize('selectInstructionsFile', "Select an Instructions File"),
			canSelectFiles: true,
			filters: [{
				name: localize('instructionsFiles', "Instructions Files"),
				extensions: instructionFileExtensions
			}]
		});

		const resource = files?.[0];
		if (!resource) {
			return;
		}

		const extension = extname(resource).slice(1).toLowerCase();
		if (!instructionFileExtensions.includes(extension)) {
			notificationService.warn(localize('unsupportedInstructionsFile', "Choose a JSON lesson (.json), Markdown (.md or .markdown), or plain-text (.txt) file."));
			return;
		}

		if (extension === 'json') {
			const { value } = await textFileService.read(resource, {
				acceptTextOnly: true,
				limits: { size: 1024 * 1024 }
			});

			let json: unknown;
			try {
				json = JSON.parse(value);
			} catch {
				notificationService.error(localize('invalidLessonJson', "The instructions file contains invalid JSON."));
				return;
			}

			const result = parseLesson(json);
			if (!result.valid) {
				notificationService.error(localize('invalidLesson', "Invalid TMC lesson at {0}. Check the required fields and limits for lesson format version 1.", result.errorPath));
				return;
			}

			await editorService.openEditor(new LessonEditorInput(result.lesson), { pinned: true });
			return;
		}

		await editorService.openEditor({
			resource,
			options: { pinned: true, override: DEFAULT_EDITOR_ASSOCIATION.id }
		});
	}
});
