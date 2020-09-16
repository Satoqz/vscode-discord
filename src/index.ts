import {
	commands,
	ExtensionContext,
	window,
	workspace,
} from "vscode";

import { Client } from "./client";
import { Listener } from "./listener";
import { Parser } from "./parser";
import { testRegexArray } from "./util";

let timeout: NodeJS.Timeout;

const config = workspace.getConfiguration("RPC");

const client = new Client(config);
const parser = new Parser(client);
const listener = new Listener(parser);

export function activate(ctx: ExtensionContext)
{

	if (testRegexArray(workspace.name, config.get<string[]>("ignoreWorkspaces")))
		return;

	_activate();

	ctx.subscriptions.push(
		client.statusBar,
		commands.registerCommand(
			"RPC.reconnect",
			reconnect
		),
		commands.registerCommand(
			"RPC.disconnect",
			deactivate
		)
	);
}

function _activate()
{
	client.connect();
	parser.makeInitial();
	listener.listen();

	if (config.get("showIdle") === true)
		checkActivity(parser, config.get<number>("checkIdleInterval") * 1000);
}

export function deactivate()
{
	clearInterval(timeout);
	client.disconnect();
	listener.dispose();
}

function reconnect()
{
	deactivate();
	_activate();
}

function checkActivity(parser: Parser, interval: number)
{
	timeout = setInterval(() =>
	{
		if (window.state.focused)
		{
			parser.idle(false, true);
			timeout.refresh();
		}
		else
			parser.idle(true, true);
	}, interval);
}