import { Client as RPCClient, Presence } from "discord-rpc";
import { StatusBarAlignment, StatusBarItem, window, WorkspaceConfiguration } from "vscode";

export class Client {

	constructor(private config: WorkspaceConfiguration) {

		const statusBar = window.createStatusBarItem(StatusBarAlignment.Left, 100);
		statusBar.text = "$(vm-connect)";
		statusBar.tooltip = "RPC Connecting to Discord...";

		if (config.get("showStatusBar") == true)
			statusBar.show();

		this.statusBar = statusBar;

		this.connect();
	}

	public set(options: Presence) {
		if (!this.ready)
			this.rpc.once("ready", () => this._set(options));
		else
			this._set(options);
	}

	private _set(options: Presence) {
		if (this.rpc)
			this.rpc.setActivity(options);
	}

	public disconnect() {
		if (this.rpc)
			this.rpc.destroy();
		this.ready = false;
	}

	public connect() {
		this.disconnect();
		this.rpc = new RPCClient({ transport: "ipc" });
		this.rpc.login({ clientId: this.config.get<string>("clientID") });
		this.rpc.once("ready", () => {
			this.ready = true;
			this.statusBar.text = "$(vm-active)";
			this.statusBar.tooltip = "RPC Connected to Discord";
		});
	}

	private ready = false

	private rpc: RPCClient

	public statusBar: StatusBarItem
}