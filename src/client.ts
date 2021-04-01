import { Client as RPCClient, Presence } from "discord-rpc";
import { StatusBarAlignment, StatusBarItem, window, WorkspaceConfiguration } from "vscode";

export class Client
{

	constructor(public config: WorkspaceConfiguration)
	{}

	public set(options: Presence)
	{
		if (!this.ready)
			this.rpc.once("ready", () => this._set(options));
		else
			this._set(options);
	}

	private _set(options: Presence)
	{
		if (this.rpc)
			this.rpc.setActivity(options).catch(() => this.disconnect());
	}

	public disconnect()
	{
		if (this.rpc)
			this.rpc.destroy();
		this.ready = false;
		this.statusBar.text = "$(radio-tower)";
		this.statusBar.tooltip = "Disconnected from Discord. Click to reconnect.";
		this.statusBar.command = "RPC.reconnect";
	}

	public connect()
	{

		if (!this.statusBar)
			this.statusBar = window.createStatusBarItem(StatusBarAlignment.Left, 100);
		this.statusBar.text = "$(pulse)";
		this.statusBar.tooltip = "RPC Connecting to Discord...";

		if (this.config.get("showStatusBar") == true)
			this.statusBar.show();

		this.rpc = new RPCClient({ transport: "ipc" });
		this.rpc.login({ clientId: this.config.get<string>("clientID") });
		this.rpc.once("ready", () =>
		{
			this.ready = true;
			this.statusBar.text = "$(vm-active)";
			this.statusBar.tooltip = "RPC Connected to Discord";
			this.statusBar.command = null;
		});
	}

	private ready = false

	private rpc: RPCClient

	public statusBar: StatusBarItem
}
