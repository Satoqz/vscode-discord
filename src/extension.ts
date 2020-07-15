//this is horrible, i made it for fun only, okay ????? OKAY !!!!!
import * as vscode from "vscode"
import { workspace, TextDocumentChangeEvent, TextDocument, window, debug } from "vscode";
import { Client, register, Presence } from "discord-rpc";
import { imageKeys } from "./imageKeys";

const rpcData: Presence = {
	details: "Just launched",
	state: "No file edited yet",
	smallImageKey: "active",
	smallImageText: "Active in VSCode",
    largeImageKey: "vscode",
	largeImageText: "What will he code?!? 😳",
	instance: true
};

let startTimestamp: Date;

const clientId = "732565262704050298";

const rpc = new Client({ transport: "ipc" });

export function activate() {

	activateRPC();

}

function activateRPC() {

	// connect to discord
	register(clientId);

	rpc.login({ clientId }).catch(console.error);

	// once connected, start sending rich presence requests and listening to the vscode api
	rpc.on("ready", () => {

		// set "vscode just launched" presence
		startTimestamp = new Date();
		setRPC();

		// refresh presence every minute to catch unfocusing the window
		setInterval(() => {

			rpcData.smallImageText = `${window.state.focused ? "Active" : "Inactive"} in VSCode`;
			rpcData.smallImageKey = window.state.focused ? "active" : "inactive";
			setRPC();

		}, 1000*60);

		registerVSCodeEvents();
	});
}

function registerVSCodeEvents() {

	workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {

	const fileName = resolveFileName(e.document.fileName);

	// determine activity verb
	let activity: string;
	if(debug.activeDebugSession) activity = "Debugging";
	else activity = "Editing";

	let fullActivity: string; 

	if(fileName == "input") fullActivity = "managing source control";
	
	else fullActivity = `${activity} ${fileName}`;

	const image = imageKeys.find(i => i.matches.includes(e.document.languageId));

	// fallback to standard icon if no language-specific image was found
	rpcData.largeImageKey = image ? image.key : "vscode";

	// catch missing workspace
	rpcData.state = workspace.name ? `in ${workspace.name}` : "No workspace 😳";
	
	// if there are unsaved changes, add it behind the comma
	rpcData.largeImageText = `${e.document.languageId} file, 
	on line ${window.activeTextEditor.selection.active.line + 1}/${e.document.lineCount}
	${e.document.isDirty ? ", unsaved changes" : ""}`;

	rpcData.smallImageKey = "active";
	rpcData.smallImageText = "Active in VSCode";
	rpcData.startTimestamp = startTimestamp;
	rpcData.details = fullActivity;

	setRPC();

	});
}

function setRPC() {
	if(true) rpc.setActivity(rpcData);
}

// will remove the path and leave the actual filename
const resolveFileName = (file: string): string | undefined => file.split("\\").pop();