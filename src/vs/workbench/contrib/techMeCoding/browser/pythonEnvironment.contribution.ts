/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Schemas } from '../../../../base/common/network.js';
import { isWeb, isWindows } from '../../../../base/common/platform.js';
import { joinPath } from '../../../../base/common/resources.js';
import { URI } from '../../../../base/common/uri.js';
import { localize, localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { IsWebContext } from '../../../../platform/contextkey/common/contextkeys.js';
import { IDialogService, IFileDialogService } from '../../../../platform/dialogs/common/dialogs.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { IQuickInputService } from '../../../../platform/quickinput/common/quickInput.js';
import { TerminalLocation } from '../../../../platform/terminal/common/terminal.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { IWorkspaceTrustManagementService } from '../../../../platform/workspace/common/workspaceTrust.js';
import { IWorkbenchEnvironmentService } from '../../../services/environment/common/environmentService.js';
import { ITerminalGroupService, ITerminalService } from '../../terminal/browser/terminal.js';
import { findWorkspacePython } from './pythonEnvironment.js';

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'techMeCoding.createPythonEnvironment',
			title: localize2('createPythonEnvironment', "Create Python Virtual Environment"),
			category: localize2('techMeCoding', "TechMeCoding"),
			f1: true,
			precondition: IsWebContext.negate(),
		});
	}

	override async run(accessor: ServicesAccessor): Promise<void> {
		await manageEnvironment(accessor, false);
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'techMeCoding.installPythonPackage',
			title: localize2('installPythonPackage', "Install Package in Python Virtual Environment"),
			category: localize2('techMeCoding', "TechMeCoding"),
			f1: true,
			precondition: IsWebContext.negate(),
		});
	}

	override async run(accessor: ServicesAccessor): Promise<void> {
		await manageEnvironment(accessor, true);
	}
});

async function manageEnvironment(accessor: ServicesAccessor, install: boolean): Promise<void> {
	const environment = accessor.get(IWorkbenchEnvironmentService);
	const workspace = accessor.get(IWorkspaceContextService);
	const quickInput = accessor.get(IQuickInputService);
	const fileDialog = accessor.get(IFileDialogService);
	const dialog = accessor.get(IDialogService);
	const files = accessor.get(IFileService);
	const notifications = accessor.get(INotificationService);
	const trust = accessor.get(IWorkspaceTrustManagementService);
	const terminalService = accessor.get(ITerminalService);
	const terminalGroupService = accessor.get(ITerminalGroupService);

	if (isWeb || environment.remoteAuthority || !terminalService.isProcessSupportRegistered || !trust.isWorkspaceTrusted()) {
		notifications.warn(localize('pythonEnvironmentTrustedDesktop', "Open a trusted local folder in the desktop app to manage a Python environment."));
		return;
	}
	const folders = workspace.getWorkspace().folders.filter(folder => folder.uri.scheme === Schemas.file);
	if (!folders.length) {
		notifications.info(localize('pythonEnvironmentOpenFolder', "Open the project folder where you want to use Python."));
		return;
	}
	const picked = folders.length === 1 ? folders[0] : (await quickInput.pick(folders.map(folder => ({
		label: folder.name,
		description: folder.uri.fsPath,
		folder,
	})), { placeHolder: localize('pythonEnvironmentChooseFolder', "Choose the Python project folder") }))?.folder;
	if (!picked) {
		return;
	}
	const root = picked.uri;
	const venv = joinPath(root, '.venv');
	if (root.fsPath.includes('${')) {
		notifications.warn(localize('pythonEnvironmentInvalidPath', "Choose a folder path without terminal variable expressions."));
		return;
	}

	let executable: URI | undefined;
	let args: string[];
	let detail: string;
	if (install) {
		executable = await findWorkspacePython(root, files);
		if (!executable) {
			notifications.info(localize('pythonEnvironmentMissing', "Create a Python virtual environment in this folder first."));
			return;
		}
		const validName = (value: string) => /^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/i.test(value);
		const name = (await quickInput.input({
			prompt: localize('pythonPackageName', "Enter a Python package name, such as requests"),
			validateInput: async value => value.trim() && !validName(value.trim())
				? localize('pythonPackageNameOnly', "Enter a package name without a URL, path or extra options.")
				: undefined,
		}))?.trim();
		if (!name || !validName(name)) {
			return;
		}
		args = ['-I', '-m', 'pip', '--isolated', '--require-virtualenv', 'install', name];
		detail = localize('pythonInstallPackageDetail', "Package: {0}\nInterpreter: {1}\n\nPip may download the package and execute build code. Confirm that you trust the package.", name, executable.fsPath);
	} else {
		if (await files.exists(venv)) {
			notifications.info(localize('pythonEnvironmentExists', "The selected folder already contains .venv."));
			return;
		}
		[executable] = await fileDialog.showOpenDialog({
			title: localize('choosePythonForEnvironment', "Choose an Installed Python Interpreter"),
			canSelectFiles: true,
			availableFileSystems: [Schemas.file],
			filters: isWindows ? [{ name: localize('pythonBaseExecutable', "Executable"), extensions: ['exe'] }] : undefined,
		}) ?? [];
		if (!executable || executable.scheme !== Schemas.file || executable.fsPath.includes('${')) {
			return;
		}
		args = ['-I', '-m', 'venv', venv.fsPath];
		detail = localize('pythonCreateEnvironmentDetail', "Environment: {0}\nInterpreter: {1}\n\nA virtual environment keeps this project’s packages separate from other projects.", venv.fsPath, executable.fsPath);
	}

	const { confirmed } = await dialog.confirm({
		type: install ? 'warning' : 'info',
		message: install ? localize('confirmInstallPythonPackage', "Install the Python package?") : localize('confirmCreateVirtualEnvironment', "Create the Python virtual environment?"),
		primaryButton: install ? localize('installPythonPackageButton', "&&Install") : localize('createPythonEnvironmentButton', "&&Create"),
		detail,
	});
	if (!confirmed || !trust.isWorkspaceTrusted()) {
		return;
	}
	if (!install && await files.exists(venv)) {
		notifications.info(localize('pythonEnvironmentAppeared', "The .venv folder appeared before setup. Review it before continuing."));
		return;
	}

	const terminal = await terminalService.createTerminal({
		location: TerminalLocation.Panel,
		config: {
			name: localize('pythonSetupTerminal', "TMC Python Setup"),
			executable: executable.fsPath,
			args,
			cwd: root,
			ignoreConfigurationCwd: true,
			ignoreShellIntegration: true,
			waitOnExit: true,
		},
	});
	terminalGroupService.setActiveInstance(terminal);
	await terminalGroupService.showPanel(true);
}
