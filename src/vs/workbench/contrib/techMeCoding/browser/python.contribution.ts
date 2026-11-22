/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from '../../../../base/common/event.js';
import { Schemas } from '../../../../base/common/network.js';
import { isWeb, isWindows } from '../../../../base/common/platform.js';
import { basename, dirname, extname, joinPath } from '../../../../base/common/resources.js';
import { URI } from '../../../../base/common/uri.js';
import { generateUuid } from '../../../../base/common/uuid.js';
import { localize, localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { IsWebContext } from '../../../../platform/contextkey/common/contextkeys.js';
import { IDialogService, IFileDialogService } from '../../../../platform/dialogs/common/dialogs.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { TerminalLocation } from '../../../../platform/terminal/common/terminal.js';
import { IWorkspaceTrustManagementService } from '../../../../platform/workspace/common/workspaceTrust.js';
import { EditorResourceAccessor } from '../../../common/editor.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { IWorkbenchEnvironmentService } from '../../../services/environment/common/environmentService.js';
import { ITerminalGroupService, ITerminalService } from '../../terminal/browser/terminal.js';
import { LessonEditorInput } from './lessonEditor.js';
import { readRecordedTrace } from './recordedPythonTrace.js';
import { pythonTraceScript } from './pythonTrace.js';

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'techMeCoding.runSavedPythonFile',
			title: localize2('runSavedPythonFile', "Run Saved Python File"),
			category: localize2('techMeCoding', "TechMeCoding"),
			f1: true,
			precondition: IsWebContext.negate()
		});
	}

	override async run(accessor: ServicesAccessor): Promise<void> {
		await runPythonFile(accessor, false);
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'techMeCoding.traceSavedPythonFile',
			title: localize2('traceSavedPythonFile', "Trace Saved Python File"),
			category: localize2('techMeCoding', "TechMeCoding"),
			f1: true,
			precondition: IsWebContext.negate()
		});
	}

	override async run(accessor: ServicesAccessor): Promise<void> {
		await runPythonFile(accessor, true);
	}
});

async function runPythonFile(accessor: ServicesAccessor, trace: boolean): Promise<void> {
	const environment = accessor.get(IWorkbenchEnvironmentService);
	const editorService = accessor.get(IEditorService);
	const notifications = accessor.get(INotificationService);
	const fileDialog = accessor.get(IFileDialogService);
	const dialog = accessor.get(IDialogService);
	const fileService = accessor.get(IFileService);
	const trust = accessor.get(IWorkspaceTrustManagementService);
	const terminalService = accessor.get(ITerminalService);
	const terminalGroupService = accessor.get(ITerminalGroupService);

	if (isWeb || environment.remoteAuthority || !terminalService.isProcessSupportRegistered) {
		notifications.warn(localize('pythonDesktopRequired', "Run Python files from a local desktop window."));
		return;
	}
	if (!trust.isWorkspaceTrusted()) {
		notifications.warn(localize('pythonTrustedWorkspaceRequired', "Running a Python file requires a trusted workspace."));
		return;
	}

	const editor = editorService.activeEditor;
	const file = EditorResourceAccessor.getCanonicalUri(editor, { filterByScheme: Schemas.file });
	if (!file || extname(file).toLowerCase() !== '.py' || editor?.isDirty()) {
		notifications.warn(localize('pythonSaveRequired', "Save your code to a local .py file and keep that file open before running it."));
		return;
	}

	const [interpreter] = await fileDialog.showOpenDialog({
		title: localize('pythonSelectInterpreter', "Select an Installed Python Interpreter"),
		canSelectFiles: true,
		availableFileSystems: [Schemas.file],
		filters: isWindows ? [{ name: localize('pythonExecutable', "Executable"), extensions: ['exe'] }] : undefined,
	}) ?? [];
	if (!interpreter) {
		return;
	}
	if (interpreter.scheme !== Schemas.file || [interpreter.fsPath, file.fsPath].some(path => path.includes('${'))) {
		notifications.warn(localize('pythonInvalidPaths', "Choose local paths without terminal variable expressions."));
		return;
	}

	const { confirmed } = await dialog.confirm({
		type: 'warning',
		message: trace
			? localize('pythonConfirmTrace', "Run this saved Python file with a trace?")
			: localize('pythonConfirmRun', "Run this saved Python file?"),
		detail: localize('pythonConfirmRunDetail', "File: {0}\nInterpreter: {1}\n\nReview the saved code before running it. The programme can access files and other resources available to your account.", file.fsPath, interpreter.fsPath),
		primaryButton: localize('pythonConfirmRunButton', "&&Run Python File"),
	});

	if (!confirmed || !trust.isWorkspaceTrusted()) {
		return;
	}
	if (editor?.isDisposed() || editor?.isDirty()) {
		notifications.warn(localize('pythonChangedBeforeRun', "The file changed in the editor. Save it and review it again before running."));
		return;
	}

	const traceFolder = trace ? joinPath(environment.cacheHome, 'tmc-python-traces') : undefined;
	const traceFile = traceFolder?.scheme === Schemas.file && !traceFolder.fsPath.includes('${')
		? joinPath(traceFolder, generateUuid() + '.json')
		: undefined;
	if (traceFile && traceFolder) {
		await fileService.createFolder(traceFolder);
	}
	try {
		const terminal = await terminalService.createTerminal({
			location: TerminalLocation.Panel,
			config: {
				name: localize('pythonRunTerminal', "TMC Python"),
				executable: interpreter.fsPath,
				args: trace ? ['-u', '-I', '-c', pythonTraceScript, file.fsPath, ...(traceFile ? [traceFile.fsPath] : [])] : ['-u', file.fsPath],
				cwd: dirname(file),
				ignoreConfigurationCwd: true,
				ignoreShellIntegration: true,
				waitOnExit: true,
			},
		});
		const exit = traceFile && terminal.exitReason === undefined && terminal.exitCode === undefined ? Event.toPromise(terminal.onExit) : undefined;
		terminalGroupService.setActiveInstance(terminal);
		await terminalGroupService.showPanel(true);
		if (traceFile) {
			await exit;
			const recorded = await readTraceFile(fileService, traceFile, basename(file));
			if (recorded) {
				await editorService.openEditor(new LessonEditorInput(recorded, true), { pinned: true, preserveFocus: true });
			}
		}
	} finally {
		if (traceFile && await fileService.exists(traceFile)) {
			await fileService.del(traceFile);
		}
	}
}

async function readTraceFile(fileService: IFileService, traceFile: URI, name: string) {
	try {
		const data = await fileService.readFile(traceFile, { limits: { size: 2 * 1024 * 1024 } });
		return readRecordedTrace(JSON.parse(data.value.toString()), name);
	} catch {
		// A stopped run or one that failed before the first line may have no complete recording.
		return undefined;
	}
}
