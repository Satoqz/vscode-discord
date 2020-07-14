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
				currentRPC.largeImageText = "Tabbed out of VSCode 😮";
				rpc.setActivity(currentRPC);
			}
		}, 1000*60);

		registerVSCodeEvents();
	});
}

function setRPCByFile(document: TextDocument, eventType: EventType) {

	const fileName = resolveFileName(document.fileName);

	let activity: string;
	
	if(fileName == "input") activity = "Managing Source Control";

	// catch whether the file has only been opened ( = viewing) or actually edited ( = editing)
	
	else if(eventType == "fileOpened") activity = `Viewing ${fileName} (${document.languageId})`;

	else activity = `Editing ${fileName} (${document.languageId})`;

	currentRPC = {
		details: activity,
        state: workspace.name ? `Workspace: ${workspace.name}` : "No workspace 😳",
        largeImageKey: "vscode2",
		largeImageText: `${document.lineCount} lines, changes ${document.isDirty ? "unsaved" : "saved"}`,
		smallImageKey: "vscode2",
        smallImageText: "Busy coding 😎",
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