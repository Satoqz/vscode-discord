import { Presence } from "discord-rpc";
import { DiagnosticChangeEvent, TextDocumentChangeEvent, TextEditor, workspace, WorkspaceConfiguration } from "vscode";

import type { Client } from "./client";
import { testRegexArray } from "./util";

const
	idleImage = "inactive",
	activeImage = "active";

export class Parser {

	constructor(private config: WorkspaceConfiguration, private client: Client) {
		// create standard / startup presence
		this.presence.largeImageKey = "vscode";
		this.presence.largeImageText = "Visual Studio Code";
		if (config.get("showIdle") === true)
			this.idle(false, false);

		if (
			config.get("showWorkspace") === true
			&& !testRegexArray(workspace.name, config.get("hideWorkspaces"))
		)
			this.presence.details = config.get<string>("workspaceText").replace(/{workspace}/g, workspace.name);

		this.update();
	}

	public fileSwitch(editor: TextEditor) {
		this.idle(false, false);
		console.log("file switch");
		this.update();
	}

	public fileEdit(event: TextDocumentChangeEvent) {
		this.idle(false, false);
		console.log("file edit");
		this.update();
	}

	public toggleDebug() {
		this.idle(false, false);
		this.debugging = !this.debugging;
		this.update();
	}

	public diagnosticsChange(e: DiagnosticChangeEvent) {
		console.log("diagnostics change");
		this.update();
	}

	public idle(value: boolean, doUpdate: boolean) {
		this.presence.smallImageKey = value ? idleImage : activeImage;
		this.presence.smallImageText = value ? "Idle" : "Active";
		if (doUpdate)
			this.update();
	}

	private presence: Presence = {}

	private debugging = false

	private update() {
		this.client.set(this.presence);
	}
}