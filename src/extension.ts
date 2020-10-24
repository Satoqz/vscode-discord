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

const config = workspace.getConfiguration("RPC");

const client = new Client(config);
const parser = new Parser(client);
const listener = new Listener(parser);

export default class Extension
{
	public static activate(ctx: ExtensionContext)
	{
		if (testRegexArray(workspace.name, config.get<string[]>("ignoreWorkspaces")))
			return;

		Extension._activate();

		ctx.subscriptions.push(
			client.statusBar,
			commands.registerCommand(
				"RPC.reconnect",
				Extension.reconnect
			),
			commands.registerCommand(
				"RPC.disconnect",
				Extension.deactivate
			)
		);
	}

	// just a small part of activation that we can use for reconnection
	public static _activate()
	{
		client.connect();
		parser.makeInitial();
		listener.listen();
		Extension.active = true;
	}

	public static deactivate()
	{
		client.disconnect();
		listener.dispose();
		Extension.active = false;
	}

	public static reconnect()
	{
		Extension.deactivate();
		Extension._activate();
	}

	public static active = false
}

if (config.get<boolean>("checkIdle") === true)
{
	const timeout = config.get<number>("idleTimeout") * 1000;
	const doDeactivate = config.get<boolean>("disconnectOnIdle");
	
	window.onDidChangeWindowState(({ focused }) => {
		if (!focused)
			setTimeout(() => {
				if (!window.state.focused)
				{
					if (doDeactivate)
					{
						if (Extension.active)
							Extension.deactivate();
					}
					else
						parser.idle(true);
				}
			}, timeout);
		else
		{
			if (!Extension.active)
				Extension._activate();
			else if (!doDeactivate)
				parser.idle(false);
		}
	});
}