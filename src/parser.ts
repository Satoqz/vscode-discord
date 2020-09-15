import { Presence } from "discord-rpc";
import {
	DiagnosticSeverity,
	languages,
	TextDocumentChangeEvent,
	TextEditor,
	window,
	workspace,
	WorkspaceConfiguration
} from "vscode";

import type { Client } from "./client";
import { resolveFileName, resolveIcon, testRegexArray } from "./util";

enum activity {
	debugging = "debuggingText",
	editing = "editingText",
	viewing = "viewingText"
}

enum icons {
	other = "file",
	idle = "inactive",
	active = "active",
	standard = "vscode"
}

export class Parser {

	constructor(private config: WorkspaceConfiguration, private client: Client) {

		if (config.get("showTime") === true)
			this.presence.startTimestamp = Date.now();

		this.showProblems = config.get("showProblems");
		this.presence.largeImageKey = icons.standard;
		this.presence.largeImageText = "Visual Studio Code";

		if (config.get("showIdle") === true)
			this.idle(false, false);
		else
			this.presence.smallImageKey = icons.standard;

		if (
			config.get("showWorkspace") === true
			&& !testRegexArray(workspace.name, config.get("hideWorkspaces"))
		)
			this.presence.state = workspace.name
				? config.get<string>("workspaceText").replace(/{workspace}/g, workspace.name)
				: "No workspace";

		this.update();
	}

	private makeActivity(type: activity, path: string) {
		if (this.debugging)
			type = activity.debugging;
		const file = resolveFileName(path);
		const excludeFile = testRegexArray(file, this.config.get("hideFiles"));
		const activityString = this.config.get<string>(type).replace(/{file}/g, excludeFile ? "a file" : file);
		const problemString = this.showProblems
			? this.config.get<string>("problemsText").replace(/{count}/g, this.problems.toString())
			: "";
		return activityString + problemString;
	}

	public fileSwitch(editor: TextEditor) {
		if (editor) {
			if (editor.document.fileName.includes("extension-output"))
				return;
			this.presence.largeImageKey = resolveIcon(editor.document);
			this.presence.details = this.makeActivity(activity.viewing, editor.document.fileName);
			this.presence.largeImageText = `${editor.document.lineCount} line ${editor.document.languageId} file`;
		} else {
			this.presence.largeImageKey = icons.other;
			this.presence.details = this.config.get("noFileOpenedText");
			this.presence.largeImageText = "Visual Studio Code";
		}
		this.idle(false, false);
		this.update();
	}

	public fileEdit({ document }: TextDocumentChangeEvent) {
		if (
			document.fileName.endsWith(".git")
			|| document.languageId == "scminput"
		)
			return;
		this.presence.largeImageKey = resolveIcon(document);
		this.presence.details = this.makeActivity(activity.editing, document.fileName);
		const currentLine = window.activeTextEditor.selection.active.line + 1 > document.lineCount
			? document.lineCount
			: window.activeTextEditor.selection.active.line + 1;
		this.presence.largeImageText = `${document.lineCount} line ${document.languageId} file, editing line ${currentLine}`;
		this.idle(false, false);
		this.update();
	}

	public toggleDebug() {
		this.idle(false, false);
		this.debugging = !this.debugging;
	}

	public diagnosticsChange() {
		const diag = languages.getDiagnostics();
		let counted: number = 0;
		diag.forEach(i => {
			if (i[1])
				i[1].forEach(i => {
					if (
						i.severity == DiagnosticSeverity.Warning
						|| i.severity == DiagnosticSeverity.Error
					) counted++;
				});
		});
		this.problems = counted;
	}

	public idle(value: boolean, doUpdate: boolean) {
		this.presence.smallImageKey = value ? icons.idle : icons.active;
		this.presence.smallImageText = value ? "Idle" : "Active";
		if (doUpdate)
			this.update();
	}

	private showProblems = false

	private debugging = false

	private problems = 0

	private presence: Presence = {}

	private update() {
		this.client.set(this.presence);
	}
}