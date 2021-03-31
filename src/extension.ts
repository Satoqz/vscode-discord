import {
	commands,
	ExtensionContext,
	window,
	workspace,
} from "vscode";

import { Client } from "./client";
import { Listener } from "./listener";
import { Parser } from "./parser";

const config = workspace.getConfiguration("RPC");

const client = new Client(config);
const parser = new Parser(client);
const listener = new Listener(parser);

// tracks extension activation status
let active = false;

// internal part of activation that we can use for reconnection
function _activate(): void
{
	client.connect();
	parser.makeInitial();
	listener.listen();
	active = true;
}

export function activate(ctx: ExtensionContext): void
{
	if (config.get<string[]>("ignoreWorkspaces").includes(workspace.name))
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

export function deactivate(): void
{
	client.disconnect();
	listener.dispose();
	active = false;
}

function reconnect(): void
{
	deactivate();
	_activate();
}

if (config.get("checkIdle"))
{
	const timeout = config.get<number>("idleTimeout") * 1000;
	const doDeactivate = config.get<boolean>("disconnectOnIdle");

	window.onDidChangeWindowState(({ focused }) =>
	{
		if (!focused)
			setTimeout(() =>
			{
				if (!window.state.focused)
				{
					if (doDeactivate)
					{
						if (active)
							deactivate();
					}
					else
						parser.idle(true);
				}
			}, timeout);
		else
		{
			if (!active)
				_activate();
			else if (!doDeactivate)
				parser.idle(false);
		}
	});
}
