/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { raceCancellation } from '../../../../base/common/async.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { localize } from '../../../../nls.js';
import { IQuickInputService } from '../../../../platform/quickinput/common/quickInput.js';
import { ChatMessageRole, getTextResponseFromStream, ILanguageModelsService } from '../../chat/common/languageModels.js';

export async function pickOpenAIModel(models: ILanguageModelsService, quickInput: IQuickInputService, token: CancellationToken, onMissing: () => void): Promise<string | undefined> {
	const ids = await raceCancellation(models.selectLanguageModels({ vendor: 'openai' }), token);
	if (!ids) {
		return;
	}
	if (!ids.length) {
		onMissing();
		return;
	}
	if (ids.length === 1) {
		return ids[0];
	}
	const picked = await quickInput.pick(ids.map(id => ({
		id,
		label: models.lookupLanguageModel(id)?.name ?? id,
	})), { placeHolder: localize('pickOpenAILessonModel', "Choose an OpenAI model") }, token);
	return picked?.id;
}

export async function requestOpenAILessonText(models: ILanguageModelsService, model: string, instructions: string, input: string, token: CancellationToken): Promise<string | undefined> {
	const response = await raceCancellation(models.sendChatRequest(model, undefined, [
		{ role: ChatMessageRole.System, content: [{ type: 'text', value: instructions }] },
		{ role: ChatMessageRole.User, content: [{ type: 'text', value: input }] },
	], {}, token), token);
	return response && await raceCancellation(getTextResponseFromStream(response), token);
}
