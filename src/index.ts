import {
	debug,
	DiagnosticChangeEvent,
	ExtensionContext,
	languages,
	TextDocumentChangeEvent,
	TextEditor,
	window,
	workspace,
	WorkspaceConfiguration
} from "vscode";

import { Client } from "./client";
import { Parser } from "./parser";
import { testRegexArray } from "./util";

export function activate(ctx: ExtensionContext) {

	const config = workspace.getConfiguration("rpc");

	if (testRegexArray(workspace.name, config.get<string[]>("ignoreWorkspaces")))
		return;

	const client = new Client(config);
	const parser = new Parser(config, client);

	listen(parser, config);

	if (config.get("showIdle") === true)
		checkActivity(parser, config.get<number>("checkIdleInterval") * 1000);

	ctx.subscriptions.push(client.statusBar);
}

function listen(parser: Parser, config: WorkspaceConfiguration) {

	const
		fileSwitch = window.onDidChangeActiveTextEditor,
		fileEdit = workspace.onDidChangeTextDocument,
		debugStart = debug.onDidStartDebugSession,
		debugEnd = debug.onDidTerminateDebugSession,
		diagnostictsChange = languages.onDidChangeDiagnostics;

	fileSwitch((e: TextEditor) => parser.fileSwitch(e));

	fileEdit((e: TextDocumentChangeEvent) => parser.fileEdit(e));

	if (config.get("showDebugging") === true) {
		debugStart(() => parser.toggleDebug());
		debugEnd(() => parser.toggleDebug());
	}

	if (config.get("showProblems") === true)
		diagnostictsChange((e: DiagnosticChangeEvent) => parser.diagnosticsChange(e));
}

function checkActivity(parser: Parser, interval: number) {
	const timeout = setInterval(() => {
		if (window.state.focused) {
			parser.idle(false, true);
			timeout.refresh();
		} else
			parser.idle(true, true);
	}, interval);
}