import {
	debug,
	Disposable,
	languages,
	TextDocumentChangeEvent,
	TextEditor,
	window,
	workspace,
	WorkspaceConfiguration,
} from "vscode";

import { Parser } from "./parser";

export class Listener
{

	constructor(private parser: Parser)
	{
		this.config = parser.config;
	}

	public listen()
	{

		// just make sure that no double registration happens
		this.dispose();

		const
			fileSwitch = window.onDidChangeActiveTextEditor,
			fileEdit = workspace.onDidChangeTextDocument,
			debugStart = debug.onDidStartDebugSession,
			debugEnd = debug.onDidTerminateDebugSession,
			diagnostictsChange = languages.onDidChangeDiagnostics;

		if (this.config.get("showFile"))
			this.disposables.push(
				fileSwitch((e: TextEditor) => this.parser.fileSwitch(e)),
				fileEdit((e: TextDocumentChangeEvent) => this.parser.fileEdit(e))
			);

		if (this.config.get("showDebugging"))
			this.disposables.push(
				debugStart(() => this.parser.toggleDebug()),
				debugEnd(() => this.parser.toggleDebug())
			);

		if (this.config.get("showProblems"))
			this.disposables.push(
				diagnostictsChange(() => this.parser.diagnosticsChange())
			);
	}

	private disposables: Disposable[] = []

	private config: WorkspaceConfiguration

	public dispose()
	{
		this.disposables.forEach((disposable: Disposable) =>
			disposable.dispose());
	}
}
