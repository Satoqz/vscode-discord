import { Client as RPCClient, Presence } from "discord-rpc";
import { StatusBarAlignment, StatusBarItem, window, WorkspaceConfiguration } from "vscode";

export class Client {

	constructor(config: WorkspaceConfiguration) {

		const statusBar = window.createStatusBarItem(StatusBarAlignment.Left, 100);
		statusBar.text = "$(vm-connect)";
		statusBar.tooltip = "RPC Connecting to Discord...";

		if (config.get("showStatusBar") == true)
			statusBar.show();

		this.rpc.login({ clientId: config.get<string>("clientID") });

		this.rpc.once("ready", () => {
			this.ready = true;
			statusBar.text = "$(vm-active)";
			statusBar.tooltip = "RPC Connected to Discord";
		});

		this.statusBar = statusBar;
	}

	public async set(options: Presence) {
		if (!this.ready)
			this.rpc.once("ready", () => this._set(options));
		else
			this._set(options);
	}

	private _set(options: Presence) {
		this.rpc.setActivity(options);
	}

	private ready = false

	private rpc = new RPCClient({ transport: "ipc" })

	public statusBar: StatusBarItem
}