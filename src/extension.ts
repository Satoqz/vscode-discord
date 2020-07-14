//this is horrible, i made it for fun only, okay ????? OKAY !!!!!

import { workspace, TextDocumentChangeEvent, TextDocument, window, debug } from "vscode";
import { Client, register, Presence } from "discord-rpc";
import imageKeys from "./imageKeys.json";

let currentRPC: Presence = {
	details: "Just launched VSCode",
	state: "No file opened yet",
	smallImageKey: "active",
	smallImageText: "Active in VSCode",
    largeImageKey: "vscode",
	largeImageText: "What will he code?!? 😳",
};

let startTimestamp: Date;

const clientId = "732565262704050298";

const rpc = new Client({ transport: "ipc" });

type EventType = "fileOpened" | "fileEdited";

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
		rpc.setActivity(currentRPC);

		// refresh presence every minute to catch unfocusing the window
		setInterval(() => {
			if(!window.state.focused) {
				currentRPC.smallImageText = "Tabbed out of VSCode 😮";
				currentRPC.smallImageKey = "inactive"
				rpc.setActivity(currentRPC);
			}
		}, 1000*60);

		registerVSCodeEvents();
	});
}

function setRPCByFile(document: TextDocument, eventType: EventType) {

	const fileName = resolveFileName(document.fileName);

	// determine activity verb
	let activity: string;
	if(debug.activeDebugSession) activity = "Debugging";

	// catch whether the file has only been opened ( = viewing) or actually edited ( = editing)
	else if(eventType == "fileOpened") activity = "Viewing";
	else activity = "Editing";

	let fullActivity: string; 

	if(fileName == "input") activity = "managing source control";
	
	else fullActivity = `${activity} ${fileName} | ${document.lineCount} line${document.lineCount == 1 ? "" : "s"}`

	const image = imageKeys.find(i => i.matches.includes(document.languageId));

	currentRPC = {

		details: fullActivity,

		// catch missing workspace
		state: workspace.name ? `in ${workspace.name}` : "No workspace 😳",

		// fallback to standard icon if no language-specific image was found
		largeImageKey: image ? image.key : "vscode",

		// if there are unsaved changes, add it behind the comma
		largeImageText: `${document.languageId} file${document.isDirty ? ", unsaved changes" : ""}`,
		smallImageKey: "active",

		// other option would be "tabbed out"
		smallImageText: "Active in VSCode",
		
		instance: true,
		startTimestamp
	};
	rpc.setActivity(currentRPC);
}

export function registerVSCodeEvents() {

	workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => setRPCByFile(e.document, "fileEdited"));
	
	workspace.onDidOpenTextDocument((document: TextDocument) => {

		// git extension will always log a file open a second time as plaintext and with ".git" attached, we don't want to display these
		if(document.fileName.endsWith(".git") || document.languageId == "plaintext") return;

		// reset timestamp because new file has been opened
		startTimestamp = new Date();

		setRPCByFile(document, "fileOpened");
	});
}

// will remove the path and leave the actual filename
const resolveFileName = (file: string): string | undefined => file.split("\\").pop();