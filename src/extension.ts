//this is horrible, i made it for fun only, okay ????? OKAY !!!!!

import { workspace, TextDocumentChangeEvent, TextDocument, window } from "vscode";
import { Client, register, Presence } from "discord-rpc";

let currentRPC: Presence = {
	details: "Just launched VSCode",
    state: "No file opened yet",
    largeImageKey: "vscode2",
	largeImageText: "What will he code?!? 😳",
};

let startTimestamp: Date;

const clientId = "732565262704050298";

const rpc = new Client({ transport: "ipc" });

export function activate() {

	activateRPC();

}

function activateRPC() {
	console.log("called");
	register(clientId);

	rpc.login({ clientId }).catch(console.error);

	rpc.on("ready", () => {
		console.log("rpc activated");
		startTimestamp = new Date();
		rpc.setActivity(currentRPC);
		setInterval(() => {
			if(!window.state.focused) currentRPC.largeImageText = "Tabbed out of VSCode 😮";
			rpc.setActivity(currentRPC);
		}, 1000*60);
		registerVSCodeEvents();
	})
}

function setRPC(line1: string, line2: string, hoverLarge: string, imageLarge: string, hoverSmall: string, imageSmall: string, startTimestamp: Date) {
	currentRPC = {
		details: line1,
        state: line2,
        largeImageKey: imageLarge,
		largeImageText: hoverLarge,
		smallImageKey: imageSmall,
        smallImageText: hoverSmall,
		instance: true,
		startTimestamp
	};
	console.log("rpc config updated");
	rpc.setActivity(currentRPC);
}

export function registerVSCodeEvents() {

	workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
		const fileName = resolveFileName(e.document.fileName);
		let activity: string;
		if(fileName == "input") activity = "Managing Source Control";
		else activity = `Editing ${fileName} (${e.document.languageId})`;
		setRPC(
			activity,
			workspace.name ? `Workspace: ${workspace.name}` : "No workspace 😳",
			"Busy using VSCode",
			"vscode2",
			`${e.document.lineCount} lines, changes ${e.document.isDirty ? "unsaved" : "saved"}`,
			"vscode2",
			startTimestamp
		);
	});
	workspace.onDidOpenTextDocument((document: TextDocument) => {
		console.log("document opened");
		if(document.fileName.endsWith(".git")) return;
		startTimestamp = new Date();
		const fileName = resolveFileName(document.fileName);
		let activity: string;
		if(fileName == "input") activity = "Managing Source Control";
		else activity = `Viewing ${fileName} (${document.languageId})`;
		setRPC(
			activity,
			workspace.name ? `Workspace: ${workspace.name}` : "No workspace 😳",
			"Busy using VSCode",
			"vscode2",
			`${document.lineCount} lines, changes ${document.isDirty ? "unsaved" : "saved"}`,
			"vscode2",
			startTimestamp
		);
	});

	console.log("events registered");
}

const resolveFileName = (file: string): string | undefined => file.split("\\").pop()?.replace("git", "");