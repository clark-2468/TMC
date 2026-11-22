/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { CodeEditorWidget } from '../../../../editor/browser/widget/codeEditor/codeEditorWidget.js';
import { ITextModel } from '../../../../editor/common/model.js';
import { ILanguageService } from '../../../../editor/common/languages/language.js';
import { IModelService } from '../../../../editor/common/services/model.js';
import { localize } from '../../../../nls.js';
import { IEditorOptions } from '../../../../platform/editor/common/editor.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { IEditorOpenContext } from '../../../common/editor.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { IEditorGroup } from '../../../services/editor/common/editorGroupsService.js';
import { IEditorService, SIDE_GROUP } from '../../../services/editor/common/editorService.js';
import { Lesson } from './lesson.js';
import { LessonExerciseState, renderLessonExercise } from './lessonExercise.js';
import { renderLessonTrace } from './lessonTrace.js';
import './media/lessonEditor.css';

export class LessonEditorInput extends EditorInput {
	static readonly ID = 'techMeCoding.lessonInput';
	override readonly typeId = LessonEditorInput.ID;
	override readonly resource = undefined;

	stepIndex = 0;
	readonly exercises = new Map<number, LessonExerciseState>();
	private readonly drafts = new Map<number, ITextModel>();

	constructor(readonly lesson: Lesson) {
		super();
	}

	override getName(): string {
		return this.lesson.title;
	}

	getDraft(index: number, modelService: IModelService, languageService: ILanguageService): ITextModel {
		let draft = this.drafts.get(index);
		if (!draft) {
			draft = this._register(modelService.createModel(this.lesson.steps[index].code ?? '', languageService.createById('python')));
			this.drafts.set(index, draft);
		}
		return draft;
	}
}

export class LessonEditor extends EditorPane {
	static readonly ID = 'techMeCoding.lessonEditor';

	private readonly controls = this._register(new DisposableStore());
	private root!: HTMLElement;

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IModelService private readonly modelService: IModelService,
		@ILanguageService private readonly languageService: ILanguageService,
		@IEditorService private readonly editorService: IEditorService,
	) {
		super(LessonEditor.ID, group, telemetryService, themeService, storageService);
	}

	protected override createEditor(parent: HTMLElement): void {
		this.root = dom.append(parent, dom.$('.tmc-lesson'));
	}

	override async setInput(input: LessonEditorInput, options: IEditorOptions | undefined, context: IEditorOpenContext, token: CancellationToken): Promise<void> {
		await super.setInput(input, options, context, token);
		if (!token.isCancellationRequested) {
			this.render(input);
		}
	}

	override clearInput(): void {
		this.controls.clear();
		dom.clearNode(this.root);
		super.clearInput();
	}

	override layout(dimension: dom.Dimension): void {
		dom.size(this.root, dimension.width, dimension.height);
	}

	override focus(): void {
		super.focus();
		this.root.querySelector<HTMLElement>('h2')?.focus();
	}

	private render(input: LessonEditorInput, focusStep = false): void {
		this.controls.clear();
		dom.clearNode(this.root);
		this.root.scrollTop = 0;
		const { lesson, stepIndex } = input;
		const step = lesson.steps[stepIndex];

		dom.append(this.root, dom.$('h1', undefined, lesson.title));
		dom.append(this.root, dom.$('p.tmc-text', undefined, lesson.objective));

		const nav = dom.append(this.root, dom.$('nav.tmc-navigation', { 'aria-label': localize('lessonNavigation', "Lesson navigation") }));
		const goTo = (index: number) => {
			input.stepIndex = index;
			this.render(input, true);
		};
		const previous = dom.append(nav, dom.$<HTMLButtonElement>('button', { type: 'button' }, localize('previousStep', "Previous step")));
		previous.disabled = stepIndex === 0;
		this.controls.add(dom.addDisposableListener(previous, 'click', () => goTo(stepIndex - 1)));
		dom.append(nav, dom.$('span', undefined, localize('stepProgress', "Step {0} of {1}", stepIndex + 1, lesson.steps.length)));
		const next = dom.append(nav, dom.$<HTMLButtonElement>('button', { type: 'button' }, localize('nextStep', "Next step")));
		next.disabled = stepIndex === lesson.steps.length - 1;
		this.controls.add(dom.addDisposableListener(next, 'click', () => goTo(stepIndex + 1)));

		const columns = dom.append(this.root, dom.$('.tmc-columns'));
		const instructions = dom.append(columns, dom.$('section'));
		const heading = dom.append(instructions, dom.$('h2', { tabindex: '-1' }, step.title));
		dom.append(instructions, dom.$('p.tmc-text', undefined, step.instruction));
		dom.append(instructions, dom.$('h3', undefined, localize('lessonCheck', "Check")));
		dom.append(instructions, dom.$('p.tmc-text', undefined, step.check));
		if (step.exercise) {
			const state = input.exercises.get(stepIndex) ?? { answer: '', checked: false, hintOpen: false };
			input.exercises.set(stepIndex, state);
			renderLessonExercise(instructions, step.exercise, state, this.controls);
		}
		if (step.animation && step.code) {
			renderLessonTrace(instructions, step.code, step.animation.frames, this.controls);
		}

		const code = dom.append(columns, dom.$('section'));
		const codeLabel = localize('pythonDraft', "Python draft");
		dom.append(code, dom.$('h2', undefined, codeLabel));
		dom.append(code, dom.$('p', undefined, localize('draftLifetime', "Drafts are kept while this lesson tab is open. Open the draft in a Python editor to save a copy.")));
		const container = dom.append(code, dom.$('.tmc-code'));
		const editor = this.controls.add(this.instantiationService.createInstance(CodeEditorWidget, container, {
			ariaLabel: codeLabel,
			automaticLayout: true,
			minimap: { enabled: false },
			scrollBeyondLastLine: false,
		}, {}));
		const draft = input.getDraft(stepIndex, this.modelService, this.languageService);
		editor.setModel(draft);

		const actions = dom.append(code, dom.$('.tmc-navigation'));
		const openDraft = dom.append(actions, dom.$('button', { type: 'button' }, localize('openPythonDraft', "Open Draft in Python Editor")));
		this.controls.add(dom.addDisposableListener(openDraft, 'click', async () => {
			await this.editorService.openEditor({
				resource: undefined,
				languageId: 'python',
				contents: draft.getValue(),
				options: { pinned: true }
			}, SIDE_GROUP);
		}));

		if (focusStep) {
			heading.focus();
		}
	}
}
