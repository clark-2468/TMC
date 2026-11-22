/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { isWindows } from '../../../../base/common/platform.js';
import { joinPath } from '../../../../base/common/resources.js';
import { URI } from '../../../../base/common/uri.js';
import { IFileService } from '../../../../platform/files/common/files.js';

export async function findWorkspacePython(folder: URI, files: IFileService): Promise<URI | undefined> {
	const environment = joinPath(folder, '.venv');
	const interpreter = isWindows ? joinPath(environment, 'Scripts', 'python.exe') : joinPath(environment, 'bin', 'python');
	if (await files.exists(joinPath(environment, 'pyvenv.cfg')) && await files.exists(interpreter)) {
		return interpreter;
	}
	return undefined;
}
