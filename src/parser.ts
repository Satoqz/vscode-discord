import { Presence } from "discord-rpc";
import {
	DiagnosticSeverity,
	languages,
	TextDocument,
	TextDocumentChangeEvent,
	TextEditor,
	window,
	workspace,
	WorkspaceConfiguration,
	env
} from "vscode";

import type { Client } from "./client";
import { resolveFileName, resolveIcon } from "./util";

const enum activity {
	debugging = "debuggingText",
	editing = "editingText",
	viewing = "viewingText"
}

const isInsiders = env.appName.toLowerCase().includes("insiders");

const vsicon = isInsiders
	? "insiders"
	: "vscode";

const placeholderKey = isInsiders
	? "placeholderTextInsiders"
	: "placeholderText";

const enum icons {
	other = "text",
	idle = "inactive"
}

export class Parser
{

	constructor(private client: Client)
	{
		this.config = client.config;
	}

	public makeInitial()
	{
		if (this.config.get("showTime"))
			this.presence.startTimestamp = Date.now();

		const placeholder = this.config.get<string>(placeholderKey);
		this.presence.largeImageKey = vsicon;
		this.presence.largeImageText = placeholder;
		this.presence.smallImageKey = vsicon;
		this.presence.smallImageText = placeholder;

		if (
			this.config.get("showWorkspace")
			&& !this.config.get<string[]>("hideWorkspaces").includes(workspace.name)
		)
			this.presence.state = workspace.name
				? this.config.get<string>("workspaceText").replace(/{workspace}/g, workspace.name)
				: "No workspace";

		this.update();
	}

	private makeActivity(type: activity, path: string)
	{
		if (this.debugging)
			type = activity.debugging;
		const file = resolveFileName(path);
		const excludeFile = this.config.get<string[]>("hideFiles").includes(file);
		const activityString = this.config.get<string>(type).replace(/{file}/g, excludeFile ? "a file" : file);
		const problemString = this.config.get("showProblems")
			? this.config.get<string>("problemsText").replace(/{count}/g, this.problems.toString())
			: "";
		return `${activityString} ${problemString}`;
	}

	private makeFileInfo(document: TextDocument)
	{
		const linecount = document.lineCount;
		const currentline = window.activeTextEditor.selection.active.line + 1 > linecount
			? linecount
			: window.activeTextEditor.selection.active.line + 1;
		return this.config.get<string>("fileInfoText")
			.replace(/{linecount}/g, linecount.toString())
			.replace(/{currentline}/g, currentline.toString())
			.replace(/{language}/g, document.languageId);
	}

	public fileSwitch(editor: TextEditor)
	{
		if (editor)
		{
			this.presence.largeImageKey = resolveIcon(editor.document);
			this.presence.details = this.makeActivity(activity.viewing, editor.document.fileName);
			if (this.config.get("showFileInfo"))
				this.presence.largeImageText = this.makeFileInfo(editor.document);
		}
		else
		{
			this.presence.largeImageKey = vsicon;
			this.presence.details = undefined;
			this.presence.largeImageText = this.config.get(placeholderKey);
		}
		this.update();
	}

	public fileEdit({ document }: TextDocumentChangeEvent)
	{
		if (
			document.fileName.endsWith(".git")
			|| document.languageId == "scminput"
		)
			return;

		this.presence.largeImageKey = resolveIcon(document);
		this.presence.details = this.makeActivity(activity.editing, document.fileName);
		if (this.config.get("showFileInfo"))
			this.presence.largeImageText = this.makeFileInfo(document);
		this.update();
	}

	public toggleDebug()
	{
		this.debugging = !this.debugging;
	}

	public diagnosticsChange()
	{
		const diag = languages.getDiagnostics();
		let counted: number = 0;
		diag.forEach(i =>
		{
			if (i[1])
				i[1].forEach(i =>
				{
					if (
						i.severity == DiagnosticSeverity.Warning
						|| i.severity == DiagnosticSeverity.Error
					) counted++;
				});
		});
		this.problems = counted;
	}

	public idle(value: boolean)
	{
		this.presence.smallImageKey = value
			? icons.idle
			: vsicon;
		this.presence.smallImageText = value
			? this.config.get("idleText")
			: this.config.get(placeholderKey);
		this.update();
	}

	private update()
	{
		this.client.set(this.presence);
	}

	private debugging = false

	private problems = 0

	private presence: Presence = {}

	public config: WorkspaceConfiguration

}
