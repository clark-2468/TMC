/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { raceCancellation } from '../../../../base/common/async.js';
import { CancellationToken, CancellationTokenSource } from '../../../../base/common/cancellation.js';
import { localize } from '../../../../nls.js';
import { IQuickInputService } from '../../../../platform/quickinput/common/quickInput.js';
import { ChatMessageRole, ILanguageModelChatResponse, ILanguageModelsService } from '../../chat/common/languageModels.js';

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
	const request = new CancellationTokenSource(token);
	try {
		const response = await raceCancellation(models.sendChatRequest(model, undefined, [
			{ role: ChatMessageRole.System, content: [{ type: 'text', value: instructions }] },
			{ role: ChatMessageRole.User, content: [{ type: 'text', value: input }] },
		], {}, request.token), token);
		return response && await raceCancellation(readLessonText(response, request), token);
	} finally {
		request.dispose(true);
	}
}

async function readLessonText(response: ILanguageModelChatResponse, request: CancellationTokenSource): Promise<string> {
	// Bound the text before the generator parses JSON or the tutor displays it.
	const maxCharacters = 1024 * 1024;
	let text = '';
	const completion = Promise.resolve(response.result).then(() => ({ ok: true } as const), (error: unknown) => ({ ok: false, error } as const));
	try {
		for await (const part of response.stream) {
			for (const item of Array.isArray(part) ? part : [part]) {
				if (item.type === 'text') {
					if (item.value.length > maxCharacters - text.length) {
						request.cancel();
						throw new Error('TMC model response exceeds the text limit');
					}
					text += item.value;
				}
			}
		}
	} catch (error) {
		if (request.token.isCancellationRequested || !text) {
			throw error;
		}
		return text;
	}
	const result = await completion;
	if (!result.ok && !text) {
		throw result.error;
	}
	return text;
}
